/**
 * Task 0.2: HtmlTag の CSS コンポジションパターン統合テスト
 *
 * TDD RED phase: HtmlTag に追加された css プロパティと
 * collectCssStyleString() の委譲動作を検証する。
 *
 * 既存の html-tag.test.ts は変更しない。
 * このファイルで新しい css 関連機能のみテストする。
 */
import { describe, it, expect } from 'vitest';
import { HtmlTag } from '../../src/html/elements/html-tag.js';
import { CssManager } from '../../src/css/manager/css-manager.js';
import type { TagType } from '../../src/html/tags/tag-type.js';

// ── テスト用の具象サブクラス ──

/** HtmlTag は abstract なので、テスト用の具象クラスを使用 */
class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

describe('HtmlTag CSS コンポジション統合', () => {
  // ── css プロパティアクセス ──

  describe('css プロパティ', () => {
    it('css プロパティが CssManagerInstance を返す', () => {
      const tag = new TestTag();
      const css = tag.css;
      expect(css).toBeDefined();
      expect(typeof css.render).toBe('function');
      expect(typeof css.renderCss).toBe('function');
      expect(typeof css.updateTagPath).toBe('function');
    });

    it('デフォルトで CssManager が設定されている', () => {
      const tag = new TestTag();
      expect(tag.css).toBeInstanceOf(CssManager);
    });

    it('css プロパティは同じインスタンスを返す（参照の安定性）', () => {
      const tag = new TestTag();
      const first = tag.css;
      const second = tag.css;
      expect(first).toBe(second);
    });
  });

  // ── デフォルト css のレンダリング ──

  describe('デフォルト css レンダリング', () => {
    it('css.render() がデフォルトで空文字列を返す', () => {
      const tag = new TestTag();
      expect(tag.css.render()).toBe('');
    });

    it('css.renderCss() がデフォルトで空文字列を返す', () => {
      const tag = new TestTag();
      expect(tag.css.renderCss()).toBe('');
    });
  });

  // ── collectCssStyleString() 委譲 ──

  describe('collectCssStyleString() 委譲', () => {
    it('collectCssStyleString() が css.render() に委譲する', () => {
      const tag = new TestTag();
      // デフォルトの DefaultCssManager は空文字列を返す
      expect(tag.collectCssStyleString()).toBe(tag.css.render());
    });

    it('collectCssStyleString() がデフォルトで空文字列を返す（後方互換）', () => {
      const tag = new TestTag();
      expect(tag.collectCssStyleString()).toBe('');
    });
  });

  // ── CssManagerType インターフェース準拠（後方互換） ──

  describe('CssManagerType 後方互換', () => {
    it('collectCssStyleString メソッドが存在する', () => {
      const tag = new TestTag();
      expect(typeof tag.collectCssStyleString).toBe('function');
    });

    it('css プロパティが存在する', () => {
      const tag = new TestTag();
      expect('css' in tag).toBe(true);
    });
  });

  // ── 異なるタグタイプでの動作 ──

  describe('異なるタグタイプでの動作', () => {
    const tagTypes: TagType[] = ['div', 'p', 'span', 'h1'];

    for (const tagType of tagTypes) {
      it(`${tagType} タグで css プロパティにアクセスできる`, () => {
        const tag = new TestTag(tagType);
        expect(tag.css).toBeDefined();
        expect(tag.css.render()).toBe('');
      });
    }
  });
});
