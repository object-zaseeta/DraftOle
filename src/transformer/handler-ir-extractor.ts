/**
 * handler-ir-extractor: `ts.ArrowFunction` → `HandlerIR`
 *
 * Task 4.2:
 * - 引数名・式本体/ブロック本体の正規化
 * - `const`/`let`/パラメータの `localDecls` 収集
 * - 空本体 `() => {}` は warning を発しつつ継続
 *
 * 対応 requirements: 2.2, 2.6, 4.6
 */

import * as ts from 'typescript';

// ---- 公開型 ------------------------------------------------------------------

/**
 * ハンドラ識別子の種別
 */
export type IdentifierKind =
  | { tag: 'state'; runtimeId: string }  // State<T> / Computed<T> 派生
  | { tag: 'event-param' }              // ハンドラの仮引数
  | { tag: 'local' }                    // ローカル宣言
  | { tag: 'builtin'; name: string }    // String/Math/JSON 等
  | { tag: 'unknown' };                 // → 静的エラー候補

/**
 * ハンドラ本体内の識別子参照
 */
export interface IdentifierRef {
  readonly name: string;
  readonly node: ts.Identifier;
  readonly symbol: ts.Symbol | undefined;
  readonly kind: IdentifierKind;
}

/**
 * アロー関数ハンドラの中間表現
 */
export interface HandlerIR {
  /** 元の ArrowFunction AST ノード */
  readonly node: ts.ArrowFunction;
  /** 第1引数名（"e" / "event" / null: 引数なし） */
  readonly paramName: string | null;
  /** 第1引数の型テキスト（"MouseEvent" 等、情報用。null: 型注釈なし or 引数なし） */
  readonly paramTypeText: string | null;
  /** const/let/パラメータで束縛されるローカル名の集合 */
  readonly localDecls: Set<string>;
  /** 本体内の参照識別子一覧（後続の whitelist-validator が使用） */
  readonly referencedIdentifiers: IdentifierRef[];
  /** 式本体アロー（ブロックでない）なら true */
  readonly isExpressionBody: boolean;
}

/**
 * extractHandlerIR の戻り値
 */
export interface HandlerIRResult {
  /** 抽出された IR（空本体の場合も返す） */
  readonly ir: HandlerIR | undefined;
  /** 空本体の場合に生成される warning（それ以外は undefined） */
  readonly warning: ts.Diagnostic | undefined;
}

// ---- ヘルパー ----------------------------------------------------------------

/**
 * ブロック本体が空かどうかを判定する
 */
function isEmptyBlock(block: ts.Block): boolean {
  return block.statements.length === 0;
}

/**
 * ブロック内の const/let 宣言変数名を収集する（ネストされたブロックも再帰的に走査）
 *
 * ネストされた if/for/while ブロック内の `const` / `let` も
 * 同一ハンドラ内のローカルとして扱う（Req 3.1「ハンドラ内ローカル」）。
 */
function collectLocalDeclsFromBlock(block: ts.Block): Set<string> {
  const decls = new Set<string>();

  function visitStatement(stmt: ts.Statement): void {
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          decls.add(decl.name.text);
        }
      }
    } else if (ts.isBlock(stmt)) {
      for (const s of stmt.statements) {
        visitStatement(s);
      }
    } else if (ts.isIfStatement(stmt)) {
      visitStatement(stmt.thenStatement);
      if (stmt.elseStatement !== undefined) {
        visitStatement(stmt.elseStatement);
      }
    } else if (ts.isForStatement(stmt) || ts.isForInStatement(stmt) || ts.isForOfStatement(stmt)) {
      visitStatement(stmt.statement);
    } else if (ts.isWhileStatement(stmt) || ts.isDoStatement(stmt)) {
      visitStatement(stmt.statement);
    } else if (ts.isTryStatement(stmt)) {
      visitStatement(stmt.tryBlock);
      if (stmt.catchClause !== undefined) {
        visitStatement(stmt.catchClause.block);
      }
      if (stmt.finallyBlock !== undefined) {
        visitStatement(stmt.finallyBlock);
      }
    }
  }

  for (const stmt of block.statements) {
    visitStatement(stmt);
  }

  return decls;
}

/**
 * 警告 ts.Diagnostic を生成するヘルパー
 */
function createWarningDiagnostic(
  node: ts.Node,
  messageText: string,
): ts.Diagnostic {
  const sourceFile = node.getSourceFile();
  const start = node.getStart(sourceFile, false);
  const length = node.getWidth(sourceFile);
  return {
    file: sourceFile,
    start,
    length,
    messageText,
    category: ts.DiagnosticCategory.Warning,
    code: 9002 as number & { __brand: 'DT002' },
    source: 'draftole-transformer',
  };
}

// ---- メイン実装 --------------------------------------------------------------

/**
 * `ts.ArrowFunction` から `HandlerIR` を抽出する。
 *
 * @param arrowFn  対象のアロー関数 AST ノード
 * @param sourceFile  ソースファイル（診断情報用）
 * @returns HandlerIRResult
 */
export function extractHandlerIR(
  arrowFn: ts.ArrowFunction,
  sourceFile: ts.SourceFile,
): HandlerIRResult {
  // ---- 引数情報の抽出 ---------------------------------------------------------
  let paramName: string | null = null;
  let paramTypeText: string | null = null;
  const localDecls = new Set<string>();

  if (arrowFn.parameters.length > 0) {
    const firstParam = arrowFn.parameters[0];
    if (ts.isIdentifier(firstParam.name)) {
      paramName = firstParam.name.text;
      localDecls.add(paramName);
    }
    if (firstParam.type !== undefined) {
      paramTypeText = firstParam.type.getText(sourceFile);
    }
  }

  // ---- 本体の判定 -------------------------------------------------------------
  const body = arrowFn.body;
  const isExpressionBody = !ts.isBlock(body);

  // ---- 空本体の検出 -----------------------------------------------------------
  let warning: ts.Diagnostic | undefined;
  if (ts.isBlock(body) && isEmptyBlock(body)) {
    warning = createWarningDiagnostic(
      arrowFn,
      'DraftOle DT002: arrow function handler has empty body `() => {}`. ' +
        'This handler will be registered but will have no effect.',
    );
  }

  // ---- ブロック本体の localDecls 収集 -----------------------------------------
  if (ts.isBlock(body)) {
    const blockDecls = collectLocalDeclsFromBlock(body);
    for (const name of blockDecls) {
      localDecls.add(name);
    }
  }

  // ---- 参照識別子は空（後続の identifier-collector が担当） -------------------
  const referencedIdentifiers: IdentifierRef[] = [];

  const ir: HandlerIR = {
    node: arrowFn,
    paramName,
    paramTypeText,
    localDecls,
    referencedIdentifiers,
    isExpressionBody,
  };

  return { ir, warning };
}
