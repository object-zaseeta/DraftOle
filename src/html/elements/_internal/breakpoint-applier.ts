/**
 * `BreakpointStyles` の適用ロジックを純関数化した helper module。
 *
 * `html-tag.ts` の `.responsive()` メソッドからインラインで実装されていた
 * 「名前付きキー（sm/md/lg/xl）の `Breakpoints` 定数解決 / 数値キーの直接利用 /
 *  無効値スキップ / `typeof value === 'string'` の props 採用 /
 *  `host.css.addMediaRule(bp, props)` 呼び出し」を、`applyResponsive` 関数として
 * export する。`host` の internal フィールドには触らず、公開 getter
 * `host.css` の `addMediaRule` のみを副作用として呼び出す。
 *
 * 戻り値は `void`。method chain の `this` 返却は呼び出し元 `html-tag.ts`
 * 側の責務とする。
 *
 * Requirements: 6.2
 * Design: design.md "Components and Interfaces" → `_internal/breakpoint-applier.ts`
 *         (Service Interface) / "Allowed Dependencies"
 *
 * @internal
 */
import { Breakpoints, type BreakpointStyles } from '../../../css/constants/breakpoints.js';
import type { HtmlTagHost } from './host-types.js';

/**
 * `BreakpointStyles` を `host` に適用する純関数（副作用付き mutator）。
 *
 * 既存 `.responsive()` と同一順序・同一引数で `host.css.addMediaRule(bp, props)`
 * を呼び出す。挙動詳細:
 *
 * - `styles === undefined` のキーはスキップ
 * - 名前付きキー（`'sm' | 'md' | 'lg' | 'xl'`）は `Breakpoints` 定数で数値に解決
 * - その他のキーは `Number(key)` で数値化（数値キー / 文字列数値の両方を許容）
 * - `!Number.isFinite(bp) || bp <= 0` の breakpoint はスキップ
 * - `Partial<CSSStyleDeclaration>` の各プロパティのうち `typeof value === 'string'`
 *   のものだけを props として採用（undefined / number 等は除外）
 * - 採用 props が 1 件以上ある場合にのみ `host.css.addMediaRule(bp, props)` を呼ぶ
 *
 * 戻り値は `void`。method chain の `this` 返却は呼び出し元の責務。
 *
 * @param host - 設定対象の `HtmlTag` インスタンス
 * @param options - 適用するレスポンシブスタイル定義
 *
 * @internal
 */
export function applyResponsive(host: HtmlTagHost, options: BreakpointStyles): void {
  for (const [key, styles] of Object.entries(options)) {
    if (styles === undefined) continue;
    const bp = key in Breakpoints
      ? Breakpoints[key as keyof typeof Breakpoints]
      : Number(key);
    if (!Number.isFinite(bp) || bp <= 0) continue;
    const props: Record<string, string> = {};
    for (const [prop, value] of Object.entries(styles as Partial<CSSStyleDeclaration>)) {
      if (typeof value === 'string') {
        props[prop] = value;
      }
    }
    if (Object.keys(props).length > 0) {
      host.css.addMediaRule(bp, props);
    }
  }
}
