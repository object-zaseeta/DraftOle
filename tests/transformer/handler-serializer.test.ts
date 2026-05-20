/**
 * Task 6.1: handler-serializer テスト
 *
 * 観測可能な完了基準（代表 5 ケース スナップショット一致）:
 *   1. 単純 state.set(v) / state.get() 連鎖
 *      `() => count.set(count.get() + 1)` → `__draftole__.state("count-id").set(__draftole__.state("count-id").get() + 1)`
 *   2. e.target.value 経由の state.set
 *      `(e) => draft.set(e.target.value)` → `__draftole__.state("draft-id").set(e.target.value)` (params: ["e"])
 *   3. state.update 内部アロー書き換え
 *      `() => todos.update(t => [...t, {id: 1}])` → `__draftole__.state("todos-id").update(function(t) { return [...t, {id: 1}]; })`
 *   4. ビルトイン Math.max / JSON.stringify 素通し
 *      `() => count.set(Math.max(count.get(), 0))` → `__draftole__.state("count-id").set(Math.max(__draftole__.state("count-id").get(), 0))`
 *   5. if / return / テンプレートリテラル含有本体
 *      `(e) => { if (e.key === "Enter") { name.set(\`hello \${e.target.value}\`); } }` → 対応する JS ブロック
 *
 * 対応 requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.9
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { extractHandlerIR } from '../../src/transformer/handler-ir-extractor.ts';
import { serializeHandler } from '../../src/transformer/handler-serializer.ts';

// ---- テスト用ユーティリティ -------------------------------------------------

/**
 * TypeScript プログラム + ソースファイルを生成するヘルパー。
 * State 型を模擬するため、仮想 state.ts 定義も含める。
 */
function createTestProgram(files: Record<string, string>): {
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

  // sourceFilesMap に未登録のファイルを補完
  for (const fileName of fileNames) {
    if (!sourceFilesMap.has(fileName)) {
      const sf = program.getSourceFile(fileName);
      if (sf !== undefined) sourceFilesMap.set(fileName, sf);
    }
  }

  return { program, sourceFiles: sourceFilesMap };
}

/**
 * ソースコード文字列から最初の ArrowFunction ノードを取得するヘルパー。
 */
