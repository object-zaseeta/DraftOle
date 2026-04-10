/**
 * Task 2.2: CSSSpacing - 余白プロパティ（margin/padding）の実装
 *
 * margin/padding の個別方向・一括指定をサポートする。
 * collectProperties → render 統一パターンに準拠。
 * HlUnit 連携による型安全な CSS 単位指定を提供する。
 *
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';
import { renderCssProperties } from '../../utils/css-sanitizer.js';
import type { HlUnit } from '../../../utils/unit-style.js';
import { hlUnitToCssString } from '../../../utils/unit-style.js';

/**
 * CSS 余白プロパティ（margin / padding）を管理するクラス。
 *
 * collectProperties() → render() 統一パターンに準拠し、
 * 設定済みプロパティのみをアルファベット順にソートして出力する。
 *
 * @example
 * ```ts
 * const spacing = new CSSSpacing();
 * spacing.setMarginTop('10px').setPaddingBottom('20px');
 * spacing.render();
 * // → 'margin-top: 10px;\npadding-bottom: 20px;'
 * ```
 */
export class CSSSpacing implements Renderable {
  // ── margin ストレージ ──
  private _marginTop?: string;
  private _marginRight?: string;
  private _marginBottom?: string;
  private _marginLeft?: string;
  private _margin?: string;

  // ── padding ストレージ ──
  private _paddingTop?: string;
  private _paddingRight?: string;
  private _paddingBottom?: string;
  private _paddingLeft?: string;
  private _padding?: string;

  // ── margin 個別方向セッター（文字列） ──

  /** margin-top を設定する */
  setMarginTop(value: string): this {
    this._marginTop = value;
    return this;
  }

  /** margin-right を設定する */
  setMarginRight(value: string): this {
    this._marginRight = value;
    return this;
  }

  /** margin-bottom を設定する */
  setMarginBottom(value: string): this {
    this._marginBottom = value;
    return this;
  }

  /** margin-left を設定する */
  setMarginLeft(value: string): this {
    this._marginLeft = value;
    return this;
  }

  /** margin 一括指定を設定する */
  setMargin(value: string): this {
    this._margin = value;
    return this;
  }

  // ── padding 個別方向セッター（文字列） ──

  /** padding-top を設定する */
  setPaddingTop(value: string): this {
    this._paddingTop = value;
    return this;
  }

  /** padding-right を設定する */
  setPaddingRight(value: string): this {
    this._paddingRight = value;
    return this;
  }

  /** padding-bottom を設定する */
  setPaddingBottom(value: string): this {
    this._paddingBottom = value;
    return this;
  }

  /** padding-left を設定する */
  setPaddingLeft(value: string): this {
    this._paddingLeft = value;
    return this;
  }

  /** padding 一括指定を設定する */
  setPadding(value: string): this {
    this._padding = value;
    return this;
  }

  // ── HlUnit ベースセッター ──

  /** margin-top を HlUnit で設定する */
  setMarginTopUnit(hlUnit: HlUnit): this {
    this._marginTop = hlUnitToCssString(hlUnit);
    return this;
  }

  /** margin-right を HlUnit で設定する */
  setMarginRightUnit(hlUnit: HlUnit): this {
    this._marginRight = hlUnitToCssString(hlUnit);
    return this;
  }

  /** margin-bottom を HlUnit で設定する */
  setMarginBottomUnit(hlUnit: HlUnit): this {
    this._marginBottom = hlUnitToCssString(hlUnit);
    return this;
  }

  /** margin-left を HlUnit で設定する */
  setMarginLeftUnit(hlUnit: HlUnit): this {
    this._marginLeft = hlUnitToCssString(hlUnit);
    return this;
  }

  /** padding-top を HlUnit で設定する */
  setPaddingTopUnit(hlUnit: HlUnit): this {
    this._paddingTop = hlUnitToCssString(hlUnit);
    return this;
  }

  /** padding-right を HlUnit で設定する */
  setPaddingRightUnit(hlUnit: HlUnit): this {
    this._paddingRight = hlUnitToCssString(hlUnit);
    return this;
  }

  /** padding-bottom を HlUnit で設定する */
  setPaddingBottomUnit(hlUnit: HlUnit): this {
    this._paddingBottom = hlUnitToCssString(hlUnit);
    return this;
  }

  /** padding-left を HlUnit で設定する */
  setPaddingLeftUnit(hlUnit: HlUnit): this {
    this._paddingLeft = hlUnitToCssString(hlUnit);
    return this;
  }

  // ── collectProperties → render 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する。
   * キーは CSSPropertyKey の値（ハイフネーション済み CSS プロパティ名）。
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    // margin
    if (this._margin !== undefined) {
      properties.set(CSSPropertyKey.margin, this._margin);
    }
    if (this._marginTop !== undefined) {
      properties.set(CSSPropertyKey.marginTop, this._marginTop);
    }
    if (this._marginRight !== undefined) {
      properties.set(CSSPropertyKey.marginRight, this._marginRight);
    }
    if (this._marginBottom !== undefined) {
      properties.set(CSSPropertyKey.marginBottom, this._marginBottom);
    }
    if (this._marginLeft !== undefined) {
      properties.set(CSSPropertyKey.marginLeft, this._marginLeft);
    }

    // padding
    if (this._padding !== undefined) {
      properties.set(CSSPropertyKey.padding, this._padding);
    }
    if (this._paddingTop !== undefined) {
      properties.set(CSSPropertyKey.paddingTop, this._paddingTop);
    }
    if (this._paddingRight !== undefined) {
      properties.set(CSSPropertyKey.paddingRight, this._paddingRight);
    }
    if (this._paddingBottom !== undefined) {
      properties.set(CSSPropertyKey.paddingBottom, this._paddingBottom);
    }
    if (this._paddingLeft !== undefined) {
      properties.set(CSSPropertyKey.paddingLeft, this._paddingLeft);
    }

    return properties;
  }

  /**
   * 設定済みプロパティを CSS 文字列としてレンダリングする。
   *
   * - 設定済みプロパティのみ出力（未設定は出力しない）
   * - プロパティ名のアルファベット順にソート
   * - セミコロン + 改行で区切り、末尾にセミコロン
   * - 全プロパティ未設定の場合は空文字列を返す
   */
  render(): string {
    return renderCssProperties(this.collectProperties());
  }
}
