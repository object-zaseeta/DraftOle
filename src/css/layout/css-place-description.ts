/**
 * CSS配置記述インターフェース
 *
 * 要素の配置情報（top, left, width, height）を表現する。
 * {@link CssPositionMaker.description} プロパティで現在の配置設定を取得する際に使用される。
 *
 * ## プロパティ
 *
 * すべてのプロパティはオプショナルで、設定された値のみが含まれる。
 * 未設定のプロパティは `undefined` となる。
 *
 * @example
 * ```ts
 * const maker = new CssPositionMaker('html>body>div');
 * maker.placeAbsoluteWith(b => {
 *   b.top(10, 'px').left(20, 'px');
 * });
 *
 * const desc = maker.description;
 * console.log(desc.top);    // → { value: 10, unit: 'px' }
 * console.log(desc.left);   // → { value: 20, unit: 'px' }
 * console.log(desc.width);  // → undefined
 * console.log(desc.height); // → undefined
 * ```
 *
 * @see {@link CssPositionMaker}
 * @see {@link HlUnit}
 */
import type { HlUnit } from '../../utils/unit-style.js';

export interface CssPlaceDescription {
  /** 上端からの位置 */
  top?: HlUnit;

  /** 左端からの位置 */
  left?: HlUnit;

  /** 幅 */
  width?: HlUnit;

  /** 高さ */
  height?: HlUnit;
}
