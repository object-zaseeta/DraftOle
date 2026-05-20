/**
 * CSSFont -- フォント・文字色プロパティクラス
 *
 * font-family, font-size, font-weight, font-style,
 * color, line-height, letter-spacing を管理する。
 *
 * CSSPropertyGroup を継承し、setProp/getProp 経由でプロパティを管理する。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 *
 * Requirements: 5.1, 5.2, 5.7
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';
import type { CSSColor } from '../color/css-color.js';

/** Options for setFont() shorthand. */
export interface FontOptions {
  size?: string;
  weight?: string;
  family?: string;
  lineHeight?: string;
  color?: string;
}

export class CSSFont extends CSSPropertyGroup {
  // ── Fluent setters ──

  /** 主要フォント・文字色プロパティを一括設定するショートハンド */
  setFont(options?: FontOptions): this {
    if (options?.size !== undefined) this.setProp(CSSPropertyKey.fontSize, options.size);
    if (options?.weight !== undefined) this.setProp(CSSPropertyKey.fontWeight, options.weight);
    if (options?.family !== undefined) this.setProp(CSSPropertyKey.fontFamily, options.family);
    if (options?.lineHeight !== undefined) this.setProp(CSSPropertyKey.lineHeight, options.lineHeight);
    if (options?.color !== undefined) this.setProp(CSSPropertyKey.color, options.color);
    return this;
  }

  setFontFamily(value: string): this {
    return this.setProp(CSSPropertyKey.fontFamily, value);
  }

  setFontSize(value: string): this {
    return this.setProp(CSSPropertyKey.fontSize, value);
  }

  setFontWeight(value: string): this {
    return this.setProp(CSSPropertyKey.fontWeight, value);
  }

  setFontStyle(value: string): this {
    return this.setProp(CSSPropertyKey.fontStyle, value);
  }

  setColor(value: string): this {
    return this.setProp(CSSPropertyKey.color, value);
  }

  setLineHeight(value: string): this {
    return this.setProp(CSSPropertyKey.lineHeight, value);
  }

  setLetterSpacing(value: string): this {
    return this.setProp(CSSPropertyKey.letterSpacing, value);
  }

  // ── Getter（CssStyleManager からのアクセス用） ──

  getFontSize(): string | undefined {
    return this.getProp(CSSPropertyKey.fontSize);
  }

  // ── CSSColor連携メソッド ──

  setColorValue(color: CSSColor): this {
    return this.setProp(CSSPropertyKey.color, color.toString());
  }
}
