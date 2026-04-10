/**
 * Task 4.1: CSSGrid -- グリッドレイアウトプロパティ
 *
 * collectProperties() → render() 統一パターンに準拠。
 * 14のGrid関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 6.1, 6.5
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';
import { renderCssProperties } from '../../utils/css-sanitizer.js';

/**
 * グリッドレイアウトプロパティを管理するクラス
 *
 * コンテナプロパティ: grid-template-columns, grid-template-rows, grid-gap,
 *   grid-template-areas, grid-auto-flow, grid-auto-columns, grid-auto-rows
 * アイテムプロパティ: grid-column, grid-row, grid-column-start, grid-column-end,
 *   grid-row-start, grid-row-end, grid-area
 */
export class CSSGrid implements Renderable {
  // ── コンテナプロパティ ──
  private _gridTemplateColumns?: string;
  private _gridTemplateRows?: string;
  private _gridGap?: string;
  private _gridTemplateAreas?: string;
  private _gridAutoFlow?: string;
  private _gridAutoColumns?: string;
  private _gridAutoRows?: string;

  // ── アイテムプロパティ ──
  private _gridColumn?: string;
  private _gridRow?: string;
  private _gridColumnStart?: string;
  private _gridColumnEnd?: string;
  private _gridRowStart?: string;
  private _gridRowEnd?: string;
  private _gridArea?: string;

  // ── Fluent Setters ──

  /** grid-template-columns を設定する */
  setGridTemplateColumns(value: string): this {
    this._gridTemplateColumns = value;
    return this;
  }

  /** grid-template-rows を設定する */
  setGridTemplateRows(value: string): this {
    this._gridTemplateRows = value;
    return this;
  }

  /** grid-gap を設定する */
  setGridGap(value: string): this {
    this._gridGap = value;
    return this;
  }

  /** grid-column を設定する */
  setGridColumn(value: string): this {
    this._gridColumn = value;
    return this;
  }

  /** grid-row を設定する */
  setGridRow(value: string): this {
    this._gridRow = value;
    return this;
  }

  /** grid-column-start を設定する */
  setGridColumnStart(value: string): this {
    this._gridColumnStart = value;
    return this;
  }

  /** grid-column-end を設定する */
  setGridColumnEnd(value: string): this {
    this._gridColumnEnd = value;
    return this;
  }

  /** grid-row-start を設定する */
  setGridRowStart(value: string): this {
    this._gridRowStart = value;
    return this;
  }

  /** grid-row-end を設定する */
  setGridRowEnd(value: string): this {
    this._gridRowEnd = value;
    return this;
  }

  /** grid-template-areas を設定する */
  setGridTemplateAreas(value: string): this {
    this._gridTemplateAreas = value;
    return this;
  }

  /** grid-area を設定する */
  setGridArea(value: string): this {
    this._gridArea = value;
    return this;
  }

  /** grid-auto-flow を設定する */
  setGridAutoFlow(value: string): this {
    this._gridAutoFlow = value;
    return this;
  }

  /** grid-auto-columns を設定する */
  setGridAutoColumns(value: string): this {
    this._gridAutoColumns = value;
    return this;
  }

  /** grid-auto-rows を設定する */
  setGridAutoRows(value: string): this {
    this._gridAutoRows = value;
    return this;
  }

  // ── collectProperties() → render() 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する
   * キーはハイフネーションされたCSS標準プロパティ名
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._gridTemplateColumns !== undefined) {
      properties.set(CSSPropertyKey.gridTemplateColumns, this._gridTemplateColumns);
    }
    if (this._gridTemplateRows !== undefined) {
      properties.set(CSSPropertyKey.gridTemplateRows, this._gridTemplateRows);
    }
    if (this._gridGap !== undefined) {
      properties.set(CSSPropertyKey.gridGap, this._gridGap);
    }
    if (this._gridColumn !== undefined) {
      properties.set(CSSPropertyKey.gridColumn, this._gridColumn);
    }
    if (this._gridRow !== undefined) {
      properties.set(CSSPropertyKey.gridRow, this._gridRow);
    }
    if (this._gridColumnStart !== undefined) {
      properties.set(CSSPropertyKey.gridColumnStart, this._gridColumnStart);
    }
    if (this._gridColumnEnd !== undefined) {
      properties.set(CSSPropertyKey.gridColumnEnd, this._gridColumnEnd);
    }
    if (this._gridRowStart !== undefined) {
      properties.set(CSSPropertyKey.gridRowStart, this._gridRowStart);
    }
    if (this._gridRowEnd !== undefined) {
      properties.set(CSSPropertyKey.gridRowEnd, this._gridRowEnd);
    }
    if (this._gridTemplateAreas !== undefined) {
      properties.set(CSSPropertyKey.gridTemplateAreas, this._gridTemplateAreas);
    }
    if (this._gridArea !== undefined) {
      properties.set(CSSPropertyKey.gridArea, this._gridArea);
    }
    if (this._gridAutoFlow !== undefined) {
      properties.set(CSSPropertyKey.gridAutoFlow, this._gridAutoFlow);
    }
    if (this._gridAutoColumns !== undefined) {
      properties.set(CSSPropertyKey.gridAutoColumns, this._gridAutoColumns);
    }
    if (this._gridAutoRows !== undefined) {
      properties.set(CSSPropertyKey.gridAutoRows, this._gridAutoRows);
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
