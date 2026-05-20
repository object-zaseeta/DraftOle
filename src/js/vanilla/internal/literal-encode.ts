/**
 * リテラル値を JS コード文字列にエンコードする共有内部ユーティリティ。
 *
 * 設計書 `design.md` の「3. `encodeLiteral` 共有内部ファイル」に対応する。
 *
 * - `string | number` は `JSON.stringify` でクォートする。
 * - `JsExpr` はすでに JS 式を表すため `.code` をそのまま返す。
 */

import type { JsExpr } from '../types.js';

/**
 * `string | number | JsExpr` をJS式文字列に変換する。
 *
 * @param value - エンコード対象の値
 * @returns JS コード文字列
 */
export function encodeLiteral(value: string | number | JsExpr): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return JSON.stringify(value);
  }
  return value.code;
}
