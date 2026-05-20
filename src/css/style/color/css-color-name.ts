/**
 * CSS標準色名定数
 *
 * 主要なCSS色名とCSS特殊キーワードを型安全に定義する。
 * {@link CSSColor.named}() メソッドで使用される。
 *
 * ## カテゴリ
 *
 * - **基本色**: black, white, red, green, blue, yellow, cyan, magenta, orange, pink, purple, brown
 * - **グレー系**: gray, grey, darkGray, lightGray, dimGray, silver
 * - **拡張色**: navy, teal, maroon, olive, lime, aqua, fuchsia, coral, salmon, gold, indigo, violet, crimson, turquoise
 * - **CSS特殊キーワード**: transparent, currentColor
 *
 * @example
 * ```ts
 * // 基本的な使用
 * CSSColorName.red // → "red"
 * CSSColorName.transparent // → "transparent"
 *
 * // CSSColorと組み合わせて使用
 * const color = CSSColor.named(CSSColorName.blue);
 * console.log(color.toString()); // → "blue"
 *
 * // プロパティクラスでの使用
 * const font = new CSSFont();
 * font.setColorValue(CSSColor.named(CSSColorName.red));
 * ```
 *
 * @see {@link CSSColor}
 * @see {@link CSSColorNameValue}
 */
export const CSSColorName = {
  // 基本色
  black: 'black',
  white: 'white',
  red: 'red',
  green: 'green',
  blue: 'blue',
  yellow: 'yellow',
  cyan: 'cyan',
  magenta: 'magenta',
  orange: 'orange',
  pink: 'pink',
  purple: 'purple',
  brown: 'brown',

  // グレー系
  gray: 'gray',
  grey: 'grey',
  darkGray: 'darkgray',
  darkGrey: 'darkgrey',
  lightGray: 'lightgray',
  lightGrey: 'lightgrey',
  dimGray: 'dimgray',
  dimGrey: 'dimgrey',
  silver: 'silver',

  // 拡張色
  navy: 'navy',
  teal: 'teal',
  maroon: 'maroon',
  olive: 'olive',
  lime: 'lime',
  aqua: 'aqua',
  fuchsia: 'fuchsia',
  coral: 'coral',
  salmon: 'salmon',
  gold: 'gold',
  indigo: 'indigo',
  violet: 'violet',
  crimson: 'crimson',
  turquoise: 'turquoise',

  // CSS特殊キーワード
  transparent: 'transparent',
  currentColor: 'currentColor',
  inherit: 'inherit',
} as const;

/**
 * CSSColorName の値の型（ユニオン型）
 */
export type CSSColorNameValue =
  (typeof CSSColorName)[keyof typeof CSSColorName];

/**
 * CSSColorName の全値をセットとして保持（isColorName 判定用）
 */
export const CSS_COLOR_NAME_VALUES: ReadonlySet<string> = new Set(
  Object.values(CSSColorName),
);
