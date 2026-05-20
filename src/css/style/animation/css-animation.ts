/**
 * Task 4.1: CSSAnimation -- アニメーション・トランジションプロパティ
 *
 * CSSPropertyGroup を継承し、共通の setProp/render パターンを利用する。
 * 14のAnimation/Transition関連CSSプロパティを型安全に管理し、
 * 設定済みプロパティのみをアルファベット順でCSS文字列として出力する。
 *
 * Requirements: 6.2, 6.3, 6.5
 */
import { CSSPropertyGroup } from '../css-property-group.js';
import { CSSPropertyKey } from '../style-keys.js';

/**
 * アニメーション・トランジションプロパティを管理するクラス
 *
 * アニメーション系: animation-name, animation-duration, animation-timing-function,
 *   animation-delay, animation-iteration-count, animation-direction,
 *   animation-fill-mode, animation-play-state, animation
 * トランジション系: transition-property, transition-duration,
 *   transition-timing-function, transition-delay, transition
 */
export class CSSAnimation extends CSSPropertyGroup {
  // ── Fluent Setters: アニメーション系 ──

  /** animation-name を設定する */
  setAnimationName(value: string): this {
    return this.setProp(CSSPropertyKey.animationName, value);
  }

  /** animation-duration を設定する */
  setAnimationDuration(value: string): this {
    return this.setProp(CSSPropertyKey.animationDuration, value);
  }

  /** animation-timing-function を設定する */
  setAnimationTimingFunction(value: string): this {
    return this.setProp(CSSPropertyKey.animationTimingFunction, value);
  }

  /** animation-delay を設定する */
  setAnimationDelay(value: string): this {
    return this.setProp(CSSPropertyKey.animationDelay, value);
  }

  /** animation-iteration-count を設定する */
  setAnimationIterationCount(value: string): this {
    return this.setProp(CSSPropertyKey.animationIterationCount, value);
  }

  /** animation-direction を設定する */
  setAnimationDirection(value: string): this {
    return this.setProp(CSSPropertyKey.animationDirection, value);
  }

  /** animation-fill-mode を設定する */
  setAnimationFillMode(value: string): this {
    return this.setProp(CSSPropertyKey.animationFillMode, value);
  }

  /** animation-play-state を設定する */
  setAnimationPlayState(value: string): this {
    return this.setProp(CSSPropertyKey.animationPlayState, value);
  }

  /** animation ショートハンドを設定する */
  setAnimation(value: string): this {
    return this.setProp(CSSPropertyKey.animation, value);
  }

  // ── Fluent Setters: トランジション系 ──

  /** transition-property を設定する */
  setTransitionProperty(value: string): this {
    return this.setProp(CSSPropertyKey.transitionProperty, value);
  }

  /** transition-duration を設定する */
  setTransitionDuration(value: string): this {
    return this.setProp(CSSPropertyKey.transitionDuration, value);
  }

  /** transition-timing-function を設定する */
  setTransitionTimingFunction(value: string): this {
    return this.setProp(CSSPropertyKey.transitionTimingFunction, value);
  }

  /** transition-delay を設定する */
  setTransitionDelay(value: string): this {
    return this.setProp(CSSPropertyKey.transitionDelay, value);
  }

  /** transition ショートハンドを設定する */
  setTransition(value: string): this {
    return this.setProp(CSSPropertyKey.transition, value);
  }
}
