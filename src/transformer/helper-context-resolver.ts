/**
 * helper-context-resolver — `.on(arrow)` を内包する helper の発見・eligibility 判定・call-site 列挙
 *
 * 仕様: `.kiro/specs/helper-inline-recovery/`
 *   - design.md §Components and Interfaces / helper-context-resolver.ts
 *   - requirements.md 1.1, 1.4, 2.3, 3.1, 3.2, 3.3
 *
 * 単一責任:
 *   1. `.on` CallExpression の AST 上方向 walk-up で直近 helper 宣言を発見
 *   2. helper の eligibility（module-level / const / zero-param / arrow initializer）を判定
 *   3. accepted helper の call-site を同一 SourceFile から列挙
 *   4. rejected helper から DT014 診断を生成
 *
 * 副作用なしの純粋関数のみ。`fileDiagnostics` への push は呼び出し側（index.ts）の責務。
 *
 * Task 1.1: 型定義と内部 helper（symbol 解決・宣言形状判定）のみを実装する。
 *           findEnclosingHelper / findHelperCallSites / buildEnclosingHelperDiagnostic は
 *           それぞれ task 1.2 / 1.3 / 1.4 で追加する。
 */

import * as ts from 'typescript';
import type { OnCallInfo } from './call-detector';
import {
  collectEachScopeParamSymbols,
  detectEachScopeContext,
  type EachScopeContext,
} from './each-state-rewriter';
import {
  isConstDeclaration,
  isModuleLevelVariableDeclaration,
  resolveValueDeclaration,
} from './helper-decl-utils';
import type { PreCheckOutcome, TransformerBaseContext } from './per-call-context';

// ---- 公開型 ------------------------------------------------------------------

/** `.on` を内包する直近 helper を発見した結果（discriminated union）。 */
export type EnclosingHelperResult =
  | { readonly kind: 'none' }
  | { readonly kind: 'accepted'; readonly helper: AcceptedEnclosingHelper }
  | { readonly kind: 'rejected'; readonly rejection: RejectedEnclosingHelper };

/** 採用された helper。call-site をすべて含む。 */
export interface AcceptedEnclosingHelper {
  readonly name: string;
  /** モジュールレベル `const name = () => ...` の VariableDeclaration */
  readonly declaration: ts.VariableDeclaration;
  /** 宣言右辺の ArrowFunction（zero-param） */
  readonly arrow: ts.ArrowFunction;
  /** 同一 SourceFile 内のすべての呼び出し位置（helper 自身の `.on` 内包 CallExpression は除外） */
  readonly callSites: readonly ts.CallExpression[];
}

/** 不採用理由（discriminated union）。 */
export type EnclosingHelperRejectionReason =
  | { readonly code: 'not-module-level' }
  | { readonly code: 'mutable-binding' }
  | { readonly code: 'function-declaration' }
  | { readonly code: 'non-arrow-initializer' }
  | { readonly code: 'has-parameters'; readonly paramCount: number }
  | { readonly code: 'no-call-sites' }
  | { readonly code: 'ambiguous-call-sites'; readonly callSiteCount: number };

/** 不採用 helper の情報（DT014 診断生成元）。 */
export interface RejectedEnclosingHelper {
  readonly name: string;
  /** 不採用となった helper 宣言（VariableDeclaration / FunctionDeclaration / Parameter 等） */
  readonly declaration: ts.Declaration;
  /** トリガとなった `.on` CallExpression（診断アンカー） */
  readonly onCallExpr: ts.CallExpression;
  readonly reason: EnclosingHelperRejectionReason;
}

// ---- 内部 helper: symbol 解決 ------------------------------------------------
// resolveValueDeclaration / isModuleLevelVariableDeclaration / isConstDeclaration は
// `./helper-decl-utils` に移管。本ファイルでは import して使用する。

// ---- 公開 API: buildEnclosingHelperDiagnostic -------------------------------

/** DT014 診断コード: enclosing-helper recovery 不可能な helper 形状。`hasFileError` 集計除外用に index.ts へも export する。 */
export const DT014_CODE = 9014 as number & { __brand: 'DT014' };

