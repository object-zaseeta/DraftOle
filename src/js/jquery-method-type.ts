/**
 * jQuery method types supported by DraftOle
 *
 * DraftOleがサポートするjQuery風メソッドの型定義です。
 * Swift版JQueryMethodTypeと同一の値セットを持ち、クロスプラットフォームの互換性を保証します。
 *
 * @remarks
 * この型は{@link JQueryManager}と{@link JQueryHelper}で使用され、
 * tree-shakingによるバンドルサイズ最適化の基盤となります。
 *
 * ### サポートされるメソッド
 * - `css`: CSSプロパティの操作
 * - `height`: 要素の高さ設定
 * - `on`: 汎用イベントリスナー
 * - `text`: テキストコンテンツの操作
 * - `html`: HTMLコンテンツの操作
 * - `addClass`: クラスの追加
 * - `removeClass`: クラスの削除
 * - `toggleClass`: クラスのトグル
 *
 * @example 型として使用
 * ```typescript
 * function trackMethod(method: JQueryMethodType): void {
 *   console.log(`Method used: ${method}`);
 * }
 *
 * trackMethod('css'); // OK
 * trackMethod('text'); // OK
 * trackMethod('fadeIn'); // Error: Type '"fadeIn"' is not assignable
 * ```
 *
 * @example Setでの使用（tree-shaking）
 * ```typescript
 * const usedMethods = new Set<JQueryMethodType>();
 * usedMethods.add('css');
 * usedMethods.add('addClass');
 *
 * // JQueryHelperと組み合わせて使用
 * const helper = JQueryHelper.generateHelper(usedMethods);
 * ```
 *
 * @public
 */
export type JQueryMethodType =
  | 'css'
  | 'height'
  | 'on'
  | 'text'
  | 'html'
  | 'addClass'
  | 'removeClass'
  | 'toggleClass';

/**
 * イテレーション用のJQueryMethodType列挙定数
 *
 * 全てのサポートされているjQueryメソッドタイプを含む読み取り専用配列です。
 *
 * @remarks
 * ループ処理やバリデーションで使用することを想定しています。
 * `as const`アサーションにより、型レベルで不変性が保証されます。
 *
 * @example メソッドのバリデーション
 * ```typescript
 * function isValidMethod(method: string): method is JQueryMethodType {
 *   return JQUERY_METHOD_TYPES.includes(method as JQueryMethodType);
 * }
 *
 * console.log(isValidMethod('css')); // true
 * console.log(isValidMethod('fadeIn')); // false
 * ```
 *
 * @example 全メソッドのイテレーション
 * ```typescript
 * JQUERY_METHOD_TYPES.forEach(method => {
 *   console.log(`Supported method: ${method}`);
 * });
 * ```
 *
 * @example テスト用のメソッド網羅
 * ```typescript
 * // 全メソッドをテスト
 * JQUERY_METHOD_TYPES.forEach(method => {
 *   const jqm = new JQueryManager('test');
 *   jqm[method](...); // 各メソッドをテスト
 *   expect(jqm.usedMethods.has(method)).toBe(true);
 * });
 * ```
 *
 * @public
 */
export const JQUERY_METHOD_TYPES: readonly JQueryMethodType[] = [
  'css',
  'height',
  'on',
  'text',
  'html',
  'addClass',
  'removeClass',
  'toggleClass',
] as const;
