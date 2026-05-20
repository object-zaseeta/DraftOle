/**
 * layout-factories-hstack-vstack.test.ts
 *
 * hstack / vstack ファクトリ関数のユニットテスト (TDD - Red → Green)
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4
 */
import { describe, it, expect } from 'vitest';
import { hstack, vstack } from '../../../src/html/layout/layout-factories.js';
import { PairType } from '../../../src/html/elements/pair-type.js';
import { Alignment } from '../../../src/css/constants/alignment.js';
import { span } from '../../../src/html/tags/factories-structure.js';

// ---------------------------------------------------------------------------
// hstack
// ---------------------------------------------------------------------------

describe('hstack()', () => {
  it('引数なしで PairType を返す (Req 1.1)', () => {
    const el = hstack();
    expect(el).toBeInstanceOf(PairType);
  });

  it('display:flex が設定される (Req 1.1)', () => {
    const el = hstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
  });

  it('flex-direction:row が設定される (Req 1.1)', () => {
    const el = hstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('flex-direction: row');
  });

  it('spacing オプションで gap が設定される (Req 1.2)', () => {
    const el = hstack({ spacing: 12 });
    const css = el.collectCssStyleString();
    expect(css).toContain('gap: 12px');
  });

  it('alignment オプションで align-items が設定される (Req 1.3)', () => {
    const el = hstack({ alignment: Alignment.center });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: center');
  });

  it('alignment:leading で align-items:flex-start が設定される (Req 1.3)', () => {
    const el = hstack({ alignment: Alignment.leading });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: flex-start');
  });

  it('alignment:trailing で align-items:flex-end が設定される (Req 1.3)', () => {
    const el = hstack({ alignment: Alignment.trailing });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: flex-end');
  });

  it('wrap:true で flex-wrap:wrap が設定される (Req 1.4)', () => {
    const el = hstack({ wrap: true });
    const css = el.collectCssStyleString();
    expect(css).toContain('flex-wrap: wrap');
  });

  it('wrap オプションなしでは flex-wrap が設定されない (Req 1.4)', () => {
    const el = hstack();
    const css = el.collectCssStyleString();
    expect(css).not.toContain('flex-wrap');
  });

  it('子要素 (HtmlTag) を渡せる (Req 1.5)', () => {
    const child = span('hello');
    const el = hstack(child);
    expect(el.children.length).toBe(1);
  });

  it('子要素 (string) を渡せる (Req 1.5)', () => {
    const el = hstack('text');
    expect(el.children.length).toBe(1);
  });

  it('options + 複数子要素を渡せる (Req 1.5)', () => {
    const el = hstack({ spacing: 8 }, span('a'), span('b'));
    const css = el.collectCssStyleString();
    expect(css).toContain('gap: 8px');
    expect(el.children.length).toBe(2);
  });

  it('オプションなしで複数子要素を渡せる (Req 1.5)', () => {
    const el = hstack(span('a'), span('b'), span('c'));
    expect(el.children.length).toBe(3);
  });

  it('fluent メソッド .padding() が使用できる (Req 1.6)', () => {
    const el = hstack().padding('16px');
    expect(el.collectCssStyleString()).toContain('padding: 16px');
  });

  it('fluent メソッド .background() が使用できる (Req 1.6)', () => {
    const el = hstack().background('#fff');
    expect(el.collectCssStyleString()).toContain('background: #fff');
  });

  it('spacing と alignment を同時に指定できる (Req 1.2, 1.3)', () => {
    const el = hstack({ spacing: 16, alignment: Alignment.center });
    const css = el.collectCssStyleString();
    expect(css).toContain('gap: 16px');
    expect(css).toContain('align-items: center');
  });

  it('空のオプションオブジェクトを渡しても display:flex が設定される', () => {
    const el = hstack({});
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('flex-direction: row');
  });
});

// ---------------------------------------------------------------------------
// vstack
// ---------------------------------------------------------------------------

describe('vstack()', () => {
  it('引数なしで PairType を返す (Req 2.1)', () => {
    const el = vstack();
    expect(el).toBeInstanceOf(PairType);
  });

  it('display:flex が設定される (Req 2.1)', () => {
    const el = vstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
  });

  it('flex-direction:column が設定される (Req 2.1)', () => {
    const el = vstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('flex-direction: column');
  });

  it('spacing オプションで gap が設定される (Req 2.2)', () => {
    const el = vstack({ spacing: 20 });
    const css = el.collectCssStyleString();
    expect(css).toContain('gap: 20px');
  });

  it('alignment オプションで align-items が設定される (Req 2.3)', () => {
    const el = vstack({ alignment: Alignment.center });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: center');
  });

  it('wrap:true で flex-wrap:wrap が設定される (Req 2.4)', () => {
    const el = vstack({ wrap: true });
    const css = el.collectCssStyleString();
    expect(css).toContain('flex-wrap: wrap');
  });

  it('子要素 (HtmlTag) を渡せる (Req 2.2)', () => {
    const child = span('item');
    const el = vstack(child);
    expect(el.children.length).toBe(1);
  });

  it('子要素 (string) を渡せる (Req 2.2)', () => {
    const el = vstack('text');
    expect(el.children.length).toBe(1);
  });

  it('options + 複数子要素を渡せる (Req 2.2)', () => {
    const el = vstack({ spacing: 4 }, span('a'), span('b'));
    const css = el.collectCssStyleString();
    expect(css).toContain('gap: 4px');
    expect(el.children.length).toBe(2);
  });

  it('オプションなしで複数子要素を渡せる (Req 2.2)', () => {
    const el = vstack(span('a'), span('b'));
    expect(el.children.length).toBe(2);
  });

  it('fluent メソッド .padding() が使用できる (Req 2.4)', () => {
    const el = vstack().padding('8px');
    expect(el.collectCssStyleString()).toContain('padding: 8px');
  });

  it('spacing と alignment を同時に指定できる (Req 2.2, 2.3)', () => {
    const el = vstack({ spacing: 10, alignment: Alignment.leading });
    const css = el.collectCssStyleString();
    expect(css).toContain('gap: 10px');
    expect(css).toContain('align-items: flex-start');
  });

  it('空のオプションオブジェクトを渡しても display:flex; flex-direction:column が設定される', () => {
    const el = vstack({});
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('flex-direction: column');
  });
});

// ---------------------------------------------------------------------------
// hstack vs vstack の方向の違いを確認する
// ---------------------------------------------------------------------------

describe('hstack と vstack の方向の違い', () => {
  it('hstack は row, vstack は column を生成する', () => {
    const h = hstack();
    const v = vstack();
    expect(h.collectCssStyleString()).toContain('flex-direction: row');
    expect(v.collectCssStyleString()).toContain('flex-direction: column');
  });
});
