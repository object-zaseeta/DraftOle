/**
 * Task 4.2: CSSAnimation -- アニメーション・トランジションプロパティ
 *
 * collectProperties() → render() 統一パターンに準拠。
 * 14のAnimation/Transition関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 6.2, 6.3, 6.5
 */
import type { Renderable } from '../../../utils/renderable.js';
import { CSSPropertyKey } from '../style-keys.js';
import { renderCssProperties } from '../../utils/css-sanitizer.js';
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';

/**
 * アニメーション・トランジションプロパティを管理するクラス
 *
 * アニメーション系: animation-name, animation-duration, animation-timing-function,
 *   animation-delay, animation-iteration-count, animation-direction,
 *   animation-fill-mode, animation-play-state, animation
 * トランジション系: transition-property, transition-duration,
 *   transition-timing-function, transition-delay, transition
 */
export class CSSAnimation implements Renderable {
  // ── アニメーションプロパティ ──
  private _animationName?: string;
  private _animationDuration?: string;
  private _animationTimingFunction?: string;
  private _animationDelay?: string;
  private _animationIterationCount?: string;
  private _animationDirection?: string;
  private _animationFillMode?: string;
  private _animationPlayState?: string;
  private _animation?: string;

  // ── トランジションプロパティ ──
  private _transitionProperty?: string;
  private _transitionDuration?: string;
  private _transitionTimingFunction?: string;
  private _transitionDelay?: string;
  private _transition?: string;

  // ── Fluent Setters: アニメーション系 ──

  /** animation-name を設定する */
  setAnimationName(value: string): this {
    guardDuplicateCssProperty(this._animationName, 'animation-name');
    this._animationName = value;
    return this;
  }

  /** animation-duration を設定する */
  setAnimationDuration(value: string): this {
    guardDuplicateCssProperty(this._animationDuration, 'animation-duration');
    this._animationDuration = value;
    return this;
  }

  /** animation-timing-function を設定する */
  setAnimationTimingFunction(value: string): this {
    guardDuplicateCssProperty(this._animationTimingFunction, 'animation-timing-function');
    this._animationTimingFunction = value;
    return this;
  }

  /** animation-delay を設定する */
  setAnimationDelay(value: string): this {
    guardDuplicateCssProperty(this._animationDelay, 'animation-delay');
    this._animationDelay = value;
    return this;
  }

  /** animation-iteration-count を設定する */
  setAnimationIterationCount(value: string): this {
    guardDuplicateCssProperty(this._animationIterationCount, 'animation-iteration-count');
    this._animationIterationCount = value;
    return this;
  }

  /** animation-direction を設定する */
  setAnimationDirection(value: string): this {
    guardDuplicateCssProperty(this._animationDirection, 'animation-direction');
    this._animationDirection = value;
    return this;
  }

  /** animation-fill-mode を設定する */
  setAnimationFillMode(value: string): this {
    guardDuplicateCssProperty(this._animationFillMode, 'animation-fill-mode');
    this._animationFillMode = value;
    return this;
  }

  /** animation-play-state を設定する */
  setAnimationPlayState(value: string): this {
    guardDuplicateCssProperty(this._animationPlayState, 'animation-play-state');
    this._animationPlayState = value;
    return this;
  }

  /** animation ショートハンドを設定する */
  setAnimation(value: string): this {
    guardDuplicateCssProperty(this._animation, 'animation');
    this._animation = value;
    return this;
  }

  // ── Fluent Setters: トランジション系 ──

  /** transition-property を設定する */
  setTransitionProperty(value: string): this {
    guardDuplicateCssProperty(this._transitionProperty, 'transition-property');
    this._transitionProperty = value;
    return this;
  }

  /** transition-duration を設定する */
  setTransitionDuration(value: string): this {
    guardDuplicateCssProperty(this._transitionDuration, 'transition-duration');
    this._transitionDuration = value;
    return this;
  }

  /** transition-timing-function を設定する */
  setTransitionTimingFunction(value: string): this {
    guardDuplicateCssProperty(this._transitionTimingFunction, 'transition-timing-function');
    this._transitionTimingFunction = value;
    return this;
  }

  /** transition-delay を設定する */
  setTransitionDelay(value: string): this {
    guardDuplicateCssProperty(this._transitionDelay, 'transition-delay');
    this._transitionDelay = value;
    return this;
  }

  /** transition ショートハンドを設定する */
  setTransition(value: string): this {
    guardDuplicateCssProperty(this._transition, 'transition');
    this._transition = value;
    return this;
  }

  // ── collectProperties() → render() 統一パターン ──

  /**
   * 設定済みプロパティを Map に収集する
   * キーはハイフネーションされたCSS標準プロパティ名
   */
  private collectProperties(): Map<string, string> {
    const properties = new Map<string, string>();

    if (this._animationName !== undefined) {
      properties.set(CSSPropertyKey.animationName, this._animationName);
    }
    if (this._animationDuration !== undefined) {
      properties.set(
        CSSPropertyKey.animationDuration,
        this._animationDuration,
      );
    }
    if (this._animationTimingFunction !== undefined) {
      properties.set(
        CSSPropertyKey.animationTimingFunction,
        this._animationTimingFunction,
      );
    }
    if (this._animationDelay !== undefined) {
      properties.set(CSSPropertyKey.animationDelay, this._animationDelay);
    }
    if (this._animationIterationCount !== undefined) {
      properties.set(
        CSSPropertyKey.animationIterationCount,
        this._animationIterationCount,
      );
    }
    if (this._animationDirection !== undefined) {
      properties.set(
        CSSPropertyKey.animationDirection,
        this._animationDirection,
      );
    }
    if (this._animationFillMode !== undefined) {
      properties.set(
        CSSPropertyKey.animationFillMode,
        this._animationFillMode,
      );
    }
    if (this._animationPlayState !== undefined) {
      properties.set(
        CSSPropertyKey.animationPlayState,
        this._animationPlayState,
      );
    }
    if (this._animation !== undefined) {
      properties.set(CSSPropertyKey.animation, this._animation);
    }
    if (this._transitionProperty !== undefined) {
      properties.set(
        CSSPropertyKey.transitionProperty,
        this._transitionProperty,
      );
    }
    if (this._transitionDuration !== undefined) {
      properties.set(
        CSSPropertyKey.transitionDuration,
        this._transitionDuration,
      );
    }
    if (this._transitionTimingFunction !== undefined) {
      properties.set(
        CSSPropertyKey.transitionTimingFunction,
        this._transitionTimingFunction,
      );
    }
    if (this._transitionDelay !== undefined) {
      properties.set(CSSPropertyKey.transitionDelay, this._transitionDelay);
    }
    if (this._transition !== undefined) {
      properties.set(CSSPropertyKey.transition, this._transition);
    }

    return properties;
  }

  /**
   * 設定済みプロパティをCSS文字列としてレンダリングする
   *
   * - 未設定の場合は空文字列を返す
   * - プロパティはキー名のアルファベット順にソートされる
   * - フォーマット: `key: value;\nkey: value;`
   */
  render(): string {
    return renderCssProperties(this.collectProperties());
  }
}
