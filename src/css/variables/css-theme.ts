/**
 * CSS変数テーマ定義
 *
 * 型安全なCSS Custom Properties（CSS変数）を定義する。
 * createTheme() でテーマオブジェクトを作成すると、
 * 各プロパティが var(--name) を返し、.css が :root ブロックを生成する。
 *
 * @example
 * ```typescript
 * const theme = createTheme({
 *   bg: '#0b1220',
 *   accent: '#7c5cff',
 *   radius: '14px',
 * });
 *
 * root.addGlobalCss(theme.css);
 * // → :root { --bg: #0b1220; --accent: #7c5cff; --radius: 14px; }
 *
 * div().background(theme.bg);
 * // → background-color: var(--bg);
 * ```
 */

/**
 * Theme type: each key maps to its var(--key) reference,
 * plus a .css property for the :root block.
 */
export type Theme<T extends Record<string, string>> = {
  readonly [K in keyof T]: string;
} & {
  /** The :root { ... } CSS block with all variable definitions. */
  readonly css: string;
};

/**
 * Creates a type-safe CSS theme with CSS Custom Properties.
 *
 * @param vars - Object mapping variable names to their values
 * @returns A theme object where each property returns `var(--name)` and `.css` returns the `:root` block
 *
 * @example
 * ```typescript
 * const theme = createTheme({ bg: '#000', text: '#fff' });
 * theme.bg     // → 'var(--bg)'
 * theme.text   // → 'var(--text)'
 * theme.css    // → ':root {\n  --bg: #000;\n  --text: #fff;\n}'
 * ```
 */
export function createTheme<T extends Record<string, string>>(vars: T): Theme<T> {
  const entries = Object.entries(vars);

  const cssBlock = entries.length === 0
    ? ''
    : ':root {\n' + entries.map(([k, v]) => `  --${k}: ${v};`).join('\n') + '\n}';

  const theme = {} as Record<string, string>;
  for (const key of Object.keys(vars)) {
    theme[key] = `var(--${key})`;
  }

  Object.defineProperty(theme, 'css', {
    value: cssBlock,
    enumerable: false,
    writable: false,
  });

  return theme as Theme<T>;
}
