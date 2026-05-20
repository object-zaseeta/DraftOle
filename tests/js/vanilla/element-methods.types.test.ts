/**
 * `ElementMethods<Self>` の型レベルテスト（Task 7.1）。
 *
 * 対応 requirement: 1.4, 1.5, 4.4 (unified-element-api)
 * 対応 design.md セクション: 「ElementMixin」「ElementMethods<Self>」型定義
 *
 * 検証観点:
 *   - 戻り値型が Self（= HtmlTag）であること（Req 1.5）
 *   - 未定義メソッドがコンパイル時に TS2339 を発生させること（Req 1.4）
 *   - string | JsExpr オーバーロードで JsExpr が受け入れられること（Req 4.4）
 *   - number など不正な型はコンパイルエラーになること（Req 1.4）
 *
 * 実装方針:
 *   - `expectTypeOf` (vitest) で正の型アサーション
 *   - `// @ts-expect-error` で負の型アサーション（TypeScript コンパイラが検証）
 *   - module augmentation は `element-methods.ts` の import で自動的に有効になる
 */

import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.ts';
import { PairType } from '../../../src/html/elements/pair-type.ts';
import type { HtmlTag } from '../../../src/html/elements/html-tag.ts';
// module augmentation を有効化するため applyElementMixin をインポートする
import { applyElementMixin } from '../../../src/js/vanilla/element-methods.ts';
import { _makeJsBoolExpr, _makeJsExpr } from '../../../src/js/vanilla/element-ref.ts';
import type { JsBoolExpr, JsExpr } from '../../../src/js/vanilla/types.ts';

// ─── テスト準備 ───────────────────────────────────────────────────────────────

/** id 属性付きの HtmlTag インスタンスを生成する。 */
function makeEl(id: string): HtmlTag {
  const el = new PairType('div');
  el.addHtmlAttribute(HtmlAttribute.keyValue('id', id));
  return el as HtmlTag;
}

// mixin を一度だけプロトタイプに適用する（vitest 実行前）
beforeAll(() => {
  applyElementMixin(PairType.prototype as HtmlTag);
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.5: 戻り値型が Self（HtmlTag）であること
// ─────────────────────────────────────────────────────────────────────────────

describe('戻り値型が Self（HtmlTag）であること（Req 1.5）', () => {
  it('setText の戻り値型は HtmlTag', () => {
    const el = makeEl('a');
    expectTypeOf(el.setText('x')).toEqualTypeOf<HtmlTag>();
  });

  it('setValue の戻り値型は HtmlTag', () => {
    const el = makeEl('a');
    expectTypeOf(el.setValue('v')).toEqualTypeOf<HtmlTag>();
  });

  it('addClass の戻り値型は HtmlTag', () => {
    const el = makeEl('a');
    expectTypeOf(el.addClass('cls')).toEqualTypeOf<HtmlTag>();
  });

  it('toggleClass の戻り値型は HtmlTag', () => {
    const el = makeEl('a');
    expectTypeOf(el.toggleClass('cls')).toEqualTypeOf<HtmlTag>();
  });

  it('removeClass の戻り値型は HtmlTag', () => {
    const el = makeEl('a');
    expectTypeOf(el.removeClass('cls')).toEqualTypeOf<HtmlTag>();
  });

  it('setStyle の戻り値型は HtmlTag', () => {
    const el = makeEl('a');
    expectTypeOf(el.setStyle('color', 'red')).toEqualTypeOf<HtmlTag>();
  });

  it('on の戻り値型は HtmlTag', () => {
    const el = makeEl('a');
    // Task 2.2: transformer 未通過のアロー関数は safety-net で throw されるため
    // 戻り値型の検証は function 式（HandlerCallback 形式）で行う。
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト用（HandlerCallback は function 式で渡す必要がある）
    expectTypeOf(el.on('click', function() {})).toEqualTypeOf<HtmlTag>();
  });

  it('appendChild の戻り値型は HtmlTag', () => {
    const parent = makeEl('parent');
    const child = makeEl('child');
    expectTypeOf(el_appendChild(parent, child)).toEqualTypeOf<HtmlTag>();
  });
});

/** appendChild のヘルパー（型テスト用） */
function el_appendChild(parent: HtmlTag, child: HtmlTag): HtmlTag {
  return parent.appendChild(child);
}

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.4: JsExpr を引数として受け入れること
// ─────────────────────────────────────────────────────────────────────────────

describe('JsExpr 引数の型受容（Req 4.4）', () => {
  it('setText の第 1 引数は string | JsExpr を受け付ける', () => {
    const el = makeEl('a');
    expectTypeOf(el.setText).parameter(0).toMatchTypeOf<string | JsExpr>();
  });

  it('setValue の第 1 引数は string | JsExpr を受け付ける', () => {
    const el = makeEl('a');
    expectTypeOf(el.setValue).parameter(0).toMatchTypeOf<string | JsExpr>();
  });

  it('setStyle の第 2 引数は string | JsExpr を受け付ける', () => {
    const el = makeEl('a');
    expectTypeOf(el.setStyle).parameter(1).toMatchTypeOf<string | JsExpr>();
  });

  it('JsExpr を実際に渡してもコンパイルエラーが発生しない', () => {
    const el = makeEl('a');
    const expr: JsExpr = _makeJsExpr('someVar');
    // 型エラーなしで呼べること（コンパイル通過が検証）
    expectTypeOf(el.setText(expr)).toEqualTypeOf<HtmlTag>();
  });

  it('toggleClass の force 引数は JsBoolExpr を受け付ける', () => {
    const el = makeEl('a');
    const boolExpr: JsBoolExpr = _makeJsBoolExpr('flag');
    expectTypeOf(el.toggleClass('cls', boolExpr)).toEqualTypeOf<HtmlTag>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.4: 未定義メソッドはコンパイル時に型エラーとなること
// ─────────────────────────────────────────────────────────────────────────────

describe('未定義メソッドのコンパイル時エラー（Req 1.4）', () => {
  it('HtmlTag に存在しないメソッドは TS2339 エラーになる', () => {
    const el = makeEl('a');
    expect(() => {
      // @ts-expect-error TS2339: Property 'nonExistentDomMethod' does not exist on type 'HtmlTag'
      el.nonExistentDomMethod();
    }).toThrow(TypeError);
  });

  it('setText に number を渡すと型エラーになる', () => {
    const el = makeEl('a');
    // @ts-expect-error: Argument of type 'number' is not assignable to parameter of type 'string | JsExpr'
    el.setText(42);
  });

  it('setText に boolean を渡すと型エラーになる', () => {
    const el = makeEl('a');
    // @ts-expect-error: Argument of type 'boolean' is not assignable to parameter of type 'string | JsExpr'
    el.setText(true);
  });

  it('addClass に JsExpr を渡すと型エラーになる（string のみ許容）', () => {
    const el = makeEl('a');
    const expr: JsExpr = _makeJsExpr('cls');
    // @ts-expect-error: Argument of type 'JsExpr' is not assignable to parameter of type 'string'
    el.addClass(expr);
  });

  it('toggleClass の force に string を渡すと型エラーになる（JsBoolExpr のみ許容）', () => {
    const el = makeEl('a');
    // @ts-expect-error: Argument of type 'string' is not assignable to parameter of type 'JsBoolExpr | undefined'
    el.toggleClass('cls', 'true');
  });
});
