/**
 * layout-factories-spacer-divider.test.ts
 *
 * spacer / divider ファクトリ関数のユニットテスト (TDD - Red → Green)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4
 */
import { describe, it, expect } from 'vitest';
import { spacer, divider } from '../../../src/html/layout/layout-factories.js';
import { PairType } from '../../../src/html/elements/pair-type.js';

// ---------------------------------------------------------------------------
// spacer
// ---------------------------------------------------------------------------

describe('spacer()', () => {
  it('引数なしで PairType を返す (Req 4.1)', () => {
    const el = spacer();
    expect(el).toBeInstanceOf(PairType);
  });

  it('flex:1 1 auto が設定される (Req 4.1)', () => {
    const el = spacer();
    const css = el.collectCssStyleString();
    expect(css).toContain('flex: 1 1 auto');
  });

  it('minLength オプションなしでは min-width が設定されない (Req 4.2)', () => {
    const el = spacer();
    const css = el.collectCssStyleString();
    expect(css).not.toContain('min-width');
  });

  it('minLength オプションで min-width が設定される (Req 4.2)', () => {
    const el = spacer({ minLength: 8 });
    const css = el.collectCssStyleString();
    expect(css).toContain('min-width: 8px');
  });

  it('minLength:16 で min-width:16px が設定される (Req 4.2)', () => {
    const el = spacer({ minLength: 16 });
    const css = el.collectCssStyleString();
    expect(css).toContain('min-width: 16px');
  });

  it('空のオプションで flex:1 1 auto のみ設定される (Req 4.1, 4.2)', () => {
    const el = spacer({});
    const css = el.collectCssStyleString();
    expect(css).toContain('flex: 1 1 auto');
    expect(css).not.toContain('min-width');
  });

  it('fluent メソッド .margin() が使用できる (Req 4.3)', () => {
    const el = spacer().margin('4px');
    expect(el.collectCssStyleString()).toContain('margin: 4px');
  });

  it('fluent メソッド .background() が使用できる (Req 4.4)', () => {
    const el = spacer().background('#eee');
    expect(el.collectCssStyleString()).toContain('background: #eee');
  });
});

// ---------------------------------------------------------------------------
// divider
// ---------------------------------------------------------------------------

describe('divider()', () => {
  it('引数なしで PairType を返す (Req 5.1)', () => {
    const el = divider();
    expect(el).toBeInstanceOf(PairType);
  });

  it('引数なし（水平）で height:1px が設定される (Req 5.1)', () => {
    const el = divider();
    const css = el.collectCssStyleString();
    expect(css).toContain('height: 1px');
  });

  it('引数なし（水平）で background:currentColor が設定される (Req 5.1)', () => {
    const el = divider();
    const css = el.collectCssStyleString();
    expect(css).toContain('background: currentColor');
  });

  it('引数なし（水平）で opacity:0.15 が設定される (Req 5.1)', () => {
    const el = divider();
    const css = el.collectCssStyleString();
    expect(css).toContain('opacity: 0.15');
  });

  it('引数なし（水平）で width:100% が設定される (Req 5.1)', () => {
    const el = divider();
    const css = el.collectCssStyleString();
    expect(css).toContain('width: 100%');
  });

  it('horizontal 指定で水平 divider が生成される (Req 5.2)', () => {
    const el = divider('horizontal');
    const css = el.collectCssStyleString();
    expect(css).toContain('height: 1px');
    expect(css).toContain('background: currentColor');
    expect(css).toContain('opacity: 0.15');
    expect(css).toContain('width: 100%');
  });

  it('vertical 指定で width:1px が設定される (Req 5.3)', () => {
    const el = divider('vertical');
    const css = el.collectCssStyleString();
    expect(css).toContain('width: 1px');
  });

  it('vertical 指定で background:currentColor が設定される (Req 5.3)', () => {
    const el = divider('vertical');
    const css = el.collectCssStyleString();
    expect(css).toContain('background: currentColor');
  });

  it('vertical 指定で opacity:0.15 が設定される (Req 5.3)', () => {
    const el = divider('vertical');
    const css = el.collectCssStyleString();
    expect(css).toContain('opacity: 0.15');
  });

  it('vertical 指定で align-self:stretch が設定される (Req 5.3)', () => {
    const el = divider('vertical');
    const css = el.collectCssStyleString();
    expect(css).toContain('align-self: stretch');
  });

  it('vertical 指定では height が設定されない (Req 5.3)', () => {
    const el = divider('vertical');
    const css = el.collectCssStyleString();
    expect(css).not.toContain('height');
  });

  it('horizontal 指定では align-self が設定されない (Req 5.2)', () => {
    const el = divider('horizontal');
    const css = el.collectCssStyleString();
    expect(css).not.toContain('align-self');
  });

  it('fluent メソッド .color() が使用できる (Req 5.4)', () => {
    const el = divider().color('red');
    expect(el.collectCssStyleString()).toContain('color: red');
  });

  it('fluent メソッド .margin() が使用できる (Req 5.4)', () => {
    const el = divider().margin('8px 0');
    expect(el.collectCssStyleString()).toContain('margin: 8px 0');
  });

  it('vertical の fluent メソッドチェーン .color().margin() が使用できる (Req 5.4)', () => {
    const el = divider('vertical').color('blue').margin('0 8px');
    const css = el.collectCssStyleString();
    expect(css).toContain('color: blue');
    expect(css).toContain('margin: 0 8px');
  });
});
