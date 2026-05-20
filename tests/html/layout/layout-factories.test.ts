/**
 * layout-factories.test.ts
 *
 * レイアウトファクトリ関数の包括的ユニットテスト
 * hstack / vstack / zstack / spacer / divider を公開 API 経由で検証する
 *
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1, 4.2, 5.1, 5.2
 */
import { describe, expect, it } from 'vitest';
import { Alignment, divider, hstack, spacer, vstack, zstack } from '../../../src/index.js';

// ---------------------------------------------------------------------------
// hstack — 基本 CSS 出力 (Req 1.1)
// ---------------------------------------------------------------------------

describe('hstack() — 基本 CSS (Req 1.1)', () => {
  it('display:flex が設定される', () => {
    const el = hstack();
    expect(el.collectCssStyleString()).toContain('display: flex');
  });

  it('flex-direction:row が設定される', () => {
    const el = hstack();
    expect(el.collectCssStyleString()).toContain('flex-direction: row');
  });

  it('引数なしでも有効な HTML が返る', () => {
    const html = hstack().render();
    expect(html).toContain('<div');
    expect(html).toContain('</div>');
  });

  it('空のオプションオブジェクトでも display:flex; flex-direction:row が設定される', () => {
    const css = hstack({}).collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('flex-direction: row');
  });
});

// ---------------------------------------------------------------------------
// hstack — spacing オプション (Req 1.2)
// ---------------------------------------------------------------------------

describe('hstack() — spacing オプション (Req 1.2)', () => {
  it('spacing:12 で gap:12px が設定される', () => {
    const css = hstack({ spacing: 12 }).collectCssStyleString();
    expect(css).toContain('gap: 12px');
  });

  it('spacing:0 で gap:0px が設定される', () => {
    const css = hstack({ spacing: 0 }).collectCssStyleString();
    expect(css).toContain('gap: 0px');
  });

  it('spacing:24 で gap:24px が設定される', () => {
    const css = hstack({ spacing: 24 }).collectCssStyleString();
    expect(css).toContain('gap: 24px');
  });
});

// ---------------------------------------------------------------------------
// hstack — alignment オプション (Req 1.3)
// ---------------------------------------------------------------------------

describe('hstack() — alignment オプション (Req 1.3)', () => {
  it('alignment:center で align-items:center が設定される', () => {
    const css = hstack({ alignment: Alignment.center }).collectCssStyleString();
    expect(css).toContain('align-items: center');
  });

  it('alignment:leading で align-items:flex-start が設定される', () => {
    const css = hstack({ alignment: Alignment.leading }).collectCssStyleString();
    expect(css).toContain('align-items: flex-start');
  });

  it('alignment:trailing で align-items:flex-end が設定される', () => {
    const css = hstack({ alignment: Alignment.trailing }).collectCssStyleString();
    expect(css).toContain('align-items: flex-end');
  });
});

// ---------------------------------------------------------------------------
// hstack — wrap オプション (Req 1.3)
// ---------------------------------------------------------------------------

describe('hstack() — wrap オプション', () => {
  it('wrap:true で flex-wrap:wrap が設定される', () => {
    const css = hstack({ wrap: true }).collectCssStyleString();
    expect(css).toContain('flex-wrap: wrap');
  });

  it('wrap 未指定では flex-wrap が設定されない', () => {
    const css = hstack().collectCssStyleString();
    expect(css).not.toContain('flex-wrap');
  });
});

// ---------------------------------------------------------------------------
// hstack — spacing + alignment の複合 (Req 1.2, 1.3)
// ---------------------------------------------------------------------------

describe('hstack() — spacing + alignment の複合 (Req 1.2, 1.3)', () => {
  it('spacing:12, alignment:center を同時指定できる', () => {
    const css = hstack({ spacing: 12, alignment: Alignment.center }).collectCssStyleString();
    expect(css).toContain('gap: 12px');
    expect(css).toContain('align-items: center');
  });

  it('spacing:8, alignment:leading を同時指定できる', () => {
    const css = hstack({ spacing: 8, alignment: Alignment.leading }).collectCssStyleString();
    expect(css).toContain('gap: 8px');
    expect(css).toContain('align-items: flex-start');
  });
});

// ---------------------------------------------------------------------------
// hstack — fluent API (Req 1.3)
// ---------------------------------------------------------------------------

describe('hstack() — fluent API', () => {
  it('.padding() チェーンが使用できる', () => {
    const css = hstack().padding('16px').collectCssStyleString();
    expect(css).toContain('padding: 16px');
  });

  it('.background() チェーンが使用できる', () => {
    const css = hstack().background('#fff').collectCssStyleString();
    expect(css).toContain('background: #fff');
  });

  it('fluent チェーンしても display:flex が保持される', () => {
    const css = hstack().padding('8px').background('#eee').collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('flex-direction: row');
  });
});

