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
 * const btn = createStyle('btn', {
 *   padding: '10px 12px',
 *   cursor: 'pointer',
 * }, {
 *   hover: { background: 'rgba(255,255,255,0.10)' },
 * });
 *
 * root.addGlobalCss(btn.css);
 * // → .btn { padding: 10px 12px; cursor: pointer; }
 * // → .btn:hover { background: rgba(255,255,255,0.10); }
 * ```
 */

import { sanitizeCssValue } from '../utils/css-sanitizer.js';

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
    .map(([k, v]) => `  ${toKebabCase(k)}: ${v};`)
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
export function createStyle(
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

  return {
    className: name,
    css: parts.join('\n'),
    toString() { return name; },
  };
}
