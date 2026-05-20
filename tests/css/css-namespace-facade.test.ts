/**
 * css ネームスペース facade の単体・統合テスト
 *
 * Requirements: 1.x, 2.x, 3.x, 4.x, 5.x, 6.x, 7.x, 10.x
 */
import { describe, expect, expectTypeOf, it } from 'vitest';
import { css } from '../../src/css/css.js';
import { createStyle } from '../../src/css/variables/css-shared-style.js';
import { createTheme } from '../../src/css/variables/css-theme.js';
import type { GlobalCss } from '../../src/css/variables/global-css.js';

// ─────────────────────────────────────────────
// 1.1 css.raw
// ─────────────────────────────────────────────

describe('css.raw', () => {
  it('任意 string 入力をそのまま GlobalCss として返す', () => {
    const out = css.raw('.foo::selection { color: red; }');
    expect(out).toBe('.foo::selection { color: red; }');
  });

  it('空文字も同様に返す', () => {
    expect(css.raw('')).toBe('');
  });

  it('戻り値型が GlobalCss', () => {
    const out = css.raw('a { }');
    expectTypeOf(out).toEqualTypeOf<GlobalCss>();
  });
});

// ─────────────────────────────────────────────
// 1.2 css.reset
// ─────────────────────────────────────────────

describe('css.reset', () => {
  it('引数なしでデフォルトリセット（* と body の両ブロックを含む）', () => {
    const out = css.reset();
    expect(out).toContain('* {');
    expect(out).toContain('box-sizing: border-box;');
    expect(out).toContain('body {');
    expect(out).toContain('margin: 0;');
  });

  it('properties 入力で * { <props> } 形式', () => {
    const out = css.reset({ boxSizing: 'border-box', margin: '0' });
    expect(out).toContain('* {');
    expect(out).toContain('box-sizing: border-box;');
    expect(out).toContain('margin: 0;');
  });

  it('SharedStyle 入力で properties が抽出される', () => {
    const style = createStyle('reset-base', {
      boxSizing: 'border-box',
      padding: '0',
    });
    const out = css.reset(style);
    expect(out).toContain('* {');
    expect(out).toContain('box-sizing: border-box;');
    expect(out).toContain('padding: 0;');
    // クラス名形式（.reset-base）にはならない
    expect(out).not.toContain('.reset-base');
  });

  it('StyleTemplate 入力で properties が抽出される', () => {
    const template = createStyle({ margin: '0', padding: '0' });
    const out = css.reset(template);
    expect(out).toContain('* {');
    expect(out).toContain('margin: 0;');
    expect(out).toContain('padding: 0;');
  });

  it('危険値（url(javascript:...)）は除外される', () => {
    const out = css.reset({
      background: 'url(javascript:alert(1))',
      margin: '0',
    });
    expect(out).not.toContain('javascript:');
    expect(out).toContain('margin: 0;');
  });
});

// ─────────────────────────────────────────────
// 1.3 css.theme.variant
// ─────────────────────────────────────────────

describe('css.theme.variant', () => {
  it('単一トークン上書きで <selector> { --<key>: <value>; } を生成', () => {
    const theme = createTheme({ bg: '#fff', text: '#000' });
    const out = css.theme.variant(theme, '[data-theme="dark"]', { bg: '#000' });
    expect(out).toContain('[data-theme="dark"] {');
    expect(out).toContain('--bg: #000;');
    expect(out).not.toContain('--text:');
  });

  it('複数トークン上書き', () => {
    const theme = createTheme({ bg: '#fff', text: '#000', accent: '#7c5cff' });
    const out = css.theme.variant(theme, '[data-theme="dark"]', {
      bg: '#000',
      text: '#fff',
    });
    expect(out).toContain('--bg: #000;');
    expect(out).toContain('--text: #fff;');
  });

  it('危険値はサニタイズで除外される', () => {
    const theme = createTheme({ bg: '#fff' });
    const out = css.theme.variant(theme, '.x', { bg: 'url(javascript:alert(1))' });
    expect(out).not.toContain('javascript:');
  });

  it('overrides 型: 存在しないキーはコンパイルエラー（type-only check）', () => {
    const theme = createTheme({ bg: '#fff' });
    // @ts-expect-error: missingKey is not a token of theme
    css.theme.variant(theme, '.x', { missingKey: '#000' });
    expect(theme).toBeDefined();
  });

  it('overrides 値型: object はコンパイルエラー（type-only check）', () => {
    const theme = createTheme({ bg: '#fff' });
    // @ts-expect-error: object value is not allowed for token override
    css.theme.variant(theme, '.x', { bg: { foo: 'bar' } });
    expect(theme).toBeDefined();
  });
});

