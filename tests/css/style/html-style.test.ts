/**
 * Task 6.1: HtmlStyle -- 統合コンテナのテスト
 *
 * TDD RED phase: HtmlStyle の全アクセサ・統合render()・出力順序・エッジケースを検証する。
 * - 13種類のCSSプロパティクラスをデフォルト初期化して統合管理する
 * - render()で全クラスのrender()結果をフィルタリング（空文字除外）して結合する
 * - Swift版と同一の出力順序を保持する
 * - 各プロパティクラスへのアクセサ（getter）を提供する
 * - すべてのプロパティが未設定の場合に空文字列を返す
 *
 * Requirements: 9.1, 9.2, 9.3, 9.5
 */
import { describe, it, expect } from 'vitest';
import { HtmlStyle } from '../../../src/css/style/html-style.js';
import { CSSFont } from '../../../src/css/style/font/css-font.js';
import { CSSBackground } from '../../../src/css/style/background/css-background.js';
import { CSSText } from '../../../src/css/style/text/css-text.js';
import { CSSSpacing } from '../../../src/css/style/spacing/css-spacing.js';
import { CSSBorder } from '../../../src/css/style/border/css-border.js';
import { CSSVisibility } from '../../../src/css/style/visibility/css-visibility.js';
import { CSSFlex } from '../../../src/css/style/flex/css-flex.js';
import { CSSGrid } from '../../../src/css/style/grid/css-grid.js';
import { CSSVisual } from '../../../src/css/style/visual/css-visual.js';
import { CSSTransform } from '../../../src/css/style/transform/css-transform.js';
import { CSSAnimation } from '../../../src/css/style/animation/css-animation.js';
import { CSSTable } from '../../../src/css/style/table/css-table.js';
import { CSSList } from '../../../src/css/style/list/css-list.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): HtmlStyle {
  return new HtmlStyle();
}

// ============================================================
// HtmlStyle
// ============================================================

