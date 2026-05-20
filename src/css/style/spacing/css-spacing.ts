/**
 * Task 3: CSSSpacing - HlUnit 統合と CSSPropertyGroup 移行
 *
 * CSSPropertyGroup を継承し、string | HlUnit の union 型セッターを提供する。
 * setXxxUnit メソッドは後方互換エイリアスとして維持する。
 *
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.4, 3.1, 5.1, 5.2, 5.3, 5.4, 6.1
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';
import type { HlUnit } from '../../../utils/unit-style.js';

/**
 * CSS 余白プロパティ（margin / padding）を管理するクラス。
 *
 * CSSPropertyGroup を継承し、プロパティ保存・重複検知・レンダリングを委譲する。
 * setXxx(value: string | HlUnit) の union 型セッターと、
 * 後方互換のための setXxxUnit(hlUnit: HlUnit) エイリアスを提供する。
 *
 * @example
 * ```ts
 * const spacing = new CSSSpacing();
 * spacing.setMarginTop('10px').setPaddingBottom('20px');
 * spacing.render();
 * // → 'margin-top: 10px;\npadding-bottom: 20px;'
 * ```
 */
export class CSSSpacing extends CSSPropertyGroup {
  // ── margin 個別方向セッター（string | HlUnit） ──

  /** margin-top を設定する */
  setMarginTop(value: string | HlUnit): this {
    return this.setUnitProp(CSSPropertyKey.marginTop, value);
  }

  /** margin-right を設定する */
  setMarginRight(value: string | HlUnit): this {
    return this.setUnitProp(CSSPropertyKey.marginRight, value);
  }

  /** margin-bottom を設定する */
  setMarginBottom(value: string | HlUnit): this {
    return this.setUnitProp(CSSPropertyKey.marginBottom, value);
  }

  /** margin-left を設定する */
  setMarginLeft(value: string | HlUnit): this {
    return this.setUnitProp(CSSPropertyKey.marginLeft, value);
  }

  /** margin 一括指定を設定する */
  setMargin(value: string): this {
    return this.setProp(CSSPropertyKey.margin, value);
  }

  // ── padding 個別方向セッター（string | HlUnit） ──

  /** padding-top を設定する */
  setPaddingTop(value: string | HlUnit): this {
    return this.setUnitProp(CSSPropertyKey.paddingTop, value);
  }

  /** padding-right を設定する */
  setPaddingRight(value: string | HlUnit): this {
    return this.setUnitProp(CSSPropertyKey.paddingRight, value);
  }

  /** padding-bottom を設定する */
  setPaddingBottom(value: string | HlUnit): this {
    return this.setUnitProp(CSSPropertyKey.paddingBottom, value);
  }

  /** padding-left を設定する */
  setPaddingLeft(value: string | HlUnit): this {
    return this.setUnitProp(CSSPropertyKey.paddingLeft, value);
  }

  /** padding 一括指定を設定する */
  setPadding(value: string): this {
    return this.setProp(CSSPropertyKey.padding, value);
  }

  // ── 後方互換エイリアス（setXxxUnit → setXxx） ──

  /** margin-top を HlUnit で設定する（後方互換エイリアス） */
  setMarginTopUnit(hlUnit: HlUnit): this {
    return this.setMarginTop(hlUnit);
  }

  /** margin-right を HlUnit で設定する（後方互換エイリアス） */
  setMarginRightUnit(hlUnit: HlUnit): this {
    return this.setMarginRight(hlUnit);
  }

  /** margin-bottom を HlUnit で設定する（後方互換エイリアス） */
  setMarginBottomUnit(hlUnit: HlUnit): this {
    return this.setMarginBottom(hlUnit);
  }

  /** margin-left を HlUnit で設定する（後方互換エイリアス） */
  setMarginLeftUnit(hlUnit: HlUnit): this {
    return this.setMarginLeft(hlUnit);
  }

  /** padding-top を HlUnit で設定する（後方互換エイリアス） */
  setPaddingTopUnit(hlUnit: HlUnit): this {
    return this.setPaddingTop(hlUnit);
  }

  /** padding-right を HlUnit で設定する（後方互換エイリアス） */
  setPaddingRightUnit(hlUnit: HlUnit): this {
    return this.setPaddingRight(hlUnit);
  }

  /** padding-bottom を HlUnit で設定する（後方互換エイリアス） */
  setPaddingBottomUnit(hlUnit: HlUnit): this {
    return this.setPaddingBottom(hlUnit);
  }

  /** padding-left を HlUnit で設定する（後方互換エイリアス） */
  setPaddingLeftUnit(hlUnit: HlUnit): this {
    return this.setPaddingLeft(hlUnit);
  }
}
