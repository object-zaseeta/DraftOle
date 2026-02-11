/**
 * Task 0.2 → 8.2: CssManagerInstance インターフェース
 *
 * HtmlTag が保持する CSS マネージャーのコンポジション型。
 * Renderable を拡張し、CSS レンダリング機能を提供する。
 *
 * Task 8.2 で layout / styleManager / updateLazyLayoutRegister を追加。
 */
import type { Renderable } from '../../utils/renderable.js';

import type { LazyLayoutRegister } from '../layout/lazy-layout/registered-item.js';
import type { CssPositionMakerType } from '../layout/position-maker/css-position-maker-type.js';
import type { CssStyleManagerType } from '../style/css-style-manager-type.js';

export interface CssManagerInstance extends Renderable {
  readonly layout: CssPositionMakerType;
  readonly styleManager: CssStyleManagerType;
  tagPath: string;
  updateTagPath(newPath: string): void;
  updateLazyLayoutRegister(register: LazyLayoutRegister | undefined): void;
  renderCss(): string;
}
