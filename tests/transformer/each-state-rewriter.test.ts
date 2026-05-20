/**
 * each-state-rewriter ユニットテスト
 *
 * Task 3.1 (U-1): detectEachScopeContext
 *   - `.on()` が `.each()` コールバック内にある場合 EachScopeContext が返ること
 *   - each スコープ外の `.on()` では null が返ること
 *   Requirements: 1.1
 *
 * Task 3.2 (U-2): buildEachParamNameMap
 *   - EachScopeContext { itemParamName: "item" } から Map { "item" -> "itemId" } が生成されること
 *   Requirements: 1.2
 *
 * Task 3.3 (U-3, U-4): validateEachScopeUsage
 *   - item.get() / item.set(v) の使用で診断が生成されないこと（U-3）
 *   - doSomething(item) / const x = item の使用で DT003 診断が生成されること（U-4）
 *   Requirements: 5
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  buildEachParamNameMap,
  detectEachScopeContext,
  type EachScopeContext,
  validateEachScopeUsage,
} from '../../src/transformer/each-state-rewriter.ts';
import { extractHandlerIR } from '../../src/transformer/handler-ir-extractor.ts';
import { serializeHandler } from '../../src/transformer/handler-serializer.ts';

// ---- テスト用ユーティリティ -------------------------------------------------

/**
 * TypeScript ソースコード文字列からソースファイルを生成し、
 * TypeChecker を持つ Program も返すヘルパー。
 */
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
        cachedSourceFile = ts.createSourceFile(
          fn,
          sourceCode,
          langVersion,
          /* setParentNodes */ true,
        );
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

  // cachedSourceFile が設定されていない場合は program から取得
  const sourceFile =
    cachedSourceFile ??
    (program.getSourceFile(fileName) as ts.SourceFile);

  return { sourceFile, checker };
}

/**
 * AST を再帰的に走査し、条件に一致するノードをすべて返すヘルパー。
 */
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

/**
 * 指定したメソッド名の CallExpression をすべて返すヘルパー。
 */
function findCallsByMethodName(
  root: ts.Node,
  methodName: string,
): ts.CallExpression[] {
  return findAll(root, ts.isCallExpression).filter((call) => {
    const expr = call.expression;
    return (
      ts.isPropertyAccessExpression(expr) && expr.name.text === methodName
    );
  });
}

// ---- U-1: detectEachScopeContext --------------------------------------------

