/**
 * inline-recovery 単体テスト
 *
 * 仕様: `.kiro/specs/transformer-inline-recovery-spec/design.md` §10
 * 検証対象: classifyHelperCandidates / buildInlineMap / buildRejectionDiagnostics
 *
 * 7 ケース:
 *   1. ゼロ引数 module-level const arrow → accepted
 *   2. 引数付き呼び出し → has-arguments
 *   3. パラメータ付き helper → has-parameters
 *   4. function 宣言 helper → function-declaration
 *   5. ブロック内宣言 → not-module-level
 *   6. let 宣言 arrow → mutable-binding
 *   7. 解決不能 Identifier → 候補列挙対象外
 *
 * 加えて: 宣言側 param>0 かつ呼び出し側 args>0 で has-parameters が確定する優先順位ケース
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { extractHandlerIR } from '../../src/transformer/handler-ir-extractor.ts';
import { collectIdentifiers } from '../../src/transformer/identifier-collector.ts';
import {
  buildInlineMap,
  buildRejectionDiagnostics,
  classifyHelperCandidates,
  runInlineRecoveryBranch,
  tryInlineRecovery,
  type HelperClassification,
} from '../../src/transformer/inline-recovery.ts';
import type {
  TransformerBaseContext,
  ValidationOutcome,
} from '../../src/transformer/per-call-context.ts';
import { createSourceStateNameFallback } from '../../src/transformer/state-id-fallback.ts';

// ---- ヘルパー: ts.Program と handler ArrowFunction を作る -----------------

interface Setup {
  classifications: readonly HelperClassification[];
  sourceFile: ts.SourceFile;
}

/**
 * `source` 中の `const handler = () => { ... };` を見つけて
 * その ArrowFunction に対して classifyHelperCandidates を適用する。
 */
function setup(source: string, fileName = 'test.ts'): Setup {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    strict: false,
    noEmit: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  let sf: ts.SourceFile | undefined;
  host.getSourceFile = (name, langVer): ts.SourceFile | undefined => {
    if (name === fileName || name.endsWith(fileName)) {
      sf = ts.createSourceFile(name, source, langVer, true);
      return sf;
    }
    return originalGetSourceFile(name, langVer);
  };
  host.fileExists = (name): boolean => {
    if (name === fileName || name.endsWith(fileName)) return true;
    return ts.sys.fileExists(name);
  };
  host.readFile = (name): string | undefined => {
    if (name === fileName || name.endsWith(fileName)) return source;
    return ts.sys.readFile(name);
  };

  const program = ts.createProgram([fileName], compilerOptions, host);
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) throw new Error('failed to load source file');
  const checker = program.getTypeChecker();

  // handler という名前のアロー関数を見つける
  let handlerArrow: ts.ArrowFunction | undefined;
  function visit(node: ts.Node): void {
    if (handlerArrow !== undefined) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'handler' &&
      node.initializer !== undefined &&
      ts.isArrowFunction(node.initializer)
    ) {
      handlerArrow = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (handlerArrow === undefined) throw new Error('handler arrow not found');

  const classifications = classifyHelperCandidates(handlerArrow, sourceFile, checker);
  return { classifications, sourceFile };
}

// ---- テスト ---------------------------------------------------------------

