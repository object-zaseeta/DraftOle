/**
 * app() ファクトリのユニットテスト
 *
 * Requirements: 1.1, 1.2, 1.3, 3.4
 * Boundary: tests/app/
 *
 * テスト対象:
 * - app() が AppContext（.state メソッド付き）を返す
 * - app().state(0) が State<number> を返し、.set() / .update() / .map() が動作する
 * - app().state({ count: 0 }).field('count') が State<number> を返す
 * - 複数 app() 呼び出しが互いに独立したコンテキストを返す
 */

import { describe, it, expect } from 'vitest';
import { app } from '../../src/app/app';
import type { AppContext } from '../../src/app/app';
import { CssConfig } from '../../src/css/config/css-config';
import { rule, root as cssRoot } from '../../src/css/variables/global-dsl';
import type { Root } from '../../src/html/elements/root';
import { StateImpl } from '../../src/js/vanilla/state/state';

// ────────────────────────────────────────────────────────────
// Req 1.1: app() が AppContext を返す
// ────────────────────────────────────────────────────────────

describe('app() — AppContext の生成 (Req 1.1)', () => {
  it('app() はオブジェクトを返す', () => {
    const ctx = app();
    expect(ctx).toBeDefined();
    expect(typeof ctx).toBe('object');
  });

  it('返値は .state メソッドを持つ', () => {
    const ctx = app();
    expect(typeof ctx.state).toBe('function');
  });

  it('AppContext 型に代入できる', () => {
    const ctx: AppContext = app();
    expect(ctx).toBeDefined();
  });
});

// ────────────────────────────────────────────────────────────
// Req 1.2, 1.3: app().state(v) が State<T> を返す
// ────────────────────────────────────────────────────────────

describe('app().state(v) — State<T> の生成 (Req 1.2, 1.3)', () => {
  it('app().state(0) は StateImpl インスタンスを返す', () => {
    const ctx = app();
    const s = ctx.state(0);
    expect(s).toBeInstanceOf(StateImpl);
  });

  it('State は _runtimeId を持つ', () => {
    const ctx = app();
    const s = ctx.state(0);
    expect(typeof s._runtimeId).toBe('string');
    expect(s._runtimeId.length).toBeGreaterThan(0);
  });

  it('最初の state() 呼び出しで runtimeId が "s0" になる', () => {
    const ctx = app();
    const s = ctx.state(42);
    expect(s._runtimeId).toBe('s0');
  });

  it('複数回 state() を呼び出すと異なる runtimeId が割り当てられる', () => {
    const ctx = app();
    const s0 = ctx.state(0);
    const s1 = ctx.state('hello');
    const s2 = ctx.state(true);
    expect(s0._runtimeId).toBe('s0');
    expect(s1._runtimeId).toBe('s1');
    expect(s2._runtimeId).toBe('s2');
    expect(s0._runtimeId).not.toBe(s1._runtimeId);
    expect(s1._runtimeId).not.toBe(s2._runtimeId);
  });

  describe('.get() — JsExpr を返す (Req 2.1)', () => {
    it('get() は JsExpr オブジェクトを返す', () => {
      const s = app().state(0);
      const expr = s.get();
      expect(expr).toBeDefined();
      expect(expr.__jsExpr).toBe(true);
    });

    it('get() の code は __draftole__.state("s0").get() 形式', () => {
      const s = app().state(0);
      const expr = s.get();
      expect(expr.code).toBe("__draftole__.state('s0').get()");
    });
  });

  describe('.set() — コマンド生成メソッドとして存在する (Req 2.2)', () => {
    it('set メソッドが存在する', () => {
      const s = app().state(0);
      expect(typeof s.set).toBe('function');
    });

    it('即値を渡しても例外を投げない', () => {
      const s = app().state(0);
      expect(() => s.set(99)).not.toThrow();
    });
  });

  describe('.update() — コマンド生成メソッドとして存在する (Req 2.3)', () => {
    it('update メソッドが存在する', () => {
      const s = app().state(0);
      expect(typeof s.update).toBe('function');
    });

    it('JsExpr を渡しても例外を投げない', () => {
      const s = app().state(0);
      const body = { __jsExpr: true as const, code: 'prev + 1', eq: () => { throw new Error(); }, ne: () => { throw new Error(); }, or: () => { throw new Error(); }, trim: () => { throw new Error(); }, isFalsy: () => { throw new Error(); }, isTruthy: () => { throw new Error(); } };
      expect(() => s.update(body)).not.toThrow();
    });
  });

  describe('.map() — Computed<U> を返す (Req 3.1)', () => {
    it('map() を呼び出すと Computed が返る', () => {
      const s = app().state(0);
      const computed = s.map((n: number) => n * 2);
      expect(computed).toBeDefined();
      expect(typeof computed.get).toBe('function');
    });

    it('Computed.get() は JsExpr を返す', () => {
      const s = app().state(0);
      const computed = s.map((n: number) => String(n));
      const expr = computed.get();
      expect(expr.__jsExpr).toBe(true);
      expect(typeof expr.code).toBe('string');
    });

    it('Computed は set を持たない', () => {
      const s = app().state(0);
      const computed = s.map((n: number) => n + 1);
      expect('set' in computed).toBe(false);
    });
  });
});

