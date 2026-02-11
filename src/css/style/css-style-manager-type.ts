/**
 * Task 1.3: CssStyleManagerType インターフェース
 *
 * スタイル管理の抽象インターフェース。
 * Renderable を拡張し、フォントサイズ単位の取得機能を持つ。
 */
import type { Renderable } from '../../utils/renderable.js';
import type { HlUnit } from '../../utils/unit-style.js';

/**
 * HtmlStyle の前方宣言型。
 * 後続タスク(6.1)で具象化される。
 * 現時点では Renderable のサブタイプとして定義する。
 */
export interface HtmlStyleType extends Renderable {
  // 後続タスク(6.1)で具象化
}

/**
 * CSS スタイル管理の抽象インターフェース。
 *
 * HtmlTag に紐づくスタイル情報を保持し、
 * CSS 文字列へのレンダリングとフォントサイズ単位の参照を提供する。
 */
export interface CssStyleManagerType extends Renderable {
  readonly style: HtmlStyleType;
  getFontSizeUnit(): HlUnit | undefined;
}