describe('inline-recovery / classifyHelperCandidates', () => {
  it('case 1: ゼロ引数 module-level const arrow → accepted', () => {
    const { classifications } = setup(`
      const h = () => {};
      const handler = () => { h(); };
    `);
    expect(classifications).toHaveLength(1);
    expect(classifications[0].kind).toBe('accepted');
    expect(classifications[0].name).toBe('h');
  });

  it('case 2: 引数付き呼び出し（zero-param 宣言） → has-arguments', () => {
    const { classifications } = setup(`
      const h = () => {};
      const handler = () => { h(1); };
    `);
    expect(classifications).toHaveLength(1);
    const c = classifications[0];
    expect(c.kind).toBe('rejected');
    if (c.kind !== 'rejected') return;
    expect(c.reason.code).toBe('has-arguments');
    if (c.reason.code !== 'has-arguments') return;
    expect(c.reason.argCount).toBe(1);
  });

  it('case 3: パラメータ付き helper（呼び出し 0 引数） → has-parameters', () => {
    const { classifications } = setup(`
      const h = (x: number) => {};
      const handler = () => { h(); };
    `);
    expect(classifications).toHaveLength(1);
    const c = classifications[0];
    expect(c.kind).toBe('rejected');
    if (c.kind !== 'rejected') return;
    expect(c.reason.code).toBe('has-parameters');
    if (c.reason.code !== 'has-parameters') return;
    expect(c.reason.paramCount).toBe(1);
  });

  it('case 4: function 宣言 helper → function-declaration', () => {
    const { classifications } = setup(`
      function h() {}
      const handler = () => { h(); };
    `);
    expect(classifications).toHaveLength(1);
    const c = classifications[0];
    expect(c.kind).toBe('rejected');
    if (c.kind !== 'rejected') return;
    expect(c.reason.code).toBe('function-declaration');
  });

  it('case 5: ブロック内宣言 helper → not-module-level', () => {
    const { classifications } = setup(`
      function outer() {
        const h = () => {};
        const handler = () => { h(); };
        return handler;
      }
    `);
    expect(classifications).toHaveLength(1);
    const c = classifications[0];
    expect(c.kind).toBe('rejected');
    if (c.kind !== 'rejected') return;
    expect(c.reason.code).toBe('not-module-level');
  });

  it('case 6: let 宣言 arrow → mutable-binding', () => {
    const { classifications } = setup(`
      let h = () => {};
      const handler = () => { h(); };
    `);
    expect(classifications).toHaveLength(1);
    const c = classifications[0];
    expect(c.kind).toBe('rejected');
    if (c.kind !== 'rejected') return;
    expect(c.reason.code).toBe('mutable-binding');
  });

  it('case 7: 解決不能 Identifier は候補列挙対象外', () => {
    const { classifications } = setup(`
      const handler = () => { h(); };
    `);
    expect(classifications).toHaveLength(0);
  });

  it('優先順位: 宣言側 param>0 かつ呼び出し側 args>0 → has-parameters が勝つ', () => {
    const { classifications } = setup(`
      const h = (x: number) => {};
      const handler = () => { h(1); };
    `);
    expect(classifications).toHaveLength(1);
    const c = classifications[0];
    expect(c.kind).toBe('rejected');
    if (c.kind !== 'rejected') return;
    expect(c.reason.code).toBe('has-parameters');
  });
});

describe('inline-recovery / buildInlineMap', () => {
  it('採用候補のみが Map に含まれる', () => {
    const { classifications } = setup(`
      const accepted = () => {};
      const withArgs = () => {};
      const handler = () => { accepted(); withArgs(1); };
    `);
    const map = buildInlineMap(classifications);
    expect(map.size).toBe(1);
    expect(map.has('accepted')).toBe(true);
    expect(map.has('withArgs')).toBe(false);
  });

  it('classifications が空なら空の Map を返す', () => {
    const map = buildInlineMap([]);
    expect(map.size).toBe(0);
  });
});

describe('inline-recovery / buildRejectionDiagnostics', () => {
  it('rejected 候補ごとに DT012 診断を 1 件生成する', () => {
    const { classifications, sourceFile } = setup(`
      const a = (x: number) => {};
      const b = () => {};
      function c() {}
      const handler = () => { a(); b(1); c(); };
    `);
    const diags = buildRejectionDiagnostics(
      classifications,
      sourceFile,
      ts.DiagnosticCategory.Suggestion,
    );
    expect(diags).toHaveLength(3);
    for (const d of diags) {
      expect(d.code).toBe(9012);
      expect(d.category).toBe(ts.DiagnosticCategory.Suggestion);
      expect(typeof d.messageText).toBe('string');
      expect(d.messageText as string).toMatch(/^DT012: /);
      expect(d.relatedInformation).toBeDefined();
      expect(d.relatedInformation?.[0]?.messageText).toMatch(/^reason: /);
    }
  });

  it('category = Warning を渡すと診断カテゴリが Warning になる', () => {
    const { classifications, sourceFile } = setup(`
      const h = (x: number) => {};
      const handler = () => { h(); };
    `);
    const diags = buildRejectionDiagnostics(
      classifications,
      sourceFile,
      ts.DiagnosticCategory.Warning,
    );
    expect(diags).toHaveLength(1);
    expect(diags[0].category).toBe(ts.DiagnosticCategory.Warning);
  });

  it('accepted のみの場合は空配列を返す', () => {
    const { classifications, sourceFile } = setup(`
      const h = () => {};
      const handler = () => { h(); };
    `);
    const diags = buildRejectionDiagnostics(
      classifications,
      sourceFile,
      ts.DiagnosticCategory.Suggestion,
    );
    expect(diags).toHaveLength(0);
  });
});

