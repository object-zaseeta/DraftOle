/**
 * Task 4.1: HtmlTag 基底抽象クラスのテスト
 *
 * 全タグ共通のレンダリングロジックと属性管理を検証する。
 * HtmlTag は abstract なので、テスト用の具象サブクラスを使って検証する。
 *
 * Requirements: 6.1, 6.2, 6.7
 */
import { describe, it, expect } from 'vitest';
import { HtmlTag } from '../../src/html/elements/html-tag.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import type { HTMLTagProtocol } from '../../src/html/protocols/html-tag-protocol.js';
import type { TagType } from '../../src/html/tags/tag-type.js';

// ── テスト用の具象サブクラス ──

/** ペアタグの振る舞いをテストするための具象クラス */
class TestPairTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

/** 自己終了タグの振る舞いをテストするための具象クラス */
class TestSelfClosingTag extends HtmlTag {
  constructor(tagType: TagType = 'br') {
    super(tagType);
  }

  override addChild(_child: HTMLTagProtocol): void {
    // 自己終了タグは子要素を無視
  }

  override addChildren(_children: ReadonlyArray<HTMLTagProtocol>): void {
    // 自己終了タグは子要素を無視
  }
}

/** テキストノードの振る舞いをテストするための具象クラス */
class TestTextNode extends HtmlTag {
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

/** ルート要素の振る舞いをテストするための具象クラス */
class TestRoot extends HtmlTag {
  constructor() {
    super('root');
  }
}

describe('HtmlTag 基底クラス', () => {
  // ── 子要素管理 ──

  describe('子要素管理', () => {
    it('初期状態で子要素が空配列である', () => {
      const tag = new TestPairTag();
      expect(tag.children).toEqual([]);
      expect(tag.children.length).toBe(0);
    });

    it('addChild で子要素を追加できる', () => {
      const parent = new TestPairTag();
      const child = new TestPairTag('p');
      parent.addChild(child);
      expect(parent.children.length).toBe(1);
      expect(parent.children[0]).toBe(child);
    });

    it('addChild で複数の子要素を追加順に保持する', () => {
      const parent = new TestPairTag();
      const child1 = new TestPairTag('p');
      const child2 = new TestPairTag('span');
      const child3 = new TestPairTag('div');
      parent.addChild(child1);
      parent.addChild(child2);
      parent.addChild(child3);
      expect(parent.children.length).toBe(3);
      expect(parent.children[0]).toBe(child1);
      expect(parent.children[1]).toBe(child2);
      expect(parent.children[2]).toBe(child3);
    });

    it('addChildren で一括追加できる', () => {
      const parent = new TestPairTag();
      const children = [
        new TestPairTag('p'),
        new TestPairTag('span'),
      ];
      parent.addChildren(children);
      expect(parent.children.length).toBe(2);
      expect(parent.children[0]).toBe(children[0]);
      expect(parent.children[1]).toBe(children[1]);
    });

    it('addChild と addChildren を組み合わせて追加順を保持する', () => {
      const parent = new TestPairTag();
      const child1 = new TestPairTag('p');
      parent.addChild(child1);
      const moreChildren = [
        new TestPairTag('span'),
        new TestPairTag('div'),
      ];
      parent.addChildren(moreChildren);
      expect(parent.children.length).toBe(3);
      expect(parent.children[0]).toBe(child1);
    });

    it('children は ReadonlyArray を返す', () => {
      const tag = new TestPairTag();
      const children = tag.children;
      expect(Array.isArray(children)).toBe(true);
    });
  });

  // ── 属性管理 ──

  describe('属性管理', () => {
    it('初期状態で属性が空配列である', () => {
      const tag = new TestPairTag();
      expect(tag.attributes).toEqual([]);
      expect(tag.attributes.length).toBe(0);
    });

    it('addHtmlAttribute で属性を追加できる', () => {
      const tag = new TestPairTag();
      const attr = HtmlAttribute.keyValue('id', 'test');
      tag.addHtmlAttribute(attr);
      expect(tag.attributes.length).toBe(1);
      expect(tag.attributes[0]).toBe(attr);
    });

    it('複数の属性を追加順に保持する', () => {
      const tag = new TestPairTag();
      const attr1 = HtmlAttribute.keyValue('id', 'main');
      const attr2 = HtmlAttribute.className('container');
      tag.addHtmlAttribute(attr1);
      tag.addHtmlAttribute(attr2);
      expect(tag.attributes.length).toBe(2);
      expect(tag.attributes[0]).toBe(attr1);
      expect(tag.attributes[1]).toBe(attr2);
    });

    it('renderAttributes が属性文字列を返す', () => {
      const tag = new TestPairTag();
      tag.addHtmlAttribute(HtmlAttribute.keyValue('id', 'test'));
      tag.addHtmlAttribute(HtmlAttribute.className('box'));
      const result = tag.renderAttributes();
      expect(result).toBe(' id="test" class="box"');
    });

    it('属性がない場合 renderAttributes は空文字列を返す', () => {
      const tag = new TestPairTag();
      expect(tag.renderAttributes()).toBe('');
    });

    it('Boolean属性が正しくレンダリングされる', () => {
      const tag = new TestPairTag();
      tag.addHtmlAttribute(HtmlAttribute.boolean('disabled'));
      expect(tag.renderAttributes()).toBe(' disabled');
    });
  });

  // ── protoRender (minified出力) ──

  describe('protoRender (minified出力)', () => {
    it('子要素なしのペアタグが <tag></tag> を返す', () => {
      const tag = new TestPairTag('div');
      expect(tag.protoRender()).toBe('<div></div>');
    });

    it('属性付きペアタグが <tag attrs></tag> を返す', () => {
      const tag = new TestPairTag('div');
      tag.addHtmlAttribute(HtmlAttribute.keyValue('id', 'main'));
      expect(tag.protoRender()).toBe('<div id="main"></div>');
    });

    it('子要素ありペアタグが <tag>children</tag> を返す', () => {
      const parent = new TestPairTag('div');
      const child = new TestPairTag('p');
      parent.addChild(child);
      expect(parent.protoRender()).toBe('<div><p></p></div>');
    });

    it('テキスト子要素を含むペアタグが正しく出力する', () => {
      const parent = new TestPairTag('p');
      const text = new TestTextNode('Hello');
      parent.addChild(text);
      expect(parent.protoRender()).toBe('<p>Hello</p>');
    });

    it('複数の子要素を連結して出力する', () => {
      const parent = new TestPairTag('div');
      const child1 = new TestPairTag('p');
      const child2 = new TestPairTag('span');
      parent.addChild(child1);
      parent.addChild(child2);
      expect(parent.protoRender()).toBe('<div><p></p><span></span></div>');
    });

    it('自己終了タグが <tag> を返す', () => {
      const tag = new TestSelfClosingTag('br');
      expect(tag.protoRender()).toBe('<br>');
    });

    it('属性付き自己終了タグが <tag attrs> を返す', () => {
      const tag = new TestSelfClosingTag('img');
      tag.addHtmlAttribute(HtmlAttribute.keyValue('src', 'photo.jpg'));
      expect(tag.protoRender()).toBe('<img src="photo.jpg">');
    });

    it('テキストノードがテキスト内容をそのまま返す', () => {
      const text = new TestTextNode('Hello World');
      expect(text.protoRender()).toBe('Hello World');
    });

    it('root要素が子要素のprotoRenderを連結して返す', () => {
      const root = new TestRoot();
      const child1 = new TestPairTag('div');
      const child2 = new TestPairTag('p');
      root.addChild(child1);
      root.addChild(child2);
      expect(root.protoRender()).toBe('<div></div><p></p>');
    });

    it('ネストした構造が正しいminified HTMLを生成する', () => {
      const div = new TestPairTag('div');
      div.addHtmlAttribute(HtmlAttribute.className('container'));
      const p = new TestPairTag('p');
      const text = new TestTextNode('Hello');
      p.addChild(text);
      div.addChild(p);
      expect(div.protoRender()).toBe('<div class="container"><p>Hello</p></div>');
    });
  });

  // ── render (整形済み出力) ──

  describe('render (整形済み出力)', () => {
    it('単一タグをそのまま返す', () => {
      const tag = new TestPairTag('div');
      expect(tag.render()).toBe('<div></div>');
    });

    it('ネストしたタグにインデントを付与する', () => {
      const parent = new TestPairTag('div');
      const child = new TestPairTag('p');
      const text = new TestTextNode('Hello');
      child.addChild(text);
      parent.addChild(child);
      expect(parent.render()).toBe('<div>\n    <p>Hello</p>\n</div>');
    });

    it('自己終了タグをそのまま返す', () => {
      const tag = new TestSelfClosingTag('br');
      expect(tag.render()).toBe('<br>');
    });

    it('テキストノードをそのまま返す', () => {
      const text = new TestTextNode('Hello');
      expect(text.render()).toBe('Hello');
    });
  });

  // ── CSS/JS コンポジション ──

  describe('CSS/JSコンポジション', () => {
    it('collectCssStyleString が空文字列を返す（CssManager未使用時）', () => {
      const tag = new TestPairTag();
      expect(tag.collectCssStyleString()).toBe('');
    });

    it('jqm アクセサが JQueryManagerInstance を返す', () => {
      const tag = new TestPairTag();
      expect(tag.jqm).toBeDefined();
      expect(typeof tag.jqm.css).toBe('function');
      expect(typeof tag.jqm.render).toBe('function');
    });

    describe('collectJsContent - 自身のJS収集', () => {
      it('JQueryManager未使用時は空文字列を返す', () => {
        const tag = new TestPairTag();
        expect(tag.collectJsContent()).toBe('');
      });

      it('自身のJQueryManagerのrender()を返す', () => {
        const tag = new TestPairTag();
        tag.jqm.text('Hello');
        const result = tag.collectJsContent();
        expect(result).toContain("text('Hello')");
      });

      it('複数のJS操作を ";\n" で結合して返す', () => {
        const tag = new TestPairTag();
        tag.jqm.text('Hello');
        tag.jqm.addClass('active');
        const result = tag.collectJsContent();
        expect(result).toContain("text('Hello')");
        expect(result).toContain("addClass('active')");
        expect(result).toMatch(/;\n/);
      });
    });

    describe('collectJsContent - 再帰的JS収集', () => {
      it('子要素のJSも収集する', () => {
        const parent = new TestPairTag('div');
        const child = new TestPairTag('p');
        child.jqm.text('Child text');
        parent.addChild(child);

        const result = parent.collectJsContent();
        expect(result).toContain("text('Child text')");
      });

      it('自身と子要素のJSを統合する', () => {
        const parent = new TestPairTag('div');
        parent.jqm.addClass('parent');

        const child = new TestPairTag('p');
        child.jqm.text('Child');

        parent.addChild(child);

        const result = parent.collectJsContent();
        expect(result).toContain("addClass('parent')");
        expect(result).toContain("text('Child')");
      });

      it('ネストした子孫のJSもすべて収集する', () => {
        const root = new TestPairTag('div');
        const child1 = new TestPairTag('section');
        const child2 = new TestPairTag('p');

        root.jqm.addClass('root');
        child1.jqm.addClass('section');
        child2.jqm.text('Deep text');

        child1.addChild(child2);
        root.addChild(child1);

        const result = root.collectJsContent();
        expect(result).toContain("addClass('root')");
        expect(result).toContain("addClass('section')");
        expect(result).toContain("text('Deep text')");
      });

      it('JS未使用の子要素は無視する', () => {
        const parent = new TestPairTag('div');
        parent.jqm.addClass('parent');

        const emptyChild = new TestPairTag('p');
        parent.addChild(emptyChild);

        const result = parent.collectJsContent();
        expect(result).toContain("addClass('parent')");
        expect(result).not.toContain('undefined');
      });
    });

    describe('collectUsedMethods - メソッド種別収集', () => {
      it('未使用時は空Setを返す', () => {
        const tag = new TestPairTag();
        const methods = tag.collectUsedMethods();
        expect(methods).toBeInstanceOf(Set);
        expect(methods.size).toBe(0);
      });

      it('自身のJQueryManagerで使用したメソッド種別を返す', () => {
        const tag = new TestPairTag();
        tag.jqm.text('Hello');
        tag.jqm.addClass('active');

        const methods = tag.collectUsedMethods();
        expect(methods.has('text')).toBe(true);
        expect(methods.has('addClass')).toBe(true);
        expect(methods.size).toBe(2);
      });

      it('子要素の使用メソッドも収集する', () => {
        const parent = new TestPairTag('div');
        const child = new TestPairTag('p');

        parent.jqm.addClass('parent');
        child.jqm.text('Child');
        child.jqm.css({ color: 'red' });

        parent.addChild(child);

        const methods = parent.collectUsedMethods();
        expect(methods.has('addClass')).toBe(true);
        expect(methods.has('text')).toBe(true);
        expect(methods.has('css')).toBe(true);
        expect(methods.size).toBe(3);
      });

      it('重複するメソッド種別はSetで自動除外される', () => {
        const parent = new TestPairTag('div');
        const child1 = new TestPairTag('p');
        const child2 = new TestPairTag('span');

        parent.jqm.addClass('parent');
        child1.jqm.addClass('child1');
        child2.jqm.addClass('child2');

        parent.addChild(child1);
        parent.addChild(child2);

        const methods = parent.collectUsedMethods();
        expect(methods.has('addClass')).toBe(true);
        expect(methods.size).toBe(1); // 重複除外
      });
    });
  });

  // ── tagType ──

  describe('tagType', () => {
    it('コンストラクタで設定したtagTypeを返す', () => {
      const div = new TestPairTag('div');
      expect(div.tagType).toBe('div');
    });

    it('異なるタグ種別を正しく保持する', () => {
      const p = new TestPairTag('p');
      const span = new TestPairTag('span');
      expect(p.tagType).toBe('p');
      expect(span.tagType).toBe('span');
    });
  });

  // ── HTMLTagProtocol 準拠 ──

  describe('HTMLTagProtocol 準拠', () => {
    it('HtmlTag インスタンスが HTMLTagProtocol として使える', () => {
      const tag: HTMLTagProtocol = new TestPairTag('div');
      expect(tag.tagType).toBe('div');
      expect(tag.children).toEqual([]);
      expect(tag.attributes).toEqual([]);
      expect(typeof tag.render).toBe('function');
      expect(typeof tag.protoRender).toBe('function');
      expect(typeof tag.addChild).toBe('function');
      expect(typeof tag.addChildren).toBe('function');
      expect(typeof tag.addHtmlAttribute).toBe('function');
    });
  });
});
