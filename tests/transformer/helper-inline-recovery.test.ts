/**
 * helper-inline-recovery integration test (TXDX-2)
 *
 * 仕様: `.kiro/specs/helper-inline-recovery/design.md`
 *
 * Fixtures:
 *   (a) helper + each-外 → 通常通り書き換え成功 (DT014 なし)
 *   (c) ambiguous (混在: each内 + each外) → 現実装挙動を documentation
 *   (d) 同一ファイル内で DT014 (let helper) と正常 .on 共存 → 正常側 rewrite
 *   (e) baseline: top-level .on 後退ゼロ
 *
 * NOTE: helper recovery は symbol identity 比較を行うため、`ts.transpileModule`
 *       経由（内部で別 program を作成）では機能しない。本テストは `ts.transform`
 *       にユーザ program の SourceFile を渡す経路で実行する。
 *
 * Task 4.1 (TXDX follow-up): case (b) `.each(item => helper())` での
 * each scope 継承の end-to-end 検証を追加 (design.md §System Flows F 経路)。
 * 実装は task 3.x で完了済のため、本テストは regression-protection として機能する。
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import draftoleTransformer from '../../src/transformer/index.ts';

const STATE_TYPE_DEFS = `
declare const DraftoleStateMarker: unique symbol;
interface ReadableState<T> {
  readonly [DraftoleStateMarker]: "state";
  readonly _runtimeId: string;
  get(): T;
}
interface WritableState<T> extends ReadableState<T> {
  set(value: T): void;
}
`;

interface TransformOutcome {
  outputCode: string;
  diagnostics: ts.Diagnostic[];
}

/**
 * ユーザ program と同一の SourceFile を `ts.transform` に渡し、
 * transformer が出力した SourceFile を Printer で文字列化して返す。
 */
function runTransformer(snippet: string): TransformOutcome {
  const fileName = 'test.ts';
  const fullSource = `${STATE_TYPE_DEFS}\n${snippet}`;
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    strict: false,
    noEmit: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const origGetSourceFile = host.getSourceFile.bind(host);
  let cachedSf: ts.SourceFile | undefined;
  host.getSourceFile = (name, langVer): ts.SourceFile | undefined => {
    if (name === fileName || name.endsWith(fileName)) {
      if (cachedSf === undefined) {
        cachedSf = ts.createSourceFile(name, fullSource, langVer, true);
      }
      return cachedSf;
    }
    return origGetSourceFile(name, langVer);
  };
  host.fileExists = (name): boolean =>
    name === fileName || name.endsWith(fileName) || ts.sys.fileExists(name);
  host.readFile = (name): string | undefined =>
    name === fileName || name.endsWith(fileName) ? fullSource : ts.sys.readFile(name);

  const program = ts.createProgram([fileName], compilerOptions, host);
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) throw new Error('source file not found');

  const collected: ts.Diagnostic[] = [];
  const transformerFactory = draftoleTransformer(program, {
    onDiagnostics: (diags) => {
      collected.push(...diags);
    },
  });
  const result = ts.transform<ts.SourceFile>([sourceFile], [transformerFactory]);
  const transformed = result.transformed[0];
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const outputCode = printer.printFile(transformed);
  result.dispose();

  return { outputCode, diagnostics: collected };
}

