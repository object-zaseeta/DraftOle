/**
 * Task 5.1: CSSTransform -- 変形・フィルタプロパティのテスト
 *
 * TDD RED phase: CSSTransform の全setter・render()・メソッドチェーンを検証する。
 * - collectProperties() -> render() 統一パターンに準拠
 * - 設定済みプロパティのみ出力、未設定は空文字列
 * - プロパティはキー名のアルファベット順ソート
 *
 * Requirements: 7.1, 7.2, 7.7
 */
import { describe, it, expect } from 'vitest';
import { CSSTransform } from '../../../../src/css/style/transform/css-transform.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSTransform {
  return new CSSTransform();
}

// ============================================================
// CSSTransform
// ============================================================

describe('CSSTransform', () => {
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

  // ── transform (Req 7.1) ──

  describe('transform', () => {
    it('translate() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('translate(50px, 100px)');
      expect(sut.render()).toBe('transform: translate(50px, 100px);');
    });

    it('translateX() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('translateX(50px)');
      expect(sut.render()).toBe('transform: translateX(50px);');
    });

    it('translateY() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('translateY(100px)');
      expect(sut.render()).toBe('transform: translateY(100px);');
    });

    it('rotate() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('rotate(45deg)');
      expect(sut.render()).toBe('transform: rotate(45deg);');
    });

    it('rotateX() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('rotateX(60deg)');
      expect(sut.render()).toBe('transform: rotateX(60deg);');
    });

    it('rotateY() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('rotateY(30deg)');
      expect(sut.render()).toBe('transform: rotateY(30deg);');
    });

    it('scale() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('scale(1.5)');
      expect(sut.render()).toBe('transform: scale(1.5);');
    });

    it('scale() にX,Y個別の値を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('scale(1.5, 2)');
      expect(sut.render()).toBe('transform: scale(1.5, 2);');
    });

    it('scaleX() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('scaleX(2)');
      expect(sut.render()).toBe('transform: scaleX(2);');
    });

    it('skew() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('skew(10deg, 20deg)');
      expect(sut.render()).toBe('transform: skew(10deg, 20deg);');
    });

    it('skewX() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('skewX(10deg)');
      expect(sut.render()).toBe('transform: skewX(10deg);');
    });

    it('skewY() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('skewY(20deg)');
      expect(sut.render()).toBe('transform: skewY(20deg);');
    });

    it('複合変形を設定できる（translate + rotate + scale）', () => {
      const sut = makeSUT();
      sut.setTransform('translate(50px, 100px) rotate(45deg) scale(1.5)');
      expect(sut.render()).toBe(
        'transform: translate(50px, 100px) rotate(45deg) scale(1.5);',
      );
    });

    it('matrix() を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('matrix(1, 0, 0, 1, 50, 100)');
      expect(sut.render()).toBe('transform: matrix(1, 0, 0, 1, 50, 100);');
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setTransform('none');
      expect(sut.render()).toBe('transform: none;');
    });
  });

  // ── transform-origin (Req 7.1) ──

  describe('transform-origin', () => {
    it('center を設定できる', () => {
      const sut = makeSUT();
      sut.setTransformOrigin('center');
      expect(sut.render()).toBe('transform-origin: center;');
    });

    it('top left を設定できる', () => {
      const sut = makeSUT();
      sut.setTransformOrigin('top left');
      expect(sut.render()).toBe('transform-origin: top left;');
    });

    it('bottom right を設定できる', () => {
      const sut = makeSUT();
      sut.setTransformOrigin('bottom right');
      expect(sut.render()).toBe('transform-origin: bottom right;');
    });

    it('パーセント値を設定できる（50% 50%）', () => {
      const sut = makeSUT();
      sut.setTransformOrigin('50% 50%');
      expect(sut.render()).toBe('transform-origin: 50% 50%;');
    });

    it('ピクセル値を設定できる', () => {
      const sut = makeSUT();
      sut.setTransformOrigin('100px 200px');
      expect(sut.render()).toBe('transform-origin: 100px 200px;');
    });

    it('3D値を設定できる（50% 50% 0）', () => {
      const sut = makeSUT();
      sut.setTransformOrigin('50% 50% 0');
      expect(sut.render()).toBe('transform-origin: 50% 50% 0;');
    });
  });

  // ── filter (Req 7.2) ──

  describe('filter', () => {
    it('blur() を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('blur(5px)');
      expect(sut.render()).toBe('filter: blur(5px);');
    });

    it('brightness() を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('brightness(150%)');
      expect(sut.render()).toBe('filter: brightness(150%);');
    });

    it('contrast() を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('contrast(200%)');
      expect(sut.render()).toBe('filter: contrast(200%);');
    });

    it('grayscale() を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('grayscale(100%)');
      expect(sut.render()).toBe('filter: grayscale(100%);');
    });

    it('sepia() を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('sepia(80%)');
      expect(sut.render()).toBe('filter: sepia(80%);');
    });

    it('saturate() を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('saturate(300%)');
      expect(sut.render()).toBe('filter: saturate(300%);');
    });

    it('hue-rotate() を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('hue-rotate(90deg)');
      expect(sut.render()).toBe('filter: hue-rotate(90deg);');
    });

    it('invert() を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('invert(100%)');
      expect(sut.render()).toBe('filter: invert(100%);');
    });

    it('drop-shadow() を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('drop-shadow(4px 4px 10px rgba(0,0,0,0.5))');
      expect(sut.render()).toBe(
        'filter: drop-shadow(4px 4px 10px rgba(0,0,0,0.5));',
      );
    });

    it('複合フィルタを設定できる（blur + brightness + contrast）', () => {
      const sut = makeSUT();
      sut.setFilter('blur(2px) brightness(120%) contrast(150%)');
      expect(sut.render()).toBe(
        'filter: blur(2px) brightness(120%) contrast(150%);',
      );
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setFilter('none');
      expect(sut.render()).toBe('filter: none;');
    });
  });

  // ── backdrop-filter (Req 7.2) ──

  describe('backdrop-filter', () => {
    it('blur() を設定できる', () => {
      const sut = makeSUT();
      sut.setBackdropFilter('blur(10px)');
      expect(sut.render()).toBe('backdrop-filter: blur(10px);');
    });

    it('brightness() を設定できる', () => {
      const sut = makeSUT();
      sut.setBackdropFilter('brightness(80%)');
      expect(sut.render()).toBe('backdrop-filter: brightness(80%);');
    });

    it('saturate() を設定できる', () => {
      const sut = makeSUT();
      sut.setBackdropFilter('saturate(200%)');
      expect(sut.render()).toBe('backdrop-filter: saturate(200%);');
    });

    it('複合を設定できる（blur + saturate）', () => {
      const sut = makeSUT();
      sut.setBackdropFilter('blur(10px) saturate(180%)');
      expect(sut.render()).toBe(
        'backdrop-filter: blur(10px) saturate(180%);',
      );
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setBackdropFilter('none');
      expect(sut.render()).toBe('backdrop-filter: none;');
    });
  });

  // ── perspective ──

  describe('perspective', () => {
    it('ピクセル値を設定できる', () => {
      const sut = makeSUT();
      sut.setPerspective('500px');
      expect(sut.render()).toBe('perspective: 500px;');
    });

    it('大きな値を設定できる', () => {
      const sut = makeSUT();
      sut.setPerspective('1000px');
      expect(sut.render()).toBe('perspective: 1000px;');
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setPerspective('none');
      expect(sut.render()).toBe('perspective: none;');
    });
  });

  // ── perspective-origin ──

  describe('perspective-origin', () => {
    it('center を設定できる', () => {
      const sut = makeSUT();
      sut.setPerspectiveOrigin('center');
      expect(sut.render()).toBe('perspective-origin: center;');
    });

    it('top left を設定できる', () => {
      const sut = makeSUT();
      sut.setPerspectiveOrigin('top left');
      expect(sut.render()).toBe('perspective-origin: top left;');
    });

    it('パーセント値を設定できる（25% 75%）', () => {
      const sut = makeSUT();
      sut.setPerspectiveOrigin('25% 75%');
      expect(sut.render()).toBe('perspective-origin: 25% 75%;');
    });

    it('bottom right を設定できる', () => {
      const sut = makeSUT();
      sut.setPerspectiveOrigin('bottom right');
      expect(sut.render()).toBe('perspective-origin: bottom right;');
    });
  });

  // ── メソッドチェーン（Fluent API） ──

  describe('メソッドチェーン', () => {
    it('setTransform が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTransform('rotate(45deg)');
      expect(result).toBe(sut);
    });

    it('setTransformOrigin が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTransformOrigin('center');
      expect(result).toBe(sut);
    });

    it('setFilter が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFilter('blur(5px)');
      expect(result).toBe(sut);
    });

    it('setBackdropFilter が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackdropFilter('blur(10px)');
      expect(result).toBe(sut);
    });

    it('setPerspective が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setPerspective('500px');
      expect(result).toBe(sut);
    });

    it('setPerspectiveOrigin が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setPerspectiveOrigin('center');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして一度に設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setTransform('rotate(45deg)')
        .setTransformOrigin('center')
        .setFilter('blur(5px)');
      expect(result).toBe(sut);
    });
  });

  // ── 複数プロパティのアルファベット順ソート ──

  describe('複数プロパティのアルファベット順ソート', () => {
    it('transform と transform-origin をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setTransformOrigin('center');
      sut.setTransform('rotate(45deg)');
      // transform < transform-origin (アルファベット順)
      expect(sut.render()).toBe(
        'transform: rotate(45deg);\ntransform-origin: center;',
      );
    });

    it('backdrop-filter, filter, transform をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setTransform('scale(1.5)');
      sut.setFilter('blur(5px)');
      sut.setBackdropFilter('blur(10px)');
      // backdrop-filter < filter < transform
      expect(sut.render()).toBe(
        'backdrop-filter: blur(10px);\nfilter: blur(5px);\ntransform: scale(1.5);',
      );
    });

    it('全6プロパティを設定した場合のアルファベット順出力', () => {
      const sut = makeSUT();
      sut
        .setPerspectiveOrigin('center')
        .setPerspective('500px')
        .setBackdropFilter('blur(10px)')
        .setFilter('brightness(150%)')
        .setTransformOrigin('top left')
        .setTransform('rotate(45deg) scale(1.2)');

      // アルファベット順:
      // backdrop-filter, filter, perspective, perspective-origin,
      // transform, transform-origin
      const expected = [
        'backdrop-filter: blur(10px);',
        'filter: brightness(150%);',
        'perspective: 500px;',
        'perspective-origin: center;',
        'transform: rotate(45deg) scale(1.2);',
        'transform-origin: top left;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── プロパティの組み合わせ ──

  describe('プロパティの組み合わせ', () => {
    it('transform + transform-origin の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setTransform('rotate(45deg) scale(1.5)')
        .setTransformOrigin('top left');

      // transform < transform-origin
      const expected = [
        'transform: rotate(45deg) scale(1.5);',
        'transform-origin: top left;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('filter + backdrop-filter の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setFilter('blur(5px) brightness(120%)')
        .setBackdropFilter('blur(10px) saturate(200%)');

      // backdrop-filter < filter
      const expected = [
        'backdrop-filter: blur(10px) saturate(200%);',
        'filter: blur(5px) brightness(120%);',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('perspective + perspective-origin の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setPerspective('800px')
        .setPerspectiveOrigin('25% 75%');

      // perspective < perspective-origin
      const expected = [
        'perspective: 800px;',
        'perspective-origin: 25% 75%;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('transform + filter + perspective の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setTransform('translate(50px, 100px)')
        .setFilter('blur(2px)')
        .setPerspective('600px');

      // filter < perspective < transform
      const expected = [
        'filter: blur(2px);',
        'perspective: 600px;',
        'transform: translate(50px, 100px);',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── プロパティの上書き ──

  describe('プロパティの上書き', () => {
    it('同じプロパティを再設定すると上書きされる', () => {
      const sut = makeSUT();
      sut.setTransform('rotate(30deg)');
      sut.setTransform('rotate(90deg)');
      expect(sut.render()).toBe('transform: rotate(90deg);');
    });

    it('filter を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setFilter('blur(5px)');
      sut.setFilter('brightness(150%)');
      sut.setFilter('contrast(200%)');
      expect(sut.render()).toBe('filter: contrast(200%);');
    });

    it('transform-origin を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setTransformOrigin('center');
      sut.setTransformOrigin('top left');
      expect(sut.render()).toBe('transform-origin: top left;');
    });
  });

  // ── render() の安定性 ──

  describe('render()の安定性', () => {
    it('render() を複数回呼んでも同じ結果を返す', () => {
      const sut = makeSUT();
      sut.setTransform('rotate(45deg)').setFilter('blur(5px)');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('単一プロパティの末尾にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setTransform('rotate(45deg)');
      expect(sut.render()).toMatch(/;$/);
    });

    it('複数プロパティは改行+セミコロンで区切られ、最後にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setTransform('rotate(45deg)').setFilter('blur(5px)');
      const output = sut.render();
      expect(output).toContain(';\n');
      expect(output).toMatch(/;$/);
    });

    it('プロパティ名と値の間にコロンとスペースがある', () => {
      const sut = makeSUT();
      sut.setTransform('rotate(45deg)');
      expect(sut.render()).toMatch(/^[a-z-]+: .+;$/);
    });
  });
});
