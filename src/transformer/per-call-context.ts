import type * as ts from 'typescript';
import type { OnCallInfo } from './call-detector';
import type { EachScopeContext } from './each-state-rewriter';
import type { HandlerIR, IdentifierRef } from './handler-ir-extractor';
import type { StateIdFallback } from './state-id-fallback';

/**
 * factory invocation 全体で共有される base context。
 * 1 つの SourceFile 変換中、すべての per-call step に同一の base が渡される。
 */
export interface TransformerBaseContext {
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  readonly sourceFile: ts.SourceFile;
  readonly extraWhitelist: readonly string[];
  readonly strictHelpers: boolean;
  readonly helperCallSites: readonly ts.CallExpression[];
  /** state-id-fallback: SourceFile 全体スキャンで構築した stateIdMap フォールバック契約。 */
  readonly fallback: StateIdFallback;
  /** デバッグログ出力フラグ (options.debug 由来)。inline-recovery 等で console 出力に使用。 */
  readonly debug: boolean;
}

/**
 * 1 件の .on(event, arrow) 呼出に対する pipeline 完了時点の不変記録 (assembled-at-end pattern)。
 * 各 step は本 context 全体ではなく必要 field のみを個別 parameter で受け取る (Req 6.2)。
 * factory main loop が末尾で literal として組み立てる。詳細は design.md / research.md 参照。
 */
export interface PerCallContext {
  readonly base: TransformerBaseContext;
  readonly callInfo: OnCallInfo;
  readonly preCheck: PreCheckOutcome;
  readonly extraction: IRExtractionOutcome;
  readonly identifiers: IdentifierCollectionOutcome;
  readonly validation: ValidationOutcome;
  readonly resolution: StateResolutionOutcome;
}

/** Phase 1: helper-aware pre-check の outcome */
export interface PreCheckOutcome {
  readonly helperPathUsed: boolean;
  readonly inheritedEachContext: EachScopeContext | null;
  readonly inheritedEachParamSymbols: ReadonlySet<ts.Symbol> | undefined;
  readonly diagnostics: readonly ts.Diagnostic[];
}

/** Phase 2a: handler IR 抽出の outcome */
export interface IRExtractionOutcome {
  readonly ir: HandlerIR;
  readonly diagnostics: readonly ts.Diagnostic[];
}

/** Phase 2b: identifier collection の outcome */
export interface IdentifierCollectionOutcome {
  readonly refs: readonly IdentifierRef[];
}

/** Phase 3: whitelist validation の outcome */
export interface ValidationOutcome {
  readonly hasErrors: boolean;
  readonly diagnostics: readonly ts.Diagnostic[];
}

/**
 * Phase 4: state resolution の outcome。
 * discriminated union で recovery / each-scope / skipped 分岐を型レベルに表現する (Req 4.5)。
 */
export type StateResolutionOutcome =
  | { readonly kind: 'recovery'; readonly outcome: RecoveryOutcome }
  | { readonly kind: 'each-scope'; readonly outcome: EachScopeOutcome }
  | { readonly kind: 'skipped'; readonly diagnostics: readonly ts.Diagnostic[] };

/** Phase 4a: inline recovery branch の outcome */
export interface RecoveryOutcome {
  readonly success: boolean;
  readonly stateIdMap: ReadonlyMap<ts.Symbol, string>;
  readonly inlineMap: ReadonlyMap<string, ts.ArrowFunction> | undefined;
  readonly diagnostics: readonly ts.Diagnostic[];
}

/** Phase 4b: each-scope branch の outcome */
export interface EachScopeOutcome {
  readonly stateIdMap: ReadonlyMap<ts.Symbol, string>;
  readonly eachScopeParams: ReadonlyMap<string, string> | undefined;
  readonly diagnostics: readonly ts.Diagnostic[];
}

/** Phase 5: handler serialization の outcome (既存 serializeHandler 戻り値の wrapper) */
export interface SerializationOutcome {
  readonly serialized: {
    readonly code: string;
    readonly params: readonly string[];
  };
}

/** Phase 6: command injection の outcome (既存 injectCommand 戻り値の wrapper) */
export interface InjectionOutcome {
  readonly rewritten: ts.CallExpression;
}
