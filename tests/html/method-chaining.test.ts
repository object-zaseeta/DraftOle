/**
 * メソッドチェーンのテスト
 *
 * addChild(), addChildren(), addHtmlAttribute() が this を返すことを検証する。
 * Task 4.1: HTMLTagProtocol のメソッドチェーン対応
 */
import { describe, it, expect } from 'vitest';
import { div, p, span, Text } from '../../src/html/tags/index.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';

describe('メソッドチェーン', () => {
  describe('addChild() チェーン', () => {
    it('addChild() が this を返し、連続呼び出し可能', () => {
      const container = div();
      const child1 = p();
      const child2 = span();

      // チェーン呼び出しが可能かをテスト
      const result = container
        .addChild(child1)
        .addChild(child2);

      // 戻り値が自身であることを確認
      expect(result).toBe(container);

      // 子要素が正しく追加されていることを確認
      expect(container.children.length).toBe(2);
      expect(container.children[0]).toBe(child1);
      expect(container.children[1]).toBe(child2);
    });

    it('addChild() チェーンの順序が子要素の順序と一致', () => {
      const container = div();
      const first = Text('First');
      const second = Text('Second');
      const third = Text('Third');

      container
        .addChild(first)
        .addChild(second)
        .addChild(third);

      const html = container.protoRender();
      expect(html).toContain('FirstSecondThird');
    });
  });

  describe('addChildren() チェーン', () => {
    it('addChildren() が this を返す', () => {
      const container = div();
      const children = [p(), span(), Text('content')];

      const result = container.addChildren(children);

      expect(result).toBe(container);
      expect(container.children.length).toBe(3);
    });

    it('addChild() と addChildren() を混在させてチェーン', () => {
      const container = div();
      const single1 = p();
      const batch = [span(), Text('batch')];
      const single2 = Text('single');

      container
        .addChild(single1)
        .addChildren(batch)
        .addChild(single2);

      expect(container.children.length).toBe(4);
      expect(container.children[0]).toBe(single1);
      expect(container.children[1]).toBe(batch[0]);
      expect(container.children[2]).toBe(batch[1]);
      expect(container.children[3]).toBe(single2);
    });
  });

  describe('addHtmlAttribute() チェーン', () => {
    it('addHtmlAttribute() が this を返す', () => {
      const element = div();
      const attr1 = HtmlAttribute.keyValue('id', 'main');
      const attr2 = HtmlAttribute.className('container');

      const result = element
        .addHtmlAttribute(attr1)
        .addHtmlAttribute(attr2);

      expect(result).toBe(element);
      expect(element.attributes.length).toBe(2);
    });

    it('addHtmlAttribute() チェーンが属性の追加順序を保持', () => {
      const element = div();

      element
        .addHtmlAttribute(HtmlAttribute.keyValue('id', 'first'))
        .addHtmlAttribute(HtmlAttribute.className('second'))
        .addHtmlAttribute(HtmlAttribute.keyValue('title', 'third'));

      const html = element.protoRender();
      // 属性の順序は追加順に一致するはず
      expect(html).toMatch(/id="first".*class="second".*title="third"/);
    });
  });

  describe('複合チェーン', () => {
    it('addChild() と addHtmlAttribute() を混在させてチェーン', () => {
      const container = div();
      const child = p();

      const result = container
        .addHtmlAttribute(HtmlAttribute.keyValue('id', 'wrapper'))
        .addChild(child)
        .addHtmlAttribute(HtmlAttribute.className('main'));

      expect(result).toBe(container);
      expect(container.children.length).toBe(1);
      expect(container.attributes.length).toBe(2);
    });

    it('複雑なチェーンで DOM 構造を構築', () => {
      const root = div();

      root
        .addHtmlAttribute(HtmlAttribute.keyValue('id', 'root'))
        .addChild(
          div()
            .addHtmlAttribute(HtmlAttribute.className('header'))
            .addChild(Text('Header'))
        )
        .addChildren([
          p().addChild(Text('Paragraph 1')),
          p().addChild(Text('Paragraph 2')),
        ])
        .addChild(
          div()
            .addHtmlAttribute(HtmlAttribute.className('footer'))
            .addChild(Text('Footer'))
        );

      const html = root.protoRender();
      expect(html).toContain('id="root"');
      expect(html).toContain('class="header"');
      expect(html).toContain('Header');
      expect(html).toContain('Paragraph 1');
      expect(html).toContain('Paragraph 2');
      expect(html).toContain('class="footer"');
      expect(html).toContain('Footer');
    });

    it('メソッドチェーンによる流暢なAPI体験', () => {
      // 実際のユースケース: カード構築
      const card = div()
        .addHtmlAttribute(HtmlAttribute.className('card'))
        .addChild(
          div()
            .addHtmlAttribute(HtmlAttribute.className('card-header'))
            .addChild(Text('Card Title'))
        )
        .addChild(
          div()
            .addHtmlAttribute(HtmlAttribute.className('card-body'))
            .addChildren([
              p().addChild(Text('Card content line 1')),
              p().addChild(Text('Card content line 2')),
            ])
        )
        .addChild(
          div()
            .addHtmlAttribute(HtmlAttribute.className('card-footer'))
            .addChild(Text('Card Footer'))
        );

      const html = card.protoRender();

      // 構造が正しく生成されていることを確認
      expect(html).toMatch(/<div class="card">[\s\S]*<\/div>/);
      expect(html).toContain('Card Title');
      expect(html).toContain('Card content line 1');
      expect(html).toContain('Card content line 2');
      expect(html).toContain('Card Footer');
    });
  });
});
