/**
 * CSS中央管理クラス
 *
 * CssStyleManager と CssPositionMaker を統合的に保持し、
 * CSS文字列の統合出力とスコープドCSS出力を提供する。
 *
 * ## 主な機能
 *
 * - **スタイル管理**: {@link CssStyleManager} を通じて13種類のCSSプロパティを管理
 * - **レイアウト管理**: {@link CssPositionMaker} を通じて要素の配置を管理
 * - **スコープドCSS**: タグパスに基づくハッシュクラス名の自動生成
 * - **遅延レイアウト**: {@link LazyLayoutManager} との連携による依存関係の解決
 *
 * ## レンダリング
 *
 * - {@link render}(): スタイルCSS + レイアウトCSS の結合文字列
 * - {@link renderCss}(): スコープドCSS形式（`._{hash}` { ... }）またはインラインスタイル
 *
 * @example
 * ```ts
 * const manager = new CssManager('html>body>div');
 * manager.styleManager.style.font.setFontSize('16px');
 * manager.layout.placeAbsoluteWith(b => b.top(0, 'px').left(0, 'px'));
 *
 * // インラインスタイル出力
 * console.log(manager.render());
 * // → "font-size: 16px;\nleft: 0px;\nposition: absolute;\ntop: 0px;"
 *
 * // スコープドCSS出力
 * console.log(manager.renderCss());
 * // → "._a1b2c3d4 {\nfont-size: 16px;\nleft: 0px;\nposition: absolute;\ntop: 0px;\n}"
 * ```
 *
 * @see {@link CssManagerInstance}
 * @see {@link CssStyleManager}
 * @see {@link CssPositionMaker}
 * @see {@link CssConfig}
 */
import type { CssManagerInstance } from './css-manager-instance-type.js';
import type { LazyLayoutRegister } from '../layout/lazy-layout/registered-item.js';

import { CssConfig } from '../config/css-config.js';
import { CssPositionMaker } from '../layout/position-maker/css-position-maker.js';
import { CssStyleManager } from './css-style-manager.js';
import { generateScopedClassName } from '../utils/scoped-css-generator.js';

export class CssManager implements CssManagerInstance {
  /** レイアウト管理インスタンス */
  readonly layout: CssPositionMaker;

  /** スタイル管理インスタンス */
  readonly styleManager: CssStyleManager;

  /** CSS出力設定 */
  readonly config: CssConfig;

  /** タグの階層パス（例: 'html>body>div'） */
  tagPath: string;

  /**
   * CssManager を構築する
   *
   * @param tagPath - タグの階層パス（デフォルト: ''）
   * @param config - CSS出力設定（省略時はデフォルト設定）
   */
  constructor(tagPath = '', config?: CssConfig) {
    this.tagPath = tagPath;
    this.config = config ?? new CssConfig();
    this.layout = new CssPositionMaker(tagPath);
    this.styleManager = new CssStyleManager();
  }

  /**
   * タグパスを更新し、レイアウトマネージャーにも伝播する
   *
   * @param newPath - 新しいタグパス
   */
  updateTagPath(newPath: string): void {
    this.tagPath = newPath;
    this.layout.tagPath = newPath;
  }

  /**
   * 遅延レイアウトレジスタを更新する
   *
   * @param register - 遅延レイアウトレジスタ（undefined で解除）
   */
  updateLazyLayoutRegister(register: LazyLayoutRegister | undefined): void {
    this.layout.updateLLRegister(register);
  }

  /**
   * スタイルCSSとレイアウトCSSを結合して返す
   *
   * スコープクラスなしのインラインスタイル形式で出力する。
   *
   * @returns CSS文字列（両方とも空の場合は空文字列）
   */
  render(): string {
    const styleCss = this.styleManager.render();
    const layoutCss = this.layout.render();

    if (styleCss === '' && layoutCss === '') return '';
    if (styleCss === '') return layoutCss;
    if (layoutCss === '') return styleCss;
    return `${styleCss}\n${layoutCss}`;
  }

  /**
   * スコープドCSSまたはインラインスタイルとして出力する
   *
   * {@link CssConfig.scopedCssEnabled} が true の場合、
   * タグパスから生成したハッシュクラス名で CSS をラップする。
   *
   * @returns スコープドCSS文字列またはインラインスタイル
   *
   * @example
   * ```ts
   * // scopedCssEnabled = true の場合
   * // "._a1b2c3d4 {\nfont-size: 16px;\n}"
   *
   * // scopedCssEnabled = false の場合
   * // "font-size: 16px;"
   * ```
   */
  renderCss(): string {
    const cssBody = this.render();
    if (cssBody === '') return '';

    if (!this.config.scopedCssEnabled) {
      return cssBody;
    }

    const className = generateScopedClassName(this.tagPath);
    return `.${className} {\n${cssBody}\n}`;
  }
}
