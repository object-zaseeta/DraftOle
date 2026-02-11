/**
 * CSS色値オブジェクト
 *
 * HEX、RGB、RGBA、CSS色名、任意のCSS色文字列を統一的に扱える
 * イミュータブルな値オブジェクト。型安全なファクトリメソッドと
 * 検証メソッドを提供する。
 *
 * ## サポートする色形式
 *
 * - **HEX**: `#RGB`, `#RRGGBB`, `#RRGGBBAA`
 * - **RGB**: `rgb(r, g, b)`
 * - **RGBA**: `rgba(r, g, b, a)`
 * - **色名**: CSS標準色名（{@link CSSColorName}）
 * - **その他**: `hsl()`, `var()`, `currentColor` など
 *
 * @example
 * ```ts
 * // HEX形式
 * const hex = CSSColor.hex('#ff0000');
 * console.log(hex.toString()); // → "#ff0000"
 * console.log(hex.isHex()); // → true
 *
 * // RGB形式
 * const rgb = CSSColor.rgb(255, 0, 0);
 * console.log(rgb.toString()); // → "rgb(255, 0, 0)"
 * console.log(rgb.isRgb()); // → true
 *
 * // RGBA形式
 * const rgba = CSSColor.rgba(255, 0, 0, 0.5);
 * console.log(rgba.toString()); // → "rgba(255, 0, 0, 0.5)"
 *
 * // CSS色名
 * const named = CSSColor.named('red');
 * console.log(named.toString()); // → "red"
 * console.log(named.isColorName()); // → true
 *
 * // 任意のCSS色文字列
 * const custom = CSSColor.raw('hsl(0, 100%, 50%)');
 * console.log(custom.toString()); // → "hsl(0, 100%, 50%)"
 *
 * // CSSプロパティクラスでの使用
 * const font = new CSSFont();
 * font.setColorValue(CSSColor.hex('#333'));
 * ```
 *
 * @see {@link CSSColorName}
 * @see {@link CSSColorNameValue}
 */
import {
  type CSSColorNameValue,
  CSS_COLOR_NAME_VALUES,
} from './css-color-name.js';

/**
 * HEX色値パターン
 * @internal
 */
const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * rgb() 関数パターン
 * @internal
 */
const RGB_PATTERN = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;

/**
 * rgba() 関数パターン
 * @internal
 */
const RGBA_PATTERN =
  /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;

export class CSSColor {
  private readonly value: string;

  /**
   * @internal
   * コンストラクタはプライベート。ファクトリメソッドを使用すること。
   */
  private constructor(value: string) {
    this.value = value;
  }

  // ── ファクトリメソッド ──

  /**
   * HEX値から CSSColor を生成する
   *
   * @param value - HEX色値（'#RGB', '#RRGGBB', '#RRGGBBAA' 形式）
   * @returns CSSColor インスタンス
   *
   * @example
   * ```ts
   * CSSColor.hex('#f00');      // → "#f00" (短縮形)
   * CSSColor.hex('#ff0000');   // → "#ff0000"
   * CSSColor.hex('#ff0000ff'); // → "#ff0000ff" (アルファ付き)
   * ```
   */
  static hex(value: string): CSSColor {
    return new CSSColor(value);
  }

  /**
   * RGB値から CSSColor を生成する
   *
   * @param r - Red (0-255)
   * @param g - Green (0-255)
   * @param b - Blue (0-255)
   * @returns CSSColor インスタンス
   *
   * @example
   * ```ts
   * CSSColor.rgb(255, 0, 0); // → "rgb(255, 0, 0)"
   * ```
   */
  static rgb(r: number, g: number, b: number): CSSColor {
    return new CSSColor(`rgb(${r}, ${g}, ${b})`);
  }

  /**
   * RGBA値から CSSColor を生成する
   *
   * @param r - Red (0-255)
   * @param g - Green (0-255)
   * @param b - Blue (0-255)
   * @param a - Alpha (0-1)
   * @returns CSSColor インスタンス
   *
   * @example
   * ```ts
   * CSSColor.rgba(255, 0, 0, 0.5); // → "rgba(255, 0, 0, 0.5)"
   * ```
   */
  static rgba(r: number, g: number, b: number, a: number): CSSColor {
    return new CSSColor(`rgba(${r}, ${g}, ${b}, ${a})`);
  }

  /**
   * CSS標準色名から CSSColor を生成する
   *
   * @param name - CSS標準色名（{@link CSSColorNameValue}）
   * @returns CSSColor インスタンス
   *
   * @example
   * ```ts
   * CSSColor.named('red');
   * CSSColor.named('transparent');
   * CSSColor.named('currentColor');
   * ```
   */
  static named(name: CSSColorNameValue): CSSColor {
    return new CSSColor(name);
  }

  /**
   * 任意のCSS色文字列から CSSColor を生成する
   *
   * hsl(), var(), カスタムプロパティなど、任意のCSS色表現に対応。
   *
   * @param value - 任意のCSS色文字列
   * @returns CSSColor インスタンス
   *
   * @example
   * ```ts
   * CSSColor.raw('hsl(0, 100%, 50%)');
   * CSSColor.raw('var(--primary-color)');
   * CSSColor.raw('currentColor');
   * ```
   */
  static raw(value: string): CSSColor {
    return new CSSColor(value);
  }

  // ── 検証メソッド ──

  /**
   * 値が HEX 形式かどうかを判定する
   *
   * @returns HEX形式の場合 true
   */
  isHex(): boolean {
    return HEX_PATTERN.test(this.value);
  }

  /**
   * 値が rgb() 形式かどうかを判定する
   *
   * @returns rgb() 形式の場合 true
   */
  isRgb(): boolean {
    return RGB_PATTERN.test(this.value);
  }

  /**
   * 値が rgba() 形式かどうかを判定する
   *
   * @returns rgba() 形式の場合 true
   */
  isRgba(): boolean {
    return RGBA_PATTERN.test(this.value);
  }

  /**
   * 値が CSS 標準色名かどうかを判定する
   *
   * @returns CSS標準色名の場合 true
   */
  isColorName(): boolean {
    return CSS_COLOR_NAME_VALUES.has(this.value);
  }

  // ── CSS 文字列出力 ──

  /**
   * CSS色値の文字列表現を返す
   *
   * @returns CSS色値文字列
   */
  toString(): string {
    return this.value;
  }
}
