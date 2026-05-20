/**
 * Task 5.4: whitelist-validator 禁止構文チェッカ テスト
 *
 * 観測可能な完了基準:
 *   4 ケース全て緑:
 *     1. await 式を含むハンドラ → ts.Diagnostic error
 *     2. yield 式を含むハンドラ → ts.Diagnostic error
 *     3. 後置 ++ を含むハンドラ → ts.Diagnostic error
 *     4. デコレータ相当の禁止構文（後置 -- も含む）→ ts.Diagnostic error
 *
 * 対応 requirements: 4.8
 * 対応 design: whitelist-validator, D-1, D-6
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type { HandlerIR } from '../../src/transformer/handler-ir-extractor.ts';
import { validateHandler } from '../../src/transformer/whitelist-validator.ts';

// ---- Feature Flag -------------------------------------------------------

/**
 * Task 5.4 のフィーチャーフラグ。
 * false の間は全テストをスキップする（Feature Flag Protocol の RED フェーズ）。
 */
const FEATURE_FORBIDDEN_SYNTAX = true;

// ---- テスト用ユーティリティ -------------------------------------------------

/**
 * TypeScript プログラムを生成するヘルパー。
 */
function createTestProgram(files: Record<string, string>): {
  program: ts.Program;
  sourceFiles: Map<string, ts.SourceFile>;
} {
  const fileNames = Object.keys(files);
  const sourceFiles = new Map<string, ts.SourceFile>();

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    strict: true,
    noEmit: true,
    experimentalDecorators: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (fileName, languageVersion): ts.SourceFile | undefined => {
    const normalizedName = fileName.replace(/\\/g, '/');
    for (const [name, content] of Object.entries(files)) {
      if (normalizedName.endsWith(name) || normalizedName === name) {
        const sf = ts.createSourceFile(name, content, languageVersion, true);
        sourceFiles.set(name, sf);
        return sf;
      }
    }
    return originalGetSourceFile(fileName, languageVersion);
  };

  host.fileExists = (fileName): boolean => {
    const normalizedName = fileName.replace(/\\/g, '/');
    for (const name of fileNames) {
      if (normalizedName.endsWith(name) || normalizedName === name) {
        return true;
      }
    }
    return ts.sys.fileExists(fileName);
  };

  const program = ts.createProgram(fileNames, compilerOptions, host);
  return { program, sourceFiles };
}

/**
 * ソースコードからハンドラ AST を構築し validateHandler を呼ぶヘルパー。
 * 構文チェックは refs（識別子リスト）には依存しないため、refs は空で渡す。
 */
function buildSyntaxTest(handlerCode: string): {
  diagnostics: ts.Diagnostic[];
} {
  const mainFile = 'main.ts';
  const { program, sourceFiles } = createTestProgram({ [mainFile]: handlerCode });

  const sourceFile = sourceFiles.get(mainFile) ?? program.getSourceFile(mainFile);
  if (sourceFile === undefined) {
    throw new Error(`Source file '${mainFile}' not found`);
  }

  // アロー関数を探す
  let arrowFn: ts.ArrowFunction | undefined;
  function findArrow(node: ts.Node): void {
    if (ts.isArrowFunction(node) && arrowFn === undefined) {
      arrowFn = node;
    }
    ts.forEachChild(node, findArrow);
  }
  findArrow(sourceFile);

  if (arrowFn === undefined) {
    throw new Error(`No ArrowFunction found in: ${handlerCode}`);
  }

  const ir: HandlerIR = {
    node: arrowFn,
    paramName: null,
    paramTypeText: null,
    localDecls: new Set<string>(),
    referencedIdentifiers: [],
    isExpressionBody: !ts.isBlock(arrowFn.body),
  };

  // 禁止構文チェックは識別子リスト（refs）に依存しない。空配列を渡す。
  const diagnostics = validateHandler(ir, [], program, sourceFile);
  return { diagnostics };
}

// ---- テストケース -----------------------------------------------------------

