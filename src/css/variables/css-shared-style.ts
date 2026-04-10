/**
 * CSS共有スタイル定義
 *
 * createStyle() でクラスベースのCSSルールを定義し、
 * 複数要素に同じスタイルを適用する。
 * SwiftUI の ViewModifier に相当。
 *
 * @example
 * ```typescript
 * const card = createStyle('card', {
 *   padding: '16px',
 *   borderRadius: '14px',
 *   background: 'var(--panel)',
 * });
 *
 * root.addGlobalCss(card.css);
 * section({ class: card.className }, 'Content');
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
 * Represents a shared CSS style that can be applied to multiple elements.
 */
export interface SharedStyle {
  /** The CSS class name. */
  readonly className: string;
  /** The complete CSS rule block (`.className { ... }`). */
  readonly css: string;
  /** Returns the class name (for template literal usage). */
  toString(): string;
}

/**
 * Creates a shared CSS style with a named class.
 *
 * @param name - The CSS class name
 * @param properties - CSS properties as key-value pairs (camelCase or kebab-case)
 * @returns A SharedStyle object with className, css, and toString()
 *
 * @example
 * ```typescript
 * const btn = createStyle('btn', {
 *   padding: '10px 12px',
 *   borderRadius: '12px',
 *   cursor: 'pointer',
 * });
 *
 * btn.className  // → 'btn'
 * btn.css        // → '.btn {\n  padding: 10px 12px;\n  ...\n}'
 * `${btn}`       // → 'btn'
 * ```
 */
export function createStyle(name: string, properties: Record<string, string>): SharedStyle {
  const entries = Object.entries(properties);

  const cssBody = entries
    .map(([k, v]) => `  ${toKebabCase(k)}: ${v};`)
    .join('\n');

  const css = entries.length === 0 ? '' : `.${name} {\n${cssBody}\n}`;

  return {
    className: name,
    css,
    toString() { return name; },
  };
}
