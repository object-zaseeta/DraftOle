/**
 * Task 5.3: CSSTable -- テーブルレイアウトプロパティ
 *
 * CSSPropertyGroup を継承することで、collectProperties() と render() の
 * 重複実装を排除したリファクタリング済みクラス。
 * 5つのTable関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 7.4, 7.7
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

/**
 * テーブルレイアウトプロパティを管理するクラス
 *
 * プロパティ: border-collapse, border-spacing, table-layout,
 *   caption-side, empty-cells
 */
export class CSSTable extends CSSPropertyGroup {
  // ── Fluent Setters ──

  /** border-collapse を設定する */
  setBorderCollapse(value: string): this {
    return this.setProp(CSSPropertyKey.borderCollapse, value);
  }

  /** border-spacing を設定する */
  setBorderSpacing(value: string): this {
    return this.setProp(CSSPropertyKey.borderSpacing, value);
  }

  /** table-layout を設定する */
  setTableLayout(value: string): this {
    return this.setProp(CSSPropertyKey.tableLayout, value);
  }

  /** caption-side を設定する */
  setCaptionSide(value: string): this {
    return this.setProp(CSSPropertyKey.captionSide, value);
  }

  /** empty-cells を設定する */
  setEmptyCells(value: string): this {
    return this.setProp(CSSPropertyKey.emptyCells, value);
  }
}
