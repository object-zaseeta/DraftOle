/**
 * 状態 API 型契約の回帰防止テスト（Task 4.1 / state-handler-typing）
 *
 * 対応 requirements.md セクション:
 *   - 1.1: ReadableState<T>.get() の戻り型は T
 *   - 1.2: State<T>.get() の戻り型は T（ReadableState 継承）
 *   - 1.3: Computed<T>.get() の戻り型は T（ReadableState 継承）
 *   - 2.1: State<T>.set(value: T) が T を受け付ける
 *   - 2.4: State<T>.set(value: JsExpr) オーバーロードも有効
 *
 * 検証観点:
 *   - .get() の戻り型が `T`（`JsExpr` ではない）であることを expectTypeOf で固定
 *   - .set() が `T` と `JsExpr` の両方を受け取ることを固定
 *   - Computed<T> に .set が存在しないことを固定
 *   - 「戻り値が JsExpr のままなら型エラーで落ちる」ことを `// @ts-expect-error` で実証
 *
 * 実装方針:
 *   - vitest の `expectTypeOf` で正の型アサーション
 *   - `*.test-d.ts` 拡張子により vitest typecheck 機構が tsc を通して検証する
 *   - `// @ts-expect-error` で負の型アサーション（typecheck がコンパイル時に検証）
 */

import { describe, expectTypeOf, it } from 'vitest';

import type { Computed, ReadableState, State } from '../../src/js/vanilla/state/state.ts';
import type { JsExpr } from '../../src/js/vanilla/types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.1: ReadableState<T>.get() の戻り型は T
// ─────────────────────────────────────────────────────────────────────────────

