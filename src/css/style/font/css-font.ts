/**
 * CSSFont -- フォント・文字色プロパティクラス
 *
 * font-family, font-size, font-weight, font-style,
 * color, line-height, letter-spacing を管理する。
 *
 * collectProperties() -> render() 統一パターンに準拠。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 *
 * Requirements: 5.1, 5.2, 5.7
 */
import type { Renderable } from '../../../utils/renderable.js';
import type { CSSColor } from '../color/css-color.js';
import { CSSPropertyKey } from '../style-keys.js';

export class CSSFont implements Renderable {
  private _fontFamily?: string;
  private _fontSize?: string;
  private _fontWeight?: string;
  private _fontStyle?: string;
  private _color?: string;
  private _lineHeight?: string;
  private _letterSpacing?: string;

  // ── Fluent setters ──

  setFontFamily(value: string): this {
    this._fontFamily = value;
    return this;
  }

  setFontSize(value: string): this {
    this._fontSize = value;
    return this;
  }

  setFontWeight(value: string): this {
    this._fontWeight = value;
    return this;
  }

  setFontStyle(value: string): this {
    this._fontStyle = value;
    return this;
  }

  setColor(value: string): this {
    this._color = value;
    return this;
  }

  setLineHeight(value: string): this {
    this._lineHeight = value;
    return this;
  }

  setLetterSpacing(value: string): this {
    this._letterSpacing = value;
    return this;
  }

  // ── Getter（CssStyleManager からのアクセス用） ──

  getFontSize(): string | undefined {
    return this._fontSize;
  }

  // ── CSSColor連携メソッド ──

  setColorValue(color: CSSColor): this {
    this._color = color.toString();
    return this;
  }

  // ── プロパティ収集 ──

  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._fontFamily !== undefined) {
      properties.set(CSSPropertyKey.fontFamily, this._fontFamily);
    }
    if (this._fontSize !== undefined) {
      properties.set(CSSPropertyKey.fontSize, this._fontSize);
    }
    if (this._fontWeight !== undefined) {
      properties.set(CSSPropertyKey.fontWeight, this._fontWeight);
    }
    if (this._fontStyle !== undefined) {
      properties.set(CSSPropertyKey.fontStyle, this._fontStyle);
    }
    if (this._color !== undefined) {
      properties.set(CSSPropertyKey.color, this._color);
    }
    if (this._lineHeight !== undefined) {
      properties.set(CSSPropertyKey.lineHeight, this._lineHeight);
    }
    if (this._letterSpacing !== undefined) {
      properties.set(CSSPropertyKey.letterSpacing, this._letterSpacing);
    }

    return properties;
  }

  // ── CSS文字列レンダリング ──

  render(): string {
    const properties = this.collectProperties();
    if (properties.size === 0) return '';
    return [...properties.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}: ${value}`)
      .join(';\n') + ';';
  }
}
