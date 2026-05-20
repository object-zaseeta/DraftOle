/**
 * CSSVisual -- 視覚効果プロパティ
 *
 * CSSPropertyGroup を継承し、setProp/getProp 経由でプロパティを管理する。
 * 6のVisual関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 7.3, 7.7
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

/**
 * 視覚効果プロパティを管理するクラス
 *
 * プロパティ: box-shadow, opacity, cursor, overflow, overflow-x, overflow-y
 */
export class CSSVisual extends CSSPropertyGroup {
  // ── Fluent Setters ──

  /** box-shadow を設定する */
  setBoxShadow(value: string): this {
    return this.setProp(CSSPropertyKey.boxShadow, value);
  }

  /** opacity を設定する */
  setOpacity(value: string): this {
    return this.setProp(CSSPropertyKey.opacity, value);
  }

  /** cursor を設定する */
  setCursor(value: string): this {
    return this.setProp(CSSPropertyKey.cursor, value);
  }

  /** overflow を設定する */
  setOverflow(value: string): this {
    return this.setProp(CSSPropertyKey.overflow, value);
  }

  /** overflow-x を設定する */
  setOverflowX(value: string): this {
    return this.setProp(CSSPropertyKey.overflowX, value);
  }

  /** overflow-y を設定する */
  setOverflowY(value: string): this {
    return this.setProp(CSSPropertyKey.overflowY, value);
  }
}
