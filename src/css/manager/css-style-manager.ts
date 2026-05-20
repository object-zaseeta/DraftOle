/**
 * CSSスタイル管理クラス
 *
 * {@link HtmlStyle} インスタンスを保持し、13種類のCSSプロパティクラスへの
 * アクセスとレンダリング機能を提供する。
 *
 * ## 管理するプロパティカテゴリ
 *
 * - フォント ({@link CSSFont})
 * - 背景 ({@link CSSBackground})
 * - テキスト ({@link CSSText})
 * - 余白 ({@link CSSSpacing})
 * - 枠線 ({@link CSSBorder})
 * - 表示制御 ({@link CSSVisibility})
 * - Flexbox ({@link CSSFlex})
 * - Grid ({@link CSSGrid})
 * - 視覚効果 ({@link CSSVisual})
 * - 変形 ({@link CSSTransform})
 * - アニメーション ({@link CSSAnimation})
 * - テーブル ({@link CSSTable})
 * - リスト ({@link CSSList})
 *
 * @example
 * ```ts
 * const manager = new CssStyleManager();
 * manager.style.font.setFontSize('16px').setColor('#333');
 * manager.style.spacing.setMarginTop('10px');
 *
 * console.log(manager.render());
 * // → "color: #333;\nfont-size: 16px;\nmargin-top: 10px;"
 * ```
 *
 * @see {@link CssStyleManagerType}
 * @see {@link HtmlStyle}
 */
import type { CssStyleManagerType } from '../style/css-style-manager-type.js';
import type { HlUnit, UnitStyle } from '../../utils/unit-style.js';
import { HtmlStyle } from '../style/html-style.js';

/**
 * CSS値文字列から HlUnit をパースする
 *
 * @param value - CSS値文字列（例: "16px", "1.5em", "100%"）
 * @returns パース結果の HlUnit、または undefined（パース失敗時）
 *
 * @internal
 */
function parseCssValueToUnit(value: string): HlUnit | undefined {
  const match = value.match(/^(-?\d+\.?\d*)(px|em|rem|%|vw|vh|fr)?$/);
  if (!match) return undefined;
  const num = parseFloat(match[1]!);
  const unit = (match[2] ?? 'none') as UnitStyle;
  return { value: num, unit };
}

export class CssStyleManager implements CssStyleManagerType {
  /** HtmlStyle インスタンス（13種類のプロパティクラスを統合管理） */
  readonly style: HtmlStyle = new HtmlStyle();

  /**
   * すべてのスタイルプロパティをCSS文字列としてレンダリングする
   *
   * @returns CSS文字列（設定されたプロパティがない場合は空文字列）
   */
  render(): string {
    return this.style.render();
  }

  /**
   * 設定されたフォントサイズを HlUnit として取得する
   *
   * コンテキスト伝播（em単位の計算など）に使用される。
   *
   * @returns フォントサイズの HlUnit、または undefined（未設定時）
   */
  getFontSizeUnit(): HlUnit | undefined {
    const fontSize = this.style.font.getFontSize();
    if (fontSize === undefined) return undefined;
    return parseCssValueToUnit(fontSize);
  }
}
