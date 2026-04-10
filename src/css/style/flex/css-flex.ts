/**
 * Task 2.3: CSSFlex -- Flexboxレイアウトプロパティ
 *
 * collectProperties() → render() 統一パターンに準拠。
 * 11のFlexbox関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';
import { renderCssProperties } from '../../utils/css-sanitizer.js';
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';

/**
 * Flexboxレイアウトプロパティを管理するクラス
 *
 * コンテナプロパティ: flex-direction, justify-content, align-items,
 *   align-content, flex-wrap, gap
 * アイテムプロパティ: flex-grow, flex-shrink, flex-basis, align-self, order
 */
/** Options for setFlex() shorthand. */
export interface FlexOptions {
  direction?: string;
  justify?: string;
  align?: string;
  wrap?: string;
  gap?: string;
}

export class CSSFlex implements Renderable {
  // ── コンテナプロパティ ──
  private _display?: string;
  private _flexDirection?: string;
  private _justifyContent?: string;
  private _alignItems?: string;
  private _alignContent?: string;
  private _flexWrap?: string;
  private _gap?: string;

  // ── アイテムプロパティ ──
  private _flexGrow?: string;
  private _flexShrink?: string;
  private _flexBasis?: string;
  private _alignSelf?: string;
  private _order?: string;

  // ── Fluent Setters ──

  /** display:flex + 主要プロパティを一括設定するショートハンド */
  setFlex(options?: FlexOptions): this {
    guardDuplicateCssProperty(this._display, 'display');
    this._display = 'flex';
    if (options?.direction) {
      guardDuplicateCssProperty(this._flexDirection, 'flex-direction');
      this._flexDirection = options.direction;
    }
    if (options?.justify) {
      guardDuplicateCssProperty(this._justifyContent, 'justify-content');
      this._justifyContent = options.justify;
    }
    if (options?.align) {
      guardDuplicateCssProperty(this._alignItems, 'align-items');
      this._alignItems = options.align;
    }
    if (options?.wrap) {
      guardDuplicateCssProperty(this._flexWrap, 'flex-wrap');
      this._flexWrap = options.wrap;
    }
    if (options?.gap) {
      guardDuplicateCssProperty(this._gap, 'gap');
      this._gap = options.gap;
    }
    return this;
  }

  /** flex-direction を設定する */
  setFlexDirection(value: string): this {
    guardDuplicateCssProperty(this._flexDirection, 'flex-direction');
    this._flexDirection = value;
    return this;
  }

  /** justify-content を設定する */
  setJustifyContent(value: string): this {
    guardDuplicateCssProperty(this._justifyContent, 'justify-content');
    this._justifyContent = value;
    return this;
  }

  /** align-items を設定する */
  setAlignItems(value: string): this {
    guardDuplicateCssProperty(this._alignItems, 'align-items');
    this._alignItems = value;
    return this;
  }

  /** align-content を設定する */
  setAlignContent(value: string): this {
    guardDuplicateCssProperty(this._alignContent, 'align-content');
    this._alignContent = value;
    return this;
  }

  /** flex-wrap を設定する */
  setFlexWrap(value: string): this {
    guardDuplicateCssProperty(this._flexWrap, 'flex-wrap');
    this._flexWrap = value;
    return this;
  }

  /** gap を設定する */
  setGap(value: string): this {
    guardDuplicateCssProperty(this._gap, 'gap');
    this._gap = value;
    return this;
  }

  /** flex-grow を設定する */
  setFlexGrow(value: string): this {
    guardDuplicateCssProperty(this._flexGrow, 'flex-grow');
    this._flexGrow = value;
    return this;
  }

  /** flex-shrink を設定する */
  setFlexShrink(value: string): this {
    guardDuplicateCssProperty(this._flexShrink, 'flex-shrink');
    this._flexShrink = value;
    return this;
  }

  /** flex-basis を設定する */
  setFlexBasis(value: string): this {
    guardDuplicateCssProperty(this._flexBasis, 'flex-basis');
    this._flexBasis = value;
    return this;
  }

  /** align-self を設定する */
  setAlignSelf(value: string): this {
    guardDuplicateCssProperty(this._alignSelf, 'align-self');
    this._alignSelf = value;
    return this;
  }

  /** order を設定する */
  setOrder(value: string): this {
    guardDuplicateCssProperty(this._order, 'order');
    this._order = value;
    return this;
  }

  // ── collectProperties() → render() 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する
   * キーはハイフネーションされたCSS標準プロパティ名
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._display !== undefined) {
      properties.set(CSSPropertyKey.display, this._display);
    }
    if (this._flexDirection !== undefined) {
      properties.set(CSSPropertyKey.flexDirection, this._flexDirection);
    }
    if (this._justifyContent !== undefined) {
      properties.set(CSSPropertyKey.justifyContent, this._justifyContent);
    }
    if (this._alignItems !== undefined) {
      properties.set(CSSPropertyKey.alignItems, this._alignItems);
    }
    if (this._alignContent !== undefined) {
      properties.set(CSSPropertyKey.alignContent, this._alignContent);
    }
    if (this._flexWrap !== undefined) {
      properties.set(CSSPropertyKey.flexWrap, this._flexWrap);
    }
    if (this._gap !== undefined) {
      properties.set(CSSPropertyKey.gap, this._gap);
    }
    if (this._flexGrow !== undefined) {
      properties.set(CSSPropertyKey.flexGrow, this._flexGrow);
    }
    if (this._flexShrink !== undefined) {
      properties.set(CSSPropertyKey.flexShrink, this._flexShrink);
    }
    if (this._flexBasis !== undefined) {
      properties.set(CSSPropertyKey.flexBasis, this._flexBasis);
    }
    if (this._alignSelf !== undefined) {
      properties.set(CSSPropertyKey.alignSelf, this._alignSelf);
    }
    if (this._order !== undefined) {
      properties.set(CSSPropertyKey.order, this._order);
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
