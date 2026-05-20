/**
 * CSSVisibility -- 表示制御・サイズ・可視性プロパティクラス
 *
 * display, width/height/min/max, visibility, z-index,
 * overflow/overflowX/overflowY, float, clear を管理する。
 *
 * CSSPropertyGroup を継承し、setProp/getProp 経由でプロパティを管理する。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 *
 * Requirements: 3.1, 3.2, 3.5, 3.6, 7.6
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

export class CSSVisibility extends CSSPropertyGroup {
  // ── Fluent setters ──

  setDisplay(value: string): this {
    return this.setProp(CSSPropertyKey.display, value);
  }

  setWidth(value: string): this {
    return this.setProp(CSSPropertyKey.width, value);
  }

  setHeight(value: string): this {
    return this.setProp(CSSPropertyKey.height, value);
  }

  setMinWidth(value: string): this {
    return this.setProp(CSSPropertyKey.minWidth, value);
  }

  setMaxWidth(value: string): this {
    return this.setProp(CSSPropertyKey.maxWidth, value);
  }

  setMinHeight(value: string): this {
    return this.setProp(CSSPropertyKey.minHeight, value);
  }

  setMaxHeight(value: string): this {
    return this.setProp(CSSPropertyKey.maxHeight, value);
  }

  setVisibility(value: string): this {
    return this.setProp(CSSPropertyKey.visibility, value);
  }

  setZIndex(value: string): this {
    return this.setProp(CSSPropertyKey.zIndex, value);
  }

  setFloat(value: string): this {
    return this.setProp(CSSPropertyKey.cssFloat, value);
  }

  setClear(value: string): this {
    return this.setProp(CSSPropertyKey.clear, value);
  }
}
