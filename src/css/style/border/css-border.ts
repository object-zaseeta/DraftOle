/**
 * CSSBorder -- 枠線プロパティクラス
 *
 * border-width, border-style, border-color（各方向個別対応）、
 * border-radius（各角個別対応）を管理する。
 *
 * CSSPropertyGroup を継承し、共通の setProp/render パターンを利用する。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 * CSSColor連携による型安全な色指定をサポート。
 *
 * Requirements: 5.6, 5.7
 */
import type { CSSColor } from '../color/css-color.js';
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

/** Options for setBorder() shorthand. */
export interface BorderOptions {
  width?: string;
  style?: string;
  color?: string;
  radius?: string;
}

export class CSSBorder extends CSSPropertyGroup {
  // ── 一括 Fluent setters ──

  /** 主要 border プロパティ（width/style/color/radius）を一括設定するショートハンド */
  setBorder(options?: BorderOptions): this {
    if (options?.width !== undefined) this.setProp(CSSPropertyKey.borderWidth, options.width);
    if (options?.style !== undefined) this.setProp(CSSPropertyKey.borderStyle, options.style);
    if (options?.color !== undefined) this.setProp(CSSPropertyKey.borderColor, options.color);
    if (options?.radius !== undefined) this.setProp(CSSPropertyKey.borderRadius, options.radius);
    return this;
  }

  /** border-width を一括設定する */
  setBorderWidth(value: string): this {
    return this.setProp(CSSPropertyKey.borderWidth, value);
  }

  /** border-style を一括設定する */
  setBorderStyle(value: string): this {
    return this.setProp(CSSPropertyKey.borderStyle, value);
  }

  /** border-color を文字列で一括設定する */
  setBorderColor(value: string): this {
    return this.setProp(CSSPropertyKey.borderColor, value);
  }

  /** border-radius を一括設定する */
  setBorderRadius(value: string): this {
    return this.setProp(CSSPropertyKey.borderRadius, value);
  }

  // ── 各方向 width Fluent setters ──

  /** border-top-width を設定する */
  setBorderTopWidth(value: string): this {
    return this.setProp(CSSPropertyKey.borderTopWidth, value);
  }

  /** border-right-width を設定する */
  setBorderRightWidth(value: string): this {
    return this.setProp(CSSPropertyKey.borderRightWidth, value);
  }

  /** border-bottom-width を設定する */
  setBorderBottomWidth(value: string): this {
    return this.setProp(CSSPropertyKey.borderBottomWidth, value);
  }

  /** border-left-width を設定する */
  setBorderLeftWidth(value: string): this {
    return this.setProp(CSSPropertyKey.borderLeftWidth, value);
  }

  // ── 各方向 style Fluent setters ──

  /** border-top-style を設定する */
  setBorderTopStyle(value: string): this {
    return this.setProp(CSSPropertyKey.borderTopStyle, value);
  }

  /** border-right-style を設定する */
  setBorderRightStyle(value: string): this {
    return this.setProp(CSSPropertyKey.borderRightStyle, value);
  }

  /** border-bottom-style を設定する */
  setBorderBottomStyle(value: string): this {
    return this.setProp(CSSPropertyKey.borderBottomStyle, value);
  }

  /** border-left-style を設定する */
  setBorderLeftStyle(value: string): this {
    return this.setProp(CSSPropertyKey.borderLeftStyle, value);
  }

  // ── 各方向 color Fluent setters（文字列） ──

  /** border-top-color を文字列で設定する */
  setBorderTopColor(value: string): this {
    return this.setProp(CSSPropertyKey.borderTopColor, value);
  }

  /** border-right-color を文字列で設定する */
  setBorderRightColor(value: string): this {
    return this.setProp(CSSPropertyKey.borderRightColor, value);
  }

  /** border-bottom-color を文字列で設定する */
  setBorderBottomColor(value: string): this {
    return this.setProp(CSSPropertyKey.borderBottomColor, value);
  }

  /** border-left-color を文字列で設定する */
  setBorderLeftColor(value: string): this {
    return this.setProp(CSSPropertyKey.borderLeftColor, value);
  }

  // ── 各角 radius Fluent setters ──

  /** border-top-left-radius を設定する */
  setBorderTopLeftRadius(value: string): this {
    return this.setProp(CSSPropertyKey.borderTopLeftRadius, value);
  }

  /** border-top-right-radius を設定する */
  setBorderTopRightRadius(value: string): this {
    return this.setProp(CSSPropertyKey.borderTopRightRadius, value);
  }

  /** border-bottom-right-radius を設定する */
  setBorderBottomRightRadius(value: string): this {
    return this.setProp(CSSPropertyKey.borderBottomRightRadius, value);
  }

  /** border-bottom-left-radius を設定する */
  setBorderBottomLeftRadius(value: string): this {
    return this.setProp(CSSPropertyKey.borderBottomLeftRadius, value);
  }

  // ── CSSColor 連携 Fluent setters ──

  /** border-color を CSSColor で一括設定する */
  setBorderColorValue(color: CSSColor): this {
    return this.setProp(CSSPropertyKey.borderColor, color.toString());
  }

  /** border-top-color を CSSColor で設定する */
  setBorderTopColorValue(color: CSSColor): this {
    return this.setProp(CSSPropertyKey.borderTopColor, color.toString());
  }

  /** border-right-color を CSSColor で設定する */
  setBorderRightColorValue(color: CSSColor): this {
    return this.setProp(CSSPropertyKey.borderRightColor, color.toString());
  }

  /** border-bottom-color を CSSColor で設定する */
  setBorderBottomColorValue(color: CSSColor): this {
    return this.setProp(CSSPropertyKey.borderBottomColor, color.toString());
  }

  /** border-left-color を CSSColor で設定する */
  setBorderLeftColorValue(color: CSSColor): this {
    return this.setProp(CSSPropertyKey.borderLeftColor, color.toString());
  }
}
