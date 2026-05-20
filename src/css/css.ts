/**
 * `css` ネームスペース — CSS 関連 API の単一エントリポイント。
 *
 * 既存の `createTheme` / `createStyle` / `sel.media` / `sel.keyframes` への
 * 薄いエイリアスと、新規 `theme.variant` / `reset` / `raw` を集約する。
 *
 * @module css/css
 */

import { sanitizeCssValue } from './utils/css-sanitizer.js';
import {
  type GlobalCss,
  brand,
  renderProperties,
  wrapBlock,
} from './variables/global-css.js';
import { createTheme } from './variables/css-theme.js';
import type { Theme } from './variables/css-theme.js';
import {
  createStyle,
  type SharedStyle,
  type StyleSelectors,
} from './variables/css-shared-style.js';
import type { StyleTemplate } from './variables/style-template.js';
import type {
  UnifiedTheme,
  UnifiedThemeInput,
} from './variables/unified-theme.js';
import { media as selMedia, keyframes as selKeyframes } from './variables/global-dsl.js';

// ────────────────────────────────────────────────────────────────────────────
// css.raw — escape hatch
// ────────────────────────────────────────────────────────────────────────────

/**
 * 生 CSS 文字列を `GlobalCss` ブランド型にラップする escape hatch。
 *
 * 他 `css.*` で書けない場合の **最終手段**。サニタイズや検証は行わず、
 * 入力文字列の安全性はユーザの責任に委ねる。
 *
 * @param cssString - 任意の CSS 文字列（そのまま `GlobalCss` として返る）
 */
export function cssRaw(cssString: string): GlobalCss {
  return brand(cssString);
}

// ────────────────────────────────────────────────────────────────────────────
// css.reset — リセット CSS
// ────────────────────────────────────────────────────────────────────────────

const DEFAULT_RESET: GlobalCss = brand(
  '* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n}',
);

function isStyleTemplate(v: unknown): v is StyleTemplate {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as { _kind?: unknown })._kind === 'styleTemplate'
  );
}

function isSharedStyle(v: unknown): v is SharedStyle {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { className?: unknown }).className === 'string' &&
    typeof (v as { css?: unknown }).css === 'string'
  );
}

/**
 * リセット CSS を生成する。
 *
 * - 引数なし → デフォルト（`* { box-sizing: border-box; }` + `body { margin: 0; }`）
 * - `Record<string, string>` → `* { <props> }`
 * - `SharedStyle` / `StyleTemplate` → `properties` を抽出し `* { <props> }`
 *
 * 値は `sanitizeCssValue` でサニタイズされる。
 */
export function cssReset(): GlobalCss;
export function cssReset(properties: Record<string, string>): GlobalCss;
export function cssReset(style: SharedStyle | StyleTemplate): GlobalCss;
export function cssReset(
  arg?: Record<string, string> | SharedStyle | StyleTemplate,
): GlobalCss {
  if (arg === undefined) return DEFAULT_RESET;
  let properties: Record<string, string>;
  if (isSharedStyle(arg)) {
    properties = { ...arg._template.properties };
  } else if (isStyleTemplate(arg)) {
    properties = { ...arg.properties };
  } else {
    properties = arg;
  }
  return brand(wrapBlock('*', renderProperties(properties)));
}

// ────────────────────────────────────────────────────────────────────────────
// css.theme.variant — トークン属性スコープ上書き
// ────────────────────────────────────────────────────────────────────────────

/**
 * 入力 `T` から token キー（値が string であるキー）のみを抽出する補助型。
 */
export type TokenKeysOf<T> = {
  [K in keyof T as T[K] extends string ? K : never]: string;
};

function variant<T extends UnifiedThemeInput>(
  _theme: UnifiedTheme<T>,
  selector: string,
  overrides: Partial<TokenKeysOf<T>>,
): GlobalCss {
  const lines: string[] = [];
  for (const [key, rawValue] of Object.entries(overrides)) {
    if (typeof rawValue !== 'string') continue;
    const safe = sanitizeCssValue(rawValue);
    if (safe === '') continue;
    lines.push(`  --${key}: ${safe};`);
  }
  return brand(wrapBlock(selector, lines.join('\n')));
}

// ────────────────────────────────────────────────────────────────────────────
// css.theme — 既存 createTheme の薄いエイリアス + .variant
// ────────────────────────────────────────────────────────────────────────────

interface CssThemeFn {
  <T extends Record<string, string>>(vars: T): Theme<T>;
  <T extends UnifiedThemeInput>(input: T): UnifiedTheme<T>;
  variant: <T extends UnifiedThemeInput>(
    theme: UnifiedTheme<T>,
    selector: string,
    overrides: Partial<TokenKeysOf<T>>,
  ) => GlobalCss;
}

function cssThemeImpl(input: UnifiedThemeInput): unknown {
  return createTheme(input as UnifiedThemeInput);
}

const cssTheme = Object.assign(cssThemeImpl as CssThemeFn, { variant });

// ────────────────────────────────────────────────────────────────────────────
// css.class — 既存 createStyle の薄いエイリアス（オーバーロード）
// ────────────────────────────────────────────────────────────────────────────

interface CssClassFn {
  (
    name: string,
    properties: Record<string, string>,
    selectors?: StyleSelectors,
  ): SharedStyle;
  (
    properties: Record<string, string>,
    selectors?: StyleSelectors,
  ): StyleTemplate;
}

const cssClass = ((
  arg1: string | Record<string, string>,
  arg2?: Record<string, string> | StyleSelectors,
  arg3?: StyleSelectors,
) => {
  if (typeof arg1 === 'string') {
    return createStyle(arg1, (arg2 ?? {}) as Record<string, string>, arg3);
  }
  return createStyle(arg1, arg2 as StyleSelectors | undefined);
}) as CssClassFn;

// ────────────────────────────────────────────────────────────────────────────
// css namespace
// ────────────────────────────────────────────────────────────────────────────

/**
 * CSS 関連 API を集約した単一ネームスペース。
 *
 * - `css.theme(input)` — トークン + クラス定義（既存 `createTheme` のエイリアス）
 * - `css.theme.variant(theme, selector, overrides)` — トークン属性スコープ上書き
 * - `css.class(name?, properties, selectors?)` — 名前あり/無名クラス（既存 `createStyle`）
 * - `css.reset(input?)` — リセット CSS
 * - `css.media(query, rules)` — `@media` ブロック（既存 `sel.media`）
 * - `css.keyframes(name, frames)` — `@keyframes` ブロック（既存 `sel.keyframes`）
 * - `css.raw(cssString)` — 生 CSS の escape hatch
 */
export const css = {
  theme: cssTheme,
  class: cssClass,
  reset: cssReset,
  media: selMedia,
  keyframes: selKeyframes,
  raw: cssRaw,
} as const;
