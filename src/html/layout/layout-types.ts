/**
 * レイアウト型定義
 *
 * SwiftUI の HStack / VStack / ZStack / Spacer に対応するオプション型と
 * 子要素型を定義する。
 *
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1
 */

import type { AlignmentValue } from '../../css/constants/alignment.js';
import type { ZStackAlignmentKey } from '../../css/constants/alignment.js';
import type { HtmlTag } from '../elements/html-tag.js';

/**
 * HStack / VStack のオプション。
 *
 * - `spacing`: 子要素間のギャップ（px 単位の数値）。CSS `gap` に対応する。
 * - `alignment`: 交差軸方向の整列。CSS `align-items` に対応する。
 * - `wrap`: 折り返し有無。CSS `flex-wrap: wrap` に対応する。
 */
export interface StackOptions {
  spacing?:   number;         // gap: {spacing}px
  alignment?: AlignmentValue; // align-items
  wrap?:      boolean;        // flex-wrap: wrap
}

/**
 * ZStack のオプション。
 *
 * - `alignment`: 重ね合わせ時の整列キー。`ZStackAlignment` の各キーに対応する。
 */
export interface ZStackOptions {
  alignment?: ZStackAlignmentKey;
}

/**
 * Spacer のオプション。
 *
 * - `minLength`: スペーサーの最小サイズ（px 単位の数値）。
 *   水平方向では `min-width`、垂直方向では `min-height` に対応する。
 */
export interface SpacerOptions {
  minLength?: number; // min-width / min-height
}

/**
 * レイアウトコンテナの子要素型。
 *
 * `HtmlTag` インスタンスまたはテキスト文字列を受け付ける。
 */
export type LayoutChild = HtmlTag | string;