const TEST_TIMEOUT_MS = 30_000;

describe(`whitelist-validator 禁止構文チェッカ (Feature Flag: ${FEATURE_FORBIDDEN_SYNTAX})`, () => {
  it(
    'Case 1: await 式を含むハンドラは ts.Diagnostic error になる',
    () => {
      if (!FEATURE_FORBIDDEN_SYNTAX) return;

      // async arrow function with await
      const code = `
const fn = async () => {
  const x = await Promise.resolve(1);
  return x;
};
`.trimStart();

      const { diagnostics } = buildSyntaxTest(code);
      expect(diagnostics.length).toBeGreaterThan(0);
      const first = diagnostics.at(0);
      expect(first).toBeDefined();
      expect(first?.category).toBe(ts.DiagnosticCategory.Error);
      const msg = first?.messageText as string;
      expect(msg.toLowerCase()).toMatch(/await|forbidden/i);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'Case 2: yield 式を含むハンドラは ts.Diagnostic error になる',
    () => {
      if (!FEATURE_FORBIDDEN_SYNTAX) return;

      // generator-like: yield in arrow body (wrapping in function* to make it valid TS)
      // Note: yield inside a plain arrow body is not valid TS directly,
      // so we simulate by placing an expression that yields a value via a generator call.
      // Instead, we test via a GeneratorFunction arrow wrapper approach.
      // Actually the task says "YieldExpression" detection — the validator should walk
      // the AST and detect ts.SyntaxKind.YieldExpression inside the handler body.
      // We write code where TypeScript parses a yield expression (even if it may
      // produce a type error — the validator runs on the AST regardless).
      const code = `
// @ts-ignore
const fn = () => {
  // @ts-ignore
  yield 42;
};
`.trimStart();

      const { diagnostics } = buildSyntaxTest(code);
      expect(diagnostics.length).toBeGreaterThan(0);
      const first = diagnostics.at(0);
      expect(first).toBeDefined();
      expect(first?.category).toBe(ts.DiagnosticCategory.Error);
      const msg = first?.messageText as string;
      expect(msg.toLowerCase()).toMatch(/yield|forbidden/i);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'Case 3: 後置 ++ を含むハンドラは ts.Diagnostic error になる',
    () => {
      if (!FEATURE_FORBIDDEN_SYNTAX) return;

      const code = `
const fn = () => {
  let x = 0;
  x++;
};
`.trimStart();

      const { diagnostics } = buildSyntaxTest(code);
      expect(diagnostics.length).toBeGreaterThan(0);
      const first = diagnostics.at(0);
      expect(first).toBeDefined();
      expect(first?.category).toBe(ts.DiagnosticCategory.Error);
      const msg = first?.messageText as string;
      expect(msg.toLowerCase()).toMatch(/\+\+|postfix|forbidden/i);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'Case 4: 後置 -- を含むハンドラは ts.Diagnostic error になる',
    () => {
      if (!FEATURE_FORBIDDEN_SYNTAX) return;

      const code = `
const fn = () => {
  let y = 10;
  y--;
};
`.trimStart();

      const { diagnostics } = buildSyntaxTest(code);
      expect(diagnostics.length).toBeGreaterThan(0);
      const first = diagnostics.at(0);
      expect(first).toBeDefined();
      expect(first?.category).toBe(ts.DiagnosticCategory.Error);
      const msg = first?.messageText as string;
      expect(msg.toLowerCase()).toMatch(/--|postfix|forbidden/i);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'Case 5: デコレータを含むハンドラは ts.Diagnostic error になる',
    () => {
      if (!FEATURE_FORBIDDEN_SYNTAX) return;

      // experimentalDecorators: true を使い、アロー関数本体内にデコレータ付きクラスを定義する。
      // TypeScript AST では Decorator ノード (SyntaxKind.Decorator) が生成される。
      const code = `
function log(target: any) { return target; }
const fn = () => {
  @log
  class Inner {}
  return new Inner();
};
`.trimStart();

      const { diagnostics } = buildSyntaxTest(code);
      expect(diagnostics.length).toBeGreaterThan(0);
      const first = diagnostics.at(0);
      expect(first).toBeDefined();
      expect(first?.category).toBe(ts.DiagnosticCategory.Error);
      const msg = first?.messageText as string;
      expect(msg.toLowerCase()).toMatch(/decorator|forbidden/i);
    },
    TEST_TIMEOUT_MS,
  );

  // =============================
  // 追加カバレッジ: prefix ++/-- と 許可される ! / -
  // =============================
  // src/transformer/whitelist-validator.ts:
  //   - L341 分岐: PostfixUnary/PrefixUnary 演算子が ++/-- でない場合は子を継続走査
  //   - L351 cond-expr: isPostfix 三項分岐 (prefix 側)
  // を網羅する。

  it(
    'Case 6: 前置 ++ を含むハンドラは ts.Diagnostic error になる',
    () => {
      if (!FEATURE_FORBIDDEN_SYNTAX) return;

      const code = `
const fn = () => {
  let x = 0;
  ++x;
};
`.trimStart();

      const { diagnostics } = buildSyntaxTest(code);
      expect(diagnostics.length).toBeGreaterThan(0);
      const first = diagnostics.at(0);
      expect(first).toBeDefined();
      expect(first?.category).toBe(ts.DiagnosticCategory.Error);
      const msg = first?.messageText as string;
      // prefix ラベルが含まれることを確認
      expect(msg.toLowerCase()).toMatch(/prefix|\+\+|forbidden/i);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'Case 7: 前置 -- を含むハンドラは ts.Diagnostic error になる',
    () => {
      if (!FEATURE_FORBIDDEN_SYNTAX) return;

      const code = `
const fn = () => {
  let y = 10;
  --y;
};
`.trimStart();

      const { diagnostics } = buildSyntaxTest(code);
      expect(diagnostics.length).toBeGreaterThan(0);
      const first = diagnostics.at(0);
      expect(first).toBeDefined();
      expect(first?.category).toBe(ts.DiagnosticCategory.Error);
      const msg = first?.messageText as string;
      expect(msg.toLowerCase()).toMatch(/prefix|--|forbidden/i);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'Case 8: 前置 ! (論理否定) は許可される (++/-- のみ禁止)',
    () => {
      if (!FEATURE_FORBIDDEN_SYNTAX) return;

      // PrefixUnaryExpression だが演算子は ExclamationToken (!)
      // → validator は子継続走査するだけで diagnostic を生成しない
      const code = `
const fn = () => {
  const flag = true;
  return !flag;
};
`.trimStart();

      const { diagnostics } = buildSyntaxTest(code);
      // 禁止構文 diagnostic は 0 件 (識別子由来は別途許可されているため考慮しない)
      // ここでは forbidden syntax 関連の diagnostic がないことを確認
      const forbiddenSyntaxDiags = diagnostics.filter((d) => {
        const m = typeof d.messageText === 'string' ? d.messageText : '';
        return /prefix|postfix|\+\+|--/i.test(m);
      });
      expect(forbiddenSyntaxDiags).toHaveLength(0);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'Case 9: 前置 - (符号反転) は許可される',
    () => {
      if (!FEATURE_FORBIDDEN_SYNTAX) return;

      // PrefixUnaryExpression だが演算子は MinusToken (-)
      const code = `
const fn = () => {
  const n = 5;
  return -n;
};
`.trimStart();

      const { diagnostics } = buildSyntaxTest(code);
      const forbiddenSyntaxDiags = diagnostics.filter((d) => {
        const m = typeof d.messageText === 'string' ? d.messageText : '';
        return /prefix|postfix|\+\+|--/i.test(m);
      });
      expect(forbiddenSyntaxDiags).toHaveLength(0);
    },
    TEST_TIMEOUT_MS,
  );
});
