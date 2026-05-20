/**
 * `ExprFactory` の実装。
 *
 * 設計書 `design.md` の「ExprFactory」節に対応し、以下の API を提供する：
 *   - `createExprFactory()`: callable な関数オブジェクトに `.bool` プロパティを
 *     付与して返す。`root.expr(code)` / `root.expr.bool(code)` のエントリポイント。
 *   - `encodeLiteral(value)`: 文字列/数値は `JSON.stringify` でリテラル化し、
 *     `JsExpr` は `.code` を素通しする共通ヘルパ。要素メソッド側（`setText` 等）
 *     からも再利用される想定（Req 4.5）。
 *
 * 対応 requirement:
 *   - 4.1: `root.expr(code)` が `.code === code` の `JsExpr` を返す
 *   - 4.2: 返された `JsExpr` は `eq`/`ne`/`or`/`trim`/`isFalsy`/`isTruthy` を提供
 *   - 4.3: `.bool(code)` が `JsBoolExpr` を返す
 *   - 4.5: 文字列リテラルを `JSON.stringify` でエンコードする共通経路を提供
 *
 * 実装方針: 既存の内部ファクトリ `_makeJsExpr` / `_makeJsBoolExpr`（`element-ref.ts`）
 * を再利用し、式オブジェクトの振る舞いを単一化する（R-6 決定）。
 */

import { encodeLiteral } from './internal/literal-encode.js';
import { _makeJsBoolExpr, _makeJsExpr } from './element-ref.js';
import type { JsBoolExpr, JsExpr } from './types.ts';

export { encodeLiteral };

/**
 * `root.expr` の型。callable + `.bool` namespace 構造（design.md §ExprFactory）。
 */
export interface ExprFactory {
  /** 任意の JS 式コードを `.code` としてそのまま保持する `JsExpr` を生成する。 */
  (code: string): JsExpr;
  /** 真偽式として扱う生コードを `JsBoolExpr` として生成する。 */
  bool(code: string): JsBoolExpr;
}

/**
 * `ExprFactory` を生成する。
 *
 * 返り値は関数オブジェクトであり、`f(code)` で `JsExpr` を、`f.bool(code)` で
 * `JsBoolExpr` を得る。`Root` からは単一インスタンスを `root.expr` として公開する。
 */
export function createExprFactory(): ExprFactory {
  const factory = ((code: string): JsExpr => _makeJsExpr(code)) as ExprFactory;
  factory.bool = (code: string): JsBoolExpr => _makeJsBoolExpr(code);
  return factory;
}