// ---- tryInlineRecovery 直接 unit test (task 2.4) ----------------------------
//
// 検証する 3 経路:
//   (a) recovery 成功: zero-param module-level helper が state を解決
//       → InlineRecoveryResult { stateIdMap, inlineMap, rejectionDiagnostics } を返す
//   (b) recovery 失敗 + DT012: helper が has-parameters で reject される
//       → { rejectionDiagnostics } を返す (stateIdMap / inlineMap なし)
//   (c) recovery 失敗時も rejectionDiagnostics は失われない
//       (caller が DT012 を発行できるよう preservation を保証)

/**
 * source 中の `handler` arrow に対する tryInlineRecovery / runInlineRecoveryBranch
 * 入力一式を組み立てる module-level helper。describe 間で共有する。
 */
function setupTryRecovery(source: string, fileName = 'recovery.ts'): {
  arrowFn: ts.ArrowFunction;
  ir: ReturnType<typeof extractHandlerIR>['ir'];
  refs: ReturnType<typeof collectIdentifiers>;
  checker: ts.TypeChecker;
  program: ts.Program;
  sourceFile: ts.SourceFile;
  fallback: ReturnType<typeof createSourceStateNameFallback>;
} {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    strict: false,
    noEmit: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, langVer): ts.SourceFile | undefined => {
    if (name === fileName || name.endsWith(fileName)) {
      return ts.createSourceFile(name, source, langVer, true);
    }
    return originalGetSourceFile(name, langVer);
  };
  host.fileExists = (name): boolean => {
    if (name === fileName || name.endsWith(fileName)) return true;
    return ts.sys.fileExists(name);
  };
  host.readFile = (name): string | undefined => {
    if (name === fileName || name.endsWith(fileName)) return source;
    return ts.sys.readFile(name);
  };

  const program = ts.createProgram([fileName], compilerOptions, host);
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) throw new Error('source file not found');
  const checker = program.getTypeChecker();

  let arrowFn: ts.ArrowFunction | undefined;
  function visit(node: ts.Node): void {
    if (arrowFn !== undefined) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'handler' &&
      node.initializer !== undefined &&
      ts.isArrowFunction(node.initializer)
    ) {
      arrowFn = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (arrowFn === undefined) throw new Error('handler arrow not found');

  const { ir } = extractHandlerIR(arrowFn, sourceFile);
  if (ir === undefined) throw new Error('extractHandlerIR returned no ir');
  const refs = collectIdentifiers(ir);
  const fallback = createSourceStateNameFallback(sourceFile, checker);

  return { arrowFn, ir, refs, checker, program, sourceFile, fallback };
}

