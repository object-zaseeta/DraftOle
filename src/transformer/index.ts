/**
 * draftole-transformer エントリポイント
 *
 * Task 6.3: transformer 本体への結線
 *
 * パイプライン:
 *   call-detector → ir-extractor → identifier-collector
 *   → whitelist-validator → handler-serializer → command-injector
 *
 * ファイル単位で ts.Diagnostic[] を集約し、1 件でも error があれば
 * 当該ファイルの AST 書き換えを抑制する。
 *
 * 対応 requirements: 2.7, 4.1, 4.2, 5.1, 5.3, 5.4
 */

import * as ts from 'typescript';
import { createCallDetector } from './call-detector';
import { injectCommand } from './command-injector';
import { createDiagnostic } from './diagnostic-reporter';
import { runEachScopeBranch } from './each-scope-branch';
import { writeTransformerDiagnostics } from './format-diagnostics.js';
import { extractHandlerIR } from './handler-ir-extractor';
import { serializeHandler } from './handler-serializer';
import {
  DT014_CODE,
  runHelperAwarePreCheck,
} from './helper-context-resolver';
import { collectIdentifiers } from './identifier-collector';
import { runInlineRecoveryBranch } from './inline-recovery';
import {
  buildLabeledCall,
  createLabelImportDeclaration,
  createLabelRequireStatement,
  findDraftOleImport,
  hasLabelImport,
} from './label-injector';
import type {
  PerCallContext,
  StateResolutionOutcome,
  TransformerBaseContext,
} from './per-call-context';
import { createSourceStateNameFallback } from './state-id-fallback';
import { detectThemeClassCalls } from './theme-class-detector';
import { resolveVarName } from './varname-resolver';
import { validateHandler } from './whitelist-validator';

// ---- 公開オプション型 -------------------------------------------------------

export interface DraftoleTransformerOptions {
  /** 追加のホワイトリスト識別子（利用者側拡張、通常不要）*/
  extraWhitelist?: readonly string[];
  /** デバッグ出力 */
  debug?: boolean;
  /**
   * true の場合、ヘルパー採否診断 (DT012) を Warning カテゴリで発行する。
   * 既定 false（Suggestion）。Error ではないため、いずれもファイル全体の
   * rewrite 抑制 (`hasFileError`) には寄与しない。
   * 仕様: transformer-inline-recovery-spec design §6.1
   */
  strictHelpers?: boolean;
  /**
   * 集約された `ts.Diagnostic` を受け取るコールバック。テスト用途。
   * ファイル単位で全診断を蓄積した時点で 1 度だけ呼ばれる。
   */
  onDiagnostics?: (diagnostics: readonly ts.Diagnostic[], sourceFile: ts.SourceFile) => void;
}

// ---- フィーチャーフラグ ------------------------------------------------------

/**
 * Task 6.3: パイプライン結線フィーチャーフラグ。
 *
 * Feature Flag Protocol に従い:
 * - false: 素通し（従来動作）
 * - true: call-detector → ... → command-injector パイプラインを有効化
 *
 * GREEN フェーズで true に設定し、テスト通過後にフラグを削除して直書きにする。
 */
const PIPELINE_ENABLED = true;

// ---- module-private helpers (transformer-index-pipeline-split task 4.1) -----

/**
 * `serializeHandler` 入力を `PerCallContext` から構築する。
 * recovery / each-scope 分岐の outcome から stateIdMap / inlineMap / eachScopeParams を抽出する。
 */
function serializeInputFromContext(ctx: PerCallContext): Parameters<typeof serializeHandler>[0] {
  const ir = ctx.extraction.ir;
  if (ctx.resolution.kind === 'recovery') {
    return {
      ir,
      stateIdMap: ctx.resolution.outcome.stateIdMap as Map<ts.Symbol, string>,
      inlineMap: ctx.resolution.outcome.inlineMap as Map<string, ts.ArrowFunction> | undefined,
    };
  }
  if (ctx.resolution.kind === 'each-scope') {
    return {
      ir,
      stateIdMap: ctx.resolution.outcome.stateIdMap as Map<ts.Symbol, string>,
      eachScopeParams: ctx.resolution.outcome.eachScopeParams as Map<string, string> | undefined,
    };
  }
  return { ir, stateIdMap: new Map<ts.Symbol, string>() };
}