// ────────────────────────────────────────────────────────────
// Req 3.4: app().state(obj).field(key) が State<T[key]> を返す
// ────────────────────────────────────────────────────────────

describe('app().state(obj).field(key) — フィールド派生 State (Req 3.4)', () => {
  it('field("count") は State-like オブジェクトを返す', () => {
    const ctx = app();
    const s = ctx.state({ count: 0 });
    const fieldState = s.field('count');
    expect(fieldState).toBeDefined();
    expect(typeof fieldState.get).toBe('function');
  });

  it('返された State は _runtimeId を持つ', () => {
    const s = app().state({ count: 0 });
    const fieldState = s.field('count');
    expect(typeof fieldState._runtimeId).toBe('string');
    expect(fieldState._runtimeId.length).toBeGreaterThan(0);
  });

  it('field() の _runtimeId は元の State の _runtimeId と異なる', () => {
    const ctx = app();
    const s = ctx.state({ count: 0 });
    const fieldState = s.field('count');
    expect(fieldState._runtimeId).not.toBe(s._runtimeId);
  });

  it('field() が返す State の _fieldKey は "count"', () => {
    const s = app().state({ count: 0 });
    const fieldState = s.field('count') as StateImpl<number>;
    expect(fieldState._fieldKey).toBe('count');
  });

  it('field() が返す State の _parent は元の State を指す', () => {
    const ctx = app();
    const s = ctx.state({ count: 0 }) as StateImpl<{ count: number }>;
    const fieldState = s.field('count') as StateImpl<number>;
    expect(fieldState._parent).toBe(s);
  });

  it('field() が返す State.get() はフィールドアクセス式を含む', () => {
    const s = app().state({ count: 0 });
    const fieldState = s.field('count');
    const expr = fieldState.get();
    expect(expr.__jsExpr).toBe(true);
    expect(expr.code).toContain('count');
  });

  it('field() で set メソッドが存在する（書き戻し可能）', () => {
    const s = app().state({ count: 0 });
    const fieldState = s.field('count');
    expect(typeof fieldState.set).toBe('function');
  });
});

// ────────────────────────────────────────────────────────────
// Req 1.1 / 3.4: 複数 app() 呼び出しの独立性
// ────────────────────────────────────────────────────────────

