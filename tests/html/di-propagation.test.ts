/**
 * Task 6.3: factory および Root 経由の DI 伝播統合テスト
 *
 * 検証対象:
 * - `new Root({ css: mockCss, jqm: mockJqm })` の Root インスタンスが注入参照を保持する (Req 4.1)
 * - factory 関数（例: `html(..., { css, jqm })`, `div(..., { css, jqm })`）が
 *   末尾 options を検出し、生成されるトップレベルタグへ注入参照を伝播する (Req 4.2, 4.4)
 * - options 省略時には従来通りデフォルトマネージャで生成され、レンダリング結果が
 *   既存挙動と等価（非空タグの生成）である (Req 6.3)
 * - モック注入ルートでは具象マネージャが生成されず、注入参照が使われる (Req 5.1)
 *
 * 実装仕様の明確化（design.md System Flows 参照）:
 *   HtmlTagOptions はコンストラクタ/ factory 呼び出し時点の「そのタグ」に対して解決される。
 *   すでに構築済みの子要素（例: `html(div(), p(), { css, jqm })` における `div()` / `p()`）
 *   は独自の解決済み依存を既に持っているため、親の options は自動伝播しない。
 *   このテストはこの仕様を明示的に固定する（将来の意図しない伝播変更を検出する）。
 *
 * Requirements: 4.1, 4.2, 4.4, 5.1, 6.3
 */
import { describe, it, expect, vi } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import { html, div, p, body, head } from '../../src/html/tags/factories.js';
import { PairType } from '../../src/html/elements/pair-type.js';
import type { CssManagerInstance } from '../../src/html/protocols/css-manager-instance-type.js';
import type { JQueryManagerInstance } from '../../src/html/protocols/jquery-manager-instance-type.js';

const makeMockCss = (): CssManagerInstance =>
  ({
    layout: {},
    styleManager: { style: {} },
    tagPath: 'mock',
    config: {},
    updateTagPath: vi.fn(),
    updateLazyLayoutRegister: vi.fn(),
    render: () => '',
    renderCss: () => '',
  }) as unknown as CssManagerInstance;

const makeMockJqm = (): JQueryManagerInstance =>
  ({
    path: 'mock',
    usedMethods: new Set(),
    css: vi.fn(() => ''),
    height: vi.fn(() => ''),
    on: vi.fn(() => ''),
    click: vi.fn(() => ''),
    keydown: vi.fn(() => ''),
    keyup: vi.fn(() => ''),
    text: vi.fn(() => ''),
    html: vi.fn(() => ''),
    addClass: vi.fn(() => ''),
    removeClass: vi.fn(() => ''),
    toggleClass: vi.fn(() => ''),
    needsHelper: () => false,
    updatePath: vi.fn(),
    render: () => '',
  }) as unknown as JQueryManagerInstance;