/**
 * 全 phase outcome の diagnostics を結合する。
 * - recovery 分岐: composeRecoveryDiagnostics が既に元の validation と DT012 を mix 済みのため
 *   ctx.validation.diagnostics は二重発行しない
 * - each-scope 分岐: validation diagnostics (warnings) + each-scope diagnostics の両方を発行
 * - skipped: preCheck + extraction + resolution の独自 diagnostics のみ
 */
function collectAllDiagnostics(ctx: PerCallContext): readonly ts.Diagnostic[] {
  const base = [...ctx.preCheck.diagnostics, ...ctx.extraction.diagnostics];
  if (ctx.resolution.kind === 'each-scope') {
    return [...base, ...ctx.validation.diagnostics, ...ctx.resolution.outcome.diagnostics];
  }
  if (ctx.resolution.kind === 'recovery') {
    return [...base, ...ctx.resolution.outcome.diagnostics];
  }
  return [...base, ...ctx.resolution.diagnostics];
}

/** serialize + inject を実行すべきかを判定する。失敗・skip 経路では false。 */
function shouldSerialize(ctx: PerCallContext): boolean {
  if (ctx.resolution.kind === 'skipped') return false;
  if (ctx.resolution.kind === 'recovery') return ctx.resolution.outcome.success;
  return true;
}

/**
 * 匿名 theme.class(...) 呼び出しを検出して varName ラベルを付与し、rewriteMap に
 * 書き換えを追加する。__draftole_label__ import 注入が必要なら moduleSpecifier を返す。
 * (旧実装で行っていた既存 ImportDeclaration の 1:1 更新は emit 経路で binder に拾われず
 *  ReferenceError を引き起こすため、新規 import 文を別途追加する。)
 */
function processThemeClassLabeling(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  rewriteMap: Map<ts.CallExpression, ts.CallExpression>,
  fileDiagnostics: ts.Diagnostic[],
): { needsLabelImport: boolean; labelImportModuleSpecifier: string | undefined } {
  const themeClassCalls = detectThemeClassCalls(sourceFile, checker);
  const alreadyHasLabelImport = hasLabelImport(sourceFile);
  const labelImportSite = findDraftOleImport(sourceFile);
  let needsLabelImport = false;
  let labelImportModuleSpecifier: string | undefined;
  for (const { callExpr } of themeClassCalls) {
    const varName = resolveVarName(callExpr, sourceFile, checker);
    if (varName === undefined) continue;
    if (!alreadyHasLabelImport && labelImportSite === undefined) {
      fileDiagnostics.push(
        createDiagnostic('DT013', callExpr, sourceFile, {
          identifierName: varName,
          fixExample: `import { Root } from 'draft-ole';`,
        }),
      );
      continue;
    }
    rewriteMap.set(callExpr, buildLabeledCall(callExpr, varName));
    if (!alreadyHasLabelImport) {
      needsLabelImport = true;
      if (labelImportSite !== undefined) {
        labelImportModuleSpecifier = labelImportSite.moduleSpecifier;
      }
    }
  }
  return { needsLabelImport, labelImportModuleSpecifier };
}

/**
 * SourceFile 先頭に __draftole_label__ の取り込み文を prepend する。
 * CommonJS 出力では require 形式 (TS の ES→CJS modules transformer による
 * 識別子置換が transformer 由来の新規シンボルを認識しないため)、
 * ESM 出力では ImportDeclaration を生成する。
 */
function prependLabelImport(
  visited: ts.SourceFile,
  moduleSpecifier: string,
  moduleKind: ts.ModuleKind,
): ts.SourceFile {
  const isCjs =
    moduleKind === ts.ModuleKind.CommonJS ||
    moduleKind === ts.ModuleKind.Node16 ||
    moduleKind === ts.ModuleKind.NodeNext;
  const newStmt = isCjs
    ? createLabelRequireStatement(moduleSpecifier)
    : createLabelImportDeclaration(moduleSpecifier);
  return ts.factory.updateSourceFile(visited, [newStmt, ...visited.statements]);
}