describe('inline-recovery / tryInlineRecovery', () => {
  it('(a) recovery 成功: zero-param module-level helper が state を解決 → InlineRecoveryResult', () => {
    const { arrowFn, ir, refs, checker, program, sourceFile, fallback } = setupTryRecovery(`
      declare const DraftoleStateMarker: unique symbol;
      interface WritableState<T> {
        readonly [DraftoleStateMarker]: "state";
        readonly _runtimeId: string;
        get(): T;
        set(value: T): void;
      }
      declare function state<T>(initial: T): WritableState<T>;

      const count: WritableState<number> & { readonly _runtimeId: "count-id" } = state(0) as any;
      const reset = () => { count.set(0); };
      const handler = () => { reset(); };
    `);

    const result = tryInlineRecovery(
      arrowFn, ir, refs, checker, program, sourceFile,
      undefined, false, fallback, ts.DiagnosticCategory.Suggestion,
    );

    expect(result).toBeDefined();
    if (result === undefined) throw new Error('expected recovery result');
    // success path: stateIdMap と inlineMap が存在
    expect('stateIdMap' in result).toBe(true);
    if (!('stateIdMap' in result)) return;
    expect(result.inlineMap.size).toBe(1);
    expect(result.inlineMap.has('reset')).toBe(true);
    // count Symbol が stateIdMap に解決されている
    const countResolved = [...result.stateIdMap.entries()].some(
      ([sym, id]) => sym.getName() === 'count' && id === 'count-id',
    );
    expect(countResolved).toBe(true);
  });

  it('(b) recovery 失敗 + DT012: helper が has-parameters で reject → { rejectionDiagnostics }', () => {
    const { arrowFn, ir, refs, checker, program, sourceFile, fallback } = setupTryRecovery(`
      // helper にパラメータがあるため has-parameters で reject (DT012 発行対象)
      const withParam = (x: number) => { void x; };
      const handler = () => { withParam(); };
    `);

    const result = tryInlineRecovery(
      arrowFn, ir, refs, checker, program, sourceFile,
      undefined, false, fallback, ts.DiagnosticCategory.Suggestion,
    );

    // inlineMap が空 + rejectionDiagnostics あり → { rejectionDiagnostics } 返却
    expect(result).toBeDefined();
    if (result === undefined) throw new Error('expected recovery result');
    expect('stateIdMap' in result).toBe(false);
    expect('rejectionDiagnostics' in result).toBe(true);
    if (!('rejectionDiagnostics' in result)) return;
    expect(result.rejectionDiagnostics.length).toBe(1);
    expect(result.rejectionDiagnostics[0].code).toBe(9012);
    const msg = result.rejectionDiagnostics[0].messageText;
    const msgText = typeof msg === 'string' ? msg : msg.messageText;
    expect(msgText).toContain('withParam');
  });

  it('(c) inlineMap 空 + rejection なし → undefined (skip 経路)', () => {
    // 関数呼び出しゼロのハンドラ → 候補なし → undefined
    const { arrowFn, ir, refs, checker, program, sourceFile, fallback } = setupTryRecovery(`
      const handler = () => { void 0; };
    `);

    const result = tryInlineRecovery(
      arrowFn, ir, refs, checker, program, sourceFile,
      undefined, false, fallback, ts.DiagnosticCategory.Suggestion,
    );

    // 何もすることが無い → undefined (caller は recovery 不要と判断)
    expect(result).toBeUndefined();
  });
});

// ---- runInlineRecoveryBranch 直接 unit test (task 3.3) ----------------------
//
// Phase 4a delegate の 2 経路を検証する:
//   (a) recovery 成功時 outcome.success === true、diagnostics は rejectionDiagnostics のみ
//       (元の validation エラーは superseded されて含まれない)
//   (b) recovery 失敗時に元の validation エラーが outcome.diagnostics に preserved
//       (DT012 rejection と concat されて caller に発行される)

