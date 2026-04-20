/**
 * DF-2: スコープCSSクラスのHTML自動付与
 *
 * CSSが設定された要素に対して:
 * 1. tagPath が自動設定される（addChild時に親→子を伝播）
 * 2. スコープクラスがHTMLのclass属性に自動付与される
 * 3. collectCssStyleString がスコープ付きCSS（._hash { ... }）を返す
 */
import { describe, it, expect } from 'vitest';
import { div, p, h1, section, span, Text } from '../../src/html/tags/factories.js';
import { Root } from '../../src/html/elements/root.js';
import { generateScopedClassName } from '../../src/css/utils/scoped-css-generator.js';

describe('DF-2: スコープCSS自動付与', () => {

  // ── tagPath 自動設定 ──

  describe('tagPath 自動設定', () => {
    it('addChild 時に子要素の tagPath が自動設定される', () => {
      const parent = div();
      const child = p();
      parent.addChild(child);

      expect(child.css.tagPath).not.toBe('');
    });

    it('ネストした要素の tagPath はユニークになる', () => {
      const parent = div();
      const child1 = p();
      const child2 = span();
      parent.addChildren([child1, child2]);

      expect(child1.css.tagPath).not.toBe(child2.css.tagPath);
    });

    it('Root → html → body → div のチェーンで tagPath が伝播する', () => {
      const root = new Root();
      const container = div();
      const text = p();
      container.addChild(text);
      root.addChild(container);

      expect(text.css.tagPath).not.toBe('');
      expect(container.css.tagPath).not.toBe('');
    });
  });

  // ── スコープクラスのHTML自動付与 ──

  describe('スコープクラスのHTML付与', () => {
    it('CSSが設定された要素のHTMLにスコープクラスが付与される', () => {
      const el = div().padding('24px');
      const parent = div();
      parent.addChild(el);

      const html = parent.render();
      // スコープクラス（_で始まる8文字hex）が含まれる
      expect(html).toMatch(/class="[^"]*_[0-9a-f]{8}[^"]*"/);
    });

    it('CSS未設定の要素にはスコープクラスが付与されない', () => {
      const el = div();
      const parent = div();
      parent.addChild(el);

      const html = parent.render();
      // class属性がないか、スコープクラスがない
      expect(html).not.toMatch(/_[0-9a-f]{8}/);
    });

    it('異なる要素には異なるスコープクラスが付与される', () => {
      const parent = div();
      const child1 = p().color('#111');
      const child2 = span().color('#222');
      parent.addChildren([child1, child2]);

      const html = parent.render();
      const matches = html.match(/_[0-9a-f]{8}/g) ?? [];
      const unique = new Set(matches);
      expect(unique.size).toBeGreaterThanOrEqual(2);
    });
  });

  // ── collectCssStyleString がスコープ付きCSSを返す ──

  describe('スコープ付きCSS出力', () => {
    it('collectCssStyleString がスコープ付きCSS（._hash { ... }）を返す', () => {
      const parent = div();
      const child = p().fontSize('16px');
      parent.addChild(child);

      const css = parent.collectCssStyleString();
      // ._xxxxxxxx { font-size: 16px; } 形式
      expect(css).toMatch(/\._[0-9a-f]{8}\s*\{[^}]*font-size: 16px/);
    });

    it('HTMLのクラスとCSSのセレクタが一致する', () => {
      const parent = div();
      const child = p().fontSize('16px');
      parent.addChild(child);

      const html = parent.render();
      const css = parent.collectCssStyleString();

      // HTMLからスコープクラスを抽出
      const htmlClassMatch = html.match(/_([0-9a-f]{8})/);
      expect(htmlClassMatch).not.toBeNull();

      // CSSにも同じクラスが含まれる
      const scopeClass = `_${htmlClassMatch![1]}`;
      expect(css).toContain(`.${scopeClass}`);
    });
  });

  // ── 統合シナリオ ──

  describe('統合シナリオ', () => {
    it('Root経由でHTML+CSSを出力し、スコープが一致する', () => {
      const root = new Root();
      const container = div(
        h1(Text('Hello')).fontSize('32px').color('#fff'),
        p(Text('World')).fontSize('16px').color('#aaa'),
      ).padding('24px').background('#000');

      root.addChild(container);

      const html = root.render();
      const css = root.collectCssStyleString();

      // HTMLにスコープクラスが含まれる
      expect(html).toMatch(/_[0-9a-f]{8}/);
      // CSSにスコープセレクタが含まれる
      expect(css).toMatch(/\._[0-9a-f]{8}/);
      // CSSの内容が正しい
      expect(css).toContain('font-size: 32px');
      expect(css).toContain('padding: 24px');
      expect(css).toContain('background: #000');
    });
  });
});
