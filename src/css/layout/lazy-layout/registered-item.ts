/**
 * Task 1.3: LayoutRegisteredItem & LazyLayoutRegister インターフェース
 *
 * 遅延レイアウト解決に必要なデータ構造とレジスタインターフェース。
 * LayoutRegisteredItem は要素間の位置関係を記述し、
 * LazyLayoutRegister はそれらを登録・解決・レンダリングする。
 */
import type { RelationShip, HlUnit } from '../../../utils/unit-style.js';
import type { Positioning } from '../positioning.js';

/**
 * レイアウト登録アイテム。
 * 基準要素とターゲット要素の位置関係を記述する。
 */
export interface LayoutRegisteredItem {
  relationShip: RelationShip;
  baseTagPath: string;
  basePosition: Positioning;
  targetTagPath?: string;
  targetPosition: Positioning;
  value?: HlUnit;
}

/**
 * 遅延レイアウト登録・解決インターフェース。
 * レイアウトアイテムの登録、検索、レンダリング、一括解決を提供する。
 */
export interface LazyLayoutRegister {
  registerItem(item: LayoutRegisteredItem): void;
  getRelationShip(tagPath: string): RelationShip | undefined;
  renderItemsBy(tagPath: string): string;
  renderAllItems(): string;
  resolveAllLayout(): void;
}
