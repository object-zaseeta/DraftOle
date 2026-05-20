/**
 * Task 2.3: CSSFlex -- Flexboxレイアウトプロパティのテスト
 *
 * TDD RED phase: CSSFlex の全setter・render()・メソッドチェーンを検証する。
 * - collectProperties() → render() 統一パターンに準拠
 * - 設定済みプロパティのみ出力、未設定は空文字列
 * - プロパティはキー名のアルファベット順ソート
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSFlex } from '../../../../src/css/style/flex/css-flex.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSFlex {
  return new CSSFlex();
}

// ============================================================
// CSSFlex
// ============================================================

describe('CSSFlex', () => {
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

  // ── flex-direction (Req 4.1) ──

  describe('flex-direction', () => {
    it('row を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexDirection('row');
      expect(sut.render()).toBe('flex-direction: row;');
    });

    it('column を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexDirection('column');
      expect(sut.render()).toBe('flex-direction: column;');
    });

    it('row-reverse を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexDirection('row-reverse');
      expect(sut.render()).toBe('flex-direction: row-reverse;');
    });

    it('column-reverse を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexDirection('column-reverse');
      expect(sut.render()).toBe('flex-direction: column-reverse;');
    });
  });

  // ── justify-content (Req 4.2) ──

  describe('justify-content', () => {
    it('flex-start を設定できる', () => {
      const sut = makeSUT();
      sut.setJustifyContent('flex-start');
      expect(sut.render()).toBe('justify-content: flex-start;');
    });

    it('center を設定できる', () => {
      const sut = makeSUT();
      sut.setJustifyContent('center');
      expect(sut.render()).toBe('justify-content: center;');
    });

    it('flex-end を設定できる', () => {
      const sut = makeSUT();
      sut.setJustifyContent('flex-end');
      expect(sut.render()).toBe('justify-content: flex-end;');
    });

    it('space-between を設定できる', () => {
      const sut = makeSUT();
      sut.setJustifyContent('space-between');
      expect(sut.render()).toBe('justify-content: space-between;');
    });

    it('space-around を設定できる', () => {
      const sut = makeSUT();
      sut.setJustifyContent('space-around');
      expect(sut.render()).toBe('justify-content: space-around;');
    });

    it('space-evenly を設定できる', () => {
      const sut = makeSUT();
      sut.setJustifyContent('space-evenly');
      expect(sut.render()).toBe('justify-content: space-evenly;');
    });
  });

  // ── align-items (Req 4.3) ──

  describe('align-items', () => {
    it('stretch を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignItems('stretch');
      expect(sut.render()).toBe('align-items: stretch;');
    });

    it('flex-start を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignItems('flex-start');
      expect(sut.render()).toBe('align-items: flex-start;');
    });

    it('center を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignItems('center');
      expect(sut.render()).toBe('align-items: center;');
    });

    it('flex-end を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignItems('flex-end');
      expect(sut.render()).toBe('align-items: flex-end;');
    });

    it('baseline を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignItems('baseline');
      expect(sut.render()).toBe('align-items: baseline;');
    });
  });

  // ── gap (Req 4.4) ──

  describe('gap', () => {
    it('gap を設定できる', () => {
      const sut = makeSUT();
      sut.setGap('10px');
      expect(sut.render()).toBe('gap: 10px;');
    });

    it('複合値（row-gap column-gap）を設定できる', () => {
      const sut = makeSUT();
      sut.setGap('10px 20px');
      expect(sut.render()).toBe('gap: 10px 20px;');
    });
  });

  // ── flex-wrap (Req 4.4) ──

  describe('flex-wrap', () => {
    it('nowrap を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexWrap('nowrap');
      expect(sut.render()).toBe('flex-wrap: nowrap;');
    });

    it('wrap を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexWrap('wrap');
      expect(sut.render()).toBe('flex-wrap: wrap;');
    });

    it('wrap-reverse を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexWrap('wrap-reverse');
      expect(sut.render()).toBe('flex-wrap: wrap-reverse;');
    });
  });

  // ── flex-grow (Req 4.4) ──

  describe('flex-grow', () => {
    it('flex-grow を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexGrow('1');
      expect(sut.render()).toBe('flex-grow: 1;');
    });

    it('0 を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexGrow('0');
      expect(sut.render()).toBe('flex-grow: 0;');
    });
  });

  // ── flex-shrink (Req 4.4) ──

  describe('flex-shrink', () => {
    it('flex-shrink を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexShrink('1');
      expect(sut.render()).toBe('flex-shrink: 1;');
    });

    it('0 を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexShrink('0');
      expect(sut.render()).toBe('flex-shrink: 0;');
    });
  });

  // ── flex-basis (Req 4.4) ──

  describe('flex-basis', () => {
    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexBasis('auto');
      expect(sut.render()).toBe('flex-basis: auto;');
    });

    it('ピクセル値を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexBasis('200px');
      expect(sut.render()).toBe('flex-basis: 200px;');
    });

    it('パーセント値を設定できる', () => {
      const sut = makeSUT();
      sut.setFlexBasis('50%');
      expect(sut.render()).toBe('flex-basis: 50%;');
    });
  });

  // ── align-self (Req 4.4) ──

  describe('align-self', () => {
    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignSelf('auto');
      expect(sut.render()).toBe('align-self: auto;');
    });

    it('center を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignSelf('center');
      expect(sut.render()).toBe('align-self: center;');
    });

    it('flex-start を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignSelf('flex-start');
      expect(sut.render()).toBe('align-self: flex-start;');
    });

    it('flex-end を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignSelf('flex-end');
      expect(sut.render()).toBe('align-self: flex-end;');
    });

    it('stretch を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignSelf('stretch');
      expect(sut.render()).toBe('align-self: stretch;');
    });

    it('baseline を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignSelf('baseline');
      expect(sut.render()).toBe('align-self: baseline;');
    });
  });

  // ── order (Req 4.4) ──

  describe('order', () => {
    it('正の値を設定できる', () => {
      const sut = makeSUT();
      sut.setOrder('1');
      expect(sut.render()).toBe('order: 1;');
    });

    it('0 を設定できる', () => {
      const sut = makeSUT();
      sut.setOrder('0');
      expect(sut.render()).toBe('order: 0;');
    });

    it('負の値を設定できる', () => {
      const sut = makeSUT();
      sut.setOrder('-1');
      expect(sut.render()).toBe('order: -1;');
    });
  });

  // ── align-content (Req 4.4) ──

  describe('align-content', () => {
    it('stretch を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignContent('stretch');
      expect(sut.render()).toBe('align-content: stretch;');
    });

    it('center を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignContent('center');
      expect(sut.render()).toBe('align-content: center;');
    });

    it('space-between を設定できる', () => {
      const sut = makeSUT();
      sut.setAlignContent('space-between');
      expect(sut.render()).toBe('align-content: space-between;');
    });
  });

  // ── メソッドチェーン（Fluent API） ──

  describe('メソッドチェーン', () => {
    it('setFlexDirection が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFlexDirection('row');
      expect(result).toBe(sut);
    });

    it('setJustifyContent が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setJustifyContent('center');
      expect(result).toBe(sut);
    });

    it('setAlignItems が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAlignItems('center');
      expect(result).toBe(sut);
    });

    it('setGap が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGap('10px');
      expect(result).toBe(sut);
    });

    it('setFlexWrap が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFlexWrap('wrap');
      expect(result).toBe(sut);
    });

    it('setFlexGrow が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFlexGrow('1');
      expect(result).toBe(sut);
    });

    it('setFlexShrink が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFlexShrink('1');
      expect(result).toBe(sut);
    });

    it('setFlexBasis が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFlexBasis('auto');
      expect(result).toBe(sut);
    });

    it('setAlignSelf が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAlignSelf('center');
      expect(result).toBe(sut);
    });

    it('setOrder が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setOrder('1');
      expect(result).toBe(sut);
    });

    it('setAlignContent が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setAlignContent('center');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして一度に設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setFlexDirection('row')
        .setJustifyContent('center')
        .setAlignItems('stretch');
      expect(result).toBe(sut);
    });
  });

  // ── 複数プロパティのアルファベット順ソート ──

  describe('複数プロパティのアルファベット順ソート', () => {
    it('flex-direction と justify-content をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setJustifyContent('center');
      sut.setFlexDirection('row');
      // flex-direction < justify-content (アルファベット順)
      expect(sut.render()).toBe(
        'flex-direction: row;\njustify-content: center;',
      );
    });

    it('align-items, flex-direction, justify-content をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setJustifyContent('space-between');
      sut.setAlignItems('center');
      sut.setFlexDirection('column');
      // align-items < flex-direction < justify-content
      expect(sut.render()).toBe(
        'align-items: center;\nflex-direction: column;\njustify-content: space-between;',
      );
    });

    it('全11プロパティを設定した場合のアルファベット順出力', () => {
      const sut = makeSUT();
      sut
        .setOrder('1')
        .setFlexBasis('auto')
        .setFlexShrink('0')
        .setFlexGrow('1')
        .setFlexWrap('wrap')
        .setGap('10px')
        .setAlignSelf('center')
        .setAlignContent('stretch')
        .setAlignItems('flex-start')
        .setJustifyContent('space-between')
        .setFlexDirection('row');

      // アルファベット順:
      // align-content, align-items, align-self, flex-basis, flex-direction,
      // flex-grow, flex-shrink, flex-wrap, gap, justify-content, order
      const expected = [
        'align-content: stretch;',
        'align-items: flex-start;',
        'align-self: center;',
        'flex-basis: auto;',
        'flex-direction: row;',
        'flex-grow: 1;',
        'flex-shrink: 0;',
        'flex-wrap: wrap;',
        'gap: 10px;',
        'justify-content: space-between;',
        'order: 1;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── コンテナプロパティとアイテムプロパティの組み合わせ ──

  describe('コンテナ+アイテムプロパティの組み合わせ', () => {
    it('コンテナプロパティ（direction, justify, align）の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setFlexDirection('row')
        .setJustifyContent('space-between')
        .setAlignItems('center')
        .setFlexWrap('wrap')
        .setGap('16px');

      // align-items < flex-direction < flex-wrap < gap < justify-content
      const expected = [
        'align-items: center;',
        'flex-direction: row;',
        'flex-wrap: wrap;',
        'gap: 16px;',
        'justify-content: space-between;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('アイテムプロパティ（grow, shrink, basis, self, order）の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setFlexGrow('1')
        .setFlexShrink('0')
        .setFlexBasis('200px')
        .setAlignSelf('flex-end')
        .setOrder('2');

      // align-self < flex-basis < flex-grow < flex-shrink < order
      const expected = [
        'align-self: flex-end;',
        'flex-basis: 200px;',
        'flex-grow: 1;',
        'flex-shrink: 0;',
        'order: 2;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('コンテナとアイテムプロパティの混在', () => {
      const sut = makeSUT();
      sut
        .setFlexDirection('column')
        .setJustifyContent('center')
        .setFlexGrow('1')
        .setAlignSelf('stretch');

      // align-self < flex-direction < flex-grow < justify-content
      const expected = [
        'align-self: stretch;',
        'flex-direction: column;',
        'flex-grow: 1;',
        'justify-content: center;',
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
      sut.setFlexDirection('row');
      sut.setFlexDirection('column');
      expect(sut.render()).toBe('flex-direction: column;');
    });

    it('justify-content を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setJustifyContent('flex-start');
      sut.setJustifyContent('center');
      sut.setJustifyContent('flex-end');
      expect(sut.render()).toBe('justify-content: flex-end;');
    });
  });

  // ── render() の安定性 ──

  describe('render()の安定性', () => {
    it('render() を複数回呼んでも同じ結果を返す', () => {
      const sut = makeSUT();
      sut.setFlexDirection('row').setJustifyContent('center');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('単一プロパティの末尾にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setFlexDirection('row');
      expect(sut.render()).toMatch(/;$/);
    });

    it('複数プロパティは改行+セミコロンで区切られ、最後にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setFlexDirection('row').setJustifyContent('center');
      const output = sut.render();
      expect(output).toContain(';\n');
      expect(output).toMatch(/;$/);
    });

    it('プロパティ名と値の間にコロンとスペースがある', () => {
      const sut = makeSUT();
      sut.setFlexDirection('row');
      expect(sut.render()).toMatch(/^[a-z-]+: .+;$/);
    });
  });
});
