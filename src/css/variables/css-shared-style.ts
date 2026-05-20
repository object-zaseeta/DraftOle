/**
 * CSS共有スタイル定義
 *
 * createStyle() でクラスベースのCSSルールを定義し、
 * 複数要素に同じスタイルを適用する。
 * 疑似セレクタ（:hover, :focus, :active）もサポート。
 * SwiftUI の ViewModifier に相当。
 *
 * @example
 * ```typescript
 * import { Root } from '../html/elements/root.js';
 * const btn = createStyle('btn', {
 *   padding: '10px 12px',
 *   cursor: 'pointer',
 * }, {
 *   hover: { background: 'rgba(255,255,255,0.10)' },
 * });
 *
 * const root = new Root({ css: [btn.css] });
 * // → .btn { padding: 10px 12px; cursor: pointer; }
 * // → .btn:hover { background: rgba(255,255,255,0.10); }
 * ```
 */

import { sanitizeCssValue } from '../utils/css-sanitizer.js';
import {
  createStyleTemplate,
  type StyleTemplate,
} from './style-template.js';

/**
 * Converts a camelCase property name to kebab-case.
 * @internal
 */
function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

/**
 * Renders a CSS properties object into indented CSS body lines.
 * Dangerous values (url(javascript:), expression()) are excluded.
 * @internal
 */
function renderCssBody(properties: Record<string, string>): string {
  return Object.entries(properties)
    .filter(([, v]) => sanitizeCssValue(v) !== '')
    .map(([k, v]) => `  ${toKebabCase(k)}: ${sanitizeCssValue(v)};`)
    .join('\n');
}

/**
 * Known pseudo-selector names (for IDE autocomplete).
 * @internal
 */
const PSEUDO_SELECTORS = new Set([
  'hover', 'focus', 'active', 'visited', 'disabled',
  'first-child', 'last-child', 'focus-within', 'focus-visible',
]);

/**
 * Style selector definitions.
 *
 * Key formats:
 * - `hover`, `focus`, etc. → pseudo selector (`.name:hover`)
 * - `&.modifier` → compound selector (`.name.modifier`)
 * - ` .child` → descendant selector (`.name .child`)
 * - `&.state .child` → compound + descendant (`.name.state .child`)
 */
export type StyleSelectors = {
  [key: string]: Record<string, string>;
};

/**
 * Represents a shared CSS style that can be applied to multiple elements.
 */
export interface SharedStyle {
  /** The CSS class name. */
  readonly className: string;
  /** The complete CSS rule block(s) including pseudo-selectors. */
  readonly css: string;
  /**
   * Internal `StyleTemplate` representation.
   *
   * Maintained for the new colocated-style pipeline (Req 2.1, 2.2, 2.4, 2.5).
   * 既存の `className` / `css` / `toString()` 経路は従来どおり機能するため、
   * 旧 API 利用者は `_template` を意識する必要はない。
   *
   * @internal
   */
  readonly _template: StyleTemplate;
  /** Returns the class name (for template literal usage). */
  toString(): string;
}

/**
 * Resolves a selector key to a full CSS selector.
 * @internal
 */
function resolveSelector(name: string, key: string): string {
  // Pseudo selector: hover → .name:hover
  if (PSEUDO_SELECTORS.has(key)) {
    return `.${name}:${key}`;
  }
  // Compound selector: &.primary → .name.primary
  if (key.startsWith('&')) {
    return `.${name}${key.slice(1)}`;
  }
  // Descendant selector: " .text" → .name .text
  if (key.startsWith(' ')) {
    return `.${name}${key}`;
  }
  // Fallback: treat as pseudo
  return `.${name}:${key}`;
}

/**
 * Creates a shared CSS style with a named class.
 *
 * @param name - The CSS class name
 * @param properties - CSS properties as key-value pairs (camelCase or kebab-case)
 * @param selectors - Optional selectors: pseudo (:hover), compound (&.primary), descendant ( .text)
 * @returns A SharedStyle object with className, css, and toString()
 *
 * @example
 * ```typescript
 * const btn = createStyle('btn', { padding: '10px' }, {
 *   hover: { background: '...' },           // → .btn:hover
 *   '&.primary': { borderColor: '...' },    // → .btn.primary
 *   ' .icon': { width: '16px' },            // → .btn .icon
 *   '&.done .text': { textDecoration: '...' }, // → .btn.done .text
 * });
 * ```
 */
/**
 * 既存の名前あり `createStyle(name, properties, selectors?)` 実装。
 *
 * 戻り値の `className` / `css` / `toString()` はリファクタ前と同等。
 * 加えて、内部表現として `_template: StyleTemplate` を保持する（Req 2.1, 2.2）。
 *
 * @internal
 */
export function createStyleNamed(
  name: string,
  properties: Record<string, string>,
  selectors?: StyleSelectors,
): SharedStyle {
  const parts: string[] = [];

  // Base rule
  const entries = Object.entries(properties);
  if (entries.length > 0) {
    parts.push(`.${name} {\n${renderCssBody(properties)}\n}`);
  }

  // Additional selector rules
  if (selectors) {
    for (const [key, props] of Object.entries(selectors)) {
      if (props && Object.keys(props).length > 0) {
        const selector = resolveSelector(name, key);
        parts.push(`${selector} {\n${renderCssBody(props)}\n}`);
      }
    }
  }

  const template = createStyleTemplate({
    name,
    properties,
    ...(selectors !== undefined ? { selectors } : {}),
  });

  return {
    className: name,
    css: parts.join('\n'),
    _template: template,
    toString() { return name; },
  };
}

/**
 * 名前あり形：`createStyle("name", {...}, selectors?)` → `SharedStyle`
 *
 * 既存仕様どおり、明示クラス名をベースとした `SharedStyle` を返す。
 * 戻り値は内部に `_template: StyleTemplate` を保持し、後続の colocated-style
 * パイプライン（Req 1, 3）から再利用される。
 */
/**
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は `css.class` を使うこと。
 * 本関数は `css.class` 実装の薄いエイリアス基盤として内部実装で継続使用される。
 * 詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export function createStyle(
  name: string,
  properties: Record<string, string>,
  selectors?: StyleSelectors,
): SharedStyle;
/**
 * 無名形：`createStyle({...}, selectors?)` → `StyleTemplate`
 *
 * 明示クラス名を持たない StyleTemplate を返す（Req 2.1, 2.4）。
 * クラス名は後続のレンダー段階で構造パスから決定的に導出される。
 */
export function createStyle(
  properties: Record<string, string>,
  selectors?: StyleSelectors,
): StyleTemplate;
export function createStyle(
  arg1: string | Record<string, string>,
  arg2?: Record<string, string> | StyleSelectors,
  arg3?: StyleSelectors,
): SharedStyle | StyleTemplate {
  if (typeof arg1 === 'string') {
    // 名前あり形
    const properties = (arg2 ?? {}) as Record<string, string>;
    return createStyleNamed(arg1, properties, arg3);
  }
  // 無名形：第1引数が properties、第2引数が selectors
  const properties = arg1;
  const selectors = arg2 as StyleSelectors | undefined;
  return createStyleTemplate({
    properties,
    ...(selectors !== undefined ? { selectors } : {}),
  });
}
