/**
 * 遅延レイアウト解決管理クラス
 *
 * 要素間の位置関係を登録し、依存関係のある配置計算を遅延評価で解決する。
 * 循環依存を検出し、エラーをスローすることで無限ループを防止する。
 *
 * ## 主な機能
 *
 * - **レイアウトアイテムの登録**: 要素間の位置関係を記述
 * - **遅延評価**: 依存関係を持つ配置値の段階的な解決
 * - **循環依存検出**: Set による訪問済みパスの追跡
 * - **CSS出力**: 解決済みレイアウトのCSS文字列生成
 *
 * ## 使用例
 *
 * @example
 * ```ts
 * const manager = new LazyLayoutManager();
 *
 * // 要素Aの配置を登録
 * manager.registerItem({
 *   relationShip: 'absolute',
 *   baseTagPath: 'html>body>div.a',
 *   basePosition: 'left',
 *   targetTagPath: undefined,
 *   targetPosition: 'none',
 *   value: { value: 0, unit: 'px' }
 * });
 *
 * // 要素Bの配置を要素Aに依存させる
 * manager.registerItem({
 *   relationShip: 'absolute',
 *   baseTagPath: 'html>body>div.b',
 *   basePosition: 'left',
 *   targetTagPath: 'html>body>div.a', // 要素Aを参照
 *   targetPosition: 'left',
 *   value: undefined // 遅延評価で解決される
 * });
 *
 * // すべての遅延レイアウトを解決
 * manager.resolveAllLayout();
 *
 * // 要素Bのレイアウトを出力
 * console.log(manager.renderItemsBy('html>body>div.b'));
 * // → "left: 0px;"
 * ```
 *
 * @see {@link LazyLayoutRegister}
 * @see {@link LayoutRegisteredItem}
 * @see {@link CssPositionMaker}
 */
import type { LazyLayoutRegister, LayoutRegisteredItem } from './registered-item.js';
import type { HlUnit, RelationShip } from '../../../utils/unit-style.js';
import { hlUnitToCssString } from '../../../utils/unit-style.js';
import type { Positioning } from '../positioning.js';

export class LazyLayoutManager implements LazyLayoutRegister {
  private items: LayoutRegisteredItem[] = [];

  /**
   * レイアウトアイテムを登録する
   *
   * @param item - 登録するレイアウトアイテム
   */
  registerItem(item: LayoutRegisteredItem): void {
    this.items.push(item);
  }

  /**
   * 指定されたタグパスの position 値を取得する
   *
   * @param tagPath - タグの階層パス
   * @returns position 値（'static' | 'relative' | 'absolute' | 'fixed'）、または undefined
   */
  getRelationShip(tagPath: string): RelationShip | undefined {
    const found = this.getItemsBy(tagPath);
    return found.length > 0 ? found[0]?.relationShip : undefined;
  }

  /**
   * すべての遅延レイアウトを解決する
   *
   * 未解決の値（value が undefined）を持つアイテムを検索し、
   * 依存関係を辿って値を解決する。循環依存が検出された場合は Error をスローする。
   *
   * @throws {Error} 循環依存が検出された場合
   */
  resolveAllLayout(): void {
    for (let i = 0; i < this.items.length; i++) {
      const current = this.items[i];
      if (current === undefined) continue;

      if (current.value === undefined) {
        const resolvedValue = this.getValue(current.basePosition, current.targetTagPath, new Set<string>());
        if (resolvedValue !== undefined) {
          this.items[i] = {
            relationShip: current.relationShip,
            baseTagPath: current.baseTagPath,
            basePosition: current.basePosition,
            targetTagPath: current.targetTagPath,
            targetPosition: current.targetPosition,
            value: resolvedValue,
          };
        }
      }
    }
  }

  /**
   * 指定されたタグパスのレイアウトアイテムをCSS文字列として出力する
   *
   * position プロパティは出力されない（個別要素用）。
   *
   * @param tagPath - タグの階層パス
   * @returns CSS文字列（アイテムがない場合は空文字列）
   */
  renderItemsBy(tagPath: string): string {
    const items = this.getItemsBy(tagPath);
    return this.renderLayoutByRegisteredItem(items, false);
  }

  /**
   * すべてのレイアウトアイテムをCSS文字列として出力する
   *
   * position プロパティを含む完全なCSS出力（static 以外）。
   *
   * @returns CSS文字列（アイテムがない場合は空文字列）
   */
  renderAllItems(): string {
    return this.renderLayoutByRegisteredItem(this.items, true);
  }

  // ── Private ──

  private getItemsBy(tagPath: string): LayoutRegisteredItem[] {
    return this.items.filter(item => item.baseTagPath === tagPath);
  }

  private getValue(
    needPosition: Positioning,
    targetPath: string | undefined,
    visitedPaths: Set<string>,
  ): HlUnit | undefined {
    // 1. targetPath が存在するか
    if (targetPath === undefined) return undefined;

    // 2. 循環依存チェック
    if (visitedPaths.has(targetPath)) {
      throw new Error(`Circular dependency detected: ${targetPath}`);
    }

    // 3. targetPath を持つアイテムを探す
    const targetItems = this.getItemsBy(targetPath);
    if (targetItems.length === 0) return undefined;

    // 4. 同じポジションのアイテムを探す
    const matchingItems = targetItems.filter(item => item.basePosition === needPosition);
    if (matchingItems.length === 0) return undefined;

    const matchedItem = matchingItems[0];
    if (matchedItem === undefined) return undefined;

    // 5. 値が設定されているか
    if (matchedItem.value !== undefined) {
      return matchedItem.value;
    }

    // 6. 値がない場合、さらに参照先を辿る
    const newVisitedPaths = new Set(visitedPaths);
    newVisitedPaths.add(targetPath);
    return this.getValue(needPosition, matchedItem.targetTagPath, newVisitedPaths);
  }

  private renderLayoutByRegisteredItem(
    items: LayoutRegisteredItem[],
    includePosition: boolean,
  ): string {
    const entries: string[] = [];
    let relationShipAdded = false;

    for (const item of items) {
      // 値が未解決のアイテムはスキップ
      if (item.value === undefined) continue;

      // position プロパティ（renderAllItems のみ、static 以外）
      if (includePosition && !relationShipAdded && item.relationShip !== 'static') {
        entries.push(`position: ${item.relationShip}`);
        relationShipAdded = true;
      }

      // 位置プロパティ（none はスキップ）
      if (item.basePosition !== 'none') {
        entries.push(`${item.basePosition}: ${hlUnitToCssString(item.value)}`);
      }
    }

    if (entries.length === 0) return '';
    return entries.join(';\n') + ';';
  }
}
