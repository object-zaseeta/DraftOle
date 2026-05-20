/**
 * MVP-3.3: DOMContentLoaded ラッパー
 *
 * JS コードを document.addEventListener("DOMContentLoaded", ...) でラップする。
 * 既にラップ済みの場合は二重ラップしない。
 */

const DOM_READY_PATTERN = /DOMContentLoaded/;

/**
 * JS コードを DOMContentLoaded イベントリスナーでラップする。
 * 空文字列や既にラップ済みのコードはそのまま返す。
 */
export function wrapDOMReady(js: string): string {
  const trimmed = js.trim();
  if (trimmed.length === 0) return '';
  if (DOM_READY_PATTERN.test(trimmed)) return trimmed;
  return `document.addEventListener("DOMContentLoaded", () => {\n${trimmed}\n});`;
}
