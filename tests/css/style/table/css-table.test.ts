/**
 * Task 5.3: CSSTable -- テーブルレイアウトプロパティのテスト
 *
 * TDD RED phase: CSSTable の全setter・render()・メソッドチェーンを検証する。
 * - collectProperties() → render() 統一パターンに準拠
 * - 設定済みプロパティのみ出力、未設定は空文字列
 * - プロパティはキー名のアルファベット順ソート
 *
 * Requirements: 7.4, 7.7
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSTable } from '../../../../src/css/style/table/css-table.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSTable {
  return new CSSTable();
}

// ============================================================
// CSSTable
// ============================================================

describe('CSSTable', () => {
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

  // ── border-collapse (Req 7.4) ──

  describe('border-collapse', () => {
    it('collapse を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderCollapse('collapse');
      expect(sut.render()).toBe('border-collapse: collapse;');
    });

    it('separate を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderCollapse('separate');
      expect(sut.render()).toBe('border-collapse: separate;');
    });
  });

  // ── border-spacing (Req 7.4) ──

  describe('border-spacing', () => {
    it('単一値を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderSpacing('2px');
      expect(sut.render()).toBe('border-spacing: 2px;');
    });

    it('二値（水平・垂直）を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderSpacing('2px 4px');
      expect(sut.render()).toBe('border-spacing: 2px 4px;');
    });
  });

  // ── table-layout (Req 7.4) ──

  describe('table-layout', () => {
    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setTableLayout('auto');
      expect(sut.render()).toBe('table-layout: auto;');
    });

    it('fixed を設定できる', () => {
      const sut = makeSUT();
      sut.setTableLayout('fixed');
      expect(sut.render()).toBe('table-layout: fixed;');
    });
  });

  // ── caption-side (Req 7.4) ──

  describe('caption-side', () => {
    it('top を設定できる', () => {
      const sut = makeSUT();
      sut.setCaptionSide('top');
      expect(sut.render()).toBe('caption-side: top;');
    });

    it('bottom を設定できる', () => {
      const sut = makeSUT();
      sut.setCaptionSide('bottom');
      expect(sut.render()).toBe('caption-side: bottom;');
    });
  });

  // ── empty-cells (Req 7.4) ──

  describe('empty-cells', () => {
    it('show を設定できる', () => {
      const sut = makeSUT();
      sut.setEmptyCells('show');
      expect(sut.render()).toBe('empty-cells: show;');
    });

    it('hide を設定できる', () => {
      const sut = makeSUT();
      sut.setEmptyCells('hide');
      expect(sut.render()).toBe('empty-cells: hide;');
    });
  });

  // ── メソッドチェーン（Fluent API） ──

  describe('メソッドチェーン', () => {
    it('setBorderCollapse が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderCollapse('collapse');
      expect(result).toBe(sut);
    });

    it('setBorderSpacing が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderSpacing('2px');
      expect(result).toBe(sut);
    });

    it('setTableLayout が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTableLayout('auto');
      expect(result).toBe(sut);
    });

    it('setCaptionSide が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setCaptionSide('top');
      expect(result).toBe(sut);
    });

    it('setEmptyCells が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setEmptyCells('show');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして一度に設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setBorderCollapse('collapse')
        .setBorderSpacing('2px')
        .setTableLayout('fixed');
      expect(result).toBe(sut);
    });
  });

  // ── 複数プロパティのアルファベット順ソート ──

  describe('複数プロパティのアルファベット順ソート', () => {
    it('border-collapse と border-spacing をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setBorderSpacing('2px');
      sut.setBorderCollapse('collapse');
      // border-collapse < border-spacing (アルファベット順)
      expect(sut.render()).toBe(
        'border-collapse: collapse;\nborder-spacing: 2px;',
      );
    });

    it('border-collapse, table-layout, caption-side をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setTableLayout('fixed');
      sut.setCaptionSide('top');
      sut.setBorderCollapse('separate');
      // border-collapse < caption-side < table-layout
      expect(sut.render()).toBe(
        'border-collapse: separate;\ncaption-side: top;\ntable-layout: fixed;',
      );
    });

    it('全5プロパティを設定した場合のアルファベット順出力', () => {
      const sut = makeSUT();
      sut
        .setEmptyCells('show')
        .setTableLayout('fixed')
        .setCaptionSide('bottom')
        .setBorderSpacing('4px 8px')
        .setBorderCollapse('collapse');

      // アルファベット順:
      // border-collapse, border-spacing, caption-side, empty-cells, table-layout
      const expected = [
        'border-collapse: collapse;',
        'border-spacing: 4px 8px;',
        'caption-side: bottom;',
        'empty-cells: show;',
        'table-layout: fixed;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── プロパティの組み合わせ ──

  describe('プロパティの組み合わせ', () => {
    it('テーブル基本設定の組み合わせ（collapse + spacing + layout）', () => {
      const sut = makeSUT();
      sut
        .setBorderCollapse('collapse')
        .setBorderSpacing('0')
        .setTableLayout('fixed');

      // border-collapse < border-spacing < table-layout
      const expected = [
        'border-collapse: collapse;',
        'border-spacing: 0;',
        'table-layout: fixed;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('テーブル表示設定の組み合わせ（caption-side + empty-cells）', () => {
      const sut = makeSUT();
      sut
        .setCaptionSide('bottom')
        .setEmptyCells('hide');

      // caption-side < empty-cells
      const expected = [
        'caption-side: bottom;',
        'empty-cells: hide;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('collapse + caption-side + empty-cells の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setBorderCollapse('separate')
        .setCaptionSide('top')
        .setEmptyCells('show');

      // border-collapse < caption-side < empty-cells
      const expected = [
        'border-collapse: separate;',
        'caption-side: top;',
        'empty-cells: show;',
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
      sut.setBorderCollapse('collapse');
      sut.setBorderCollapse('separate');
      expect(sut.render()).toBe('border-collapse: separate;');
    });

    it('table-layout を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setTableLayout('auto');
      sut.setTableLayout('fixed');
      sut.setTableLayout('auto');
      expect(sut.render()).toBe('table-layout: auto;');
    });
  });

  // ── render() の安定性 ──

  describe('render()の安定性', () => {
    it('render() を複数回呼んでも同じ結果を返す', () => {
      const sut = makeSUT();
      sut.setBorderCollapse('collapse').setTableLayout('fixed');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('単一プロパティの末尾にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setBorderCollapse('collapse');
      expect(sut.render()).toMatch(/;$/);
    });

    it('複数プロパティは改行+セミコロンで区切られ、最後にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setBorderCollapse('collapse').setTableLayout('fixed');
      const output = sut.render();
      expect(output).toContain(';\n');
      expect(output).toMatch(/;$/);
    });

    it('プロパティ名と値の間にコロンとスペースがある', () => {
      const sut = makeSUT();
      sut.setBorderCollapse('collapse');
      expect(sut.render()).toMatch(/^[a-z-]+: .+;$/);
    });
  });
});
