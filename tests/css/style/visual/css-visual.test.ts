/**
 * Task 5.2: CSSVisual -- 視覚効果プロパティのテスト
 *
 * TDD RED phase: CSSVisual の全setter・render()・メソッドチェーンを検証する。
 * - collectProperties() → render() 統一パターンに準拠
 * - 設定済みプロパティのみ出力、未設定は空文字列
 * - プロパティはキー名のアルファベット順ソート
 *
 * Requirements: 7.3, 7.7
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSVisual } from '../../../../src/css/style/visual/css-visual.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSVisual {
  return new CSSVisual();
}

// ============================================================
// CSSVisual
// ============================================================

describe('CSSVisual', () => {
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

  // ── box-shadow (Req 7.3) ──

  describe('box-shadow', () => {
    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setBoxShadow('none');
      expect(sut.render()).toBe('box-shadow: none;');
    });

    it('単一の影を設定できる', () => {
      const sut = makeSUT();
      sut.setBoxShadow('2px 2px 4px rgba(0,0,0,0.5)');
      expect(sut.render()).toBe('box-shadow: 2px 2px 4px rgba(0,0,0,0.5);');
    });

    it('複数の影を設定できる', () => {
      const sut = makeSUT();
      sut.setBoxShadow('2px 2px 4px black, -2px -2px 4px gray');
      expect(sut.render()).toBe(
        'box-shadow: 2px 2px 4px black, -2px -2px 4px gray;',
      );
    });

    it('inset 影を設定できる', () => {
      const sut = makeSUT();
      sut.setBoxShadow('inset 0 0 10px rgba(0,0,0,0.3)');
      expect(sut.render()).toBe(
        'box-shadow: inset 0 0 10px rgba(0,0,0,0.3);',
      );
    });
  });

  // ── opacity (Req 7.3) ──

  describe('opacity', () => {
    it('0 を設定できる', () => {
      const sut = makeSUT();
      sut.setOpacity('0');
      expect(sut.render()).toBe('opacity: 0;');
    });

    it('0.5 を設定できる', () => {
      const sut = makeSUT();
      sut.setOpacity('0.5');
      expect(sut.render()).toBe('opacity: 0.5;');
    });

    it('1 を設定できる', () => {
      const sut = makeSUT();
      sut.setOpacity('1');
      expect(sut.render()).toBe('opacity: 1;');
    });

    it('小数値を設定できる', () => {
      const sut = makeSUT();
      sut.setOpacity('0.75');
      expect(sut.render()).toBe('opacity: 0.75;');
    });
  });

  // ── cursor (Req 7.3) ──

  describe('cursor', () => {
    it('pointer を設定できる', () => {
      const sut = makeSUT();
      sut.setCursor('pointer');
      expect(sut.render()).toBe('cursor: pointer;');
    });

    it('default を設定できる', () => {
      const sut = makeSUT();
      sut.setCursor('default');
      expect(sut.render()).toBe('cursor: default;');
    });

    it('move を設定できる', () => {
      const sut = makeSUT();
      sut.setCursor('move');
      expect(sut.render()).toBe('cursor: move;');
    });

    it('text を設定できる', () => {
      const sut = makeSUT();
      sut.setCursor('text');
      expect(sut.render()).toBe('cursor: text;');
    });

    it('crosshair を設定できる', () => {
      const sut = makeSUT();
      sut.setCursor('crosshair');
      expect(sut.render()).toBe('cursor: crosshair;');
    });

    it('not-allowed を設定できる', () => {
      const sut = makeSUT();
      sut.setCursor('not-allowed');
      expect(sut.render()).toBe('cursor: not-allowed;');
    });
  });

  // ── overflow (Req 7.3) ──

  describe('overflow', () => {
    it('visible を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflow('visible');
      expect(sut.render()).toBe('overflow: visible;');
    });

    it('hidden を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflow('hidden');
      expect(sut.render()).toBe('overflow: hidden;');
    });

    it('scroll を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflow('scroll');
      expect(sut.render()).toBe('overflow: scroll;');
    });

    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflow('auto');
      expect(sut.render()).toBe('overflow: auto;');
    });
  });

  // ── overflow-x (Req 7.3) ──

  describe('overflow-x', () => {
    it('visible を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowX('visible');
      expect(sut.render()).toBe('overflow-x: visible;');
    });

    it('hidden を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowX('hidden');
      expect(sut.render()).toBe('overflow-x: hidden;');
    });

    it('scroll を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowX('scroll');
      expect(sut.render()).toBe('overflow-x: scroll;');
    });

    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowX('auto');
      expect(sut.render()).toBe('overflow-x: auto;');
    });
  });

  // ── overflow-y (Req 7.3) ──

  describe('overflow-y', () => {
    it('visible を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowY('visible');
      expect(sut.render()).toBe('overflow-y: visible;');
    });

    it('hidden を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowY('hidden');
      expect(sut.render()).toBe('overflow-y: hidden;');
    });

    it('scroll を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowY('scroll');
      expect(sut.render()).toBe('overflow-y: scroll;');
    });

    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowY('auto');
      expect(sut.render()).toBe('overflow-y: auto;');
    });
  });

  // ── メソッドチェーン（Fluent API） ──

  describe('メソッドチェーン', () => {
    it('setBoxShadow が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBoxShadow('none');
      expect(result).toBe(sut);
    });

    it('setOpacity が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setOpacity('1');
      expect(result).toBe(sut);
    });

    it('setCursor が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setCursor('pointer');
      expect(result).toBe(sut);
    });

    it('setOverflow が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setOverflow('hidden');
      expect(result).toBe(sut);
    });

    it('setOverflowX が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setOverflowX('auto');
      expect(result).toBe(sut);
    });

    it('setOverflowY が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setOverflowY('scroll');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして一度に設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setBoxShadow('2px 2px 4px black')
        .setOpacity('0.8')
        .setCursor('pointer')
        .setOverflow('hidden');
      expect(result).toBe(sut);
    });
  });

  // ── 複数プロパティのアルファベット順ソート ──

  describe('複数プロパティのアルファベット順ソート', () => {
    it('opacity と box-shadow をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setOpacity('0.5');
      sut.setBoxShadow('1px 1px 2px black');
      // box-shadow < opacity (アルファベット順)
      expect(sut.render()).toBe(
        'box-shadow: 1px 1px 2px black;\nopacity: 0.5;',
      );
    });

    it('cursor, opacity, overflow をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setOverflow('hidden');
      sut.setCursor('pointer');
      sut.setOpacity('1');
      // cursor < opacity < overflow
      expect(sut.render()).toBe(
        'cursor: pointer;\nopacity: 1;\noverflow: hidden;',
      );
    });

    it('全6プロパティを設定した場合のアルファベット順出力', () => {
      const sut = makeSUT();
      sut
        .setOverflowY('auto')
        .setOverflowX('hidden')
        .setOverflow('scroll')
        .setCursor('pointer')
        .setOpacity('0.9')
        .setBoxShadow('0 2px 4px rgba(0,0,0,0.1)');

      // アルファベット順:
      // box-shadow, cursor, opacity, overflow, overflow-x, overflow-y
      const expected = [
        'box-shadow: 0 2px 4px rgba(0,0,0,0.1);',
        'cursor: pointer;',
        'opacity: 0.9;',
        'overflow: scroll;',
        'overflow-x: hidden;',
        'overflow-y: auto;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── プロパティの組み合わせ ──

  describe('プロパティの組み合わせ', () => {
    it('box-shadow と opacity の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setBoxShadow('0 4px 6px rgba(0,0,0,0.1)')
        .setOpacity('0.95');

      // box-shadow < opacity
      const expected = [
        'box-shadow: 0 4px 6px rgba(0,0,0,0.1);',
        'opacity: 0.95;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('overflow 関連プロパティの組み合わせ（overflow, overflow-x, overflow-y）', () => {
      const sut = makeSUT();
      sut
        .setOverflow('hidden')
        .setOverflowX('scroll')
        .setOverflowY('auto');

      // overflow < overflow-x < overflow-y
      const expected = [
        'overflow: hidden;',
        'overflow-x: scroll;',
        'overflow-y: auto;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('cursor と overflow の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setCursor('not-allowed')
        .setOverflow('auto');

      // cursor < overflow
      const expected = [
        'cursor: not-allowed;',
        'overflow: auto;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── プロパティの上書き ──

  describe('プロパティの上書き', () => {
    const savedDev = process.env.DRAFT_OLE_DEV;
    beforeEach(() => { delete process.env.DRAFT_OLE_DEV; });
    afterEach(() => {
      if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
      else process.env.DRAFT_OLE_DEV = savedDev;
    });

    it('同じプロパティを再設定すると上書きされる', () => {
      const sut = makeSUT();
      sut.setBoxShadow('1px 1px 2px black');
      sut.setBoxShadow('none');
      expect(sut.render()).toBe('box-shadow: none;');
    });

    it('opacity を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setOpacity('0');
      sut.setOpacity('0.5');
      sut.setOpacity('1');
      expect(sut.render()).toBe('opacity: 1;');
    });

    it('cursor を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setCursor('default');
      sut.setCursor('pointer');
      expect(sut.render()).toBe('cursor: pointer;');
    });
  });

  // ── render() の安定性 ──

  describe('render()の安定性', () => {
    it('render() を複数回呼んでも同じ結果を返す', () => {
      const sut = makeSUT();
      sut.setBoxShadow('2px 2px 4px black').setOpacity('0.5');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('単一プロパティの末尾にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setOpacity('1');
      expect(sut.render()).toMatch(/;$/);
    });

    it('複数プロパティは改行+セミコロンで区切られ、最後にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setBoxShadow('none').setCursor('pointer');
      const output = sut.render();
      expect(output).toContain(';\n');
      expect(output).toMatch(/;$/);
    });

    it('プロパティ名と値の間にコロンとスペースがある', () => {
      const sut = makeSUT();
      sut.setOpacity('0.5');
      expect(sut.render()).toMatch(/^[a-z-]+: .+;$/);
    });
  });
});