function getArrowFunction(sourceFile: ts.SourceFile): ts.ArrowFunction {
  let found: ts.ArrowFunction | undefined;

  function visit(node: ts.Node): void {
    if (ts.isArrowFunction(node) && found === undefined) {
      found = node;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  if (found === undefined) {
    throw new Error('No ArrowFunction found in source');
  }
  return found;
}

// ---- 状態型モックの定義 (ReadableState with DraftoleStateMarker) --------

/**
 * テスト用の State 型定義（DraftoleStateMarker を含む）。
 * whitelist-validator と同様のマーカーを使用する。
 */
const STATE_TYPE_DEFS = `
declare const DraftoleStateMarker: unique symbol;

interface ReadableState<T> {
  readonly [DraftoleStateMarker]: "state";
  readonly _runtimeId: string;
  get(): T;
}

interface WritableState<T> extends ReadableState<T> {
  set(value: T): void;
  update(fn: (prev: T) => T): void;
}
`;

// ---- テストケース ------------------------------------------------------------

const TEST_TIMEOUT_MS = 15_000;

describe('handler-serializer / serializeHandler', () => {
  /**
   * ケース1: 単純 state.set(v) / state.get() 連鎖
   * `() => count.set(count.get() + 1)`
   * → code: `__draftole__.state("count-id").set(__draftole__.state("count-id").get() + 1)`
   * → params: []
   */
  it('ケース1: 単純 state.set / state.get の連鎖を __draftole__ 呼び出しに変換する', () => {
    const source = `
${STATE_TYPE_DEFS}
declare const count: WritableState<number>;
const handler = () => count.set(count.get() + 1);
`.trimStart();

    const { program, sourceFiles } = createTestProgram({ 'test.ts': source });
    const sourceFile = sourceFiles.get('test.ts')!;
    const arrowFn = getArrowFunction(sourceFile);
    const { ir } = extractHandlerIR(arrowFn, sourceFile);

    expect(ir).toBeDefined();

    const checker = program.getTypeChecker();
    // count の Symbol → runtimeId のマップ
    const countNode = (() => {
      let found: ts.Identifier | undefined;
      function v(node: ts.Node): void {
        if (ts.isIdentifier(node) && node.text === 'count' && found === undefined) {
          found = node;
        }
        ts.forEachChild(node, v);
      }
      v(arrowFn);
      return found!;
    })();

    const countSymbol = checker.getSymbolAtLocation(countNode);
    const stateIdMap = new Map<ts.Symbol, string>();
    if (countSymbol) stateIdMap.set(countSymbol, 'count-id');

    const result = serializeHandler({ ir: ir!, stateIdMap });

    expect(result.params).toEqual([]);
    expect(result.code).toMatchInlineSnapshot(`"__draftole__.state("count-id").set(__draftole__.state("count-id").get() + 1)"`);
  }, TEST_TIMEOUT_MS);

  /**
   * ケース2: e.target.value 経由の state.set
   * `(e) => draft.set(e.target.value)`
   * → code: `__draftole__.state("draft-id").set(e.target.value)`
   * → params: ["e"]
   */
  it('ケース2: e.target.value 経由の state.set を変換しイベント引数名を保持する', () => {
    const source = `
${STATE_TYPE_DEFS}
declare const draft: WritableState<string>;
const handler = (e: InputEvent) => draft.set((e.target as HTMLInputElement).value);
`.trimStart();

    const { program, sourceFiles } = createTestProgram({ 'test.ts': source });
    const sourceFile = sourceFiles.get('test.ts')!;
    const arrowFn = getArrowFunction(sourceFile);
    const { ir } = extractHandlerIR(arrowFn, sourceFile);

    expect(ir).toBeDefined();

    const checker = program.getTypeChecker();
    const draftNode = (() => {
      let found: ts.Identifier | undefined;
      function v(node: ts.Node): void {
        if (ts.isIdentifier(node) && node.text === 'draft' && found === undefined) {
          found = node;
        }
        ts.forEachChild(node, v);
      }
      v(arrowFn);
      return found!;
    })();

    const draftSymbol = checker.getSymbolAtLocation(draftNode);
    const stateIdMap = new Map<ts.Symbol, string>();
    if (draftSymbol) stateIdMap.set(draftSymbol, 'draft-id');

    const result = serializeHandler({ ir: ir!, stateIdMap });

    expect(result.params).toEqual(['e']);
    expect(result.code).toMatchInlineSnapshot(`"__draftole__.state("draft-id").set((e.target).value)"`);
  }, TEST_TIMEOUT_MS);

  /**
   * ケース3: state.update 内部アロー書き換え
   * `() => todos.update(t => [...t, {id: 1}])`
   * → code: `__draftole__.state("todos-id").update(function(t) { return [...t, {id: 1}]; })`
   * → params: []
   */
  it('ケース3: state.update 内部アローを function 式に変換する', () => {
    const source = `
${STATE_TYPE_DEFS}
interface Todo { id: number; text: string; done: boolean; }
declare const todos: WritableState<Todo[]>;
const handler = () => todos.update(t => [...t, {id: 1, text: "new", done: false}]);
`.trimStart();

    const { program, sourceFiles } = createTestProgram({ 'test.ts': source });
    const sourceFile = sourceFiles.get('test.ts')!;
    const arrowFn = getArrowFunction(sourceFile);
    const { ir } = extractHandlerIR(arrowFn, sourceFile);

    expect(ir).toBeDefined();

    const checker = program.getTypeChecker();
    const todosNode = (() => {
      let found: ts.Identifier | undefined;
      function v(node: ts.Node): void {
        if (ts.isIdentifier(node) && node.text === 'todos' && found === undefined) {
          found = node;
        }
        ts.forEachChild(node, v);
      }
      v(arrowFn);
      return found!;
    })();

    const todosSymbol = checker.getSymbolAtLocation(todosNode);
    const stateIdMap = new Map<ts.Symbol, string>();
    if (todosSymbol) stateIdMap.set(todosSymbol, 'todos-id');

    const result = serializeHandler({ ir: ir!, stateIdMap });

    expect(result.params).toEqual([]);
    // update(fn) の fn がシリアライズされる
    expect(result.code).toMatchInlineSnapshot(`
      "__draftole__.state("todos-id").update(function (t) {
          return [...t, { id: 1, text: "new", done: false }];
      })"
    `);
  }, TEST_TIMEOUT_MS);

  /**
   * ケース4: ビルトイン Math.max / JSON.stringify 素通し
   * `() => count.set(Math.max(count.get(), 0))`
   * → code: `__draftole__.state("count-id").set(Math.max(__draftole__.state("count-id").get(), 0))`
   * → params: []
   */
  it('ケース4: ビルトイン Math.max は書き換えず state 識別子のみ変換する', () => {
    const source = `
${STATE_TYPE_DEFS}
declare const count: WritableState<number>;
const handler = () => count.set(Math.max(count.get(), 0));
`.trimStart();

    const { program, sourceFiles } = createTestProgram({ 'test.ts': source });
    const sourceFile = sourceFiles.get('test.ts')!;
    const arrowFn = getArrowFunction(sourceFile);
    const { ir } = extractHandlerIR(arrowFn, sourceFile);

    expect(ir).toBeDefined();

    const checker = program.getTypeChecker();
    const countNode = (() => {
      let found: ts.Identifier | undefined;
      function v(node: ts.Node): void {
        if (ts.isIdentifier(node) && node.text === 'count' && found === undefined) {
          found = node;
        }
        ts.forEachChild(node, v);
      }
      v(arrowFn);
      return found!;
    })();

    const countSymbol = checker.getSymbolAtLocation(countNode);
    const stateIdMap = new Map<ts.Symbol, string>();
    if (countSymbol) stateIdMap.set(countSymbol, 'count-id');

    const result = serializeHandler({ ir: ir!, stateIdMap });

    expect(result.params).toEqual([]);
    expect(result.code).toMatchInlineSnapshot(`"__draftole__.state("count-id").set(Math.max(__draftole__.state("count-id").get(), 0))"`);
  }, TEST_TIMEOUT_MS);

  /**
   * ケース5: if / return / テンプレートリテラル含有ブロック本体
   * `(e) => { if (e.key === "Enter") { name.set(\`hello \${e.target.value}\`); } }`
   * → ブロック本体が if 文とテンプレートリテラルを保持しつつ state 識別子が変換される
   * → params: ["e"]
   */
  it('ケース5: if 文とテンプレートリテラルを含むブロック本体を変換する', () => {
    const source = `
${STATE_TYPE_DEFS}
declare const name: WritableState<string>;
const handler = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    const val = (e.target as HTMLInputElement).value;
    name.set(\`hello \${val}\`);
  }
};
`.trimStart();

    const { program, sourceFiles } = createTestProgram({ 'test.ts': source });
    const sourceFile = sourceFiles.get('test.ts')!;
    const arrowFn = getArrowFunction(sourceFile);
    const { ir } = extractHandlerIR(arrowFn, sourceFile);

    expect(ir).toBeDefined();

    const checker = program.getTypeChecker();
    const nameNode = (() => {
      let found: ts.Identifier | undefined;
      function v(node: ts.Node): void {
        if (ts.isIdentifier(node) && node.text === 'name' && found === undefined) {
          found = node;
        }
        ts.forEachChild(node, v);
      }
      v(arrowFn);
      return found!;
    })();

    const nameSymbol = checker.getSymbolAtLocation(nameNode);
    const stateIdMap = new Map<ts.Symbol, string>();
    if (nameSymbol) stateIdMap.set(nameSymbol, 'name-id');

    const result = serializeHandler({ ir: ir!, stateIdMap });

    expect(result.params).toEqual(['e']);
    // ブロック本体で if 文とテンプレートリテラルが保持される
    expect(result.code).toMatchInlineSnapshot(`
      "if (e.key === "Enter") {
          const val = (e.target).value;
          __draftole__.state("name-id").set(\`hello \${val}\`);
      }"
    `);
  }, TEST_TIMEOUT_MS);
});
