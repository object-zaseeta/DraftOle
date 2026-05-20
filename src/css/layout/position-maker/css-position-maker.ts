/**
 * CSS要素配置管理クラス
 *
 * 要素の配置方法（position）と配置プロパティ（top, left, width, height, bottom, right）を管理し、
 * ビルダーパターンによる型安全な配置設定とCSS文字列生成を提供する。
 *
 * ## 配置方法（position）
 *
 * - **static**: 通常のドキュメントフロー（デフォルト）
 * - **relative**: 相対配置（元の位置からのオフセット）
 * - **absolute**: 絶対配置（位置指定された祖先要素を基準）
 * - **fixed**: 固定配置（ビューポートを基準）
 *
 * ## 配置プロパティ
 *
 * - top, left, right, bottom: 配置位置
 * - width, height: サイズ
 *
 * ## ビルダーパターン
 *
 * {@link placeAbsoluteWith}, {@link placeRelativeWith}, {@link placeStaticWith},
 * {@link placeFixedWith} メソッドでクロージャを受け取り、{@link CssLayoutBuilder}
 * を通じて配置プロパティを設定する。
 *
 * @example
 * ```ts
 * const maker = new CssPositionMaker('html>body>div');
 *
 * // 絶対配置: 左上隅に配置、サイズ指定
 * maker.placeAbsoluteWith(b => {
 *   b.top(0, 'px')
 *    .left(0, 'px')
 *    .width(200, 'px')
 *    .height(100, 'px');
 * });
 *
 * console.log(maker.render());
 * // → "height: 100px;\nleft: 0px;\nposition: absolute;\ntop: 0px;\nwidth: 200px;"
 *
 * // 相対配置: 元の位置から右下に10pxずらす
 * maker.placeRelativeWith(b => {
 *   b.top(10, 'px').left(10, 'px');
 * });
 *
 * console.log(maker.render());
 * // → "left: 10px;\nposition: relative;\ntop: 10px;"
 * ```
 *
 * @see {@link CssPositionMakerType}
 * @see {@link CssLayoutBuilder}
 * @see {@link LazyLayoutManager}
 */
import type { HlUnit, RelationShip, UnitStyle } from '../../../utils/unit-style.js';
import { hlUnitToCssString } from '../../../utils/unit-style.js';
import { CSSPropertyKey } from '../../style/style-keys.js';
import type { CssPlaceDescription } from '../css-place-description.js';
import type { CssLayoutBuilder } from '../css-layout-builder.js';
import type { CssPositionMakerType } from './css-position-maker-type.js';
import type { LazyLayoutRegister } from '../lazy-layout/registered-item.js';

/**
 * CssLayoutBuilder の具象実装
 *
 * ビルダーパターンで配置プロパティを収集する内部クラス。
 *
 * @internal
 */
class LayoutBuilder implements CssLayoutBuilder {
  private _top?: HlUnit;
  private _left?: HlUnit;
  private _width?: HlUnit;
  private _height?: HlUnit;
  private _bottom?: HlUnit;
  private _right?: HlUnit;

  /**
   * top プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  top(value: number, unit: UnitStyle): CssLayoutBuilder {
    this._top = { value, unit };
    return this;
  }

  /**
   * left プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  left(value: number, unit: UnitStyle): CssLayoutBuilder {
    this._left = { value, unit };
    return this;
  }

  /**
   * width プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  width(value: number, unit: UnitStyle): CssLayoutBuilder {
    this._width = { value, unit };
    return this;
  }

  /**
   * height プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  height(value: number, unit: UnitStyle): CssLayoutBuilder {
    this._height = { value, unit };
    return this;
  }

  /**
   * bottom プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  bottom(value: number, unit: UnitStyle): CssLayoutBuilder {
    this._bottom = { value, unit };
    return this;
  }

  /**
   * right プロパティを設定する
   * @param value - 数値
   * @param unit - CSS単位
   * @returns this（メソッドチェーン用）
   */
  right(value: number, unit: UnitStyle): CssLayoutBuilder {
    this._right = { value, unit };
    return this;
  }

  /** @internal */
  getTop(): HlUnit | undefined { return this._top; }
  /** @internal */
  getLeft(): HlUnit | undefined { return this._left; }
  /** @internal */
  getWidth(): HlUnit | undefined { return this._width; }
  /** @internal */
  getHeight(): HlUnit | undefined { return this._height; }
  /** @internal */
  getBottom(): HlUnit | undefined { return this._bottom; }
  /** @internal */
  getRight(): HlUnit | undefined { return this._right; }
}

export class CssPositionMaker implements CssPositionMakerType {
  /** タグの階層パス（例: 'html>body>div'） */
  tagPath: string;

  private _relationShip?: RelationShip;
  private _top?: HlUnit;
  private _left?: HlUnit;
  private _width?: HlUnit;
  private _height?: HlUnit;
  private _bottom?: HlUnit;
  private _right?: HlUnit;
  private _llRegister?: LazyLayoutRegister;

