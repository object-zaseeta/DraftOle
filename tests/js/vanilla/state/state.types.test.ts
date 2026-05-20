/**
 * State<T> / Computed<T> の型レベルテスト（Task 4.3）
 *
 * 対応 requirement: 1.5, 2.5
 * 対応 design.md セクション: 「State<T>」「Computed<T>」「ReadableState<T>」
 *
 * 検証観点:
 *   - State<T>.set(v) に型 T と非互換な値を渡すとコンパイルエラー（Req 2.5）
 *   - State<T>.map(String) を経由すると Computed<string> になり .text に渡せる
 *   - Computed<T> は .set を持たない（Req 3.2）
 *   - State<T[]> のみ .each を持ち、State<number> は実質使えない（Req 3.5）
 *   - .field() の戻り値型が State<T[K]>（書き戻し可能）
 *
 * 実装方針:
 *   - `expectTypeOf` (vitest) で正の型アサーション
 *   - `// @ts-expect-error` で負の型アサーション（TypeScript コンパイラが検証）
 */

import { describe, expectTypeOf, it } from 'vitest';

import { ComputedImpl, StateImpl } from '../../../../src/js/vanilla/state/state.ts';
import type { Computed, ReadableState, State } from '../../../../src/js/vanilla/state/state.ts';
import type { JsExpr } from '../../../../src/js/vanilla/types.ts';

// ─── テスト用ファクトリ ───────────────────────────────────────────────────────

/** テスト用 StateRegistry モック */
function makeRegistry() {
  let counter = 0;
  return {
    allocateId: () => `s${counter++}`,
    register: () => {},
    registerDerived: () => {},
  };
}

/** State<T> インスタンスを生成するヘルパー */
function makeState<T>(init: string = 's0'): State<T> {
  return new StateImpl<T>(init, makeRegistry() as never);
}

