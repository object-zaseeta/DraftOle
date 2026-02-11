/**
 * Task 5.1: CSSTransform -- 変形・フィルタプロパティ
 *
 * collectProperties() -> render() 統一パターンに準拠。
 * 6つのTransform関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 7.1, 7.2, 7.7
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';

/**
 * 変形・フィルタプロパティを管理するクラス
 *
 * 変形プロパティ: transform, transform-origin
 * フィルタプロパティ: filter, backdrop-filter
 * パースペクティブプロパティ: perspective, perspective-origin
 */
export class CSSTransform implements Renderable {
  // ── 変形プロパティ ──
  private _transform?: string;
  private _transformOrigin?: string;

  // ── フィルタプロパティ ──
  private _filter?: string;
  private _backdropFilter?: string;

  // ── パースペクティブプロパティ ──
  private _perspective?: string;
  private _perspectiveOrigin?: string;

  // ── Fluent Setters ──

  /** transform を設定する */
  setTransform(value: string): this {
    this._transform = value;
    return this;
  }

  /** transform-origin を設定する */
  setTransformOrigin(value: string): this {
    this._transformOrigin = value;
    return this;
  }

  /** filter を設定する */
  setFilter(value: string): this {
    this._filter = value;
    return this;
  }

  /** backdrop-filter を設定する */
  setBackdropFilter(value: string): this {
    this._backdropFilter = value;
    return this;
  }

  /** perspective を設定する */
  setPerspective(value: string): this {
    this._perspective = value;
    return this;
  }

  /** perspective-origin を設定する */
  setPerspectiveOrigin(value: string): this {
    this._perspectiveOrigin = value;
    return this;
  }

  // ── collectProperties() -> render() 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する
   * キーはハイフネーションされたCSS標準プロパティ名
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._transform !== undefined) {
      properties.set(CSSPropertyKey.transform, this._transform);
    }
    if (this._transformOrigin !== undefined) {
      properties.set(CSSPropertyKey.transformOrigin, this._transformOrigin);
    }
    if (this._filter !== undefined) {
      properties.set(CSSPropertyKey.filter, this._filter);
    }
    if (this._backdropFilter !== undefined) {
      properties.set(CSSPropertyKey.backdropFilter, this._backdropFilter);
    }
    if (this._perspective !== undefined) {
      properties.set(CSSPropertyKey.perspective, this._perspective);
    }
    if (this._perspectiveOrigin !== undefined) {
      properties.set(CSSPropertyKey.perspectiveOrigin, this._perspectiveOrigin);
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
