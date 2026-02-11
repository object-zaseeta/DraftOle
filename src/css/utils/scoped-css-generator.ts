/**
 * スコープドCSSクラス名生成ユーティリティ
 *
 * タグパスから決定的なハッシュを生成し、ユニークなCSSクラス名を作成する。
 * djb2アルゴリズムを使用することで、同じタグパスに対して常に同じクラス名を生成する。
 *
 * ## 特徴
 *
 * - **決定的**: 同じ入力に対して常に同じ出力
 * - **高速**: シンプルな算術演算のみ
 * - **衝突耐性**: 十分に分散したハッシュ値
 *
 * @module scoped-css-generator
 */

/**
 * djb2ハッシュアルゴリズム
 *
 * Dan Bernstein のハッシュ関数。文字列から32ビットの符号なし整数ハッシュを計算し、
 * 8文字の16進数文字列として返す。
 *
 * ## アルゴリズムの詳細
 *
 * 1. 初期値 5381 から開始
 * 2. 各文字に対して: `hash = (hash << 5) + hash + charCode`
 * 3. 符号なし32ビット整数に変換（`>>> 0`）
 * 4. 16進数8桁の文字列に変換
 *
 * @param str - ハッシュ対象の文字列
 * @returns 8文字の16進数文字列
 *
 * @example
 * ```ts
 * djb2Hash('html>body>div');
 * // → "a1b2c3d4" (例)
 *
 * djb2Hash('html>body>span');
 * // → "e5f6a7b8" (例、異なる値)
 * ```
 */
export function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * スコープドCSSクラス名を生成する
 *
 * タグパスからdjb2ハッシュを計算し、`_` プレフィックス + 8文字16進数の
 * クラス名を返す。生成されたクラス名は有効なCSS識別子であり、
 * 数字で始まる可能性を回避するために `_` プレフィックスを付与する。
 *
 * @param tagPath - タグの階層パス（例: 'html>body>div'）
 * @returns スコープドCSSクラス名（例: '_a1b2c3d4'）
 *
 * @example
 * ```ts
 * generateScopedClassName('html>body>div');
 * // → "_a1b2c3d4"
 *
 * generateScopedClassName('html>body>header>nav');
 * // → "_12345678"
 *
 * // CSSManagerでの使用例
 * const manager = new CssManager('html>body>div');
 * const className = generateScopedClassName(manager.tagPath);
 * // → "_a1b2c3d4"
 * ```
 */
export function generateScopedClassName(tagPath: string): string {
  return `_${djb2Hash(tagPath)}`;
}
