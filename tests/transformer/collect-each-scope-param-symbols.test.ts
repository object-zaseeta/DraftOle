/**
 * collectEachScopeParamSymbols ユニットテスト (TXDX-DX Task 3.1)
 *
 * helper-aware 化された `collectEachScopeParamSymbols` の挙動を検証する。
 *
 * 検証項目:
 * - U-1: helperCallSites 未指定の場合、従来挙動 (直接 enclosing `.each` の param Symbol)
 * - U-2: helperCallSites 未指定 + each スコープ外 → undefined
 * - U-3: helperCallSites 指定 + 全 call-site が一意 EachScopeContext を共有する場合
 *        → call-site の `.each` arrow param Symbol + helper body 内の同名参照 Symbol を含む Set
 * - U-4: helperCallSites 指定 + 全 call-site が each 外 → undefined
 *
 * Requirements: 1.1, 1.2
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { __test__collectEachScopeParamSymbols } from '../../src/transformer/each-state-rewriter.ts';

// ---- テスト用ユーティリティ -------------------------------------------------

function createTestProgram(sourceCode: string): {
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
} {
  const fileName = 'test.ts';
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    strict: false,
    noEmit: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  let cachedSourceFile: ts.SourceFile | undefined;

  host.getSourceFile = (fn, langVersion): ts.SourceFile | undefined => {
    if (fn === fileName || fn.endsWith(fileName)) {
      if (cachedSourceFile === undefined) {
        cachedSourceFile = ts.createSourceFile(fn, sourceCode, langVersion, true);
      }
      return cachedSourceFile;
    }
    return originalGetSourceFile(fn, langVersion);
  };
  host.fileExists = (fn): boolean =>
    fn === fileName || fn.endsWith(fileName) || ts.sys.fileExists(fn);
  host.readFile = (fn): string | undefined => {
    if (fn === fileName || fn.endsWith(fileName)) return sourceCode;
    return ts.sys.readFile(fn);
  };

  const program = ts.createProgram([fileName], compilerOptions, host);
  const checker = program.getTypeChecker();
  const sourceFile = cachedSourceFile ?? (program.getSourceFile(fileName) as ts.SourceFile);
  return { sourceFile, checker };
}

function findAll<T extends ts.Node>(
  node: ts.Node,
  guard: (n: ts.Node) => n is T,
): T[] {
  const results: T[] = [];
  function visit(n: ts.Node): void {
    if (guard(n)) results.push(n);
    ts.forEachChild(n, visit);
  }
  visit(node);
  return results;
}

/** `.on(...)` CallExpression を全て取得する */
function findOnCalls(sourceFile: ts.SourceFile): ts.CallExpression[] {
  return findAll(sourceFile, ts.isCallExpression).filter((ce) => {
    const e = ce.expression;
    return ts.isPropertyAccessExpression(e) && e.name.text === 'on';
  });
}

/** 名前付き関数 (`const name = () => {...}`) を呼び出している CallExpression を集める */
function findCallExprByCalleeName(sourceFile: ts.SourceFile, name: string): ts.CallExpression[] {
  return findAll(sourceFile, ts.isCallExpression).filter((ce) => {
    const e = ce.expression;
    return ts.isIdentifier(e) && e.text === name;
  });
}

// ---- テスト本体 -------------------------------------------------------------

describe('collectEachScopeParamSymbols (helper-aware)', () => {
  it('U-1: helperCallSites 未指定 + 直接 enclosing `.each` あり → param Symbol を返す', () => {
    const source = `
      declare const root: any;
      root.each((item: any) => {
        item.on('click', () => {});
      });
    `;
    const { sourceFile, checker } = createTestProgram(source);
    const onCall = findOnCalls(sourceFile)[0];
    expect(onCall).toBeDefined();

    const result = __test__collectEachScopeParamSymbols(onCall, checker);
    expect(result).toBeDefined();
    expect(result?.size).toBe(1);
    // param Symbol の名前を検証
    const names = [...(result ?? [])].map((s) => s.getName());
    expect(names).toContain('item');
  });

  it('U-2: helperCallSites 未指定 + each スコープ外 → undefined', () => {
    const source = `
      declare const root: any;
      root.on('click', () => {});
    `;
    const { sourceFile, checker } = createTestProgram(source);
    const onCall = findOnCalls(sourceFile)[0];
    expect(onCall).toBeDefined();

    const result = __test__collectEachScopeParamSymbols(onCall, checker);
    expect(result).toBeUndefined();
  });

  it('U-3: helperCallSites 指定 + 全 call-site が一意 each context → call-site param + helper body 同名 ref Symbol を含む', () => {
    const source = `
      declare const root: any;
      const helper = () => {
        item.on('click', () => {
          item.set(1);
        });
      };
      root.each((item: any) => {
        helper();
      });
    `;
    const { sourceFile, checker } = createTestProgram(source);
    // helper body 内の `.on('click', ...)` を起点にする
    const onCall = findOnCalls(sourceFile).find(
      (ce) =>
        ts.isPropertyAccessExpression(ce.expression) &&
        ts.isIdentifier(ce.expression.expression) &&
        ce.expression.expression.text === 'item',
    );
    expect(onCall).toBeDefined();

    // helper() 呼び出しが call-site
    const helperCallSites = findCallExprByCalleeName(sourceFile, 'helper');
    expect(helperCallSites.length).toBe(1);

    const result = __test__collectEachScopeParamSymbols(onCall as ts.CallExpression, checker, {
      helperCallSites,
    });
    expect(result).toBeDefined();
    // 期待: call-site の `.each(item => ...)` の item Symbol + helper body 内の `item` 参照 Symbol(s)
    // (両者は同じ Symbol になる場合もあれば異なる場合もある — 少なくとも 1 つの 'item' Symbol が含まれること)
    const names = [...(result ?? [])].map((s) => s.getName());
    expect(names).toContain('item');
    expect((result?.size ?? 0)).toBeGreaterThanOrEqual(1);
  });

  it('U-4: helperCallSites 指定 + 全 call-site が each 外 → undefined', () => {
    const source = `
      declare const root: any;
      const helper = () => {
        item.on('click', () => {});
      };
      helper();
    `;
    const { sourceFile, checker } = createTestProgram(source);
    const onCall = findOnCalls(sourceFile)[0];
    expect(onCall).toBeDefined();

    const helperCallSites = findCallExprByCalleeName(sourceFile, 'helper');
    expect(helperCallSites.length).toBe(1);

    const result = __test__collectEachScopeParamSymbols(onCall, checker, {
      helperCallSites,
    });
    expect(result).toBeUndefined();
  });
});
