/**
 * AttributeManageable: 属性管理の責務インターフェース
 *
 * HTMLタグの属性追加・管理に関する操作を定義する。
 * HTMLTagProtocol はこのインターフェースを継承して属性管理機能を提供する。
 *
 * Task 5.1: HTMLTagProtocol の責務明確化（Requirement 4.4）
 *
 * Preconditions: attributes は追加順に保持される
 * Postconditions: addHtmlAttribute は this を返却（メソッドチェーン可能）
 * Invariants: 属性の順序は変更されない
 */
import type { HtmlAttributeShape } from './html-tag-protocol.js';

/**
 * 属性管理の責務インターフェース
 *
 * @remarks
 * このインターフェースは、HTMLタグの属性を管理する責務を定義します。
 * メソッドチェーンをサポートするため、すべてのメソッドは `this` を返します。
 *
 * @example
 * ```typescript
 * const div = new PairType('div');
 * div.addHtmlAttribute(new HtmlAttribute('id', 'test-id'))
 *    .addHtmlAttribute(new HtmlAttribute('class', 'test-class'));
 *
 * console.log(div.attributes.length); // 2
 * ```
 */
export interface AttributeManageable {
  /**
   * 属性の読み取り専用配列
   *
   * @remarks
   * 属性は追加順に保持されます。
   * 直接配列を変更することはできません。addHtmlAttribute メソッドを使用してください。
   */
  readonly attributes: ReadonlyArray<HtmlAttributeShape>;

  /**
   * HTML属性を1つ追加
   *
   * @param attribute - 追加する属性オブジェクト
   * @returns メソッドチェーンのため、this を返す
   *
   * @remarks
   * 属性は配列の末尾に追加されます。
   * 同じ key の属性を複数追加した場合、後の属性が優先されます（HTML仕様に従う）。
   *
   * @example
   * ```typescript
   * div.addHtmlAttribute(new HtmlAttribute('id', 'test-id'));
   * ```
   */
  addHtmlAttribute(attribute: HtmlAttributeShape): this;
}
