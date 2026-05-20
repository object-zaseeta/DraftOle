/**
 * each-scope-branch — Phase 4b per-call delegate
 *
 * (transformer-index-pipeline-split task 3.2)
 *
 * validation エラーなしの場合の each-scope 分岐を集約する delegate と
 * その内部 sub-helper 群。旧 index.ts 主ループ L630-L700 相当のロジックを
 * 3 個の named sub-helper に分割し、`runEachScopeBranch` から順次呼ぶ構造に
 * 再構成する。cognitive concentration を dispersed する目的で sub-helper
 * 単位での独立 unit test 可能性を保つ (Req 6.1, 6.2)。
 *
 * 本モジュールは each-state-rewriter.ts の Phase 4b orchestration 専用に
 * 分離されている (Req 7.3: 受け側モジュールが 500 行を超えるため別ファイルへ分散)。
 */

import * as ts from 'typescript';
import type { OnCallInfo } from './call-detector';
import { createDiagnostic } from './diagnostic-reporter';
import {
  buildEachParamNameMap,
  collectEachScopeParamSymbols,
  detectEachScopeContext,
  validateEachScopeUsage,
  type EachScopeContext,
} from './each-state-rewriter';
import type {
  EachScopeOutcome,
  PreCheckOutcome,
  TransformerBaseContext,
} from './per-call-context';
import { buildStateIdMap } from './state-id-resolver';

// ---- sub-helpers (module-private) -------------------------------------------

/**
 * sub-helper 1: helper-aware path を考慮した EachScopeContext / paramSymbols を解決する。
 *
 * `preCheck.helperPathUsed === true` の場合は inherited 値を再利用する。
 * それ以外は直接 walk-up で `detectEachScopeContext` を呼び、'ambiguous' は null に正規化する
 * (直接 walk-up 経路は helperCallSites 未指定のため理論上 'ambiguous' を返さないが、
 * 型 narrowing のため明示的にハンドリングする)。
 */
function resolveEachScopeForCall(
  base: TransformerBaseContext,
  callInfo: OnCallInfo,
  preCheck: PreCheckOutcome,
): {
  readonly eachContext: EachScopeContext | null;
  readonly eachParamSymbols: ReadonlySet<ts.Symbol> | undefined;
} {
  if (preCheck.helperPathUsed) {
    return {
      eachContext: preCheck.inheritedEachContext,
      eachParamSymbols: preCheck.inheritedEachParamSymbols,
    };
  }
  const directCtx = detectEachScopeContext(callInfo.callExpr, base.checker);
  const eachContext: EachScopeContext | null =
    directCtx === null || directCtx === 'ambiguous' ? null : directCtx;
  const eachParamSymbols =
    eachContext === null
      ? undefined
      : collectEachScopeParamSymbols(callInfo.callExpr, base.checker);
  return { eachContext, eachParamSymbols };
}

/**
 * sub-helper 2: EachScopeContext が確定している場合のみ DT003 使用検証を実施。
 * 既存 `validateEachScopeUsage` を呼ぶ薄いラッパ。
 */
function validateEachUsage(
  arrowFn: ts.ArrowFunction,
  eachContext: EachScopeContext | null,
  sourceFile: ts.SourceFile,
): readonly ts.Diagnostic[] {
  if (eachContext === null) return [];
  return validateEachScopeUsage(arrowFn, eachContext, sourceFile);
}

/**
 * sub-helper 3: stateIdMap を構築し、unresolved Symbol を DT011 診断に変換する。
 * `eachParamSymbols` は `buildStateIdMap` の `eachScopeParamSymbols` オプションへ渡され、
 * each scope param と一致する Symbol は unresolved に積まれない (既存挙動)。
 */
function composeStateIdMapForEachScope(
  arrowFn: ts.ArrowFunction,
  base: TransformerBaseContext,
  eachParamSymbols: ReadonlySet<ts.Symbol> | undefined,
): {
  readonly stateIdMap: ReadonlyMap<ts.Symbol, string>;
  readonly diagnostics: readonly ts.Diagnostic[];
} {
  // buildStateIdMap は Set<ts.Symbol> を期待する。ReadonlySet を Set に widen する。
  const resolution = buildStateIdMap(arrowFn, base.checker, {
    fallback: base.fallback,
    eachScopeParamSymbols: eachParamSymbols as Set<ts.Symbol> | undefined,
  });
  const diagnostics: ts.Diagnostic[] = [];
  for (const [, identNode] of resolution.unresolved) {
    const identifierName = identNode.text;
    diagnostics.push(
      createDiagnostic('DT011', identNode, base.sourceFile, {
        identifierName,
        fixExample: `root.state<"${identifierName}-id">(...)`,
      }),
    );
  }
  return { stateIdMap: resolution.stateIdMap, diagnostics };
}

// ---- Phase 4b delegate ------------------------------------------------------

/**
 * Phase 4b per-call delegate: validation エラーなしの場合の each-scope 分岐を実行する。
 *
 * 3 個の private sub-helper を順次呼んで `EachScopeOutcome` を組み立てる薄い
 * オーケストレーター (本体 ≤ 15 行)。
 *
 * @param base - per-invocation base context (checker / sourceFile / fallback など)
 * @param callInfo - 対象 .on() 呼出情報
 * @param preCheck - Phase 1 outcome (helperPathUsed / inherited each-scope を含む)
 */
export function runEachScopeBranch(
  base: TransformerBaseContext,
  callInfo: OnCallInfo,
  preCheck: PreCheckOutcome,
): EachScopeOutcome {
  const { eachContext, eachParamSymbols } = resolveEachScopeForCall(base, callInfo, preCheck);
  const eachUsageDiags = validateEachUsage(callInfo.handlerArg, eachContext, base.sourceFile);
  const { stateIdMap, diagnostics: dt011Diags } = composeStateIdMapForEachScope(
    callInfo.handlerArg,
    base,
    eachParamSymbols,
  );
  return {
    stateIdMap,
    eachScopeParams: eachContext === null ? undefined : buildEachParamNameMap(eachContext),
    diagnostics: [...eachUsageDiags, ...dt011Diags],
  };
}
