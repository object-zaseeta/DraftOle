/**
 * Task 4.4: TextType テキストノードのテスト
 *
 * テキスト内容をそのまま返すレンダリングを検証し、
 * 属性追加・子要素追加が無効であることを確認する。
 *
 * Requirements: 3.4, 6.3
 */
import { describe, it, expect } from 'vitest';
import { TextType } from '../../src/html/elements/text-type.js';
import { Text } from '../../src/html/tags/factories-media.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import type { HTMLTagProtocol } from '../../src/html/protocols/html-tag-protocol.js';
import { HtmlTag } from '../../src/html/elements/html-tag.js';

// ── ダミー子要素（addChild テスト用） ──

class DummyTag extends HtmlTag {
  constructor() {
    super('div');
  }
}

describe('TextType テキストノード', () => {
  // ── コンストラクタ ──

  describe('コンストラクタ', () => {
    it('tagType が "text" である', () => {
      const sut = new TextType('Hello');
      expect(sut.tagType).toBe('text');
    });

    it('content プロパティが設定した文字列を返す（エスケープ済み）', () => {
      const sut = new TextType('Hello World');
      expect(sut.content).toBe('Hello World');
    });

    it('HTML特殊文字はデフォルトでエスケープされる', () => {
      const sut = new TextType('<script>alert("XSS")</script>');
      expect(sut.content).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('escape: false を渡すとエスケープされない', () => {
      const sut = new TextType('<em>raw</em>', { escape: false });
      expect(sut.content).toBe('<em>raw</em>');
    });

    it('TextType.raw() はエスケープされない TextType を返す', () => {
      const sut = TextType.raw('<strong>trusted</strong>');
      expect(sut.content).toBe('<strong>trusted</strong>');
    });
  });

  // ── protoRender (minified出力) ──

  describe('protoRender', () => {
    it('テキスト内容をそのまま返す', () => {
      const sut = new TextType('Hello World');
      expect(sut.protoRender()).toBe('Hello World');
    });

    it('空文字列を正しく処理する', () => {
      const sut = new TextType('');
      expect(sut.protoRender()).toBe('');
    });

    it('特殊文字はデフォルトでエスケープされる', () => {
      const sut = new TextType('<script>alert("XSS")</script>');
      expect(sut.protoRender()).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('HTML特殊文字（&, <, >, ", \'）はエスケープされる', () => {
      const sut = new TextType('A & B < C > D "E" F\'G');
      expect(sut.protoRender()).toBe('A &amp; B &lt; C &gt; D &quot;E&quot; F&#39;G');
    });

    it('escape: false の場合は特殊文字をそのまま返す', () => {
      const sut = new TextType('A & B < C >', { escape: false });
      expect(sut.protoRender()).toBe('A & B < C >');
    });

    it('TextType.raw() は生 HTML をそのまま返す', () => {
      const sut = TextType.raw('<em>trusted</em>');
      expect(sut.protoRender()).toBe('<em>trusted</em>');
    });

    it('Text.unsafeRaw() は生 HTML をそのまま返す', () => {
      const sut = Text.unsafeRaw('<em>trusted</em>');
      expect(sut.protoRender()).toBe('<em>trusted</em>');
    });

    it('Unicode文字をそのまま返す', () => {
      const sut = new TextType('日本語テスト 🎉 emoji');
      expect(sut.protoRender()).toBe('日本語テスト 🎉 emoji');
    });

    it('複数行テキストをそのまま返す', () => {
      const multiline = 'Line 1\nLine 2\nLine 3';
      const sut = new TextType(multiline);
      expect(sut.protoRender()).toBe('Line 1\nLine 2\nLine 3');
    });

    it('先頭・末尾の空白を保持する', () => {
      const sut = new TextType('  spaced  ');
      expect(sut.protoRender()).toBe('  spaced  ');
    });
  });

  // ── render (整形済み出力) ──

  describe('render', () => {
    it('テキスト内容をそのまま返す（テキストノードにフォーマットは適用されない）', () => {
      const sut = new TextType('Hello World');
      expect(sut.render()).toBe('Hello World');
    });

    it('空文字列の場合も空文字列を返す', () => {
      const sut = new TextType('');
      expect(sut.render()).toBe('');
    });
  });

  // ── 属性追加の無効化 (Req 3.4) ──

  describe('addHtmlAttribute（無効化）', () => {
    it('属性を追加しても attributes は空のままである', () => {
      const sut = new TextType('Hello');
      const attr = HtmlAttribute.keyValue('id', 'test');
      sut.addHtmlAttribute(attr);
      expect(sut.attributes).toEqual([]);
      expect(sut.attributes.length).toBe(0);
    });

    it('複数の属性を追加しても attributes は空のままである', () => {
      const sut = new TextType('Hello');
      sut.addHtmlAttribute(HtmlAttribute.keyValue('id', 'test'));
      sut.addHtmlAttribute(HtmlAttribute.className('highlight'));
      sut.addHtmlAttribute(HtmlAttribute.boolean('disabled'));
      expect(sut.attributes.length).toBe(0);
    });

    it('renderAttributes は空文字列を返す', () => {
      const sut = new TextType('Hello');
      sut.addHtmlAttribute(HtmlAttribute.keyValue('id', 'test'));
      expect(sut.renderAttributes()).toBe('');
    });
  });

  // ── 子要素追加の無効化 ──

  describe('addChild / addChildren（無効化）', () => {
    it('addChild で子要素を追加しても children は空のままである', () => {
      const sut = new TextType('Hello');
      const child = new DummyTag();
      sut.addChild(child);
      expect(sut.children).toEqual([]);
      expect(sut.children.length).toBe(0);
    });

    it('addChildren で複数の子要素を追加しても children は空のままである', () => {
      const sut = new TextType('Hello');
      const children = [new DummyTag(), new DummyTag()];
      sut.addChildren(children);
      expect(sut.children).toEqual([]);
      expect(sut.children.length).toBe(0);
    });
  });

  // ── HTMLTagProtocol 準拠 ──

  describe('HTMLTagProtocol 準拠', () => {
    it('TextType インスタンスが HTMLTagProtocol として使える', () => {
      const sut: HTMLTagProtocol = new TextType('Hello');
      expect(sut.tagType).toBe('text');
      expect(sut.children).toEqual([]);
      expect(sut.attributes).toEqual([]);
      expect(typeof sut.render).toBe('function');
      expect(typeof sut.protoRender).toBe('function');
      expect(typeof sut.addChild).toBe('function');
      expect(typeof sut.addChildren).toBe('function');
      expect(typeof sut.addHtmlAttribute).toBe('function');
    });
  });

  // ── CSS/JS スタブ ──

  describe('CSS/JS スタブ', () => {
    it('collectCssStyleString が空文字列を返す', () => {
      const sut = new TextType('Hello');
      expect(sut.collectCssStyleString()).toBe('');
    });

    it('collectJsContent が空文字列を返す', () => {
      const sut = new TextType('Hello');
      expect(sut.collectJsContent()).toBe('');
    });

    it('collectUsedMethods が空Setを返す', () => {
      const sut = new TextType('Hello');
      const methods = sut.collectUsedMethods();
      expect(methods).toBeInstanceOf(Set);
      expect(methods.size).toBe(0);
    });
  });
});
