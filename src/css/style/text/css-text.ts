/**
 * Task 4.3: CSSText -- テキスト装飾プロパティ
 *
 * CSSPropertyGroup を継承することで、collectProperties() と render() の
 * 重複実装を排除したリファクタリング済みクラス。
 * 13のText関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 6.4, 6.5
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

/**
 * テキスト装飾プロパティを管理するクラス
 *
 * 基本プロパティ: text-align, text-decoration, text-transform, text-indent,
 *   word-spacing, white-space, text-overflow
 * 拡張プロパティ: text-decoration-color, text-decoration-style,
 *   text-decoration-line, word-break, overflow-wrap, text-shadow
 */
export class CSSText extends CSSPropertyGroup {
  // ── Fluent Setters ──

  /** text-align を設定する */
  setTextAlign(value: string): this {
    return this.setProp(CSSPropertyKey.textAlign, value);
  }

  /** text-decoration を設定する */
  setTextDecoration(value: string): this {
    return this.setProp(CSSPropertyKey.textDecoration, value);
  }

  /** text-transform を設定する */
  setTextTransform(value: string): this {
    return this.setProp(CSSPropertyKey.textTransform, value);
  }

  /** text-indent を設定する */
  setTextIndent(value: string): this {
    return this.setProp(CSSPropertyKey.textIndent, value);
  }

  /** word-spacing を設定する */
  setWordSpacing(value: string): this {
    return this.setProp(CSSPropertyKey.wordSpacing, value);
  }

  /** white-space を設定する */
  setWhiteSpace(value: string): this {
    return this.setProp(CSSPropertyKey.whiteSpace, value);
  }

  /** text-overflow を設定する */
  setTextOverflow(value: string): this {
    return this.setProp(CSSPropertyKey.textOverflow, value);
  }

  /** text-decoration-color を設定する */
  setTextDecorationColor(value: string): this {
    return this.setProp(CSSPropertyKey.textDecorationColor, value);
  }

  /** text-decoration-style を設定する */
  setTextDecorationStyle(value: string): this {
    return this.setProp(CSSPropertyKey.textDecorationStyle, value);
  }

  /** text-decoration-line を設定する */
  setTextDecorationLine(value: string): this {
    return this.setProp(CSSPropertyKey.textDecorationLine, value);
  }

  /** word-break を設定する */
  setWordBreak(value: string): this {
    return this.setProp(CSSPropertyKey.wordBreak, value);
  }

  /** overflow-wrap を設定する */
  setOverflowWrap(value: string): this {
    return this.setProp(CSSPropertyKey.overflowWrap, value);
  }

  /** text-shadow を設定する */
  setTextShadow(value: string): this {
    return this.setProp(CSSPropertyKey.textShadow, value);
  }
}
