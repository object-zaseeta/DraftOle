/**
 * 統合 createTheme のユニット + 統合テスト
 *
 * Requirements: 1.1, 1.2, 1.3, 2.1〜2.4, 3.1〜3.6, 4.1〜4.4, 5.4, 6.1, 7.1, 7.2, 7.3
 */
import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  classifyEntry,
  resolveTokenRefs,
  TokenAccumulator,
  ClassAccumulator,
  combineCss,
  buildThemeClass,
  CSS_KEYWORDS,
  defaultKeywordResolver,
  type UnifiedTheme,
} from '../../../src/css/variables/unified-theme.js';
import { createTheme } from '../../../src/css/variables/css-theme.js';
import type { Theme } from '../../../src/css/variables/css-theme.js';
import type { SharedStyle } from '../../../src/css/variables/css-shared-style.js';
import type { GlobalCss } from '../../../src/css/variables/global-css.js';
import type { StyleTemplate } from '../../../src/css/variables/style-template.js';

describe('CSS_KEYWORDS', () => {
  it('代表的な CSS キーワードを含む', () => {
    for (const k of ['auto', 'none', 'red', 'bold', 'block', 'inherit']) {
      expect(CSS_KEYWORDS.has(k)).toBe(true);
    }
  });
});

describe('classifyEntry', () => {
  it('string 値を token に分類', () => {
    const r = classifyEntry('bg', '#000');
    expect(r.kind).toBe('token');
    if (r.kind === 'token') {
      expectTypeOf(r.value).toEqualTypeOf<string>();
    }
  });

  it('object 値を class に分類', () => {
    const r = classifyEntry('card', { background: '#000' });
    expect(r.kind).toBe('class');
    if (r.kind === 'class') {
      expectTypeOf(r.value).toEqualTypeOf<Record<string, string>>();
    }
  });
});

describe('TokenAccumulator', () => {
  it('空入力で buildRootCss が undefined', () => {
    const acc = new TokenAccumulator();
    expect(acc.buildRootCss()).toBeUndefined();
  });

  it('単一トークンで :root ブロック生成', () => {
    const acc = new TokenAccumulator();
    acc.add('bg', '#000');
    expect(acc.buildRootCss()).toBe(':root {\n  --bg: #000;\n}');
  });

  it('複数トークンで挿入順保持', () => {
    const acc = new TokenAccumulator();
    acc.add('bg', '#000');
    acc.add('fg', '#fff');
    expect(acc.buildRootCss()).toBe(':root {\n  --bg: #000;\n  --fg: #fff;\n}');
  });

  it('無効値（危険な url）はスキップ', () => {
    const acc = new TokenAccumulator();
    acc.add('safe', '#000');
    acc.add('xss', 'url(javascript:alert(1))');
    const css = acc.buildRootCss();
    expect(css).toContain('--safe: #000;');
    expect(css).not.toContain('xss');
  });

  it('buildProxy が var(--name) を返す', () => {
    const acc = new TokenAccumulator();
    acc.add('bg', '#000');
    expect(acc.buildProxy().bg).toBe('var(--bg)');
  });
});

describe('resolveTokenRefs', () => {
  const tokens = new Set(['bg', 'red']);

  it('トークン名一致 + 非キーワード → var() に置換', () => {
    const r = resolveTokenRefs({ background: 'bg' }, tokens, defaultKeywordResolver);
    expect(r.background).toBe('var(--bg)');
  });

  it('CSS キーワード一致は元値保持（red はキーワード優先）', () => {
    const r = resolveTokenRefs({ color: 'red' }, tokens, defaultKeywordResolver);
    expect(r.color).toBe('red');
  });

  it.each(['auto', 'bold', 'block'])('%s は元値保持', (kw) => {
    const r = resolveTokenRefs({ x: kw }, new Set([kw]), defaultKeywordResolver);
    expect(r.x).toBe(kw);
  });

  it('複合値（空白含む）は元値保持', () => {
    const r = resolveTokenRefs({ border: '1px solid red' }, tokens, defaultKeywordResolver);
    expect(r.border).toBe('1px solid red');
  });

  it('未定義名は元値保持', () => {
    const r = resolveTokenRefs({ x: 'unknown' }, tokens, defaultKeywordResolver);
    expect(r.x).toBe('unknown');
  });
});

