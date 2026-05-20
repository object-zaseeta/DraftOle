/**
 * HTML要素のスタイル統合管理クラス
 *
 * 13種類のCSSプロパティクラスを統合的に保持し、一元的なCSS文字列出力を提供する。
 * 各プロパティクラスは独立してメソッドチェーン可能で、設定されたプロパティのみが出力される。
 *
 * ## プロパティクラス一覧
 *
 * | カテゴリ | クラス | 管理プロパティ数 |
 * |---------|--------|-----------------|
 * | フォント | {@link CSSFont} | 7 |
 * | 背景 | {@link CSSBackground} | 5 |
 * | テキスト | {@link CSSText} | 13 |
 * | 余白 | {@link CSSSpacing} | 10 |
 * | 枠線 | {@link CSSBorder} | 20 |
 * | 表示制御 | {@link CSSVisibility} | 31 |
 * | Flexbox | {@link CSSFlex} | 11 |
 * | Grid | {@link CSSGrid} | 14 |
 * | 視覚効果 | {@link CSSVisual} | 6 |
 * | 変形 | {@link CSSTransform} | 6 |
 * | アニメーション | {@link CSSAnimation} | 14 |
 * | テーブル | {@link CSSTable} | 5 |
 * | リスト | {@link CSSList} | 4 |
 *
 * ## 出力順序
 *
 * レンダリング時のプロパティ出力順序（Swift版と同一）:
 *
 * 1. font → 2. backgroundColor → 3. text → 4. spacing → 5. border →
 * 6. position → 7. flex → 8. grid → 9. visual → 10. transform →
 * 11. animation → 12. table → 13. list
 *
 * @example
 * ```ts
 * const style = new HtmlStyle();
 *
 * // メソッドチェーンで複数プロパティを設定
 * style.font
 *   .setFontSize('16px')
 *   .setFontWeight('bold')
 *   .setColor('#333');
 *
 * style.spacing
 *   .setMarginTop('10px')
 *   .setPaddingLeft('20px');
 *
 * style.flex
 *   .setFlexDirection('column')
 *   .setJustifyContent('center');
 *
 * // 設定されたプロパティのみを出力
 * console.log(style.render());
 * // → "color: #333;
 * //    font-size: 16px;
 * //    font-weight: bold;
 * //    margin-top: 10px;
 * //    padding-left: 20px;
 * //    align-items: center;
 * //    flex-direction: column;"
 * ```
 *
 * @see {@link HtmlStyleType}
 */
import type { HtmlStyleType } from './css-style-manager-type.js';
import { CSSAnimation } from './animation/css-animation.js';
import { CSSBackground } from './background/css-background.js';
import { CSSBorder } from './border/css-border.js';
import { CSSFlex } from './flex/css-flex.js';
import { CSSFont } from './font/css-font.js';
import { CSSGrid } from './grid/css-grid.js';
import { CSSList } from './list/css-list.js';
import { CSSPseudo } from './pseudo/css-pseudo.js';
import { CSSSpacing } from './spacing/css-spacing.js';
import { CSSTable } from './table/css-table.js';
import { CSSText } from './text/css-text.js';
import { CSSTransform } from './transform/css-transform.js';
import { CSSVisibility } from './visibility/css-visibility.js';
import { CSSVisual } from './visual/css-visual.js';

export class HtmlStyle implements HtmlStyleType {
  /** フォント・文字色プロパティ（7プロパティ） */
  readonly font: CSSFont = new CSSFont();

  /** 背景プロパティ（5プロパティ） */
  readonly backgroundColor: CSSBackground = new CSSBackground();

  /** テキスト装飾プロパティ（13プロパティ） */
  readonly text: CSSText = new CSSText();

  /** 余白プロパティ（10プロパティ） */
  readonly spacing: CSSSpacing = new CSSSpacing();

  /** 枠線プロパティ（20プロパティ） */
  readonly border: CSSBorder = new CSSBorder();

  /** 表示制御・可視性プロパティ（31プロパティ） */
  readonly position: CSSVisibility = new CSSVisibility();

  /** Flexboxレイアウトプロパティ（11プロパティ） */
  readonly flex: CSSFlex = new CSSFlex();

  /** Gridレイアウトプロパティ（14プロパティ） */
  readonly grid: CSSGrid = new CSSGrid();

  /** 視覚効果プロパティ（6プロパティ） */
  readonly visual: CSSVisual = new CSSVisual();

  /** 変形・フィルタプロパティ（6プロパティ） */
  readonly transform: CSSTransform = new CSSTransform();

  /** アニメーション・トランジションプロパティ（14プロパティ） */
  readonly animation: CSSAnimation = new CSSAnimation();

  /** テーブルレイアウトプロパティ（5プロパティ） */
  readonly table: CSSTable = new CSSTable();

  /** リストスタイルプロパティ（4プロパティ） */
  readonly list: CSSList = new CSSList();

  /**
   * 擬似クラス（:hover / :focus / :active）スタイル。
   *
   * Anti-Invariant:
   *   CSSPseudo は意図的に `Renderable` を実装せず、`render()` の outputs 配列にも
   *   含めない。擬似クラスは body-level プロパティ集約ではなく CSS ルールブロック
   *   （セレクタ付き）であり、`CssManager.renderCss()` から `renderForScope(scopeClass)` を
   *   直接呼び出して出力する。
   */
  readonly pseudo: CSSPseudo = new CSSPseudo();

  /**
   * すべてのプロパティをCSS文字列としてレンダリングする
   *
   * 各プロパティクラスの出力を順序通りに結合し、空文字列のものは除外する。
   * 未設定のプロパティは出力されない。
   *
   * @returns CSS文字列（全プロパティ未設定の場合は空文字列）
   */
  render(): string {
    const outputs = [
      this.font.render(),
      this.backgroundColor.render(),
      this.text.render(),
      this.spacing.render(),
      this.border.render(),
      this.position.render(),
      this.flex.render(),
      this.grid.render(),
      this.visual.render(),
      this.transform.render(),
      this.animation.render(),
      this.table.render(),
      this.list.render(),
    ].filter((s) => s !== '');

    return outputs.join('\n');
  }
}