/** reason.code を人読み形に整形する。 */
function describeRejectionReason(reason: EnclosingHelperRejectionReason): string {
  switch (reason.code) {
    case 'not-module-level':
      return 'not-module-level: helper is not declared at module top-level';
    case 'mutable-binding':
      return 'mutable-binding: helper is declared with let (mutable binding)';
    case 'function-declaration':
      return 'function-declaration: helper is a function declaration, not a const arrow';
    case 'non-arrow-initializer':
      return 'non-arrow-initializer: helper initializer is not an arrow function';
    case 'has-parameters':
      return `has-parameters: helper takes ${reason.paramCount} parameter(s)`;
    case 'no-call-sites':
      return 'no-call-sites: helper is never called in this file';
    case 'ambiguous-call-sites':
      return `ambiguous-call-sites: helper has ${reason.callSiteCount} call site(s) with inconsistent each-scope context`;
  }
}

/**
 * `RejectedEnclosingHelper` から DT014 診断を生成する。
 *
 * - `code`: 9014（`__brand: 'DT014'`）
 * - `source`: `'draftole-transformer'`
 * - `relatedInformation`: reason code + helper 宣言位置 1 件
 *
 * 診断アンカーはトリガとなった `.on` CallExpression。helper 宣言位置は
 * `relatedInformation` 経由でユーザに提示する。
 *
 * @param rejection findEnclosingHelper の rejection
 * @param sourceFile  該当 SourceFile
 * @param category    `ts.DiagnosticCategory.Error | Warning | Suggestion`
 * @returns DT014 診断
 */
export function buildEnclosingHelperDiagnostic(
  rejection: RejectedEnclosingHelper,
  sourceFile: ts.SourceFile,
  category: ts.DiagnosticCategory,
): ts.Diagnostic {
  const reasonText = describeRejectionReason(rejection.reason);
  const anchor = rejection.onCallExpr;
  const start = anchor.getStart(sourceFile);
  const length = anchor.getWidth(sourceFile);

  const messageText =
    `DraftOle DT014: enclosing helper '${rejection.name}' is not eligible for inline-recovery ` +
    `(${reasonText}). ` +
    `Supported shape: zero-parameter module-level const arrow function with a consistent each-scope context across all call sites. ` +
    'Suggested fix: inline the `.on(...)` at its call site, or refactor the helper to a zero-param module-level const arrow.';

  const declNode = rejection.declaration;
  const declStart = declNode.getStart(sourceFile);
  const declLength = declNode.getWidth(sourceFile);

  return {
    file: sourceFile,
    start,
    length,
    messageText,
    category,
    code: DT014_CODE,
    source: 'draftole-transformer',
    relatedInformation: [
      {
        file: sourceFile,
        start: declStart,
        length: declLength,
        messageText: `helper declaration (reason: ${rejection.reason.code})`,
        category: ts.DiagnosticCategory.Message,
        code: DT014_CODE,
      },
    ],
  };
}

// ---- 公開 API: findHelperCallSites ------------------------------------------

/**
 * 同一 SourceFile 内で `helperDecl` を呼び出している CallExpression を列挙する。
 *
 * マッチ条件:
 *   - CallExpression の `expression` が Identifier
 *   - その Identifier から `resolveValueDeclaration` を辿った結果が `helperDecl` と同一
 *
 * helper 自身の body 内からの自己再帰呼び出しも CallExpression として列挙される
 * （実用上は再帰 helper はそもそも task 1.2 で reject されるため問題にならない）。
 *
 * @param helperDecl  helper の宣言（VariableDeclaration）
 * @param sourceFile  探索対象 SourceFile
 * @param checker     TypeChecker（symbol 解決に使用）
 * @returns           call-site CallExpression の配列（出現順）
 */
