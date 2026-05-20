/**
 * CssManager @media / .responsive() 総合テスト (Task 7.4)
 *
 * 要件: 9.1, 9.3, 9.4
 *
 * カバレッジ:
 * - addMediaRule() が内部マップに正しく格納される (要件 9.1)
 * - renderCss() 末尾に @media (min-width: Npx) ブロックが出力される (要件 9.1, 9.3)
 * - _mediaRules が空の場合に既存出力と完全一致する（後方互換）
 * - .responsive() 経由でスコープドCSS @media ブロックが生成される (要件 9.4)
 * - 名前付きブレークポイント (sm/md/lg/xl) の正しいpx解決
 */
import { describe, expect, it } from 'vitest';
import { CssManager } from '../../../src/css/manager/css-manager.js';
import { div } from '../../../src/index.js';

// ── Section 1: addMediaRule() 内部ストレージ (要件 9.1) ──────────────────────

describe('addMediaRule() 内部マップへの格納 (要件 9.1)', () => {
  it('addMediaRule(768, { padding: "16px" }) 後に _mediaRules に 768 キーが存在する', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    expect(mediaRules.has(768)).toBe(true);
  });

  it('addMediaRule はプロパティ値を内部マップに正しく格納する', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    const bpMap = mediaRules.get(768);
    expect(bpMap?.get('padding')).toBe('16px');
  });

  it('同一ブレークポイントへの複数呼び出しでプロパティがマージされる', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });
    manager.addMediaRule(768, { margin: '8px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    const bpMap = mediaRules.get(768);
    expect(bpMap?.get('padding')).toBe('16px');
    expect(bpMap?.get('margin')).toBe('8px');
    // キーが 1 つだけであることを確認（マージされている）
    expect(mediaRules.size).toBe(1);
  });

  it('同一ブレークポイントで後から追加したプロパティが上書きされる', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });
    manager.addMediaRule(768, { padding: '32px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    expect(mediaRules.get(768)?.get('padding')).toBe('32px');
  });

  it('異なるブレークポイントは独立したマップとして格納される', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(640, { fontSize: '14px' });
    manager.addMediaRule(768, { padding: '16px' });
    manager.addMediaRule(1024, { padding: '24px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    expect(mediaRules.size).toBe(3);
    expect(mediaRules.get(640)?.get('fontSize')).toBe('14px');
    expect(mediaRules.get(768)?.get('padding')).toBe('16px');
    expect(mediaRules.get(1024)?.get('padding')).toBe('24px');
  });

  it('複数プロパティを一度に渡すと全て格納される', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, {
      padding: '16px',
      fontSize: '14px',
      color: 'red',
    });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    const bpMap = mediaRules.get(768);
    expect(bpMap?.get('padding')).toBe('16px');
    expect(bpMap?.get('fontSize')).toBe('14px');
    expect(bpMap?.get('color')).toBe('red');
  });
});

// ── Section 2: renderCss() @media ブロック出力 (要件 9.1, 9.3) ───────────────

describe('renderCss() @media ブロック出力 (要件 9.1, 9.3)', () => {
  it('_mediaRules が空の場合 renderCss() 出力に @media が含まれない（後方互換）', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');

    const result = manager.renderCss();
    expect(result).not.toContain('@media');
  });

  it('_mediaRules が空の場合 2 つのマネージャーの出力が同一である（後方互換）', () => {
    const manager1 = new CssManager('html>body>div');
    manager1.styleManager.style.font.setFontSize('16px');

    const manager2 = new CssManager('html>body>div');
    manager2.styleManager.style.font.setFontSize('16px');

    expect(manager1.renderCss()).toBe(manager2.renderCss());
  });

  it('addMediaRule(768, ...) 後に renderCss() が @media (min-width: 768px) を含む', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    expect(result).toContain('@media (min-width: 768px)');
  });

  it('@media ブロックにプロパティ値が含まれる', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    expect(result).toContain('padding: 16px;');
  });

  it('@media ブロックはベース CSS ブロックの後に出力される', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    const baseIndex = result.indexOf('font-size');
    const mediaIndex = result.indexOf('@media');
    expect(mediaIndex).toBeGreaterThan(baseIndex);
  });

  it('@media ブロックにはスコープドクラス名（ベース CSS と同一）が使われる', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    // ベース CSS のクラス名を取得
    const baseMatch = result.match(/^\.([\w-]+)\s*\{/);
    expect(baseMatch).not.toBeNull();
    const scopedClass = baseMatch![1];
    // @media ブロック内にも同じクラス名が使われている
    expect(result).toContain(`@media (min-width: 768px) {\n  .${scopedClass} {`);
  });

  it('複数ブレークポイントが個別の @media ブロックとして出力される', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });
    manager.addMediaRule(1024, { padding: '24px' });

    const result = manager.renderCss();
    expect(result).toContain('@media (min-width: 768px)');
    expect(result).toContain('@media (min-width: 1024px)');
  });

  it('カスタム数値ブレークポイント (900px) が正しく @media ブロックを生成する (要件 9.3)', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(900, { fontSize: '18px' });

    const result = manager.renderCss();
    expect(result).toContain('@media (min-width: 900px)');
    expect(result).toContain('font-size: 18px;');
  });

  it('ベースCSSが空でも @media ブロックのみが出力される', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    expect(result).toContain('@media (min-width: 768px)');
    expect(result).toContain('padding: 16px;');
  });
});

