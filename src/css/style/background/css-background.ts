/**
 * CSSBackground -- 背景プロパティクラス
 *
 * background-color, background-image, background-size,
 * background-position, background-repeat を管理する。
 * 線形グラデーション（linear-gradient）のヘルパーメソッドを提供する。
 * CSSColor 連携による型安全な色指定をサポートする。
 *
 * collectProperties() -> render() 統一パターンに準拠。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 *
 * Requirements: 5.4, 5.5, 5.7
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';
import { renderCssProperties } from '../../utils/css-sanitizer.js';
import type { CSSColor } from '../color/css-color.js';
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';

export class CSSBackground implements Renderable {
  private _backgroundColor?: string;
  private _backgroundImage?: string;
  private _backgroundSize?: string;
  private _backgroundPosition?: string;
  private _backgroundRepeat?: string;

  // ── Fluent setters ──

  setBackgroundColor(value: string): this {
    guardDuplicateCssProperty(this._backgroundColor, 'background-color');
    this._backgroundColor = value;
    return this;
  }

  setBackgroundImage(value: string): this {
    guardDuplicateCssProperty(this._backgroundImage, 'background-image');
    this._backgroundImage = value;
    return this;
  }

  setBackgroundSize(value: string): this {
    guardDuplicateCssProperty(this._backgroundSize, 'background-size');
    this._backgroundSize = value;
    return this;
  }

  setBackgroundPosition(value: string): this {
    guardDuplicateCssProperty(this._backgroundPosition, 'background-position');
    this._backgroundPosition = value;
    return this;
  }

  setBackgroundRepeat(value: string): this {
    guardDuplicateCssProperty(this._backgroundRepeat, 'background-repeat');
    this._backgroundRepeat = value;
    return this;
  }

  // ── CSSColor 連携 ──

  setBackgroundColorValue(color: CSSColor): this {
    guardDuplicateCssProperty(this._backgroundColor, 'background-color');
    this._backgroundColor = color.toString();
    return this;
  }

  // ── gradient ヘルパー ──

  setLinearGradient(direction: string, ...stops: string[]): this {
    guardDuplicateCssProperty(this._backgroundImage, 'background-image');
    this._backgroundImage = `linear-gradient(${direction}, ${stops.join(', ')})`;
    return this;
  }

  setRadialGradient(shape: string, ...stops: string[]): this {
    guardDuplicateCssProperty(this._backgroundImage, 'background-image');
    this._backgroundImage = `radial-gradient(${shape}, ${stops.join(', ')})`;
    return this;
  }

  // ── プロパティ収集 ──

  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._backgroundColor !== undefined) {
      properties.set(CSSPropertyKey.backgroundColor, this._backgroundColor);
    }
    if (this._backgroundImage !== undefined) {
      properties.set(CSSPropertyKey.backgroundImage, this._backgroundImage);
    }
    if (this._backgroundSize !== undefined) {
      properties.set(CSSPropertyKey.backgroundSize, this._backgroundSize);
    }
    if (this._backgroundPosition !== undefined) {
      properties.set(CSSPropertyKey.backgroundPosition, this._backgroundPosition);
    }
    if (this._backgroundRepeat !== undefined) {
      properties.set(CSSPropertyKey.backgroundRepeat, this._backgroundRepeat);
    }

    return properties;
  }

  // ── CSS文字列レンダリング ──

  render(): string {
    return renderCssProperties(this.collectProperties());
  }
}
