/**
 * transformer テスト共通ヘルパー
 *
 * 診断配列の長さや index 直接アクセスに依存する既存アサーションを、
 * カテゴリ・コード単位でフィルタした上で検証できるように切替えるため
 * のユーティリティ群。
 *
 * - `excludeCode(diagnostics, ...codes)`: 指定 code の診断を除外
 * - `errorsOnly(diagnostics)`: Error カテゴリのみを抽出
 */

import * as ts from 'typescript';

/**
 * `diagnostics` から指定の code をすべて除外して返す。
 * 文字列 code（例: `'DT012'`）と数値 code（例: `9012`）の双方を許容する。
 */
export function excludeCode(
  diagnostics: readonly ts.Diagnostic[],
  ...codes: ReadonlyArray<string | number>
): ts.Diagnostic[] {
  if (codes.length === 0) return [...diagnostics];
  const numericCodes = new Set<number>();
  const stringCodes = new Set<string>();
  for (const c of codes) {
    if (typeof c === 'number') numericCodes.add(c);
    else stringCodes.add(c);
  }
  return diagnostics.filter((d) => {
    if (numericCodes.has(d.code)) return false;
    if (stringCodes.size > 0) {
      const text = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
      for (const sc of stringCodes) {
        if (text.startsWith(`${sc}:`) || text.includes(`${sc}:`)) return false;
      }
    }
    return true;
  });
}

/**
 * `diagnostics` から Error カテゴリのみを抽出して返す。
 */
export function errorsOnly(diagnostics: readonly ts.Diagnostic[]): ts.Diagnostic[] {
  return diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
}
