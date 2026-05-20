/**
 * CSSレイアウトビルダーインターフェース
 *
 * CSS レイアウトプロパティをメソッドチェーンで構築するビルダーパターン。
 * {@link CssPositionMaker} の placeXxxWith() メソッドで使用される。
 *
 * ## メソッドチェーン
 *
 * 各メソッドは自身を返すため、流暢なインターフェースで連続的に呼び出せる。
 *
 * @example
 * ```ts
 * maker.placeAbsoluteWith(builder => {
 *   builder
 *     .top(0, 'px')
 *     .left(0, 'px')
 *     .width(100, '%')
 *     .height(100, 'vh');
 * });
 * ```
 *
 * @see {@link CssPositionMaker}
 */
import type { UnitStyle } from '../../utils/unit-style.js';

export interface CssLayoutBuilder {
  /**
   * top プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  top(value: number, unit: UnitStyle): CssLayoutBuilder;

  /**
   * left プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  left(value: number, unit: UnitStyle): CssLayoutBuilder;

  /**
   * width プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  width(value: number, unit: UnitStyle): CssLayoutBuilder;

  /**
   * height プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  height(value: number, unit: UnitStyle): CssLayoutBuilder;

  /**
   * bottom プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  bottom(value: number, unit: UnitStyle): CssLayoutBuilder;

  /**
   * right プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  right(value: number, unit: UnitStyle): CssLayoutBuilder;
}
