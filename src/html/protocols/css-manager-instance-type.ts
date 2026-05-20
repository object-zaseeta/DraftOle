/**
 * CssManagerInstance インターフェース
 *
 * HtmlTag が保持する CSS マネージャーのコンポジション型。
 * Renderable を拡張し、CSS レンダリング機能を提供する。
 *
 * 依存方向: html/protocols/ が定義を所有し、css/manager/ が実装する。
 */
import type { Renderable } from '../../utils/renderable.js';

import type { LazyLayoutRegister } from '../../css/layout/lazy-layout/registered-item.js';
import type { CssPositionMakerType } from '../../css/layout/position-maker/css-position-maker-type.js';
import type { CssStyleManagerType } from '../../css/style/css-style-manager-type.js';
import type { IdentifierResolver } from '../../css/utils/identifier-resolver.js';

export interface CssManagerInstance extends Renderable {
  readonly layout: CssPositionMakerType;
  readonly styleManager: CssStyleManagerType;
  tagPath: string;
  updateTagPath(newPath: string): void;
  updateLazyLayoutRegister(register: LazyLayoutRegister | undefined): void;
  /**
   * スコープド CSS を出力する。
   *
   * `resolver` が指定された場合、wrapper class 名は resolver 経由で取得する
   * （minify モード等が反映される）。省略時は従来通り純関数 `generateScopedClassName`
   * を直接呼ぶ（バイト等価）。
   */
  renderCss(resolver?: IdentifierResolver): string;
  addMediaRule(breakpointPx: number, props: Record<string, string>): void;
}
