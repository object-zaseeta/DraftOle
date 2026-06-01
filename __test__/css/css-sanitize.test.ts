/**
 * SEC-2: CSS値サニタイズ
 *
 * url(javascript:), url(vbscript:), expression() 等の
 * CSS経由XSS攻撃を検出・ブロックする。
 */
import { describe, it, expect } from 'vitest';
import { sanitizeCssValue, renderCssProperties } from '../../src/css/utils/css-sanitizer.js';
import { CSSBackground } from '../../src/css/style/background/css-background.js';
import { CSSFont } from '../../src/css/style/font/css-font.js';
import { CSSTransform } from '../../src/css/style/transform/css-transform.js';
import { CSSList } from '../../src/css/style/list/css-list.js';
import { CSSVisual } from '../../src/css/style/visual/css-visual.js';
import { createStyle } from '../../src/css/variables/css-shared-style.js';

describe('SEC-2: sanitizeCssValue', () => {

  // ── 危険な値をブロック ──

  it('url(javascript:...) をブロックする', () => {
    expect(sanitizeCssValue('url(javascript:alert(1))')).toBe('');
  });

  it('url(javascript:...) 大文字小文字混在をブロックする', () => {
    expect(sanitizeCssValue('url(JavaScript:alert(1))')).toBe('');
    expect(sanitizeCssValue('url(JAVASCRIPT:alert(1))')).toBe('');
  });

  it('url(vbscript:...) をブロックする', () => {
    expect(sanitizeCssValue('url(vbscript:MsgBox("XSS"))')).toBe('');
  });

  it('expression() をブロックする', () => {
    expect(sanitizeCssValue('expression(alert(1))')).toBe('');
  });

  it('expression() 大文字小文字混在をブロックする', () => {
    expect(sanitizeCssValue('Expression(alert(1))')).toBe('');
    expect(sanitizeCssValue('EXPRESSION(document.cookie)')).toBe('');
  });

  it('スペース入りの url( javascript: ) をブロックする', () => {
    expect(sanitizeCssValue('url( javascript:alert(1) )')).toBe('');
    expect(sanitizeCssValue("url( 'javascript:alert(1)' )")).toBe('');
    expect(sanitizeCssValue('url( "javascript:alert(1)" )')).toBe('');
  });

  it('スペース入りの expression をブロックする', () => {
    expect(sanitizeCssValue('expression (alert(1))')).toBe('');
  });

  it('値の途中に埋め込まれた危険パターンをブロックする', () => {
    expect(sanitizeCssValue('#fff url(javascript:alert(1)) no-repeat')).toBe('');
  });

  // ── 安全な値を許可 ──

  it('通常のCSS値を許可する', () => {
    expect(sanitizeCssValue('16px')).toBe('16px');
    expect(sanitizeCssValue('#ff0000')).toBe('#ff0000');
    expect(sanitizeCssValue('rgba(0, 0, 0, 0.5)')).toBe('rgba(0, 0, 0, 0.5)');
    expect(sanitizeCssValue('1px solid #ccc')).toBe('1px solid #ccc');
  });

  it('安全な url() を許可する', () => {
    expect(sanitizeCssValue('url(image.png)')).toBe('url(image.png)');
    expect(sanitizeCssValue('url(https://example.com/bg.jpg)')).toBe('url(https://example.com/bg.jpg)');
    expect(sanitizeCssValue('url(data:image/png;base64,iVBOR...)')).toBe('url(data:image/png;base64,iVBOR...)');
  });

  it('linear-gradient を許可する', () => {
    expect(sanitizeCssValue('linear-gradient(to right, #000, #fff)')).toBe('linear-gradient(to right, #000, #fff)');
  });

  it('radial-gradient を許可する', () => {
    expect(sanitizeCssValue('radial-gradient(circle, red, blue)')).toBe('radial-gradient(circle, red, blue)');
  });

  it('CSS変数 var() を許可する', () => {
    expect(sanitizeCssValue('var(--bg-color)')).toBe('var(--bg-color)');
  });

  it('calc() を許可する', () => {
    expect(sanitizeCssValue('calc(100% - 20px)')).toBe('calc(100% - 20px)');
  });

  it('CSSフィルタ関数を許可する', () => {
    expect(sanitizeCssValue('blur(5px)')).toBe('blur(5px)');
    expect(sanitizeCssValue('brightness(1.2) contrast(1.1)')).toBe('brightness(1.2) contrast(1.1)');
  });

  it('transform関数を許可する', () => {
    expect(sanitizeCssValue('rotate(45deg) scale(1.5)')).toBe('rotate(45deg) scale(1.5)');
    expect(sanitizeCssValue('translateX(10px)')).toBe('translateX(10px)');
  });
});