describe('HtmlStyle', () => {
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

  // ── アクセサ（getter）検証 ──

  describe('アクセサ', () => {
    it('font アクセサが CSSFont インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.font).toBeInstanceOf(CSSFont);
    });

    it('backgroundColor アクセサが CSSBackground インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.backgroundColor).toBeInstanceOf(CSSBackground);
    });

    it('text アクセサが CSSText インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.text).toBeInstanceOf(CSSText);
    });

    it('spacing アクセサが CSSSpacing インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.spacing).toBeInstanceOf(CSSSpacing);
    });

    it('border アクセサが CSSBorder インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.border).toBeInstanceOf(CSSBorder);
    });

    it('position アクセサが CSSVisibility インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.position).toBeInstanceOf(CSSVisibility);
    });

    it('flex アクセサが CSSFlex インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.flex).toBeInstanceOf(CSSFlex);
    });

    it('grid アクセサが CSSGrid インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.grid).toBeInstanceOf(CSSGrid);
    });

    it('visual アクセサが CSSVisual インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.visual).toBeInstanceOf(CSSVisual);
    });

    it('transform アクセサが CSSTransform インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.transform).toBeInstanceOf(CSSTransform);
    });

    it('animation アクセサが CSSAnimation インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.animation).toBeInstanceOf(CSSAnimation);
    });

    it('table アクセサが CSSTable インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.table).toBeInstanceOf(CSSTable);
    });

    it('list アクセサが CSSList インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.list).toBeInstanceOf(CSSList);
    });

    it('同一インスタンスから複数回アクセスしても同じオブジェクトを返す', () => {
      const sut = makeSUT();
      expect(sut.font).toBe(sut.font);
      expect(sut.backgroundColor).toBe(sut.backgroundColor);
      expect(sut.text).toBe(sut.text);
      expect(sut.spacing).toBe(sut.spacing);
      expect(sut.border).toBe(sut.border);
      expect(sut.position).toBe(sut.position);
      expect(sut.flex).toBe(sut.flex);
      expect(sut.grid).toBe(sut.grid);
      expect(sut.visual).toBe(sut.visual);
      expect(sut.transform).toBe(sut.transform);
      expect(sut.animation).toBe(sut.animation);
      expect(sut.table).toBe(sut.table);
      expect(sut.list).toBe(sut.list);
    });
  });

  // ── 単一プロパティクラスの render() 検証 ──

  describe('単一プロパティクラスのrender()', () => {
    it('font のみ設定した場合、font の出力のみ返す', () => {
      const sut = makeSUT();
      sut.font.setFontSize('16px');
      expect(sut.render()).toBe('font-size: 16px;');
    });

    it('backgroundColor のみ設定した場合、background の出力のみ返す', () => {
      const sut = makeSUT();
      sut.backgroundColor.setBackgroundColor('red');
      expect(sut.render()).toBe('background-color: red;');
    });

    it('text のみ設定した場合、text の出力のみ返す', () => {
      const sut = makeSUT();
      sut.text.setTextAlign('center');
      expect(sut.render()).toBe('text-align: center;');
    });

    it('spacing のみ設定した場合、spacing の出力のみ返す', () => {
      const sut = makeSUT();
      sut.spacing.setMargin('10px');
      expect(sut.render()).toBe('margin: 10px;');
    });

    it('border のみ設定した場合、border の出力のみ返す', () => {
      const sut = makeSUT();
      sut.border.setBorderWidth('1px');
      expect(sut.render()).toBe('border-width: 1px;');
    });

    it('position のみ設定した場合、position の出力のみ返す', () => {
      const sut = makeSUT();
      sut.position.setDisplay('flex');
      expect(sut.render()).toBe('display: flex;');
    });

    it('flex のみ設定した場合、flex の出力のみ返す', () => {
      const sut = makeSUT();
      sut.flex.setFlexDirection('row');
      expect(sut.render()).toBe('flex-direction: row;');
    });

    it('grid のみ設定した場合、grid の出力のみ返す', () => {
      const sut = makeSUT();
      sut.grid.setGridTemplateColumns('1fr 1fr');
      expect(sut.render()).toBe('grid-template-columns: 1fr 1fr;');
    });

    it('visual のみ設定した場合、visual の出力のみ返す', () => {
      const sut = makeSUT();
      sut.visual.setOpacity('0.5');
      expect(sut.render()).toBe('opacity: 0.5;');
    });

    it('transform のみ設定した場合、transform の出力のみ返す', () => {
      const sut = makeSUT();
      sut.transform.setTransform('rotate(45deg)');
      expect(sut.render()).toBe('transform: rotate(45deg);');
    });

    it('animation のみ設定した場合、animation の出力のみ返す', () => {
      const sut = makeSUT();
      sut.animation.setAnimationName('fadeIn');
      expect(sut.render()).toBe('animation-name: fadeIn;');
    });

    it('table のみ設定した場合、table の出力のみ返す', () => {
      const sut = makeSUT();
      sut.table.setBorderCollapse('collapse');
      expect(sut.render()).toBe('border-collapse: collapse;');
    });

    it('list のみ設定した場合、list の出力のみ返す', () => {
      const sut = makeSUT();
      sut.list.setListStyleType('disc');
      expect(sut.render()).toBe('list-style-type: disc;');
    });
  });

  // ── 統合render() 出力順序の検証 ──
  // Swift版と同一: font → backgroundColor → text → spacing → border →
  //   position → flex → grid → visual → transform → animation → table → list

  describe('統合render()出力順序', () => {
    it('font → backgroundColor の順序で出力される', () => {
      const sut = makeSUT();
      // 意図的に逆順で設定
      sut.backgroundColor.setBackgroundColor('blue');
      sut.font.setFontSize('16px');

      const rendered = sut.render();
      const fontIdx = rendered.indexOf('font-size');
      const bgIdx = rendered.indexOf('background-color');

      expect(fontIdx).toBeLessThan(bgIdx);
    });

    it('text → spacing の順序で出力される', () => {
      const sut = makeSUT();
      sut.spacing.setMargin('10px');
      sut.text.setTextAlign('center');

      const rendered = sut.render();
      const textIdx = rendered.indexOf('text-align');
      const spacingIdx = rendered.indexOf('margin');

      expect(textIdx).toBeLessThan(spacingIdx);
    });

    it('border → position の順序で出力される', () => {
      const sut = makeSUT();
      sut.position.setDisplay('block');
      sut.border.setBorderWidth('1px');

      const rendered = sut.render();
      const borderIdx = rendered.indexOf('border-width');
      const positionIdx = rendered.indexOf('display');

      expect(borderIdx).toBeLessThan(positionIdx);
    });

    it('flex → grid の順序で出力される', () => {
      const sut = makeSUT();
      sut.grid.setGridTemplateColumns('1fr');
      sut.flex.setFlexDirection('row');

      const rendered = sut.render();
      const flexIdx = rendered.indexOf('flex-direction');
      const gridIdx = rendered.indexOf('grid-template-columns');

      expect(flexIdx).toBeLessThan(gridIdx);
    });

    it('visual → transform の順序で出力される', () => {
      const sut = makeSUT();
      sut.transform.setTransform('scale(2)');
      sut.visual.setOpacity('0.5');

      const rendered = sut.render();
      const visualIdx = rendered.indexOf('opacity');
      const transformIdx = rendered.indexOf('transform');

      expect(visualIdx).toBeLessThan(transformIdx);
    });

    it('animation → table の順序で出力される', () => {
      const sut = makeSUT();
      sut.table.setBorderCollapse('collapse');
      sut.animation.setAnimationName('fadeIn');

      const rendered = sut.render();
      const animIdx = rendered.indexOf('animation-name');
      const tableIdx = rendered.indexOf('border-collapse');

      expect(animIdx).toBeLessThan(tableIdx);
    });

    it('table → list の順序で出力される', () => {
      const sut = makeSUT();
      sut.list.setListStyleType('disc');
      sut.table.setTableLayout('fixed');

      const rendered = sut.render();
      const tableIdx = rendered.indexOf('table-layout');
      const listIdx = rendered.indexOf('list-style-type');

      expect(tableIdx).toBeLessThan(listIdx);
    });

    it('13クラスすべて設定した場合、正しい順序で出力される', () => {
      const sut = makeSUT();

      // 全13クラスに1プロパティずつ設定
      sut.font.setFontSize('16px');
      sut.backgroundColor.setBackgroundColor('white');
      sut.text.setTextAlign('center');
      sut.spacing.setMargin('10px');
      sut.border.setBorderWidth('1px');
      sut.position.setDisplay('block');
      sut.flex.setFlexDirection('row');
      sut.grid.setGridTemplateColumns('1fr 1fr');
      sut.visual.setOpacity('1');
      sut.transform.setTransform('none');
      sut.animation.setAnimationName('fadeIn');
      sut.table.setBorderCollapse('collapse');
      sut.list.setListStyleType('disc');

      const rendered = sut.render();

      // 各プロパティのインデックスを取得
      const indices = [
        rendered.indexOf('font-size'),           // font
        rendered.indexOf('background-color'),     // backgroundColor
        rendered.indexOf('text-align'),           // text
        rendered.indexOf('margin'),               // spacing
        rendered.indexOf('border-width'),         // border
        rendered.indexOf('display'),              // position
        rendered.indexOf('flex-direction'),        // flex
        rendered.indexOf('grid-template-columns'), // grid
        rendered.indexOf('opacity'),              // visual
        rendered.indexOf('transform'),            // transform
        rendered.indexOf('animation-name'),       // animation
        rendered.indexOf('border-collapse'),      // table
        rendered.indexOf('list-style-type'),       // list
      ];

      // すべてのインデックスが昇順であること
      for (let i = 0; i < indices.length - 1; i++) {
        expect(indices[i]).toBeLessThan(indices[i + 1]!);
      }
    });
  });

  // ── フィルタリング検証 ──

  describe('空文字フィルタリング', () => {
    it('未設定クラスの出力は結合結果に含まれない', () => {
      const sut = makeSUT();
      sut.font.setFontSize('16px');
      // 他の12クラスは未設定

      const rendered = sut.render();
      // fontの出力のみ
      expect(rendered).toBe('font-size: 16px;');
      // 余計なセパレータや空行がないことを確認
      expect(rendered).not.toContain('\n\n');
    });

    it('複数クラスを設定し、間に未設定クラスがある場合、正しく結合される', () => {
      const sut = makeSUT();
      sut.font.setFontSize('16px');
      // backgroundColor, text, spacing, border は未設定
      sut.position.setDisplay('flex');

      const rendered = sut.render();
      // font の出力 + セパレータ + position の出力
      expect(rendered).toContain('font-size: 16px;');
      expect(rendered).toContain('display: flex;');
    });
  });

  // ── 結合セパレータ検証 ──

  describe('結合セパレータ', () => {
    it('複数クラスの出力は改行で結合される', () => {
      const sut = makeSUT();
      sut.font.setFontSize('16px');
      sut.spacing.setMargin('10px');

      const rendered = sut.render();
      // fontの最後のセミコロンの後に改行が入り、spacingの出力が続く
      expect(rendered).toBe('font-size: 16px;\nmargin: 10px;');
    });

    it('3つ以上のクラスが設定された場合も正しく結合される', () => {
      const sut = makeSUT();
      sut.font.setFontSize('16px');
      sut.spacing.setMargin('10px');
      sut.position.setDisplay('block');

      const rendered = sut.render();
      expect(rendered).toBe('font-size: 16px;\nmargin: 10px;\ndisplay: block;');
    });
  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    it('render() を複数回呼んでも同じ値を返す', () => {
      const sut = makeSUT();
      sut.font.setFontSize('16px');
      sut.spacing.setMargin('10px');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });

    it('プロパティクラス内で複数プロパティを設定した場合も正しく統合される', () => {
      const sut = makeSUT();
      sut.font.setFontSize('16px').setFontWeight('bold');
      sut.spacing.setMarginTop('10px').setPaddingBottom('20px');

      const rendered = sut.render();
      // font内のプロパティはアルファベット順
      expect(rendered).toContain('font-size: 16px');
      expect(rendered).toContain('font-weight: bold');
      expect(rendered).toContain('margin-top: 10px');
      expect(rendered).toContain('padding-bottom: 20px');
    });

    it('新しい HtmlStyle インスタンスは独立している', () => {
      const sut1 = makeSUT();
      const sut2 = makeSUT();

      sut1.font.setFontSize('16px');

      expect(sut1.render()).toBe('font-size: 16px;');
      expect(sut2.render()).toBe('');
    });
  });
});
