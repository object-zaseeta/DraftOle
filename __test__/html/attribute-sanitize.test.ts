/**
 * SEC-1: 属性値サニタイズ
 *
 * URL属性（href, src, action, formaction）に対して
 * 危険なスキーム（javascript:, vbscript:, data:）を検出・拒否する。
 */
import { describe, it, expect } from 'vitest';
import { a, img, form } from '../../src/html/tags/factories.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';

describe('SEC-1: 属性値サニタイズ', () => {

  // ── javascript: スキーム拒否 ──

  describe('javascript: スキーム', () => {
    it('href に javascript: を渡すと無害化される', () => {
      const el = a({ href: 'javascript:alert(1)' }, 'Click');
      const html = el.protoRender();
      expect(html).not.toContain('javascript:');
    });

    it('href に JavaScript: (大文字混在) を渡しても無害化される', () => {
      const el = a({ href: 'JavaScript:alert(1)' }, 'Click');
      const html = el.protoRender();
      expect(html).not.toContain('JavaScript:');
      expect(html).not.toContain('javascript:');
    });

    it('href に空白+javascript: を渡しても無害化される', () => {
      const el = a({ href: '  javascript:alert(1)' }, 'Click');
      const html = el.protoRender();
      expect(html).not.toContain('javascript:');
    });

    it('HtmlAttribute.keyValue で直接 javascript: を設定しても無害化', () => {
      const attr = HtmlAttribute.keyValue('href', 'javascript:void(0)');
      const rendered = attr.renderAttribute();
      expect(rendered).not.toContain('javascript:');
    });
  });

  // ── vbscript: / data: スキーム拒否 ──

  describe('その他の危険スキーム', () => {
    it('vbscript: を拒否', () => {
      const el = a({ href: 'vbscript:MsgBox("XSS")' }, 'Click');
      const html = el.protoRender();
      expect(html).not.toContain('vbscript:');
    });

    it('data:text/html を拒否', () => {
      const el = a({ href: 'data:text/html,<script>alert(1)</script>' }, 'Click');
      const html = el.protoRender();
      expect(html).not.toContain('data:text/html');
    });
  });

  // ── 安全なスキームは許可 ──

  describe('安全なスキームは通す', () => {
    it('https: は許可', () => {
      const el = a({ href: 'https://example.com' }, 'Link');
      const html = el.protoRender();
      expect(html).toContain('href="https://example.com"');
    });

    it('http: は許可', () => {
      const el = a({ href: 'http://example.com' }, 'Link');
      const html = el.protoRender();
      expect(html).toContain('href="http://example.com"');
    });

    it('mailto: は許可', () => {
      const el = a({ href: 'mailto:user@example.com' }, 'Email');
      const html = el.protoRender();
      expect(html).toContain('href="mailto:user@example.com"');
    });

    it('tel: は許可', () => {
      const el = a({ href: 'tel:+1234567890' }, 'Call');
      const html = el.protoRender();
      expect(html).toContain('href="tel:+1234567890"');
    });

    it('# (フラグメント) は許可', () => {
      const el = a({ href: '#section' }, 'Jump');
      const html = el.protoRender();
      expect(html).toContain('href="#section"');
    });

    it('/ (相対パス) は許可', () => {
      const el = a({ href: '/about' }, 'About');
      const html = el.protoRender();
      expect(html).toContain('href="/about"');
    });

    it('空文字列は許可', () => {
      const el = a({ href: '' }, 'Empty');
      const html = el.protoRender();
      expect(html).toContain('href=""');
    });
  });

  // ── src 属性 ──

  describe('src 属性', () => {
    it('img src に javascript: を渡すと無害化される', () => {
      const el = img({ src: 'javascript:alert(1)' });
      const html = el.protoRender();
      expect(html).not.toContain('javascript:');
    });

    it('img src に https: は許可', () => {
      const el = img({ src: 'https://example.com/image.png' });
      const html = el.protoRender();
      expect(html).toContain('src="https://example.com/image.png"');
    });
  });

  // ── action 属性 ──

  describe('action 属性', () => {
    it('form action に javascript: を渡すと無害化される', () => {
      const el = form({ action: 'javascript:steal()' }, 'Submit');
      const html = el.protoRender();
      expect(html).not.toContain('javascript:');
    });
  });
});
