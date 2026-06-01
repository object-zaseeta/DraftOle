/**
 * Task 9.4: Swift版等価性検証 - CSS出力等価性テスト
 *
 * 目的: Swift版と同一のスタイル設定で同等のCSS文字列を出力することを検証する
 *
 * Requirements:
 * - 11.3: 同一のスタイル設定が適用された場合、Swift版と同等のCSS文字列を出力する
 * - 10.4: 未設定プロパティが出力されないことを検証する
 *
 * 注: Swift版のテストケースから移植したテストケース
 */
import { describe, it, expect } from 'vitest';
import { CSSFont } from '../../../src/css/style/font/css-font.js';
import { CSSBackground } from '../../../src/css/style/background/css-background.js';
import { CSSSpacing } from '../../../src/css/style/spacing/css-spacing.js';
import { CSSBorder } from '../../../src/css/style/border/css-border.js';
import { CSSFlex } from '../../../src/css/style/flex/css-flex.js';
import { CSSGrid } from '../../../src/css/style/grid/css-grid.js';
import { CSSVisual } from '../../../src/css/style/visual/css-visual.js';
import { CSSText } from '../../../src/css/style/text/css-text.js';
import { CSSTransform } from '../../../src/css/style/transform/css-transform.js';
import { CSSAnimation } from '../../../src/css/style/animation/css-animation.js';
import { CSSTable } from '../../../src/css/style/table/css-table.js';
import { CSSList } from '../../../src/css/style/list/css-list.js';
import { CSSVisibility } from '../../../src/css/style/visibility/css-visibility.js';
import { HtmlStyle } from '../../../src/css/style/html-style.js';

