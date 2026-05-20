/**
 * CSSFlex -- Flexboxレイアウトプロパティ
 *
 * CSSPropertyGroup を継承し、setProp/getProp 経由でプロパティを管理する。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

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

export class CSSFlex extends CSSPropertyGroup {
  // ── Fluent Setters ──

  /** CSS flex ショートハンドプロパティを設定する（アイテム用: e.g. '1 1 auto'） */
  setFlexValue(value: string): this {
    return this.setProp(CSSPropertyKey.flex, value);
  }

  /** display:flex + 主要プロパティを一括設定するショートハンド */
  setFlex(options?: FlexOptions): this {
    this.setProp(CSSPropertyKey.display, 'flex');
    if (options?.direction) this.setProp(CSSPropertyKey.flexDirection, options.direction);
    if (options?.justify) this.setProp(CSSPropertyKey.justifyContent, options.justify);
    if (options?.align) this.setProp(CSSPropertyKey.alignItems, options.align);
    if (options?.wrap) this.setProp(CSSPropertyKey.flexWrap, options.wrap);
    if (options?.gap) this.setProp(CSSPropertyKey.gap, options.gap);
    return this;
  }

  /** flex-direction を設定する */
  setFlexDirection(value: string): this {
    return this.setProp(CSSPropertyKey.flexDirection, value);
  }

  /** justify-content を設定する */
  setJustifyContent(value: string): this {
    return this.setProp(CSSPropertyKey.justifyContent, value);
  }

  /** align-items を設定する */
  setAlignItems(value: string): this {
    return this.setProp(CSSPropertyKey.alignItems, value);
  }

  /** align-content を設定する */
  setAlignContent(value: string): this {
    return this.setProp(CSSPropertyKey.alignContent, value);
  }

  /** flex-wrap を設定する */
  setFlexWrap(value: string): this {
    return this.setProp(CSSPropertyKey.flexWrap, value);
  }

  /** gap を設定する */
  setGap(value: string): this {
    return this.setProp(CSSPropertyKey.gap, value);
  }

  /** flex-grow を設定する */
  setFlexGrow(value: string): this {
    return this.setProp(CSSPropertyKey.flexGrow, value);
  }

  /** flex-shrink を設定する */
  setFlexShrink(value: string): this {
    return this.setProp(CSSPropertyKey.flexShrink, value);
  }

  /** flex-basis を設定する */
  setFlexBasis(value: string): this {
    return this.setProp(CSSPropertyKey.flexBasis, value);
  }

  /** align-self を設定する */
  setAlignSelf(value: string): this {
    return this.setProp(CSSPropertyKey.alignSelf, value);
  }

  /** order を設定する */
  setOrder(value: string): this {
    return this.setProp(CSSPropertyKey.order, value);
  }
}
