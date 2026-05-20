/**
 * JQueryManagerProtocol: jQuery管理インターフェース
 *
 * Task 3.1 で型安全化: Set<string> → Set<JQueryMethodType>
 * jqm アクセサを追加して JQueryManagerInstance への参照を提供
 *
 * Requirements: 1.5, 1.9, 6.1, 6.2
 */

import type { JQueryMethodType } from './jquery-method-type.js';
import type { JQueryManagerInstance } from './jquery-manager-instance-type.js';

/**
 * jQuery管理機能を提供するインターフェース
 *
 * このインターフェースは、HTML要素のjQuery機能管理を担当します。
 * JQueryManagerInstanceをコンポジションで保持し、JavaScript生成とTree-shakingサポートを提供します。
 *
 * @remarks
 * - HTML要素ツリー全体からjQueryコードを収集します
 * - 使用されたjQueryメソッドを追跡してTree-shakingを可能にします
 * - `jqm` アクセサは `css` アクセサと対称的な設計です
 *
 * Preconditions: JQueryManagerInstanceが適切に初期化されていること
 * Postconditions: collectJsContent()は要素とその子孫すべてのjQueryコードを返す
 * Invariants: 収集されたメソッドセットは重複を含まない
 *
 * @example
 * ```typescript
 * const div = new PairType('div');
 * div.jqm.addClass('active');
 * div.jqm.onClick('alert("clicked")');
 *
 * console.log(div.collectJsContent());
 * // $('#element').addClass('active').on('click', function() { alert("clicked"); });
 *
 * const methods = div.collectUsedMethods();
 * console.log(methods); // Set { 'addClass', 'on' }
 * ```
 */
export interface JQueryManagerProtocol {
  /**
   * この要素とその子孫から生成されたjQueryコードを収集
   *
   * @returns 統合されたJavaScript文字列（jQuery形式）
   *
   * @remarks
   * 要素ツリーを再帰的に走査し、各要素のjQueryコードを収集して統合します。
   * 生成されるコードは、DOMの準備完了後（$(document).ready()）に実行されることを前提としています。
   *
   * @example
   * ```typescript
   * const div = new PairType('div');
   * div.addHtmlAttribute(new HtmlAttribute('id', 'myDiv'));
   * div.jqm.addClass('container');
   * div.jqm.setCss('background-color', '#fff');
   *
   * console.log(div.collectJsContent());
   * // $('#myDiv').addClass('container').css('background-color', '#fff');
   * ```
   */
  collectJsContent(): string;

  /**
   * この要素とその子孫で使用されたjQueryメソッド種別を収集
   *
   * @returns JQueryMethodTypeのSet（重複なし）
   *
   * @remarks
   * この情報はTree-shakingに使用され、実際に使用されたjQueryメソッドだけを
   * 最終的なバンドルに含めることができます。
   * 要素ツリー全体を走査し、すべての使用済みメソッドを収集します。
   *
   * @example
   * ```typescript
   * const div = new PairType('div');
   * div.jqm.addClass('container');
   * div.jqm.onClick('handleClick()');
   *
   * const methods = div.collectUsedMethods();
   * console.log(methods); // Set { 'addClass', 'on' }
   * ```
   */
  collectUsedMethods(): Set<JQueryMethodType>;

  /**
   * JQueryManagerInstanceへの読み取り専用アクセサ
   *
   * @remarks
   * このアクセサを通じて、jQuery管理インスタンスに直接アクセスできます。
   * jQueryメソッドの設定や管理など、JQueryManagerInstanceの全機能を利用できます。
   * CssManagerTypeの `css` アクセサと対称的な設計になっています。
   *
   * @example
   * ```typescript
   * const div = new PairType('div');
   * div.jqm.addClass('active');
   * div.jqm.onClick('handleClick()');
   * div.jqm.setData('userId', '123');
   *
   * console.log(div.jqm.render());
   * // .addClass('active').on('click', function() { handleClick(); }).data('userId', '123')
   * ```
   */
  readonly jqm: JQueryManagerInstance;
}
