/**
 * CSSBackground -- 背景プロパティクラス
 *
 * background-color, background-image, background-size,
 * background-position, background-repeat を管理する。
 * 線形グラデーション（linear-gradient）のヘルパーメソッドを提供する。
 * CSSColor 連携による型安全な色指定をサポートする。
 *
 * CSSPropertyGroup を継承し、共通の setProp/render パターンを利用する。
 * Fluent setter（メソッドチェーン）対応。
 * 設定プロパティのみ出力し、未設定は出力しない。
 *
 * Requirements: 5.4, 5.5, 5.7
 */
import type { CSSColor } from '../color/css-color.js';
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

/** Options for setBackground() shorthand. */
export interface BackgroundOptions {
  color?: string;
  image?: string;
  size?: string;
  position?: string;
  repeat?: string;
}

export class CSSBackground extends CSSPropertyGroup {
  // ── Fluent setters ──

  setBackgroundColor(value: string): this {
    return this.setProp(CSSPropertyKey.backgroundColor, value);
  }

  setBackgroundImage(value: string): this {
    return this.setProp(CSSPropertyKey.backgroundImage, value);
  }

  setBackgroundSize(value: string): this {
    return this.setProp(CSSPropertyKey.backgroundSize, value);
  }

  setBackgroundPosition(value: string): this {
    return this.setProp(CSSPropertyKey.backgroundPosition, value);
  }

  setBackgroundRepeat(value: string): this {
    return this.setProp(CSSPropertyKey.backgroundRepeat, value);
  }

  /**
   * background ショートハンド設定。
   * - 文字列: CSS `background:` ショートハンドとして出力（例: `'#fff url(...) no-repeat center/cover'`, `'radial-gradient(...), #000'`）
   * - オブジェクト: 個別の background-* プロパティを一括設定
   */
  setBackground(value: string | BackgroundOptions): this {
    if (typeof value === 'string') {
      return this.setProp(CSSPropertyKey.background, value);
    } else {
      if (value.color !== undefined) this.setBackgroundColor(value.color);
      if (value.image !== undefined) this.setBackgroundImage(value.image);
      if (value.size !== undefined) this.setBackgroundSize(value.size);
      if (value.position !== undefined) this.setBackgroundPosition(value.position);
      if (value.repeat !== undefined) this.setBackgroundRepeat(value.repeat);
    }
    return this;
  }

  // ── CSSColor 連携 ──

  setBackgroundColorValue(color: CSSColor): this {
    return this.setProp(CSSPropertyKey.backgroundColor, color.toString());
  }

  // ── gradient ヘルパー ──

  setLinearGradient(direction: string, ...stops: string[]): this {
    return this.setProp(CSSPropertyKey.backgroundImage, `linear-gradient(${direction}, ${stops.join(', ')})`);
  }

  setRadialGradient(shape: string, ...stops: string[]): this {
    return this.setProp(CSSPropertyKey.backgroundImage, `radial-gradient(${shape}, ${stops.join(', ')})`);
  }
}