describe('複数 app() 呼び出しの独立性 (Req 1.1)', () => {
  it('2 つの app() は別オブジェクトを返す', () => {
    const ctx1 = app();
    const ctx2 = app();
    expect(ctx1).not.toBe(ctx2);
  });

  it('各 app() の最初の state() で runtimeId が "s0" から始まる（独立したレジストリ）', () => {
    const ctx1 = app();
    const ctx2 = app();
    const s1 = ctx1.state(0);
    const s2 = ctx2.state(0);
    // 両方 "s0" から始まる（互いに独立）
    expect(s1._runtimeId).toBe('s0');
    expect(s2._runtimeId).toBe('s0');
  });

  it('ctx1 の state が ctx2 の採番に影響しない', () => {
    const ctx1 = app();
    const ctx2 = app();
    // ctx1 で 3 つ作る
    ctx1.state(1);
    ctx1.state(2);
    ctx1.state(3);
    // ctx2 はまだ "s0" から始まる
    const s = ctx2.state(0);
    expect(s._runtimeId).toBe('s0');
  });

  it('各コンテキストは独立して複数 state を採番できる', () => {
    const ctx1 = app();
    const ctx2 = app();
    const c1s0 = ctx1.state(10);
    const c1s1 = ctx1.state(20);
    const c2s0 = ctx2.state(100);
    const c2s1 = ctx2.state(200);

    expect(c1s0._runtimeId).toBe('s0');
    expect(c1s1._runtimeId).toBe('s1');
    expect(c2s0._runtimeId).toBe('s0');
    expect(c2s1._runtimeId).toBe('s1');
  });
});

// ────────────────────────────────────────────────────────────
// Req 4.5, 4.6: app() ファクトリ オプション分岐網羅
// AppBranchTests — css ternary 3 分岐 + cssConfig 有無の組み合わせ
// ────────────────────────────────────────────────────────────

/**
 * AppDocument の生成時に Root constructor に渡された `css` 配列を観測するために、
 * 内部の private `_root` フィールドへバケットアクセスで到達し
 * `collectCssStyleString()` の出力で間接的に確認する。
 *
 * DocumentContext.collectCss は global CSS を最初に出力するため、
 * `css` オプションで渡したルールは出力 CSS の先頭ブロックとして観測できる。
 */
function getRoot(doc: ReturnType<typeof app>): Root {
  const r = (doc as unknown as { _root: Root })._root;
  return r;
}

