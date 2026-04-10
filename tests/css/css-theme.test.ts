/**
 * 6.5: CSS変数（createTheme + var()参照）
 *
 * 型安全なCSS変数定義。createTheme() でテーマを定義し、
 * プロパティアクセスで var(--name) を取得。
 * .css プロパティで :root { ... } ブロックを生成。
 */
import { describe, it, expect } from 'vitest';
import { createTheme } from '../../src/css/variables/css-theme.js';
import { Root } from '../../src/html/elements/root.js';
import { div } from '../../src/html/tags/factories.js';

describe('6.5: CSS変数（createTheme）', () => {

  // ── テーマ定義 ──

  describe('createTheme()', () => {
    it('プロパティが var(--name) を返す', () => {
      const theme = createTheme({ bg: '#0b1220', accent: '#7c5cff' });
      expect(theme.bg).toBe('var(--bg)');
      expect(theme.accent).toBe('var(--accent)');
    });

    it('.css が :root ブロックを返す', () => {
      const theme = createTheme({ bg: '#0b1220', accent: '#7c5cff' });
      const css = theme.css;
      expect(css).toContain(':root {');
      expect(css).toContain('--bg: #0b1220;');
      expect(css).toContain('--accent: #7c5cff;');
      expect(css).toContain('}');
    });

    it('空のテーマで空文字列を返す', () => {
      const theme = createTheme({});
      expect(theme.css).toBe('');
    });

    it('ハイフン区切りのキー名に対応', () => {
      const theme = createTheme({ 'accent-2': '#32d399' });
      expect(theme['accent-2']).toBe('var(--accent-2)');
      expect(theme.css).toContain('--accent-2: #32d399;');
    });
  });

  // ── Fluent API との統合 ──

  describe('Fluent API 統合', () => {
    it('theme.bg を .background() に渡せる', () => {
      const theme = createTheme({ bg: '#0b1220' });
      const el = div().background(theme.bg);
      expect(el.css.render()).toContain('background-color: var(--bg)');
    });

    it('theme.text を .color() に渡せる', () => {
      const theme = createTheme({ text: 'rgba(255,255,255,0.92)' });
      const el = div().color(theme.text);
      expect(el.css.render()).toContain('color: var(--text)');
    });

    it('theme.radius を .cornerRadius() に渡せる', () => {
      const theme = createTheme({ radius: '14px' });
      const el = div().cornerRadius(theme.radius);
      expect(el.css.render()).toContain('border-radius: var(--radius)');
    });
  });

  // ── Root 統合 ──

  describe('Root.addGlobalCss 統合', () => {
    it('theme.css を addGlobalCss で注入し、collectCssStyleString に含まれる', () => {
      const theme = createTheme({ bg: '#0b1220', accent: '#7c5cff' });
      const root = new Root();
      root.addGlobalCss(theme.css);

      const el = div().background(theme.bg);
      root.addChild(el);

      const css = root.collectCssStyleString();
      expect(css).toContain('--bg: #0b1220');
      expect(css).toContain('var(--bg)');
    });
  });

  // ── MVP Demo シナリオ ──

  describe('MVP Demo シナリオ', () => {
    it('MVP Demo のCSS変数定義を再現できる', () => {
      const theme = createTheme({
        bg: '#0b1220',
        panel: 'rgba(255, 255, 255, 0.06)',
        border: 'rgba(255, 255, 255, 0.12)',
        text: 'rgba(255, 255, 255, 0.92)',
        muted: 'rgba(255, 255, 255, 0.68)',
        accent: '#7c5cff',
        'accent-2': '#32d399',
        danger: '#ef4444',
        shadow: '0 18px 60px rgba(0, 0, 0, 0.35)',
        radius: '14px',
      });

      expect(theme.css).toContain(':root {');
      expect(theme.bg).toBe('var(--bg)');
      expect(theme.accent).toBe('var(--accent)');
      expect(theme['accent-2']).toBe('var(--accent-2)');
      expect(theme.radius).toBe('var(--radius)');
    });
  });
});
