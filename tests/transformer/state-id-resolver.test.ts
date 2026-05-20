/**
 * Task 4.2: state-id-resolver.ts — canonical 経路のみの純化テスト
 *
 * テストケース（design.md「テスト戦略」TC-A〜TC-D3 相当）:
 *   TC-A:  型リテラル `_runtimeId: "id"` を持つ State が fallback 未注入で
 *          stateIdMap に登録される（canonical のみで解決）
 *   TC-B:  型リテラル不在 + fallback 未注入の State 識別子が `unresolved` に追加される
 *   TC-C:  PropertyAccessExpression 右辺（プロパティ名）はスキップされる
 *   TC-D:  State でない識別子は stateIdMap にも unresolved にも含まれない
 *   TC-D2: 同一 Symbol の複数参照が `unresolved` で 1 エントリに集約される
 *   TC-D3: `eachScopeParamSymbols` に含まれる Symbol は `unresolved` に積まれない
 *
 * フォールバック挙動の検証は state-id-fallback.test.ts に分離（Task 4.1）。
 * 本ファイルは fallback 未注入時の canonical 経路と unresolved 計上規則のみを扱う。
 *
 * 対応 requirements: 1.1, 4.1, 5.1, 6.1, 6.2
 *
 * @boundary tests/transformer/state-id-resolver
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { createSourceStateNameFallback } from '../../src/transformer/state-id-fallback.ts';
import {
  buildStateIdMap,
  buildStateIdMapWithInlining,
  resolveStateIdByType,
} from '../../src/transformer/state-id-resolver.ts';

// ---- テスト用ユーティリティ -------------------------------------------------

/**
 * 仮想ファイルシステムを含む ts.Program を生成するヘルパー。
 */
function createProgramWithFiles(
  files: Record<string, string>,
): {
  program: ts.Program;
  sourceFiles: Map<string, ts.SourceFile>;
} {
  const fileNames = Object.keys(files);
  const sourceFilesMap = new Map<string, ts.SourceFile>();

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    strict: true,
    noEmit: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (fileName, languageVersion): ts.SourceFile | undefined => {
    const shortName = Object.keys(files).find(
      (k) => fileName.endsWith(k) || fileName === k,
    );
    if (shortName !== undefined) {
      const sf = ts.createSourceFile(
        fileName,
        files[shortName],
        languageVersion,
        /* setParentNodes */ true,
      );
      sourceFilesMap.set(shortName, sf);
      return sf;
    }
    return originalGetSourceFile(fileName, languageVersion);
  };

  host.fileExists = (fileName): boolean => {
    return (
      fileNames.some((k) => fileName.endsWith(k) || fileName === k) ||
      ts.sys.fileExists(fileName)
    );
  };

  host.readFile = (fileName): string | undefined => {
    const shortName = Object.keys(files).find(
      (k) => fileName.endsWith(k) || fileName === k,
    );
    if (shortName !== undefined) return files[shortName];
    return ts.sys.readFile(fileName);
  };

  const program = ts.createProgram(fileNames, compilerOptions, host);

  for (const fileName of fileNames) {
    if (!sourceFilesMap.has(fileName)) {
      const sf = program.getSourceFile(fileName);
      if (sf !== undefined) sourceFilesMap.set(fileName, sf);
    }
  }

  return { program, sourceFiles: sourceFilesMap };
}

/**
 * State/Computed 型の最小定義。
 * `_runtimeId` を汎用 string 型で宣言するため、canonical 経路（resolveStateIdByType）は
 * null を返す。文字列リテラル型のオーバーライドが必要なテストでは intersection を使う。
 */
