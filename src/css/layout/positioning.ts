/**
 * レイアウト配置方向型
 *
 * レイアウト配置の方向を表す文字列リテラルユニオン型。
 * {@link LayoutRegisteredItem} の basePosition / targetPosition で使用され、
 * 要素間の位置関係を定義する。
 *
 * ## 値
 *
 * - `'top'`: 上端
 * - `'bottom'`: 下端
 * - `'left'`: 左端
 * - `'right'`: 右端
 * - `'none'`: 方向なし（値のみ保持）
 *
 * @example
 * ```ts
 * const item: LayoutRegisteredItem = {
 *   relationShip: 'absolute',
 *   baseTagPath: 'html>body>div.a',
 *   basePosition: 'left',  // Positioning型
 *   targetTagPath: 'html>body>div.b',
 *   targetPosition: 'right', // Positioning型
 *   value: { value: 10, unit: 'px' }
 * };
 * ```
 *
 * @see {@link LayoutRegisteredItem}
 * @see {@link LazyLayoutManager}
 */
export type Positioning = 'top' | 'bottom' | 'left' | 'right' | 'none';