describe('ClassAccumulator', () => {
  it('トークン参照置換 + 挿入順保持', () => {
    const acc = new ClassAccumulator();
    acc.setTokenContext(new Set(['bg']), defaultKeywordResolver);
    acc.add('card', { background: 'bg' });
    acc.add('btn', { padding: '10px' });
    const blocks = acc.buildCssBlocks();
    expect(blocks[0]).toContain('.card');
    expect(blocks[0]).toContain('background: var(--bg);');
    expect(blocks[1]).toContain('.btn');
    expect(blocks[1]).toContain('padding: 10px;');
  });

  it('CSS キーワードは置換しない', () => {
    const acc = new ClassAccumulator();
    acc.setTokenContext(new Set(['red']), defaultKeywordResolver);
    acc.add('warn', { color: 'red' });
    const blocks = acc.buildCssBlocks();
    expect(blocks[0]).toContain('color: red;');
    expect(blocks[0]).not.toContain('var(--red)');
  });

  it('HTMLタグ名と同名のクラス（ul）でも .ul として生成', () => {
    const acc = new ClassAccumulator();
    acc.setTokenContext(new Set(), defaultKeywordResolver);
    acc.add('ul', { listStyle: 'none' });
    const blocks = acc.buildCssBlocks();
    expect(blocks[0]).toContain('.ul {');
    expect(blocks[0]).toContain('list-style: none;');
  });

  it('SharedStyle が { css, className } 形式で利用可能', () => {
    const acc = new ClassAccumulator();
    acc.setTokenContext(new Set(), defaultKeywordResolver);
    acc.add('card', { padding: '10px' });
    const proxy = acc.buildProxy();
    expect(proxy.card.className).toBe('card');
    expect(proxy.card.css).toContain('.card');
  });
});

describe('combineCss', () => {
  it('tokens → classes 順で結合', () => {
    const t = ':root {\n  --bg: #000;\n}' as GlobalCss;
    const c = '.card {\n  padding: 10px;\n}' as GlobalCss;
    const out = combineCss({ tokensCss: t, classesCss: [c] });
    expect(out).toBe(`${t}\n\n${c}`);
  });

  it('tokens のみ', () => {
    const t = ':root {}' as GlobalCss;
    expect(combineCss({ tokensCss: t, classesCss: [] })).toBe(':root {}');
  });

  it('classes のみ', () => {
    const c = '.x {}' as GlobalCss;
    expect(combineCss({ classesCss: [c] })).toBe('.x {}');
  });

  it('全空 → 空文字', () => {
    expect(combineCss({ classesCss: [] })).toBe('');
  });
});

