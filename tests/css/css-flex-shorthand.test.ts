/**
 * DF-7: setFlex() ショートハンド
 *
 * display:flex + 主要プロパティを1メソッドで設定する。
 */
import { describe, it, expect } from 'vitest';
import { CSSFlex } from '../../src/css/style/flex/css-flex.js';
import { div } from '../../src/html/tags/factories.js';

describe('DF-7: CSSFlex.setFlex() ショートハンド', () => {

  it('引数なしで display:flex のみ設定される', () => {
    const flex = new CSSFlex();
    flex.setFlex();
    expect(flex.render()).toContain('display: flex');
  });

  it('gap を指定できる', () => {
    const flex = new CSSFlex();
    flex.setFlex({ gap: '10px' });
    const result = flex.render();
    expect(result).toContain('display: flex');
    expect(result).toContain('gap: 10px');
  });

  it('direction を指定できる', () => {
    const flex = new CSSFlex();
    flex.setFlex({ direction: 'column' });
    const result = flex.render();
    expect(result).toContain('display: flex');
    expect(result).toContain('flex-direction: column');
  });

  it('align を指定できる', () => {
    const flex = new CSSFlex();
    flex.setFlex({ align: 'center' });
    const result = flex.render();
    expect(result).toContain('display: flex');
    expect(result).toContain('align-items: center');
  });

  it('justify を指定できる', () => {
    const flex = new CSSFlex();
    flex.setFlex({ justify: 'space-between' });
    const result = flex.render();
    expect(result).toContain('display: flex');
    expect(result).toContain('justify-content: space-between');
  });

  it('wrap を指定できる', () => {
    const flex = new CSSFlex();
    flex.setFlex({ wrap: 'wrap' });
    const result = flex.render();
    expect(result).toContain('display: flex');
    expect(result).toContain('flex-wrap: wrap');
  });

  it('複数オプションを同時に指定できる', () => {
    const flex = new CSSFlex();
    flex.setFlex({ direction: 'row', gap: '8px', align: 'center', justify: 'space-between' });
    const result = flex.render();
    expect(result).toContain('display: flex');
    expect(result).toContain('flex-direction: row');
    expect(result).toContain('gap: 8px');
    expect(result).toContain('align-items: center');
    expect(result).toContain('justify-content: space-between');
  });

  it('メソッドチェーンが可能', () => {
    const flex = new CSSFlex();
    const result = flex.setFlex({ gap: '10px' });
    expect(result).toBe(flex);
  });
});

describe('DF-7: HtmlTag.flex() ショートハンド', () => {

  it('HtmlTag から flex() が使える', () => {
    const el = div().flex();
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
  });

  it('HtmlTag から flex() にオプションを渡せる', () => {
    const el = div().flex({ gap: '12px', align: 'center' });
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('gap: 12px');
    expect(css).toContain('align-items: center');
  });

  it('他のフルエントメソッドとチェーンできる', () => {
    const el = div().flex({ gap: '8px' }).padding('16px').background('#000');
    const css = el.collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('gap: 8px');
    expect(css).toContain('padding: 16px');
    expect(css).toContain('background-color: #000');
  });
});
