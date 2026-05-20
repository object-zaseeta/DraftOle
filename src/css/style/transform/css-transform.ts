/**
 * Task 5.1: CSSTransform -- 変形・フィルタプロパティ
 *
 * CSSPropertyGroup を継承することで、collectProperties() と render() の
 * 重複実装を排除したリファクタリング済みクラス。
 * 6つのTransform関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 7.1, 7.2, 7.7
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

/**
 * 変形・フィルタプロパティを管理するクラス
 *
 * 変形プロパティ: transform, transform-origin
 * フィルタプロパティ: filter, backdrop-filter
 * パースペクティブプロパティ: perspective, perspective-origin
 */
export class CSSTransform extends CSSPropertyGroup {
  // ── Fluent Setters ──

  /** transform を設定する */
  setTransform(value: string): this {
    return this.setProp(CSSPropertyKey.transform, value);
  }

  /** transform-origin を設定する */
  setTransformOrigin(value: string): this {
    return this.setProp(CSSPropertyKey.transformOrigin, value);
  }

  /** filter を設定する */
  setFilter(value: string): this {
    return this.setProp(CSSPropertyKey.filter, value);
  }

  /** backdrop-filter を設定する */
  setBackdropFilter(value: string): this {
    return this.setProp(CSSPropertyKey.backdropFilter, value);
  }

  /** perspective を設定する */
  setPerspective(value: string): this {
    return this.setProp(CSSPropertyKey.perspective, value);
  }

  /** perspective-origin を設定する */
  setPerspectiveOrigin(value: string): this {
    return this.setProp(CSSPropertyKey.perspectiveOrigin, value);
  }
}