describe('detectEachScopeContext', () => {
  const TEST_TIMEOUT_MS = 15_000;

  it(
    'U-1a: .each() コールバック内の .on() に対して EachScopeContext を返す',
    () => {
      const source = `
const todos = {
  each: (fn: (item: any) => void) => fn({})
};
const x = { on: (e: string, fn: () => void) => {} };
todos.each((item) => {
  x.on("click", () => {
    // .on() call is inside .each() callback
  });
});
`.trimStart();

      const { sourceFile, checker } = createTestProgram(source);

      // .on() CallExpression を取得
      const onCalls = findCallsByMethodName(sourceFile, 'on');
      expect(onCalls.length).toBeGreaterThanOrEqual(1);

      const onCall = onCalls[0];
      const result = detectEachScopeContext(onCall, checker);

      expect(result).not.toBeNull();
      expect(result?.itemParamName).toBe('item');
      expect(result?.factoryParamName).toBe('itemId');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-1b: .each() コールバックのパラメータ名が "todo" の場合、itemParamName は "todo" になる',
    () => {
      const source = `
const todos = {
  each: (fn: (todo: any) => void) => fn({})
};
const x = { on: (e: string, fn: () => void) => {} };
todos.each((todo) => {
  x.on("click", () => {});
});
`.trimStart();

      const { sourceFile, checker } = createTestProgram(source);

      const onCalls = findCallsByMethodName(sourceFile, 'on');
      expect(onCalls.length).toBeGreaterThanOrEqual(1);

      const onCall = onCalls[0];
      const result = detectEachScopeContext(onCall, checker);

      expect(result).not.toBeNull();
      expect(result?.itemParamName).toBe('todo');
      expect(result?.factoryParamName).toBe('itemId');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-1c: each スコープ外の .on() では null が返る',
    () => {
      const source = `
const x = { on: (e: string, fn: () => void) => {} };
// .on() は .each() コールバック外にある
x.on("click", () => {});
`.trimStart();

      const { sourceFile, checker } = createTestProgram(source);

      const onCalls = findCallsByMethodName(sourceFile, 'on');
      expect(onCalls.length).toBeGreaterThanOrEqual(1);

      const onCall = onCalls[0];
      const result = detectEachScopeContext(onCall, checker);

      expect(result).toBeNull();
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-1d: each 以外のコールバック内の .on() では null が返る',
    () => {
      const source = `
const x = { on: (e: string, fn: () => void) => {} };
const arr = [1, 2, 3];
// .map() コールバック内の .on()（each ではない）
arr.map((item) => {
  x.on("click", () => {});
});
`.trimStart();

      const { sourceFile, checker } = createTestProgram(source);

      const onCalls = findCallsByMethodName(sourceFile, 'on');
      expect(onCalls.length).toBeGreaterThanOrEqual(1);

      const onCall = onCalls[0];
      const result = detectEachScopeContext(onCall, checker);

      expect(result).toBeNull();
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-1e: .on() が直接 .each() コールバック外の通常アロー内にある場合は null が返る',
    () => {
      const source = `
const x = { on: (e: string, fn: () => void) => {} };
const handler = () => {
  x.on("click", () => {});
};
`.trimStart();

      const { sourceFile, checker } = createTestProgram(source);

      const onCalls = findCallsByMethodName(sourceFile, 'on');
      expect(onCalls.length).toBeGreaterThanOrEqual(1);

      const onCall = onCalls[0];
      const result = detectEachScopeContext(onCall, checker);

      expect(result).toBeNull();
    },
    TEST_TIMEOUT_MS,
  );
});

// ---- U-2: buildEachParamNameMap ---------------------------------------------

describe('buildEachParamNameMap', () => {
  it('U-2a: EachScopeContext { itemParamName: "item" } から Map { "item" -> "itemId" } が生成される', () => {
    const context: EachScopeContext = {
      itemParamName: 'item',
      factoryParamName: 'itemId',
    };

    const result = buildEachParamNameMap(context);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(1);
    expect(result.get('item')).toBe('itemId');
  });

  it('U-2b: カスタムパラメータ名でも正しくマップが生成される', () => {
    const context: EachScopeContext = {
      itemParamName: 'todo',
      factoryParamName: 'itemId',
    };

    const result = buildEachParamNameMap(context);

    expect(result.size).toBe(1);
    expect(result.get('todo')).toBe('itemId');
    expect(result.has('item')).toBe(false);
  });

  it('U-2c: factoryParamName が常に "itemId" であること', () => {
    const context: EachScopeContext = {
      itemParamName: 'row',
      factoryParamName: 'itemId',
    };

    const result = buildEachParamNameMap(context);

    expect(result.get('row')).toBe('itemId');
  });
});

// ---- U-3, U-4: validateEachScopeUsage ---------------------------------------

describe('validateEachScopeUsage', () => {
  const TEST_TIMEOUT_MS = 15_000;

  const eachContext: EachScopeContext = {
    itemParamName: 'item',
    factoryParamName: 'itemId',
  };

  /**
   * ソースコードから最初の ArrowFunction ノードを取得するヘルパー。
   */
  function getFirstArrowFunction(sourceFile: ts.SourceFile): ts.ArrowFunction {
    const arrows = findAll(sourceFile, ts.isArrowFunction);
    if (arrows.length === 0) {
      throw new Error('No ArrowFunction found in source');
    }
    return arrows[0];
  }

  // U-3: サポート対象パターン（診断なし）

  it(
    'U-3a: item.get() の使用で診断が生成されない',
    () => {
      const source = `
const handler = () => {
  item.get();
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunction(sourceFile);
      const diagnostics = validateEachScopeUsage(arrowFn, eachContext, sourceFile);

      expect(diagnostics).toHaveLength(0);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-3b: item.set(v) の使用で診断が生成されない',
    () => {
      const source = `
const v = 42;
const handler = () => {
  item.set(v);
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunction(sourceFile);
      const diagnostics = validateEachScopeUsage(arrowFn, eachContext, sourceFile);

      expect(diagnostics).toHaveLength(0);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-3c: item.done などのプロパティアクセスで診断が生成されない',
    () => {
      const source = `
const handler = () => {
  const val = item.done;
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunction(sourceFile);
      const diagnostics = validateEachScopeUsage(arrowFn, eachContext, sourceFile);

      expect(diagnostics).toHaveLength(0);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-3d: item を一切使わない場合は診断が生成されない',
    () => {
      const source = `
const handler = () => {
  const x = 1 + 2;
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunction(sourceFile);
      const diagnostics = validateEachScopeUsage(arrowFn, eachContext, sourceFile);

      expect(diagnostics).toHaveLength(0);
    },
    TEST_TIMEOUT_MS,
  );

  // U-4: サポート外パターン（DT003 診断あり）

  it(
    'U-4a: doSomething(item) の使用で DT003 診断が生成される',
    () => {
      const source = `
declare function doSomething(x: any): void;
const handler = () => {
  doSomething(item);
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunction(sourceFile);
      const diagnostics = validateEachScopeUsage(arrowFn, eachContext, sourceFile);

      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      const dt003 = diagnostics.find((d) => d.code === 9003);
      expect(dt003).toBeDefined();
      expect(dt003?.category).toBe(ts.DiagnosticCategory.Error);
      expect(typeof dt003?.messageText === 'string' && dt003.messageText.includes('DT003')).toBe(true);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-4b: const x = item の使用で DT003 診断が生成される',
    () => {
      const source = `
const handler = () => {
  const x = item;
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunction(sourceFile);
      const diagnostics = validateEachScopeUsage(arrowFn, eachContext, sourceFile);

      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      const dt003 = diagnostics.find((d) => d.code === 9003);
      expect(dt003).toBeDefined();
      expect(dt003?.category).toBe(ts.DiagnosticCategory.Error);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-4c: return item の使用で DT003 診断が生成される',
    () => {
      const source = `
const handler = () => {
  return item;
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunction(sourceFile);
      const diagnostics = validateEachScopeUsage(arrowFn, eachContext, sourceFile);

      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      const dt003 = diagnostics.find((d) => d.code === 9003);
      expect(dt003).toBeDefined();
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-4d: DT003 診断メッセージに識別子名とサポート対象例が含まれる',
    () => {
      const source = `
declare function fn(x: any): void;
const handler = () => {
  fn(item);
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunction(sourceFile);
      const diagnostics = validateEachScopeUsage(arrowFn, eachContext, sourceFile);

      expect(diagnostics.length).toBeGreaterThanOrEqual(1);
      const diag = diagnostics[0];
      const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
      expect(msg).toContain('item');
      expect(msg).toContain('item.get()');
      expect(msg).toContain('item.set(v)');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-4e: item.get() と doSomething(item) が混在する場合、サポート外のみ診断される',
    () => {
      const source = `
declare function doSomething(x: any): void;
const handler = () => {
  item.get();         // OK
  doSomething(item);  // NG -> DT003
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunction(sourceFile);
      const diagnostics = validateEachScopeUsage(arrowFn, eachContext, sourceFile);

      // item.get() は OK、doSomething(item) のみ DT003
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].code).toBe(9003);
    },
    TEST_TIMEOUT_MS,
  );
});

// ---- U-5: serializeHandler — each スコープの動的ステートID出力 ---------------

describe('U-5: serializeHandler — each スコープの動的ステートID出力', () => {
  const TEST_TIMEOUT_MS = 15_000;

  /**
   * ソースコード文字列から最初の ArrowFunction ノードを取得するヘルパー。
   */
  function getFirstArrowFunctionFromSource(sourceFile: ts.SourceFile): ts.ArrowFunction {
    const arrows: ts.ArrowFunction[] = [];
    function visit(node: ts.Node): void {
      if (ts.isArrowFunction(node)) arrows.push(node);
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    if (arrows.length === 0) {
      throw new Error('No ArrowFunction found in source');
    }
    return arrows[0];
  }

  it(
    'U-5a: item.set() を含むハンドラが __draftole__.state(itemId).set() を出力する',
    () => {
      const source = `
const handler = (e) => {
  item.set({ done: true });
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunctionFromSource(sourceFile);
      const { ir } = extractHandlerIR(arrowFn, sourceFile);

      if (ir === undefined) throw new Error('ir should be defined');

      const eachScopeParams = new Map<string, string>([['item', 'itemId']]);
      const result = serializeHandler({
        ir,
        stateIdMap: new Map(),
        eachScopeParams,
      });

      // __draftole__.state(itemId).set( を含む（Identifier 引数）
      expect(result.code).toContain('__draftole__.state(itemId).set(');
      // 生の item.set( は残っていない
      expect(result.code).not.toContain('item.set(');
      // StringLiteral 引数の誤った形式 __draftole__.state("item") は出力されない
      expect(result.code).not.toContain('__draftole__.state("item")');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-5b: item.get() を含むハンドラが __draftole__.state(itemId).get() を出力する',
    () => {
      const source = `
const handler = (e) => {
  const val = item.get();
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunctionFromSource(sourceFile);
      const { ir } = extractHandlerIR(arrowFn, sourceFile);

      if (ir === undefined) throw new Error('ir should be defined');

      const eachScopeParams = new Map<string, string>([['item', 'itemId']]);
      const result = serializeHandler({
        ir,
        stateIdMap: new Map(),
        eachScopeParams,
      });

      // __draftole__.state(itemId).get() を含む（Identifier 引数）
      expect(result.code).toContain('__draftole__.state(itemId).get()');
      // 生の item.get( は残っていない
      expect(result.code).not.toContain('item.get(');
      // StringLiteral 引数の誤った形式は出力されない
      expect(result.code).not.toContain('__draftole__.state("item")');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-5c: item.set() と item.get() を組み合わせた spread パターンを正しく変換する',
    () => {
      const source = `
const handler = (e) => {
  item.set({ ...item.get(), done: true });
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunctionFromSource(sourceFile);
      const { ir } = extractHandlerIR(arrowFn, sourceFile);

      if (ir === undefined) throw new Error('ir should be defined');

      const eachScopeParams = new Map<string, string>([['item', 'itemId']]);
      const result = serializeHandler({
        ir,
        stateIdMap: new Map(),
        eachScopeParams,
      });

      // set と get 両方が変換されている
      expect(result.code).toContain('__draftole__.state(itemId).set(');
      expect(result.code).toContain('__draftole__.state(itemId).get()');
      // 生の item.set( / item.get( は残っていない
      expect(result.code).not.toContain('item.set(');
      expect(result.code).not.toContain('item.get(');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-5d: Identifier 引数（非 StringLiteral）であることを確認する',
    () => {
      const source = `
const handler = () => {
  item.set(42);
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunctionFromSource(sourceFile);
      const { ir } = extractHandlerIR(arrowFn, sourceFile);

      if (ir === undefined) throw new Error('ir should be defined');

      const eachScopeParams = new Map<string, string>([['item', 'itemId']]);
      const result = serializeHandler({
        ir,
        stateIdMap: new Map(),
        eachScopeParams,
      });

      // Identifier 引数: state(itemId) — クォートなし
      expect(result.code).toContain('state(itemId)');
      // StringLiteral 引数: state("itemId") — クォートあり → 出力されてはならない
      expect(result.code).not.toContain('state("itemId")');
      // StringLiteral 引数: state("item") — クォートあり → 出力されてはならない
      expect(result.code).not.toContain('state("item")');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'U-5e: eachScopeParams なしで呼ぶと item が変換されずそのまま残る（退行防止）',
    () => {
      const source = `
const handler = () => {
  item.set(42);
};
`.trimStart();

      const { sourceFile } = createTestProgram(source);
      const arrowFn = getFirstArrowFunctionFromSource(sourceFile);
      const { ir } = extractHandlerIR(arrowFn, sourceFile);

      if (ir === undefined) throw new Error('ir should be defined');

      // eachScopeParams を渡さない
      const result = serializeHandler({
        ir,
        stateIdMap: new Map(),
      });

      // 変換されずに item.set( がそのまま残る
      expect(result.code).toContain('item.set(');
      // __draftole__.state(itemId) は出力されない
      expect(result.code).not.toContain('__draftole__.state(itemId)');
    },
    TEST_TIMEOUT_MS,
  );
});

// ---- TXDX-2: helper-aware walk-up -------------------------------------------

describe('TXDX-2: detectEachScopeContext with options.helperCallSites', () => {
  /**
   * `source` から `helper` を呼び出す CallExpression と
   * `helper` 本体内の `.on(...)` CallExpression を取り出す。
   */
  function fixture(source: string): {
    onCallExpr: ts.CallExpression;
    helperCallSites: ts.CallExpression[];
    checker: ts.TypeChecker;
  } {
    const { sourceFile, checker } = createTestProgram(source);
    let onCallExpr: ts.CallExpression | undefined;
    const helperCallSites: ts.CallExpression[] = [];

    function visit(node: ts.Node): void {
      if (
        onCallExpr === undefined &&
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'on'
      ) {
        onCallExpr = node;
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'helper'
      ) {
        helperCallSites.push(node);
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    if (onCallExpr === undefined) throw new Error('.on() not found in fixture');
    return { onCallExpr, helperCallSites, checker };
  }

  it('single call-site inside .each → inherits each scope', () => {
    const { onCallExpr, helperCallSites, checker } = fixture(`
      const helper = () => obj.on("click", () => item.set(0));
      todos.each(item => helper());
    `);
    expect(helperCallSites.length).toBe(1);
    const ctx = detectEachScopeContext(onCallExpr, checker, { helperCallSites });
    expect(ctx).not.toBeNull();
    expect(ctx?.itemParamName).toBe('item');
    expect(ctx?.factoryParamName).toBe('itemId');
  });

  it('all call-sites outside .each → null (legitimate each-外)', () => {
    const { onCallExpr, helperCallSites, checker } = fixture(`
      const helper = () => obj.on("click", () => {});
      helper();
      helper();
    `);
    expect(helperCallSites.length).toBe(2);
    const ctx = detectEachScopeContext(onCallExpr, checker, { helperCallSites });
    expect(ctx).toBeNull();
  });

  it("mixed (one inside .each, one outside) → 'ambiguous'", () => {
    const { onCallExpr, helperCallSites, checker } = fixture(`
      const helper = () => obj.on("click", () => {});
      todos.each(item => helper());
      helper();
    `);
    expect(helperCallSites.length).toBe(2);
    const ctx = detectEachScopeContext(onCallExpr, checker, { helperCallSites });
    expect(ctx).toBe('ambiguous');
  });

  it("different itemParamName across call-sites → 'ambiguous'", () => {
    const { onCallExpr, helperCallSites, checker } = fixture(`
      const helper = () => obj.on("click", () => {});
      todos.each(item => helper());
      others.each(row => helper());
    `);
    expect(helperCallSites.length).toBe(2);
    const ctx = detectEachScopeContext(onCallExpr, checker, { helperCallSites });
    expect(ctx).toBe('ambiguous');
  });

  // ---- TXDX-DX Task 2.1: 3-state return type (context | null | 'ambiguous') ----

  it("3-state: all call-sites inside same .each → returns EachScopeContext (not 'ambiguous')", () => {
    const { onCallExpr, helperCallSites, checker } = fixture(`
      const helper = () => obj.on("click", () => {});
      todos.each(item => helper());
      others.each(item => helper());
    `);
    const ctx = detectEachScopeContext(onCallExpr, checker, { helperCallSites });
    expect(ctx).not.toBeNull();
    expect(ctx).not.toBe('ambiguous');
    expect(typeof ctx).toBe('object');
    if (ctx !== null && ctx !== 'ambiguous') {
      expect(ctx.itemParamName).toBe('item');
    }
  });

  it("3-state: all call-sites outside .each → strictly null (not 'ambiguous')", () => {
    const { onCallExpr, helperCallSites, checker } = fixture(`
      const helper = () => obj.on("click", () => {});
      helper();
      helper();
    `);
    const ctx = detectEachScopeContext(onCallExpr, checker, { helperCallSites });
    expect(ctx).toBeNull();
    expect(ctx).not.toBe('ambiguous');
  });

  it("3-state: direct AST walk-up path (no helperCallSites) never returns 'ambiguous'", () => {
    const { onCallExpr, checker } = fixture(`
      const helper = () => obj.on("click", () => {});
      todos.each(item => helper());
    `);
    const ctx = detectEachScopeContext(onCallExpr, checker);
    // helper 非経路 → null のみ (never 'ambiguous')
    expect(ctx).toBeNull();
    expect(ctx).not.toBe('ambiguous');
  });

  it('all call-sites with same itemParamName → inherits that scope', () => {
    const { onCallExpr, helperCallSites, checker } = fixture(`
      const helper = () => obj.on("click", () => {});
      todos.each(item => helper());
      others.each(item => helper());
    `);
    expect(helperCallSites.length).toBe(2);
    const ctx = detectEachScopeContext(onCallExpr, checker, { helperCallSites });
    expect(ctx).not.toBeNull();
    expect(ctx?.itemParamName).toBe('item');
  });

  it('options omitted → legacy behavior (no inheritance)', () => {
    const { onCallExpr, checker } = fixture(`
      const helper = () => obj.on("click", () => {});
      todos.each(item => helper());
    `);
    const ctx = detectEachScopeContext(onCallExpr, checker);
    expect(ctx).toBeNull();
  });

  it('empty helperCallSites → null (treated as no inheritance)', () => {
    const { onCallExpr, checker } = fixture(`
      const helper = () => obj.on("click", () => {});
    `);
    const ctx = detectEachScopeContext(onCallExpr, checker, { helperCallSites: [] });
    expect(ctx).toBeNull();
  });
});
