/**
 * CssManagerType: CSS 管理インターフェース
 *
 * Task 0.2: CssManagerInstance をコンポジションで保持し、
 * collectCssStyleString() は css.render() に委譲する。
 *
 * Requirements: 1.4
 */
import type { CssManagerInstance } from './css-manager-instance-type.js';

/**
 * CSS管理機能を提供するインターフェース
 *
 * このインターフェースは、HTML要素のCSS管理を担当します。
 * CssManagerInstanceをコンポジションで保持し、CSS文字列の収集とレンダリングをサポートします。
 *
 * @remarks
 * - `collectCssStyleString()` は後方互換性のために提供されており、内部的には `css.render()` に委譲します
 * - `css` アクセサを通じて直接CssManagerInstanceにアクセスできます
 * - HTMLタグの要素ツリー全体からCSSスタイルを収集します
 *
 * @example
 * ```typescript
 * class MyElement implements CssManagerType {
 *   readonly css: CssManagerInstance = new CssManagerInstance();
 *
 *   collectCssStyleString(): string {
 *     return this.css.render();
 *   }
 * }
 *
 * const element = new MyElement();
 * element.css.setBackgroundColor('#fff');
 * console.log(element.collectCssStyleString()); // "background-color: #fff;"
 * ```
 */
export interface CssManagerType {
  /**
   * この要素とその子孫から生成されたCSSスタイル文字列を収集
   *
   * @returns 統合されたCSSスタイル文字列
   *
   * @remarks
   * このメソッドは後方互換性のために提供されています。
   * 内部的には `css.render()` に委譲して、要素とその子孫すべてのCSSスタイルを収集します。
   * 新しいコードでは `css.render()` を直接使用することを推奨します。
   *
   * @example
   * ```typescript
   * const div = new PairType('div');
   * div.css.setWidth('100px');
   * div.css.setHeight('50px');
   * console.log(div.collectCssStyleString()); // "width: 100px; height: 50px;"
   * ```
   */
  collectCssStyleString(): string;

  /**
   * CssManagerInstanceへの読み取り専用アクセサ
   *
   * @remarks
   * このアクセサを通じて、CSS管理インスタンスに直接アクセスできます。
   * スタイルの設定やレンダリングなど、CssManagerInstanceの全機能を利用できます。
   *
   * @example
   * ```typescript
   * const div = new PairType('div');
   * div.css.setBackgroundColor('#f0f0f0');
   * div.css.setPadding('10px');
   * console.log(div.css.render()); // "background-color: #f0f0f0; padding: 10px;"
   * ```
   */
  readonly css: CssManagerInstance;
}