  /**
   * CssPositionMaker を構築する
   * @param tagPath - タグの階層パス
   */
  constructor(tagPath: string) {
    this.tagPath = tagPath;
  }

  /**
   * 現在の配置設定の概要を取得する
   *
   * top, left, width, height の値を含むオブジェクトを返す。
   * 遅延レイアウト解決に使用される。
   *
   * @returns 配置設定の概要
   */
  get description(): CssPlaceDescription {
    return {
      top: this._top,
      left: this._left,
      width: this._width,
      height: this._height,
    };
  }

  /**
   * 遅延レイアウトレジスタを更新する
   *
   * @param register - 遅延レイアウトレジスタ（undefined で解除）
   */
  updateLLRegister(register: LazyLayoutRegister | undefined): void {
    this._llRegister = register;
  }

  /**
   * 遅延レイアウトレジスタを取得する
   *
   * @returns 遅延レイアウトレジスタ、または undefined
   */
  getLLRegister(): LazyLayoutRegister | undefined {
    return this._llRegister;
  }

  /**
   * 絶対配置を設定する
   *
   * position: absolute を設定し、ビルダーで配置プロパティを指定する。
   * 絶対配置は位置指定された祖先要素を基準とする。
   *
   * @param closure - 配置プロパティを設定するビルダー関数
   *
   * @example
   * ```ts
   * maker.placeAbsoluteWith(b => {
   *   b.top(0, 'px').left(0, 'px').width(100, '%').height(100, '%');
   * });
   * ```
   */
  placeAbsoluteWith(closure: (builder: CssLayoutBuilder) => void): void {
    this.placeWith('absolute', closure);
  }

  /**
   * 相対配置を設定する
   *
   * position: relative を設定し、ビルダーで配置プロパティを指定する。
   * 相対配置は元の位置からのオフセットを指定する。
   *
   * @param closure - 配置プロパティを設定するビルダー関数
   *
   * @example
   * ```ts
   * maker.placeRelativeWith(b => {
   *   b.top(10, 'px').left(10, 'px');
   * });
   * ```
   */
  placeRelativeWith(closure: (builder: CssLayoutBuilder) => void): void {
    this.placeWith('relative', closure);
  }

  /**
   * 通常配置を設定する
   *
   * position: static を設定する（デフォルトのドキュメントフロー）。
   *
   * @param closure - 配置プロパティを設定するビルダー関数
   */
  placeStaticWith(closure: (builder: CssLayoutBuilder) => void): void {
    this.placeWith('static', closure);
  }

  /**
   * 固定配置を設定する
   *
   * position: fixed を設定し、ビルダーで配置プロパティを指定する。
   * 固定配置はビューポートを基準とする。
   *
   * @param closure - 配置プロパティを設定するビルダー関数
   *
   * @example
   * ```ts
   * maker.placeFixedWith(b => {
   *   b.top(0, 'px').right(0, 'px').width(200, 'px');
   * });
   * ```
   */
  placeFixedWith(closure: (builder: CssLayoutBuilder) => void): void {
    this.placeWith('fixed', closure);
  }

  /**
   * 配置プロパティをCSS文字列としてレンダリングする
   *
   * 設定されたプロパティのみをアルファベット順にソートして出力する。
   *
   * @returns CSS文字列（未設定の場合は空文字列）
   */
  render(): string {
    const properties = this.collectProperties();
    if (properties.size === 0) return '';
    return [...properties.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}: ${value}`)
      .join(';\n') + ';';
  }

  // ── Private ──

  private placeWith(relationShip: RelationShip, closure: (builder: CssLayoutBuilder) => void): void {
    // リセット: 前回の配置値をクリア
    this._top = undefined;
    this._left = undefined;
    this._width = undefined;
    this._height = undefined;
    this._bottom = undefined;
    this._right = undefined;

    this._relationShip = relationShip;

    const builder = new LayoutBuilder();
    closure(builder);

    this._top = builder.getTop();
    this._left = builder.getLeft();
    this._width = builder.getWidth();
    this._height = builder.getHeight();
    this._bottom = builder.getBottom();
    this._right = builder.getRight();
  }

  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._relationShip !== undefined) {
      properties.set(CSSPropertyKey.position, this._relationShip);
    }
    if (this._top !== undefined) {
      properties.set(CSSPropertyKey.top, hlUnitToCssString(this._top));
    }
    if (this._left !== undefined) {
      properties.set(CSSPropertyKey.left, hlUnitToCssString(this._left));
    }
    if (this._width !== undefined) {
      properties.set(CSSPropertyKey.width, hlUnitToCssString(this._width));
    }
    if (this._height !== undefined) {
      properties.set(CSSPropertyKey.height, hlUnitToCssString(this._height));
    }
    if (this._bottom !== undefined) {
      properties.set(CSSPropertyKey.bottom, hlUnitToCssString(this._bottom));
    }
    if (this._right !== undefined) {
      properties.set(CSSPropertyKey.right, hlUnitToCssString(this._right));
    }

    return properties;
  }
}
