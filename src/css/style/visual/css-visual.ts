/**
 * Task 5.2: CSSVisual -- 視覚効果プロパティ
 *
 * collectProperties() → render() 統一パターンに準拠。
 * 6のVisual関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 7.3, 7.7
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';

/**
 * 視覚効果プロパティを管理するクラス
 *
 * プロパティ: box-shadow, opacity, cursor, overflow, overflow-x, overflow-y
 */
export class CSSVisual implements Renderable {
  private _boxShadow?: string;
  private _opacity?: string;
  private _cursor?: string;
  private _overflow?: string;
  private _overflowX?: string;
  private _overflowY?: string;

  // ── Fluent Setters ──

  /** box-shadow を設定する */
  setBoxShadow(value: string): this {
    this._boxShadow = value;
    return this;
  }

  /** opacity を設定する */
  setOpacity(value: string): this {
    this._opacity = value;
    return this;
  }

  /** cursor を設定する */
  setCursor(value: string): this {
    this._cursor = value;
    return this;
  }

  /** overflow を設定する */
  setOverflow(value: string): this {
    this._overflow = value;
    return this;
  }

  /** overflow-x を設定する */
  setOverflowX(value: string): this {
    this._overflowX = value;
    return this;
  }

  /** overflow-y を設定する */
  setOverflowY(value: string): this {
    this._overflowY = value;
    return this;
  }

  // ── collectProperties() → render() 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する
   * キーはハイフネーションされたCSS標準プロパティ名
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._boxShadow !== undefined) {
      properties.set(CSSPropertyKey.boxShadow, this._boxShadow);
    }
    if (this._opacity !== undefined) {
      properties.set(CSSPropertyKey.opacity, this._opacity);
    }
    if (this._cursor !== undefined) {
      properties.set(CSSPropertyKey.cursor, this._cursor);
    }
    if (this._overflow !== undefined) {
      properties.set(CSSPropertyKey.overflow, this._overflow);
    }
    if (this._overflowX !== undefined) {
      properties.set(CSSPropertyKey.overflowX, this._overflowX);
    }
    if (this._overflowY !== undefined) {
      properties.set(CSSPropertyKey.overflowY, this._overflowY);
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
