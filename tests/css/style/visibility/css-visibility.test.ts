/**
 * Task 2.1: CSSVisibility -- 表示制御・サイズ・可視性プロパティのテスト
 *
 * TDD RED phase: CSSVisibility の全setter・render()出力・エッジケースを検証する。
 * - display, width, height, min/max-width/height
 * - visibility, z-index, overflow, overflowX, overflowY, float, clear
 * - collectProperties -> render 統一パターン準拠
 * - Fluent setter（メソッドチェーン）対応
 * - 設定プロパティのみ出力、未設定は出力しない
 * - プロパティソート順（アルファベット順）
 *
 * Requirements: 3.1, 3.2, 3.5, 3.6, 7.6
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSVisibility } from '../../../../src/css/style/visibility/css-visibility.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSVisibility {
  return new CSSVisibility();
}

// ============================================================
// CSSVisibility
// ============================================================

describe('CSSVisibility', () => {
  // ── 空出力テスト ──

  describe('空出力', () => {
    it('プロパティ未設定の場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });
  });

  // ── Renderable準拠 ──

  describe('Renderable準拠', () => {
    it('render() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });
  });

  // ── display プロパティ ──

  describe('display', () => {
    it('display: block を設定できる', () => {
      const sut = makeSUT();
      sut.setDisplay('block');
      expect(sut.render()).toBe('display: block;');
    });

    it('display: inline を設定できる', () => {
      const sut = makeSUT();
      sut.setDisplay('inline');
      expect(sut.render()).toBe('display: inline;');
    });

    it('display: flex を設定できる', () => {
      const sut = makeSUT();
      sut.setDisplay('flex');
      expect(sut.render()).toBe('display: flex;');
    });

    it('display: grid を設定できる', () => {
      const sut = makeSUT();
      sut.setDisplay('grid');
      expect(sut.render()).toBe('display: grid;');
    });

    it('display: none を設定できる', () => {
      const sut = makeSUT();
      sut.setDisplay('none');
      expect(sut.render()).toBe('display: none;');
    });

    it('display: inline-block を設定できる', () => {
      const sut = makeSUT();
      sut.setDisplay('inline-block');
      expect(sut.render()).toBe('display: inline-block;');
    });

    it('display: inline-flex を設定できる', () => {
      const sut = makeSUT();
      sut.setDisplay('inline-flex');
      expect(sut.render()).toBe('display: inline-flex;');
    });
  });

  // ── サイズプロパティ ──

  describe('width / height', () => {
    it('width を設定できる', () => {
      const sut = makeSUT();
      sut.setWidth('100px');
      expect(sut.render()).toBe('width: 100px;');
    });

    it('height を設定できる', () => {
      const sut = makeSUT();
      sut.setHeight('200px');
      expect(sut.render()).toBe('height: 200px;');
    });

    it('width にパーセント値を設定できる', () => {
      const sut = makeSUT();
      sut.setWidth('50%');
      expect(sut.render()).toBe('width: 50%;');
    });

    it('height に auto を設定できる', () => {
      const sut = makeSUT();
      sut.setHeight('auto');
      expect(sut.render()).toBe('height: auto;');
    });

    it('width に vw 単位を設定できる', () => {
      const sut = makeSUT();
      sut.setWidth('100vw');
      expect(sut.render()).toBe('width: 100vw;');
    });
  });

  describe('min-width / max-width', () => {
    it('min-width を設定できる', () => {
      const sut = makeSUT();
      sut.setMinWidth('200px');
      expect(sut.render()).toBe('min-width: 200px;');
    });

    it('max-width を設定できる', () => {
      const sut = makeSUT();
      sut.setMaxWidth('800px');
      expect(sut.render()).toBe('max-width: 800px;');
    });

    it('max-width に none を設定できる', () => {
      const sut = makeSUT();
      sut.setMaxWidth('none');
      expect(sut.render()).toBe('max-width: none;');
    });
  });

  describe('min-height / max-height', () => {
    it('min-height を設定できる', () => {
      const sut = makeSUT();
      sut.setMinHeight('100px');
      expect(sut.render()).toBe('min-height: 100px;');
    });

    it('max-height を設定できる', () => {
      const sut = makeSUT();
      sut.setMaxHeight('500px');
      expect(sut.render()).toBe('max-height: 500px;');
    });

    it('max-height に 100vh を設定できる', () => {
      const sut = makeSUT();
      sut.setMaxHeight('100vh');
      expect(sut.render()).toBe('max-height: 100vh;');
    });
  });

  // ── visibility プロパティ ──

  describe('visibility', () => {
    it('visibility: visible を設定できる', () => {
      const sut = makeSUT();
      sut.setVisibility('visible');
      expect(sut.render()).toBe('visibility: visible;');
    });

    it('visibility: hidden を設定できる', () => {
      const sut = makeSUT();
      sut.setVisibility('hidden');
      expect(sut.render()).toBe('visibility: hidden;');
    });

    it('visibility: collapse を設定できる', () => {
      const sut = makeSUT();
      sut.setVisibility('collapse');
      expect(sut.render()).toBe('visibility: collapse;');
    });
  });

  // ── z-index プロパティ ──

  describe('z-index', () => {
    it('z-index を正の整数で設定できる', () => {
      const sut = makeSUT();
      sut.setZIndex('10');
      expect(sut.render()).toBe('z-index: 10;');
    });

    it('z-index を負の整数で設定できる', () => {
      const sut = makeSUT();
      sut.setZIndex('-1');
      expect(sut.render()).toBe('z-index: -1;');
    });

    it('z-index に auto を設定できる', () => {
      const sut = makeSUT();
      sut.setZIndex('auto');
      expect(sut.render()).toBe('z-index: auto;');
    });
  });

  // ── float プロパティ ──

  describe('float', () => {
    it('float: left を設定できる', () => {
      const sut = makeSUT();
      sut.setFloat('left');
      expect(sut.render()).toBe('float: left;');
    });

    it('float: right を設定できる', () => {
      const sut = makeSUT();
      sut.setFloat('right');
      expect(sut.render()).toBe('float: right;');
    });

    it('float: none を設定できる', () => {
      const sut = makeSUT();
      sut.setFloat('none');
      expect(sut.render()).toBe('float: none;');
    });
  });

  // ── clear プロパティ ──

  describe('clear', () => {
    it('clear: both を設定できる', () => {
      const sut = makeSUT();
      sut.setClear('both');
      expect(sut.render()).toBe('clear: both;');
    });

    it('clear: left を設定できる', () => {
      const sut = makeSUT();
      sut.setClear('left');
      expect(sut.render()).toBe('clear: left;');
    });

    it('clear: right を設定できる', () => {
      const sut = makeSUT();
      sut.setClear('right');
      expect(sut.render()).toBe('clear: right;');
    });

    it('clear: none を設定できる', () => {
      const sut = makeSUT();
      sut.setClear('none');
      expect(sut.render()).toBe('clear: none;');
    });
  });

  // ── Fluent setter（メソッドチェーン） ──

  describe('メソッドチェーン', () => {
    it('setDisplay が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setDisplay('block');
      expect(result).toBe(sut);
    });

    it('setWidth が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setWidth('100px');
      expect(result).toBe(sut);
    });

    it('setHeight が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setHeight('200px');
      expect(result).toBe(sut);
    });

    it('setMinWidth が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setMinWidth('100px');
      expect(result).toBe(sut);
    });

    it('setMaxWidth が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setMaxWidth('800px');
      expect(result).toBe(sut);
    });

    it('setMinHeight が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setMinHeight('100px');
      expect(result).toBe(sut);
    });

    it('setMaxHeight が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setMaxHeight('500px');
      expect(result).toBe(sut);
    });

    it('setVisibility が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setVisibility('visible');
      expect(result).toBe(sut);
    });

    it('setZIndex が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setZIndex('10');
      expect(result).toBe(sut);
    });

    it('setFloat が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFloat('left');
      expect(result).toBe(sut);
    });

    it('setClear が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setClear('both');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setDisplay('flex')
        .setWidth('100%')
        .setHeight('50vh');
      expect(result).toBe(sut);
      const rendered = sut.render();
      expect(rendered).toContain('display: flex');
      expect(rendered).toContain('width: 100%');
      expect(rendered).toContain('height: 50vh');
    });
  });

  // ── 複数プロパティ設定時のrender出力 ──

  describe('複数プロパティ設定', () => {
    it('display と width を設定した場合、両方が出力される', () => {
      const sut = makeSUT();
      sut.setDisplay('block');
      sut.setWidth('100px');
      const rendered = sut.render();
      expect(rendered).toContain('display: block');
      expect(rendered).toContain('width: 100px');
    });

    it('全サイズプロパティを設定した場合、すべてが出力される', () => {
      const sut = makeSUT();
      sut.setWidth('100px');
      sut.setHeight('200px');
      sut.setMinWidth('50px');
      sut.setMaxWidth('300px');
      sut.setMinHeight('100px');
      sut.setMaxHeight('400px');
      const rendered = sut.render();
      expect(rendered).toContain('width: 100px');
      expect(rendered).toContain('height: 200px');
      expect(rendered).toContain('min-width: 50px');
      expect(rendered).toContain('max-width: 300px');
      expect(rendered).toContain('min-height: 100px');
      expect(rendered).toContain('max-height: 400px');
    });
  });

  // ── プロパティソート順の検証 ──

  describe('プロパティソート順（アルファベット順）', () => {
    it('複数プロパティがアルファベット順にソートされる', () => {
      const sut = makeSUT();
      // 意図的にアルファベット逆順で設定
      sut.setZIndex('10');
      sut.setWidth('100px');
      sut.setVisibility('visible');
      sut.setHeight('200px');
      sut.setDisplay('flex');
      sut.setClear('both');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // アルファベット順: clear < display < height < visibility < width < z-index
      expect(lines[0]).toBe('clear: both');
      expect(lines[1]).toBe('display: flex');
      expect(lines[2]).toBe('height: 200px');
      expect(lines[3]).toBe('visibility: visible');
      expect(lines[4]).toBe('width: 100px');
      expect(lines[5]).toBe('z-index: 10;'); // 最後のエントリにはセミコロンが付く
    });

    it('float プロパティが正しい位置にソートされる', () => {
      const sut = makeSUT();
      sut.setFloat('left');
      sut.setDisplay('block');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // display < float
      expect(lines[0]).toBe('display: block');
      expect(lines[1]).toBe('float: left;');
    });

    it('min/max プロパティが正しい位置にソートされる', () => {
      const sut = makeSUT();
      sut.setWidth('100px');
      sut.setMinWidth('50px');
      sut.setMaxWidth('200px');
      sut.setMaxHeight('400px');
      sut.setMinHeight('100px');
      sut.setHeight('200px');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // height < max-height < max-width < min-height < min-width < width
      expect(lines[0]).toBe('height: 200px');
      expect(lines[1]).toBe('max-height: 400px');
      expect(lines[2]).toBe('max-width: 200px');
      expect(lines[3]).toBe('min-height: 100px');
      expect(lines[4]).toBe('min-width: 50px');
      expect(lines[5]).toBe('width: 100px;');
    });
  });

  // ── render() 出力フォーマット ──

  describe('render() 出力フォーマット', () => {
    it('単一プロパティの場合、セミコロンで終わる', () => {
      const sut = makeSUT();
      sut.setDisplay('block');
      expect(sut.render()).toBe('display: block;');
    });

    it('複数プロパティの場合、セミコロン+改行で区切られ、最後にセミコロンが付く', () => {
      const sut = makeSUT();
      sut.setDisplay('block');
      sut.setWidth('100px');
      expect(sut.render()).toBe('display: block;\nwidth: 100px;');
    });

    it('3つ以上のプロパティの場合も正しいフォーマットになる', () => {
      const sut = makeSUT();
      sut.setDisplay('flex');
      sut.setWidth('100%');
      sut.setHeight('auto');
      expect(sut.render()).toBe('display: flex;\nheight: auto;\nwidth: 100%;');
    });
  });

  // ── 設定プロパティのみ出力（未設定は出力しない） ──

  describe('設定プロパティのみ出力', () => {
    it('display のみ設定した場合、display のみ出力される', () => {
      const sut = makeSUT();
      sut.setDisplay('block');
      const rendered = sut.render();
      expect(rendered).toBe('display: block;');
      expect(rendered).not.toContain('width');
      expect(rendered).not.toContain('height');
      expect(rendered).not.toContain('visibility');
      expect(rendered).not.toContain('z-index');
      expect(rendered).not.toContain('overflow');
      expect(rendered).not.toContain('float');
      expect(rendered).not.toContain('clear');
    });

    it('width のみ設定した場合、width のみ出力される', () => {
      const sut = makeSUT();
      sut.setWidth('100px');
      const rendered = sut.render();
      expect(rendered).toBe('width: 100px;');
      expect(rendered).not.toContain('display');
    });

  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    const savedDev = process.env.DRAFT_OLE_DEV;
    beforeEach(() => { delete process.env.DRAFT_OLE_DEV; });
    afterEach(() => {
      if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
      else process.env.DRAFT_OLE_DEV = savedDev;
    });

    it('同じプロパティを複数回設定した場合、最後の値が使われる', () => {
      const sut = makeSUT();
      sut.setDisplay('block');
      sut.setDisplay('flex');
      expect(sut.render()).toBe('display: flex;');
    });

    it('render() を複数回呼んでも同じ値を返す', () => {
      const sut = makeSUT();
      sut.setDisplay('block');
      sut.setWidth('100px');
      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });

    it('全プロパティを設定した場合のrender()が正常に動作する', () => {
      const sut = makeSUT();
      sut.setDisplay('flex');
      sut.setWidth('100px');
      sut.setHeight('200px');
      sut.setMinWidth('50px');
      sut.setMaxWidth('300px');
      sut.setMinHeight('100px');
      sut.setMaxHeight('400px');
      sut.setVisibility('visible');
      sut.setZIndex('10');
      sut.setFloat('left');
      sut.setClear('both');

      const rendered = sut.render();
      // 11プロパティすべてが出力に含まれる
      expect(rendered).toContain('display: flex');
      expect(rendered).toContain('width: 100px');
      expect(rendered).toContain('height: 200px');
      expect(rendered).toContain('min-width: 50px');
      expect(rendered).toContain('max-width: 300px');
      expect(rendered).toContain('min-height: 100px');
      expect(rendered).toContain('max-height: 400px');
      expect(rendered).toContain('visibility: visible');
      expect(rendered).toContain('z-index: 10');
      expect(rendered).toContain('float: left');
      expect(rendered).toContain('clear: both');

      // 行数の確認（11プロパティ = 11行、;\n区切り）
      const lines = rendered.split(';\n');
      expect(lines).toHaveLength(11);
    });
  });
});
