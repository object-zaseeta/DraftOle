/**
 * Task 5.4: CSSList -- リストスタイルプロパティ
 *
 * collectProperties() → render() 統一パターンに準拠。
 * 4つのList関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 7.5, 7.7
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';
import { renderCssProperties } from '../../utils/css-sanitizer.js';
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';

/**
 * リストスタイルプロパティを管理するクラス
 *
 * プロパティ: list-style-type, list-style-position,
 *   list-style-image, list-style (shorthand)
 */
export class CSSList implements Renderable {
  private _listStyleType?: string;
  private _listStylePosition?: string;
  private _listStyleImage?: string;
  private _listStyle?: string;

  // ── Fluent Setters ──

  /** list-style-type を設定する */
  setListStyleType(value: string): this {
    guardDuplicateCssProperty(this._listStyleType, 'list-style-type');
    this._listStyleType = value;
    return this;
  }

  /** list-style-position を設定する */
  setListStylePosition(value: string): this {
    guardDuplicateCssProperty(this._listStylePosition, 'list-style-position');
    this._listStylePosition = value;
    return this;
  }

  /** list-style-image を設定する */
  setListStyleImage(value: string): this {
    guardDuplicateCssProperty(this._listStyleImage, 'list-style-image');
    this._listStyleImage = value;
    return this;
  }

  /** list-style (shorthand) を設定する */
  setListStyle(value: string): this {
    guardDuplicateCssProperty(this._listStyle, 'list-style');
    this._listStyle = value;
    return this;
  }

  // ── collectProperties() → render() 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する
   * キーはハイフネーションされたCSS標準プロパティ名
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._listStyleType !== undefined) {
      properties.set(CSSPropertyKey.listStyleType, this._listStyleType);
    }
    if (this._listStylePosition !== undefined) {
      properties.set(CSSPropertyKey.listStylePosition, this._listStylePosition);
    }
    if (this._listStyleImage !== undefined) {
      properties.set(CSSPropertyKey.listStyleImage, this._listStyleImage);
    }
    if (this._listStyle !== undefined) {
      properties.set(CSSPropertyKey.listStyle, this._listStyle);
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
