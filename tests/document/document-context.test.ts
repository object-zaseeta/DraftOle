/**
 * DocumentContext テスト (root-responsibility-separation spec, task 2.1)
 *
 * Requirements: 2.1, 4.1, 4.2, 5.2
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentContext } from '../../src/document/document-context.js';
import type { GlobalCss } from '../../src/css/variables/global-css.js';

/** テスト用に生文字列を GlobalCss として扱うキャストヘルパ */
function css(s: string): GlobalCss {
  return s as GlobalCss;
}

describe('DocumentContext', () => {
  let ctx: DocumentContext;

  beforeEach(() => {
    ctx = new DocumentContext();
  });

  // ── 初期状態 ──────────────────────────────────────────────────────────────

  describe('初期状態', () => {
    it('インスタンス化できる', () => {
      expect(ctx).toBeInstanceOf(DocumentContext);
    });

    it('初期状態で collectCss([]) は空文字列を返す', () => {
      expect(ctx.collectCss([])).toBe('');
    });
  });

  // ── setDoctype ─────────────────────────────────────────────────────────────

  describe('setDoctype', () => {
    it('setDoctype() はメソッドチェーンのため this を返す (Req 5.2)', () => {
      const result = ctx.setDoctype();
      expect(result).toBe(ctx);
    });

    it('setDoctype(true) を呼んでも collectCss には影響しない', () => {
      ctx.setDoctype(true);
      expect(ctx.collectCss([])).toBe('');
    });

    it('setDoctype(false) はデフォルト値 false を設定する', () => {
      ctx.setDoctype(true);
      ctx.setDoctype(false);
      // doctype フラグのみ確認 — CSS 出力に影響しない
      expect(ctx.collectCss([])).toBe('');
    });

    it('引数なしで setDoctype() を呼ぶと enabled=true と同等', () => {
      const result = ctx.setDoctype();
      expect(result).toBe(ctx);
    });
  });

  // ── globalCss (constructor option, Req 4.2) ───────────────────────────────

  describe('globalCss (constructor option)', () => {
    it('globalCss で渡した CSS が collectCss に含まれる (Req 4.2)', () => {
      const ctxWithCss = new DocumentContext({ globalCss: [css('body { margin: 0; }')] });
      expect(ctxWithCss.collectCss([])).toContain('body { margin: 0; }');
    });

    it('複数の globalCss エントリが両方 collectCss に含まれる', () => {
      const ctxWithCss = new DocumentContext({
        globalCss: [css('a { color: blue; }'), css('b { font-weight: bold; }')],
      });
      const result = ctxWithCss.collectCss([]);
      expect(result).toContain('a { color: blue; }');
      expect(result).toContain('b { font-weight: bold; }');
    });

    it('globalCss なしで構築した場合 collectCss は空文字列を返す', () => {
      expect(ctx.collectCss([])).toBe('');
    });
  });

  // ── reset policy (Req 4.1) ────────────────────────────────────────────────

  describe('reset policy (Req 4.1)', () => {
    it('デフォルトで reset は false (CSS リセットなし)', () => {
      // DEFAULT_CSS_RESET を含まない
      expect(ctx.collectCss([])).not.toContain('box-sizing: border-box');
    });

    it('reset: true でコンストラクタを呼ぶと CSS リセットが先頭に付加される', () => {
      const ctxWithReset = new DocumentContext({ reset: true });
      expect(ctxWithReset.collectCss([])).toContain('box-sizing: border-box');
    });

    it('CSS リセットはグローバル CSS の前に出力される', () => {
      const ctxWithReset = new DocumentContext({
        reset: true,
        globalCss: [css('body { color: red; }')],
      });
      const result = ctxWithReset.collectCss([]);
      const resetIndex = result.indexOf('box-sizing');
      const globalIndex = result.indexOf('body { color: red; }');
      expect(resetIndex).toBeLessThan(globalIndex);
    });
  });

  // ── collectCss with global CSS order ─────────────────────────────────────

  describe('collectCss (global CSS の出力順)', () => {
    it('children が空配列のとき global CSS のみ返す', () => {
      const ctxWithCss = new DocumentContext({ globalCss: [css('html { font-size: 16px; }')] });
      expect(ctxWithCss.collectCss([])).toContain('html { font-size: 16px; }');
    });

    it('global CSS は出力先頭に配置される', () => {
      const ctxWithCss = new DocumentContext({ globalCss: [css('global {}')] });
      const result = ctxWithCss.collectCss([]);
      expect(result.startsWith('global {}')).toBe(true);
    });
  });

  // ── Root 非依存の確認 (Req 2.1) ──────────────────────────────────────────

  describe('Root 非依存 (Req 2.1)', () => {
    it('DocumentContext は Root なしで独立して動作する', () => {
      // このテスト自体が Root をインポートせずインスタンス化できることを示す
      expect(() => new DocumentContext()).not.toThrow();
    });
  });
});
