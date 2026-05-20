/**
 * Task 6.3: transformer 本体への結線 — 統合テスト
 *
 * 観測可能な完了基準:
 *   `.ts` ソース → `ts.transpileModule` 経由の出力に
 *   `__draftole__.state(...)` が正しく現れる
 *
 * テスト対象: src/transformer/index.ts（パイプライン結線後）
 *
 * 対応 requirements: 2.7, 4.1, 4.2, 5.1, 5.3, 5.4
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import draftoleTransformer from '../../src/transformer/index.ts';

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
 * State 型定義（DraftoleStateMarker を含む最小定義）。
 *
 * NOTE: `_runtimeId` を string literal 型（例: "count-id"）で宣言することで、
 * TypeChecker が _runtimeId の実際の値を静的に取得できる。
 * これは buildStateIdMap がリテラル型から runtimeId を抽出するため必要。
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

// ---- テスト定数 --------------------------------------------------------------

const TEST_TIMEOUT_MS = 30_000;

// ---- 統合テスト ------------------------------------------------------------

describe('draftoleTransformer / integration', () => {
  /**
   * ケース1: 基本的な state.set(state.get() + 1) 変換
   *
   * `_runtimeId` を文字列リテラル型 "count-id" で宣言することで、
   * TypeChecker が runtimeId を静的に取得できる。
   *
   * 入力: `el.on("click", (e) => { count.set(count.get() + 1); })`
   * 期待: 変換後の AST に _emitHandlerBody と __draftole__.state("count-id") が含まれる
   *
   * Req 4.2, 4.3
   */
  it('ケース1: state.set(state.get() + 1) が __draftole__ 呼び出しに変換される', () => {
    // _runtimeId を string literal 型で宣言することで TypeChecker から ID を取得可能
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
el.on("click", (e) => { count.set(count.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    // transformer を適用して変換後の SourceFile を得る
    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    // ts.Printer で変換後 AST を文字列化
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // `(s) => s._emitHandlerBody(...)` に書き換えられているはず
    // _emitHandlerBody の第1引数 (文字列リテラル) に serialized code が含まれる。
    // printer が出力する文字列リテラル内の " は \" にエスケープされる。
    expect(outputCode).toContain('_emitHandlerBody');
    expect(outputCode).toContain('__draftole__.state');
    expect(outputCode).toContain('count-id');
    expect(outputCode).toContain('_draftoleEmitted');
  }, TEST_TIMEOUT_MS);

  /**
   * ケース2: ts.transpileModule を通した最終 JS 出力検証
   *
   * ts.transpileModule に transformer を渡すと型注釈が除去された最終 JS が得られる。
   * 最終 JS に `__draftole__.state(...)` が含まれることを確認する。
   *
   * Req 5.1, 5.3, 5.4
   */
  it('ケース2: transpileModule 経由で最終 JS に __draftole__.state が現れる', () => {
    // _runtimeId を "count-id" リテラル型で宣言
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
el.on("click", (e) => { count.set(count.get() + 1); });
`.trimStart();

    const { program } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });

    // transpileModule で変換（型注釈を除去した最終 JS を生成）
    const result = ts.transpileModule(handlerSource, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2019,
        module: ts.ModuleKind.CommonJS,
      },
      transformers: {
        before: [draftoleTransformer(program)],
      },
    });

    // 最終 JS に __draftole__.state と _emitHandlerBody が含まれること
    // transpileModule の outputText では serialized code は文字列内に収まるため
    // 内側の " は \" にエスケープされる。そのため __draftole__.state 部分で検証する。
    expect(result.outputText).toContain('__draftole__.state');
    expect(result.outputText).toContain('count-id');
    expect(result.outputText).toContain('_emitHandlerBody');
  }, TEST_TIMEOUT_MS);

  /**
   * ケース3: 従来 HandlerCallback 形式 (s: ScriptScope) => ... は変換されない（素通し）
   *
   * Req 5.3: 従来形式はパススルー
   */
  it('ケース3: ScriptScope 形式のハンドラは変換されない（パススルー）', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

interface ScriptScope {
  _emitHandlerBody(code: string, params: readonly string[]): void;
}

declare const el: { on(event: string, handler: (s: ScriptScope) => void): void };
el.on("click", (s: ScriptScope) => { s._emitHandlerBody("legacy", []); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // 変換されていないこと: Object.assign や _draftoleEmitted が挿入されていない
    expect(outputCode).not.toContain('Object.assign');
    // 元のコードの形式が保持されていること
    expect(outputCode).toContain('s._emitHandlerBody("legacy", [])');
  }, TEST_TIMEOUT_MS);

  /**
   * ケース4: ホワイトリスト違反があれば AST 書き換えを抑制する（エラー集約）
   *
   * `outsideVar` はモジュールスコープの変数で、ホワイトリスト外のため
   * Diagnostic error が返され、書き換えが抑制される。
   *
   * Req 2.7: ファイル単位で ts.Diagnostic[] を集約、1 件でも error があれば書き換え抑制
   */
  it('ケース4: ホワイトリスト違反があれば書き換えが抑制される（元のまま残る）', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
const outsideVar = 42;
declare const el: { on(event: string, handler: ((e: MouseEvent) => void)): void };
el.on("click", (e) => { count.set(outsideVar); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // 書き換えが抑制されていること（Object.assign は挿入されない）
    expect(outputCode).not.toContain('Object.assign');
    expect(outputCode).not.toContain('_draftoleEmitted');
  }, TEST_TIMEOUT_MS);

  /**
   * ケース5: イベント引数 (e) を持つアロー関数の変換
   *
   * 入力: `(e) => draft.set(e.target.value)`
   * 期待: _emitHandlerBody の params 引数に "e" が含まれること
   *
   * Req 4.4
   */
  it('ケース5: イベント引数 e を持つハンドラが params に ["e"] を生成する', () => {
    // HTMLInputElement のような型キャストを避けた単純な e 参照ハンドラ
    // e はイベント引数として whitelist-validator に許可される
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "c-id" };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { count.set(count.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // _emitHandlerBody の第2引数が ["e"] を含むこと
    // params は ["e"] として serialized code の後に渡される
    expect(outputCode).toContain('"e"');
    expect(outputCode).toContain('_draftoleEmitted');
    expect(outputCode).toContain('__draftole__.state');
    expect(outputCode).toContain('c-id');
  }, TEST_TIMEOUT_MS);

  // ---- Task 4.5: transformer-state-fallback-spec 統合シナリオ ----------------

  /**
   * TC-K: 型リテラル注釈ありソースが fallback 未使用で変換成功する
   *
   * `_runtimeId: "count-id"` のような型リテラル注釈を持つ State は、
   * canonical 経路（resolveStateIdByType）のみで stateIdMap に登録され、
   * fallback を経由せずに __draftole__.state("count-id") へ変換される。
   *
   * Requirements: 1.1, 5.1
   */
  it('TC-K: 型リテラル注釈ありソースが fallback 未使用で変換成功する', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { count.set(count.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // canonical 経路で解決され変換が成功する
    expect(outputCode).toContain('__draftole__.state');
    expect(outputCode).toContain('count-id');
    expect(outputCode).toContain('_emitHandlerBody');
    expect(outputCode).toContain('_draftoleEmitted');
  }, TEST_TIMEOUT_MS);

  /**
   * TC-L: 型リテラル注釈なし + 単純代入が fallback 経由で変換成功する
   *
   * `_runtimeId` がリテラル型でない場合でも、`const x = root.state(...)` の
   * 単純代入パターンであれば fallback (createSourceStateNameFallback) が
   * VariableDeclaration の name から ID（s0, s1, ...）を生成し、変換が成功する。
   *
   * Requirements: 1.2, 5.1, 5.2
   */
  it('TC-L: 型リテラル注釈なし + 単純代入が fallback 経由で変換成功する', () => {
    // root.state(...) の単純代入。_runtimeId は string 型（リテラル不在）。
    const handlerSource = `
${STATE_TYPE_DEFS}

interface Root {
  state<T>(initial: T): WritableState<T>;
}
declare const root: Root;
const counter = root.state<number>(0);
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { counter.set(counter.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // fallback 経由で ID が割り当てられ変換が成功する
    expect(outputCode).toContain('__draftole__.state');
    expect(outputCode).toContain('_emitHandlerBody');
    expect(outputCode).toContain('_draftoleEmitted');
    // 元の counter.set / counter.get は serialized body 内に閉じ込められる
    expect(outputCode).not.toContain('counter.set(counter.get');
  }, TEST_TIMEOUT_MS);

  /**
   * TC-M: ヘルパー関数で包んだ State → DT011 で error、書き換え抑制
   *
   * fallback 非サポートのパターン（配列 destructuring 経由の代入）では
   * canonical / fallback の両経路で resolve できず unresolved に残り、
   * DT011 が発行され書き換えが抑制される。
   *
   * NOTE: dt011-emission.test.ts と等価な観測を統合レイヤでも担保する。
   *
   * Requirements: 1.2, 4.1
   */
  it('TC-M: ヘルパー関数で包んだ State が DT011 で書き換え抑制される', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare function makeState<T>(initial: T): WritableState<T>;
const [wrapped] = [makeState<number>(0)];
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { wrapped.set(wrapped.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // DT011 → 書き換え抑制：__draftole__.state / _draftoleEmitted は挿入されない
    expect(outputCode).not.toContain('__draftole__.state');
    expect(outputCode).not.toContain('_draftoleEmitted');
    // 元の wrapped.set 呼び出しがそのまま残る
    expect(outputCode).toContain('wrapped.set');
  }, TEST_TIMEOUT_MS);

  /**
   * TC-N: each スコープのコールバックパラメータが DT011 で誤検知されない
   *
   * `.each((item) => { ... })` の `item` は WritableState 型を持つが、
   * `eachScopeParamSymbols` に含まれるため unresolved に積まれず、
   * DT011 は発行されない（each-state パターン回帰保護）。
   *
   * Requirements: 6.2
   */
  it('TC-N: each スコープのコールバック param が DT011 で誤検知されない', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

type ArrayItem<T> = T extends Array<infer U> ? U : never;

interface ReadableStateE<T> extends ReadableState<T> {
  each(fn: (item: WritableStateE<ArrayItem<T>>) => void): void;
}
interface WritableStateE<T> extends WritableState<T> {
  each(fn: (item: WritableStateE<ArrayItem<T>>) => void): void;
}

declare const todos: WritableStateE<number[]> & { readonly _runtimeId: "todos-id" };
declare const el: { on(event: string, handler: () => void): void };

todos.each((item) => {
  el.on('click', () => {
    item.set(item.get() + 1);
  });
});
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // each コールバック param `item` は DT011 を発生させず変換が成功する
    expect(outputCode).toContain('__draftole__.state');
    expect(outputCode).toContain('itemId');
    expect(outputCode).toContain('_emitHandlerBody');
    expect(outputCode).toContain('_draftoleEmitted');
    // 生の item.set / item.get は残らない
    expect(outputCode).not.toContain('item.set(');
    expect(outputCode).not.toContain('item.get(');
  }, TEST_TIMEOUT_MS);

  /**
   * TC-O: インライン展開経路で `unresolved` が残るケースで recovery 不成立
   *
   * インライン関数 step1 内で fallback 非サポートな State 参照（配列
   * destructuring 経由の `wrapped`）が含まれると、tryInlineRecovery 後も
   * unresolved が残り recovery 不成立となり、元の validation error が
   * 表面化して書き換えが抑制される。
   *
   * NOTE: dt011-emission.test.ts と等価な観測を統合レイヤでも担保する。
   *
   * Requirements: 4.1, 6.2
   */
  it('TC-O: インライン展開で unresolved 残存 → recovery 不成立で書き換え抑制', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare function makeState<T>(initial: T): WritableState<T>;
const [wrapped] = [makeState<number>(0)];
const step1 = () => { wrapped.set(wrapped.get() + 1); };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { step1(); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // recovery 不成立 → 書き換え抑制
    expect(outputCode).not.toContain('__draftole__.state');
    expect(outputCode).not.toContain('_draftoleEmitted');
    // 元の step1() 呼び出しが残る
    expect(outputCode).toContain('step1');
  }, TEST_TIMEOUT_MS);
});

// ---- transformer-inline-recovery-spec: 統合テスト ---------------------------

describe('draftoleTransformer / inline-recovery (transformer-inline-recovery-spec §10)', () => {
  /**
   * テスト用ヘルパー: transformer を適用し、出力コードと診断を返す。
   */
  function runTransformer(
    handlerSource: string,
    options?: { strictHelpers?: boolean },
  ): { outputCode: string; diagnostics: ts.Diagnostic[] } {
    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const collected: ts.Diagnostic[] = [];
    const transformerFactory = draftoleTransformer(program, {
      debug: false,
      strictHelpers: options?.strictHelpers,
      onDiagnostics: (diags) => {
        collected.push(...diags);
      },
    });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    return {
      outputCode: printer.printFile(transformedSf),
      diagnostics: collected,
    };
  }

  /** ケース 1: 現行サポートシナリオ（ゼロ引数 helper をハンドラから呼ぶ） */
  it('ケース1: ゼロ引数 module-level const arrow helper が成功路で展開される', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
const helper = () => { count.set(count.get() + 1); };
el.on("click", (e) => { helper(); });
`.trimStart();

    const { outputCode, diagnostics } = runTransformer(handlerSource);

    // 成功路: 書き換え発生
    expect(outputCode).toContain('__draftole__.state');
    expect(outputCode).toContain('count-id');
    expect(outputCode).toContain('_emitHandlerBody');
    // helper は accepted なので DT012 は発行されない
    expect(diagnostics.some((d) => d.code === 9012)).toBe(false);
  }, TEST_TIMEOUT_MS);

  /** ケース 2: パラメータ付き helper（DT012 + 元エラー共存・rewrite 抑制） */
  it('ケース2: パラメータ付き helper で DT012 が Suggestion で発行され rewrite が抑制される', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
const helper = (delta: number) => { count.set(count.get() + delta); };
el.on("click", (e) => { helper(1); });
`.trimStart();

    const { outputCode, diagnostics } = runTransformer(handlerSource);

    // helper はパラメータ付き → 採用候補なし → recovery 不成立 → 書き換え抑制
    expect(outputCode).not.toContain('_emitHandlerBody');
    // DT012（Suggestion）が発行され、reason は has-parameters
    const dt012 = diagnostics.find((d) => d.code === 9012);
    expect(dt012).toBeDefined();
    expect(dt012?.category).toBe(ts.DiagnosticCategory.Suggestion);
    const text = typeof dt012?.messageText === 'string' ? dt012.messageText : '';
    expect(text).toContain('has-parameters');
    // 元のホワイトリストエラー診断（DT001 等の Error カテゴリ）が共存する
    expect(diagnostics.some((d) => d.category === ts.DiagnosticCategory.Error)).toBe(true);
  }, TEST_TIMEOUT_MS);

  /** ケース 3: function 宣言 helper（DT012 + 元エラー共存） */
  it('ケース3: function 宣言 helper で DT012 (function-declaration) が発行される', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
function helper() { count.set(count.get() + 1); }
el.on("click", (e) => { helper(); });
`.trimStart();

    const { outputCode, diagnostics } = runTransformer(handlerSource);

    // 採用候補なし → 書き換え抑制
    expect(outputCode).not.toContain('_emitHandlerBody');
    const dt012 = diagnostics.find((d) => d.code === 9012);
    expect(dt012).toBeDefined();
    const text = typeof dt012?.messageText === 'string' ? dt012.messageText : '';
    expect(text).toContain('function-declaration');
    // 元エラー（DT001 等）と共存
    expect(diagnostics.some((d) => d.category === ts.DiagnosticCategory.Error)).toBe(true);
  }, TEST_TIMEOUT_MS);

  /** ケース 4: strictHelpers: true で DT012 が Warning カテゴリになる */
  it('ケース4: strictHelpers: true で DT012 が Warning カテゴリで発行される', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
const helper = (delta: number) => { count.set(count.get() + delta); };
el.on("click", (e) => { helper(1); });
`.trimStart();

    const { diagnostics } = runTransformer(handlerSource, { strictHelpers: true });

    const dt012 = diagnostics.find((d) => d.code === 9012);
    expect(dt012).toBeDefined();
    expect(dt012?.category).toBe(ts.DiagnosticCategory.Warning);
  }, TEST_TIMEOUT_MS);

  /** ケース 5: state-id 解決と整合（reactive-state-compat 既存ケースに helper 1 個追加） */
  it('ケース5: helper を 1 個追加しても state-id 解決と整合する (TRANS-1)', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const flag: WritableState<boolean> & { readonly _runtimeId: "flag-id" };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
const inc = () => { count.set(count.get() + 1); };
el.on("click", (e) => { inc(); flag.set(true); });
`.trimStart();

    const { outputCode, diagnostics } = runTransformer(handlerSource);

    // helper inc は accepted → 書き換え成功 + 両方の state-id が解決
    expect(outputCode).toContain('count-id');
    expect(outputCode).toContain('flag-id');
    expect(outputCode).toContain('_emitHandlerBody');
    // DT012 は発行されない
    expect(diagnostics.some((d) => d.code === 9012)).toBe(false);
  }, TEST_TIMEOUT_MS);
});
