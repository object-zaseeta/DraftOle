/**
 * CSS変数テーマ定義（統合 createTheme の公開シグネチャ）
 *
 * 型安全な CSS Custom Properties（CSS変数）と再利用可能なクラスを
 * 1つのフラットオブジェクトで定義する。値の型から自動的に
 * 「トークン」「クラス」が判別される。
 *
 * 実装本体は `unified-theme.ts` の `buildUnifiedTheme` に委譲する。
 *
 * クラス名は HTML タグ名と同名でも CSS セレクタとしては衝突しない
 * （`.ul` は `ul` セレクタとは別物）。グローバルルール（`*`、HTMLタグセレクタ）
 * は `sel.*` 名前空間を利用すること。
 *
 * @example
 * ```typescript
 * // 既存形式（全 string 値）
 * const theme = createTheme({ bg: '#0b1220', accent: '#7c5cff' });
 * theme.bg     // → 'var(--bg)'
 * theme.css    // → ':root { --bg: #0b1220; --accent: #7c5cff; }'
 *
 * // 統合形式（混在入力）
 * const t = createTheme({
 *   bg: '#000',
 *   card: { background: 'bg', padding: '12px' },
 * });
 * t.bg         // → 'var(--bg)'
 * t.card       // → SharedStyle
 * t.css        // → ':root { ... }\n\n.card { background: var(--bg); padding: 12px; }'
 * ```
 */

import type { GlobalCss } from './global-css.js';
import {
  buildUnifiedTheme,
  type UnifiedTheme,
  type UnifiedThemeInput,
} from './unified-theme.js';

/**
 * Theme type: each key maps to its var(--key) reference,
 * plus a .css property for the :root block.
 *
 * 既存形式（全 string 入力）の戻り値型として維持。
 */
export type Theme<T extends Record<string, string>> = {
  readonly [K in keyof T]: string;
} & {
  /** The :root { ... } CSS block with all variable definitions. */
  readonly css: GlobalCss;
};

/**
 * 既存形式：全エントリの値が string の入力。`Theme<T>` を返す（後方互換）。
 *
 * 全 string の場合に優先解決させるため、より具体的なこのシグネチャを先に宣言する。
 *
 * @example
 * ```typescript
 * const theme = createTheme({ bg: '#000', text: '#fff' });
 * theme.bg     // → 'var(--bg)'
 * theme.css    // → ':root {\n  --bg: #000;\n  --text: #fff;\n}'
 * ```
 */
/**
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は `css.theme` を使うこと。
 * 本関数は `css.theme` 実装の薄いエイリアス基盤として内部実装で継続使用される。
 * 詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export function createTheme<T extends Record<string, string>>(vars: T): Theme<T>;
/**
 * 統合 createTheme：混在入力（string + Record<string, string>）。
 *
 * 値の型から「トークン」「クラス」を自動判別し、`UnifiedTheme<T>` を返す。
 * クラス内のプロパティ値が同一呼び出しで定義されたトークン名と完全一致し、
 * かつ CSS キーワード（`auto`、`red` 等）でない場合は `var(--name)` に解決される。
 */
export function createTheme<T extends UnifiedThemeInput>(input: T): UnifiedTheme<T>;
export function createTheme(input: UnifiedThemeInput): unknown {
  return buildUnifiedTheme(input);
}