/** Computed<T> インスタンスを生成するヘルパー */
function makeComputed<T>(init: string = 'c0'): Computed<T> {
  const registry = makeRegistry();
  const expr: JsExpr = {
    __jsExpr: true as const,
    code: `__draftole__.state('${init}').get()`,
    eq: () => { throw new Error('not impl'); },
    ne: () => { throw new Error('not impl'); },
    or: () => { throw new Error('not impl'); },
    trim: () => { throw new Error('not impl'); },
    isFalsy: () => { throw new Error('not impl'); },
    isTruthy: () => { throw new Error('not impl'); },
  };
  return new ComputedImpl<T>(init, registry as never, expr, undefined, undefined, undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// Req 2.5: State<T>.set に非互換な型を渡すとコンパイルエラー
// ─────────────────────────────────────────────────────────────────────────────

describe('State<T>.set の型チェック（Req 2.5）', () => {
  it('State<string>.set(string) は型エラーなし', () => {
    const s = makeState<string>('s0');
    // 型エラーなし（コンパイル通過が検証）
    expectTypeOf(s.set).parameter(0).toMatchTypeOf<string | JsExpr>();
  });

  it('State<number>.set に string を渡すとコンパイルエラー', () => {
    const s = makeState<number>('s0');
    // @ts-expect-error: Argument of type 'string' is not assignable to parameter of type 'number | JsExpr'
    s.set('hello');
  });

  it('State<string>.set に number を渡すとコンパイルエラー', () => {
    const s = makeState<string>('s0');
    // @ts-expect-error: Argument of type 'number' is not assignable to parameter of type 'string | JsExpr'
    s.set(42);
  });

  it('State<boolean>.set に string を渡すとコンパイルエラー', () => {
    const s = makeState<boolean>('s0');
    // @ts-expect-error: Argument of type 'string' is not assignable to parameter of type 'boolean | JsExpr'
    s.set('true');
  });

  it('State<number>.set(JsExpr) は型エラーなし', () => {
    const s = makeState<number>('s0');
    const expr: JsExpr = {
      __jsExpr: true as const,
      code: 'someExpr',
      eq: () => { throw new Error('not impl'); },
      ne: () => { throw new Error('not impl'); },
      or: () => { throw new Error('not impl'); },
      trim: () => { throw new Error('not impl'); },
      isFalsy: () => { throw new Error('not impl'); },
      isTruthy: () => { throw new Error('not impl'); },
    };
    // JsExpr オーバーロードは常に受け入れられる（Req 2.2）
    expectTypeOf(s.set).parameter(0).toMatchTypeOf<number | JsExpr>();
    s.set(expr); // 型エラーなし
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 3.1: State<T>.map(fn) → Computed<U>
// ─────────────────────────────────────────────────────────────────────────────

describe('State<T>.map の型チェック（Req 3.1）', () => {
  it('State<number>.map(String) の戻り値は Computed<string>', () => {
    const s = makeState<number>('s0');
    const computed = s.map(String);
    expectTypeOf(computed).toMatchTypeOf<Computed<string>>();
  });

  it('Computed<string> は ReadableState<string> に代入可能', () => {
    const s = makeState<number>('s0');
    const computed = s.map(String);
    expectTypeOf(computed).toMatchTypeOf<ReadableState<string>>();
  });

  it('State<string>.map(s => s.length) の戻り値は Computed<number>', () => {
    const s = makeState<string>('s0');
    const computed = s.map((str) => str.length);
    expectTypeOf(computed).toMatchTypeOf<Computed<number>>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 3.2: Computed<T> は .set を持たない
// ─────────────────────────────────────────────────────────────────────────────

describe('Computed<T> は .set を持たない（Req 3.2）', () => {
  it('Computed<string> のキーに "set" は含まれない', () => {
    expectTypeOf<Computed<string>>().not.toHaveProperty('set');
  });

  it('Computed<number> のキーに "update" は含まれない', () => {
    expectTypeOf<Computed<number>>().not.toHaveProperty('update');
  });

  it('Computed<string> に .set を呼ぼうとするとコンパイルエラー', () => {
    // 実行時には呼ばれない型チェック専用ブロック
    if (false as boolean) {
      const c = makeComputed<string>('c0');
      // @ts-expect-error: Property 'set' does not exist on type 'Computed<string>'
      c.set('hello');
    }
  });

  it('Computed<string> に .update を呼ぼうとするとコンパイルエラー', () => {
    // 実行時には呼ばれない型チェック専用ブロック
    if (false as boolean) {
      const c = makeComputed<string>('c0');
      // @ts-expect-error: Property 'update' does not exist on type 'Computed<string>'
      c.update({ __jsExpr: true, code: 'x' } as JsExpr);
    }
  });

  it('Computed<string> は .get / .map / .field を持つ', () => {
    expectTypeOf<Computed<string>>().toHaveProperty('get');
    expectTypeOf<Computed<string>>().toHaveProperty('map');
    expectTypeOf<Computed<string>>().toHaveProperty('field');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 3.5: State<T[]>.each の型チェック（配列のみ）
// ─────────────────────────────────────────────────────────────────────────────

describe('State<T[]>.each の型チェック（Req 3.5）', () => {
  it('State<string[]> は .each メソッドを持つ', () => {
    expectTypeOf<State<string[]>>().toHaveProperty('each');
  });

  it('State<string> の each パラメータは State<never> になり実質使用不可', () => {
    // State<number> は each を持つが fn の引数が State<never> になる
    // そのため有効な fn を渡すことができない（ArrayItem<number> = never）
    const s = makeState<number>('s0');
    expectTypeOf<typeof s>().toHaveProperty('each');
    // each の引数 fn の item が State<never> 型（ArrayItem<number> = never）
    expectTypeOf(s.each).parameter(0).parameter(0).toMatchTypeOf<State<never>>();
  });

  it('State<string[]>.each の fn の item は State<string>', () => {
    const _s = makeState<string[]>('s0');
    // fn の引数型が State<string> になることを確認
    type FnParam = Parameters<typeof _s.each>[0];
    type ItemParam = Parameters<FnParam>[0];
    expectTypeOf<ItemParam>().toMatchTypeOf<State<string>>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 3.4 / 1.5: State<T>.field の型チェック
// ─────────────────────────────────────────────────────────────────────────────

describe('State<T>.field の型チェック（Req 3.4）', () => {
  it('State<{ name: string }>.field("name") の戻り値は State<string>', () => {
    const s = makeState<{ name: string }>('s0');
    const field = s.field('name');
    expectTypeOf(field).toMatchTypeOf<State<string>>();
  });

  it('State<{ count: number }>.field("count") の戻り値は State<number>', () => {
    const s = makeState<{ count: number }>('s0');
    const field = s.field('count');
    expectTypeOf(field).toMatchTypeOf<State<number>>();
  });

  it('存在しないフィールドキーを渡すとコンパイルエラー', () => {
    const s = makeState<{ name: string }>('s0');
    // @ts-expect-error: Argument of type '"nonExistent"' is not assignable to parameter of type '"name"'
    s.field('nonExistent');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// State<T> と Computed<T> の ReadableState<T> 代入互換性
// ─────────────────────────────────────────────────────────────────────────────

describe('ReadableState<T> の型互換性', () => {
  it('State<string> は ReadableState<string> に代入可能', () => {
    expectTypeOf<State<string>>().toMatchTypeOf<ReadableState<string>>();
  });

  it('Computed<string> は ReadableState<string> に代入可能', () => {
    expectTypeOf<Computed<string>>().toMatchTypeOf<ReadableState<string>>();
  });

  it('State<string> は ReadableState<number> に代入不可', () => {
    // ReadableState<string> は ReadableState<number> に代入不可（反変性チェック）
    expectTypeOf<ReadableState<string>>().not.toMatchTypeOf<ReadableState<number>>();
  });
});