// ---- ファクトリ関数 ---------------------------------------------------------

/**
 * draftole TypeScript transformer.
 *
 * パイプライン:
 *   createCallDetector(program) → detectResult
 *   for each OnCallInfo:
 *     extractHandlerIR(arrowFn, sourceFile) → HandlerIRResult
 *     collectIdentifiers(ir) → IdentifierRef[]
 *     validateHandler(ir, refs, program, sourceFile, extraWhitelist) → ts.Diagnostic[]
 *     if no errors:
 *       buildStateIdMap(arrowFn, checker) → stateIdMap
 *       serializeHandler({ ir, stateIdMap }) → SerializedHandler
 *       injectCommand(callExpr, serialized) → new CallExpression
 *
 * ファイル単位で ts.Diagnostic[] を集約。
 * 1 件でも error があれば、ファイル全体の AST 書き換えを抑制する。
 *
 * @param program  ts.Program インスタンス（TypeChecker 取得に使用）
 * @param options  任意オプション
 * @returns        ts.TransformerFactory<ts.SourceFile>
 */
export default function draftoleTransformer(
  program: ts.Program,
  options?: DraftoleTransformerOptions,
): ts.TransformerFactory<ts.SourceFile> {
  // program が undefined（pass-through テスト等）または PIPELINE_ENABLED === false: 素通し
  if (!PIPELINE_ENABLED || program == null) {
    return (_context: ts.TransformationContext) =>
      (sourceFile: ts.SourceFile): ts.SourceFile => sourceFile;
  }

  const checker = program.getTypeChecker();
  const detect = createCallDetector(program);
  const extraWhitelist = options?.extraWhitelist;
  const debugMode = options?.debug ?? false;
  const onDiagnostics = options?.onDiagnostics;

  return (context: ts.TransformationContext) =>
    (sourceFile: ts.SourceFile): ts.SourceFile => {
      // ---- Step 1: call-detector で .on(event, arrow) を検出 -----------------
      const detectResult = detect(sourceFile);

      // call-detector のエラー診断を収集
      const fileDiagnostics: ts.Diagnostic[] = [...detectResult.diagnostics];

      if (debugMode) {
        console.log(
          `[draftole-transformer] ${sourceFile.fileName}: detected=${detectResult.detected.length}`,
        );
      }

      // ---- Step 1.5: ソースファイルスキャンで StateIdFallback を構築 ------------
      // StateRegistry.allocateId() の実行順を静的に再現し、型システムに
      // 文字列リテラル型がない場合のフォールバックとして使用する。
      // Task 2.2: フォールバック責務を `state-id-fallback.ts` へ局所化。
      // 本ファイルは pass-through adapter のみを担う（フォールバック注入経路の差し替え）。
      const fallback = createSourceStateNameFallback(sourceFile, checker);

      // ---- Step 2: 各 OnCallInfo に対して IR 抽出 → 検証 → シリアライズ --------
      // エラーなしの場合のみ書き換え用マップを構築する
      const rewriteMap = new Map<ts.CallExpression, ts.CallExpression>();

      const base: TransformerBaseContext = {
        program,
        checker,
        sourceFile,
        extraWhitelist: extraWhitelist ?? [],
        strictHelpers: options?.strictHelpers ?? false,
        helperCallSites: [],
        fallback,
        debug: debugMode,
      };

      for (const callInfo of detectResult.detected) {
        // Phase 1: helper-aware pre-check
        const preCheck = runHelperAwarePreCheck(base, callInfo);
        if (preCheck.diagnostics.some((d) => d.category === ts.DiagnosticCategory.Error)) {
          fileDiagnostics.push(...preCheck.diagnostics);
          continue;
        }
        // Phase 2a: IR extraction (ir-undefined は早期 skip)
        const extractResult = extractHandlerIR(callInfo.handlerArg, sourceFile);
        if (extractResult.ir === undefined) {
          if (extractResult.warning !== undefined) fileDiagnostics.push(extractResult.warning);
          continue;
        }
        const extraction = {
          ir: extractResult.ir,
          diagnostics: extractResult.warning !== undefined ? [extractResult.warning] : [],
        };
        // Phase 2b: identifier collection
        const refs = collectIdentifiers(extraction.ir);
        const identifiers = { refs };
        // Phase 3: whitelist validation (helper-aware 経路では paramSymbols を伝播)
        const validationDiags = validateHandler(
          extraction.ir, refs, program, sourceFile, extraWhitelist,
          preCheck.helperPathUsed
            ? { paramSymbols: preCheck.inheritedEachParamSymbols }
            : undefined,
        );
        const validation = {
          hasErrors: validationDiags.some((d) => d.category === ts.DiagnosticCategory.Error),
          diagnostics: validationDiags,
        };
        // Phase 4: state resolution branch (recovery vs each-scope)
        const resolution: StateResolutionOutcome = validation.hasErrors
          ? { kind: 'recovery', outcome: runInlineRecoveryBranch(base, callInfo, extraction.ir, validation) }
          : { kind: 'each-scope', outcome: runEachScopeBranch(base, callInfo, preCheck) };
        // PerCallContext を assembled-at-end pattern で組み立て
        const ctx: PerCallContext = {
          base, callInfo, preCheck, extraction, identifiers, validation, resolution,
        };
        // 全 phase の diagnostics を集約 (closure capture 廃止)
        fileDiagnostics.push(...collectAllDiagnostics(ctx));
        if (!shouldSerialize(ctx)) continue;
        // Phase 5: serialize + inject
        let serialized: ReturnType<typeof serializeHandler>;
        try {
          serialized = serializeHandler(serializeInputFromContext(ctx));
        } catch (e: unknown) {
          if (debugMode) console.error('[draftole-transformer] serializeHandler failed:', e);
          continue;
        }
        if (debugMode) {
          console.log(
            `[draftole-transformer] serialized: code="${serialized.code}", params=${JSON.stringify(serialized.params)}`,
          );
        }
        rewriteMap.set(callInfo.callExpr, injectCommand(callInfo.callExpr, serialized));
      }

      // ---- Step 2.5: theme.class() varName ラベリング ------------------------
      const { needsLabelImport, labelImportModuleSpecifier } = processThemeClassLabeling(
        sourceFile, checker, rewriteMap, fileDiagnostics,
      );

      // ---- Step 2.9: 観測用コールバック（テスト等）---------------------------
      if (onDiagnostics !== undefined) {
        onDiagnostics(fileDiagnostics, sourceFile);
      } else if (fileDiagnostics.length > 0) {
        writeTransformerDiagnostics(fileDiagnostics, process.stderr);
      }

      // ---- Step 3: error があればファイル全体の書き換えを抑制 -----------------
      // DT014 (enclosing-helper rejection) は当該 handler のみスキップ済みなので除外する。
      const hasFileError = fileDiagnostics.some(
        (d) => d.category === ts.DiagnosticCategory.Error && d.code !== DT014_CODE,
      );
      if (hasFileError) {
        if (debugMode) {
          console.log(
            `[draftole-transformer] ${sourceFile.fileName}: has errors, suppressing all rewrites`,
          );
        }
        return sourceFile;
      }

      // ---- Step 4: rewriteMap に従って AST 書き換えを適用 ---------------------
      if (rewriteMap.size === 0 && !needsLabelImport) return sourceFile;

      // チェーン内の内側 .on() 呼び出しを到達可能にするため replacement の children も
      // 再帰的に visit する。theme.class ラベル注入では replacement に元の node 自身が
      // 子として含まれるため、再帰前にキーを削除して無限再帰を防ぐ。
      function visitor(node: ts.Node): ts.Node {
        if (ts.isCallExpression(node)) {
          const replacement = rewriteMap.get(node);
          if (replacement !== undefined) {
            rewriteMap.delete(node);
            return ts.visitEachChild(replacement, visitor, context);
          }
        }
        return ts.visitEachChild(node, visitor, context);
      }

      const visited = ts.visitEachChild(sourceFile, visitor, context) as ts.SourceFile;
      if (needsLabelImport && labelImportModuleSpecifier !== undefined) {
        const moduleKind = program.getCompilerOptions().module ?? ts.ModuleKind.ESNext;
        return prependLabelImport(visited, labelImportModuleSpecifier, moduleKind);
      }
      return visited;
    };
}