describe('inline-recovery / runInlineRecoveryBranch', () => {
  function setupBranch(source: string): {
    base: TransformerBaseContext;
    callInfo: { callExpr: ts.CallExpression; eventArg: ts.StringLiteral; handlerArg: ts.ArrowFunction };
    ir: ReturnType<typeof extractHandlerIR>['ir'] & object;
  } {
    const r = setupTryRecovery(source);
    if (r.ir === undefined) throw new Error('ir undefined');

    const base: TransformerBaseContext = {
      program: r.program,
      checker: r.checker,
      sourceFile: r.sourceFile,
      extraWhitelist: [],
      strictHelpers: false,
      helperCallSites: [],
      fallback: r.fallback,
      debug: false,
    };
    // callInfo を構築するため source 内で最初の .on(...) を探す
    let onCall: ts.CallExpression | undefined;
    function visit(node: ts.Node): void {
      if (onCall !== undefined) return;
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'on'
      ) {
        onCall = node;
        return;
      }
      ts.forEachChild(node, visit);
    }
    visit(r.sourceFile);
    if (onCall === undefined) {
      // .on() がない場合は handler arrow を擬似的に CallExpression として包む必要があるが、
      // 本テストは .on() ありの fixture を前提とする
      throw new Error('.on(...) not found in source');
    }
    const eventArg = onCall.arguments[0];
    if (eventArg === undefined || !ts.isStringLiteral(eventArg)) {
      throw new Error('event arg must be StringLiteral');
    }
    return {
      base,
      callInfo: { callExpr: onCall, eventArg, handlerArg: r.arrowFn },
      ir: r.ir,
    };
  }

  it('(a) recovery 成功: success=true、diagnostics に元の validation エラーは含まれない', () => {
    // helper が state を解決できる構成 → success=true
    const { base, callInfo, ir } = setupBranch(`
      declare const DraftoleStateMarker: unique symbol;
      interface WritableState<T> {
        readonly [DraftoleStateMarker]: "state";
        readonly _runtimeId: string;
        get(): T;
        set(value: T): void;
      }
      declare function state<T>(initial: T): WritableState<T>;
      declare const obj: { on(e: string, cb: () => void): void };

      const count: WritableState<number> & { readonly _runtimeId: "count-id" } = state(0) as any;
      const reset = () => { count.set(0); };
      obj.on("click", () => { reset(); });
      const handler = () => { reset(); };
    `);

    // 元の validation 診断 (faux Error) を渡す → success 時は superseded されて含まれない
    const fauxOriginalError: ts.Diagnostic = {
      file: base.sourceFile,
      start: 0,
      length: 1,
      messageText: 'original validation error (should be superseded)',
      category: ts.DiagnosticCategory.Error,
      code: 9999,
      source: 'test',
    };
    const validation: ValidationOutcome = {
      hasErrors: true,
      diagnostics: [fauxOriginalError],
    };
    const outcome = runInlineRecoveryBranch(base, callInfo, ir, validation);

    expect(outcome.success).toBe(true);
    expect(outcome.inlineMap).toBeDefined();
    if (outcome.inlineMap === undefined) return;
    expect(outcome.inlineMap.has('reset')).toBe(true);
    // success 時: outcome.diagnostics に fauxOriginalError は含まれない
    const hasOriginal = outcome.diagnostics.some((d) => d.code === 9999);
    expect(hasOriginal).toBe(false);
  });

  it('(b) recovery 失敗: 元の validation エラーが outcome.diagnostics に preserved + DT012 rejection と concat', () => {
    // has-parameters helper → recovery 失敗 (DT012 rejection あり)
    const { base, callInfo, ir } = setupBranch(`
      declare const obj: { on(e: string, cb: () => void): void };
      const withParam = (x: number) => { void x; };
      obj.on("click", () => { withParam(); });
      const handler = () => { withParam(); };
    `);

    const fauxOriginalError: ts.Diagnostic = {
      file: base.sourceFile,
      start: 0,
      length: 1,
      messageText: 'original validation error (must be preserved on failure)',
      category: ts.DiagnosticCategory.Error,
      code: 9999,
      source: 'test',
    };
    const validation: ValidationOutcome = {
      hasErrors: true,
      diagnostics: [fauxOriginalError],
    };
    const outcome = runInlineRecoveryBranch(base, callInfo, ir, validation);

    expect(outcome.success).toBe(false);
    expect(outcome.inlineMap).toBeUndefined();
    // failure 時: 元の validation エラーが含まれる
    const hasOriginal = outcome.diagnostics.some((d) => d.code === 9999);
    expect(hasOriginal).toBe(true);
    // DT012 rejection も含まれる
    const hasDT012 = outcome.diagnostics.some((d) => d.code === 9012);
    expect(hasDT012).toBe(true);
    // 順序: original validation エラーが先、DT012 が後
    const idx9999 = outcome.diagnostics.findIndex((d) => d.code === 9999);
    const idx9012 = outcome.diagnostics.findIndex((d) => d.code === 9012);
    expect(idx9999).toBeLessThan(idx9012);
  });
});
