/**
 * Task 4.3: SelfClosingType 自己終了タグ要素のテスト
 *
 * 自己終了タグ（br, hr, img, input, meta, link 等）のレンダリングと
 * 子要素追加の無視動作を検証する。
 *
 * Requirements: 3.3, 6.4, 10.1
 */
import { describe, it, expect } from 'vitest';
import { SelfClosingType } from '../../src/html/elements/self-closing-type.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import { SELF_CLOSING_TAGS } from '../../src/html/tags/tag-type.js';
import type { HTMLTagProtocol } from '../../src/html/protocols/html-tag-protocol.js';
import type { TagType } from '../../src/html/tags/tag-type.js';
import { HtmlTag } from '../../src/html/elements/html-tag.js';

// ── テスト用ヘルパー ──

/** addChild/addChildren に渡すためのダミー子要素 */
class DummyChild extends HtmlTag {
  constructor() {
    super('span');
  }
}

describe('SelfClosingType', () => {
  // ── コンストラクタ ──

  describe('コンストラクタ', () => {
    it('br タグで SelfClosingType を生成できる', () => {
      const tag = new SelfClosingType('br');
      expect(tag.tagType).toBe('br');
    });

    it('hr タグで SelfClosingType を生成できる', () => {
      const tag = new SelfClosingType('hr');
      expect(tag.tagType).toBe('hr');
    });

    it('img タグで SelfClosingType を生成できる', () => {
      const tag = new SelfClosingType('img');
      expect(tag.tagType).toBe('img');
    });

    it('input タグで SelfClosingType を生成できる', () => {
      const tag = new SelfClosingType('input');
      expect(tag.tagType).toBe('input');
    });

    it('meta タグで SelfClosingType を生成できる', () => {
      const tag = new SelfClosingType('meta');
      expect(tag.tagType).toBe('meta');
    });

    it('link タグで SelfClosingType を生成できる', () => {
      const tag = new SelfClosingType('link');
      expect(tag.tagType).toBe('link');
    });

    it('初期状態で子要素が空配列である', () => {
      const tag = new SelfClosingType('br');
      expect(tag.children).toEqual([]);
      expect(tag.children.length).toBe(0);
    });

    it('初期状態で属性が空配列である', () => {
      const tag = new SelfClosingType('br');
      expect(tag.attributes).toEqual([]);
      expect(tag.attributes.length).toBe(0);
    });
  });

  // ── protoRender (minified出力) ── (Req 6.4)

  describe('protoRender', () => {
    it('<br> 形式でレンダリングする', () => {
      const tag = new SelfClosingType('br');
      expect(tag.protoRender()).toBe('<br>');
    });

    it('<hr> 形式でレンダリングする', () => {
      const tag = new SelfClosingType('hr');
      expect(tag.protoRender()).toBe('<hr>');
    });

    it('<img> 形式でレンダリングする', () => {
      const tag = new SelfClosingType('img');
      expect(tag.protoRender()).toBe('<img>');
    });

    it('属性付きで <img src="photo.jpg"> 形式でレンダリングする', () => {
      const tag = new SelfClosingType('img');
      tag.addHtmlAttribute(HtmlAttribute.keyValue('src', 'photo.jpg'));
      expect(tag.protoRender()).toBe('<img src="photo.jpg">');
    });

    it('複数属性付きで <img src="photo.jpg" alt="写真"> 形式でレンダリングする', () => {
      const tag = new SelfClosingType('img');
      tag.addHtmlAttribute(HtmlAttribute.keyValue('src', 'photo.jpg'));
      tag.addHtmlAttribute(HtmlAttribute.keyValue('alt', '写真'));
      expect(tag.protoRender()).toBe('<img src="photo.jpg" alt="写真">');
    });

    it('Boolean属性付きで <input disabled> 形式でレンダリングする', () => {
      const tag = new SelfClosingType('input');
      tag.addHtmlAttribute(HtmlAttribute.boolean('disabled'));
      expect(tag.protoRender()).toBe('<input disabled>');
    });

    it('KeyValue + Boolean属性の混合で正しくレンダリングする', () => {
      const tag = new SelfClosingType('input');
      tag.addHtmlAttribute(HtmlAttribute.inputType('text'));
      tag.addHtmlAttribute(HtmlAttribute.keyValue('name', 'username'));
      tag.addHtmlAttribute(HtmlAttribute.boolean('required'));
      expect(tag.protoRender()).toBe('<input type="text" name="username" required>');
    });

    it('meta タグが属性付きで正しくレンダリングする', () => {
      const tag = new SelfClosingType('meta');
      tag.addHtmlAttribute(HtmlAttribute.keyValue('charset', 'utf-8'));
      expect(tag.protoRender()).toBe('<meta charset="utf-8">');
    });

    it('link タグが属性付きで正しくレンダリングする', () => {
      const tag = new SelfClosingType('link');
      tag.addHtmlAttribute(HtmlAttribute.keyValue('rel', 'stylesheet'));
      tag.addHtmlAttribute(HtmlAttribute.keyValue('href', 'style.css'));
      expect(tag.protoRender()).toBe('<link rel="stylesheet" href="style.css">');
    });
  });

  // ── render (整形済み出力) ──

  describe('render', () => {
    it('自己終了タグをそのまま返す（単一トークンなのでフォーマット不要）', () => {
      const tag = new SelfClosingType('br');
      expect(tag.render()).toBe('<br>');
    });

    it('属性付き自己終了タグをそのまま返す', () => {
      const tag = new SelfClosingType('img');
      tag.addHtmlAttribute(HtmlAttribute.keyValue('src', 'photo.jpg'));
      expect(tag.render()).toBe('<img src="photo.jpg">');
    });
  });

  // ── addChild の無視動作 ── (Req 10.1)

  describe('addChild の無視動作', () => {
    it('addChild を呼んでも子要素が追加されない', () => {
      const tag = new SelfClosingType('br');
      const child = new DummyChild();
      tag.addChild(child);
      expect(tag.children.length).toBe(0);
      expect(tag.children).toEqual([]);
    });

    it('addChild を複数回呼んでも子要素が追加されない', () => {
      const tag = new SelfClosingType('img');
      tag.addChild(new DummyChild());
      tag.addChild(new DummyChild());
      tag.addChild(new DummyChild());
      expect(tag.children.length).toBe(0);
    });

    it('addChild 後も protoRender が <tag> 形式のままである', () => {
      const tag = new SelfClosingType('hr');
      tag.addChild(new DummyChild());
      expect(tag.protoRender()).toBe('<hr>');
    });
  });

  // ── addChildren の無視動作 ── (Req 10.1)

  describe('addChildren の無視動作', () => {
    it('addChildren を呼んでも子要素が追加されない', () => {
      const tag = new SelfClosingType('br');
      const children = [new DummyChild(), new DummyChild()];
      tag.addChildren(children);
      expect(tag.children.length).toBe(0);
      expect(tag.children).toEqual([]);
    });

    it('空配列で addChildren を呼んでも子要素が空のままである', () => {
      const tag = new SelfClosingType('br');
      tag.addChildren([]);
      expect(tag.children.length).toBe(0);
    });

    it('addChildren 後も protoRender が <tag> 形式のままである', () => {
      const tag = new SelfClosingType('input');
      tag.addChildren([new DummyChild(), new DummyChild()]);
      expect(tag.protoRender()).toBe('<input>');
    });
  });

  // ── addChild と addChildren の組み合わせ ──

  describe('addChild と addChildren の組み合わせ', () => {
    it('addChild と addChildren を交互に呼んでも子要素が空のままである', () => {
      const tag = new SelfClosingType('br');
      tag.addChild(new DummyChild());
      tag.addChildren([new DummyChild(), new DummyChild()]);
      tag.addChild(new DummyChild());
      expect(tag.children.length).toBe(0);
    });
  });

  // ── 全自己終了タグ種別での動作 ── (Req 3.3)

  describe('全自己終了タグ種別での動作', () => {
    const selfClosingTagTypes: TagType[] = [
      'br', 'hr', 'img', 'input', 'meta', 'link',
      'source', 'track', 'area', 'col', 'base', 'embed', 'wbr',
    ];

    it.each(selfClosingTagTypes)(
      '%s タグが <tag> 形式でレンダリングされる',
      (tagType) => {
        const tag = new SelfClosingType(tagType);
        expect(tag.protoRender()).toBe(`<${tagType}>`);
      },
    );

    it.each(selfClosingTagTypes)(
      '%s タグで addChild が無視される',
      (tagType) => {
        const tag = new SelfClosingType(tagType);
        tag.addChild(new DummyChild());
        expect(tag.children.length).toBe(0);
      },
    );

    it.each(selfClosingTagTypes)(
      '%s タグが SELF_CLOSING_TAGS に含まれる',
      (tagType) => {
        expect(SELF_CLOSING_TAGS.has(tagType)).toBe(true);
      },
    );
  });

  // ── HTMLTagProtocol 準拠 ──

  describe('HTMLTagProtocol 準拠', () => {
    it('SelfClosingType が HTMLTagProtocol として使える', () => {
      const tag: HTMLTagProtocol = new SelfClosingType('br');
      expect(tag.tagType).toBe('br');
      expect(tag.children).toEqual([]);
      expect(tag.attributes).toEqual([]);
      expect(typeof tag.render).toBe('function');
      expect(typeof tag.protoRender).toBe('function');
      expect(typeof tag.addChild).toBe('function');
      expect(typeof tag.addChildren).toBe('function');
      expect(typeof tag.addHtmlAttribute).toBe('function');
    });
  });

  // ── 属性管理（基底クラスから継承） ──

  describe('属性管理', () => {
    it('addHtmlAttribute で属性を追加できる', () => {
      const tag = new SelfClosingType('img');
      const attr = HtmlAttribute.keyValue('src', 'photo.jpg');
      tag.addHtmlAttribute(attr);
      expect(tag.attributes.length).toBe(1);
      expect(tag.attributes[0]).toBe(attr);
    });

    it('複数の属性を追加順に保持する', () => {
      const tag = new SelfClosingType('img');
      const attr1 = HtmlAttribute.keyValue('src', 'photo.jpg');
      const attr2 = HtmlAttribute.keyValue('alt', 'A photo');
      tag.addHtmlAttribute(attr1);
      tag.addHtmlAttribute(attr2);
      expect(tag.attributes.length).toBe(2);
      expect(tag.attributes[0]).toBe(attr1);
      expect(tag.attributes[1]).toBe(attr2);
    });
  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    it('属性値にHTMLの特殊文字を含む場合にエスケープされる', () => {
      const tag = new SelfClosingType('img');
      tag.addHtmlAttribute(HtmlAttribute.keyValue('alt', '<script>alert("xss")</script>'));
      expect(tag.protoRender()).toBe('<img alt="&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;">');
    });

    it('class 属性を付与できる', () => {
      const tag = new SelfClosingType('input');
      tag.addHtmlAttribute(HtmlAttribute.className('form-control', 'large'));
      expect(tag.protoRender()).toBe('<input class="form-control large">');
    });

    it('ARIA 属性を付与できる', () => {
      const tag = new SelfClosingType('input');
      tag.addHtmlAttribute(HtmlAttribute.ariaLabel('ユーザー名'));
      expect(tag.protoRender()).toBe('<input aria-label="ユーザー名">');
    });

    it('カスタム data-* 属性を付与できる', () => {
      const tag = new SelfClosingType('input');
      tag.addHtmlAttribute(HtmlAttribute.custom('testid', 'username-field'));
      expect(tag.protoRender()).toBe('<input data-testid="username-field">');
    });
  });
});
