/**
 * command-injector: 検査 PASS した `.on` 呼び出しの第2引数を
 * `(s) => s._emitHandlerBody("<serialized>", [<params>])` に書き換え、
 * 生成アロー関数に `_draftoleEmitted = true` マーカーを付与するラッパを挿入する。
 *
 * Task 6.2:
 * - `SerializedHandler { code, params }` を受け取り、`.on` の CallExpression を変換
 * - 書き換え後の第2引数:
 *   `Object.assign((s) => s._emitHandlerBody("<code>", [<params>]), { _draftoleEmitted: true })`
 * - `Object.assign` により runtime で `_draftoleEmitted === true` が判定可能になる
 *
 * 対応 requirements: 1.5, 4.1
 * 対応 design: §command-injector, §`.on` 実装側 dispatcher 擬似コード
 */

import * as ts from 'typescript';
import type { SerializedHandler } from './handler-serializer.ts';

// ---- 公開 API ---------------------------------------------------------------

/**
 * `.on(event, originalArrow)` の CallExpression を受け取り、
 * 第2引数を `Object.assign((s) => s._emitHandlerBody(...), { _draftoleEmitted: true })`
 * に書き換えた新しい CallExpression を返す。
 *
 * @param callExpr - 元の `.on(event, arrow)` CallExpression
 * @param serialized - `handler-serializer` の出力 `SerializedHandler`
 * @returns 書き換え後の CallExpression
 */
export function injectCommand(
  callExpr: ts.CallExpression,
  serialized: SerializedHandler,
): ts.CallExpression {
  const factory = ts.factory;

  // ---- (s) => s._emitHandlerBody("<code>", [<params>]) を生成 ---------------

  // `s` 仮引数
  const sParam = factory.createParameterDeclaration(
    /* modifiers */ undefined,
    /* dotDotDotToken */ undefined,
    factory.createIdentifier('s'),
    /* questionToken */ undefined,
    /* type */ undefined,
    /* initializer */ undefined,
  );

  // `s._emitHandlerBody` プロパティアクセス
  const emitHandlerBodyAccess = factory.createPropertyAccessExpression(
    factory.createIdentifier('s'),
    factory.createIdentifier('_emitHandlerBody'),
  );

  // params 配列リテラル: ["e"] or []
  const paramsArrayLiteral = factory.createArrayLiteralExpression(
    serialized.params.map((p) => factory.createStringLiteral(p)),
    /* multiLine */ false,
  );

  // `s._emitHandlerBody("<code>", [<params>])` 呼び出し
  const emitHandlerBodyCall = factory.createCallExpression(
    emitHandlerBodyAccess,
    /* typeArgs */ undefined,
    [
      factory.createStringLiteral(serialized.code),
      paramsArrayLiteral,
    ],
  );

  // `(s) => s._emitHandlerBody(...)` アロー関数
  const innerArrow = factory.createArrowFunction(
    /* modifiers */ undefined,
    /* typeParams */ undefined,
    [sParam],
    /* returnType */ undefined,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    emitHandlerBodyCall,
  );

  // ---- Object.assign(innerArrow, { _draftoleEmitted: true }) を生成 ----------

  // `{ _draftoleEmitted: true }` オブジェクトリテラル
  const markerObject = factory.createObjectLiteralExpression(
    [
      factory.createPropertyAssignment(
        factory.createIdentifier('_draftoleEmitted'),
        factory.createTrue(),
      ),
    ],
    /* multiLine */ false,
  );

  // `Object.assign(...)` 呼び出し
  const objectAssignCall = factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier('Object'),
      factory.createIdentifier('assign'),
    ),
    /* typeArgs */ undefined,
    [innerArrow, markerObject],
  );

  // ---- 元の CallExpression の第2引数を差し替えた新 CallExpression を生成 ------

  // 元の引数リストから第2引数（インデックス1）を objectAssignCall に差し替える。
  // 注意: 第1引数（イベント名）は元の StringLiteral ノードをそのまま渡す。
  // printer は元の SourceFile でのみ正しく出力できるため、テスト側では
  // 呼び出し元の SourceFile を使って printNode すること。
  const originalArgs = callExpr.arguments;
  const newArgs: ts.Expression[] = [
    originalArgs[0], // 第1引数（イベント名）はそのまま保持
    objectAssignCall, // 第2引数を書き換え
    // 追加引数がある場合（通常ない）も保持
    ...Array.from(originalArgs).slice(2),
  ];

  return factory.updateCallExpression(
    callExpr,
    callExpr.expression,
    callExpr.typeArguments,
    newArgs,
  );
}
