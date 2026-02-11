/**
 * CSSBorder -- 枠線プロパティクラス
 *
 * border-width, border-style, border-color（各方向個別対応）、
 * border-radius（各角個別対応）を管理する。
 *
 * collectProperties() -> render() 統一パターンに準拠。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 * CSSColor連携による型安全な色指定をサポート。
 *
 * Requirements: 5.6, 5.7
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';
import type { CSSColor } from '../color/css-color.js';

export class CSSBorder implements Renderable {
  // ── 一括指定ストレージ ──
  private _borderWidth?: string;
  private _borderStyle?: string;
  private _borderColor?: string;
  private _borderRadius?: string;

  // ── 各方向 width ストレージ ──
  private _borderTopWidth?: string;
  private _borderRightWidth?: string;
  private _borderBottomWidth?: string;
  private _borderLeftWidth?: string;

  // ── 各方向 style ストレージ ──
  private _borderTopStyle?: string;
  private _borderRightStyle?: string;
  private _borderBottomStyle?: string;
  private _borderLeftStyle?: string;

  // ── 各方向 color ストレージ ──
  private _borderTopColor?: string;
  private _borderRightColor?: string;
  private _borderBottomColor?: string;
  private _borderLeftColor?: string;

  // ── 各角 radius ストレージ ──
  private _borderTopLeftRadius?: string;
  private _borderTopRightRadius?: string;
  private _borderBottomRightRadius?: string;
  private _borderBottomLeftRadius?: string;

  // ── 一括 Fluent setters ──

  /** border-width を一括設定する */
  setBorderWidth(value: string): this {
    this._borderWidth = value;
    return this;
  }

  /** border-style を一括設定する */
  setBorderStyle(value: string): this {
    this._borderStyle = value;
    return this;
  }

  /** border-color を文字列で一括設定する */
  setBorderColor(value: string): this {
    this._borderColor = value;
    return this;
  }

  /** border-radius を一括設定する */
  setBorderRadius(value: string): this {
    this._borderRadius = value;
    return this;
  }

  // ── 各方向 width Fluent setters ──

  /** border-top-width を設定する */
  setBorderTopWidth(value: string): this {
    this._borderTopWidth = value;
    return this;
  }

  /** border-right-width を設定する */
  setBorderRightWidth(value: string): this {
    this._borderRightWidth = value;
    return this;
  }

  /** border-bottom-width を設定する */
  setBorderBottomWidth(value: string): this {
    this._borderBottomWidth = value;
    return this;
  }

  /** border-left-width を設定する */
  setBorderLeftWidth(value: string): this {
    this._borderLeftWidth = value;
    return this;
  }

  // ── 各方向 style Fluent setters ──

  /** border-top-style を設定する */
  setBorderTopStyle(value: string): this {
    this._borderTopStyle = value;
    return this;
  }

  /** border-right-style を設定する */
  setBorderRightStyle(value: string): this {
    this._borderRightStyle = value;
    return this;
  }

  /** border-bottom-style を設定する */
  setBorderBottomStyle(value: string): this {
    this._borderBottomStyle = value;
    return this;
  }

  /** border-left-style を設定する */
  setBorderLeftStyle(value: string): this {
    this._borderLeftStyle = value;
    return this;
  }

  // ── 各方向 color Fluent setters（文字列） ──

  /** border-top-color を文字列で設定する */
  setBorderTopColor(value: string): this {
    this._borderTopColor = value;
    return this;
  }

  /** border-right-color を文字列で設定する */
  setBorderRightColor(value: string): this {
    this._borderRightColor = value;
    return this;
  }

  /** border-bottom-color を文字列で設定する */
  setBorderBottomColor(value: string): this {
    this._borderBottomColor = value;
    return this;
  }

  /** border-left-color を文字列で設定する */
  setBorderLeftColor(value: string): this {
    this._borderLeftColor = value;
    return this;
  }

  // ── 各角 radius Fluent setters ──

  /** border-top-left-radius を設定する */
  setBorderTopLeftRadius(value: string): this {
    this._borderTopLeftRadius = value;
    return this;
  }

  /** border-top-right-radius を設定する */
  setBorderTopRightRadius(value: string): this {
    this._borderTopRightRadius = value;
    return this;
  }

  /** border-bottom-right-radius を設定する */
  setBorderBottomRightRadius(value: string): this {
    this._borderBottomRightRadius = value;
    return this;
  }

  /** border-bottom-left-radius を設定する */
  setBorderBottomLeftRadius(value: string): this {
    this._borderBottomLeftRadius = value;
    return this;
  }

  // ── CSSColor 連携 Fluent setters ──

  /** border-color を CSSColor で一括設定する */
  setBorderColorValue(color: CSSColor): this {
    this._borderColor = color.toString();
    return this;
  }

  /** border-top-color を CSSColor で設定する */
  setBorderTopColorValue(color: CSSColor): this {
    this._borderTopColor = color.toString();
    return this;
  }

  /** border-right-color を CSSColor で設定する */
  setBorderRightColorValue(color: CSSColor): this {
    this._borderRightColor = color.toString();
    return this;
  }

  /** border-bottom-color を CSSColor で設定する */
  setBorderBottomColorValue(color: CSSColor): this {
    this._borderBottomColor = color.toString();
    return this;
  }

  /** border-left-color を CSSColor で設定する */
  setBorderLeftColorValue(color: CSSColor): this {
    this._borderLeftColor = color.toString();
    return this;
  }

  // ── collectProperties → render 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する。
   * キーは CSSPropertyKey の値（ハイフネーション済み CSS プロパティ名）。
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    // 一括指定
    if (this._borderWidth !== undefined) {
      properties.set(CSSPropertyKey.borderWidth, this._borderWidth);
    }
    if (this._borderStyle !== undefined) {
      properties.set(CSSPropertyKey.borderStyle, this._borderStyle);
    }
    if (this._borderColor !== undefined) {
      properties.set(CSSPropertyKey.borderColor, this._borderColor);
    }
    if (this._borderRadius !== undefined) {
      properties.set(CSSPropertyKey.borderRadius, this._borderRadius);
    }

    // 各方向 width
    if (this._borderTopWidth !== undefined) {
      properties.set(CSSPropertyKey.borderTopWidth, this._borderTopWidth);
    }
    if (this._borderRightWidth !== undefined) {
      properties.set(CSSPropertyKey.borderRightWidth, this._borderRightWidth);
    }
    if (this._borderBottomWidth !== undefined) {
      properties.set(CSSPropertyKey.borderBottomWidth, this._borderBottomWidth);
    }
    if (this._borderLeftWidth !== undefined) {
      properties.set(CSSPropertyKey.borderLeftWidth, this._borderLeftWidth);
    }

    // 各方向 style
    if (this._borderTopStyle !== undefined) {
      properties.set(CSSPropertyKey.borderTopStyle, this._borderTopStyle);
    }
    if (this._borderRightStyle !== undefined) {
      properties.set(CSSPropertyKey.borderRightStyle, this._borderRightStyle);
    }
    if (this._borderBottomStyle !== undefined) {
      properties.set(CSSPropertyKey.borderBottomStyle, this._borderBottomStyle);
    }
    if (this._borderLeftStyle !== undefined) {
      properties.set(CSSPropertyKey.borderLeftStyle, this._borderLeftStyle);
    }

    // 各方向 color
    if (this._borderTopColor !== undefined) {
      properties.set(CSSPropertyKey.borderTopColor, this._borderTopColor);
    }
    if (this._borderRightColor !== undefined) {
      properties.set(CSSPropertyKey.borderRightColor, this._borderRightColor);
    }
    if (this._borderBottomColor !== undefined) {
      properties.set(CSSPropertyKey.borderBottomColor, this._borderBottomColor);
    }
    if (this._borderLeftColor !== undefined) {
      properties.set(CSSPropertyKey.borderLeftColor, this._borderLeftColor);
    }

    // 各角 radius
    if (this._borderTopLeftRadius !== undefined) {
      properties.set(CSSPropertyKey.borderTopLeftRadius, this._borderTopLeftRadius);
    }
    if (this._borderTopRightRadius !== undefined) {
      properties.set(CSSPropertyKey.borderTopRightRadius, this._borderTopRightRadius);
    }
    if (this._borderBottomRightRadius !== undefined) {
      properties.set(CSSPropertyKey.borderBottomRightRadius, this._borderBottomRightRadius);
    }
    if (this._borderBottomLeftRadius !== undefined) {
      properties.set(CSSPropertyKey.borderBottomLeftRadius, this._borderBottomLeftRadius);
    }

    return properties;
  }

  /**
   * 設定済みプロパティを CSS 文字列としてレンダリングする。
   *
   * - 設定済みプロパティのみ出力（未設定は出力しない）
   * - プロパティ名のアルファベット順にソート
   * - セミコロン + 改行で区切り、末尾にセミコロン
   * - 全プロパティ未設定の場合は空文字列を返す
   */
  render(): string {
    const properties = this.collectProperties();
    if (properties.size === 0) return '';
    return [...properties.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}: ${value}`)
      .join(';\n') + ';';
  }
}
