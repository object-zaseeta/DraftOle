/**
 * CSS-2: グローバルCSS注入
 *
 * new Root({ css: [...] }) でグローバルCSSを追加し、
 * collectCssStyleString() の先頭に出力する。
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import { div } from '../../src/html/tags/factories.js';
import { rule, all, root as rootRule } from '../../src/css/variables/global-dsl.js';

describe('CSS-2: グローバルCSS注入', () => {

  it('コンストラクタ css オプションでグローバルCSSを追加できる', () => {
    const root = new Root({ css: [all({ boxSizing: 'border-box' })] });
    const css = root.collectCssStyleString();
    expect(css).toContain('box-sizing: border-box');
  });

  it('複数のグローバルCSSを追加できる', () => {
    const root = new Root({
      css: [
        all({ boxSizing: 'border-box' }),
        rule('html, body', { height: '100%' }),
      ],
    });
    const css = root.collectCssStyleString();
    expect(css).toContain('box-sizing: border-box');
    expect(css).toContain('height: 100%');
  });

  it('グローバルCSSがスコープCSSより前に出力される', () => {
    const root = new Root({ css: [all({ margin: '0' })] });

    const el = div().padding('24px');
    root.addChild(el);

    const css = root.collectCssStyleString();
    const globalIdx = css.indexOf('margin: 0');
    const scopedIdx = css.indexOf('padding: 24px');
    expect(globalIdx).toBeLessThan(scopedIdx);
  });

  it('グローバルCSSなしでも正常動作（後方互換）', () => {
    const root = new Root();
    const el = div().padding('10px');
    root.addChild(el);
    const css = root.collectCssStyleString();
    expect(css).toContain('padding: 10px');
  });

  it('css オプション省略時はCSS出力が空文字列', () => {
    const root = new Root();
    const css = root.collectCssStyleString();
    expect(css).toBe('');
  });

  it('CSS変数定義を注入できる', () => {
    const root = new Root({
      css: [rootRule({ '--bg': '#0b1220', '--accent': '#7c5cff' })],
    });
    const css = root.collectCssStyleString();
    expect(css).toContain('--bg: #0b1220');
    expect(css).toContain('--accent: #7c5cff');
  });

  it('css オプションに空配列を渡してもエラーが発生しない', () => {
    const root = new Root({ css: [] });
    const css = root.collectCssStyleString();
    expect(css).toBe('');
  });
});