describe('SEC-2: renderCssProperties', () => {

  it('空のMapで空文字列を返す', () => {
    expect(renderCssProperties(new Map())).toBe('');
  });

  it('プロパティをアルファベット順にレンダリングする', () => {
    const props = new Map<string, string>();
    props.set('color', '#fff');
    props.set('background', '#000');
    expect(renderCssProperties(props)).toBe('background: #000;\ncolor: #fff;');
  });

  it('危険な値をサニタイズしてレンダリングする', () => {
    const props = new Map<string, string>();
    props.set('color', '#fff');
    props.set('background-image', 'url(javascript:alert(1))');
    // 危険なプロパティは除外される
    expect(renderCssProperties(props)).toBe('color: #fff;');
  });

  it('全て危険な値の場合は空文字列を返す', () => {
    const props = new Map<string, string>();
    props.set('background-image', 'url(javascript:alert(1))');
    props.set('filter', 'expression(alert(1))');
    expect(renderCssProperties(props)).toBe('');
  });
});

describe('SEC-2: CSSプロパティクラスでのサニタイズ', () => {

  it('CSSBackground で url(javascript:) がブロックされる', () => {
    const bg = new CSSBackground();
    bg.setBackgroundImage('url(javascript:alert(1))');
    expect(bg.render()).toBe('');
  });

  it('CSSBackground で安全な url() は許可される', () => {
    const bg = new CSSBackground();
    bg.setBackgroundImage('url(image.png)');
    expect(bg.render()).toContain('url(image.png)');
  });

  it('CSSFont で expression() がブロックされる', () => {
    const font = new CSSFont();
    font.setFontSize('expression(alert(1))');
    expect(font.render()).toBe('');
  });

  it('CSSTransform で expression() がブロックされる', () => {
    const transform = new CSSTransform();
    transform.setFilter('expression(alert(1))');
    expect(transform.render()).toBe('');
  });

  it('CSSList で url(javascript:) がブロックされる', () => {
    const list = new CSSList();
    list.setListStyleImage('url(javascript:alert(1))');
    expect(list.render()).toBe('');
  });

  it('CSSVisual で expression() がブロックされる', () => {
    const visual = new CSSVisual();
    visual.setBoxShadow('expression(alert(1))');
    expect(visual.render()).toBe('');
  });

  it('安全な値と危険な値が混在した場合、安全な値のみ出力される', () => {
    const bg = new CSSBackground();
    bg.setBackgroundColor('#fff');
    bg.setBackgroundImage('url(javascript:alert(1))');
    const result = bg.render();
    expect(result).toContain('background-color: #fff');
    expect(result).not.toContain('javascript');
  });
});

describe('SEC-2: createStyle でのサニタイズ', () => {

  it('危険な値がブロックされる', () => {
    const style = createStyle('test', {
      backgroundImage: 'url(javascript:alert(1))',
      color: '#fff',
    });
    expect(style.css).toContain('color: #fff');
    expect(style.css).not.toContain('javascript');
  });

  it('セレクタ内の危険な値もブロックされる', () => {
    const style = createStyle('test', { color: '#fff' }, {
      hover: { filter: 'expression(alert(1))' },
    });
    expect(style.css).toContain('color: #fff');
    expect(style.css).not.toContain('expression');
  });
});