describe('buildUnifiedTheme / 統合 createTheme', () => {
  it('混在入力：bg はトークン、card はクラス、css は結合 CSS', () => {
    const t = createTheme({
      bg: '#000',
      card: { background: 'bg', padding: '12px' },
    });
    expect(t.bg).toBe('var(--bg)');
    expect((t.card as SharedStyle).className).toBe('card');
    expect((t.card as SharedStyle).css).toContain('background: var(--bg);');
    expect(t.css).toContain(':root {');
    expect(t.css).toContain('--bg: #000;');
    expect(t.css).toContain('.card');
    // tokens → classes 順
    expect(t.css.indexOf(':root')).toBeLessThan(t.css.indexOf('.card'));
  });

  it('CSS キーワード非置換（red はキーワード優先）', () => {
    const t = createTheme({
      red: '#f00',
      warn: { color: 'red' },
    });
    expect((t.warn as SharedStyle).css).toContain('color: red;');
    expect((t.warn as SharedStyle).css).not.toContain('var(--red)');
  });

  it('HTMLタグ名と同名のクラス（ul）が theme.ul で取得可能', () => {
    const t = createTheme({
      ul: { listStyle: 'none', padding: '0' },
    });
    expect((t.ul as SharedStyle).className).toBe('ul');
    expect((t.ul as SharedStyle).css).toContain('.ul {');
    expect((t.ul as SharedStyle).css).toContain('list-style: none;');
  });

  it('全 string 入力で既存 Theme<T> 互換戻り値', () => {
    const t = createTheme({ bg: '#0b1220', accent: '#7c5cff' });
    expect(t.bg).toBe('var(--bg)');
    expect(t.accent).toBe('var(--accent)');
    expect(t.css).toContain(':root {');
    expect(t.css).toContain('--bg: #0b1220;');
  });

  it('挿入順保持（複数クラス）', () => {
    const t = createTheme({
      a: { color: '#000' },
      b: { color: '#111' },
      c: { color: '#222' },
    });
    const css = t.css;
    expect(css.indexOf('.a')).toBeLessThan(css.indexOf('.b'));
    expect(css.indexOf('.b')).toBeLessThan(css.indexOf('.c'));
  });

  it('型推論：混在入力の戻り値が値型ごとに振り分けられる', () => {
    const _t = createTheme({
      bg: '#000',
      card: { background: 'bg' },
    });
    type T = typeof _t;
    expectTypeOf<T['bg']>().toEqualTypeOf<string>();
    expectTypeOf<T['card']>().toEqualTypeOf<SharedStyle>();
    expectTypeOf<T['css']>().toEqualTypeOf<GlobalCss>();
  });

  it('凍結されている', () => {
    const t = createTheme({ bg: '#000' });
    expect(Object.isFrozen(t)).toBe(true);
  });

  it('UnifiedTheme<T> 型は GlobalCss を持つ', () => {
    type T = UnifiedTheme<{ bg: string; card: Record<string, string> }>;
    expectTypeOf<T['bg']>().toEqualTypeOf<string>();
    expectTypeOf<T['card']>().toEqualTypeOf<SharedStyle>();
    expectTypeOf<T['css']>().toEqualTypeOf<GlobalCss>();
  });

  it('Theme<T> 型互換（全 string 入力）', () => {
    const t: Theme<{ bg: string }> = createTheme({ bg: '#000' });
    expect(t.bg).toBe('var(--bg)');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Task 6.5: UnifiedThemeTests — 未到達分岐の補完（Req 4.5）
// ────────────────────────────────────────────────────────────────────────────

describe('TokenAccumulator.add（Req 4.5）— sanitize → empty skip', () => {
  it('sanitize で空文字になる値はエントリに追加されない（line 259 分岐）', () => {
    const acc = new TokenAccumulator();
    acc.add('danger', 'url(javascript:alert(1))');
    // entries が空 → buildRootCss は undefined を返す
    expect(acc.buildRootCss()).toBeUndefined();
    // name set にも入らない
    expect(acc.getNameSet().has('danger')).toBe(false);
    expect(acc.getNameSet().size).toBe(0);
    // proxy にも露出しない
    expect(Object.keys(acc.buildProxy())).toEqual([]);
  });

  it('混在：有効値のみ残り、無効値はスキップされる', () => {
    const acc = new TokenAccumulator();
    acc.add('safe', '#0b1220');
    acc.add('xss', 'expression(alert(1))');
    expect(acc.getNameSet().size).toBe(1);
    expect(acc.getNameSet().has('safe')).toBe(true);
    expect(acc.getNameSet().has('xss')).toBe(false);
    expect(acc.buildRootCss()).toBe(':root {\n  --safe: #0b1220;\n}');
  });
});

describe('resolveTokenRefs（Req 4.5）— 複合値スキップ網羅', () => {
  const tokens = new Set(['bg']);

  it.each([
    ['空白を含む', '1px solid bg'],
    ['カンマを含む', 'rgba(0, 0, 0, 0.5)'],
    ['括弧を含む', 'calc(100%)'],
  ])('%s 値は元値保持（line 316 早期 return）', (_label, value) => {
    const r = resolveTokenRefs({ x: value }, tokens, defaultKeywordResolver);
    expect(r.x).toBe(value);
  });
});

describe('buildThemeClass（Req 4.5）— theme.class() overload 網羅', () => {
  const tokenNames: ReadonlySet<string> = new Set(['bg', 'fg']);
  const themeClass = buildThemeClass(tokenNames, defaultKeywordResolver);

  it('明示名形 (name, props): SharedStyle を返し token 解決される', () => {
    const result = themeClass('card', { background: 'bg', padding: '10px' });
    // SharedStyle 形状: className + css
    const shared = result as SharedStyle;
    expect(shared.className).toBe('card');
    expect(shared.css).toContain('.card');
    expect(shared.css).toContain('background: var(--bg);');
    expect(shared.css).toContain('padding: 10px;');
  });

  it('明示名形 (name, props, selectors): selectors にも token 解決を適用', () => {
    const result = themeClass(
      'btn',
      { background: 'bg' },
      { hover: { color: 'fg' } },
    );
    const shared = result as SharedStyle;
    expect(shared.className).toBe('btn');
    expect(shared.css).toContain('background: var(--bg);');
    expect(shared.css).toContain('.btn:hover');
    expect(shared.css).toContain('color: var(--fg);');
  });

  it('明示名形 (name) 単独: 第 2 引数省略時は空 properties (line 436 ?? {} 分岐)', () => {
    const result = (themeClass as unknown as (name: string) => SharedStyle)('empty');
    const shared = result as SharedStyle;
    expect(shared.className).toBe('empty');
    // properties が空 → base ルールは空ボディ or 省略
    expect(shared.css).not.toContain('var(--bg)');
  });

  it('無名形 (props) のみ: StyleTemplate を返し selectors は持たない (line 449-454 undefined 経路)', () => {
    const result = themeClass({ background: 'bg', padding: '8px' });
    // StyleTemplate 形状: _kind === 'styleTemplate'
    const tpl = result as StyleTemplate;
    expect(tpl._kind).toBe('styleTemplate');
    expect(tpl.hasExplicitName).toBe(false);
    expect(tpl.properties.background).toBe('var(--bg)');
    expect(tpl.properties.padding).toBe('8px');
    expect(tpl.selectors).toBeUndefined();
  });

  it('無名形 (props, selectors): StyleTemplate に selectors が反映され token 解決される', () => {
    const result = themeClass(
      { background: 'bg' },
      { hover: { color: 'fg' }, focus: { background: 'bg' } },
    );
    const tpl = result as StyleTemplate;
    expect(tpl._kind).toBe('styleTemplate');
    expect(tpl.hasExplicitName).toBe(false);
    expect(tpl.properties.background).toBe('var(--bg)');
    expect(tpl.selectors).toBeDefined();
    expect(tpl.selectors?.hover?.color).toBe('var(--fg)');
    expect(tpl.selectors?.focus?.background).toBe('var(--bg)');
  });
});

describe('resolveSelectorsTokens（Req 4.5）— undefined props skip', () => {
  it('selectors の値が undefined なエントリはスキップされる (line 409-410 ガード)', () => {
    // 異常入力経路：StyleSelectors の型上は Record<string, string> だが
    // 実行時に undefined props を含む selectors を渡しても out に出力されないことを確認。
    const themeClass = buildThemeClass(new Set(['bg']), defaultKeywordResolver);
    const malformedSelectors = {
      hover: { color: 'bg' },
      // 実行時に undefined が混入するケースを再現
      focus: undefined,
    } as unknown as Parameters<typeof themeClass>[2];

    const result = themeClass('x', { background: 'bg' }, malformedSelectors);
    const shared = result as SharedStyle;
    // hover 経路は token 解決される
    expect(shared.css).toContain('.x:hover');
    expect(shared.css).toContain('color: var(--bg);');
    // focus は undefined のため出力されない
    expect(shared.css).not.toContain('.x:focus');
  });
});
