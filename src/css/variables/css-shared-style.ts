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

/**
 * Converts a camelCase property name to kebab-case.
 * @internal
 */
function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

/**
 * Renders a CSS properties object into indented CSS body lines.
 * @internal
 */
function renderCssBody(properties: Record<string, string>): string {
  return Object.entries(properties)
    .map(([k, v]) => `  ${toKebabCase(k)}: ${v};`)
    .join('\n');
}

/** Pseudo-selector definitions. */
export type PseudoSelectors = {
  hover?: Record<string, string>;
  focus?: Record<string, string>;
  active?: Record<string, string>;
  visited?: Record<string, string>;
  disabled?: Record<string, string>;
  'first-child'?: Record<string, string>;
  'last-child'?: Record<string, string>;
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
 * Creates a shared CSS style with a named class.
 *
 * @param name - The CSS class name
 * @param properties - CSS properties as key-value pairs (camelCase or kebab-case)
 * @param pseudo - Optional pseudo-selector styles (:hover, :focus, :active, etc.)
 * @returns A SharedStyle object with className, css, and toString()
 */
export function createStyle(
  name: string,
  properties: Record<string, string>,
  pseudo?: PseudoSelectors,
): SharedStyle {
  const parts: string[] = [];

  // Base rule
  const entries = Object.entries(properties);
  if (entries.length > 0) {
    parts.push(`.${name} {\n${renderCssBody(properties)}\n}`);
  }

  // Pseudo-selector rules
  if (pseudo) {
    for (const [selector, props] of Object.entries(pseudo)) {
      if (props && Object.keys(props).length > 0) {
        parts.push(`.${name}:${selector} {\n${renderCssBody(props)}\n}`);
      }
    }
  }

  return {
    className: name,
    css: parts.join('\n'),
    toString() { return name; },
  };
}
