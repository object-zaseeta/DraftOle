/**
 * Task 9.3: ファクトリ関数ハイブリッドAPI統合テスト
 *
 * ファクトリ関数（宣言的構築）とCSSモジュール統合の結合テスト。
 * 宣言的パターンと命令的ミューテーションの両方を検証する。
 *
 * Requirements: 8.1-8.5, 9.1-9.5 統合
 */
import { describe, it, expect } from 'vitest';
import { div, h1, p, footer, Text } from '../../../src/html/index.js';
import { HtmlAttribute } from '../../../src/html/index.js';

describe('Task 9.3: Factory Hybrid API Integration', () => {
  describe('1. 宣言的構築パターンのrender()検証', () => {
    it('should render div with attributes and children', () => {
      const card = div({ class: 'card' },
        h1('タイトル'),
        p('本文')
      );

      const html = card.render();

      // 基本HTML構造の検証
      expect(html).toContain('<div class="card">');
      expect(html).toContain('<h1>');
      expect(html).toContain('タイトル');
      expect(html).toContain('<p>');
      expect(html).toContain('本文');
      expect(html).toContain('</div>');
    });

    it('should render div with multiple attributes', () => {
      const element = div({ class: 'container', id: 'main', 'data-test': 'value' },
        p('Content')
      );

      const html = element.render();

      expect(html).toContain('class="container"');
      expect(html).toContain('id="main"');
      expect(html).toContain('data-test="value"');
    });

    it('should render nested structure', () => {
      const page = div({ class: 'page' },
        div({ class: 'header' },
          h1('Page Title')
        ),
        div({ class: 'content' },
          p('Paragraph 1'),
          p('Paragraph 2')
        )
      );

      const html = page.render();

      expect(html).toContain('<div class="page">');
      expect(html).toContain('<div class="header">');
      expect(html).toContain('<div class="content">');
      expect(html).toContain('Page Title');
      expect(html).toContain('Paragraph 1');
      expect(html).toContain('Paragraph 2');
    });
  });

  describe('2. 命令的ミューテーションとの組み合わせ検証', () => {
    it('should combine declarative and imperative styles', () => {
      // 宣言的構築
      const card = div({ class: 'card' },
        h1('タイトル')
      );

      // 命令的ミューテーション
      card.addChild(p('本文'));
      card.addChild(footer(p('追記')));
      card.addHtmlAttribute(HtmlAttribute.keyValue('data-id', '123'));

      const html = card.render();

      expect(html).toContain('class="card"');
      expect(html).toContain('data-id="123"');
      expect(html).toContain('タイトル');
      expect(html).toContain('本文');
      expect(html).toContain('追記');
    });

    it('should allow adding children after creation', () => {
      const container = div();

      container.addChild(h1('Title'));
      container.addChild(p('Paragraph'));

      const html = container.render();

      expect(html).toContain('<h1>');
      expect(html).toContain('Title');
      expect(html).toContain('<p>');
      expect(html).toContain('Paragraph');
    });
  });

  describe('3. ファクトリ関数経由のCSSプロパティアクセス検証', () => {
    it('should access CSS properties via factory-created tag', () => {
      const card = div({ class: 'card' });

      // CSSプロパティアクセス
      card.css.styleManager.style.font.setFontSize('16px');
      card.css.styleManager.style.spacing.setMargin('10px');

      // CSS出力の検証（collectCssStyleString経由）
      const cssString = card.collectCssStyleString();

      expect(cssString).toContain('font-size: 16px');
      expect(cssString).toContain('margin: 10px');
    });

    it('should set multiple CSS properties', () => {
      const element = div();

      element.css.styleManager.style.font.setFontSize('14px');
      element.css.styleManager.style.font.setColor('#333');
      element.css.styleManager.style.spacing.setPadding('20px');
      element.css.styleManager.style.backgroundColor.setBackgroundColor('white');

      const cssString = element.collectCssStyleString();

      expect(cssString).toContain('font-size: 14px');
      expect(cssString).toContain('color: #333');
      expect(cssString).toContain('padding: 20px');
      expect(cssString).toContain('background-color: white');
    });

    it('should preserve CSS properties across children', () => {
      const parent = div();
      const child = div();

      parent.css.styleManager.style.font.setFontSize('16px');
      child.css.styleManager.style.font.setFontSize('12px');

      parent.addChild(child);

      const parentCss = parent.collectCssStyleString();
      const childCss = child.collectCssStyleString();

      expect(parentCss).toContain('font-size: 16px');
      expect(childCss).toContain('font-size: 12px');
      // 親と子のCSSは独立している
      expect(parentCss).not.toContain('font-size: 12px');
    });
  });

  describe('4. スコープドCSS統合検証', () => {
    it('should render scoped CSS via renderCss()', () => {
      const card = div();

      card.css.styleManager.style.font.setFontSize('16px');
      card.css.styleManager.style.spacing.setMargin('10px');

      // スコープドCSS出力
      const scopedCss = card.css.renderCss();

      // ハッシュクラス名形式を検証（例: ._a1b2c3d4）
      expect(scopedCss).toMatch(/\._[0-9a-f]{8}\s*\{/);
      expect(scopedCss).toContain('font-size: 16px');
      expect(scopedCss).toContain('margin: 10px');
    });

    it('should generate deterministic scoped class names', () => {
      const element1 = div();
      const element2 = div();

      element1.css.styleManager.style.font.setFontSize('14px');
      element2.css.styleManager.style.font.setFontSize('14px');

      // 同じスタイルでも、tagPathが異なれば異なるクラス名が生成される
      // ただし、同じ要素であれば同じクラス名が生成される（決定的）
      const css1 = element1.css.renderCss();
      const css2 = element1.css.renderCss(); // 同じ要素

      // 同じ要素は同じクラス名を生成
      expect(css1).toBe(css2);
    });

    it('should integrate scoped CSS with factory pattern', () => {
      const card = div({ class: 'card' },
        h1('Title'),
        p('Content')
      );

      card.css.styleManager.style.font.setFontSize('16px');
      card.css.styleManager.style.backgroundColor.setBackgroundColor('#f0f0f0');
      card.css.styleManager.style.spacing.setPadding('20px');

      const scopedCss = card.css.renderCss();

      expect(scopedCss).toMatch(/\._[0-9a-f]{8}\s*\{/);
      expect(scopedCss).toContain('font-size: 16px');
      expect(scopedCss).toContain('background-color: #f0f0f0');
      expect(scopedCss).toContain('padding: 20px');
    });
  });

  describe('5. テキストコンテンツのみ/子要素のみのパターン検証', () => {
    it('should render text content only (p("Hello"))', () => {
      const paragraph = p('Hello World');

      const html = paragraph.render();

      expect(html).toContain('<p>');
      expect(html).toContain('Hello World');
      expect(html).toContain('</p>');
    });

    it('should render children only (div(h1(), p()))', () => {
      const container = div(
        h1('Heading'),
        p('Paragraph')
      );

      const html = container.render();

      expect(html).toContain('<div>');
      expect(html).toContain('<h1>');
      expect(html).toContain('Heading');
      expect(html).toContain('<p>');
      expect(html).toContain('Paragraph');
      expect(html).toContain('</div>');
    });

    it('should render empty div when no arguments', () => {
      const empty = div();

      const html = empty.render();

      expect(html).toContain('<div>');
      expect(html).toContain('</div>');
    });

    it('should mix text and element children', () => {
      const mixed = div(
        'Text before',
        h1('Heading'),
        'Text after'
      );

      const html = mixed.render();

      expect(html).toContain('Text before');
      expect(html).toContain('<h1>');
      expect(html).toContain('Heading');
      expect(html).toContain('Text after');
    });
  });

  describe('6. 統合シナリオ（宣言的+CSS+スコープド）', () => {
    it('should handle complex hybrid scenario', () => {
      // 宣言的構築
      const card = div({ class: 'card', id: 'main-card' },
        h1('Card Title'),
        p('Card content')
      );

      // CSS設定
      card.css.styleManager.style.font.setFontSize('16px');
      card.css.styleManager.style.spacing.setMargin('20px');
      card.css.styleManager.style.spacing.setPadding('15px');
      card.css.styleManager.style.backgroundColor.setBackgroundColor('#ffffff');
      card.css.styleManager.style.border.setBorderRadius('8px');

      // 命令的ミューテーション
      card.addChild(footer(p('Footer text')));
      card.addHtmlAttribute(HtmlAttribute.keyValue('data-version', '1.0'));

      // HTML検証
      const html = card.render();
      expect(html).toContain('class="card"');
      expect(html).toContain('id="main-card"');
      expect(html).toContain('data-version="1.0"');
      expect(html).toContain('Card Title');
      expect(html).toContain('Card content');
      expect(html).toContain('Footer text');

      // インラインCSS検証
      const inlineCss = card.collectCssStyleString();
      expect(inlineCss).toContain('font-size: 16px');
      expect(inlineCss).toContain('margin: 20px');
      expect(inlineCss).toContain('padding: 15px');
      expect(inlineCss).toContain('background-color: #ffffff');
      expect(inlineCss).toContain('border-radius: 8px');

      // スコープドCSS検証
      const scopedCss = card.css.renderCss();
      expect(scopedCss).toMatch(/\._[0-9a-f]{8}\s*\{/);
      expect(scopedCss).toContain('font-size: 16px');
      expect(scopedCss).toContain('margin: 20px');
      expect(scopedCss).toContain('padding: 15px');
    });

    it('should handle nested elements with independent CSS', () => {
      const outer = div({ class: 'outer' });
      const inner = div({ class: 'inner' }, p('Inner content'));

      outer.css.styleManager.style.font.setFontSize('18px');
      outer.css.styleManager.style.spacing.setMargin('30px');

      inner.css.styleManager.style.font.setFontSize('14px');
      inner.css.styleManager.style.spacing.setPadding('10px');

      outer.addChild(inner);

      // 各要素のCSSは独立している
      const outerCss = outer.collectCssStyleString();
      const innerCss = inner.collectCssStyleString();

      expect(outerCss).toContain('font-size: 18px');
      expect(outerCss).toContain('margin: 30px');
      expect(outerCss).not.toContain('padding: 10px');

      expect(innerCss).toContain('font-size: 14px');
      expect(innerCss).toContain('padding: 10px');
      expect(innerCss).not.toContain('margin: 30px');
    });
  });
});
