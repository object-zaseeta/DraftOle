/**
 * Task 1.5: HTMLTagProtocol 型ガード
 *
 * 値が HTMLTagProtocol を実装しているかを判定する型ガード関数。
 * duck typing により、render メソッド（関数）と tagType プロパティ（文字列）の
 * 存在を確認する。
 */
import type { HTMLTagProtocol } from '../protocols/html-tag-protocol.js';

/**
 * 値が HTMLTagProtocol を実装しているかを判定する型ガード
 *
 * HTMLTagProtocol の必須プロパティ（render, tagType）の存在と型を確認する。
 *
 * @param value - 判定対象の値
 * @returns value が HTMLTagProtocol を実装していれば true
 */
export function isHTMLTagProtocol(value: unknown): value is HTMLTagProtocol {
  return (
    typeof value === 'object' &&
    value !== null &&
    'render' in value &&
    'tagType' in value &&
    typeof (value as Record<string, unknown>).render === 'function' &&
    typeof (value as Record<string, unknown>).tagType === 'string'
  );
}