export function findHelperCallSites(
  helperDecl: ts.VariableDeclaration,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): readonly ts.CallExpression[] {
  const sites: ts.CallExpression[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const resolvedDecl = resolveValueDeclaration(node.expression, checker);
      if (resolvedDecl === helperDecl) {
        sites.push(node);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return sites;
}

// ---- 公開 API: findEnclosingHelper ------------------------------------------

/**
 * `.on(arrow)` CallExpression を内包する直近 helper を探索する。
 *
 * アルゴリズム:
 *   1. `onCallExpr.parent` から SourceFile に達するまで AST 親方向に walk-up
 *   2. 最初に出会う関数式（ArrowFunction / FunctionExpression）または FunctionDeclaration を
 *      enclosing function 候補とする
 *   3. 候補が ArrowFunction かつ親が VariableDeclaration の場合のみ eligibility を判定
 *   4. それ以外（callback として使われた arrow、function expression、function declaration 等）は
 *      reject または `none` を返す
 *
 * 注意:
 *   - `.on` の **handler 引数**（`.on("click", () => ...)` の第 2 引数）は走査しない
 *     （node.parent チェインは `.on` 自身を経由するため、handler 内へ降りない）
 *   - callSites の列挙は本関数では行わない（task 1.3 で `findHelperCallSites` 統合）
 *   - accepted の callSites は本実装段階では常に空配列。完全な統合は task 1.3 完了後。
 *
 * @param onCallExpr `.on(event, arrow)` の CallExpression
 * @param sourceFile 解析対象 SourceFile
 * @param checker TypeChecker（将来の型ベース拡張用、現時点では未使用）
 * @returns 採否判定結果
 */
export function findEnclosingHelper(
  onCallExpr: ts.CallExpression,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): EnclosingHelperResult {
  void checker; // 将来の型解決用フック

  let current: ts.Node = onCallExpr;
  while (current.parent !== undefined && !ts.isSourceFile(current.parent)) {
    current = current.parent;

    // FunctionDeclaration: `function name() { ... }` 形式の helper
    if (ts.isFunctionDeclaration(current)) {
      const name = current.name?.text ?? '<anonymous>';
      return {
        kind: 'rejected',
        rejection: {
          name,
          declaration: current,
          onCallExpr,
          reason: { code: 'function-declaration' },
        },
      };
    }

    // ArrowFunction / FunctionExpression: 関数式形式
    if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
      const parent = current.parent;
      if (parent === undefined || !ts.isVariableDeclaration(parent)) {
        // callback として渡された関数式（`.each(item => ...)` 等）→ 既存挙動に委ねる
        return { kind: 'none' };
      }

      // VariableDeclaration の name から helper 名を取得
      const name = ts.isIdentifier(parent.name) ? parent.name.text : '<anonymous>';

      // 1. module-level 判定
      if (!isModuleLevelVariableDeclaration(parent, sourceFile)) {
        return {
          kind: 'rejected',
          rejection: {
            name,
            declaration: parent,
            onCallExpr,
            reason: { code: 'not-module-level' },
          },
        };
      }

      // 2. const 判定
      if (!isConstDeclaration(parent)) {
        return {
          kind: 'rejected',
          rejection: {
            name,
            declaration: parent,
            onCallExpr,
            reason: { code: 'mutable-binding' },
          },
        };
      }

      // 3. 関数式形式が ArrowFunction でなければ non-arrow-initializer
      if (!ts.isArrowFunction(current)) {
        return {
          kind: 'rejected',
          rejection: {
            name,
            declaration: parent,
            onCallExpr,
            reason: { code: 'non-arrow-initializer' },
          },
        };
      }

      // 4. zero-param 判定
      if (current.parameters.length > 0) {
        return {
          kind: 'rejected',
          rejection: {
            name,
            declaration: parent,
            onCallExpr,
            reason: { code: 'has-parameters', paramCount: current.parameters.length },
          },
        };
      }

      // すべての eligibility 判定をクリア → call-site 列挙
      const callSites = findHelperCallSites(parent, sourceFile, checker);
      if (callSites.length === 0) {
        return {
          kind: 'rejected',
          rejection: {
            name,
            declaration: parent,
            onCallExpr,
            reason: { code: 'no-call-sites' },
          },
        };
      }
      return {
        kind: 'accepted',
        helper: {
          name,
          declaration: parent,
          arrow: current,
          callSites,
        },
      };
    }
  }

  // SourceFile に到達 → enclosing helper なし
  return { kind: 'none' };
}

// ---- TXDX-2: enclosing-helper recovery (relocated from index.ts) ------------

/** `tryEnclosingHelperRecovery` の戻り値。 */
export type EnclosingHelperRecovery =
  /** helper を内包しない通常の `.on(arrow)` → 既存パイプライン続行 */
  | { readonly kind: 'pass-through' }
  /**
   * helper 経由で each scope を継承した（または each 外で確定した）→ context を使う
   *
   * Task 3.2: `paramSymbols` は helper-aware 経路で
   * `collectEachScopeParamSymbols` を `helperCallSites` 付きで呼んだ結果。
   * `context === null` (each 外確定) や Symbol 取得不可の場合は `undefined`。
   */
  | {
      readonly kind: 'inherited';
      readonly context: EachScopeContext | null;
      readonly paramSymbols: Set<ts.Symbol> | undefined;
    }
  /** 採用不能な helper 形状 → DT014 を発行して当該 handler はスキップ */
  | { readonly kind: 'rejected'; readonly diagnostic: ts.Diagnostic };

/**
 * `.on(arrow)` を内包する helper を発見し、each scope 継承または DT014 発行を決定する。
 *
 * 分岐:
 *   - helper 不在 (`kind: 'none'`): `pass-through`（既存ロジックに委ねる）
 *   - helper 採用 (`kind: 'accepted'`): `detectEachScopeContext` を helperCallSites 付きで
 *     呼び出し、結果を `inherited` で返す。null（全 call-site が each 外 / ambiguous）の
 *     場合も `inherited { context: null }` として返し、呼び出し側が ambiguous を判定する。
 *   - helper 不採用 (`kind: 'rejected'`): DT014 を生成して返す
 */
export function tryEnclosingHelperRecovery(
  onCallExpr: ts.CallExpression,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): EnclosingHelperRecovery {
  const result = findEnclosingHelper(onCallExpr, sourceFile, checker);
  if (result.kind === 'none') {
    return { kind: 'pass-through' };
  }
  if (result.kind === 'rejected') {
    return {
      kind: 'rejected',
      diagnostic: buildEnclosingHelperDiagnostic(
        result.rejection,
        sourceFile,
        ts.DiagnosticCategory.Error,
      ),
    };
  }
  // accepted: helper 経由の each scope を判定
  // Task 2.2: detectEachScopeContext の 3-state を明示的に分岐する。
  //   - EachScopeContext: helper 全 call-site が単一 each scope を共有
  //   - null: helper 全 call-site が each 外で確定
  //   - 'ambiguous': call-site が each 内外混在 / 異 itemParamName
  //     → DT014 を `ambiguous-call-sites` reason 付きで発行して当該 handler をスキップ
  const ctx = detectEachScopeContext(onCallExpr, checker, {
    helperCallSites: result.helper.callSites,
  });
  if (ctx === 'ambiguous') {
    const rejection: RejectedEnclosingHelper = {
      name: result.helper.name,
      declaration: result.helper.declaration,
      onCallExpr,
      reason: {
        code: 'ambiguous-call-sites',
        callSiteCount: result.helper.callSites.length,
      },
    };
    return {
      kind: 'rejected',
      diagnostic: buildEnclosingHelperDiagnostic(
        rejection,
        sourceFile,
        ts.DiagnosticCategory.Error,
      ),
    };
  }
  // ctx は EachScopeContext | null のいずれか（each 外確定 or 単一 context）
  // Task 3.2: helper-aware 経路の paramSymbols をここで一括計算して返す。
  //   - context が単一 EachScopeContext のときのみ helperCallSites を伝播して
  //     `collectEachScopeParamSymbols` を呼ぶ
  //   - each 外確定 (context === null) の場合は paramSymbols も undefined
  //   - design Decision「helper-aware 経路の中央集約」に従い、helper 検出は
  //     本関数内で 1 度だけ実施 (caller 側は再走査しない)
  const paramSymbols =
    ctx === null
      ? undefined
      : collectEachScopeParamSymbols(onCallExpr, checker, {
          helperCallSites: result.helper.callSites,
        });
  return { kind: 'inherited', context: ctx, paramSymbols };
}

// ---- Phase 1 delegate: runHelperAwarePreCheck -------------------------------

/**
 * Phase 1 per-call delegate: helper-aware pre-check の outcome を構築する。
 *
 * 内部で `tryEnclosingHelperRecovery` を呼び、3 経路の discriminated union を
 * `PreCheckOutcome` (flat shape) に変換する薄いラッパ。factory main loop は本関数を
 * 呼んで `PreCheckOutcome` を受け取り、`diagnostics` に Error カテゴリが含まれる場合に
 * 当該 .on() 呼出をスキップする。
 *
 * Mapping:
 *   - pass-through → { helperPathUsed: false, inheritedEachContext: null, ..., diagnostics: [] }
 *   - inherited    → { helperPathUsed: true, inheritedEachContext: ctx, inheritedEachParamSymbols, diagnostics: [] }
 *   - rejected     → { helperPathUsed: false, inheritedEachContext: null, ..., diagnostics: [diag] }
 *
 * relocated/added in transformer-index-pipeline-split task 3.1.
 */
export function runHelperAwarePreCheck(
  base: TransformerBaseContext,
  callInfo: OnCallInfo,
): PreCheckOutcome {
  const r = tryEnclosingHelperRecovery(callInfo.callExpr, base.sourceFile, base.checker);
  return {
    helperPathUsed: r.kind === 'inherited',
    inheritedEachContext: r.kind === 'inherited' ? r.context : null,
    inheritedEachParamSymbols: r.kind === 'inherited' ? r.paramSymbols : undefined,
    diagnostics: r.kind === 'rejected' ? [r.diagnostic] : [],
  };
}
