/**
 * call-detector: `.on(event, arrow)` 呼び出しの AST 特定
 *
 * Task 4.1:
 * - `ts.visitEachChild` で `ts.CallExpression` を走査
 * - プロパティアクセスが `.on` かつ引数数=2 かつ第1引数が string literal かつ
 *   第2引数が `ts.ArrowFunction` を特定
 * - `(s: ScriptScope) => ...` 形式（第2引数のパラメータ型が ScriptScope）はスキップ
 * - 第2引数が ArrowFunction でない場合は `ts.Diagnostic` error を生成
 *
 * 対応 requirements: 2.1, 2.4, 5.3
 */

import * as ts from 'typescript';

// ---- 公開型 ------------------------------------------------------------------

export interface OnCallInfo {
  /** `.on(event, arrow)` の CallExpression ノード */
  readonly callExpr: ts.CallExpression;
  /** 第1引数: イベント名 string literal */
  readonly eventArg: ts.StringLiteral;
  /** 第2引数: アロー関数 */
  readonly handlerArg: ts.ArrowFunction;
}

export interface CallDetectorResult {
  /** 検出された `.on(event, arrow)` 呼び出し一覧 */
  readonly detected: readonly OnCallInfo[];
  /** 非アロー関数ハンドラに対するエラー診断一覧 */
  readonly diagnostics: readonly ts.Diagnostic[];
}

// ---- ヘルパー ----------------------------------------------------------------

/**
 * ts.ArrowFunction の第1パラメータの型が ScriptScope であるかを判定する。
 *
 * TypeChecker を使って型名を取得し、`ScriptScope` または `_emitHandlerBody` プロパティ
 * を持つ型であればスキップ対象とする。
 */
function isScriptScopeHandler(
  arrowFn: ts.ArrowFunction,
  checker: ts.TypeChecker,
): boolean {
  if (arrowFn.parameters.length === 0) {
    return false;
  }
  const firstParam = arrowFn.parameters[0];
  const paramType = checker.getTypeAtLocation(firstParam);

  // 型名文字列によるチェック
  const typeName = checker.typeToString(paramType);
  if (typeName === 'ScriptScope') {
    return true;
  }

  // 構造的マーカー: _emitHandlerBody プロパティを持つ型は ScriptScope 派生とみなす
  const emitProp = paramType.getProperty('_emitHandlerBody');
  if (emitProp !== undefined) {
    return true;
  }

  return false;
}

/**
 * ソースファイルの診断情報を作成するヘルパー
 */
function createDiagnostic(
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
    category: ts.DiagnosticCategory.Error,
    code: 9001 as number & { __brand: 'DT001' },
    source: 'draftole-transformer',
  };
}

// ---- メイン実装 --------------------------------------------------------------

/**
 * ts.Program を受け取り、ソースファイルを走査して `.on(event, arrow)` を検出する
 * ビジター関数を返す。
 *
 * フィーチャーフラグが OFF の場合はスタブ（何も検出しない）を返す。
 *
 * @param program ts.Program インスタンス
 * @returns SourceFile を受け取り CallDetectorResult を返す関数
 */
export function createCallDetector(
  program: ts.Program,
): (sourceFile: ts.SourceFile) => CallDetectorResult {
  const checker = program.getTypeChecker();

  return (sourceFile: ts.SourceFile): CallDetectorResult => {
    const detected: OnCallInfo[] = [];
    const diagnostics: ts.Diagnostic[] = [];

    function visit(node: ts.Node): void {
      if (ts.isCallExpression(node)) {
        const expr = node.expression;

        // `.on(...)` の形: PropertyAccessExpression でプロパティ名が "on"
        if (
          ts.isPropertyAccessExpression(expr) &&
          expr.name.text === 'on' &&
          node.arguments.length === 2
        ) {
          const firstArg = node.arguments[0];
          const secondArg = node.arguments[1];

          // 第1引数が string literal であること
          if (ts.isStringLiteral(firstArg)) {
            if (ts.isArrowFunction(secondArg)) {
              // ArrowFunction: ScriptScope 形式かチェック
              if (isScriptScopeHandler(secondArg, checker)) {
                // (s: ScriptScope) => ... 形式はスキップ（従来形式）
              } else {
                // 対象として記録
                detected.push({
                  callExpr: node,
                  eventArg: firstArg,
                  handlerArg: secondArg,
                });
              }
            } else if (
              ts.isFunctionExpression(secondArg) ||
              ts.isFunctionDeclaration(secondArg) ||
              ts.isIdentifier(secondArg) ||
              ts.isPropertyAccessExpression(secondArg)
            ) {
              // 非アロー関数（関数式・変数参照等）はエラー
              diagnostics.push(
                createDiagnostic(
                  secondArg,
                  'DraftOle DT001: .on() handler must be an arrow function `(e) => ...`. ' +
                    'Function declarations, function expressions, and variable references are not supported. ' +
                    'See docs/api/handler-serialization.md',
                ),
              );
            }
          }
        }
      }

      // 子ノードを再帰的に走査
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return { detected, diagnostics };
  };
}
