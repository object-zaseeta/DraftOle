/**
 * Task 5.1 (swiftui-layout): `HtmlTag.responsive()` 修飾子のテスト。
 *
 * `.responsive(options: BreakpointStyles): this` メソッドが以下を満たすことを検証する:
 * - 名前付きキー（sm/md/lg/xl）を数値ブレークポイントに解決する
 * - 数値キーをそのままブレークポイントとして使用する
 * - `renderCss()` 出力の末尾に `@media (min-width: {bp}px)` ブロックが含まれる
 * - 空オブジェクト呼び出しは出力を変更しない
 * - メソッドチェーンで `this` を返す
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 * Design: D-4.x .responsive() 修飾子
 */
import { describe, expect, it } from 'vitest';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import type { TagType } from '../../../src/html/tags/tag-type.js';

/** テスト用の具象サブクラス（`HtmlTag` は abstract なため） */
class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

describe('HtmlTag.responsive() (Task 5.1)', () => {
  // ── 要件 9.1: 名前付きキー → @media ブロック ──
  describe('9.1: md キーが @media (min-width: 768px) ブロックを生成する', () => {
    it('.responsive({ md: { padding: "16px" } }) 後に renderCss() が @media (min-width: 768px) を含む', () => {
      const tag = new TestTag();
      tag.responsive({ md: { padding: '16px' } });
      const css = tag.css.renderCss();
      expect(css).toContain('@media (min-width: 768px)');
      expect(css).toContain('padding: 16px');
    });

    it('.responsive({ sm: { fontSize: "14px" } }) 後に renderCss() が @media (min-width: 640px) を含む', () => {
      const tag = new TestTag();
      tag.responsive({ sm: { fontSize: '14px' } });
      const css = tag.css.renderCss();
      expect(css).toContain('@media (min-width: 640px)');
    });

    it('.responsive({ lg: { display: "none" } }) 後に renderCss() が @media (min-width: 1024px) を含む', () => {
      const tag = new TestTag();
      tag.responsive({ lg: { display: 'none' } });
      const css = tag.css.renderCss();
      expect(css).toContain('@media (min-width: 1024px)');
    });

    it('.responsive({ xl: { maxWidth: "1280px" } }) 後に renderCss() が @media (min-width: 1280px) を含む', () => {
      const tag = new TestTag();
      tag.responsive({ xl: { maxWidth: '1280px' } });
      const css = tag.css.renderCss();
      expect(css).toContain('@media (min-width: 1280px)');
    });
  });

  // ── 複数ブレークポイント ──
  describe('複数ブレークポイント: sm と xl を同時指定すると 2 つの @media ブロックが出力される', () => {
    it('.responsive({ sm: {...}, xl: {...} }) が sm と xl の両方の @media ブロックを含む', () => {
      const tag = new TestTag();
      tag.responsive({
        sm: { padding: '8px' },
        xl: { padding: '32px' },
      });
      const css = tag.css.renderCss();
      expect(css).toContain('@media (min-width: 640px)');
      expect(css).toContain('@media (min-width: 1280px)');
    });
  });

  // ── 要件 9.3: カスタム数値ブレークポイント ──
  describe('9.3: 数値キーをカスタムブレークポイントとして使用する', () => {
    it('.responsive({ 900: { fontSize: "18px" } }) が @media (min-width: 900px) を生成する', () => {
      const tag = new TestTag();
      tag.responsive({ 900: { fontSize: '18px' } });
      const css = tag.css.renderCss();
      expect(css).toContain('@media (min-width: 900px)');
    });
  });

  // ── 空オブジェクト → 変化なし ──
  describe('後方互換: 空オブジェクト呼び出しで renderCss() 出力が変化しない', () => {
    it('.responsive({}) 後に @media ブロックが含まれない', () => {
      const tag = new TestTag();
      const cssBeforeResp = tag.css.renderCss();
      tag.responsive({});
      const cssAfterResp = tag.css.renderCss();
      expect(cssAfterResp).not.toContain('@media');
      expect(cssAfterResp).toBe(cssBeforeResp);
    });
  });

  // ── 要件 9.5: fluent チェーン（this を返す） ──
  describe('9.5: responsive() はすべての既存要素で使用可能（this を返す）', () => {
    it('responsive() が this を返しメソッドチェーンが継続できる', () => {
      const tag = new TestTag();
      const result = tag.responsive({ md: { padding: '16px' } });
      expect(result).toBe(tag);
    });

    it('responsive().padding().background() のようなチェーンが動作する', () => {
      const tag = new TestTag();
      const result = tag
        .responsive({ md: { padding: '16px' } })
        .padding('8px')
        .background('#fff');
      expect(result).toBe(tag);
    });
  });

  // ── bp <= 0 / NaN ガード ──
  describe('bp <= 0 のエントリは無視される（@media ブロックを生成しない）', () => {
    it('.responsive({ 0: { padding: "8px" } }) 後に @media ブロックが含まれない', () => {
      const tag = new TestTag();
      tag.responsive({ 0: { padding: '8px' } });
      const css = tag.css.renderCss();
      expect(css).not.toContain('@media');
    });

    it('.responsive({ [-1]: { color: "red" } }) 後に @media ブロックが含まれない（負値は無視）', () => {
      const tag = new TestTag();
      tag.responsive({ [-1]: { color: 'red' } });
      const css = tag.css.renderCss();
      expect(css).not.toContain('@media');
    });
  });

  // ── 要件 9.4: スコープドCSS（グローバル汚染なし） ──
  describe('9.4: レスポンシブスタイルがスコープドCSSとして出力される', () => {
    it('.responsive({ md: { padding: "16px" } }) の出力はスコープドクラスセレクタを含む', () => {
      const tag = new TestTag();
      tag.responsive({ md: { padding: '16px' } });
      const css = tag.css.renderCss();
      // スコープドクラス名（._xxxxxxxx 形式）がメディアクエリ内に含まれる
      expect(css).toMatch(/@media \(min-width: 768px\)/);
      expect(css).toMatch(/\._[0-9a-f]+/);
    });
  });
});
