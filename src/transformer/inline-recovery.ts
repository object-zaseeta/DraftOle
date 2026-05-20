/**
 * inline-recovery — ヘルパー関数インライン展開の採否判定
 *
 * 仕様: `.kiro/specs/transformer-inline-recovery-spec/`
 *   - design.md §6.1
 *   - requirements.md 1.1, 1.2, 3.2, 4.1, 4.2, 5.2
 *
 * 単一責任:
 *   1. ハンドラ AST を再帰スキャンしてヘルパー呼び出し候補を列挙する
 *   2. design §6.1 の優先順位（1. function-declaration → 2. not-module-level
 *      → 3. mutable-binding → 4. has-parameters → 5. has-arguments）に従い
 *      採否を分類する
 *   3. 採用候補から `Map<string, ts.ArrowFunction>` を構築する
 *   4. 不採用候補から DT012 診断を生成する
 *
 * 副作用なしの純粋関数のみで構成し、`fileDiagnostics` への push は
 * 呼び出し側（transformer/index.ts）の責任。
 */

import * as ts from 'typescript';
import type { OnCallInfo } from './call-detector';
import {
  extractHandlerIR,
  type HandlerIR,
  type IdentifierRef,
} from './handler-ir-extractor';
import {
  isConstDeclaration,
  isModuleLevelVariableDeclaration,
  resolveValueDeclaration,
} from './helper-decl-utils';
import { collectIdentifiers } from './identifier-collector';
import type {
  RecoveryOutcome,
  TransformerBaseContext,
  ValidationOutcome,
} from './per-call-context';
import type { StateIdFallback } from './state-id-fallback';
import { buildStateIdMapWithInlining } from './state-id-resolver';
import { validateHandler } from './whitelist-validator';

// ---- 公開型 ------------------------------------------------------------------

/** 採用された helper 候補。`buildInlineMap` の戻り値要素に対応。 */
export interface AcceptedHelper {
  readonly kind: 'accepted';
  readonly name: string;
  readonly arrow: ts.ArrowFunction;
  readonly callSite: ts.CallExpression;
}

/** 不採用理由（discriminated union）。 */
export type HelperRejectionReason =
  | { readonly code: 'has-arguments'; readonly argCount: number }
  | { readonly code: 'has-parameters'; readonly paramCount: number }
  | { readonly code: 'function-declaration' }
  | { readonly code: 'not-module-level' }
  | { readonly code: 'mutable-binding' };

export interface RejectedHelper {
  readonly kind: 'rejected';
  readonly name: string;
  readonly callSite: ts.CallExpression;
  readonly reason: HelperRejectionReason;
}

export type HelperClassification = AcceptedHelper | RejectedHelper;

// ---- ヘルパー: シンボル解決 -------------------------------------------------
// resolveValueDeclaration / isModuleLevelVariableDeclaration / isConstDeclaration は
// `./helper-decl-utils` に移管。本ファイルでは import して使用する。

// ---- 候補列挙 + 分類 --------------------------------------------------------

/**
 * 1 つの候補 CallExpression に対して採否を確定する。
 * design §6.1 の優先順位（先勝ち）に従う。
 */
function classifyOne(
  callSite: ts.CallExpression,
  identName: string,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
): HelperClassification | undefined {
  if (!ts.isIdentifier(callSite.expression)) return undefined;
  const decl = resolveValueDeclaration(callSite.expression, checker);
  if (decl === undefined) {
    // 解決不能 Identifier → 候補列挙対象外（既存 DT001 路に委ねる）
    return undefined;
  }

  // 1. function-declaration
  if (ts.isFunctionDeclaration(decl)) {
    return {
      kind: 'rejected',
      name: identName,
      callSite,
      reason: { code: 'function-declaration' },
    };
  }

  // VariableDeclaration で arrow を初期化しているか確認
  if (!ts.isVariableDeclaration(decl)) {
    // 想定外形状（class、parameter 等）→ not-module-level 相当として扱う
    return {
      kind: 'rejected',
      name: identName,
      callSite,
      reason: { code: 'not-module-level' },
    };
  }

  // 2. not-module-level
  // ブロック内 const、cross-file（別 sourceFile）含む
  if (decl.getSourceFile() !== sourceFile || !isModuleLevelVariableDeclaration(decl, sourceFile)) {
    return {
      kind: 'rejected',
      name: identName,
      callSite,
      reason: { code: 'not-module-level' },
    };
  }

  // 3. mutable-binding
  if (!isConstDeclaration(decl)) {
    return {
      kind: 'rejected',
      name: identName,
      callSite,
      reason: { code: 'mutable-binding' },
    };
  }

  // initializer が ArrowFunction でなければ採否対象外（function expression 等）
  if (decl.initializer === undefined || !ts.isArrowFunction(decl.initializer)) {
    return {
      kind: 'rejected',
      name: identName,
      callSite,
      reason: { code: 'not-module-level' },
    };
  }

  const arrow = decl.initializer;

  // 4. has-parameters（宣言側 param > 0）— 呼び出し側引数より優先
  if (arrow.parameters.length > 0) {
    return {
      kind: 'rejected',
      name: identName,
      callSite,
      reason: { code: 'has-parameters', paramCount: arrow.parameters.length },
    };
  }

  // 5. has-arguments
  if (callSite.arguments.length > 0) {
    return {
      kind: 'rejected',
      name: identName,
      callSite,
      reason: { code: 'has-arguments', argCount: callSite.arguments.length },
    };
  }

  // すべての条件をクリア → 採用
  return {
    kind: 'accepted',
    name: identName,
    arrow,
    callSite,
  };
}

