/**
 * CSSVisibility -- 表示制御・サイズ・可視性プロパティクラス
 *
 * display, width/height/min/max, visibility, z-index,
 * overflow/overflowX/overflowY, float, clear を管理する。
 *
 * collectProperties() -> render() 統一パターンに準拠。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 *
 * Requirements: 3.1, 3.2, 3.5, 3.6, 7.6
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';

export class CSSVisibility implements Renderable {
  private _display?: string;
  private _width?: string;
  private _height?: string;
  private _minWidth?: string;
  private _maxWidth?: string;
  private _minHeight?: string;
  private _maxHeight?: string;
  private _visibility?: string;
  private _zIndex?: string;
  private _overflow?: string;
  private _overflowX?: string;
  private _overflowY?: string;
  private _cssFloat?: string;
  private _clear?: string;

  // ── Fluent setters ──

  setDisplay(value: string): this {
    this._display = value;
    return this;
  }

  setWidth(value: string): this {
    this._width = value;
    return this;
  }

  setHeight(value: string): this {
    this._height = value;
    return this;
  }

  setMinWidth(value: string): this {
    this._minWidth = value;
    return this;
  }

  setMaxWidth(value: string): this {
    this._maxWidth = value;
    return this;
  }

  setMinHeight(value: string): this {
    this._minHeight = value;
    return this;
  }

  setMaxHeight(value: string): this {
    this._maxHeight = value;
    return this;
  }

  setVisibility(value: string): this {
    this._visibility = value;
    return this;
  }

  setZIndex(value: string): this {
    this._zIndex = value;
    return this;
  }

  setOverflow(value: string): this {
    this._overflow = value;
    return this;
  }

  setOverflowX(value: string): this {
    this._overflowX = value;
    return this;
  }

  setOverflowY(value: string): this {
    this._overflowY = value;
    return this;
  }

  setFloat(value: string): this {
    this._cssFloat = value;
    return this;
  }

  setClear(value: string): this {
    this._clear = value;
    return this;
  }

  // ── プロパティ収集 ──

  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._display !== undefined) {
      properties.set(CSSPropertyKey.display, this._display);
    }
    if (this._width !== undefined) {
      properties.set(CSSPropertyKey.width, this._width);
    }
    if (this._height !== undefined) {
      properties.set(CSSPropertyKey.height, this._height);
    }
    if (this._minWidth !== undefined) {
      properties.set(CSSPropertyKey.minWidth, this._minWidth);
    }
    if (this._maxWidth !== undefined) {
      properties.set(CSSPropertyKey.maxWidth, this._maxWidth);
    }
    if (this._minHeight !== undefined) {
      properties.set(CSSPropertyKey.minHeight, this._minHeight);
    }
    if (this._maxHeight !== undefined) {
      properties.set(CSSPropertyKey.maxHeight, this._maxHeight);
    }
    if (this._visibility !== undefined) {
      properties.set(CSSPropertyKey.visibility, this._visibility);
    }
    if (this._zIndex !== undefined) {
      properties.set(CSSPropertyKey.zIndex, this._zIndex);
    }
    if (this._overflow !== undefined) {
      properties.set(CSSPropertyKey.overflow, this._overflow);
    }
    if (this._overflowX !== undefined) {
      properties.set(CSSPropertyKey.overflowX, this._overflowX);
    }
    if (this._overflowY !== undefined) {
      properties.set(CSSPropertyKey.overflowY, this._overflowY);
    }
    if (this._cssFloat !== undefined) {
      properties.set(CSSPropertyKey.cssFloat, this._cssFloat);
    }
    if (this._clear !== undefined) {
      properties.set(CSSPropertyKey.clear, this._clear);
    }

    return properties;
  }

  // ── CSS文字列レンダリング ──

  render(): string {
    const properties = this.collectProperties();
    if (properties.size === 0) return '';
    return [...properties.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}: ${value}`)
      .join(';\n') + ';';
  }
}
