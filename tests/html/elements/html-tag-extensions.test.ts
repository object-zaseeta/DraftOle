/**
 * Task 7.2 (swiftui-layout): HtmlTag 拡張メソッドの統合テスト。
 *
 * `.frame()`, `.padding()`, `.if()` の 3 拡張メソッドを網羅する
 * 15 ユニットテストケースを含む。
 *
 * Requirements: 6.1, 6.3, 6.5, 7.1, 7.2, 7.5, 10.1, 10.2, 10.3
 * Design: テスト戦略 #7–#10, #13–#15
 */
import { describe, expect, it } from 'vitest';
import { div } from '../../../src/index.js';

// ── ヘルパー ──────────────────────────────────────────────────────────────

/** position スタイルの CSS 文字列を取得する */
function positionStyle(el: ReturnType<typeof div>): string {
  return el.style.position.render();
}

/** spacing スタイルの CSS 文字列を取得する */
function spacingStyle(el: ReturnType<typeof div>): string {
  return el.style.spacing.render();
}

/** background スタイルの CSS 文字列を取得する */
function backgroundStyle(el: ReturnType<typeof div>): string {
  return el.style.backgroundColor.render();
}

// ── .frame() テスト ───────────────────────────────────────────────────────

describe('HtmlTag.frame() 拡張テスト (要件 6.1, 6.3, 6.5)', () => {
  // テストケース 1: width 数値 → {n}px
  it('1. frame({ width: 200 }) が width:200px を設定する (要件 6.1)', () => {
    const el = div();
    el.frame({ width: 200 });
    expect(positionStyle(el)).toContain('width: 200px');
  });

  // テストケース 2: height 数値 → {n}px
  it('2. frame({ height: 100 }) が height:100px を設定する (要件 6.1)', () => {
    const el = div();
    el.frame({ height: 100 });
    expect(positionStyle(el)).toContain('height: 100px');
  });

  // テストケース 3: maxWidth: Infinity → max-width:100%
  it('3. frame({ maxWidth: Infinity }) が max-width:100% を設定する (要件 6.3)', () => {
    const el = div();
    el.frame({ maxWidth: Infinity });
    expect(positionStyle(el)).toContain('max-width: 100%');
  });

  // テストケース 4: minWidth と maxWidth の両方を数値で設定する
  it('4. frame({ minWidth: 50, maxWidth: 400 }) が両プロパティを設定する (要件 6.1)', () => {
    const el = div();
    el.frame({ minWidth: 50, maxWidth: 400 });
    const style = positionStyle(el);
    expect(style).toContain('min-width: 50px');
    expect(style).toContain('max-width: 400px');
  });

  // テストケース 5: width と maxWidth: Infinity の組み合わせ
  it('5. frame({ width: 700, maxWidth: Infinity }) が width:700px と max-width:100% を設定する (要件 6.1, 6.3)', () => {
    const el = div();
    el.frame({ width: 700, maxWidth: Infinity });
    const style = positionStyle(el);
    expect(style).toContain('width: 700px');
    expect(style).toContain('max-width: 100%');
  });

  // テストケース 6: 2 回目の frame() 呼び出しは未指定プロパティを保持する
  it('6. 2 回目の frame() 呼び出しで未指定プロパティが保持される (要件 6.5)', () => {
    const el = div();
    el.frame({ width: 700, maxWidth: Infinity });
    el.frame({ width: 200 });
    const style = positionStyle(el);
    // width は更新される
    expect(style).toContain('width: 200px');
    // maxWidth は保持される
    expect(style).toContain('max-width: 100%');
  });
});

// ── .padding() オーバーロードテスト ──────────────────────────────────────

describe('HtmlTag.padding() オーバーロードテスト (要件 7.1, 7.2, 7.5)', () => {
  // テストケース 7: padding(number) → padding:{n}px
  it('7. padding(16) が padding:16px を設定する (要件 7.1)', () => {
    const el = div();
    el.padding(16);
    expect(spacingStyle(el)).toContain('padding: 16px');
  });

  // テストケース 8: padding('horizontal', number) → padding-left / padding-right
  it('8. padding("horizontal", 8) が padding-left:8px と padding-right:8px を設定する (要件 7.2)', () => {
    const el = div();
    el.padding('horizontal', 8);
    const style = spacingStyle(el);
    expect(style).toContain('padding-left: 8px');
    expect(style).toContain('padding-right: 8px');
  });

  // テストケース 9: padding('vertical', number) → padding-top / padding-bottom
  it('9. padding("vertical", 8) が padding-top:8px と padding-bottom:8px を設定する (要件 7.2)', () => {
    const el = div();
    el.padding('vertical', 8);
    const style = spacingStyle(el);
    expect(style).toContain('padding-top: 8px');
    expect(style).toContain('padding-bottom: 8px');
  });

  // テストケース 10: padding('top', number) → padding-top のみ
  it('10. padding("top", 4) が padding-top:4px のみを設定する (要件 7.2)', () => {
    const el = div();
    el.padding('top', 4);
    const style = spacingStyle(el);
    expect(style).toContain('padding-top: 4px');
    expect(style).not.toContain('padding-right');
    expect(style).not.toContain('padding-bottom');
    expect(style).not.toContain('padding-left');
  });

  // テストケース 11: 既存文字列 API の後方互換
  it('11. padding("16px 8px") が後方互換で動作する (要件 7.5)', () => {
    const el = div();
    el.padding('16px 8px');
    expect(spacingStyle(el)).toContain('padding: 16px 8px');
  });
});

// ── .if() テスト ──────────────────────────────────────────────────────────

describe('HtmlTag.if() 条件付き修飾子テスト (要件 10.1, 10.2, 10.3)', () => {
  // テストケース 12: condition === true → modifier 適用
  it('12. if(true, el => el.background("#f00")) が background を設定する (要件 10.1)', () => {
    const el = div();
    el.if(true, e => e.background('#f00'));
    expect(backgroundStyle(el)).toContain('#f00');
  });

  // テストケース 13: condition === false → modifier 適用しない
  it('13. if(false, el => el.background("#f00")) が background を設定しない (要件 10.2)', () => {
    const el = div();
    el.if(false, e => e.background('#f00'));
    expect(backgroundStyle(el)).not.toContain('#f00');
  });

  // テストケース 14: modifier が null を返した場合は元の要素を返す
  it('14. if(true, () => null) が元の要素を返す (要件 10.3)', () => {
    const el = div();
    const result = el.if(true, _e => null);
    expect(result).toBe(el);
  });

  // テストケース 15: チェーン位置での .if() — 複数修飾子の組み合わせ
  it('15. if(true, el => el.color("red").background("blue")) がチェーン位置で動作する (要件 10.3)', () => {
    const el = div();
    const result = el
      .padding(8)
      .if(true, e => e.color('red').background('blue'))
      .frame({ width: 300 });
    // チェーンが this を返すことを確認
    expect(result).toBe(el);
    // background が設定されていることを確認
    expect(backgroundStyle(el)).toContain('blue');
    // frame も適用されていることを確認
    expect(positionStyle(el)).toContain('width: 300px');
    // padding も適用されていることを確認
    expect(spacingStyle(el)).toContain('padding: 8px');
  });
});