// ---------------------------------------------------------------------------
// vstack — 基本 CSS 出力 (Req 2.1)
// ---------------------------------------------------------------------------

describe('vstack() — 基本 CSS (Req 2.1)', () => {
  it('display:flex が設定される', () => {
    const css = vstack().collectCssStyleString();
    expect(css).toContain('display: flex');
  });

  it('flex-direction:column が設定される', () => {
    const css = vstack().collectCssStyleString();
    expect(css).toContain('flex-direction: column');
  });

  it('hstack は row、vstack は column の方向になる', () => {
    expect(hstack().collectCssStyleString()).toContain('flex-direction: row');
    expect(vstack().collectCssStyleString()).toContain('flex-direction: column');
  });
});

// ---------------------------------------------------------------------------
// vstack — spacing オプション (Req 2.2)
// ---------------------------------------------------------------------------

describe('vstack() — spacing オプション (Req 2.2)', () => {
  it('spacing:8 で gap:8px が設定される', () => {
    const css = vstack({ spacing: 8 }).collectCssStyleString();
    expect(css).toContain('gap: 8px');
  });

  it('spacing:20 で gap:20px が設定される', () => {
    const css = vstack({ spacing: 20 }).collectCssStyleString();
    expect(css).toContain('gap: 20px');
  });
});

// ---------------------------------------------------------------------------
// vstack — alignment オプション (Req 2.2)
// ---------------------------------------------------------------------------

describe('vstack() — alignment オプション (Req 2.2)', () => {
  it('alignment:leading で align-items:flex-start が設定される', () => {
    const css = vstack({ alignment: Alignment.leading }).collectCssStyleString();
    expect(css).toContain('align-items: flex-start');
  });

  it('alignment:center で align-items:center が設定される', () => {
    const css = vstack({ alignment: Alignment.center }).collectCssStyleString();
    expect(css).toContain('align-items: center');
  });

  it('alignment:trailing で align-items:flex-end が設定される', () => {
    const css = vstack({ alignment: Alignment.trailing }).collectCssStyleString();
    expect(css).toContain('align-items: flex-end');
  });
});

// ---------------------------------------------------------------------------
// vstack — fluent API (Req 2.2)
// ---------------------------------------------------------------------------

describe('vstack() — fluent API', () => {
  it('.padding() チェーンが使用できる', () => {
    const css = vstack().padding('8px').collectCssStyleString();
    expect(css).toContain('padding: 8px');
  });

  it('fluent チェーンしても display:flex; flex-direction:column が保持される', () => {
    const css = vstack().padding('8px').collectCssStyleString();
    expect(css).toContain('display: flex');
    expect(css).toContain('flex-direction: column');
  });
});

// ---------------------------------------------------------------------------
// zstack — CSS グリッドオーバーラップ出力 (Req 3.1)
// ---------------------------------------------------------------------------

describe('zstack() — CSS グリッドオーバーラップ (Req 3.1)', () => {
  it('display:grid が設定される', () => {
    const css = zstack().collectCssStyleString();
    expect(css).toContain('display: grid');
  });

  it('grid-template-areas:"stack" が設定される', () => {
    const css = zstack().collectCssStyleString();
    expect(css).toContain('grid-template-areas: "stack"');
  });

  it('grid-template-rows:1fr が設定される', () => {
    const css = zstack().collectCssStyleString();
    expect(css).toContain('grid-template-rows: 1fr');
  });

  it('grid-template-columns:1fr が設定される', () => {
    const css = zstack().collectCssStyleString();
    expect(css).toContain('grid-template-columns: 1fr');
  });

  it('デフォルトで align-items:center が設定される', () => {
    const css = zstack().collectCssStyleString();
    expect(css).toContain('align-items: center');
  });

  it('デフォルトで justify-content:center が設定される', () => {
    const css = zstack().collectCssStyleString();
    expect(css).toContain('justify-content: center');
  });

  it('有効な HTML が返る', () => {
    const html = zstack().render();
    expect(html).toContain('<div');
    expect(html).toContain('</div>');
  });
});

// ---------------------------------------------------------------------------
// zstack — fluent API (Req 3.1)
// ---------------------------------------------------------------------------

describe('zstack() — fluent API', () => {
  it('.padding() チェーンが使用できる', () => {
    const css = zstack().padding('16px').collectCssStyleString();
    expect(css).toContain('padding: 16px');
  });

  it('.background() チェーンが使用できる', () => {
    const css = zstack().background('#000').collectCssStyleString();
    expect(css).toContain('background: #000');
  });
});

