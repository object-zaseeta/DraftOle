/**
 * CSSList -- リストスタイルプロパティ
 *
 * CSSPropertyGroup を継承し、setProp/getProp 経由でプロパティを管理する。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 *
 * Requirements: 7.5, 7.7
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

/**
 * リストスタイルプロパティを管理するクラス
 *
 * プロパティ: list-style-type, list-style-position,
 *   list-style-image, list-style (shorthand)
 */
export class CSSList extends CSSPropertyGroup {
  // ── Fluent Setters ──

  /** list-style-type を設定する */
  setListStyleType(value: string): this {
    return this.setProp(CSSPropertyKey.listStyleType, value);
  }

  /** list-style-position を設定する */
  setListStylePosition(value: string): this {
    return this.setProp(CSSPropertyKey.listStylePosition, value);
  }

  /** list-style-image を設定する */
  setListStyleImage(value: string): this {
    return this.setProp(CSSPropertyKey.listStyleImage, value);
  }

  /** list-style (shorthand) を設定する */
  setListStyle(value: string): this {
    return this.setProp(CSSPropertyKey.listStyle, value);
  }
}
