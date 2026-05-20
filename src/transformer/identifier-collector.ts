/**
 * identifier-collector: `HandlerIR` → ルート識別子の `IdentifierRef[]`
 *
 * Task 4.3:
 * - HandlerIR を入力にハンドラ本体内のルート識別子一覧を返す
 * - プロパティアクセスはルートのみ拾い、チェーン先は収集しない
 * - paramName に一致する識別子は `event-param`
 * - localDecls に含まれる識別子は `local`
 * - それ以外は `unknown`
 * - 同名識別子は最初の出現のみ（dedupe）
 *
 * 対応 requirements: 2.3, 3.4
 */

import * as ts from 'typescript';
import type { HandlerIR, IdentifierRef } from './handler-ir-extractor.ts';

// ---- ヘルパー ----------------------------------------------------------------

/**
 * 識別子ノードが PropertyAccessExpression のプロパティ名側（右辺）かどうか判定する。
 * `a.b` の `b` は右辺、`a` は左辺（ルート候補）。
 */
function isPropertyAccessRhs(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent)) {
    // parent.name === node ならプロパティ名側（右辺）
    return parent.name === node;
  }
  return false;
}

/**
 * 識別子ノードがオブジェクトリテラルのプロパティキー側かどうか判定する。
 * `{ text: txt, done: false }` の `text` や `done` はプロパティキーなのでスキップする。
 * ただし短縮プロパティ記法 `{ txt }` の場合は値側として収集する。
 */
function isObjectLiteralPropertyKey(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (ts.isPropertyAssignment(parent)) {
    // parent.name === node かつ ShorthandPropertyAssignment でない場合はキー
    return parent.name === node;
  }
  return false;
}

/**
 * 識別子ノードが型位置（型注釈・型アサーション・型パラメータ等）にあるかを判定する。
 * `(e as KeyboardEvent)` の `KeyboardEvent` や `: HTMLInputElement` の `HTMLInputElement`
 * はランタイムには存在しないため、ホワイトリスト検査の対象外とする（Req 3.1）。
 */
function isInTypePosition(node: ts.Identifier): boolean {
  let current: ts.Node = node;
  while (current.parent !== undefined) {
    const parent = current.parent;
    // AsExpression の type 側
    if (ts.isAsExpression(parent) && parent.type === current) return true;
    // TypeAssertion の type 側 (<Type>expr)
    if (ts.isTypeAssertionExpression(parent) && parent.type === current) return true;
    // TypeReference の typeName
    if (ts.isTypeReferenceNode(parent)) return true;
    // Parameter の type 注釈
    if (ts.isParameter(parent) && parent.type === current) return true;
    // VariableDeclaration の type 注釈
    if (ts.isVariableDeclaration(parent) && parent.type === current) return true;
    // 純粋型ノード（TypeNode 系）の中
    if (
      ts.isFunctionTypeNode(parent) ||
      ts.isConstructorTypeNode(parent) ||
      ts.isArrayTypeNode(parent) ||
      ts.isUnionTypeNode(parent) ||
      ts.isIntersectionTypeNode(parent) ||
      ts.isParenthesizedTypeNode(parent) ||
      ts.isTypeLiteralNode(parent) ||
      ts.isMappedTypeNode(parent)
    ) {
      return true;
    }
    current = parent;
  }
  return false;
}

/**
 * IdentifierRef の kind を決定する。
 */
function resolveKind(
  name: string,
  paramName: string | null,
  localDecls: Set<string>,
): IdentifierRef['kind'] {
  if (paramName !== null && name === paramName) {
    return { tag: 'event-param' };
  }
  if (localDecls.has(name)) {
    return { tag: 'local' };
  }
  return { tag: 'unknown' };
}

// ---- メイン実装 --------------------------------------------------------------

/**
 * `HandlerIR` からハンドラ本体内のルート識別子一覧を収集して返す。
 *
 * - プロパティアクセス（`a.b.c`）ではルート（`a`）のみ収集し、`b`・`c` は除外する
 * - 同名識別子は最初の出現のみを返す（名前ベースで dedupe）
 * - `HandlerIR.paramName` に一致するものは `event-param`
 * - `HandlerIR.localDecls` に含まれるものは `local`
 * - それ以外は `unknown`（`whitelist-validator` が後続で分類する）
 *
 * @param ir  `extractHandlerIR` が返した `HandlerIR`
 * @returns   ルート識別子の `IdentifierRef[]`
 */
export function collectIdentifiers(ir: HandlerIR): IdentifierRef[] {
  const { node: arrowFn, paramName, localDecls } = ir;
  const body = arrowFn.body;

  const seen = new Set<string>();
  const result: IdentifierRef[] = [];

  function visit(node: ts.Node): void {
    if (ts.isIdentifier(node)) {
      // プロパティアクセスの右辺（チェーン先）はスキップ
      if (isPropertyAccessRhs(node)) {
        return;
      }
      // オブジェクトリテラルのプロパティキー（{ text: ..., done: ... } の text/done）はスキップ
      if (isObjectLiteralPropertyKey(node)) {
        return;
      }
      // 型位置（型アサーション・型注釈・TypeReference 等）の識別子はスキップ
      if (isInTypePosition(node)) {
        return;
      }

      const name = node.text;

      // 重複をスキップ（名前ベース dedupe）
      if (seen.has(name)) {
        return;
      }
      seen.add(name);

      const kind = resolveKind(name, paramName, localDecls);
      result.push({
        name,
        node,
        symbol: undefined,
        kind,
      });
      return;
    }

    ts.forEachChild(node, visit);
  }

  // パラメータ宣言も走査することで paramName 識別子を収集する
  for (const param of arrowFn.parameters) {
    visit(param.name);
  }
  visit(body);

  return result;
}