// ─────────────────────────────────────────────
// 2.1 namespace 構造
// ─────────────────────────────────────────────

describe('css namespace structure', () => {
  it('css.theme(...) が createTheme(...) と同一の戻り値を返す（all-string）', () => {
    const a = css.theme({ bg: '#fff', text: '#000' });
    const b = createTheme({ bg: '#fff', text: '#000' });
    expect(a.bg).toBe(b.bg);
    expect(a.css).toBe(b.css);
  });

  it('css.theme(...) が unified 入力で UnifiedTheme を返す', () => {
    const t = css.theme({
      bg: '#fff',
      card: { background: 'bg', padding: '12px' },
    });
    expect(t.bg).toBe('var(--bg)');
    expect((t as { card: { className: string } }).card.className).toBe('card');
  });

  it('css.theme.variant が呼べる', () => {
    const t = css.theme({ bg: '#fff' });
    const out = css.theme.variant(t, '.x', { bg: '#000' });
    expect(out).toContain('--bg: #000;');
  });

  it('css.class(name, props) が SharedStyle を返す', () => {
    const s = css.class('btn', { padding: '8px' });
    expect(s.className).toBe('btn');
    expect(s.css).toContain('.btn {');
    expect(s.css).toContain('padding: 8px;');
  });

  it('css.class(props) が StyleTemplate を返す', () => {
    const t = css.class({ display: 'flex' });
    expect(t._kind).toBe('styleTemplate');
    expect(t.hasExplicitName).toBe(false);
  });

  it('css.reset() が呼べる', () => {
    expect(css.reset()).toContain('* {');
  });

  it('css.media(query, rules) が @media ブロックを返す', () => {
    const inner = css.raw('body { color: red; }');
    const out = css.media('(min-width: 768px)', [inner]);
    expect(out).toContain('@media (min-width: 768px) {');
  });

  it('css.keyframes(name, frames) が @keyframes ブロックを返す', () => {
    const out = css.keyframes('fadeIn', { from: { opacity: '0' }, to: { opacity: '1' } });
    expect(out).toContain('@keyframes fadeIn {');
  });

  it('css.raw が呼べる', () => {
    expect(css.raw('foo')).toBe('foo');
  });
});

// ─────────────────────────────────────────────
// 5.1 統合テスト
// ─────────────────────────────────────────────

describe('css namespace integration', () => {
  it('全機能を同一テスト内で併用してビルド可能', () => {
    const theme = css.theme({
      bg: '#fff',
      text: '#000',
      card: { background: 'bg', color: 'text' },
    });
    const dark = css.theme.variant(theme, '[data-theme="dark"]', {
      bg: '#000',
      text: '#fff',
    });
    const reset = css.reset();
    const responsive = css.media('(min-width: 768px)', [
      css.raw('body { font-size: 18px; }'),
    ]);
    const fade = css.keyframes('fadeIn', {
      from: { opacity: '0' },
      to: { opacity: '1' },
    });
    const customRaw = css.raw('::selection { background: yellow; }');

    const all: GlobalCss[] = [reset, theme.css, dark, responsive, fade, customRaw];
    expect(all.length).toBe(6);
    for (const part of all) expect(typeof part).toBe('string');
  });

  it('ダークモードシナリオ：theme + variant が想定 CSS を出力', () => {
    const theme = css.theme({ bg: '#fff', text: '#000' });
    const dark = css.theme.variant(theme, '[data-theme="dark"]', {
      bg: '#000',
      text: '#fff',
    });
    expect(theme.css).toContain('--bg: #fff;');
    expect(dark).toContain('[data-theme="dark"] {');
    expect(dark).toContain('--bg: #000;');
    expect(dark).toContain('--text: #fff;');
  });

  it('css.theme.variant の overrides 型制約', () => {
    const theme = css.theme({ bg: '#fff', card: { padding: '12px' } });
    // 型レベル: token キーのみ許可、class キーは不可
    expectTypeOf(css.theme.variant<typeof theme extends infer _ ? never : never>).toBeFunction();
    // 実行確認
    const out = css.theme.variant(theme, '.x', { bg: '#000' });
    expect(out).toContain('--bg: #000;');
    // class キー（card）は overrides に渡せない（型エラー）
    // @ts-expect-error: card is a class key, not a token key
    css.theme.variant(theme, '.x', { card: 'something' });
  });
});
