/**
 * Task 8.1: ネストレイアウトの統合テスト
 *
 * SwiftUI スタイルのレイアウト要素が HTML + CSS を正しく出力することを
 * 統合レベルで検証する。
 *
 * Requirements: 1, 2, 3, 4, 5, 8
 */

import { describe, it, expect } from 'vitest';
import {
  hstack,
  vstack,
  zstack,
  spacer,
  divider,
  Alignment,
  div,
  span,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// Scenario 1: hstack with spacer (Requirements 1, 4)
// ---------------------------------------------------------------------------

describe('統合テスト Scenario 1: hstack + spacer (Req 1, 4)', () => {
  it('hstack(span("A"), spacer(), span("B")) が display:flex flex-direction:row を持つ', () => {
    const el = hstack(span('A'), spacer(), span('B'));
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('flex-direction: row');
  });

  it('hstack の HTML 出力に子要素 <span> が含まれる', () => {
    const el = hstack(span('A'), spacer(), span('B'));
    const html = el.render();
    expect(html).toContain('<span');
    expect(html).toContain('</span>');
    expect(html).toContain('<div');
    expect(html).toContain('</div>');
  });

  it('spacer() の flex:1 1 auto が設定される', () => {
    const sp = spacer();
    const css = sp.collectCssStyleString();
    expect(css).toContain('flex: 1 1 auto');
  });

  it('hstack 内の spacer は flex:1 1 auto スタイルを持つ', () => {
    const sp = spacer();
    const el = hstack(span('A'), sp, span('B'));
    // 全体として 3 子要素を持つ
    expect(el.children.length).toBe(3);
    // spacer 単体でも正しいスタイル
    expect(sp.collectCssStyleString()).toContain('flex: 1 1 auto');
  });
});

// ---------------------------------------------------------------------------
// Scenario 2: Nested vstack with hstack and divider (Requirements 1, 2, 5)
// ---------------------------------------------------------------------------

describe('統合テスト Scenario 2: vstack のネスト構造 (Req 1, 2, 5)', () => {
  it('vstack({ spacing: 14 }, ...) が flex-direction:column, gap:14px を持つ', () => {
    const el = vstack(
      { spacing: 14 },
      hstack(span('left'), spacer(), span('right')),
      divider(),
      hstack(span('bottom-left'), spacer(), span('bottom-right')),
    );
    const css = el.collectCssStyleString();
    expect(css).toContain('flex-direction: column');
    expect(css).toContain('gap: 14px');
  });

  it('ネストされた hstack が flex-direction:row を持つ', () => {
    const inner = hstack(span('left'), spacer(), span('right'));
    const css = inner.collectCssStyleString();
    expect(css).toContain('flex-direction: row');
  });

  it('divider が height:1px を持つ', () => {
    const d = divider();
    const css = d.collectCssStyleString();
    expect(css).toContain('height: 1px');
  });

  it('ネスト構造の HTML 出力に全子要素が含まれる', () => {
    const el = vstack(
      { spacing: 14 },
      hstack(span('left'), spacer(), span('right')),
      divider(),
      hstack(span('bottom-left'), spacer(), span('bottom-right')),
    );
    const html = el.render();
    // 外側 vstack
    expect(html).toContain('<div');
    expect(html).toContain('</div>');
    // 内部 span
    expect(html).toContain('<span');
    expect(html).toContain('</span>');
  });

  it('vstack の子要素数が正しい (hstack + divider + hstack = 3)', () => {
    const el = vstack(
      { spacing: 14 },
      hstack(span('left'), spacer(), span('right')),
      divider(),
      hstack(span('bottom-left'), spacer(), span('bottom-right')),
    );
    expect(el.children.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Scenario 3: zstack with alignment (Requirements 3, 8)
// ---------------------------------------------------------------------------

describe('統合テスト Scenario 3: zstack + alignment (Req 3, 8)', () => {
  it('zstack({ alignment: "topLeading" }) が display:grid, grid-template-areas:"stack" を持つ', () => {
    const el = zstack({ alignment: 'topLeading' }, div('back'), div('front'));
    const css = el.collectCssStyleString();
    expect(css).toContain('display: grid');
    expect(css).toContain('grid-template-areas: "stack"');
  });

  it('zstack({ alignment: "topLeading" }) が align-items:flex-start, justify-content:flex-start を持つ', () => {
    const el = zstack({ alignment: 'topLeading' }, div('back'), div('front'));
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: flex-start');
    expect(css).toContain('justify-content: flex-start');
  });

  it('zstack の子要素数が正しい (back + front = 2)', () => {
    const el = zstack({ alignment: 'topLeading' }, div('back'), div('front'));
    expect(el.children.length).toBe(2);
  });

  it('zstack の HTML 出力に子要素が含まれる', () => {
    const el = zstack({ alignment: 'topLeading' }, div('back'), div('front'));
    const html = el.render();
    expect(html).toContain('<div');
    expect(html).toContain('</div>');
  });

  it('Alignment.center を使った hstack が align-items:center を持つ', () => {
    const el = hstack({ alignment: Alignment.center }, span('A'));
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: center');
  });

  it('zstack の grid-template-rows:1fr, grid-template-columns:1fr が設定される', () => {
    const el = zstack({ alignment: 'topLeading' }, div('layer'));
    const css = el.collectCssStyleString();
    expect(css).toContain('grid-template-rows: 1fr');
    expect(css).toContain('grid-template-columns: 1fr');
  });
});

// ---------------------------------------------------------------------------
// Scenario 4: fluent chain on layout elements (Requirements 1.5, 2.4, 3.3)
// ---------------------------------------------------------------------------

describe('統合テスト Scenario 4: fluent チェーン (Req 1.5, 2.4, 3.3)', () => {
  it('vstack({ spacing: 8 }, ...).padding(16).background("#fff") が全スタイルを持つ', () => {
    const el = vstack({ spacing: 8 }, div('content'))
      .padding('16px')
      .background('#fff');
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('flex-direction: column');
    expect(css).toContain('gap: 8px');
    expect(css).toContain('padding: 16px');
    expect(css).toContain('background: #fff');
  });

  it('hstack().padding().background() チェーンが全スタイルを保持する', () => {
    const el = hstack(span('item'))
      .padding('8px')
      .background('#eee');
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('flex-direction: row');
    expect(css).toContain('padding: 8px');
    expect(css).toContain('background: #eee');
  });

  it('zstack().padding().background() チェーンが全スタイルを保持する', () => {
    const el = zstack(div('content'))
      .padding('16px')
      .background('#000');
    const css = el.collectCssStyleString();
    expect(css).toContain('display: grid');
    expect(css).toContain('grid-template-areas: "stack"');
    expect(css).toContain('padding: 16px');
    expect(css).toContain('background: #000');
  });

  it('spacer().minLength 設定後も flex:1 1 auto が保持される', () => {
    const sp = spacer({ minLength: 16 });
    const css = sp.collectCssStyleString();
    expect(css).toContain('flex: 1 1 auto');
    expect(css).toContain('min-width: 16px');
  });
});

// ---------------------------------------------------------------------------
// Scenario 5: responsive CSS 出力統合テスト (Requirements 9.1, 9.4, 9.5)
// ---------------------------------------------------------------------------

describe('responsive CSS 出力 統合テスト (Req 9.1, 9.4, 9.5)', () => {
  // Requirement 9.1: @media ブロックが CSS 出力に含まれること
  it('div().responsive({ md: { padding: "16px" } }) の collectCssStyleString() が @media (min-width: 768px) を含む (Req 9.1)', () => {
    const el = div().responsive({ md: { padding: '16px' } });
    const css = el.collectCssStyleString();
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('padding: 16px');
  });

  // Requirement 9.4: スコープドCSSがグローバルスタイルと競合しない
  it('@media ブロックはスコープドクラスセレクタ（._xxxxxxxx 形式）を使い、グローバル div セレクタを使わない (Req 9.4)', () => {
    const el = div().responsive({ md: { padding: '16px' } });
    const css = el.collectCssStyleString();
    // @media ブロック内にスコープドクラス名が存在すること
    expect(css).toMatch(/@media \(min-width: 768px\)/);
    expect(css).toMatch(/\._[0-9a-f]+/);
    // グローバルセレクタ (div { ... }) が @media 内にないこと
    expect(css).not.toMatch(/@media[^{]+{\s*div\s*{/);
  });

  // Requirement 9.5: 複数ブレークポイントのサポート
  it('sm と lg の複数ブレークポイントを指定すると両方の @media ブロックが出力される (Req 9.1, 9.5)', () => {
    const el = div().responsive({
      sm: { fontSize: '14px' },
      lg: { fontSize: '18px' },
    });
    const css = el.collectCssStyleString();
    expect(css).toContain('@media (min-width: 640px)');
    expect(css).toContain('@media (min-width: 1024px)');
    expect(css).toContain('font-size: 14px');
    expect(css).toContain('font-size: 18px');
  });

  // Requirement 9.5: fluent チェーンでも responsive が機能する
  it('hstack({ spacing: 8 }).responsive({ md: { gap: "16px" } }).padding(8) でベーススタイルと @media が両方含まれる (Req 9.5)', () => {
    const el = hstack({ spacing: 8 })
      .responsive({ md: { gap: '16px' } })
      .padding('8px');
    const css = el.collectCssStyleString();
    // hstack ベーススタイル
    expect(css).toContain('display: flex');
    expect(css).toContain('flex-direction: row');
    // padding チェーン
    expect(css).toContain('padding: 8px');
    // responsive @media ブロック
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('gap: 16px');
  });

  // Requirement 9.4: 別要素のスコープが汚染されない
  it('responsive を持たない別要素の collectCssStyleString() に @media が含まれない (Req 9.4)', () => {
    const el1 = div().responsive({ md: { color: 'red' } });
    const el2 = div().padding('8px');
    const css1 = el1.collectCssStyleString();
    const css2 = el2.collectCssStyleString();
    // el1 には @media が含まれる
    expect(css1).toContain('@media');
    // el2 には @media が含まれない
    expect(css2).not.toContain('@media');
  });
});
