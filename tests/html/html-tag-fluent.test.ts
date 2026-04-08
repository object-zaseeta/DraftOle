/**
 * D-3.1: HtmlTag Fluent CSS メソッド
 *
 * SwiftUIライクな宣言的スタイリングAPI。
 * element.padding('24px').background('#3b82f6').cornerRadius('8px')
 */
import { describe, it, expect } from 'vitest';
import { div, h1, p, a, section, Text } from '../../src/html/tags/factories.js';

describe('D-3.1: Fluent CSS メソッド', () => {

  // ── style ショートカット（5段階→3段階） ──

  describe('style ショートカット', () => {
    it('element.style で HtmlStyle にアクセスできる', () => {
      const el = div();
      expect(el.style).toBeDefined();
      expect(el.style.font).toBeDefined();
      expect(el.style.spacing).toBeDefined();
    });

    it('element.style は element.css.styleManager.style と同じインスタンス', () => {
      const el = div();
      expect(el.style).toBe(el.css.styleManager.style);
    });

    it('3段階チェーンでスタイルを設定できる', () => {
      const el = div();
      el.style.font.setFontSize('24px');
      const css = el.css.render();
      expect(css).toContain('font-size: 24px');
    });
  });

  // ── Fluent メソッド（1段階チェーン） ──

  describe('Fluent メソッド基本', () => {
    it('.padding() で padding を設定', () => {
      const el = div().padding('24px');
      expect(el.css.render()).toContain('padding: 24px');
    });

    it('.margin() で margin を設定', () => {
      const el = div().margin('10px');
      expect(el.css.render()).toContain('margin: 10px');
    });

    it('.background() で background-color を設定', () => {
      const el = div().background('#1a1a1a');
      expect(el.css.render()).toContain('background-color: #1a1a1a');
    });

    it('.color() で color を設定', () => {
      const el = div().color('#ffffff');
      expect(el.css.render()).toContain('color: #ffffff');
    });

    it('.fontSize() で font-size を設定', () => {
      const el = div().fontSize('16px');
      expect(el.css.render()).toContain('font-size: 16px');
    });

    it('.fontWeight() で font-weight を設定', () => {
      const el = div().fontWeight('700');
      expect(el.css.render()).toContain('font-weight: 700');
    });

    it('.fontFamily() で font-family を設定', () => {
      const el = div().fontFamily('Inter, sans-serif');
      expect(el.css.render()).toContain('font-family: Inter, sans-serif');
    });

    it('.lineHeight() で line-height を設定', () => {
      const el = div().lineHeight('1.6');
      expect(el.css.render()).toContain('line-height: 1.6');
    });

    it('.cornerRadius() で border-radius を設定', () => {
      const el = div().cornerRadius('8px');
      expect(el.css.render()).toContain('border-radius: 8px');
    });

    it('.display() で display を設定', () => {
      const el = div().display('flex');
      expect(el.css.render()).toContain('display: flex');
    });

    it('.width() で width を設定', () => {
      const el = div().width('100%');
      expect(el.css.render()).toContain('width: 100%');
    });

    it('.height() で height を設定', () => {
      const el = div().height('200px');
      expect(el.css.render()).toContain('height: 200px');
    });

    it('.maxWidth() で max-width を設定', () => {
      const el = div().maxWidth('1200px');
      expect(el.css.render()).toContain('max-width: 1200px');
    });

    it('.textAlign() で text-align を設定', () => {
      const el = div().textAlign('center');
      expect(el.css.render()).toContain('text-align: center');
    });

    it('.textDecoration() で text-decoration を設定', () => {
      const el = a().textDecoration('none');
      expect(el.css.render()).toContain('text-decoration: none');
    });

    it('.overflow() で overflow を設定', () => {
      const el = div().overflow('auto');
      expect(el.css.render()).toContain('overflow: auto');
    });

    it('.opacity() で opacity を設定', () => {
      const el = div().opacity('0.5');
      expect(el.css.render()).toContain('opacity: 0.5');
    });

    it('.gap() で gap を設定', () => {
      const el = div().gap('16px');
      expect(el.css.render()).toContain('gap: 16px');
    });

    it('.flexGrow() で flex-grow を設定', () => {
      const el = div().flexGrow('1');
      expect(el.css.render()).toContain('flex-grow: 1');
    });

    it('.boxShadow() で box-shadow を設定', () => {
      const el = div().boxShadow('0 2px 4px rgba(0,0,0,0.1)');
      expect(el.css.render()).toContain('box-shadow: 0 2px 4px rgba(0,0,0,0.1)');
    });
  });

  // ── メソッドチェーン ──

  describe('メソッドチェーン', () => {
    it('複数のFluentメソッドをチェーンできる', () => {
      const el = div()
        .padding('24px')
        .background('#1a1a1a')
        .cornerRadius('12px');

      const css = el.css.render();
      expect(css).toContain('padding: 24px');
      expect(css).toContain('background-color: #1a1a1a');
      expect(css).toContain('border-radius: 12px');
    });

    it('ファクトリ関数から直接チェーンできる', () => {
      const el = h1(Text('Hello'))
        .fontSize('48px')
        .fontWeight('700')
        .color('#ffffff');

      const css = el.css.render();
      expect(css).toContain('font-size: 48px');
      expect(css).toContain('font-weight: 700');
      expect(css).toContain('color: #ffffff');
    });

    it('addChild とFluentメソッドを混在できる', () => {
      const el = div()
        .padding('24px')
        .background('#000');

      el.addChild(p(Text('Hello')));

      expect(el.css.render()).toContain('padding: 24px');
      expect(el.children.length).toBe(1);
    });
  });

  // ── LP再構築シナリオ ──

  describe('LP構築シナリオ（SwiftUIライク）', () => {
    it('ヒーローセクションをSwiftUIライクに構築できる', () => {
      const hero = section(
        h1(Text('HTML, CSS, JS — TypeScript ひとつで。'))
          .fontSize('48px')
          .fontWeight('700')
          .color('#ffffff')
          .margin('0 0 24px 0'),
        p(Text('型安全なDSLでWebページを丸ごと生成'))
          .fontSize('20px')
          .color('#a0a0a0'),
        a({ href: '#' }, Text('Get Started'))
          .display('inline-block')
          .padding('16px 40px')
          .background('#3b82f6')
          .color('#ffffff')
          .cornerRadius('8px')
          .textDecoration('none'),
      )
      .padding('120px 0 80px')
      .textAlign('center');

      const html = hero.render();
      expect(html).toContain('<section');
      expect(html).toContain('<h1');
      expect(html).toContain('Get Started');

      const css = hero.collectCssStyleString();
      expect(css).toContain('font-size: 48px');
      expect(css).toContain('padding: 16px 40px');
      expect(css).toContain('background-color: #3b82f6');
      expect(css).toContain('border-radius: 8px');
    });
  });
});
