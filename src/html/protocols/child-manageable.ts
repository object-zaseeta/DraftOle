/**
 * ChildManageable: 子要素管理の責務インターフェース
 *
 * HTMLタグの子要素追加・管理に関する操作を定義する。
 * HTMLTagProtocol はこのインターフェースを継承して子要素管理機能を提供する。
 *
 * Task 5.1: HTMLTagProtocol の責務明確化（Requirement 4.4）
 *
 * Preconditions: children は追加順に保持される
 * Postconditions: addChild/addChildren は this を返却（メソッドチェーン可能）
 * Invariants: 子要素の順序は変更されない
 */
import type { HTMLTagProtocol } from './html-tag-protocol.js';

/**
 * 子要素管理の責務インターフェース
 *
 * @remarks
 * このインターフェースは、HTMLタグの子要素を管理する責務を定義します。
 * メソッドチェーンをサポートするため、すべてのメソッドは `this` を返します。
 *
 * @example
 * ```typescript
 * const div = new PairType('div');
 * div.addChild(new TextType('Hello'))
 *    .addChild(new TextType('World'));
 *
 * console.log(div.children.length); // 2
 * ```
 */
export interface ChildManageable {
  /**
   * 子要素の読み取り専用配列
   *
   * @remarks
   * 子要素は追加順に保持されます。
   * 直接配列を変更することはできません。addChild/addChildren メソッドを使用してください。
   */
  readonly children: ReadonlyArray<HTMLTagProtocol>;

  /**
   * 子要素を1つ追加
   *
   * @param child - 追加する子要素
   * @returns メソッドチェーンのため、this を返す
   *
   * @remarks
   * 子要素は配列の末尾に追加されます。
   *
   * @example
   * ```typescript
   * div.addChild(new TextType('Hello'));
   * ```
   */
  addChild(child: HTMLTagProtocol): this;

  /**
   * 子要素を複数追加
   *
   * @param children - 追加する子要素の配列
   * @returns メソッドチェーンのため、this を返す
   *
   * @remarks
   * 子要素は配列の順序通りに追加されます。
   *
   * @example
   * ```typescript
   * div.addChildren([
   *   new TextType('Hello'),
   *   new TextType('World')
   * ]);
   * ```
   */
  addChildren(children: ReadonlyArray<HTMLTagProtocol>): this;
}
