/**
 * Task 4.3: CSSText -- テキスト装飾プロパティ
 *
 * collectProperties() → render() 統一パターンに準拠。
 * 13のText関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 6.4, 6.5
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';
import { renderCssProperties } from '../../utils/css-sanitizer.js';

/**
 * テキスト装飾プロパティを管理するクラス
 *
 * 基本プロパティ: text-align, text-decoration, text-transform, text-indent,
 *   word-spacing, white-space, text-overflow
 * 拡張プロパティ: text-decoration-color, text-decoration-style,
 *   text-decoration-line, word-break, overflow-wrap, text-shadow
 */
export class CSSText implements Renderable {
  // ── 基本プロパティ ──
  private _textAlign?: string;
  private _textDecoration?: string;
  private _textTransform?: string;
  private _textIndent?: string;
  private _wordSpacing?: string;
  private _whiteSpace?: string;
  private _textOverflow?: string;

  // ── 拡張プロパティ ──
  private _textDecorationColor?: string;
  private _textDecorationStyle?: string;
  private _textDecorationLine?: string;
  private _wordBreak?: string;
  private _overflowWrap?: string;
  private _textShadow?: string;

  // ── Fluent Setters ──

  /** text-align を設定する */
  setTextAlign(value: string): this {
    this._textAlign = value;
    return this;
  }

  /** text-decoration を設定する */
  setTextDecoration(value: string): this {
    this._textDecoration = value;
    return this;
  }

  /** text-transform を設定する */
  setTextTransform(value: string): this {
    this._textTransform = value;
    return this;
  }

  /** text-indent を設定する */
  setTextIndent(value: string): this {
    this._textIndent = value;
    return this;
  }

  /** word-spacing を設定する */
  setWordSpacing(value: string): this {
    this._wordSpacing = value;
    return this;
  }

  /** white-space を設定する */
  setWhiteSpace(value: string): this {
    this._whiteSpace = value;
    return this;
  }

  /** text-overflow を設定する */
  setTextOverflow(value: string): this {
    this._textOverflow = value;
    return this;
  }

  /** text-decoration-color を設定する */
  setTextDecorationColor(value: string): this {
    this._textDecorationColor = value;
    return this;
  }

  /** text-decoration-style を設定する */
  setTextDecorationStyle(value: string): this {
    this._textDecorationStyle = value;
    return this;
  }

  /** text-decoration-line を設定する */
  setTextDecorationLine(value: string): this {
    this._textDecorationLine = value;
    return this;
  }

  /** word-break を設定する */
  setWordBreak(value: string): this {
    this._wordBreak = value;
    return this;
  }

  /** overflow-wrap を設定する */
  setOverflowWrap(value: string): this {
    this._overflowWrap = value;
    return this;
  }

  /** text-shadow を設定する */
  setTextShadow(value: string): this {
    this._textShadow = value;
    return this;
  }

  // ── collectProperties() → render() 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する
   * キーはハイフネーションされたCSS標準プロパティ名
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._textAlign !== undefined) {
      properties.set(CSSPropertyKey.textAlign, this._textAlign);
    }
    if (this._textDecoration !== undefined) {
      properties.set(CSSPropertyKey.textDecoration, this._textDecoration);
    }
    if (this._textTransform !== undefined) {
      properties.set(CSSPropertyKey.textTransform, this._textTransform);
    }
    if (this._textIndent !== undefined) {
      properties.set(CSSPropertyKey.textIndent, this._textIndent);
    }
    if (this._wordSpacing !== undefined) {
      properties.set(CSSPropertyKey.wordSpacing, this._wordSpacing);
    }
    if (this._whiteSpace !== undefined) {
      properties.set(CSSPropertyKey.whiteSpace, this._whiteSpace);
    }
    if (this._textOverflow !== undefined) {
      properties.set(CSSPropertyKey.textOverflow, this._textOverflow);
    }
    if (this._textDecorationColor !== undefined) {
      properties.set(CSSPropertyKey.textDecorationColor, this._textDecorationColor);
    }
    if (this._textDecorationStyle !== undefined) {
      properties.set(CSSPropertyKey.textDecorationStyle, this._textDecorationStyle);
    }
    if (this._textDecorationLine !== undefined) {
      properties.set(CSSPropertyKey.textDecorationLine, this._textDecorationLine);
    }
    if (this._wordBreak !== undefined) {
      properties.set(CSSPropertyKey.wordBreak, this._wordBreak);
    }
    if (this._overflowWrap !== undefined) {
      properties.set(CSSPropertyKey.overflowWrap, this._overflowWrap);
    }
    if (this._textShadow !== undefined) {
      properties.set(CSSPropertyKey.textShadow, this._textShadow);
    }

    return properties;
  }

  /**
   * 設定済みプロパティをCSS文字列としてレンダリングする
   *
   * - 未設定の場合は空文字列を返す
   * - プロパティはキー名のアルファベット順にソートされる
   * - フォーマット: `key: value;\nkey: value;`
   */
  render(): string {
    return renderCssProperties(this.collectProperties());
  }
}
