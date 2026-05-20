/**
 * layout-factories-zstack.test.ts
 *
 * zstack ファクトリ関数のユニットテスト (TDD - Red → Green)
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
import { describe, it, expect } from 'vitest';
import { zstack } from '../../../src/html/layout/layout-factories.js';
import { PairType } from '../../../src/html/elements/pair-type.js';
import { ZStackAlignment } from '../../../src/css/constants/alignment.js';
import { span } from '../../../src/html/tags/factories-structure.js';

// ---------------------------------------------------------------------------
// zstack - 基本動作
// ---------------------------------------------------------------------------

describe('zstack()', () => {
  it('引数なしで PairType を返す (Req 3.1)', () => {
    const el = zstack();
    expect(el).toBeInstanceOf(PairType);
  });

  it('display:grid が設定される (Req 3.1)', () => {
    const el = zstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('display: grid');
  });

  it('grid-template-areas:"stack" が設定される (Req 3.1)', () => {
    const el = zstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('grid-template-areas: "stack"');
  });

  it('grid-template-rows:1fr が設定される (Req 3.1)', () => {
    const el = zstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('grid-template-rows: 1fr');
  });

  it('grid-template-columns:1fr が設定される (Req 3.1)', () => {
    const el = zstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('grid-template-columns: 1fr');
  });

  it('デフォルトで align-items:center が設定される (Req 3.1)', () => {
    const el = zstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: center');
  });

  it('デフォルトで justify-content:center が設定される (Req 3.1)', () => {
    const el = zstack();
    const css = el.collectCssStyleString();
    expect(css).toContain('justify-content: center');
  });
});

// ---------------------------------------------------------------------------
// zstack - alignment オプション
// ---------------------------------------------------------------------------

describe('zstack() - alignment オプション (Req 3.2)', () => {
  it('alignment:topLeading で align-items:flex-start, justify-content:flex-start が設定される', () => {
    const el = zstack({ alignment: 'topLeading' });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: flex-start');
    expect(css).toContain('justify-content: flex-start');
  });

  it('alignment:topTrailing で align-items:flex-start, justify-content:flex-end が設定される', () => {
    const el = zstack({ alignment: 'topTrailing' });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: flex-start');
    expect(css).toContain('justify-content: flex-end');
  });

  it('alignment:bottomLeading で align-items:flex-end, justify-content:flex-start が設定される', () => {
    const el = zstack({ alignment: 'bottomLeading' });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: flex-end');
    expect(css).toContain('justify-content: flex-start');
  });

  it('alignment:bottomTrailing で align-items:flex-end, justify-content:flex-end が設定される', () => {
    const el = zstack({ alignment: 'bottomTrailing' });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: flex-end');
    expect(css).toContain('justify-content: flex-end');
  });

  it('alignment:top で align-items:flex-start, justify-content:center が設定される', () => {
    const el = zstack({ alignment: 'top' });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: flex-start');
    expect(css).toContain('justify-content: center');
  });

  it('alignment:bottom で align-items:flex-end, justify-content:center が設定される', () => {
    const el = zstack({ alignment: 'bottom' });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: flex-end');
    expect(css).toContain('justify-content: center');
  });

  it('alignment:leading で align-items:center, justify-content:flex-start が設定される', () => {
    const el = zstack({ alignment: 'leading' });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: center');
    expect(css).toContain('justify-content: flex-start');
  });

  it('alignment:trailing で align-items:center, justify-content:flex-end が設定される', () => {
    const el = zstack({ alignment: 'trailing' });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: center');
    expect(css).toContain('justify-content: flex-end');
  });

  it('alignment:center で align-items:center, justify-content:center が設定される', () => {
    const el = zstack({ alignment: 'center' });
    const css = el.collectCssStyleString();
    expect(css).toContain('align-items: center');
    expect(css).toContain('justify-content: center');
  });

  it('ZStackAlignment 定数を使って alignment が正しく設定される', () => {
    const key = 'topLeading' as const;
    const expected = ZStackAlignment[key];
    const el = zstack({ alignment: key });
    const css = el.collectCssStyleString();
    expect(css).toContain(`align-items: ${expected.alignItems}`);
    expect(css).toContain(`justify-content: ${expected.justifyContent}`);
  });
});

// ---------------------------------------------------------------------------
// zstack - 子要素
// ---------------------------------------------------------------------------

describe('zstack() - 子要素 (Req 3.1, 3.4)', () => {
  it('子要素 (HtmlTag) を渡せる', () => {
    const child = span('layer');
    const el = zstack(child);
    expect(el.children.length).toBe(1);
  });

  it('子要素 (string) を渡せる', () => {
    const el = zstack('text');
    expect(el.children.length).toBe(1);
  });

  it('options + 複数子要素を渡せる', () => {
    const el = zstack({ alignment: 'center' }, span('back'), span('front'));
    expect(el.children.length).toBe(2);
  });

  it('オプションなしで複数子要素を渡せる', () => {
    const el = zstack(span('a'), span('b'), span('c'));
    expect(el.children.length).toBe(3);
  });

  it('子要素なし（空コンテナ）を呼び出せる', () => {
    const el = zstack();
    expect(el.children.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// zstack - fluent メソッド (Req 3.3)
// ---------------------------------------------------------------------------

describe('zstack() - fluent メソッド (Req 3.3)', () => {
  it('fluent メソッド .padding() が使用できる', () => {
    const el = zstack().padding('16px');
    expect(el.collectCssStyleString()).toContain('padding: 16px');
  });

  it('fluent メソッド .background() が使用できる', () => {
    const el = zstack().background('#fff');
    expect(el.collectCssStyleString()).toContain('background: #fff');
  });

  it('fluent メソッド .width() が使用できる', () => {
    const el = zstack().width('100px');
    expect(el.collectCssStyleString()).toContain('width: 100px');
  });

  it('fluent メソッド .height() が使用できる', () => {
    const el = zstack().height('200px');
    expect(el.collectCssStyleString()).toContain('height: 200px');
  });
});

// ---------------------------------------------------------------------------
// zstack - HTML の妥当性 (Req 3.4)
// ---------------------------------------------------------------------------

describe('zstack() - HTML バリッド出力 (Req 3.4)', () => {
  it('zstack() がタグ名 "div" を持つ PairType を返す', () => {
    const el = zstack();
    expect(el.tagType).toBe('div');
  });

  it('子要素を持つ zstack の HTML に子要素が含まれる', () => {
    const child = span('hello');
    const el = zstack(child);
    const html = el.render();
    expect(html).toContain('<div');
    expect(html).toContain('</div>');
    expect(html).toContain('<span');
  });

  it('grid-template-areas の値が引用符付きで出力される', () => {
    const el = zstack();
    const css = el.collectCssStyleString();
    expect(css).toMatch(/grid-template-areas:\s*"stack"/);
  });
});