const STATE_TYPE_DEFS = `
declare const DraftoleStateMarker: unique symbol;

interface ReadableState<T> {
  readonly [DraftoleStateMarker]: "state";
  readonly _runtimeId: string;
  get(): T;
  map<U>(fn: (t: T) => U): Computed<U>;
  field<K extends keyof T>(key: K): T extends object ? Computed<T[K]> : never;
}

interface WritableState<T> extends ReadableState<T> {
  set(value: T): void;
  update(fn: (prev: T) => T): void;
  field<K extends keyof T>(key: K): T extends object ? WritableState<T[K]> : never;
}

interface Computed<T> extends ReadableState<T> {}
`;

/**
 * SourceFile 内の el.on() ハンドラ（ブロック本体を持つアロー関数）を探す。
 */
function findEventHandlerArrowFunction(sourceFile: ts.SourceFile): ts.ArrowFunction {
  let blockBodyArrow: ts.ArrowFunction | undefined;
  let firstArrow: ts.ArrowFunction | undefined;

  function visit(node: ts.Node): void {
    if (ts.isArrowFunction(node)) {
      if (firstArrow === undefined) firstArrow = node;
      if (blockBodyArrow === undefined && ts.isBlock(node.body)) {
        blockBodyArrow = node;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  const found = blockBodyArrow ?? firstArrow;
  if (found === undefined) throw new Error('ArrowFunction が見つかりません');
  return found;
}

const TEST_TIMEOUT_MS = 30_000;

// ---- TC-A: canonical 単独解決 ---------------------------------------------

describe('buildStateIdMap - canonical (型リテラル) 単独解決', () => {
  /**
   * TC-A: `_runtimeId` が文字列リテラル型の State は fallback 未注入で
   * stateIdMap に登録される（canonical 経路のみで解決成立）。
   */
  it('TC-A: 型リテラル _runtimeId を持つ State が fallback 未注入で stateIdMap に登録される', () => {
    const source = `
${STATE_TYPE_DEFS}

declare function state<T>(initial: T): WritableState<T>;

const count: WritableState<number> & { readonly _runtimeId: "count-id" } = state(0) as any;

declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { count.set(count.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({ 'app.ts': source });
    const sourceFile = sourceFiles.get('app.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const checker = program.getTypeChecker();
    const arrowFn = findEventHandlerArrowFunction(sourceFile);

    // fallback 未注入で呼び出す（canonical のみで解決される想定）
    const { stateIdMap, unresolved } = buildStateIdMap(arrowFn, checker);

    const countEntry = [...stateIdMap.entries()].find(
      ([sym]) => sym.getName() === 'count',
    );
    if (countEntry === undefined) throw new Error('count entry not found in stateIdMap');
    expect(countEntry[1]).toBe('count-id');

    // unresolved には何も積まれない
    expect(unresolved.size).toBe(0);

    // resolveStateIdByType 単独でも "count-id" を返すこと
    let countIdent: ts.Identifier | undefined;
    function findCountIdent(node: ts.Node): void {
      if (ts.isIdentifier(node) && node.text === 'count') {
        const parent = node.parent;
        if (!(ts.isPropertyAccessExpression(parent) && parent.name === node)) {
          countIdent = countIdent ?? node;
        }
      }
      ts.forEachChild(node, findCountIdent);
    }
    findCountIdent(arrowFn.body);
    if (countIdent === undefined) throw new Error('count identifier not found');
    expect(resolveStateIdByType(countIdent, checker)).toBe('count-id');
  }, TEST_TIMEOUT_MS);
});

// ---- TC-B: canonical 解決失敗時の unresolved 計上 -------------------------

describe('buildStateIdMap - canonical 解決失敗時の unresolved 計上', () => {
  /**
   * TC-B: 型リテラル不在（汎用 string 型の `_runtimeId`）で fallback 未注入の場合、
   * State 型の識別子は `unresolved` に追加される。
   */
  it('TC-B: 型リテラル不在 + fallback 未注入の State 識別子が unresolved に追加される', () => {
    const source = `
${STATE_TYPE_DEFS}

declare function state<T>(initial: T): WritableState<T>;

const count = state(0);

declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { count.set(count.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({ 'app.ts': source });
    const sourceFile = sourceFiles.get('app.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const checker = program.getTypeChecker();
    const arrowFn = findEventHandlerArrowFunction(sourceFile);

    const { stateIdMap, unresolved } = buildStateIdMap(arrowFn, checker);

    // canonical のみでは解決できない
    const countEntry = [...stateIdMap.entries()].find(
      ([sym]) => sym.getName() === 'count',
    );
    expect(countEntry).toBeUndefined();

    // unresolved に count Symbol が積まれる
    const unresolvedNames = [...unresolved.keys()].map((sym) => sym.getName());
    expect(unresolvedNames).toContain('count');
    expect(unresolved.size).toBe(1);

    // 代表ノードは Identifier で text が "count"
    const repEntry = [...unresolved.entries()].find(
      ([sym]) => sym.getName() === 'count',
    );
    if (repEntry === undefined) throw new Error('count entry not found in unresolved');
    const [, repNode] = repEntry;
    expect(ts.isIdentifier(repNode)).toBe(true);
    expect(repNode.text).toBe('count');
  }, TEST_TIMEOUT_MS);
});

// ---- TC-C: PropertyAccessExpression 右辺のスキップ -----------------------

describe('buildStateIdMap - PropertyAccessExpression 右辺のスキップ', () => {
  /**
   * TC-C: `count.set` や `count.get` のような PropertyAccessExpression の
   * `.name` 側（右辺の `set` / `get`）は識別子走査でスキップされる。
   * よって `set` / `get` などのプロパティ名が unresolved に積まれることはない。
   */
  it('TC-C: PropertyAccessExpression 右辺（プロパティ名）は走査でスキップされる', () => {
    const source = `
${STATE_TYPE_DEFS}

declare function state<T>(initial: T): WritableState<T>;

const count: WritableState<number> & { readonly _runtimeId: "count-id" } = state(0) as any;

declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { count.set(count.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({ 'app.ts': source });
    const sourceFile = sourceFiles.get('app.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const checker = program.getTypeChecker();
    const arrowFn = findEventHandlerArrowFunction(sourceFile);

    const { stateIdMap, unresolved } = buildStateIdMap(arrowFn, checker);

    // stateIdMap には `set`, `get` などのプロパティ名 Symbol が含まれない
    const namesInMap = [...stateIdMap.keys()].map((sym) => sym.getName());
    expect(namesInMap).not.toContain('set');
    expect(namesInMap).not.toContain('get');

    // unresolved にも `set` / `get` は含まれない
    const namesInUnresolved = [...unresolved.keys()].map((sym) => sym.getName());
    expect(namesInUnresolved).not.toContain('set');
    expect(namesInUnresolved).not.toContain('get');

    // count 自体は canonical で解決される
    const countEntry = [...stateIdMap.entries()].find(
      ([sym]) => sym.getName() === 'count',
    );
    if (countEntry === undefined) throw new Error('count entry not found in stateIdMap');
    expect(countEntry[1]).toBe('count-id');
  }, TEST_TIMEOUT_MS);
});

// ---- TC-D: State でない識別子の除外 --------------------------------------

describe('buildStateIdMap - State でない識別子の除外', () => {
  /**
   * TC-D: 非 State 型のローカル変数や引数は stateIdMap にも unresolved にも含まれない。
   * （`isStateTypeNode` が false を返すため unresolved 計上もされない）
   */
  it('TC-D: State でない識別子は stateIdMap にも unresolved にも含まれない', () => {
    const source = `
${STATE_TYPE_DEFS}

declare function state<T>(initial: T): WritableState<T>;

const count = state(0);
const plain = 42;

declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => {
  const localNum = plain + 1;
  count.set(count.get() + localNum);
});
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({ 'app.ts': source });
    const sourceFile = sourceFiles.get('app.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const checker = program.getTypeChecker();
    const arrowFn = findEventHandlerArrowFunction(sourceFile);

    const { stateIdMap, unresolved } = buildStateIdMap(arrowFn, checker);

    const allNames = new Set<string>([
      ...[...stateIdMap.keys()].map((sym) => sym.getName()),
      ...[...unresolved.keys()].map((sym) => sym.getName()),
    ]);

    // 非 State 識別子は両マップに含まれない
    expect(allNames.has('plain')).toBe(false);
    expect(allNames.has('localNum')).toBe(false);
    expect(allNames.has('e')).toBe(false);
  }, TEST_TIMEOUT_MS);
});

// ---- TC-D2: 同一 Symbol の複数参照集約 -----------------------------------

describe('buildStateIdMap - 同一 Symbol の複数参照集約', () => {
  /**
   * TC-D2: 同一 Symbol が複数回参照されても unresolved の登録は 1 エントリに集約され、
   * 代表 Identifier は最初に出現したノード。
   */
  it('TC-D2: 同一 Symbol の複数参照が unresolved で 1 エントリに集約される', () => {
    const source = `
${STATE_TYPE_DEFS}

declare function state<T>(initial: T): WritableState<T>;

const count = state(0);

declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => {
  count.set(count.get() + 1);
  count.set(count.get() + 2);
  count.set(count.get() + 3);
});
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({ 'app.ts': source });
    const sourceFile = sourceFiles.get('app.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const checker = program.getTypeChecker();
    const arrowFn = findEventHandlerArrowFunction(sourceFile);

    const { unresolved } = buildStateIdMap(arrowFn, checker);

    // count Symbol は 1 エントリのみ
    const countEntries = [...unresolved.keys()].filter(
      (sym) => sym.getName() === 'count',
    );
    expect(countEntries.length).toBe(1);
    expect(unresolved.size).toBe(1);

    // 代表ノードは最初に出現した Identifier。
    // arrowFn.body の最初の `count` Identifier の position と一致する。
    let firstCountIdent: ts.Identifier | undefined;
    function findFirst(node: ts.Node): void {
      if (firstCountIdent !== undefined) return;
      if (ts.isIdentifier(node) && node.text === 'count') {
        const parent = node.parent;
        if (!(ts.isPropertyAccessExpression(parent) && parent.name === node)) {
          firstCountIdent = node;
          return;
        }
      }
      ts.forEachChild(node, findFirst);
    }
    findFirst(arrowFn.body);
    if (firstCountIdent === undefined) throw new Error('first count ident not found');

    const firstEntry = [...unresolved.entries()][0];
    if (firstEntry === undefined) throw new Error('unresolved is empty');
    const [, repNode] = firstEntry;
    expect(repNode.getStart()).toBe(firstCountIdent.getStart());
  }, TEST_TIMEOUT_MS);
});

// ---- TC-D3: eachScopeParamSymbols のスキップ -----------------------------

describe('buildStateIdMap - eachScopeParamSymbols スキップ', () => {
  /**
   * TC-D3: `eachScopeParamSymbols` に含まれる Symbol は、canonical/fallback いずれでも
   * 解決できなかった場合でも `unresolved` には積まれない（silently skip）。
   *
   * 検証手順:
   *   1) まず eachScopeParamSymbols 未指定で buildStateIdMap を呼び、
   *      `count` Symbol が unresolved に含まれることを確認。
   *   2) その Symbol を eachScopeParamSymbols に渡して再度呼び、
   *      unresolved から消えることを確認。
   */
  it('TC-D3: eachScopeParamSymbols に含まれる Symbol は unresolved に積まれない', () => {
    const source = `
${STATE_TYPE_DEFS}

declare function state<T>(initial: T): WritableState<T>;

const count = state(0);

declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { count.set(count.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({ 'app.ts': source });
    const sourceFile = sourceFiles.get('app.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const checker = program.getTypeChecker();
    const arrowFn = findEventHandlerArrowFunction(sourceFile);

    // (1) 未指定で呼び出し → unresolved に count Symbol が積まれる
    const baseline = buildStateIdMap(arrowFn, checker);
    const countSymbol = [...baseline.unresolved.keys()].find(
      (sym) => sym.getName() === 'count',
    );
    expect(countSymbol).toBeDefined();
    if (countSymbol === undefined) throw new Error('count symbol not found in baseline unresolved');

    // (2) eachScopeParamSymbols に count Symbol を渡す → unresolved から消える
    const skipSet = new Set<ts.Symbol>([countSymbol]);
    const { stateIdMap, unresolved } = buildStateIdMap(arrowFn, checker, {
      eachScopeParamSymbols: skipSet,
    });

    // stateIdMap にも入らない（canonical/fallback 共に未解決のまま skip）
    const inMap = [...stateIdMap.keys()].some((sym) => sym.getName() === 'count');
    expect(inMap).toBe(false);

    // unresolved にも入らない
    const inUnresolved = [...unresolved.keys()].some((sym) => sym.getName() === 'count');
    expect(inUnresolved).toBe(false);
    expect(unresolved.size).toBe(0);
  }, TEST_TIMEOUT_MS);
});

// ---- buildStateIdMapWithInlining 直接 unit test (task 2.3) -------------------
//
// 検証する 3 経路:
//   (a) inlineMap が空 → buildStateIdMap solo と等価な stateIdMap / unresolved
//   (b) inline arrow が body と同一 Symbol を参照 → 衝突時に body の値が保持される
//       (combinedStateIdMap.has(sym) skip ガード)
//   (c) inline arrow が body と別 Symbol を参照 → ユニオン化されて combined に両方含まれる

describe('buildStateIdMapWithInlining - インライン展開対応 stateIdMap マージ', () => {
  /**
   * 共通 fixture: 2 つの State を `_runtimeId` 文字列リテラル型で固定し、
   * body / helper の両方からそれぞれ参照する arrow を構築する。
   */
  function buildInlineFixture(): {
    bodyArrow: ts.ArrowFunction;
    helperArrow: ts.ArrowFunction;
    checker: ts.TypeChecker;
    fallback: ReturnType<typeof createSourceStateNameFallback>;
    sourceFile: ts.SourceFile;
  } {
    const source = `
${STATE_TYPE_DEFS}

declare function state<T>(initial: T): WritableState<T>;

const count: WritableState<number> & { readonly _runtimeId: "count-id" } = state(0) as any;
const flag: WritableState<boolean> & { readonly _runtimeId: "flag-id" } = state(false) as any;

declare const el: { on(event: string, handler: ((e: Event) => void)): void };
// body arrow: count を参照
el.on("click", (e) => { count.set(count.get() + 1); });
// helper arrow (function): body と同じ count を参照
const helperA = () => { count.set(0); };
// helper arrow (function): body と別の flag を参照
const helperB = () => { flag.set(true); };
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({ 'app.ts': source });
    const sourceFile = sourceFiles.get('app.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');
    const checker = program.getTypeChecker();
    const fallback = createSourceStateNameFallback(sourceFile, checker);

    // 全 ArrowFunction を順に拾う:
    //   [0] = el.on の handler (block body)
    //   [1] = helperA RHS arrow
    //   [2] = helperB RHS arrow
    const arrows: ts.ArrowFunction[] = [];
    function visit(node: ts.Node): void {
      if (ts.isArrowFunction(node)) arrows.push(node);
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    if (arrows.length < 3) throw new Error('expected 3 ArrowFunctions in fixture');

    return { bodyArrow: arrows[0], helperArrow: arrows[1], checker, fallback, sourceFile };
  }

  it('(a) inlineMap が空: solo buildStateIdMap と等価な stateIdMap / unresolved を返す', () => {
    const { bodyArrow, checker, fallback } = buildInlineFixture();
    const emptyInlineMap = new Map<string, ts.ArrowFunction>();

    const solo = buildStateIdMap(bodyArrow, checker, { fallback });
    const combined = buildStateIdMapWithInlining(bodyArrow, checker, emptyInlineMap, fallback);

    // stateIdMap: 同じ Symbol セット & 同じ値
    expect(combined.stateIdMap.size).toBe(solo.stateIdMap.size);
    for (const [sym, value] of solo.stateIdMap) {
      expect(combined.stateIdMap.get(sym)).toBe(value);
    }

    // unresolved: 同じ Symbol セット
    expect(combined.unresolved.size).toBe(solo.unresolved.size);
    for (const sym of solo.unresolved.keys()) {
      expect(combined.unresolved.has(sym)).toBe(true);
    }
  }, TEST_TIMEOUT_MS);

  it('(b) body と helper が同一 Symbol を参照: body 由来の値が保持される (衝突時 body 勝ち)', () => {
    const { bodyArrow, helperArrow, checker, fallback } = buildInlineFixture();
    // helperA も body と同じ count を参照する → 同一 Symbol が body / inline 両方で解決される
    const inlineMap = new Map<string, ts.ArrowFunction>([['helperA', helperArrow]]);

    const bodyOnly = buildStateIdMap(bodyArrow, checker, { fallback });
    const combined = buildStateIdMapWithInlining(bodyArrow, checker, inlineMap, fallback);

    // count Symbol が body にも inline にも存在する → combined に 1 エントリ
    const countEntry = [...combined.stateIdMap.entries()].find(
      ([sym]) => sym.getName() === 'count',
    );
    expect(countEntry).toBeDefined();
    if (countEntry === undefined) throw new Error('count not in combined stateIdMap');

    // 値が body 由来であることを確認 (collision skip ガードにより body が勝つ)
    const bodyCountValue = [...bodyOnly.stateIdMap.entries()].find(
      ([sym]) => sym.getName() === 'count',
    )?.[1];
    expect(countEntry[1]).toBe(bodyCountValue);
    expect(countEntry[1]).toBe('count-id');

    // 同一 Symbol が重複登録されていない (Set サイズ不変)
    const countSymbols = [...combined.stateIdMap.keys()].filter(
      (sym) => sym.getName() === 'count',
    );
    expect(countSymbols.length).toBe(1);
  }, TEST_TIMEOUT_MS);

  it('(c) body と helper が別 Symbol を参照: 両方が combined にユニオン化される', () => {
    const { bodyArrow, checker, fallback, sourceFile } = buildInlineFixture();
    // helperB は body と別の flag を参照
    const arrows: ts.ArrowFunction[] = [];
    function visit(node: ts.Node): void {
      if (ts.isArrowFunction(node)) arrows.push(node);
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    const helperBArrow = arrows[2];
    const inlineMap = new Map<string, ts.ArrowFunction>([['helperB', helperBArrow]]);

    const combined = buildStateIdMapWithInlining(bodyArrow, checker, inlineMap, fallback);

    // count (body) と flag (helper) の両方が combined に含まれる
    const hasCount = [...combined.stateIdMap.keys()].some((sym) => sym.getName() === 'count');
    const hasFlag = [...combined.stateIdMap.keys()].some((sym) => sym.getName() === 'flag');
    expect(hasCount).toBe(true);
    expect(hasFlag).toBe(true);

    // 値も正しい
    const countValue = [...combined.stateIdMap.entries()].find(
      ([sym]) => sym.getName() === 'count',
    )?.[1];
    const flagValue = [...combined.stateIdMap.entries()].find(
      ([sym]) => sym.getName() === 'flag',
    )?.[1];
    expect(countValue).toBe('count-id');
    expect(flagValue).toBe('flag-id');
  }, TEST_TIMEOUT_MS);
});
