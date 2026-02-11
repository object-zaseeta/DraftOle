/**
 * Task 4.2: CSSAnimation -- アニメーション・トランジションプロパティのテスト
 *
 * TDD RED phase: CSSAnimation の全setter・render()・メソッドチェーンを検証する。
 * - collectProperties() → render() 統一パターンに準拠
 * - 設定済みプロパティのみ出力、未設定は空文字列
 * - プロパティはキー名のアルファベット順ソート
 *
 * Requirements: 6.2, 6.3, 6.5
 */
import { describe, it, expect } from 'vitest';
import { CSSAnimation } from '../../../../src/css/style/animation/css-animation.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSAnimation {
  return new CSSAnimation();
}

// ============================================================
// CSSAnimation
// ============================================================

describe('CSSAnimation', () => {
  // ── 空出力テスト ──

  describe('空出力', () => {
    it('プロパティ未設定の場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });
  });

  // ── Renderable 準拠 ──

  describe('Renderable準拠', () => {
    it('render() メソッドが存在する', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });
  });

  // ── animation-name (Req 6.2) ──

  describe('animation-name', () => {
    it('キーフレーム名を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationName('fadeIn');
      expect(sut.render()).toBe('animation-name: fadeIn;');
    });

    it('複数アニメーション名を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationName('fadeIn, slideUp');
      expect(sut.render()).toBe('animation-name: fadeIn, slideUp;');
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationName('none');
      expect(sut.render()).toBe('animation-name: none;');
    });
  });

  // ── animation-duration (Req 6.2) ──

  describe('animation-duration', () => {
    it('秒単位を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDuration('1s');
      expect(sut.render()).toBe('animation-duration: 1s;');
    });

    it('ミリ秒単位を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDuration('300ms');
      expect(sut.render()).toBe('animation-duration: 300ms;');
    });

    it('0s を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDuration('0s');
      expect(sut.render()).toBe('animation-duration: 0s;');
    });
  });

  // ── animation-timing-function (Req 6.2) ──

  describe('animation-timing-function', () => {
    it('ease を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationTimingFunction('ease');
      expect(sut.render()).toBe('animation-timing-function: ease;');
    });

    it('linear を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationTimingFunction('linear');
      expect(sut.render()).toBe('animation-timing-function: linear;');
    });

    it('ease-in-out を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationTimingFunction('ease-in-out');
      expect(sut.render()).toBe('animation-timing-function: ease-in-out;');
    });

    it('cubic-bezier 関数を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationTimingFunction('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(sut.render()).toBe(
        'animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);',
      );
    });
  });

  // ── animation-delay (Req 6.2) ──

  describe('animation-delay', () => {
    it('秒単位の遅延を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDelay('0.5s');
      expect(sut.render()).toBe('animation-delay: 0.5s;');
    });

    it('ミリ秒単位の遅延を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDelay('200ms');
      expect(sut.render()).toBe('animation-delay: 200ms;');
    });

    it('負の値を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDelay('-1s');
      expect(sut.render()).toBe('animation-delay: -1s;');
    });
  });

  // ── animation-iteration-count (Req 6.2) ──

  describe('animation-iteration-count', () => {
    it('infinite を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationIterationCount('infinite');
      expect(sut.render()).toBe('animation-iteration-count: infinite;');
    });

    it('数値を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationIterationCount('3');
      expect(sut.render()).toBe('animation-iteration-count: 3;');
    });

    it('小数値を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationIterationCount('2.5');
      expect(sut.render()).toBe('animation-iteration-count: 2.5;');
    });
  });

  // ── animation-direction (Req 6.2) ──

  describe('animation-direction', () => {
    it('normal を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDirection('normal');
      expect(sut.render()).toBe('animation-direction: normal;');
    });

    it('reverse を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDirection('reverse');
      expect(sut.render()).toBe('animation-direction: reverse;');
    });

    it('alternate を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDirection('alternate');
      expect(sut.render()).toBe('animation-direction: alternate;');
    });

    it('alternate-reverse を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationDirection('alternate-reverse');
      expect(sut.render()).toBe('animation-direction: alternate-reverse;');
    });
  });

  // ── animation-fill-mode (Req 6.2) ──

  describe('animation-fill-mode', () => {
    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationFillMode('none');
      expect(sut.render()).toBe('animation-fill-mode: none;');
    });

    it('forwards を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationFillMode('forwards');
      expect(sut.render()).toBe('animation-fill-mode: forwards;');
    });

    it('backwards を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationFillMode('backwards');
      expect(sut.render()).toBe('animation-fill-mode: backwards;');
    });

    it('both を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationFillMode('both');
      expect(sut.render()).toBe('animation-fill-mode: both;');
    });
  });

  // ── animation-play-state (Req 6.2) ──

  describe('animation-play-state', () => {
    it('running を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationPlayState('running');
      expect(sut.render()).toBe('animation-play-state: running;');
    });

    it('paused を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimationPlayState('paused');
      expect(sut.render()).toBe('animation-play-state: paused;');
    });
  });

  // ── animation ショートハンド (Req 6.2) ──

  describe('animation (ショートハンド)', () => {
    it('ショートハンド値を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimation('fadeIn 1s ease-in-out 0.5s infinite alternate both');
      expect(sut.render()).toBe(
        'animation: fadeIn 1s ease-in-out 0.5s infinite alternate both;',
      );
    });

    it('シンプルなショートハンドを設定できる', () => {
      const sut = makeSUT();
      sut.setAnimation('slideUp 0.3s ease');
      expect(sut.render()).toBe('animation: slideUp 0.3s ease;');
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setAnimation('none');
      expect(sut.render()).toBe('animation: none;');
    });
  });

  // ── transition-property (Req 6.3) ──

  describe('transition-property', () => {
    it('all を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionProperty('all');
      expect(sut.render()).toBe('transition-property: all;');
    });

    it('特定プロパティを設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionProperty('opacity');
      expect(sut.render()).toBe('transition-property: opacity;');
    });

    it('複数プロパティを設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionProperty('opacity, transform, background-color');
      expect(sut.render()).toBe(
        'transition-property: opacity, transform, background-color;',
      );
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionProperty('none');
      expect(sut.render()).toBe('transition-property: none;');
    });
  });

  // ── transition-duration (Req 6.3) ──

  describe('transition-duration', () => {
    it('秒単位を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionDuration('0.3s');
      expect(sut.render()).toBe('transition-duration: 0.3s;');
    });

    it('ミリ秒単位を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionDuration('300ms');
      expect(sut.render()).toBe('transition-duration: 300ms;');
    });

    it('0s を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionDuration('0s');
      expect(sut.render()).toBe('transition-duration: 0s;');
    });
  });

  // ── transition-timing-function (Req 6.3) ──

  describe('transition-timing-function', () => {
    it('ease を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionTimingFunction('ease');
      expect(sut.render()).toBe('transition-timing-function: ease;');
    });

    it('linear を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionTimingFunction('linear');
      expect(sut.render()).toBe('transition-timing-function: linear;');
    });

    it('cubic-bezier 関数を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionTimingFunction('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(sut.render()).toBe(
        'transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);',
      );
    });

    it('steps 関数を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionTimingFunction('steps(4, end)');
      expect(sut.render()).toBe('transition-timing-function: steps(4, end);');
    });
  });

  // ── transition-delay (Req 6.3) ──

  describe('transition-delay', () => {
    it('秒単位の遅延を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionDelay('0.5s');
      expect(sut.render()).toBe('transition-delay: 0.5s;');
    });

    it('ミリ秒単位の遅延を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionDelay('100ms');
      expect(sut.render()).toBe('transition-delay: 100ms;');
    });

    it('0s を設定できる', () => {
      const sut = makeSUT();
      sut.setTransitionDelay('0s');
      expect(sut.render()).toBe('transition-delay: 0s;');
    });
  });

  // ── transition ショートハンド (Req 6.3) ──

  describe('transition (ショートハンド)', () => {
    it('ショートハンド値を設定できる', () => {
      const sut = makeSUT();
      sut.setTransition('opacity 0.3s ease-in-out');
      expect(sut.render()).toBe('transition: opacity 0.3s ease-in-out;');
    });

    it('複数トランジションを設定できる', () => {
      const sut = makeSUT();
      sut.setTransition('opacity 0.3s ease, transform 0.5s linear');
      expect(sut.render()).toBe(
        'transition: opacity 0.3s ease, transform 0.5s linear;',
      );
    });

    it('all を設定できる', () => {
      const sut = makeSUT();
      sut.setTransition('all 0.2s ease');
      expect(sut.render()).toBe('transition: all 0.2s ease;');
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setTransition('none');
      expect(sut.render()).toBe('transition: none;');
    });
  });

  // ── メソッドチェーン（Fluent API） ──

  describe('メソッドチェーン', () => {
    it('setAnimationName が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAnimationName('fadeIn');
      expect(result).toBe(sut);
    });

    it('setAnimationDuration が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAnimationDuration('1s');
      expect(result).toBe(sut);
    });

    it('setAnimationTimingFunction が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAnimationTimingFunction('ease');
      expect(result).toBe(sut);
    });

    it('setAnimationDelay が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAnimationDelay('0.5s');
      expect(result).toBe(sut);
    });

    it('setAnimationIterationCount が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAnimationIterationCount('infinite');
      expect(result).toBe(sut);
    });

    it('setAnimationDirection が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAnimationDirection('alternate');
      expect(result).toBe(sut);
    });

    it('setAnimationFillMode が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAnimationFillMode('both');
      expect(result).toBe(sut);
    });

    it('setAnimationPlayState が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAnimationPlayState('running');
      expect(result).toBe(sut);
    });

    it('setAnimation が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAnimation('fadeIn 1s ease');
      expect(result).toBe(sut);
    });

    it('setTransitionProperty が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTransitionProperty('all');
      expect(result).toBe(sut);
    });

    it('setTransitionDuration が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTransitionDuration('0.3s');
      expect(result).toBe(sut);
    });

    it('setTransitionTimingFunction が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTransitionTimingFunction('ease');
      expect(result).toBe(sut);
    });

    it('setTransitionDelay が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTransitionDelay('0.5s');
      expect(result).toBe(sut);
    });

    it('setTransition が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTransition('all 0.3s ease');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして一度に設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setAnimationName('fadeIn')
        .setAnimationDuration('1s')
        .setAnimationTimingFunction('ease');
      expect(result).toBe(sut);
    });
  });

  // ── 複数プロパティのアルファベット順ソート ──

  describe('複数プロパティのアルファベット順ソート', () => {
    it('animation-name と animation-duration をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setAnimationDuration('1s');
      sut.setAnimationName('fadeIn');
      // animation-duration < animation-name (アルファベット順)
      expect(sut.render()).toBe(
        'animation-duration: 1s;\nanimation-name: fadeIn;',
      );
    });

    it('animation系プロパティを逆順で設定してもアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setAnimationTimingFunction('ease');
      sut.setAnimationName('slideUp');
      sut.setAnimationDuration('0.5s');
      // animation-duration < animation-name < animation-timing-function
      expect(sut.render()).toBe(
        'animation-duration: 0.5s;\nanimation-name: slideUp;\nanimation-timing-function: ease;',
      );
    });

    it('transition系プロパティをアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setTransitionTimingFunction('ease');
      sut.setTransitionDuration('0.3s');
      sut.setTransitionProperty('opacity');
      // transition-duration < transition-property < transition-timing-function
      expect(sut.render()).toBe(
        'transition-duration: 0.3s;\ntransition-property: opacity;\ntransition-timing-function: ease;',
      );
    });

    it('animation系とtransition系を混在してアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setTransitionDuration('0.3s');
      sut.setAnimationName('fadeIn');
      sut.setAnimationDuration('1s');
      sut.setTransitionProperty('all');
      // animation-duration < animation-name < transition-duration < transition-property
      expect(sut.render()).toBe(
        'animation-duration: 1s;\nanimation-name: fadeIn;\ntransition-duration: 0.3s;\ntransition-property: all;',
      );
    });

    it('全14プロパティを設定した場合のアルファベット順出力', () => {
      const sut = makeSUT();
      sut
        .setTransition('all 0.3s ease')
        .setAnimationPlayState('running')
        .setTransitionDelay('0.1s')
        .setAnimationFillMode('both')
        .setTransitionTimingFunction('ease')
        .setAnimationDirection('alternate')
        .setTransitionDuration('0.3s')
        .setAnimationIterationCount('infinite')
        .setTransitionProperty('all')
        .setAnimationDelay('0.5s')
        .setAnimationTimingFunction('linear')
        .setAnimationDuration('1s')
        .setAnimationName('fadeIn')
        .setAnimation('fadeIn 1s ease');

      // アルファベット順:
      // animation, animation-delay, animation-direction, animation-duration,
      // animation-fill-mode, animation-iteration-count, animation-name,
      // animation-play-state, animation-timing-function,
      // transition, transition-delay, transition-duration,
      // transition-property, transition-timing-function
      const expected = [
        'animation: fadeIn 1s ease;',
        'animation-delay: 0.5s;',
        'animation-direction: alternate;',
        'animation-duration: 1s;',
        'animation-fill-mode: both;',
        'animation-iteration-count: infinite;',
        'animation-name: fadeIn;',
        'animation-play-state: running;',
        'animation-timing-function: linear;',
        'transition: all 0.3s ease;',
        'transition-delay: 0.1s;',
        'transition-duration: 0.3s;',
        'transition-property: all;',
        'transition-timing-function: ease;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── アニメーション定義の組み合わせ (Req 6.5) ──

  describe('アニメーション定義の組み合わせ', () => {
    it('基本的なアニメーション定義（name + duration + timing-function）', () => {
      const sut = makeSUT();
      sut
        .setAnimationName('fadeIn')
        .setAnimationDuration('1s')
        .setAnimationTimingFunction('ease-in-out');

      // animation-duration < animation-name < animation-timing-function
      const expected = [
        'animation-duration: 1s;',
        'animation-name: fadeIn;',
        'animation-timing-function: ease-in-out;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('完全なアニメーション定義（name + duration + timing + delay + count + direction + fill + play）', () => {
      const sut = makeSUT();
      sut
        .setAnimationName('bounce')
        .setAnimationDuration('2s')
        .setAnimationTimingFunction('ease')
        .setAnimationDelay('0.5s')
        .setAnimationIterationCount('infinite')
        .setAnimationDirection('alternate')
        .setAnimationFillMode('both')
        .setAnimationPlayState('running');

      const expected = [
        'animation-delay: 0.5s;',
        'animation-direction: alternate;',
        'animation-duration: 2s;',
        'animation-fill-mode: both;',
        'animation-iteration-count: infinite;',
        'animation-name: bounce;',
        'animation-play-state: running;',
        'animation-timing-function: ease;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── トランジション定義の組み合わせ (Req 6.5) ──

  describe('トランジション定義の組み合わせ', () => {
    it('基本的なトランジション定義（property + duration + timing-function）', () => {
      const sut = makeSUT();
      sut
        .setTransitionProperty('opacity')
        .setTransitionDuration('0.3s')
        .setTransitionTimingFunction('ease-in-out');

      // transition-duration < transition-property < transition-timing-function
      const expected = [
        'transition-duration: 0.3s;',
        'transition-property: opacity;',
        'transition-timing-function: ease-in-out;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('完全なトランジション定義（property + duration + timing + delay）', () => {
      const sut = makeSUT();
      sut
        .setTransitionProperty('all')
        .setTransitionDuration('0.5s')
        .setTransitionTimingFunction('cubic-bezier(0.4, 0, 0.2, 1)')
        .setTransitionDelay('0.1s');

      const expected = [
        'transition-delay: 0.1s;',
        'transition-duration: 0.5s;',
        'transition-property: all;',
        'transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── プロパティの上書き ──

  describe('プロパティの上書き', () => {
    it('同じプロパティを再設定すると上書きされる', () => {
      const sut = makeSUT();
      sut.setAnimationName('fadeIn');
      sut.setAnimationName('slideUp');
      expect(sut.render()).toBe('animation-name: slideUp;');
    });

    it('animation-duration を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setAnimationDuration('1s');
      sut.setAnimationDuration('2s');
      sut.setAnimationDuration('0.5s');
      expect(sut.render()).toBe('animation-duration: 0.5s;');
    });

    it('transition-property を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setTransitionProperty('opacity');
      sut.setTransitionProperty('all');
      expect(sut.render()).toBe('transition-property: all;');
    });
  });

  // ── render() の安定性 ──

  describe('render()の安定性', () => {
    it('render() を複数回呼んでも同じ結果を返す', () => {
      const sut = makeSUT();
      sut
        .setAnimationName('fadeIn')
        .setAnimationDuration('1s')
        .setTransitionProperty('opacity');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('単一プロパティの末尾にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setAnimationName('fadeIn');
      expect(sut.render()).toMatch(/;$/);
    });

    it('複数プロパティは改行+セミコロンで区切られ、最後にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setAnimationName('fadeIn').setAnimationDuration('1s');
      const output = sut.render();
      expect(output).toContain(';\n');
      expect(output).toMatch(/;$/);
    });

    it('プロパティ名と値の間にコロンとスペースがある', () => {
      const sut = makeSUT();
      sut.setAnimationName('fadeIn');
      expect(sut.render()).toMatch(/^[a-z-]+: .+;$/);
    });
  });
});
