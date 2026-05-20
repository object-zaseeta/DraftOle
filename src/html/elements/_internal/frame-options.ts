/**
 * `FrameOptions` の値変換ロジックを純関数化した helper module。
 *
 * `html-tag.ts` の `.frame()` メソッドからインラインで実装されていた
 * 「数値 → `{n}px` / `Infinity` → `'100%'`（maxWidth / maxHeight のみ）/
 *  文字列素通し」の変換を、`toCssValue` / `applyFrame` の 2 関数として
 * export する。`applyFrame` は副作用として `host` の既存 public method
 * （`width` / `height` / `minWidth` / `maxWidth` / `minHeight` / `maxHeight`）
 * を呼び出すのみで、`host` の internal フィールドには直接触らない。
 *
 * 戻り値は `void`。method chain の `this` 返却は呼び出し元 `html-tag.ts`
 * 側の責務とする。
 *
 * Requirements: 6.1
 * Design: design.md "Components and Interfaces" → `_internal/frame-options.ts`
 *         (Service Interface) / "Allowed Dependencies"
 *
 * @internal
 */
import type { HtmlTagHost } from './host-types.js';
import type { FrameOptions } from '../html-tag.js';

/**
 * `number` / `string` / `Infinity` を CSS 値文字列へ変換する純関数。
 *
 * 変換ルール:
 * - `number`（`Infinity` 以外）→ `{n}px`
 * - `Infinity` かつ `allowInfinity === true` → `'100%'`
 *   （呼び出し元が `maxWidth` / `maxHeight` の場合のみ true を渡す）
 * - `string` → そのまま素通し
 *
 * @param v - 変換対象の値
 * @param allowInfinity - `Infinity` を `'100%'` に変換することを許可するか
 * @returns CSS 値として使用可能な文字列
 *
 * @internal
 */
export function toCssValue(v: number | string, allowInfinity: boolean = false): string {
  if (typeof v === 'number') {
    if (allowInfinity && v === Infinity) return '100%';
    return `${v}px`;
  }
  return v;
}

/**
 * `FrameOptions` を `host` に適用する純関数（副作用付き mutator）。
 *
 * 既存 `.frame()` と同一順序で `host` の 6 種 setter
 * （`width` / `height` / `minWidth` / `maxWidth` / `minHeight` / `maxHeight`）
 * を呼び出す。`maxWidth` と `maxHeight` のみ `Infinity` → `'100%'` 変換を許可する。
 *
 * 戻り値は `void`。method chain の `this` 返却は呼び出し元の責務。
 *
 * @param host - 設定対象の `HtmlTag` インスタンス
 * @param options - 適用する frame オプション
 *
 * @internal
 */
export function applyFrame(host: HtmlTagHost, options: FrameOptions): void {
  if (options.width     !== undefined) host.width(toCssValue(options.width));
  if (options.height    !== undefined) host.height(toCssValue(options.height));
  if (options.minWidth  !== undefined) host.minWidth(toCssValue(options.minWidth));
  if (options.maxWidth  !== undefined) host.maxWidth(toCssValue(options.maxWidth, true));
  if (options.minHeight !== undefined) host.minHeight(toCssValue(options.minHeight));
  if (options.maxHeight !== undefined) host.maxHeight(toCssValue(options.maxHeight, true));
}
