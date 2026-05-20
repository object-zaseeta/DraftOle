/**
 * helper-context-resolver 単体テスト
 *
 * 仕様: `.kiro/specs/helper-inline-recovery/design.md`
 * 検証対象: findEnclosingHelper の eligibility 判定（task 1.2 範囲）
 *
 * 6 ケース:
 *   1. accepted: zero-param module-level const arrow
 *   2. not-module-level: ブロック内 const arrow
 *   3. mutable-binding: let arrow
 *   4. function-declaration: function 宣言
 *   5. non-arrow-initializer: function expression を const に代入
 *   6. has-parameters: arrow にパラメータ
 *
 * + 補助: kind: 'none' を返すケース（helper 不在 / callback として渡された arrow）
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  buildEnclosingHelperDiagnostic,
  findEnclosingHelper,
  findHelperCallSites,
  runHelperAwarePreCheck,
  tryEnclosingHelperRecovery,
  type EnclosingHelperRejectionReason,
  type EnclosingHelperResult,
  type RejectedEnclosingHelper,
} from '../../src/transformer/helper-context-resolver.ts';
import type {
  PreCheckOutcome,
  TransformerBaseContext,
} from '../../src/transformer/per-call-context.ts';
import { createTestProgram, findNode } from './__fixtures__/ast-builders.ts';

// ---- セットアップ -----------------------------------------------------------

interface Setup {
  result: EnclosingHelperResult;
  sourceFile: ts.SourceFile;
}

/**
 * `source` をコンパイルし、最初の `.on(...)` CallExpression に対して
 * findEnclosingHelper を実行した結果を返す。
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
  if (sourceFile === undefined) throw new Error('failed to load source file');
  const checker = program.getTypeChecker();

  // 最初の `.on(...)` CallExpression を見つける
  let onCallExpr: ts.CallExpression | undefined;
  function visit(node: ts.Node): void {
    if (onCallExpr !== undefined) return;
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'on'
    ) {
      onCallExpr = node;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (onCallExpr === undefined) throw new Error('.on(...) call expression not found');

  const result = findEnclosingHelper(onCallExpr, sourceFile, checker);
  return { result, sourceFile };
}

// ---- テスト ---------------------------------------------------------------

describe('helper-context-resolver / findEnclosingHelper', () => {
  it('case 1: zero-param module-level const arrow with single call-site → accepted', () => {
    const { result } = setup(`
      const helper = () => obj.on("click", () => {});
      helper();
    `);
    expect(result.kind).toBe('accepted');
    if (result.kind === 'accepted') {
      expect(result.helper.name).toBe('helper');
      expect(result.helper.arrow.parameters.length).toBe(0);
      expect(result.helper.callSites.length).toBe(1);
    }
  });

  it('case 1b: no call-site → no-call-sites rejection', () => {
    const { result } = setup(`
      const helper = () => obj.on("click", () => {});
      // no caller
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('no-call-sites');
    }
  });

  it('case 1c: multiple call-sites → accepted with N sites', () => {
    const { result } = setup(`
      const helper = () => obj.on("click", () => {});
      helper();
      something();
      helper();
    `);
    expect(result.kind).toBe('accepted');
    if (result.kind === 'accepted') {
      expect(result.helper.callSites.length).toBe(2);
    }
  });

  it('case 2: block-scope const arrow → not-module-level', () => {
    const { result } = setup(`
      function outer() {
        const helper = () => obj.on("click", () => {});
        return helper;
      }
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('not-module-level');
      expect(result.rejection.name).toBe('helper');
    }
  });

  it('case 3: let arrow → mutable-binding', () => {
    const { result } = setup(`
      let helper = () => obj.on("click", () => {});
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('mutable-binding');
      expect(result.rejection.name).toBe('helper');
    }
  });

  it('case 4: function declaration → function-declaration', () => {
    const { result } = setup(`
      function helper() {
        obj.on("click", () => {});
      }
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('function-declaration');
      expect(result.rejection.name).toBe('helper');
    }
  });

  it('case 5: function expression initializer → non-arrow-initializer', () => {
    const { result } = setup(`
      const helper = function() {
        return obj.on("click", () => {});
      };
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('non-arrow-initializer');
      expect(result.rejection.name).toBe('helper');
    }
  });

  it('case 6: arrow with parameters → has-parameters', () => {
    const { result } = setup(`
      const helper = (x: number) => obj.on("click", () => x);
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('has-parameters');
      if (result.rejection.reason.code === 'has-parameters') {
        expect(result.rejection.reason.paramCount).toBe(1);
      }
      expect(result.rejection.name).toBe('helper');
    }
  });

  it('extra: top-level `.on` (no enclosing helper) → none', () => {
    const { result } = setup(`
      obj.on("click", () => {});
    `);
    expect(result.kind).toBe('none');
  });

  it('extra: `.on` inside callback arrow (.each-like) → none', () => {
    const { result } = setup(`
      items.each(item => item.on("click", () => {}));
    `);
    expect(result.kind).toBe('none');
  });
});

describe('helper-context-resolver / findHelperCallSites', () => {
  function compile(source: string, fileName = 'cs.ts'): {
    sourceFile: ts.SourceFile;
    checker: ts.TypeChecker;
    helperDecl: ts.VariableDeclaration;
  } {
    const opts: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2019,
      module: ts.ModuleKind.ESNext,
      strict: false,
      noEmit: true,
    };
    const host = ts.createCompilerHost(opts);
    const orig = host.getSourceFile.bind(host);
    host.getSourceFile = (name, lv): ts.SourceFile | undefined =>
      name === fileName || name.endsWith(fileName)
        ? ts.createSourceFile(name, source, lv, true)
        : orig(name, lv);
    host.fileExists = (name): boolean =>
      name === fileName || name.endsWith(fileName) ? true : ts.sys.fileExists(name);
    host.readFile = (name): string | undefined =>
      name === fileName || name.endsWith(fileName) ? source : ts.sys.readFile(name);

    const program = ts.createProgram([fileName], opts, host);
    const sourceFile = program.getSourceFile(fileName);
    if (sourceFile === undefined) throw new Error('source file not found');
    const checker = program.getTypeChecker();

    let helperDecl: ts.VariableDeclaration | undefined;
    function visit(node: ts.Node): void {
      if (helperDecl !== undefined) return;
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'helper'
      ) {
        helperDecl = node;
        return;
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    if (helperDecl === undefined) throw new Error('helper declaration not found');
    return { sourceFile, checker, helperDecl };
  }

  it('zero call-sites → empty array', () => {
    const { sourceFile, checker, helperDecl } = compile(`
      const helper = () => 1;
    `);
    expect(findHelperCallSites(helperDecl, sourceFile, checker).length).toBe(0);
  });

  it('single call-site → length 1', () => {
    const { sourceFile, checker, helperDecl } = compile(`
      const helper = () => 1;
      helper();
    `);
    expect(findHelperCallSites(helperDecl, sourceFile, checker).length).toBe(1);
  });

  it('N call-sites → length N', () => {
    const { sourceFile, checker, helperDecl } = compile(`
      const helper = () => 1;
      helper();
      const x = helper();
      [helper(), helper()];
    `);
    expect(findHelperCallSites(helperDecl, sourceFile, checker).length).toBe(4);
  });

  it('does not include `.on(...)` call expressions (different shape)', () => {
    const { sourceFile, checker, helperDecl } = compile(`
      const helper = () => 1;
      obj.on("click", () => {}); // PropertyAccess.on, not Identifier helper
    `);
    expect(findHelperCallSites(helperDecl, sourceFile, checker).length).toBe(0);
  });

  it('same-named local var does not match helper symbol', () => {
    const { sourceFile, checker, helperDecl } = compile(`
      const helper = () => 1;
      function inner() {
        const helper = () => 2; // shadows
        helper(); // resolves to inner.helper, not module helper
      }
      helper(); // resolves to module helper
    `);
    expect(findHelperCallSites(helperDecl, sourceFile, checker).length).toBe(1);
  });
});

describe('helper-context-resolver / buildEnclosingHelperDiagnostic', () => {
  function fakeRejection(
    reason: EnclosingHelperRejectionReason,
  ): { rejection: RejectedEnclosingHelper; sourceFile: ts.SourceFile } {
    const sourceFile = ts.createSourceFile(
      'r.ts',
      `let helper = () => obj.on("click", () => {});\n`,
      ts.ScriptTarget.ES2019,
      true,
    );
    // 最初の VariableDeclaration を取り出す
    let decl: ts.VariableDeclaration | undefined;
    let onCallExpr: ts.CallExpression | undefined;
    function visit(node: ts.Node): void {
      if (decl === undefined && ts.isVariableDeclaration(node)) decl = node;
      if (
        onCallExpr === undefined &&
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'on'
      ) {
        onCallExpr = node;
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    if (decl === undefined || onCallExpr === undefined) {
      throw new Error('fixture parse failed');
    }
    return {
      sourceFile,
      rejection: { name: 'helper', declaration: decl, onCallExpr, reason },
    };
  }

  const reasons: readonly EnclosingHelperRejectionReason[] = [
    { code: 'not-module-level' },
    { code: 'mutable-binding' },
    { code: 'function-declaration' },
    { code: 'non-arrow-initializer' },
    { code: 'has-parameters', paramCount: 2 },
    { code: 'no-call-sites' },
    { code: 'ambiguous-call-sites', callSiteCount: 3 },
  ];

  for (const reason of reasons) {
    it(`generates DT014 diagnostic for reason '${reason.code}'`, () => {
      const { rejection, sourceFile } = fakeRejection(reason);
      const diag = buildEnclosingHelperDiagnostic(
        rejection,
        sourceFile,
        ts.DiagnosticCategory.Error,
      );
      expect(diag.code).toBe(9014);
      expect(diag.source).toBe('draftole-transformer');
      expect(diag.category).toBe(ts.DiagnosticCategory.Error);
      const messageText =
        typeof diag.messageText === 'string' ? diag.messageText : diag.messageText.messageText;
      expect(messageText).toContain('DT014');
      expect(messageText).toContain(reason.code);
      expect(messageText).toContain("'helper'");
      expect(diag.relatedInformation).toBeDefined();
      expect(diag.relatedInformation?.length).toBe(1);
      expect(diag.relatedInformation?.[0].messageText).toContain(reason.code);
    });
  }

  it('honors category parameter', () => {
    const { rejection, sourceFile } = fakeRejection({ code: 'mutable-binding' });
    const warn = buildEnclosingHelperDiagnostic(
      rejection,
      sourceFile,
      ts.DiagnosticCategory.Warning,
    );
    expect(warn.category).toBe(ts.DiagnosticCategory.Warning);
  });
});

/**
 * task 4.5 追加: rejection 経路の網羅補強と edge nesting 検証。
 *
 * 既存 6 ケース (case 1〜6) は happy path / 6 rejection codes をカバーしているが、
 * 以下の経路は未到達:
 *   - 匿名 FunctionDeclaration (`export default function () {}`) →
 *     reject.name は `'<anonymous>'` フォールバック (src 227)
 *   - 3+ identical call-sites を持つ helper の callSites 列挙 (ambiguous 候補)
 *   - 入れ子: 受理 helper の中で 2 つ目の `.on(...)` を検出した場合の挙動
 *   - 深い nesting (FunctionExpression と ArrowFunction が混在) を経て
 *     最終的に module-level const arrow に到達するケース
 *   - VariableDeclarationList が複数宣言を持つ場合の eligibility 判定
 *   - export 付き const arrow が受理されること
 *
 * これらを `__fixtures__/ast-builders.ts` の `createTestProgram` 経由で追加検証する。
 */