/**
 * ハンドラ本体を再帰スキャンし、ヘルパー呼び出し候補を分類して返す。
 *
 * 候補とは: ExpressionStatement 直下の CallExpression で、
 * 呼び出し対象が単純 Identifier かつ宣言が解決可能なもの（引数の有無は問わない）。
 * 同名 helper は最初の出現のみを返す（重複 push を防ぐ）。
 */
export function classifyHelperCandidates(
  arrowFn: ts.ArrowFunction,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): readonly HelperClassification[] {
  const seen = new Set<string>();
  const result: HelperClassification[] = [];

  function visit(node: ts.Node): void {
    if (ts.isExpressionStatement(node)) {
      const expr = node.expression;
      if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
        const name = expr.expression.text;
        if (!seen.has(name)) {
          const cls = classifyOne(expr, name, checker, sourceFile);
          if (cls !== undefined) {
            seen.add(name);
            result.push(cls);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(arrowFn.body);
  return result;
}

// ---- 採用マップ構築 ---------------------------------------------------------

/**
 * 採用候補のみから inlineMap を構築する。
 * 既存 `buildInlineMap` と互換の戻り値（Map<name, ArrowFunction>）。
 */
export function buildInlineMap(
  classifications: readonly HelperClassification[],
): Map<string, ts.ArrowFunction> {
  const map = new Map<string, ts.ArrowFunction>();
  for (const c of classifications) {
    if (c.kind === 'accepted' && !map.has(c.name)) {
      map.set(c.name, c.arrow);
    }
  }
  return map;
}

// ---- 診断生成 ---------------------------------------------------------------

/** reason.code を人読み形に整形する。 */
function describeReason(reason: HelperRejectionReason): string {
  switch (reason.code) {
    case 'has-arguments':
      return `has-arguments: call site passes ${reason.argCount} argument(s)`;
    case 'has-parameters':
      return `has-parameters: helper takes ${reason.paramCount} parameter(s)`;
    case 'function-declaration':
      return 'function-declaration: helper is a function declaration, not a const arrow';
    case 'not-module-level':
      return 'not-module-level: helper is not declared at module top-level';
    case 'mutable-binding':
      return 'mutable-binding: helper is declared with let (mutable binding)';
  }
}

/**
 * 不採用候補から DT012 診断を生成する。
 *
 * - `category`: 呼び出し側が `options.strictHelpers ? Warning : Suggestion` を渡す
 * - `relatedInformation`: reason.code を平文化したメッセージを 1 件付与
 */
export function buildRejectionDiagnostics(
  classifications: readonly HelperClassification[],
  sourceFile: ts.SourceFile,
  category: ts.DiagnosticCategory,
): readonly ts.Diagnostic[] {
  const diags: ts.Diagnostic[] = [];
  for (const c of classifications) {
    if (c.kind !== 'rejected') continue;
    const reasonText = describeReason(c.reason);
    const start = c.callSite.getStart(sourceFile);
    const length = c.callSite.getWidth(sourceFile);
    const messageText =
      `DT012: Helper '${c.name}' is not eligible for inline recovery (${reasonText}). ` +
      'Supported shape: zero-argument module-level const arrow function, single level.';

    diags.push({
      file: sourceFile,
      start,
      length,
      messageText,
      category,
      code: 9012,
      source: 'draftole-transformer',
      relatedInformation: [
        {
          file: sourceFile,
          start,
          length,
          messageText: `reason: ${c.reason.code}`,
          category: ts.DiagnosticCategory.Message,
          code: 9012,
        },
      ],
    });
  }
  return diags;
}

// ---- インライン展開回復 (relocated from index.ts) ---------------------------

/**
 * `tryInlineRecovery` の戻り値 (成功時)。
 *
 * relocated from index.ts (transformer-index-pipeline-split task 2.4).
 */
export interface InlineRecoveryResult {
  stateIdMap: Map<ts.Symbol, string>;
  inlineMap: Map<string, ts.ArrowFunction>;
  rejectionDiagnostics: readonly ts.Diagnostic[];
}

/**
 * バリデーションエラー時にモジュールレベル関数インライン展開による回復を試みる。
 *
 * 手順:
 * 1. ハンドラ内のゼロ引数モジュールレベル関数呼び出しを検出して inlineMap を構築
 * 2. 検出した関数名を extraWhitelist に追加して再バリデーション
 * 3. 各インライン関数の本体を独立してバリデーション
 * 4. すべてパスした場合 stateIdMap と inlineMap を返す
 *
 * @returns 回復成功時 { stateIdMap, inlineMap, rejectionDiagnostics }、
 *          失敗時 { rejectionDiagnostics } または undefined
 */
export function tryInlineRecovery(
  arrowFn: ts.ArrowFunction,
  ir: HandlerIR,
  refs: IdentifierRef[],
  checker: ts.TypeChecker,
  program: ts.Program,
  sourceFile: ts.SourceFile,
  extraWhitelist: readonly string[] | undefined,
  debugMode: boolean,
  fallback: StateIdFallback,
  rejectionCategory: ts.DiagnosticCategory,
): InlineRecoveryResult | { rejectionDiagnostics: readonly ts.Diagnostic[] } | undefined {
  // 採否判定: 候補ごとに accepted / rejected を確定
  const classifications = classifyHelperCandidates(arrowFn, sourceFile, checker);
  const rejectionDiagnostics = buildRejectionDiagnostics(
    classifications,
    sourceFile,
    rejectionCategory,
  );
  const inlineMap = buildInlineMap(classifications);

  // 採用候補が無い場合: rejection 診断のみ呼び出し側に返却
  if (inlineMap.size === 0) {
    if (rejectionDiagnostics.length === 0) return undefined;
    return { rejectionDiagnostics };
  }

  // インライン関数名を whitelist に追加して再バリデーション
  const extendedWhitelist = [...(extraWhitelist ?? []), ...inlineMap.keys()];
  const revalidDiags = validateHandler(ir, refs, program, sourceFile, extendedWhitelist);
  if (revalidDiags.some((d) => d.category === ts.DiagnosticCategory.Error)) {
    return rejectionDiagnostics.length > 0 ? { rejectionDiagnostics } : undefined;
  }

  // 各インライン関数本体を個別にバリデーション
  for (const [name, funcArrow] of inlineMap) {
    const { ir: inlineIr } = extractHandlerIR(funcArrow, sourceFile);
    if (inlineIr === undefined) {
      return rejectionDiagnostics.length > 0 ? { rejectionDiagnostics } : undefined;
    }
    const inlineRefs = collectIdentifiers(inlineIr);
    const inlineDiags = validateHandler(inlineIr, inlineRefs, program, sourceFile, extraWhitelist);
    if (inlineDiags.some((d) => d.category === ts.DiagnosticCategory.Error)) {
      if (debugMode) {
        console.log(`[draftole-transformer] inline recovery: '${name}' body has validation errors`);
      }
      return rejectionDiagnostics.length > 0 ? { rejectionDiagnostics } : undefined;
    }
  }

  const resolution = buildStateIdMapWithInlining(arrowFn, checker, inlineMap, fallback);

  // マージ後も未解決 Symbol が残る場合は recovery 不成立とする。
  if (resolution.unresolved.size > 0) {
    if (debugMode) {
      const names = [...resolution.unresolved.values()].map((id) => id.text).join(', ');
      console.log(
        `[draftole-transformer] inline recovery: unresolved states remain after merge: ${names}`,
      );
    }
    return rejectionDiagnostics.length > 0 ? { rejectionDiagnostics } : undefined;
  }

  return { stateIdMap: resolution.stateIdMap, inlineMap, rejectionDiagnostics };
}

// ---- Phase 4a delegate: runInlineRecoveryBranch -----------------------------
//
// (transformer-index-pipeline-split task 3.3)
// 旧 index.ts 主ループ L600-L630 相当のロジックを 2 個の private sub-helper に分割し、
// runInlineRecoveryBranch から順次呼ぶ構造に再構成する (Req 6.1 / 6.2)。

/**
 * `attemptInlineRecovery` 戻り値: tryInlineRecovery の 3 通りの戻り値
 * (success / failure-with-rejections / undefined) を flat な outcome 型に正規化する。
 */
interface InlineRecoveryAttempt {
  readonly success: boolean;
  readonly stateIdMap: ReadonlyMap<ts.Symbol, string>;
  readonly inlineMap: ReadonlyMap<string, ts.ArrowFunction> | undefined;
  readonly rejectionDiagnostics: readonly ts.Diagnostic[];
}

/**
 * sub-helper 1: tryInlineRecovery を呼び、3 通りの戻り値を flat な `InlineRecoveryAttempt`
 * に正規化する。base.strictHelpers に応じて rejectionCategory (Warning / Suggestion) を決定し、
 * base.debug を debugMode として渡す。
 */
function attemptInlineRecovery(
  base: TransformerBaseContext,
  callInfo: OnCallInfo,
  ir: HandlerIR,
): InlineRecoveryAttempt {
  const refs = collectIdentifiers(ir);
  const rejectionCategory = base.strictHelpers
    ? ts.DiagnosticCategory.Warning
    : ts.DiagnosticCategory.Suggestion;
  const result = tryInlineRecovery(
    callInfo.handlerArg,
    ir,
    refs,
    base.checker,
    base.program,
    base.sourceFile,
    base.extraWhitelist,
    base.debug,
    base.fallback,
    rejectionCategory,
  );
  if (result === undefined) {
    return { success: false, stateIdMap: new Map(), inlineMap: undefined, rejectionDiagnostics: [] };
  }
  if ('stateIdMap' in result) {
    return {
      success: true,
      stateIdMap: result.stateIdMap,
      inlineMap: result.inlineMap,
      rejectionDiagnostics: result.rejectionDiagnostics,
    };
  }
  return {
    success: false,
    stateIdMap: new Map(),
    inlineMap: undefined,
    rejectionDiagnostics: result.rejectionDiagnostics,
  };
}

/**
 * sub-helper 2: 元の validation エラーと DT012 rejection 診断を mix する中央管理箇所。
 *
 * - success: recovery 成功 → 元の validation エラーは superseded、rejection のみ発行
 * - failure: 元の validation エラー + DT012 rejection を順に concat
 *
 * 既存テストが mix 順序を等価性 oracle とするため、本関数で順序を固定する。
 */
function composeRecoveryDiagnostics(
  originalValidationDiags: readonly ts.Diagnostic[],
  rejectionDiagnostics: readonly ts.Diagnostic[],
  success: boolean,
): readonly ts.Diagnostic[] {
  if (success) return rejectionDiagnostics;
  return [...originalValidationDiags, ...rejectionDiagnostics];
}

/**
 * Phase 4a per-call delegate: validation エラーありの場合の inline recovery 分岐を実行する。
 *
 * 2 個の private sub-helper を順次呼んで `RecoveryOutcome` を組み立てる薄い
 * オーケストレーター (本体 ≤ 12 行)。
 *
 * @param base - per-invocation base context (checker / program / fallback / debug など)
 * @param callInfo - 対象 .on() 呼出情報
 * @param ir - Phase 2a で抽出済の HandlerIR
 * @param validation - Phase 3 outcome (元の validation 診断を保持)
 */
export function runInlineRecoveryBranch(
  base: TransformerBaseContext,
  callInfo: OnCallInfo,
  ir: HandlerIR,
  validation: ValidationOutcome,
): RecoveryOutcome {
  const attempt = attemptInlineRecovery(base, callInfo, ir);
  return {
    success: attempt.success,
    stateIdMap: attempt.stateIdMap,
    inlineMap: attempt.inlineMap,
    diagnostics: composeRecoveryDiagnostics(
      validation.diagnostics,
      attempt.rejectionDiagnostics,
      attempt.success,
    ),
  };
}