// ---------------------------------------------------------------------------
// spacer — flex 設定 (Req 4.1)
// ---------------------------------------------------------------------------

describe('spacer() — flex 設定 (Req 4.1)', () => {
  it('flex:1 1 auto が設定される', () => {
    const css = spacer().collectCssStyleString();
    expect(css).toContain('flex: 1 1 auto');
  });

  it('有効な HTML が返る', () => {
    const html = spacer().render();
    expect(html).toContain('<div');
    expect(html).toContain('</div>');
  });

  it('minLength 未指定では min-width が設定されない', () => {
    const css = spacer().collectCssStyleString();
    expect(css).not.toContain('min-width');
  });
});

// ---------------------------------------------------------------------------
// spacer — minLength オプション (Req 4.2)
// ---------------------------------------------------------------------------

describe('spacer() — minLength オプション (Req 4.2)', () => {
  it('minLength:8 で min-width:8px が設定される', () => {
    const css = spacer({ minLength: 8 }).collectCssStyleString();
    expect(css).toContain('min-width: 8px');
  });

  it('minLength:16 で min-width:16px が設定される', () => {
    const css = spacer({ minLength: 16 }).collectCssStyleString();
    expect(css).toContain('min-width: 16px');
  });

  it('minLength 指定時も flex:1 1 auto が保持される', () => {
    const css = spacer({ minLength: 8 }).collectCssStyleString();
    expect(css).toContain('flex: 1 1 auto');
    expect(css).toContain('min-width: 8px');
  });
});

// ---------------------------------------------------------------------------
// divider — 水平バリアント (Req 5.1)
// ---------------------------------------------------------------------------

describe('divider() — 水平バリアント (Req 5.1)', () => {
  it('height:1px が設定される', () => {
    const css = divider().collectCssStyleString();
    expect(css).toContain('height: 1px');
  });

  it('opacity:0.15 が設定される', () => {
    const css = divider().collectCssStyleString();
    expect(css).toContain('opacity: 0.15');
  });

  it('width:100% が設定される', () => {
    const css = divider().collectCssStyleString();
    expect(css).toContain('width: 100%');
  });

  it('background:currentColor が設定される', () => {
    const css = divider().collectCssStyleString();
    expect(css).toContain('background: currentColor');
  });

  it('有効な HTML が返る', () => {
    const html = divider().render();
    expect(html).toContain('<div');
    expect(html).toContain('</div>');
  });
});

// ---------------------------------------------------------------------------
// divider — 垂直バリアント (Req 5.2)
// ---------------------------------------------------------------------------

describe('divider("vertical") — 垂直バリアント (Req 5.2)', () => {
  it('width:1px が設定される', () => {
    const css = divider('vertical').collectCssStyleString();
    expect(css).toContain('width: 1px');
  });

  it('opacity:0.15 が設定される', () => {
    const css = divider('vertical').collectCssStyleString();
    expect(css).toContain('opacity: 0.15');
  });

  it('align-self:stretch が設定される', () => {
    const css = divider('vertical').collectCssStyleString();
    expect(css).toContain('align-self: stretch');
  });

  it('background:currentColor が設定される', () => {
    const css = divider('vertical').collectCssStyleString();
    expect(css).toContain('background: currentColor');
  });

  it('height プロパティが設定されない', () => {
    const css = divider('vertical').collectCssStyleString();
    expect(css).not.toContain('height');
  });
});

// ---------------------------------------------------------------------------
// divider — horizontal 明示指定 (Req 5.1)
// ---------------------------------------------------------------------------

describe('divider("horizontal") — 明示指定 (Req 5.1)', () => {
  it('height:1px, width:100%, opacity:0.15 が設定される', () => {
    const css = divider('horizontal').collectCssStyleString();
    expect(css).toContain('height: 1px');
    expect(css).toContain('width: 100%');
    expect(css).toContain('opacity: 0.15');
  });

  it('align-self が設定されない', () => {
    const css = divider('horizontal').collectCssStyleString();
    expect(css).not.toContain('align-self');
  });
});

// ---------------------------------------------------------------------------
// divider — fluent API
// ---------------------------------------------------------------------------

describe('divider() — fluent API', () => {
  it('.color() チェーンが使用できる', () => {
    const css = divider().color('red').collectCssStyleString();
    expect(css).toContain('color: red');
  });

  it('.margin() チェーンが使用できる', () => {
    const css = divider().margin('8px 0').collectCssStyleString();
    expect(css).toContain('margin: 8px 0');
  });

  it('vertical divider でも fluent チェーンが使用できる', () => {
    const css = divider('vertical').color('blue').margin('0 8px').collectCssStyleString();
    expect(css).toContain('color: blue');
    expect(css).toContain('margin: 0 8px');
  });
});