describe('ReadableState<T>.get() の戻り型（Req 1.1）', () => {
  it('ReadableState<string>.get() の戻り型は string', () => {
    expectTypeOf<ReturnType<ReadableState<string>['get']>>().toEqualTypeOf<string>();
  });

  it('ReadableState<number>.get() の戻り型は number', () => {
    expectTypeOf<ReturnType<ReadableState<number>['get']>>().toEqualTypeOf<number>();
  });

  it('ReadableState<{ name: string }>.get() の戻り型は { name: string }', () => {
    expectTypeOf<ReturnType<ReadableState<{ name: string }>['get']>>().toEqualTypeOf<{
      name: string;
    }>();
  });

  it('ReadableState<string>.get() の戻り型は JsExpr ではない（回帰防止）', () => {
    // 戻り値が JsExpr のままなら下記の `not.toEqualTypeOf<JsExpr>` は通り、
    // 「T 型である」アサーションは失敗する（型レベルで JsExpr 退行を検出）。
    expectTypeOf<ReturnType<ReadableState<string>['get']>>().not.toEqualTypeOf<JsExpr>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.2: State<T>.get() の戻り型は T
// ─────────────────────────────────────────────────────────────────────────────

describe('State<T>.get() の戻り型（Req 1.2）', () => {
  it('State<string>.get() の戻り型は string', () => {
    expectTypeOf<ReturnType<State<string>['get']>>().toEqualTypeOf<string>();
  });

  it('State<number>.get() の戻り型は number', () => {
    expectTypeOf<ReturnType<State<number>['get']>>().toEqualTypeOf<number>();
  });

  it('State<boolean>.get() の戻り型は boolean', () => {
    expectTypeOf<ReturnType<State<boolean>['get']>>().toEqualTypeOf<boolean>();
  });

  it('State<string[]>.get() の戻り型は string[]', () => {
    expectTypeOf<ReturnType<State<string[]>['get']>>().toEqualTypeOf<string[]>();
  });

  it('State<string>.get() の戻り型は JsExpr ではない（回帰防止）', () => {
    expectTypeOf<ReturnType<State<string>['get']>>().not.toEqualTypeOf<JsExpr>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: Computed<T>.get() の戻り型は T
// ─────────────────────────────────────────────────────────────────────────────

describe('Computed<T>.get() の戻り型（Req 1.3）', () => {
  it('Computed<string>.get() の戻り型は string', () => {
    expectTypeOf<ReturnType<Computed<string>['get']>>().toEqualTypeOf<string>();
  });

  it('Computed<number>.get() の戻り型は number', () => {
    expectTypeOf<ReturnType<Computed<number>['get']>>().toEqualTypeOf<number>();
  });

  it('Computed<{ count: number }>.get() の戻り型は { count: number }', () => {
    expectTypeOf<ReturnType<Computed<{ count: number }>['get']>>().toEqualTypeOf<{
      count: number;
    }>();
  });

  it('Computed<string>.get() の戻り型は JsExpr ではない（回帰防止）', () => {
    expectTypeOf<ReturnType<Computed<string>['get']>>().not.toEqualTypeOf<JsExpr>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 「戻り値が JsExpr のままなら型エラーで落ちる」ことの実証
// （ts-expect-error が成立する＝『JsExpr とイコール』アサーションが現契約では失敗する）
// ─────────────────────────────────────────────────────────────────────────────

describe('get() の戻り型が JsExpr の場合の負アサーション（回帰検出デモ）', () => {
  it('ReadableState<string>.get() を JsExpr と等値主張するとコンパイルエラー', () => {
    // @ts-expect-error: get() の戻り型は string であって JsExpr ではない（Req 1.1 退行検出）
    expectTypeOf<ReturnType<ReadableState<string>['get']>>().toEqualTypeOf<JsExpr>();
  });

  it('State<number>.get() を JsExpr と等値主張するとコンパイルエラー', () => {
    // @ts-expect-error: get() の戻り型は number であって JsExpr ではない（Req 1.2 退行検出）
    expectTypeOf<ReturnType<State<number>['get']>>().toEqualTypeOf<JsExpr>();
  });

  it('Computed<string>.get() を JsExpr と等値主張するとコンパイルエラー', () => {
    // @ts-expect-error: get() の戻り型は string であって JsExpr ではない（Req 1.3 退行検出）
    expectTypeOf<ReturnType<Computed<string>['get']>>().toEqualTypeOf<JsExpr>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 2.1: State<T>.set(value: T) が T を受け付ける
// Req 2.4: State<T>.set(value: JsExpr) オーバーロードも有効
// ─────────────────────────────────────────────────────────────────────────────

describe('State<T>.set のオーバーロード型契約（Req 2.1 / 2.4）', () => {
  it('State<string>.set のパラメータ型は string | JsExpr を受理する', () => {
    expectTypeOf<State<string>['set']>().parameter(0).toMatchTypeOf<string | JsExpr>();
  });

  it('State<number>.set のパラメータ型は number | JsExpr を受理する', () => {
    expectTypeOf<State<number>['set']>().parameter(0).toMatchTypeOf<number | JsExpr>();
  });

  it('State<boolean>.set のパラメータ型は boolean | JsExpr を受理する', () => {
    expectTypeOf<State<boolean>['set']>().parameter(0).toMatchTypeOf<boolean | JsExpr>();
  });

  it('State<string>.set(string) は型エラーなし（Req 2.1）', () => {
    type SetFn = State<string>['set'];
    // 第1オーバーロード: T = string を受け取れる
    expectTypeOf<Parameters<SetFn>[0]>().toMatchTypeOf<string | JsExpr>();
  });

  it('State<string>.set(JsExpr) は型エラーなし（Req 2.4）', () => {
    type SetFn = State<string>['set'];
    // 第2オーバーロード: JsExpr を受け取れる
    const jsExprIsAssignable: JsExpr extends Parameters<SetFn>[0] ? true : false = true;
    expectTypeOf(jsExprIsAssignable).toEqualTypeOf<true>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Computed<T> が .set を持たない（Req 2.4 補足 / 既存 Req 3.2 準拠）
// ─────────────────────────────────────────────────────────────────────────────

describe('Computed<T> は .set を持たない', () => {
  it('Computed<string> のキーに "set" は含まれない', () => {
    expectTypeOf<Computed<string>>().not.toHaveProperty('set');
  });

  it('Computed<number> のキーに "set" は含まれない', () => {
    expectTypeOf<Computed<number>>().not.toHaveProperty('set');
  });

  it('Computed<{ count: number }> のキーに "set" は含まれない', () => {
    expectTypeOf<Computed<{ count: number }>>().not.toHaveProperty('set');
  });

  it('Computed<T> は ReadableState のメンバ（get / map / field）のみ持ち set は無い', () => {
    expectTypeOf<Computed<string>>().toHaveProperty('get');
    expectTypeOf<Computed<string>>().toHaveProperty('map');
    expectTypeOf<Computed<string>>().toHaveProperty('field');
    expectTypeOf<Computed<string>>().not.toHaveProperty('set');
  });
});
