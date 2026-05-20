/**
 * デフォルトCSS管理クラス（no-op実装）
 *
 * {@link CssManagerInstance} のデフォルト実装で、すべてのメソッドが
 * 空文字列または空操作を返す。CSS が設定されていない {@link HtmlTag} に
 * 注入され、Null Objectパターンとして機能する。
 *
 * ## 用途
 *
 * - CSS未設定のタグに対する安全なデフォルト実装
 * - CSS機能を使用しない場合のオーバーヘッド削減
 * - Null Objectパターンによる条件分岐の削減
 *
 * @example
 * ```ts
 * const tag = new HtmlTag('div');
 * // tag.css は内部的に DefaultCssManager のインスタンス
 *
 * tag.css.render(); // → ''
 * tag.css.renderCss(); // → ''
 * tag.css.layout.render(); // → ''
 * ```
 *
 * @see {@link CssManagerInstance}
 * @see {@link CssManager}
 */
import type { CssManagerInstance } from '../../html/protocols/css-manager-instance-type.js';
import type { CssPositionMakerType } from '../layout/position-maker/css-position-maker-type.js';
import type { CssStyleManagerType } from '../style/css-style-manager-type.js';
import type { LazyLayoutRegister } from '../layout/lazy-layout/registered-item.js';
import type { CssPlaceDescription } from '../layout/css-place-description.js';
import type { CssLayoutBuilder } from '../layout/css-layout-builder.js';
import type { HlUnit } from '../../utils/unit-style.js';

/**
 * no-op CssPositionMakerType 実装
 * @internal
 */
const noopLayout: CssPositionMakerType = {
  tagPath: '',
  get description(): CssPlaceDescription { return {}; },
  updateLLRegister(_register: LazyLayoutRegister | undefined): void { /* no-op */ },
  getLLRegister(): LazyLayoutRegister | undefined { return undefined; },
  placeAbsoluteWith(_closure: (builder: CssLayoutBuilder) => void): void { /* no-op */ },
  placeRelativeWith(_closure: (builder: CssLayoutBuilder) => void): void { /* no-op */ },
  placeStaticWith(_closure: (builder: CssLayoutBuilder) => void): void { /* no-op */ },
  placeFixedWith(_closure: (builder: CssLayoutBuilder) => void): void { /* no-op */ },
  render(): string { return ''; },
};

/**
 * no-op CssStyleManagerType 実装
 * @internal
 */
const noopStyleManager: CssStyleManagerType = {
  get style(): { render(): string } { return { render() { return ''; } }; },
  getFontSizeUnit(): HlUnit | undefined { return undefined; },
  render(): string { return ''; },
};

export class DefaultCssManager implements CssManagerInstance {
  /** タグの階層パス（常に空文字列） */
  tagPath = '';

  /** no-opレイアウトマネージャー */
  readonly layout: CssPositionMakerType = noopLayout;

  /** no-opスタイルマネージャー */
  readonly styleManager: CssStyleManagerType = noopStyleManager;

  /**
   * タグパスを更新する（no-op）
   * @param newPath - 新しいタグパス
   */
  updateTagPath(newPath: string): void {
    this.tagPath = newPath;
  }

  /**
   * 遅延レイアウトレジスタを更新する（no-op）
   * @param _register - 遅延レイアウトレジスタ
   */
  updateLazyLayoutRegister(_register: LazyLayoutRegister | undefined): void {
    /* no-op */
  }

  /**
   * CSS文字列をレンダリングする（常に空文字列を返す）
   * @returns 空文字列
   */
  render(): string {
    return '';
  }

  /**
   * スコープドCSS文字列をレンダリングする（常に空文字列を返す）
   * @returns 空文字列
   */
  renderCss(): string {
    return '';
  }

  /**
   * @media ルールを追加する（no-op）
   * @param _breakpointPx - ブレークポイント（px 値）
   * @param _props - 追加するCSSプロパティのマップ
   */
  addMediaRule(_breakpointPx: number, _props: Record<string, string>): void {
    /* no-op */
  }
}
