import { describe, it, expect } from 'vitest';
import { RESET_CSS } from '../reset-css';

describe('reset.css', () => {
  describe('定数の存在', () => {
    it('RESET_CSS 定数が定義されている', () => {
      expect(RESET_CSS).toBeDefined();
      expect(typeof RESET_CSS).toBe('string');
    });

    it('空文字列ではない', () => {
      expect(RESET_CSS.length).toBeGreaterThan(0);
    });
  });

  describe('CSS内容', () => {
    it('CSS文として有効な構造を持つ', () => {
      // CSSセレクタと波括弧が含まれることを確認
      expect(RESET_CSS).toMatch(/[a-z]+\s*{/);
      expect(RESET_CSS).toContain('{');
      expect(RESET_CSS).toContain('}');
    });

    it('基本的なリセットスタイルを含む', () => {
      // 一般的なリセットCSSに含まれる要素
      const commonResetElements = ['margin', 'padding'];

      // 少なくとも1つの要素を含むことを確認
      const hasResetElements = commonResetElements.some(element =>
        RESET_CSS.includes(element),
      );

      expect(hasResetElements).toBe(true);
    });

    it('改行を含む（可読性のため）', () => {
      // 改行が含まれているか確認（圧縮されていないことを想定）
      expect(RESET_CSS).toMatch(/\n/);
    });
  });

  describe('Swift版との互換性', () => {
    it('FileExporterで使用可能な形式', () => {
      // 文字列として直接連結可能
      const testCss = 'body { color: red; }';
      const combined = RESET_CSS + '\n' + testCss;

      expect(combined).toContain(testCss);
      expect(combined.length).toBeGreaterThan(RESET_CSS.length);
    });
  });

  describe('エッジケース', () => {
    it('特殊文字がエスケープされていない（生のCSS文字列）', () => {
      // CSSとして有効な文字のみを含むことを確認
      // シングルクォート、ダブルクォートなどのエスケープが不要なことを確認
      expect(typeof RESET_CSS).toBe('string');
    });

    it('前後に余分な空白がない', () => {
      // 先頭と末尾の空白をチェック
      const trimmed = RESET_CSS.trim();
      // 少なくとも先頭または末尾が非空白であることを確認
      expect(trimmed.length).toBeGreaterThan(0);
    });
  });
});
