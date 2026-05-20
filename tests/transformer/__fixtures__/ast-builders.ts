/**
 * Transformer 共有 fixture: AST 構築ヘルパ
 *
 * transformer 単体テスト群 (タスク 4.1〜4.6: ThemeClassDetectorTests /
 * HandlerIrExtractorTests / VarnameResolverTests / HelperDeclUtilsTests /
 * HelperContextResolverTests / WhitelistValidatorTests) で共通利用する
 * AST 構築ヘルパを集約する。
 *
 * 提供 API:
 *   - `createSourceFile`: 文字列ソースから `ts.SourceFile` を生成する
 *   - `findNode`:         predicate にマッチする最初の node を返す
 *   - `findAllNodes`:     predicate にマッチする全 node を返す
 *   - `createTestProgram`: in-memory CompilerHost ベースで `ts.Program` /
 *                          `ts.TypeChecker` / 入力 SourceFile マップを返す
 *
 * 設計方針:
 *   - 純関数のみ (state を持たない)
 *   - TypeScript 公式 API のみ依存
 *   - `setParentNodes: true` をデフォルトにし、親 walk を要する分析を前提化
 *   - `createTestProgram` は `noEmit: true` / `strict: true` で軽量かつ
 *     型解決可能な最小 Program を構築する
 *
 * Spec: `.kiro/specs/global-branch-90-percent/`
 *   - design.md: "TransformerFixtures"
 *   - requirements.md: Requirement 3.1〜3.6
 *   - tasks.md: 1.2
 */

import * as ts from 'typescript';

// ---------------------------------------------------------------------------
// createSourceFile
// ---------------------------------------------------------------------------

export interface CreateSourceFileOptions {
  /** ScriptTarget. デフォルト: `ts.ScriptTarget.ES2020` */
  readonly target?: ts.ScriptTarget;
  /** ScriptKind. デフォルト: `ts.ScriptKind.TS` */
  readonly kind?: ts.ScriptKind;
  /** parent pointer を埋めるか. デフォルト: `true` */
  readonly setParentNodes?: boolean;
}

/**
 * 文字列ソースから単体テスト向けの `ts.SourceFile` を生成する。
 *
 * デフォルトで `setParentNodes: true` を有効化するため、生成された
 * node ツリーは `node.parent` を辿る分析にそのまま利用できる。
 */
export function createSourceFile(
  filename: string,
  source: string,
  options?: CreateSourceFileOptions,
): ts.SourceFile {
  const target = options?.target ?? ts.ScriptTarget.ES2020;
  const kind = options?.kind ?? ts.ScriptKind.TS;
  const setParentNodes = options?.setParentNodes ?? true;
  return ts.createSourceFile(filename, source, target, setParentNodes, kind);
}

// ---------------------------------------------------------------------------
// findNode / findAllNodes
// ---------------------------------------------------------------------------

/**
 * `source` を深さ優先で走査し、`predicate` にマッチする最初の node を返す。
 * 見つからなければ `undefined` を返す。
 */
export function findNode<T extends ts.Node>(
  source: ts.SourceFile,
  predicate: (node: ts.Node) => node is T,
): T | undefined {
  let found: T | undefined;
  const visit = (node: ts.Node): void => {
    if (found !== undefined) return;
    if (predicate(node)) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(source, visit);
  return found;
}

/**
 * `source` を深さ優先で走査し、`predicate` にマッチするすべての node を返す。
 * マッチした node の子も継続して走査するため、入れ子マッチも検出する。
 */
export function findAllNodes<T extends ts.Node>(
  source: ts.SourceFile,
  predicate: (node: ts.Node) => node is T,
): T[] {
  const acc: T[] = [];
  const visit = (node: ts.Node): void => {
    if (predicate(node)) {
      acc.push(node);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(source, visit);
  return acc;
}

// ---------------------------------------------------------------------------
// createTestProgram
// ---------------------------------------------------------------------------

export interface TestProgramFile {
  readonly name: string;
  readonly source: string;
}

export interface TestProgram {
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  readonly sources: ReadonlyMap<string, ts.SourceFile>;
}

/**
 * in-memory CompilerHost を構築し、与えられた `files` のみを含む軽量な
 * `ts.Program` を生成する。`noEmit: true` / `strict: true` で型解決のみを
 * 目的とした構成。
 *
 * 返却される `sources` には呼び出し時に渡した name を key として
 * `ts.SourceFile` が格納される (パス解決に伴う正規化を吸収するため、
 * 内部で再 lookup した結果ではなく `getSourceFile` で得た値を保持する)。
 */
export function createTestProgram(files: ReadonlyArray<TestProgramFile>): TestProgram {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    strict: true,
    noEmit: true,
  };

  const fileMap = new Map<string, string>();
  for (const f of files) {
    fileMap.set(f.name, f.source);
  }

  const defaultHost = ts.createCompilerHost(compilerOptions);

  const host: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile: (fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile) => {
      const inMemory = fileMap.get(fileName);
      if (inMemory !== undefined) {
        return ts.createSourceFile(
          fileName,
          inMemory,
          languageVersionOrOptions,
          /* setParentNodes */ true,
          ts.ScriptKind.TS,
        );
      }
      return defaultHost.getSourceFile(
        fileName,
        languageVersionOrOptions,
        onError,
        shouldCreateNewSourceFile,
      );
    },
    fileExists: (fileName) => {
      if (fileMap.has(fileName)) return true;
      return defaultHost.fileExists(fileName);
    },
    readFile: (fileName) => {
      const inMemory = fileMap.get(fileName);
      if (inMemory !== undefined) return inMemory;
      return defaultHost.readFile(fileName);
    },
    writeFile: () => {
      /* noEmit: true なので no-op */
    },
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
  };

  const rootNames = files.map((f) => f.name);
  const program = ts.createProgram(rootNames, compilerOptions, host);
  const checker = program.getTypeChecker();

  const sources = new Map<string, ts.SourceFile>();
  for (const name of rootNames) {
    const sf = program.getSourceFile(name);
    if (sf !== undefined) {
      sources.set(name, sf);
    }
  }

  return { program, checker, sources };
}