// ── Section 3: .responsive() パブリック API 経由の @media 出力 (要件 9.4) ────

describe('.responsive() 経由でのスコープド @media 出力 (要件 9.4)', () => {
  it('div().responsive({ md: { padding: "16px" } }) が @media (min-width: 768px) を含む CSS を生成する', () => {
    const el = div().responsive({ md: { padding: '16px' } });
    const css = el.css.renderCss();
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('padding: 16px');
  });

  it('div().responsive({ sm: { fontSize: "14px" } }) が @media (min-width: 640px) を生成する', () => {
    const el = div().responsive({ sm: { fontSize: '14px' } });
    const css = el.css.renderCss();
    expect(css).toContain('@media (min-width: 640px)');
  });

  it('div().responsive({ lg: { display: "none" } }) が @media (min-width: 1024px) を生成する', () => {
    const el = div().responsive({ lg: { display: 'none' } });
    const css = el.css.renderCss();
    expect(css).toContain('@media (min-width: 1024px)');
  });

  it('div().responsive({ xl: { maxWidth: "1280px" } }) が @media (min-width: 1280px) を生成する', () => {
    const el = div().responsive({ xl: { maxWidth: '1280px' } });
    const css = el.css.renderCss();
    expect(css).toContain('@media (min-width: 1280px)');
  });

  it('カスタム数値ブレークポイント 900 が @media (min-width: 900px) を生成する', () => {
    const el = div().responsive({ 900: { fontSize: '18px' } });
    const css = el.css.renderCss();
    expect(css).toContain('@media (min-width: 900px)');
  });

  it('responsive() 出力はスコープドクラスセレクタ（._xxxxxxxx 形式）を含む', () => {
    const el = div().responsive({ md: { padding: '16px' } });
    const css = el.css.renderCss();
    expect(css).toMatch(/@media \(min-width: 768px\)/);
    expect(css).toMatch(/\._(?:[a-z0-9-]+__)?[0-9a-f]{8}/);
  });

  it('responsive() はグローバル CSS を汚染しない（スコープドクラス使用）', () => {
    const el = div().responsive({ md: { padding: '16px' } });
    const css = el.css.renderCss();
    // div タグのみ（グローバルセレクタ）が @media 内にないことを確認
    expect(css).not.toMatch(/@media[^{]+{\s*div\s*{/);
  });

  it('複数ブレークポイントを同時指定すると複数の @media ブロックが出力される', () => {
    const el = div().responsive({
      sm: { padding: '8px' },
      xl: { padding: '32px' },
    });
    const css = el.css.renderCss();
    expect(css).toContain('@media (min-width: 640px)');
    expect(css).toContain('@media (min-width: 1280px)');
  });

  it('responsive({}) の場合 @media ブロックが含まれない（後方互換）', () => {
    const el = div();
    const cssBefore = el.css.renderCss();
    el.responsive({});
    const cssAfter = el.css.renderCss();
    expect(cssAfter).not.toContain('@media');
    expect(cssAfter).toBe(cssBefore);
  });

  it('responsive() はメソッドチェーンで this を返す', () => {
    const el = div();
    const result = el.responsive({ md: { padding: '16px' } });
    expect(result).toBe(el);
  });

  it('responsive() に続くメソッドチェーンが正常に動作する', () => {
    const el = div();
    const result = el
      .responsive({ md: { padding: '16px' } })
      .padding('8px')
      .background('#fff');
    expect(result).toBe(el);
  });

  it('collectCssStyleString() 経由でも @media ブロックが含まれる', () => {
    const el = div().responsive({ md: { padding: '16px' } });
    const css = el.collectCssStyleString();
    expect(css).toContain('@media (min-width: 768px)');
  });
});
