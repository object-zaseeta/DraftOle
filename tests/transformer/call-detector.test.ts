/**
 * Task 4.1: call-detector テスト
 *
 * 観測可能な完了基準（3 ケース緑）:
 *   1. 対象検出: `.on('click', (e) => ...)` を正しく検出する
 *   2. 従来形式スキップ: `.on('click', (s: ScriptScope) => ...)` を検出しない
 *   3. 変数経由拒否: `.on('click', handlerVar)` で ts.Diagnostic error が生成される
 *
 * 対応 requirements: 2.1, 2.4, 5.3
 */

import * as path from 'node:path';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { createCallDetector } from '../../src/transformer/call-detector.ts';

// ---- テスト用ユーティリティ --------------------------------------------------

// 共有プログラムキャッシュ（繰り返し作成を避けるため）
let _sharedHost: ts.CompilerHost | null = null;
const _cachedPrograms: Map<string, { program: ts.Program; sourceFile: ts.SourceFile }> = new Map();

/**
 * インメモリ TypeScript プログラムを作成するヘルパー。
 * 指定された TS ソースコードを仮想ファイルとして ts.Program に組み込む。
 * DOM 型を使わずに軽量なプログラムを作成する。
 */
function createTestProgram(
  sourceCode: string,
  extraFiles: Record<string, string> = {},
  filename = 'test.ts',
): {
  program: ts.Program;
  sourceFile: ts.SourceFile;
} {
  // キャッシュキー
  const cacheKey = sourceCode + JSON.stringify(extraFiles);
  const cached = _cachedPrograms.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // ScriptScope の型定義をインラインで提供（DOM 型不要の最小定義）
  const scriptScopeDts = `
export interface ScriptScope {
  _emitHandlerBody(code: string, params: readonly string[]): void;
  raw(code: string): { code: string };
  state<T>(ref: unknown): unknown;
}
`;

  const files: Record<string, string> = {
    [filename]: sourceCode,
    '/virtual/script-scope.d.ts': scriptScopeDts,
    ...Object.fromEntries(
      Object.entries(extraFiles).map(([k, v]) => [`/virtual/${k}`, v]),
    ),
  };

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    noEmit: true,
    // DOM 型ライブラリを使わず ES2019 のみ（高速化）
    lib: ['lib.es2019.d.ts'],
    skipLibCheck: true,
    noResolve: false,
  };

  if (_sharedHost === null) {
    _sharedHost = ts.createCompilerHost(compilerOptions);
  }
  const defaultHost = _sharedHost;

  const customHost: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile(name, languageVersion) {
      // バーチャルファイルの解決
      if (files[name] !== undefined) {
        return ts.createSourceFile(name, files[name], languageVersion);
      }
      const baseName = path.basename(name);
      const virtualPath = `/virtual/${baseName}`;
      if (files[virtualPath] !== undefined) {
        return ts.createSourceFile(virtualPath, files[virtualPath], languageVersion);
      }
      return defaultHost.getSourceFile(name, languageVersion);
    },
    fileExists(name) {
      return (
        files[name] !== undefined ||
        files[`/virtual/${path.basename(name)}`] !== undefined ||
        defaultHost.fileExists(name)
      );
    },
    readFile(name) {
      return files[name] ?? files[`/virtual/${path.basename(name)}`] ?? defaultHost.readFile(name);
    },
  };

  const program = ts.createProgram([filename], compilerOptions, customHost);

  const sourceFile = program.getSourceFile(filename);
  if (sourceFile === undefined) {
    throw new Error(`Source file '${filename}' not found in program`);
  }

  const result = { program, sourceFile };
  _cachedPrograms.set(cacheKey, result);
  return result;
}

// ---- テストケース ------------------------------------------------------------

// TypeScript の createProgram は初回が遅いため、テストタイムアウトを設定する
const TEST_TIMEOUT_MS = 20_000;

describe('call-detector / createCallDetector', () => {
  /**
   * ケース1: 対象検出
   * `.on('click', (e) => ...)` はアロー関数ハンドラとして検出される
   */
  it('ケース1: .on(event, arrowFn) を正しく検出する', () => {
    // DOM 型を使わない軽量なソース（Event 型も使わない）
    const sourceCode = `
const element = {
  on: (event: string, handler: (e: unknown) => void) => element
};
element.on('click', (e) => {
  console.log(e);
});
`.trimStart();

    const { program, sourceFile } = createTestProgram(sourceCode);
    const detect = createCallDetector(program);
    const result = detect(sourceFile);

    // 検出数: 1 件
    expect(result.detected).toHaveLength(1);
    // エラーなし
    expect(result.diagnostics).toHaveLength(0);

    const info = result.detected[0];
    // イベント名が 'click'
    expect(info.eventArg.text).toBe('click');
    // handlerArg が ArrowFunction
    expect(ts.isArrowFunction(info.handlerArg)).toBe(true);
  }, TEST_TIMEOUT_MS);

  /**
   * ケース2: 従来形式スキップ
   * `(s: ScriptScope) => ...` は _emitHandlerBody を持つ型なので検出しない
   */
  it('ケース2: (s: ScriptScope) => ... 形式は検出しない（スキップ）', () => {
    const sourceCode = `
interface ScriptScope {
  _emitHandlerBody(code: string, params: readonly string[]): void;
  raw(code: string): { code: string };
}
const element = {
  on: (event: string, handler: (s: ScriptScope) => void) => element
};
element.on('click', (s: ScriptScope) => {
  s._emitHandlerBody('console.log()', []);
});
`.trimStart();

    const { program, sourceFile } = createTestProgram(sourceCode);
    const detect = createCallDetector(program);
    const result = detect(sourceFile);

    // 検出数: 0 件（従来形式はスキップ）
    expect(result.detected).toHaveLength(0);
    // エラーなし
    expect(result.diagnostics).toHaveLength(0);
  }, TEST_TIMEOUT_MS);

  /**
   * ケース3: 変数経由拒否
   * `.on('click', handlerVar)` は変数参照なので ts.Diagnostic error が生成される
   */
  it('ケース3: 変数経由ハンドラは ts.Diagnostic error を生成する', () => {
    const sourceCode = `
const element = {
  on: (event: string, handler: (e: unknown) => void) => element
};
const handlerVar = (e: unknown) => { console.log(e); };
element.on('click', handlerVar);
`.trimStart();

    const { program, sourceFile } = createTestProgram(sourceCode);
    const detect = createCallDetector(program);
    const result = detect(sourceFile);

    // 検出数: 0 件（変数参照は対象外）
    expect(result.detected).toHaveLength(0);
    // エラー: 1 件
    expect(result.diagnostics).toHaveLength(1);

    const diag = result.diagnostics[0];
    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    expect(typeof diag.messageText).toBe('string');
    expect(diag.messageText as string).toContain('DT001');
    expect(diag.messageText as string).toContain('arrow function');
  }, TEST_TIMEOUT_MS);
});