describe('DI 伝播統合テスト (Task 6.3)', () => {
  describe('Root 経由の DI 伝播 (Req 4.1)', () => {
    it('new Root({ css, jqm }) で Root インスタンスが注入参照を `===` で保持する', () => {
      const mockCss = makeMockCss();
      const mockJqm = makeMockJqm();

      const root = new Root({ css: mockCss, jqm: mockJqm });

      expect(root.css).toBe(mockCss);
      expect(root.jqm).toBe(mockJqm);
    });

    it('Root に後から addChild した子要素は、自身の構築時 options に従う（親参照を上書きしない）', () => {
      const mockCssRoot = makeMockCss();
      const mockJqmRoot = makeMockJqm();
      const mockCssChild = makeMockCss();
      const mockJqmChild = makeMockJqm();

      const root = new Root({ css: mockCssRoot, jqm: mockJqmRoot });
      const child = new PairType('div', { css: mockCssChild, jqm: mockJqmChild });
      root.addChild(child);

      // Root は注入参照を保持
      expect(root.css).toBe(mockCssRoot);
      expect(root.jqm).toBe(mockJqmRoot);

      // 子は自身の構築時に注入された参照を保持（親に上書きされない）
      expect(child.css).toBe(mockCssChild);
      expect(child.jqm).toBe(mockJqmChild);
    });
  });

  describe('factory 経由の DI 伝播 (Req 4.2, 4.4)', () => {
    it('html(..., { css, jqm }) が生成するトップレベルタグが注入参照を `===` で保持する', () => {
      const mockCss = makeMockCss();
      const mockJqm = makeMockJqm();

      const tag = html({ css: mockCss, jqm: mockJqm });

      expect(tag.css).toBe(mockCss);
      expect(tag.jqm).toBe(mockJqm);
    });

    it('div({ id: "x" }, "hello", { css, jqm }) — 属性/子要素と末尾 options を共存させても注入参照を保持する', () => {
      const mockCss = makeMockCss();
      const mockJqm = makeMockJqm();

      const tag = div({ id: 'x' }, 'hello', { css: mockCss, jqm: mockJqm });

      expect(tag.css).toBe(mockCss);
      expect(tag.jqm).toBe(mockJqm);
    });

    it('html(body(div()), { css, jqm }) — トップレベルのみ注入、既構築子要素は自身の依存を保持', () => {
      const mockCss = makeMockCss();
      const mockJqm = makeMockJqm();
      const inner = div();
      const outer = body(inner);

      const tag = html(outer, { css: mockCss, jqm: mockJqm });

      // トップレベル html タグは注入参照を保持
      expect(tag.css).toBe(mockCss);
      expect(tag.jqm).toBe(mockJqm);

      // 既構築の子要素は自身の（デフォルト）依存を保持。注入参照で上書きされない。
      expect(outer.css).not.toBe(mockCss);
      expect(outer.jqm).not.toBe(mockJqm);
      expect(inner.css).not.toBe(mockCss);
      expect(inner.jqm).not.toBe(mockJqm);

      // かつ、子要素の依存は非 null（protocol instance として有効）
      expect(outer.css).toBeDefined();
      expect(outer.jqm).toBeDefined();
      expect(inner.css).toBeDefined();
      expect(inner.jqm).toBeDefined();
    });

    it('同一 options を各 factory 呼び出しに明示的に渡した場合、各タグが `===` で同一参照を共有する (Req 4.4)', () => {
      const mockCss = makeMockCss();
      const mockJqm = makeMockJqm();
      const opts = { css: mockCss, jqm: mockJqm };

      const innerDiv = div(opts);
      const innerP = p(opts);
      const bodyTag = body(innerDiv, innerP, opts);
      const htmlTag = html(bodyTag, opts);

      for (const tag of [innerDiv, innerP, bodyTag, htmlTag]) {
        expect(tag.css).toBe(mockCss);
        expect(tag.jqm).toBe(mockJqm);
      }
    });

    it('Root + factory 子を同一 options で組み立てると、全ノードが注入参照を `===` で共有する', () => {
      const mockCss = makeMockCss();
      const mockJqm = makeMockJqm();
      const opts = { css: mockCss, jqm: mockJqm };

      const headTag = head(opts);
      const bodyTag = body(opts);
      const htmlTag = html(headTag, bodyTag, opts);
      const root = new Root(opts);
      root.addChild(htmlTag);

      for (const tag of [root, htmlTag, headTag, bodyTag]) {
        expect(tag.css).toBe(mockCss);
        expect(tag.jqm).toBe(mockJqm);
      }
    });
  });

  describe('options 省略時の後方互換性 (Req 6.3)', () => {
    it('options を渡さずに factory を呼ぶと、デフォルトのマネージャが設定され非 null である', () => {
      const tag = html(body(div('hi')));
      expect(tag.css).toBeDefined();
      expect(tag.jqm).toBeDefined();
      // render は空文字列（デフォルト CssManager/JQueryManager はスタブ動作）
      expect(typeof tag.css.render()).toBe('string');
      expect(typeof tag.jqm.render()).toBe('string');
    });

    it('options 省略時の render 出力が非空の有効な HTML 文字列になる（既存挙動との回帰）', () => {
      const root = new Root();
      root.addChild(html(body(div('hello'))));
      const out = root.render();

      expect(out).toContain('<html>');
      expect(out).toContain('<body>');
      expect(out).toContain('<div');
      expect(out).toContain('hello');
      expect(out).toContain('</html>');
    });

    it('options 省略時の Root もデフォルトマネージャを持ち、css/jqm は非 null', () => {
      const root = new Root();
      expect(root.css).toBeDefined();
      expect(root.jqm).toBeDefined();
    });
  });
});
