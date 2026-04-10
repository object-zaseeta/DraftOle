import { DuplicateCssPropertyError } from './errors.js';

/**
 * DEVモードでCSSプロパティの重複設定を検知するガード関数。
 *
 * `DRAFT_OLE_DEV=true` 環境変数が設定されている場合のみ動作する。
 * currentValue が undefined でない（= 既に値が設定済み）なら
 * DuplicateCssPropertyError をthrowする。
 *
 * @param currentValue - 現在のプロパティ値（undefined = 未設定）
 * @param propertyName - CSSプロパティ名（エラーメッセージ用）
 */
export function guardDuplicateCssProperty(
  currentValue: unknown,
  propertyName: string,
): void {
  if (
    process.env.DRAFT_OLE_DEV === 'true' &&
    currentValue !== undefined
  ) {
    throw new DuplicateCssPropertyError(propertyName);
  }
}
