/**
 * CSSGrid -- グリッドレイアウトプロパティ
 *
 * CSSPropertyGroup を継承し、setProp/getProp 経由でプロパティを管理する。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 *
 * Requirements: 6.1, 6.5
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

/** Options for setGrid() shorthand. */
export interface GridOptions {
  columns?: number | string;
  rows?: number | string;
  gap?: string;
  areas?: string;
  autoFlow?: string;
}

/**
 * グリッドレイアウトプロパティを管理するクラス
 *
 * コンテナプロパティ: grid-template-columns, grid-template-rows, grid-gap,
 *   grid-template-areas, grid-auto-flow, grid-auto-columns, grid-auto-rows
 * アイテムプロパティ: grid-column, grid-row, grid-column-start, grid-column-end,
 *   grid-row-start, grid-row-end, grid-area
 */
export class CSSGrid extends CSSPropertyGroup {
  // ── Fluent Setters ──

  /** display:grid + 主要プロパティを一括設定するショートハンド */
  setGrid(options?: GridOptions): this {
    this.setProp(CSSPropertyKey.display, 'grid');
    if (options?.columns !== undefined) {
      this.setProp(
        CSSPropertyKey.gridTemplateColumns,
        typeof options.columns === 'number'
          ? `repeat(${options.columns}, 1fr)`
          : options.columns,
      );
    }
    if (options?.rows !== undefined) {
      this.setProp(
        CSSPropertyKey.gridTemplateRows,
        typeof options.rows === 'number'
          ? `repeat(${options.rows}, 1fr)`
          : options.rows,
      );
    }
    if (options?.gap !== undefined) this.setProp(CSSPropertyKey.gridGap, options.gap);
    if (options?.areas !== undefined) this.setProp(CSSPropertyKey.gridTemplateAreas, options.areas);
    if (options?.autoFlow !== undefined) this.setProp(CSSPropertyKey.gridAutoFlow, options.autoFlow);
    return this;
  }

  /** grid-template-columns を設定する */
  setGridTemplateColumns(value: string): this {
    return this.setProp(CSSPropertyKey.gridTemplateColumns, value);
  }

  /** grid-template-rows を設定する */
  setGridTemplateRows(value: string): this {
    return this.setProp(CSSPropertyKey.gridTemplateRows, value);
  }

  /** grid-gap を設定する */
  setGridGap(value: string): this {
    return this.setProp(CSSPropertyKey.gridGap, value);
  }

  /** grid-column を設定する */
  setGridColumn(value: string): this {
    return this.setProp(CSSPropertyKey.gridColumn, value);
  }

  /** grid-row を設定する */
  setGridRow(value: string): this {
    return this.setProp(CSSPropertyKey.gridRow, value);
  }

  /** grid-column-start を設定する */
  setGridColumnStart(value: string): this {
    return this.setProp(CSSPropertyKey.gridColumnStart, value);
  }

  /** grid-column-end を設定する */
  setGridColumnEnd(value: string): this {
    return this.setProp(CSSPropertyKey.gridColumnEnd, value);
  }

  /** grid-row-start を設定する */
  setGridRowStart(value: string): this {
    return this.setProp(CSSPropertyKey.gridRowStart, value);
  }

  /** grid-row-end を設定する */
  setGridRowEnd(value: string): this {
    return this.setProp(CSSPropertyKey.gridRowEnd, value);
  }

  /** grid-template-areas を設定する */
  setGridTemplateAreas(value: string): this {
    return this.setProp(CSSPropertyKey.gridTemplateAreas, value);
  }

  /** grid-area を設定する */
  setGridArea(value: string): this {
    return this.setProp(CSSPropertyKey.gridArea, value);
  }

  /** grid-auto-flow を設定する */
  setGridAutoFlow(value: string): this {
    return this.setProp(CSSPropertyKey.gridAutoFlow, value);
  }

  /** grid-auto-columns を設定する */
  setGridAutoColumns(value: string): this {
    return this.setProp(CSSPropertyKey.gridAutoColumns, value);
  }

  /** grid-auto-rows を設定する */
  setGridAutoRows(value: string): this {
    return this.setProp(CSSPropertyKey.gridAutoRows, value);
  }
}
