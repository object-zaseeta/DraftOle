/**
 * ElementMethods の状態受容オーバーロードに関する型レベルテスト（Task 4.3）
 *
 * 対応 requirement: 4.8
 * 対応 design.md セクション: 「ElementMethods<Self> の拡張」
 *
 * 検証観点:
 *   - State<number> を .text() に渡すとコンパイルエラー（ReadableState<string> が必要）（Req 4.8）
 *   - .map(String) で Computed<string> にしてから渡すと型エラーなし
 *   - State<string> / Computed<string> は .text() に受け入れられる
 *   - State<number> を .setValue() に渡すとコンパイルエラー
 *   - State<boolean> が .checked() に受け入れられる
 *   - State<string> が .checked() に渡せないことを確認（Req 4.8 類似）
 *
 * 実装方針:
 *   - `expectTypeOf` (vitest) で正の型アサーション
 *   - `// @ts-expect-error` で負の型アサーション（TypeScript コンパイラが検証）
 *   - module augmentation は element-methods.ts の import で自動的に有効になる
 */

import { beforeAll, describe, expectTypeOf, it } from 'vitest';

import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.ts';
import { PairType } from '../../../src/html/elements/pair-type.ts';
import type { HtmlTag } from '../../../src/html/elements/html-tag.ts';
import { applyElementMixin } from '../../../src/js/vanilla/element-methods.ts';
import { StateImpl } from '../../../src/js/vanilla/state/state.ts';
import type { State, Computed, ReadableState } from '../../../src/js/vanilla/state/state.ts';

// ─── テスト準備 ───────────────────────────────────────────────────────────────

/** テスト用 StateRegistry モック */
function makeRegistry() {
  let counter = 0;
  return {
    allocateId: () => `s${counter++}`,
    register: () => {},
    registerDerived: () => {},
  };
}

/** State<T> を生成するヘルパー */
function makeState<T>(id: string): State<T> {
  return new StateImpl<T>(id, makeRegistry() as never);
}

/** id 属性付き HtmlTag インスタンスを生成する */
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
// Req 4.8: 型 T と要素メソッドの期待型が非互換な場合はコンパイルエラー
// ─────────────────────────────────────────────────────────────────────────────

describe('.text() の型チェック（Req 4.8）', () => {
  it('ReadableState<string> を .text() に渡しても型エラーなし', () => {
    const el = makeEl('t1');
    const s = makeState<string>('s0');
    expectTypeOf(el.text(s)).toEqualTypeOf<HtmlTag>();
  });

  it('Computed<string> を .text() に渡しても型エラーなし', () => {
    const el = makeEl('t2');
    const s = makeState<number>('s0');
    const computed: Computed<string> = s.map(String);
    expectTypeOf(el.text(computed)).toEqualTypeOf<HtmlTag>();
  });

  it('State<number> を .text() に渡すとコンパイルエラー（ReadableState<string> が必要）', () => {
    const el = makeEl('t3');
    const numState: State<number> = makeState<number>('s0');
    // @ts-expect-error: Argument of type 'State<number>' is not assignable to parameter of type 'string | JsExpr | ReadableState<string>'
    el.text(numState);
  });

  it('.map(String) 経由は型エラーなし', () => {
    const el = makeEl('t4');
    const numState = makeState<number>('s0');
    const strComputed: Computed<string> = numState.map(String);
    // map 経由で string 化してから渡すと型エラーなし
    expectTypeOf(el.text(strComputed)).toEqualTypeOf<HtmlTag>();
  });

  it('string リテラルを .text() に渡しても型エラーなし', () => {
    const el = makeEl('t5');
    expectTypeOf(el.text('hello')).toEqualTypeOf<HtmlTag>();
  });

  it('State<boolean> を .text() に渡すとコンパイルエラー', () => {
    const el = makeEl('t6');
    const boolState: State<boolean> = makeState<boolean>('s0');
    // @ts-expect-error: Argument of type 'State<boolean>' is not assignable to parameter of type 'string | JsExpr | ReadableState<string>'
    el.text(boolState);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// .value() の型チェック（Req 4.8 類似）
// ─────────────────────────────────────────────────────────────────────────────

describe('.value() の型チェック（Req 4.8）', () => {
  it('ReadableState<string> を .value() に渡しても型エラーなし', () => {
    const el = makeEl('v1');
    const s: ReadableState<string> = makeState<string>('s0');
    expectTypeOf(el.value(s)).toEqualTypeOf<HtmlTag>();
  });

  it('State<number> を .value() に渡すとコンパイルエラー', () => {
    const el = makeEl('v2');
    const numState: State<number> = makeState<number>('s0');
    // @ts-expect-error: Argument of type 'State<number>' is not assignable to parameter of type 'string | JsExpr | ReadableState<string>'
    el.value(numState);
  });

  it('.map(String) 経由は型エラーなし', () => {
    const el = makeEl('v3');
    const numState = makeState<number>('s0');
    const strComputed: Computed<string> = numState.map(String);
    expectTypeOf(el.value(strComputed)).toEqualTypeOf<HtmlTag>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// .checked() の型チェック
// ─────────────────────────────────────────────────────────────────────────────

describe('.checked() の型チェック', () => {
  it('ReadableState<boolean> を .checked() に渡しても型エラーなし', () => {
    const el = makeEl('c1');
    const boolState: ReadableState<boolean> = makeState<boolean>('s0');
    expectTypeOf(el.checked(boolState)).toEqualTypeOf<HtmlTag>();
  });

  it('State<string> を .checked() に渡すとコンパイルエラー', () => {
    const el = makeEl('c2');
    const strState: State<string> = makeState<string>('s0');
    // @ts-expect-error: Argument of type 'State<string>' is not assignable to parameter of type 'ReadableState<boolean>'
    el.checked(strState);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// .addClass() の型チェック
// ─────────────────────────────────────────────────────────────────────────────

describe('.addClass() の型チェック', () => {
  it('ReadableState<string> を .addClass() に渡しても型エラーなし', () => {
    const el = makeEl('a1');
    const strState: ReadableState<string> = makeState<string>('s0');
    expectTypeOf(el.addClass(strState)).toEqualTypeOf<HtmlTag>();
  });

  it('State<number> を .addClass() に渡すとコンパイルエラー', () => {
    const el = makeEl('a2');
    const numState: State<number> = makeState<number>('s0');
    // @ts-expect-error: Argument of type 'State<number>' is not assignable to parameter of type 'string | ReadableState<string>'
    el.addClass(numState);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// .setText() の型チェック（text のエイリアス）
// ─────────────────────────────────────────────────────────────────────────────

describe('.setText() の型チェック（Req 4.8）', () => {
  it('State<number> を .setText() に渡すとコンパイルエラー', () => {
    const el = makeEl('st1');
    const numState: State<number> = makeState<number>('s0');
    // @ts-expect-error: Argument of type 'State<number>' is not assignable to parameter of type 'string | JsExpr | ReadableState<string>'
    el.setText(numState);
  });

  it('State<string> を .setText() に渡しても型エラーなし', () => {
    const el = makeEl('st2');
    const strState: State<string> = makeState<string>('s0');
    expectTypeOf(el.setText(strState)).toEqualTypeOf<HtmlTag>();
  });
});