describe('TXDX-2: helper-inline-recovery integration', () => {
  it('(a) helper + each-外 → 通常通り書き換え成功 (DT014 なし)', () => {
    const source = `
declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
const renderBtn = () => el.on("click", () => count.set(count.get() + 1));
renderBtn();
`;
    const { outputCode, diagnostics } = runTransformer(source);

    const dt014 = diagnostics.filter((d) => d.code === 9014);
    expect(dt014.length, `unexpected DT014: ${dt014.map(toMsg).join('; ')}`).toBe(0);

    // 通常の rewrite が発生している
    expect(outputCode).toContain('_emitHandlerBody');
    expect(outputCode).toContain('count-id');
  });

  it('(b) `.each(item => helper())` で helper body 内 `item.set(...)` が __draftole__.state(item) に rewrite される (DT014 なし)', () => {
    // helper は無引数。helper body 内の `item` は closure 経由で
    // call-site の `.each((item) => helper())` の param Symbol に解決される。
    // helper-aware paramSymbols 伝播 (task 3.x) が動作することで、各 `item.xxx`
    // 参照が `__draftole__.state(item).xxx` に rewrite される。
    const source = `
declare const items: { each(fn: (item: WritableState<number>) => void): void };
declare const helperEl: { on(event: string, handler: ((e: MouseEvent) => void)): void };
declare let item: WritableState<number>;
const renderItem = () =>
  helperEl.on("click", () => item.set(item.get() + 1));
items.each((item) => renderItem());
`;
    const { outputCode, diagnostics } = runTransformer(source);

    const dt014 = diagnostics.filter((d) => d.code === 9014);
    expect(dt014.length, `unexpected DT014: ${dt014.map(toMsg).join('; ')}`).toBe(0);

    // helper body 内の `item.set(...)` / `item.get()` が __draftole__.state(itemId) 経由に rewrite される
    // (paramVar 名は handler-serializer で `itemId` に renaming される)
    expect(outputCode).toContain('_emitHandlerBody');
    expect(outputCode).toContain('__draftole__.state(itemId).set(');
    expect(outputCode).toContain('__draftole__.state(itemId).get()');
    // serialize された handler body 文字列リテラル内に bare `item.set(` が残らないこと
    // (helper-aware rewrite が正しく到達した証跡)
    expect(outputCode).not.toMatch(/"[^"]*\bitem\.set\(/);
  });

  it('(d) 同一ファイル内で DT014 (let helper) と正常 .on 共存 → 正常側 rewrite', () => {
    const source = `
declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const total: WritableState<number> & { readonly _runtimeId: "total-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
// let → DT014 (mutable-binding)
let badHelper = () => el.on("click", () => count.set(0));
badHelper();
// 通常パターン (helper 経由でない top-level)
el.on("click", () => total.set(total.get() + 1));
`;
    const { outputCode, diagnostics } = runTransformer(source);

    const dt014 = diagnostics.filter((d) => d.code === 9014);
    expect(dt014.length, `expected DT014 emission: ${diagnostics.map(toMsg).join('; ')}`)
      .toBeGreaterThanOrEqual(1);
    expect(dt014[0].source).toBe('draftole-transformer');
    expect(toMsg(dt014[0])).toContain('mutable-binding');

    // 正常な top-level `.on` は書き換えられる (DT014 は hasFileError 除外)
    expect(outputCode).toContain('_emitHandlerBody');
    expect(outputCode).toContain('total-id');
  });

  it('(e) baseline: helper を使わない top-level `.on` で後退ゼロ', () => {
    const source = `
declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
el.on("click", () => count.set(count.get() + 1));
`;
    const { outputCode, diagnostics } = runTransformer(source);

    expect(diagnostics.filter((d) => d.code === 9014).length).toBe(0);
    expect(outputCode).toContain('_emitHandlerBody');
    expect(outputCode).toContain('count-id');
  });

  it('(f) function declaration helper → DT014 function-declaration', () => {
    const source = `
declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
function badHelper() {
  el.on("click", () => count.set(0));
}
badHelper();
`;
    const { diagnostics } = runTransformer(source);
    const dt014 = diagnostics.filter((d) => d.code === 9014);
    expect(dt014.length).toBeGreaterThanOrEqual(1);
    expect(toMsg(dt014[0])).toContain('function-declaration');
  });

  it('(g) helper with parameters → DT014 has-parameters', () => {
    const source = `
declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
const badHelper = (x: number) => el.on("click", () => count.set(x));
badHelper(1);
`;
    const { diagnostics } = runTransformer(source);
    const dt014 = diagnostics.filter((d) => d.code === 9014);
    expect(dt014.length).toBeGreaterThanOrEqual(1);
    expect(toMsg(dt014[0])).toContain('has-parameters');
  });

  // ---- Task 2.2: DT014 ambiguous-call-sites ---------------------------------

  it('(c) call-site が .each 内外で混在 → DT014 ambiguous-call-sites', () => {
    const source = `
declare const items: { each(fn: (item: WritableState<number>) => void): void };
declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
const helper = () => el.on("click", () => count.set(0));
items.each((item) => helper());
helper();
`;
    const { diagnostics } = runTransformer(source);
    const dt014 = diagnostics.filter((d) => d.code === 9014);
    expect(
      dt014.length,
      `expected DT014 ambiguous-call-sites: ${diagnostics.map(toMsg).join('; ')}`,
    ).toBeGreaterThanOrEqual(1);
    const ambiguous = dt014.find((d) => toMsg(d).includes('ambiguous-call-sites'));
    expect(ambiguous, `expected ambiguous-call-sites reason in: ${dt014.map(toMsg).join('; ')}`)
      .toBeDefined();
  });

  it('(c2) 異 itemParamName で helper を複数 .each から呼ぶ → DT014 ambiguous-call-sites', () => {
    const source = `
declare const items: { each(fn: (a: WritableState<number>) => void): void };
declare const others: { each(fn: (b: WritableState<number>) => void): void };
declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
const helper = () => el.on("click", () => count.set(0));
items.each((a) => helper());
others.each((b) => helper());
`;
    const { diagnostics } = runTransformer(source);
    const dt014 = diagnostics.filter((d) => d.code === 9014);
    const ambiguous = dt014.find((d) => toMsg(d).includes('ambiguous-call-sites'));
    expect(
      ambiguous,
      `expected DT014 ambiguous-call-sites: ${diagnostics.map(toMsg).join('; ')}`,
    ).toBeDefined();
  });

  it('(c3) 対照: 全 call-site が .each 外 → DT014 ambiguous-call-sites は出ない', () => {
    const source = `
declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
const helper = () => el.on("click", () => count.set(0));
helper();
helper();
`;
    const { diagnostics } = runTransformer(source);
    const dt014 = diagnostics.filter((d) => d.code === 9014);
    const ambiguous = dt014.find((d) => toMsg(d).includes('ambiguous-call-sites'));
    expect(ambiguous, `unexpected DT014 ambiguous-call-sites: ${dt014.map(toMsg).join('; ')}`)
      .toBeUndefined();
  });
});

function toMsg(d: ts.Diagnostic): string {
  return typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
}
