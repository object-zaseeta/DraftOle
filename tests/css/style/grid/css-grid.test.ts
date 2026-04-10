/**
 * Task 4.1: CSSGrid -- グリッドレイアウトプロパティのテスト
 *
 * TDD RED phase: CSSGrid の全setter・render()・メソッドチェーンを検証する。
 * - collectProperties() → render() 統一パターンに準拠
 * - 設定済みプロパティのみ出力、未設定は空文字列
 * - プロパティはキー名のアルファベット順ソート
 *
 * Requirements: 6.1, 6.5
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSGrid } from '../../../../src/css/style/grid/css-grid.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSGrid {
  return new CSSGrid();
}

// ============================================================
// CSSGrid
// ============================================================

describe('CSSGrid', () => {
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

  // ── grid-template-columns (Req 6.1) ──

  describe('grid-template-columns', () => {
    it('固定幅カラムを設定できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateColumns('200px 200px 200px');
      expect(sut.render()).toBe('grid-template-columns: 200px 200px 200px;');
    });

    it('fr単位を設定できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateColumns('1fr 2fr 1fr');
      expect(sut.render()).toBe('grid-template-columns: 1fr 2fr 1fr;');
    });

    it('repeat()を使用できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateColumns('repeat(3, 1fr)');
      expect(sut.render()).toBe('grid-template-columns: repeat(3, 1fr);');
    });

    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateColumns('auto auto auto');
      expect(sut.render()).toBe('grid-template-columns: auto auto auto;');
    });

    it('minmax()を使用できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateColumns('minmax(100px, 1fr) 2fr 1fr');
      expect(sut.render()).toBe(
        'grid-template-columns: minmax(100px, 1fr) 2fr 1fr;',
      );
    });
  });

  // ── grid-template-rows (Req 6.1) ──

  describe('grid-template-rows', () => {
    it('固定高さの行を設定できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateRows('100px 200px');
      expect(sut.render()).toBe('grid-template-rows: 100px 200px;');
    });

    it('fr単位を設定できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateRows('1fr 2fr');
      expect(sut.render()).toBe('grid-template-rows: 1fr 2fr;');
    });

    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateRows('auto');
      expect(sut.render()).toBe('grid-template-rows: auto;');
    });
  });

  // ── grid-gap (Req 6.1) ──

  describe('grid-gap', () => {
    it('均一なギャップを設定できる', () => {
      const sut = makeSUT();
      sut.setGridGap('10px');
      expect(sut.render()).toBe('grid-gap: 10px;');
    });

    it('行・列個別のギャップを設定できる', () => {
      const sut = makeSUT();
      sut.setGridGap('10px 20px');
      expect(sut.render()).toBe('grid-gap: 10px 20px;');
    });
  });

  // ── grid-column (Req 6.1) ──

  describe('grid-column', () => {
    it('スパンを設定できる', () => {
      const sut = makeSUT();
      sut.setGridColumn('1 / 3');
      expect(sut.render()).toBe('grid-column: 1 / 3;');
    });

    it('span を使用できる', () => {
      const sut = makeSUT();
      sut.setGridColumn('span 2');
      expect(sut.render()).toBe('grid-column: span 2;');
    });

    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setGridColumn('auto');
      expect(sut.render()).toBe('grid-column: auto;');
    });
  });

  // ── grid-row (Req 6.1) ──

  describe('grid-row', () => {
    it('スパンを設定できる', () => {
      const sut = makeSUT();
      sut.setGridRow('1 / 3');
      expect(sut.render()).toBe('grid-row: 1 / 3;');
    });

    it('span を使用できる', () => {
      const sut = makeSUT();
      sut.setGridRow('span 2');
      expect(sut.render()).toBe('grid-row: span 2;');
    });
  });

  // ── grid-column-start ──

  describe('grid-column-start', () => {
    it('開始位置を設定できる', () => {
      const sut = makeSUT();
      sut.setGridColumnStart('1');
      expect(sut.render()).toBe('grid-column-start: 1;');
    });

    it('名前付きラインを設定できる', () => {
      const sut = makeSUT();
      sut.setGridColumnStart('main-start');
      expect(sut.render()).toBe('grid-column-start: main-start;');
    });
  });

  // ── grid-column-end ──

  describe('grid-column-end', () => {
    it('終了位置を設定できる', () => {
      const sut = makeSUT();
      sut.setGridColumnEnd('3');
      expect(sut.render()).toBe('grid-column-end: 3;');
    });

    it('span を使用できる', () => {
      const sut = makeSUT();
      sut.setGridColumnEnd('span 2');
      expect(sut.render()).toBe('grid-column-end: span 2;');
    });
  });

  // ── grid-row-start ──

  describe('grid-row-start', () => {
    it('開始位置を設定できる', () => {
      const sut = makeSUT();
      sut.setGridRowStart('1');
      expect(sut.render()).toBe('grid-row-start: 1;');
    });

    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setGridRowStart('auto');
      expect(sut.render()).toBe('grid-row-start: auto;');
    });
  });

  // ── grid-row-end ──

  describe('grid-row-end', () => {
    it('終了位置を設定できる', () => {
      const sut = makeSUT();
      sut.setGridRowEnd('3');
      expect(sut.render()).toBe('grid-row-end: 3;');
    });

    it('span を使用できる', () => {
      const sut = makeSUT();
      sut.setGridRowEnd('span 2');
      expect(sut.render()).toBe('grid-row-end: span 2;');
    });
  });

  // ── grid-template-areas ──

  describe('grid-template-areas', () => {
    it('エリアテンプレートを設定できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateAreas('"header header" "sidebar main" "footer footer"');
      expect(sut.render()).toBe(
        'grid-template-areas: "header header" "sidebar main" "footer footer";',
      );
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setGridTemplateAreas('none');
      expect(sut.render()).toBe('grid-template-areas: none;');
    });
  });

  // ── grid-area ──

  describe('grid-area', () => {
    it('エリア名を設定できる', () => {
      const sut = makeSUT();
      sut.setGridArea('header');
      expect(sut.render()).toBe('grid-area: header;');
    });

    it('行・列の範囲指定ができる', () => {
      const sut = makeSUT();
      sut.setGridArea('1 / 1 / 3 / 3');
      expect(sut.render()).toBe('grid-area: 1 / 1 / 3 / 3;');
    });
  });

  // ── grid-auto-flow ──

  describe('grid-auto-flow', () => {
    it('row を設定できる', () => {
      const sut = makeSUT();
      sut.setGridAutoFlow('row');
      expect(sut.render()).toBe('grid-auto-flow: row;');
    });

    it('column を設定できる', () => {
      const sut = makeSUT();
      sut.setGridAutoFlow('column');
      expect(sut.render()).toBe('grid-auto-flow: column;');
    });

    it('dense を設定できる', () => {
      const sut = makeSUT();
      sut.setGridAutoFlow('dense');
      expect(sut.render()).toBe('grid-auto-flow: dense;');
    });

    it('row dense を設定できる', () => {
      const sut = makeSUT();
      sut.setGridAutoFlow('row dense');
      expect(sut.render()).toBe('grid-auto-flow: row dense;');
    });
  });

  // ── grid-auto-columns ──

  describe('grid-auto-columns', () => {
    it('固定幅を設定できる', () => {
      const sut = makeSUT();
      sut.setGridAutoColumns('200px');
      expect(sut.render()).toBe('grid-auto-columns: 200px;');
    });

    it('minmax()を使用できる', () => {
      const sut = makeSUT();
      sut.setGridAutoColumns('minmax(100px, auto)');
      expect(sut.render()).toBe('grid-auto-columns: minmax(100px, auto);');
    });

    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setGridAutoColumns('auto');
      expect(sut.render()).toBe('grid-auto-columns: auto;');
    });
  });

  // ── grid-auto-rows ──

  describe('grid-auto-rows', () => {
    it('固定高さを設定できる', () => {
      const sut = makeSUT();
      sut.setGridAutoRows('100px');
      expect(sut.render()).toBe('grid-auto-rows: 100px;');
    });

    it('minmax()を使用できる', () => {
      const sut = makeSUT();
      sut.setGridAutoRows('minmax(50px, auto)');
      expect(sut.render()).toBe('grid-auto-rows: minmax(50px, auto);');
    });

    it('auto を設定できる', () => {
      const sut = makeSUT();
      sut.setGridAutoRows('auto');
      expect(sut.render()).toBe('grid-auto-rows: auto;');
    });
  });

  // ── メソッドチェーン（Fluent API） ──

  describe('メソッドチェーン', () => {
    it('setGridTemplateColumns が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridTemplateColumns('1fr 1fr');
      expect(result).toBe(sut);
    });

    it('setGridTemplateRows が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridTemplateRows('auto');
      expect(result).toBe(sut);
    });

    it('setGridGap が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridGap('10px');
      expect(result).toBe(sut);
    });

    it('setGridColumn が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridColumn('1 / 3');
      expect(result).toBe(sut);
    });

    it('setGridRow が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridRow('1 / 2');
      expect(result).toBe(sut);
    });

    it('setGridColumnStart が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridColumnStart('1');
      expect(result).toBe(sut);
    });

    it('setGridColumnEnd が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridColumnEnd('3');
      expect(result).toBe(sut);
    });

    it('setGridRowStart が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridRowStart('1');
      expect(result).toBe(sut);
    });

    it('setGridRowEnd が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridRowEnd('3');
      expect(result).toBe(sut);
    });

    it('setGridTemplateAreas が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridTemplateAreas('"a b"');
      expect(result).toBe(sut);
    });

    it('setGridArea が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridArea('header');
      expect(result).toBe(sut);
    });

    it('setGridAutoFlow が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridAutoFlow('row');
      expect(result).toBe(sut);
    });

    it('setGridAutoColumns が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridAutoColumns('auto');
      expect(result).toBe(sut);
    });

    it('setGridAutoRows が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setGridAutoRows('auto');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして一度に設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setGridTemplateColumns('1fr 2fr')
        .setGridTemplateRows('auto 1fr')
        .setGridGap('10px');
      expect(result).toBe(sut);
    });
  });

  // ── 複数プロパティのアルファベット順ソート ──

  describe('複数プロパティのアルファベット順ソート', () => {
    it('grid-template-columns と grid-template-rows をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setGridTemplateRows('auto');
      sut.setGridTemplateColumns('1fr 1fr');
      // grid-template-columns < grid-template-rows (アルファベット順)
      expect(sut.render()).toBe(
        'grid-template-columns: 1fr 1fr;\ngrid-template-rows: auto;',
      );
    });

    it('grid-gap, grid-template-columns, grid-template-rows をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setGridTemplateRows('100px 200px');
      sut.setGridGap('10px');
      sut.setGridTemplateColumns('repeat(3, 1fr)');
      // grid-gap < grid-template-columns < grid-template-rows
      expect(sut.render()).toBe(
        'grid-gap: 10px;\ngrid-template-columns: repeat(3, 1fr);\ngrid-template-rows: 100px 200px;',
      );
    });

    it('全14プロパティを設定した場合のアルファベット順出力', () => {
      const sut = makeSUT();
      sut
        .setGridAutoRows('auto')
        .setGridAutoColumns('200px')
        .setGridAutoFlow('row')
        .setGridArea('main')
        .setGridTemplateAreas('"header" "main" "footer"')
        .setGridRowEnd('3')
        .setGridRowStart('1')
        .setGridColumnEnd('4')
        .setGridColumnStart('2')
        .setGridRow('1 / 3')
        .setGridColumn('2 / 4')
        .setGridGap('10px')
        .setGridTemplateRows('auto 1fr auto')
        .setGridTemplateColumns('1fr 2fr');

      // アルファベット順:
      // grid-area, grid-auto-columns, grid-auto-flow, grid-auto-rows,
      // grid-column, grid-column-end, grid-column-start,
      // grid-gap, grid-row, grid-row-end, grid-row-start,
      // grid-template-areas, grid-template-columns, grid-template-rows
      const expected = [
        'grid-area: main;',
        'grid-auto-columns: 200px;',
        'grid-auto-flow: row;',
        'grid-auto-rows: auto;',
        'grid-column: 2 / 4;',
        'grid-column-end: 4;',
        'grid-column-start: 2;',
        'grid-gap: 10px;',
        'grid-row: 1 / 3;',
        'grid-row-end: 3;',
        'grid-row-start: 1;',
        'grid-template-areas: "header" "main" "footer";',
        'grid-template-columns: 1fr 2fr;',
        'grid-template-rows: auto 1fr auto;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── コンテナプロパティとアイテムプロパティの組み合わせ ──

  describe('コンテナ+アイテムプロパティの組み合わせ', () => {
    it('コンテナプロパティ（template-columns, template-rows, gap）の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setGridTemplateColumns('1fr 2fr 1fr')
        .setGridTemplateRows('auto 1fr')
        .setGridGap('16px')
        .setGridAutoFlow('row');

      // grid-auto-flow < grid-gap < grid-template-columns < grid-template-rows
      const expected = [
        'grid-auto-flow: row;',
        'grid-gap: 16px;',
        'grid-template-columns: 1fr 2fr 1fr;',
        'grid-template-rows: auto 1fr;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('アイテムプロパティ（column, row, area）の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setGridColumn('1 / 3')
        .setGridRow('2 / 4')
        .setGridArea('content');

      // grid-area < grid-column < grid-row
      const expected = [
        'grid-area: content;',
        'grid-column: 1 / 3;',
        'grid-row: 2 / 4;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('コンテナとアイテムプロパティの混在', () => {
      const sut = makeSUT();
      sut
        .setGridTemplateColumns('1fr 1fr 1fr')
        .setGridGap('10px')
        .setGridColumn('1 / 3')
        .setGridAutoFlow('dense');

      // grid-auto-flow < grid-column < grid-gap < grid-template-columns
      const expected = [
        'grid-auto-flow: dense;',
        'grid-column: 1 / 3;',
        'grid-gap: 10px;',
        'grid-template-columns: 1fr 1fr 1fr;',
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
      sut.setGridTemplateColumns('1fr 1fr');
      sut.setGridTemplateColumns('repeat(4, 1fr)');
      expect(sut.render()).toBe('grid-template-columns: repeat(4, 1fr);');
    });

    it('grid-gap を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setGridGap('5px');
      sut.setGridGap('10px');
      sut.setGridGap('20px');
      expect(sut.render()).toBe('grid-gap: 20px;');
    });
  });

  // ── render() の安定性 ──

  describe('render()の安定性', () => {
    it('render() を複数回呼んでも同じ結果を返す', () => {
      const sut = makeSUT();
      sut.setGridTemplateColumns('1fr 1fr').setGridGap('10px');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('単一プロパティの末尾にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setGridTemplateColumns('1fr');
      expect(sut.render()).toMatch(/;$/);
    });

    it('複数プロパティは改行+セミコロンで区切られ、最後にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setGridTemplateColumns('1fr').setGridGap('10px');
      const output = sut.render();
      expect(output).toContain(';\n');
      expect(output).toMatch(/;$/);
    });

    it('プロパティ名と値の間にコロンとスペースがある', () => {
      const sut = makeSUT();
      sut.setGridTemplateColumns('1fr');
      expect(sut.render()).toMatch(/^[a-z-]+: .+;$/);
    });
  });
});