describe('helper-context-resolver / findEnclosingHelper edge coverage (task 4.5)', () => {
  /**
   * createTestProgram を使い、source 内の最初の `.on(...)` CallExpression に対する
   * findEnclosingHelper 結果と sourceFile を返す。
   */
  function setupViaTestProgram(source: string): Setup {
    const { program, checker, sources } = createTestProgram([
      { name: 'edge.ts', source },
    ]);
    const sourceFile = sources.get('edge.ts');
    if (sourceFile === undefined) throw new Error('source file not found');
    void program;

    const onCall = findNode(sourceFile, (n): n is ts.CallExpression =>
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      ts.isIdentifier(n.expression.name) &&
      n.expression.name.text === 'on',
    );
    if (onCall === undefined) throw new Error('.on(...) not found');

    return { result: findEnclosingHelper(onCall, sourceFile, checker), sourceFile };
  }

  it('anonymous default-exported function declaration → function-declaration with <anonymous> name', () => {
    // `export default function () { ... }` は FunctionDeclaration かつ name 未定義 →
    // `current.name?.text ?? '<anonymous>'` の右辺フォールバックに到達する。
    const { result } = setupViaTestProgram(`
      declare const obj: { on(e: string, cb: () => void): void };
      export default function () {
        obj.on("click", () => {});
      }
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('function-declaration');
      expect(result.rejection.name).toBe('<anonymous>');
    }
  });

  it('3 identical call-sites are all enumerated in callSites (ambiguous candidate input)', () => {
    // helper を 3 回呼び出す → callSites.length === 3。findEnclosingHelper 自身は
    // ambiguous-call-sites を返さないが、後段（呼び出し側）が ambiguous 判定するための
    // 入力配列が正しく構築されることを保証する。
    const { result } = setupViaTestProgram(`
      declare const obj: { on(e: string, cb: () => void): void };
      const helper = () => obj.on("click", () => {});
      helper();
      helper();
      helper();
    `);
    expect(result.kind).toBe('accepted');
    if (result.kind === 'accepted') {
      expect(result.helper.callSites.length).toBe(3);
      for (const site of result.helper.callSites) {
        expect(ts.isCallExpression(site)).toBe(true);
      }
    }
  });

  it('nested: outer helper contains inner arrow `.each(...) → .on(...)` is detected via outer helper', () => {
    // walk-up は最初に出会う ArrowFunction を candidate にする。
    // `.each(item => item.on(...))` の場合、最初の親 ArrowFunction は item callback
    // （VariableDeclaration ではない）→ kind: 'none'。これは case 2 (callback arrow) 系列。
    // ここでは「helper の body が直接 `.on(...)` を含む」ケース（候補は外側 helper）を検証する。
    const { result } = setupViaTestProgram(`
      declare const obj: { on(e: string, cb: () => void): void };
      const helper = () => {
        const x = 1;
        obj.on("click", () => x);
      };
      helper();
    `);
    expect(result.kind).toBe('accepted');
    if (result.kind === 'accepted') {
      expect(result.helper.name).toBe('helper');
    }
  });

  it('deep nesting: `.on(...)` inside arrow inside arrow inside helper → first arrow wins (none)', () => {
    // `.on(...)` を内包する最も近い ArrowFunction は inner callback arrow。
    // その親は CallExpression（`.on` 自身）なので VariableDeclaration ではない → none。
    const { result } = setupViaTestProgram(`
      declare const obj: { on(e: string, cb: () => void): void };
      const helper = () => {
        const inner = () => {
          obj.on("click", () => 1);
        };
        inner();
      };
      helper();
    `);
    // helper の body の中の inner arrow が最初に当たり、その parent は VariableDeclaration
    // (`const inner = ...`) だが non-module-level → rejected with not-module-level。
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('not-module-level');
      expect(result.rejection.name).toBe('inner');
    }
  });

  it('FunctionExpression assigned to const → non-arrow-initializer (covers FunctionExpression branch)', () => {
    // `ts.isArrowFunction(current) || ts.isFunctionExpression(current)` の FunctionExpression
    // 側 + その後の `!ts.isArrowFunction(current)` 分岐が走ることを確認する。
    const { result } = setupViaTestProgram(`
      declare const obj: { on(e: string, cb: () => void): void };
      const helper = function namedExpr() {
        obj.on("click", () => {});
      };
      helper();
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('non-arrow-initializer');
      expect(result.rejection.name).toBe('helper');
    }
  });

  it('exported const arrow at module-level → accepted', () => {
    // `export const helper = () => ...` も isModuleLevelVariableDeclaration を満たす。
    const { result } = setupViaTestProgram(`
      declare const obj: { on(e: string, cb: () => void): void };
      export const helper = () => obj.on("click", () => {});
      helper();
    `);
    expect(result.kind).toBe('accepted');
    if (result.kind === 'accepted') {
      expect(result.helper.name).toBe('helper');
      expect(result.helper.callSites.length).toBe(1);
    }
  });

  it('VariableDeclarationList with multiple decls — target const arrow is still accepted', () => {
    // `const a = 1, helper = () => ...` のように複数宣言の中の helper を抽出。
    const { result } = setupViaTestProgram(`
      declare const obj: { on(e: string, cb: () => void): void };
      const a = 1, helper = () => obj.on("click", () => a);
      helper();
    `);
    expect(result.kind).toBe('accepted');
    if (result.kind === 'accepted') {
      expect(result.helper.name).toBe('helper');
    }
  });

  it('arrow with 2 parameters → has-parameters with paramCount=2', () => {
    // case 6 は paramCount=1 のみ検証している。複数 param の paramCount 値も検証。
    const { result } = setupViaTestProgram(`
      declare const obj: { on(e: string, cb: () => void): void };
      const helper = (a: number, b: number) => obj.on("click", () => a + b);
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      expect(result.rejection.reason.code).toBe('has-parameters');
      if (result.rejection.reason.code === 'has-parameters') {
        expect(result.rejection.reason.paramCount).toBe(2);
      }
    }
  });

  it('helper inside another function declaration → first hit is the inner const decl (not-module-level)', () => {
    // walk-up で最初に出会う ArrowFunction（const helper の RHS）が候補となる。
    // その親は VariableDeclaration だが outer FunctionDeclaration 配下 → not-module-level。
    const { result } = setupViaTestProgram(`
      declare const obj: { on(e: string, cb: () => void): void };
      function outer() {
        let helper = () => obj.on("click", () => {});
        return helper;
      }
    `);
    expect(result.kind).toBe('rejected');
    if (result.kind === 'rejected') {
      // not-module-level が先に判定される（mutable-binding より優先）
      expect(result.rejection.reason.code).toBe('not-module-level');
      expect(result.rejection.name).toBe('helper');
    }
  });
});

/**
 * tryEnclosingHelperRecovery 直接 unit test
 * (transformer-index-pipeline-split task 2.2 — relocate に伴い end-to-end 経由のみだった
 * カバレッジを直接 unit test に格上げする)
 *
 * 検証する 3 経路:
 *   (a) helper 文脈なし (helper 不在の `.on(arrow)`) → pass-through
 *   (b) inherited each-scope ありの helper (single each call-site で context 継承) → inherited
 *   (c) DT014 ambiguous-call-sites 発火 (各 call-site が異 itemParamName の each 内) → rejected
 */
describe('helper-context-resolver / tryEnclosingHelperRecovery', () => {
  /** source 内の最初の `.on(...)` CallExpression に対する recovery 結果を返す */
  function setupRecovery(source: string): {
    recovery: ReturnType<typeof tryEnclosingHelperRecovery>;
    sourceFile: ts.SourceFile;
  } {
    const { program, checker, sources } = createTestProgram([
      { name: 'recovery.ts', source },
    ]);
    const sourceFile = sources.get('recovery.ts');
    if (sourceFile === undefined) throw new Error('source file not found');
    void program;

    const onCall = findNode(sourceFile, (n): n is ts.CallExpression =>
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      ts.isIdentifier(n.expression.name) &&
      n.expression.name.text === 'on',
    );
    if (onCall === undefined) throw new Error('.on(...) not found');

    return { recovery: tryEnclosingHelperRecovery(onCall, sourceFile, checker), sourceFile };
  }

  it('(a) helper 文脈なし: top-level `.on(arrow)` → pass-through', () => {
    // `.on()` が helper 内ではなくモジュールトップレベル直下にある場合、
    // findEnclosingHelper は kind: 'none' を返し、recovery は pass-through。
    const { recovery } = setupRecovery(`
      declare const obj: { on(e: string, cb: () => void): void };
      obj.on("click", () => {});
    `);
    expect(recovery.kind).toBe('pass-through');
  });

  it('(b) inherited each-scope: single each call-site の helper → inherited with context', () => {
    // `.each(item => helper())` のように helper が単一 each call-site から呼ばれる場合、
    // detectEachScopeContext は context を返し、recovery は { kind: 'inherited', context, paramSymbols }。
    const { recovery } = setupRecovery(`
      declare const obj: { on(e: string, cb: () => void): void };
      declare const list: { each(cb: (item: { id: string }) => void): void };
      const helper = () => obj.on("click", () => {});
      list.each(item => helper());
    `);
    expect(recovery.kind).toBe('inherited');
    if (recovery.kind === 'inherited') {
      expect(recovery.context).not.toBeNull();
      if (recovery.context !== null) {
        expect(recovery.context.itemParamName).toBe('item');
      }
      // paramSymbols は EachScopeContext がある場合、each arrow の item param Symbol を含む
      // (collectEachScopeParamSymbols 経由)。テスト用 declare const 由来のため Symbol 取得可能性は
      // 環境依存だが、少なくとも undefined ではないことを確認する。
      expect(recovery.paramSymbols).toBeDefined();
    }
  });

  it('(c) DT014 ambiguous-call-sites: 異 itemParamName の each call-site 混在 → rejected', () => {
    // 同一 helper が 2 つの `.each()` から呼ばれ、それぞれ異なる itemParamName を持つ場合、
    // detectEachScopeContext は 'ambiguous' を返し、recovery は DT014 rejection。
    const { recovery } = setupRecovery(`
      declare const obj: { on(e: string, cb: () => void): void };
      declare const list1: { each(cb: (item: { id: string }) => void): void };
      declare const list2: { each(cb: (entry: { id: string }) => void): void };
      const helper = () => obj.on("click", () => {});
      list1.each(item => helper());
      list2.each(entry => helper());
    `);
    expect(recovery.kind).toBe('rejected');
    if (recovery.kind === 'rejected') {
      expect(recovery.diagnostic.code).toBe(9014);
      const messageText =
        typeof recovery.diagnostic.messageText === 'string'
          ? recovery.diagnostic.messageText
          : recovery.diagnostic.messageText.messageText;
      expect(messageText).toContain('DT014');
      expect(messageText).toContain('ambiguous-call-sites');
      expect(messageText).toContain("'helper'");
    }
  });
});

/**
 * runHelperAwarePreCheck (Phase 1 delegate) 直接 unit test
 * (transformer-index-pipeline-split task 3.1)
 *
 * tryEnclosingHelperRecovery を内部呼出する薄いラッパが、3 経路を flat な
 * PreCheckOutcome へ正しく変換することを検証する。
 */
describe('helper-context-resolver / runHelperAwarePreCheck', () => {
  /** source 内の最初の `.on(...)` CallExpression に対する PreCheckOutcome を返す */
  function setupPreCheck(source: string): {
    outcome: PreCheckOutcome;
    sourceFile: ts.SourceFile;
  } {
    const { program, checker, sources } = createTestProgram([
      { name: 'precheck.ts', source },
    ]);
    const sourceFile = sources.get('precheck.ts');
    if (sourceFile === undefined) throw new Error('source file not found');

    const onCall = findNode(sourceFile, (n): n is ts.CallExpression =>
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      ts.isIdentifier(n.expression.name) &&
      n.expression.name.text === 'on',
    );
    if (onCall === undefined) throw new Error('.on(...) not found');
    const handlerArg = onCall.arguments[1];
    if (handlerArg === undefined || !ts.isArrowFunction(handlerArg)) {
      throw new Error('handler arg must be ArrowFunction');
    }
    const eventArg = onCall.arguments[0];
    if (eventArg === undefined || !ts.isStringLiteral(eventArg)) {
      throw new Error('event arg must be StringLiteral');
    }

    const base: TransformerBaseContext = {
      program,
      checker,
      sourceFile,
      extraWhitelist: [],
      strictHelpers: false,
      helperCallSites: [],
    };
    const callInfo = { callExpr: onCall, eventArg, handlerArg };

    return { outcome: runHelperAwarePreCheck(base, callInfo), sourceFile };
  }

  it('(a) pass-through 経路: helper 文脈なし → helperPathUsed:false, diagnostics 空', () => {
    const { outcome } = setupPreCheck(`
      declare const obj: { on(e: string, cb: () => void): void };
      obj.on("click", () => {});
    `);
    expect(outcome.helperPathUsed).toBe(false);
    expect(outcome.inheritedEachContext).toBeNull();
    expect(outcome.inheritedEachParamSymbols).toBeUndefined();
    expect(outcome.diagnostics).toEqual([]);
  });

  it('(b) rejected 経路: ambiguous helper → diagnostics に DT014 が含まれる', () => {
    // 異 itemParamName を持つ 2 つの `.each()` から呼ばれる helper → DT014 ambiguous
    const { outcome } = setupPreCheck(`
      declare const obj: { on(e: string, cb: () => void): void };
      declare const list1: { each(cb: (item: { id: string }) => void): void };
      declare const list2: { each(cb: (entry: { id: string }) => void): void };
      const helper = () => obj.on("click", () => {});
      list1.each(item => helper());
      list2.each(entry => helper());
    `);
    expect(outcome.helperPathUsed).toBe(false);
    expect(outcome.inheritedEachContext).toBeNull();
    expect(outcome.diagnostics.length).toBe(1);
    expect(outcome.diagnostics[0].code).toBe(9014);
    expect(outcome.diagnostics[0].category).toBe(ts.DiagnosticCategory.Error);
  });
});
