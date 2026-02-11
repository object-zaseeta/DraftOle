/**
 * HtmlAttributeManagerProtocol: 属性の追加・取得・レンダリングを定義
 *
 * Requirements: 1.2
 */
import type { HtmlAttributeShape } from './html-tag-protocol.js';

/**
 * HTML属性の管理機能を提供するインターフェース
 *
 * このインターフェースは、HTML要素の属性を追加し、レンダリングする責務を定義します。
 * 属性の追加、参照、HTML文字列への変換をサポートします。
 *
 * @remarks
 * 属性は追加順に保持されます。
 * 同じキーの属性が複数追加された場合、レンダリング時には最後に追加されたものが優先されます（HTML仕様に従う）。
 *
 * @example
 * ```typescript
 * class MyAttributeManager implements HtmlAttributeManagerProtocol {
 *   private _attributes: HtmlAttributeShape[] = [];
 *
 *   get attributes(): ReadonlyArray<HtmlAttributeShape> {
 *     return this._attributes;
 *   }
 *
 *   addHtmlAttribute(attribute: HtmlAttributeShape): void {
 *     this._attributes.push(attribute);
 *   }
 *
 *   renderAttributes(): string {
 *     return this._attributes
 *       .map(attr => attr.renderAttribute())
 *       .join(' ');
 *   }
 * }
 * ```
 */
export interface HtmlAttributeManagerProtocol {
  /**
   * 管理されている属性の読み取り専用配列
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
   *
   * @remarks
   * 属性は配列の末尾に追加されます。
   * 同じキーの属性が既に存在する場合でも追加され、レンダリング時には最後に追加された値が使用されます。
   *
   * @example
   * ```typescript
   * manager.addHtmlAttribute(new HtmlAttribute('id', 'test-id'));
   * manager.addHtmlAttribute(new HtmlAttribute('class', 'btn'));
   * ```
   */
  addHtmlAttribute(attribute: HtmlAttributeShape): void;

  /**
   * すべての属性をHTML文字列としてレンダリング
   *
   * @returns 属性の文字列表現（例: `id="test" class="btn"`）
   *
   * @remarks
   * 各属性は `renderAttribute()` メソッドで文字列化され、スペース区切りで連結されます。
   * 属性がない場合は空文字列を返します。
   *
   * @example
   * ```typescript
   * manager.addHtmlAttribute(new HtmlAttribute('id', 'test-id'));
   * manager.addHtmlAttribute(new HtmlAttribute('class', 'btn'));
   * console.log(manager.renderAttributes()); // 'id="test-id" class="btn"'
   * ```
   */
  renderAttributes(): string;
}
