/**
 * Task 1.3: CssPositionMakerType インターフェース
 *
 * CSS 配置管理の抽象インターフェース。
 * Renderable を拡張し、absolute/relative/static/fixed の配置と
 * 遅延レイアウト登録を管理する。
 */
import type { Renderable } from '../../../utils/renderable.js';
import type { CssPlaceDescription } from '../css-place-description.js';
import type { CssLayoutBuilder } from '../css-layout-builder.js';
import type { LazyLayoutRegister } from '../lazy-layout/registered-item.js';

export interface CssPositionMakerType extends Renderable {
  tagPath: string;
  readonly description: CssPlaceDescription;

  updateLLRegister(register: LazyLayoutRegister | undefined): void;
  getLLRegister(): LazyLayoutRegister | undefined;
  placeAbsoluteWith(closure: (builder: CssLayoutBuilder) => void): void;
  placeRelativeWith(closure: (builder: CssLayoutBuilder) => void): void;
  placeStaticWith(closure: (builder: CssLayoutBuilder) => void): void;
  placeFixedWith(closure: (builder: CssLayoutBuilder) => void): void;
}
