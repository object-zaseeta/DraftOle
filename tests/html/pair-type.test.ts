/**
 * Task 4.2: PairType ペアタグ要素のテスト
 *
 * 開始・終了タグを持つペア要素の子要素管理とレンダリングを検証する。
 * PairType は HtmlTag を継承し、<tag attrs>children</tag> 形式でレンダリングする。
 *
 * Requirements: 3.2, 3.5, 3.6, 6.5, 6.8
 */
import { describe, it, expect } from 'vitest';
import { PairType } from '../../src/html/elements/pair-type.js';
import { HtmlTag } from '../../src/html/elements/html-tag.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import type { HTMLTagProtocol } from '../../src/html/protocols/html-tag-protocol.js';
import type { TagType } from '../../src/html/tags/tag-type.js';

// ── テスト用のテキストノードモック ──

/**
 * TextType がまだ実装されていないため、テスト用のモックを使用する。
 * protoRender() でテキスト内容をそのまま返す。
 */
class MockTextNode extends HtmlTag {
  private readonly content: string;

  constructor(content: string) {
    super('text');
    this.content = content;
  }

  override protoRender(): string {
    return this.content;
  }

  override addHtmlAttribute(): void {
    // テキストノードは属性を持たない
  }
}

describe('PairType ペアタグ要素', () => {
  // ── コンストラクタ ──

  describe('コンストラクタ', () => {
    it('指定した tagType を正しく保持する (div)', () => {
      const sut = new PairType('div');
      expect(sut.tagType).toBe('div');
    });

    it('指定した tagType を正しく保持する (p)', () => {
      const sut = new PairType('p');
      expect(sut.tagType).toBe('p');
    });

    it('指定した tagType を正しく保持する (span)', () => {
      const sut = new PairType('span');
      expect(sut.tagType).toBe('span');
    });

    it('指定した tagType を正しく保持する (h1)', () => {
      const sut = new PairType('h1');
      expect(sut.tagType).toBe('h1');
    });

    it('指定した tagType を正しく保持する (section)', () => {
      const sut = new PairType('section');
      expect(sut.tagType).toBe('section');
    });

    it('HtmlTag を継承している', () => {
      const sut = new PairType('div');
      expect(sut).toBeInstanceOf(HtmlTag);
    });

    it('HTMLTagProtocol として使用できる', () => {
      const sut: HTMLTagProtocol = new PairType('div');
      expect(sut.tagType).toBe('div');
      expect(typeof sut.render).toBe('function');
      expect(typeof sut.protoRender).toBe('function');
      expect(typeof sut.addChild).toBe('function');
      expect(typeof sut.addChildren).toBe('function');
      expect(typeof sut.addHtmlAttribute).toBe('function');
    });

    it('初期状態で子要素が空である', () => {
      const sut = new PairType('div');
      expect(sut.children).toEqual([]);
      expect(sut.children.length).toBe(0);
    });

    it('初期状態で属性が空である', () => {
      const sut = new PairType('div');
      expect(sut.attributes).toEqual([]);
      expect(sut.attributes.length).toBe(0);
    });
  });

  // ── 子要素管理 (Req 3.5, 3.6) ──

  describe('子要素管理', () => {
    it('addChild で子要素を1つ追加できる (Req 3.5)', () => {
      const sut = new PairType('div');
      const child = new PairType('p');
      sut.addChild(child);
      expect(sut.children.length).toBe(1);
      expect(sut.children[0]).toBe(child);
    });

    it('addChild で追加した子要素が追加順に保持される (Req 3.5)', () => {
      const sut = new PairType('div');
      const child1 = new PairType('p');
      const child2 = new PairType('span');
      const child3 = new PairType('article');
      sut.addChild(child1);
      sut.addChild(child2);
      sut.addChild(child3);
      expect(sut.children.length).toBe(3);
      expect(sut.children[0]).toBe(child1);
      expect(sut.children[1]).toBe(child2);
      expect(sut.children[2]).toBe(child3);
    });

    it('addChildren で複数の子要素を一括追加できる (Req 3.6)', () => {
      const sut = new PairType('ul');
      const children = [
        new PairType('li'),
        new PairType('li'),
        new PairType('li'),
      ];
      sut.addChildren(children);
      expect(sut.children.length).toBe(3);
      expect(sut.children[0]).toBe(children[0]);
      expect(sut.children[1]).toBe(children[1]);
      expect(sut.children[2]).toBe(children[2]);
    });

    it('addChildren で一括追加した子要素が追加順に保持される (Req 3.6)', () => {
      const sut = new PairType('div');
      const first = new PairType('header');
      const second = new PairType('main');
      const third = new PairType('footer');
      sut.addChildren([first, second, third]);
      expect(sut.children[0]).toBe(first);
      expect(sut.children[1]).toBe(second);
      expect(sut.children[2]).toBe(third);
    });

    it('addChild と addChildren を組み合わせて追加順を保持する', () => {
      const sut = new PairType('div');
      const child1 = new PairType('p');
      sut.addChild(child1);
      const moreChildren = [
        new PairType('span'),
        new PairType('section'),
      ];
      sut.addChildren(moreChildren);
      const child4 = new PairType('footer');
      sut.addChild(child4);
      expect(sut.children.length).toBe(4);
      expect(sut.children[0]).toBe(child1);
      expect(sut.children[1]).toBe(moreChildren[0]);
      expect(sut.children[2]).toBe(moreChildren[1]);
      expect(sut.children[3]).toBe(child4);
    });

    it('テキストノードを子要素として追加できる', () => {
      const sut = new PairType('p');
      const text = new MockTextNode('Hello World');
      sut.addChild(text);
      expect(sut.children.length).toBe(1);
      expect(sut.children[0]).toBe(text);
    });

    it('ペアタグとテキストノードを混在して追加できる', () => {
      const sut = new PairType('div');
      const text = new MockTextNode('some text');
      const child = new PairType('span');
      sut.addChild(text);
      sut.addChild(child);
      expect(sut.children.length).toBe(2);
      expect(sut.children[0]).toBe(text);
      expect(sut.children[1]).toBe(child);
    });

    it('空配列での addChildren は何も追加しない', () => {
      const sut = new PairType('div');
      sut.addChildren([]);
      expect(sut.children.length).toBe(0);
    });
  });

  // ── protoRender (minified出力) (Req 6.5, 6.8) ──

  describe('protoRender (minified出力)', () => {
    it('子要素が空の場合 <tag></tag> を返す (Req 6.8)', () => {
      const sut = new PairType('div');
      expect(sut.protoRender()).toBe('<div></div>');
    });

    it('子要素が空の <p></p> を返す (Req 6.8)', () => {
      const sut = new PairType('p');
      expect(sut.protoRender()).toBe('<p></p>');
    });

    it('子要素が空の <span></span> を返す (Req 6.8)', () => {
      const sut = new PairType('span');
      expect(sut.protoRender()).toBe('<span></span>');
    });

    it('子要素が空の <section></section> を返す (Req 6.8)', () => {
      const sut = new PairType('section');
      expect(sut.protoRender()).toBe('<section></section>');
    });

    it('子要素を含む <tag>children</tag> を返す (Req 6.5)', () => {
      const sut = new PairType('div');
      const child = new PairType('p');
      sut.addChild(child);
      expect(sut.protoRender()).toBe('<div><p></p></div>');
    });

    it('テキスト子要素を含む <tag>text</tag> を返す (Req 6.5)', () => {
      const sut = new PairType('p');
      const text = new MockTextNode('Hello');
      sut.addChild(text);
      expect(sut.protoRender()).toBe('<p>Hello</p>');
    });

    it('複数の子要素を連結して出力する (Req 6.5)', () => {
      const sut = new PairType('div');
      const child1 = new PairType('p');
      const child2 = new PairType('span');
      sut.addChild(child1);
      sut.addChild(child2);
      expect(sut.protoRender()).toBe('<div><p></p><span></span></div>');
    });

    it('属性付きで子要素なしの <tag attrs></tag> を返す', () => {
      const sut = new PairType('div');
      sut.addHtmlAttribute(HtmlAttribute.keyValue('id', 'main'));
      expect(sut.protoRender()).toBe('<div id="main"></div>');
    });

    it('属性付きで子要素ありの <tag attrs>children</tag> を返す (Req 6.5)', () => {
      const sut = new PairType('div');
      sut.addHtmlAttribute(HtmlAttribute.className('container'));
      const child = new PairType('p');
      sut.addChild(child);
      expect(sut.protoRender()).toBe('<div class="container"><p></p></div>');
    });

    it('複数属性と複数子要素を正しくレンダリングする', () => {
      const sut = new PairType('div');
      sut.addHtmlAttribute(HtmlAttribute.keyValue('id', 'app'));
      sut.addHtmlAttribute(HtmlAttribute.className('wrapper'));
      const h1 = new PairType('h1');
      const text = new MockTextNode('Title');
      h1.addChild(text);
      const p = new PairType('p');
      sut.addChild(h1);
      sut.addChild(p);
      expect(sut.protoRender()).toBe('<div id="app" class="wrapper"><h1>Title</h1><p></p></div>');
    });

    it('深いネストが正しくminified HTMLを生成する', () => {
      const div = new PairType('div');
      const ul = new PairType('ul');
      const li1 = new PairType('li');
      const li2 = new PairType('li');
      const text1 = new MockTextNode('Item 1');
      const text2 = new MockTextNode('Item 2');
      li1.addChild(text1);
      li2.addChild(text2);
      ul.addChild(li1);
      ul.addChild(li2);
      div.addChild(ul);
      expect(div.protoRender()).toBe('<div><ul><li>Item 1</li><li>Item 2</li></ul></div>');
    });

    it('Boolean属性付きペアタグを正しくレンダリングする', () => {
      const sut = new PairType('fieldset');
      sut.addHtmlAttribute(HtmlAttribute.boolean('disabled'));
      expect(sut.protoRender()).toBe('<fieldset disabled></fieldset>');
    });
  });

  // ── render (整形済み出力) ──

  describe('render (整形済み出力)', () => {
    it('子要素なしの空タグをそのまま返す', () => {
      const sut = new PairType('div');
      expect(sut.render()).toBe('<div></div>');
    });

    it('テキスト子要素を含むタグをインラインで返す', () => {
      const sut = new PairType('p');
      const text = new MockTextNode('Hello');
      sut.addChild(text);
      expect(sut.render()).toBe('<p>Hello</p>');
    });

    it('ネストしたタグにインデント(4スペース)を付与する', () => {
      const parent = new PairType('div');
      const child = new PairType('p');
      const text = new MockTextNode('Hello');
      child.addChild(text);
      parent.addChild(child);
      expect(parent.render()).toBe('<div>\n    <p>Hello</p>\n</div>');
    });

    it('複数子要素にそれぞれインデントを付与する', () => {
      const parent = new PairType('div');
      const child1 = new PairType('p');
      const child2 = new PairType('span');
      const text1 = new MockTextNode('First');
      const text2 = new MockTextNode('Second');
      child1.addChild(text1);
      child2.addChild(text2);
      parent.addChild(child1);
      parent.addChild(child2);
      expect(parent.render()).toBe(
        '<div>\n    <p>First</p>\n    <span>Second</span>\n</div>'
      );
    });

    it('深いネストで正しいインデントを生成する', () => {
      const outer = new PairType('div');
      const inner = new PairType('div');
      const p = new PairType('p');
      const text = new MockTextNode('Deep');
      p.addChild(text);
      inner.addChild(p);
      outer.addChild(inner);
      expect(outer.render()).toBe(
        '<div>\n    <div>\n        <p>Deep</p>\n    </div>\n</div>'
      );
    });

    it('属性付きタグの整形済み出力が正しい', () => {
      const parent = new PairType('div');
      parent.addHtmlAttribute(HtmlAttribute.className('container'));
      const child = new PairType('p');
      const text = new MockTextNode('Content');
      child.addChild(text);
      parent.addChild(child);
      expect(parent.render()).toBe(
        '<div class="container">\n    <p>Content</p>\n</div>'
      );
    });
  });

  // ── 異なるタグ種別での動作検証 ──

  describe('異なるタグ種別での動作', () => {
    const pairTagNames: TagType[] = [
      'div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'header', 'footer', 'nav', 'main', 'section', 'article',
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
      'form', 'button', 'a', 'strong', 'em',
    ];

    it.each(pairTagNames)(
      '<%s> が正しいペアタグ形式で空タグをレンダリングする',
      (tagName) => {
        const sut = new PairType(tagName);
        expect(sut.protoRender()).toBe(`<${tagName}></${tagName}>`);
      }
    );

    it.each(pairTagNames)(
      '<%s> が子要素を含むペアタグ形式でレンダリングする',
      (tagName) => {
        const sut = new PairType(tagName);
        const text = new MockTextNode('content');
        sut.addChild(text);
        expect(sut.protoRender()).toBe(`<${tagName}>content</${tagName}>`);
      }
    );
  });

  // ── CSS/JS スタブ（HtmlTag基底からの継承） ──

  describe('CSS/JSスタブ', () => {
    it('collectCssStyleString が空文字列を返す', () => {
      const sut = new PairType('div');
      expect(sut.collectCssStyleString()).toBe('');
    });

    it('collectJsContent が空文字列を返す', () => {
      const sut = new PairType('div');
      expect(sut.collectJsContent()).toBe('');
    });

    it('collectUsedMethods が空Setを返す', () => {
      const sut = new PairType('div');
      const methods = sut.collectUsedMethods();
      expect(methods).toBeInstanceOf(Set);
      expect(methods.size).toBe(0);
    });
  });
});
