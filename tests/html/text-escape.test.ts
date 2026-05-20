/**
 * DF-3: Text HTMLエスケープ
 *
 * Text() ファクトリ、文字列自動ラップ、TextType コンストラクタはすべてデフォルトでエスケープ。
 * 生 HTML には TextType.raw() / Text.unsafeRaw() / escape: false を使う。
 */
import { describe, it, expect } from 'vitest';
import { TextType } from '../../src/html/elements/text-type.js';
import { div, p, pre, code, Text } from '../../src/html/tags/factories.js';

describe('DF-3: Text HTMLエスケープ', () => {

  // ── Text() ファクトリはエスケープする ──

  describe('Text() ファクトリのエスケープ', () => {
    it('< と > をエスケープする', () => {
      const el = Text('<div>Hello</div>');
      expect(el.protoRender()).toBe('&lt;div&gt;Hello&lt;/div&gt;');
    });

    it('& をエスケープする', () => {
      const el = Text('A & B');
      expect(el.protoRender()).toBe('A &amp; B');
    });

    it('" をエスケープする', () => {
      const el = Text('say "hello"');
      expect(el.protoRender()).toBe('say &quot;hello&quot;');
    });

    it("' をエスケープする", () => {
      const el = Text("it's");
      expect(el.protoRender()).toBe('it&#39;s');
    });

    it('エスケープ不要な文字はそのまま', () => {
      const el = Text('Hello World 日本語');
      expect(el.protoRender()).toBe('Hello World 日本語');
    });
  });

  // ── 文字列自動ラップもエスケープする ──

  describe('ファクトリ関数の文字列自動ラップ', () => {
    it('p() に文字列を渡すとエスケープされる', () => {
      const el = p('<script>alert("XSS")</script>');
      const html = el.protoRender();
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('div() に文字列を渡すとエスケープされる', () => {
      const el = div('A & B < C');
      const html = el.protoRender();
      expect(html).toContain('A &amp; B &lt; C');
    });
  });

  // ── TextType コンストラクタはデフォルトでエスケープ ──

  describe('TextType コンストラクタ', () => {
    it('デフォルトでエスケープされる', () => {
      const el = new TextType('<b>bold</b>');
      expect(el.protoRender()).toBe('&lt;b&gt;bold&lt;/b&gt;');
    });

    it('escape: true で明示的にエスケープできる', () => {
      const el = new TextType('<b>bold</b>', { escape: true });
      expect(el.protoRender()).toBe('&lt;b&gt;bold&lt;/b&gt;');
    });

    it('escape: false で生 HTML を出力できる', () => {
      const el = new TextType('<b>bold</b>', { escape: false });
      expect(el.protoRender()).toBe('<b>bold</b>');
    });

    it('TextType.raw() で生 HTML を出力できる', () => {
      const el = TextType.raw('<b>bold</b>');
      expect(el.protoRender()).toBe('<b>bold</b>');
    });
  });

  // ── コード例シナリオ ──

  describe('コード例シナリオ', () => {
    it('pre>code 内のHTMLコードがエスケープされて表示される', () => {
      const codeBlock = pre(code(Text('<div class="card"><h2>Hello</h2></div>')));
      const html = codeBlock.protoRender();
      expect(html).toContain('&lt;div class=');
      expect(html).not.toContain('<div class="card">');
    });
  });
});