describe('app() — css / cssConfig オプション分岐 (Req 4.5, 4.6)', () => {
  describe('css ternary 3 分岐 (Req 4.6)', () => {
    it('(undefined) options 未指定 → css 空（global CSS が出力に含まれない）', () => {
      const doc = app();
      const css = getRoot(doc).collectCssStyleString();
      // 子要素なし + global css なし → 空文字列
      expect(css).toBe('');
    });

    it('(undefined) options = {} 空オブジェクト → css 空', () => {
      const doc = app({});
      const css = getRoot(doc).collectCssStyleString();
      expect(css).toBe('');
    });

    it('(undefined) cssConfig だけ指定（css 未指定）→ css 空', () => {
      const doc = app({ cssConfig: new CssConfig({ minifyClassNames: false }) });
      const css = getRoot(doc).collectCssStyleString();
      expect(css).toBe('');
    });

    it('(single GlobalCss) 単一 GlobalCss 値 → 1 要素配列にラップされて出力に含まれる', () => {
      const single = rule('.brand', { color: 'red' });
      const doc = app({ css: single });
      const css = getRoot(doc).collectCssStyleString();
      // 単一値も配列扱いされて Root → DocumentContext に渡り、出力 CSS に含まれる
      expect(css).toContain('.brand {');
      expect(css).toContain('color: red;');
    });

    it('(array) GlobalCss 配列 → そのまま全要素が出力に含まれる', () => {
      const r1 = rule('.a', { color: 'red' });
      const r2 = rule('.b', { color: 'blue' });
      const doc = app({ css: [r1, r2] });
      const css = getRoot(doc).collectCssStyleString();
      expect(css).toContain('.a {');
      expect(css).toContain('color: red;');
      expect(css).toContain('.b {');
      expect(css).toContain('color: blue;');
    });

    it('(array, empty) 空配列 → global CSS 出力なし（配列分岐は走るが要素ゼロ）', () => {
      const doc = app({ css: [] });
      const css = getRoot(doc).collectCssStyleString();
      expect(css).toBe('');
    });

    it('(array, single element) 1 要素配列 → 単一値ラップ分岐と区別され、そのまま渡る', () => {
      const r1 = rule('.solo', { padding: '4px' });
      const doc = app({ css: [r1] });
      const css = getRoot(doc).collectCssStyleString();
      expect(css).toContain('.solo {');
      expect(css).toContain('padding: 4px;');
    });

    it('3 分岐の出力が観測可能に異なる: undefined → "" / single → 単一含む / array → 複数含む', () => {
      const docNone = app();
      const single = rule('.only', { color: 'red' });
      const docSingle = app({ css: single });
      const docArr = app({ css: [rule('.x', { color: 'red' }), rule('.y', { color: 'blue' })] });

      const cssNone = getRoot(docNone).collectCssStyleString();
      const cssSingle = getRoot(docSingle).collectCssStyleString();
      const cssArr = getRoot(docArr).collectCssStyleString();

      expect(cssNone).toBe('');
      expect(cssSingle).toContain('.only {');
      expect(cssSingle).not.toContain('.x {');
      expect(cssArr).toContain('.x {');
      expect(cssArr).toContain('.y {');
      expect(cssArr).not.toContain('.only {');
    });
  });

  describe('cssConfig オプション (Req 4.6)', () => {
    it('cssConfig 省略 → 既定 CssConfig が適用される（AppDocument 生成成功）', () => {
      const doc = app();
      expect(doc).toBeDefined();
      // collectCssStyleString が例外を投げずに動作する = CssConfig が解決済み
      expect(() => getRoot(doc).collectCssStyleString()).not.toThrow();
    });

    it('cssConfig 明示 → 同じ AppDocument 生成パスを通る', () => {
      const cfg = new CssConfig({ minifyClassNames: true });
      const doc = app({ cssConfig: cfg });
      expect(doc).toBeDefined();
      expect(() => getRoot(doc).collectCssStyleString()).not.toThrow();
    });

    it('cssConfig + css 配列 の同時指定 → 両方が反映される', () => {
      const cfg = new CssConfig({ minifyClassNames: false });
      const themeCss = cssRoot({ '--bg': '#000' });
      const doc = app({
        cssConfig: cfg,
        css: [themeCss],
      });
      const css = getRoot(doc).collectCssStyleString();
      expect(css).toContain(':root {');
      expect(css).toContain('--bg: #000;');
    });

    it('cssConfig + css 単一値 の同時指定 → 単一値ラップ + cssConfig 適用', () => {
      const cfg = new CssConfig({ minifyClassNames: false });
      const single = rule('.combo', { margin: '0' });
      const doc = app({ cssConfig: cfg, css: single });
      const css = getRoot(doc).collectCssStyleString();
      expect(css).toContain('.combo {');
      expect(css).toContain('margin: 0;');
    });
  });

  describe('オプション組み合わせ (Req 4.6)', () => {
    it('全フィールド指定 → AppDocument 生成成功', () => {
      const doc = app({
        lang: 'ja',
        charset: 'UTF-8',
        title: 'Sample',
        description: 'desc',
        viewport: 'width=device-width, initial-scale=1',
        wrapDOMReady: true,
        css: [rule('.a', { color: 'red' })],
        cssConfig: new CssConfig({ minifyClassNames: false }),
      });
      expect(doc).toBeDefined();
      expect(typeof doc.state).toBe('function');
      const css = getRoot(doc).collectCssStyleString();
      expect(css).toContain('.a {');
    });

    it('一部フィールドのみ指定（lang のみ） → デフォルト + 上書きの組み合わせで生成成功', () => {
      const doc = app({ lang: 'ja' });
      expect(doc).toBeDefined();
      // css 未指定 → 空
      expect(getRoot(doc).collectCssStyleString()).toBe('');
    });

    it('app() と app({}) は同等の挙動（css 空・cssConfig デフォルト）', () => {
      const a = app();
      const b = app({});
      expect(getRoot(a).collectCssStyleString()).toBe(getRoot(b).collectCssStyleString());
    });
  });
});
