import { resolveMinifyMode } from './resolve-minify-mode.js';

/**
 * CSS出力設定クラス
 *
 * CSS出力の振る舞いを制御する設定を管理する。
 * スコープドCSSの有効/無効と出力モードを設定できる。
 *
 * ## 設定項目
 *
 * - **scopedCssEnabled**: スコープドCSSの有効/無効
 *   - `true`: タグパスからハッシュクラス名を生成してCSSをラップ
 *   - `false`: インラインスタイル形式で出力
 * - **outputMode**: 出力モード
 *   - `'inline'`: インラインスタイルとして出力
 *   - `'external'`: 外部CSSファイル用の出力
 *
 * @example
 * ```ts
 * // デフォルト設定（スコープドCSS有効、インラインモード）
 * const config1 = new CssConfig();
 * console.log(config1.scopedCssEnabled); // → true
 * console.log(config1.outputMode); // → 'inline'
 *
 * // カスタム設定
 * const config2 = new CssConfig({
 *   scopedCssEnabled: false,
 *   outputMode: 'external'
 * });
 *
 * const manager = new CssManager('html>body>div', config2);
 * ```
 */

/**
 * CSS出力モード
 *
 * - `'inline'`: インラインスタイルとして出力
 * - `'external'`: 外部CSSファイル用の出力
 */
export type CssConfigOutputMode = 'inline' | 'external';

/**
 * CssConfig コンストラクタオプション
 */
export interface CssConfigOptions {
  /** スコープドCSSの有効/無効 */
  scopedCssEnabled: boolean;

  /** 出力モード */
  outputMode: CssConfigOutputMode;

  /**
   * scoped CSS クラス名の minify モード
   *
   * - `true`: `_<8hex>` 形式（コンパクト、production 向け）
   * - `false`: debuggable 形式（既定）
   * - 省略時は `process.env.NODE_ENV === 'production'` を fallback として参照する
   */
  minifyClassNames?: boolean;
}

/**
 * CSS出力設定
 */
export class CssConfig {
  /**
   * スコープドCSSの有効/無効
   *
   * `true` の場合、タグパスからハッシュクラス名を生成してCSSをラップする。
   * `false` の場合、インラインスタイル形式で出力する。
   *
   * @default true
   */
  scopedCssEnabled: boolean;

  /**
   * 出力モード
   *
   * - `'inline'`: インラインスタイルとして出力
   * - `'external'`: 外部CSSファイル用の出力
   *
   * @default 'inline'
   */
  outputMode: CssConfigOutputMode;

  /**
   * scoped CSS クラス名の minify モード（解決済み）
   *
   * コンストラクタで `options.minifyClassNames` と `process.env.NODE_ENV` から
   * 一度だけ解決され、以後は不変。
   *
   * - `true`: `_<8hex>` 形式（コンパクト）
   * - `false`: debuggable 形式
   *
   * @default false（NODE_ENV !== 'production' のとき）
   */
  readonly minifyClassNames: boolean;

  /**
   * CssConfig を構築する
   *
   * @param options - 設定オプション（省略時はデフォルト値を使用）
   */
  constructor(options?: Partial<CssConfigOptions>) {
    this.scopedCssEnabled = options?.scopedCssEnabled ?? true;
    this.outputMode = options?.outputMode ?? 'inline';
    this.minifyClassNames = resolveMinifyMode(
      options?.minifyClassNames,
      process.env.NODE_ENV,
    );
  }
}