describe('Swift版等価性検証: CSS出力等価性', () => {
  describe('CSSFont - Swift版と同等の出力', () => {
    it('フォントサイズとカラーを設定した場合のCSS出力', () => {
      const font = new CSSFont();
      font.setFontSize('16px').setColor('#333');

      const output = font.render();

      // Swift版と同じプロパティ順序（アルファベット順）
      expect(output).toContain('color: #333');
      expect(output).toContain('font-size: 16px');
      // プロパティがソートされていることを確認
      expect(output.indexOf('color:')).toBeLessThan(output.indexOf('font-size:'));
    });

    it('すべてのフォントプロパティを設定した場合のCSS出力', () => {
      const font = new CSSFont();
      font
        .setFontFamily('Arial, sans-serif')
        .setFontSize('18px')
        .setFontWeight('bold')
        .setFontStyle('italic')
        .setColor('#000')
        .setLineHeight('1.5')
        .setLetterSpacing('0.5px');

      const output = font.render();

      // すべてのプロパティが出力されることを確認
      expect(output).toContain('font-family: Arial, sans-serif');
      expect(output).toContain('font-size: 18px');
      expect(output).toContain('font-weight: bold');
      expect(output).toContain('font-style: italic');
      expect(output).toContain('color: #000');
      expect(output).toContain('line-height: 1.5');
      expect(output).toContain('letter-spacing: 0.5px');
    });
  });

  describe('CSSSpacing - Swift版と同等の出力', () => {
    it('margin と padding を設定した場合のCSS出力', () => {
      const spacing = new CSSSpacing();
      spacing.setMargin('10px').setPadding('5px');

      const output = spacing.render();

      expect(output).toContain('margin: 10px');
      expect(output).toContain('padding: 5px');
    });

    it('個別方向の margin/padding を設定した場合のCSS出力', () => {
      const spacing = new CSSSpacing();
      spacing
        .setMarginTop('10px')
        .setMarginRight('15px')
        .setMarginBottom('10px')
        .setMarginLeft('15px')
        .setPaddingTop('5px')
        .setPaddingRight('7px')
        .setPaddingBottom('5px')
        .setPaddingLeft('7px');

      const output = spacing.render();

      // すべての個別方向のプロパティが出力されることを確認
      expect(output).toContain('margin-top: 10px');
      expect(output).toContain('margin-right: 15px');
      expect(output).toContain('margin-bottom: 10px');
      expect(output).toContain('margin-left: 15px');
      expect(output).toContain('padding-top: 5px');
      expect(output).toContain('padding-right: 7px');
      expect(output).toContain('padding-bottom: 5px');
      expect(output).toContain('padding-left: 7px');
    });
  });

  describe('CSSFlex - Swift版と同等の出力', () => {
    it('Flexbox レイアウトを設定した場合のCSS出力', () => {
      const flex = new CSSFlex();
      flex
        .setFlexDirection('row')
        .setJustifyContent('center')
        .setAlignItems('center')
        .setGap('10px');

      const output = flex.render();

      expect(output).toContain('flex-direction: row');
      expect(output).toContain('justify-content: center');
      expect(output).toContain('align-items: center');
      expect(output).toContain('gap: 10px');
    });
  });

  describe('HtmlStyle - 統合CSS出力（Swift版と同等）', () => {
    it('複数のプロパティクラスを統合した場合のCSS出力順序', () => {
      const htmlStyle = new HtmlStyle();

      // Swift版と同じ順序でプロパティを設定
      htmlStyle.font.setFontSize('16px').setColor('#333');
      htmlStyle.spacing.setMargin('10px').setPadding('5px');
      htmlStyle.flex.setFlexDirection('row').setJustifyContent('center');

      const output = htmlStyle.render();

      // Swift版と同じ出力順序: font → spacing → flex
      // （実際の順序は design.md の HtmlStyle.render() 順序に準拠）
      const fontIndex = output.indexOf('font-size:');
      const spacingIndex = output.indexOf('margin:');
      const flexIndex = output.indexOf('flex-direction:');

      expect(fontIndex).toBeGreaterThan(-1);
      expect(spacingIndex).toBeGreaterThan(-1);
      expect(flexIndex).toBeGreaterThan(-1);

      // 出力順序の検証（Swift版: font → backgroundColor → text → spacing → ...）
      expect(fontIndex).toBeLessThan(spacingIndex);
      expect(spacingIndex).toBeLessThan(flexIndex);
    });

    it('一部のプロパティのみ設定した場合、設定済みのみ出力される', () => {
      const htmlStyle = new HtmlStyle();

      // fontのみ設定
      htmlStyle.font.setFontSize('16px');

      const output = htmlStyle.render();

      // font のみ出力されることを確認
      expect(output).toContain('font-size: 16px');
      // 他のプロパティは出力されないことを確認
      expect(output).not.toContain('margin');
      expect(output).not.toContain('padding');
      expect(output).not.toContain('flex-direction');
      expect(output).not.toContain('display');
    });

    it('すべてのプロパティが未設定の場合、空文字列を返す', () => {
      const htmlStyle = new HtmlStyle();

      const output = htmlStyle.render();

      expect(output).toBe('');
    });
  });

  describe('未設定プロパティの出力検証（Req 10.4）', () => {
    const testCases: Array<{
      name: string;
      setup: () => { render(): string };
      property: string;
    }> = [
      {
        name: 'CSSFont - 未設定時',
        setup: () => new CSSFont(),
        property: 'font-size',
      },
      {
        name: 'CSSBackground - 未設定時',
        setup: () => new CSSBackground(),
        property: 'background-color',
      },
      {
        name: 'CSSSpacing - 未設定時',
        setup: () => new CSSSpacing(),
        property: 'margin',
      },
      {
        name: 'CSSBorder - 未設定時',
        setup: () => new CSSBorder(),
        property: 'border-width',
      },
      {
        name: 'CSSFlex - 未設定時',
        setup: () => new CSSFlex(),
        property: 'flex-direction',
      },
      {
        name: 'CSSGrid - 未設定時',
        setup: () => new CSSGrid(),
        property: 'grid-template-columns',
      },
      {
        name: 'CSSVisual - 未設定時',
        setup: () => new CSSVisual(),
        property: 'box-shadow',
      },
      {
        name: 'CSSText - 未設定時',
        setup: () => new CSSText(),
        property: 'text-align',
      },
      {
        name: 'CSSTransform - 未設定時',
        setup: () => new CSSTransform(),
        property: 'transform',
      },
      {
        name: 'CSSAnimation - 未設定時',
        setup: () => new CSSAnimation(),
        property: 'animation-name',
      },
      {
        name: 'CSSTable - 未設定時',
        setup: () => new CSSTable(),
        property: 'border-collapse',
      },
      {
        name: 'CSSList - 未設定時',
        setup: () => new CSSList(),
        property: 'list-style-type',
      },
      {
        name: 'CSSVisibility - 未設定時',
        setup: () => new CSSVisibility(),
        property: 'display',
      },
    ];

    it.each(testCases)(
      '$name は未設定プロパティを出力しない',
      ({ setup, property }) => {
        const instance = setup();
        const output = instance.render();

        // 未設定の場合、空文字列または対象プロパティを含まないことを確認
        expect(output).toBe('');
        expect(output).not.toContain(property);
      }
    );
  });

  describe('CSS出力のフォーマット検証', () => {
    it('プロパティはアルファベット順にソートされる', () => {
      const font = new CSSFont();
      font
        .setLineHeight('1.5')
        .setColor('#333')
        .setFontSize('16px')
        .setFontWeight('bold');

      const output = font.render();

      // アルファベット順: color < font-size < font-weight < line-height
      const colorIndex = output.indexOf('color:');
      const fontSizeIndex = output.indexOf('font-size:');
      const fontWeightIndex = output.indexOf('font-weight:');
      const lineHeightIndex = output.indexOf('line-height:');

      expect(colorIndex).toBeLessThan(fontSizeIndex);
      expect(fontSizeIndex).toBeLessThan(fontWeightIndex);
      expect(fontWeightIndex).toBeLessThan(lineHeightIndex);
    });

    it('各プロパティはセミコロンで終わる', () => {
      const font = new CSSFont();
      font.setFontSize('16px');

      const output = font.render();

      // 末尾にセミコロンが付くことを確認
      expect(output.trim()).toMatch(/;$/);
    });

    it('プロパティは key: value 形式で出力される', () => {
      const font = new CSSFont();
      font.setFontSize('16px');

      const output = font.render();

      // key: value 形式を確認
      expect(output).toMatch(/font-size:\s*16px/);
    });
  });
});
