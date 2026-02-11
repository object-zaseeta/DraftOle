/**
 * Task 5.3: CSSTable -- テーブルレイアウトプロパティ
 *
 * collectProperties() → render() 統一パターンに準拠。
 * 5つのTable関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 7.4, 7.7
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';

/**
 * テーブルレイアウトプロパティを管理するクラス
 *
 * プロパティ: border-collapse, border-spacing, table-layout,
 *   caption-side, empty-cells
 */
export class CSSTable implements Renderable {
  private _borderCollapse?: string;
  private _borderSpacing?: string;
  private _tableLayout?: string;
  private _captionSide?: string;
  private _emptyCells?: string;

  // ── Fluent Setters ──

  /** border-collapse を設定する */
  setBorderCollapse(value: string): this {
    this._borderCollapse = value;
    return this;
  }

  /** border-spacing を設定する */
  setBorderSpacing(value: string): this {
    this._borderSpacing = value;
    return this;
  }

  /** table-layout を設定する */
  setTableLayout(value: string): this {
    this._tableLayout = value;
    return this;
  }

  /** caption-side を設定する */
  setCaptionSide(value: string): this {
    this._captionSide = value;
    return this;
  }

  /** empty-cells を設定する */
  setEmptyCells(value: string): this {
    this._emptyCells = value;
    return this;
  }

  // ── collectProperties() → render() 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する
   * キーはハイフネーションされたCSS標準プロパティ名
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._borderCollapse !== undefined) {
      properties.set(CSSPropertyKey.borderCollapse, this._borderCollapse);
    }
    if (this._borderSpacing !== undefined) {
      properties.set(CSSPropertyKey.borderSpacing, this._borderSpacing);
    }
    if (this._tableLayout !== undefined) {
      properties.set(CSSPropertyKey.tableLayout, this._tableLayout);
    }
    if (this._captionSide !== undefined) {
      properties.set(CSSPropertyKey.captionSide, this._captionSide);
    }
    if (this._emptyCells !== undefined) {
      properties.set(CSSPropertyKey.emptyCells, this._emptyCells);
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
    const properties = this.collectProperties();
    if (properties.size === 0) return '';
    return [...properties.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}: ${value}`)
      .join(';\n') + ';';
  }
}
