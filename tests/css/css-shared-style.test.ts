/**
 * CSS-1: class共有スタイル
 *
 * createStyle() で名前付きCSSクラスを定義し、
 * 複数要素に同じスタイルを適用する。
 */
import { describe, it, expect } from 'vitest';
import { createStyle } from '../../src/css/variables/css-shared-style.js';
import { rule } from '../../src/css/variables/global-dsl.js';
import { Root } from '../../src/html/elements/root.js';
import { div, section } from '../../src/html/tags/factories.js';

describe('CSS-1: class共有スタイル', () => {

  // ── createStyle 基本 ──

  describe('createStyle()', () => {
    it('クラス名を返す', () => {
      const style = createStyle('card', { padding: '16px' });
      expect(style.className).toBe('card');
    });

    it('.css がCSSルールを返す', () => {
      const style = createStyle('card', { padding: '16px', borderRadius: '14px' });
      expect(style.css).toContain('.card {');
      expect(style.css).toContain('padding: 16px;');
      expect(style.css).toContain('border-radius: 14px;');
      expect(style.css).toContain('}');
    });

    it('.toString() がクラス名を返す（テンプレートリテラル対応）', () => {
      const style = createStyle('btn', { padding: '10px' });
      expect(`${style}`).toBe('btn');
    });
  });

  // ── プロパティ名の変換 ──

  describe('プロパティ名変換（camelCase → kebab-case）', () => {
    it('camelCase を kebab-case に変換する', () => {
      const style = createStyle('test', {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        fontSize: '14px',
        marginTop: '10px',
      });
      expect(style.css).toContain('background-color: #1a1a1a;');
      expect(style.css).toContain('border-radius: 12px;');
      expect(style.css).toContain('font-size: 14px;');
      expect(style.css).toContain('margin-top: 10px;');
    });

    it('既に kebab-case のプロパティはそのまま', () => {
      const style = createStyle('test', {
        'box-shadow': '0 2px 4px rgba(0,0,0,0.1)',
      });
      expect(style.css).toContain('box-shadow: 0 2px 4px rgba(0,0,0,0.1);');
    });
  });

  // ── 要素への適用 ──

  describe('要素への適用', () => {
    it('class属性としてファクトリに渡せる', () => {
      const cardStyle = createStyle('card', { padding: '16px' });
      const el = section({ class: cardStyle.className }, 'Content');
      const html = el.protoRender();
      expect(html).toContain('class="card"');
    });

    it('.toString() でclass属性に渡せる', () => {
      const cardStyle = createStyle('card', { padding: '16px' });
      const el = div({ class: `${cardStyle}` }, 'Content');
      const html = el.protoRender();
      expect(html).toContain('class="card"');
    });

    it('複数要素に同じスタイルを適用できる', () => {
      const cardStyle = createStyle('card', { padding: '16px' });
      const el1 = section({ class: cardStyle.className }, 'Card 1');
      const el2 = section({ class: cardStyle.className }, 'Card 2');
      expect(el1.protoRender()).toContain('class="card"');
      expect(el2.protoRender()).toContain('class="card"');
      // CSSは1回だけ定義
      expect(cardStyle.css.match(/\.card/g)?.length).toBe(1);
    });
  });

  // ── Root 統合 ──

  describe('Root 統合', () => {
    it('new Root({ css: [rule(...)] }) で共有スタイルを注入できる', () => {
      const cardStyle = createStyle('card', {
        padding: '16px',
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.06)',
      });

      const root = new Root({
        css: [
          rule('.card', {
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.06)',
          }),
        ],
      });
      root.addChild(section({ class: cardStyle.className }, 'Content'));

      const css = root.collectCssStyleString();
      expect(css).toContain('.card {');
      expect(css).toContain('padding: 16px;');
      expect(css).toContain('border-radius: 14px;');
    });
  });

  // ── MVP Demo シナリオ ──

  describe('MVP Demo シナリオ', () => {
    it('card, btn, item スタイルを定義できる', () => {
      const card = createStyle('card', {
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: '16px',
        marginTop: '14px',
      });

      const btn = createStyle('btn', {
        padding: '10px 12px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.06)',
        color: 'var(--text)',
        cursor: 'pointer',
      });

      expect(card.css).toContain('.card {');
      expect(btn.css).toContain('.btn {');
      expect(card.className).toBe('card');
      expect(btn.className).toBe('btn');
    });
  });
});
