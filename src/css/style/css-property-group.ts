import type { Renderable } from '../../utils/renderable.js';
import { renderCssProperties } from '../utils/css-sanitizer.js';
import { guardDuplicateCssProperty } from '../../utils/dev-guard.js';
import { hlUnitToCssString, type HlUnit } from '../../utils/unit-style.js';

/**
 * CSS スタイルクラスの共通基底クラス。
 *
 * プロパティ保存・重複検知ガード・レンダリングを提供する。
 * 全 CSS スタイルクラス（CSSFont, CSSText 等）はこのクラスを継承する。
 *
 * @remarks
 * - `_props` は `private readonly` のため、サブクラスは `setProp` / `getProp` 経由でのみアクセスする
 * - `setProp` は `guardDuplicateCssProperty` を必ず呼んでから Map に書き込む
 * - `render()` は `renderCssProperties` に委譲し、サニタイズ・ソートを引き継ぐ
 */
export abstract class CSSPropertyGroup implements Renderable {
  private readonly _props: Map<string, string> = new Map();

  /**
   * CSS プロパティを保存する。重複設定は DEV モードで検知される。
   *
   * @param cssKey - CSS プロパティキー（例: 'font-size'）
   * @param value - プロパティ値
   */
  protected setProp(cssKey: string, value: string): this {
    guardDuplicateCssProperty(this._props.get(cssKey), cssKey);
    this._props.set(cssKey, value);
    return this;
  }

  /**
   * 保存済み CSS プロパティ値を取得する。
   * 公開 getter が必要なサブクラス（例: CSSFont.getFontSize()）で使用する。
   *
   * @param cssKey - CSS プロパティキー
   * @returns 設定済みの値、または未設定の場合は undefined
   */
  protected getProp(cssKey: string): string | undefined {
    return this._props.get(cssKey);
  }

  /**
   * string | HlUnit を CSS 文字列に変換するヘルパー。
   *
   * @param value - CSS 値文字列または HlUnit
   * @returns CSS 値文字列
   */
  protected resolveUnit(value: string | HlUnit): string {
    return typeof value === 'string' ? value : hlUnitToCssString(value);
  }

  /**
   * string | HlUnit を受け取り、resolveUnit で変換した後に setProp で保存するヘルパー。
   *
   * @param cssKey - CSS プロパティキー（例: 'margin-top'）
   * @param value - CSS 値文字列または HlUnit
   * @returns this（メソッドチェーン用）
   */
  protected setUnitProp(cssKey: string, value: string | HlUnit): this {
    return this.setProp(cssKey, this.resolveUnit(value));
  }

  /**
   * 設定済みプロパティを CSS 文字列としてレンダリングする。
   * renderCssProperties に委譲: アルファベットソート・サニタイズ・フォーマット。
   *
   * @returns CSS プロパティ文字列（例: `color: red;\nfont-size: 16px;`）、未設定の場合は空文字列
   */
  render(): string {
    return renderCssProperties(this._props);
  }
}
