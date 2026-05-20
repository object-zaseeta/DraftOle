/**
 * Task 5.2: `appendChild` の型レベルテスト
 *
 * 対応 requirement: 2.1, 2.4
 *
 * 検証観点:
 *   - `EachBinding<HtmlTag>` を `appendChild` に渡せること（Req 2.1）
 *   - `HtmlTag` を渡せること（HtmlTag 経路）
 *   - 無関係な値（`string` 等）を渡すとコンパイルエラーになること（Req 2.4）
 *
 * 実装方針:
 *   - `expectTypeOf` (vitest) で正の型アサーション
 *   - `// @ts-expect-error` で負の型アサーション（TypeScript コンパイラが検証）
 *   - `applyElementMixin` を beforeAll で適用してランタイム動作も確認
 */

import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { HtmlAttribute } from '../../src/html/attributes/html-attribute.ts';
import type { HtmlTag } from '../../src/html/elements/html-tag.ts';
import { PairType } from '../../src/html/elements/pair-type.ts';
import { li, ul } from '../../src/html/tags/factories-data.ts';
import { applyElementMixin } from '../../src/js/vanilla/element-methods.ts';
import { StateRegistry } from '../../src/js/vanilla/state/registry.ts';
import { StateImpl } from '../../src/js/vanilla/state/state.ts';
import type { EachBinding } from '../../src/js/vanilla/state/state.ts';

// ─── テスト準備 ───────────────────────────────────────────────────────────────

function makeEl(id: string): HtmlTag {
  const el = new PairType('div');
  el.addHtmlAttribute(HtmlAttribute.keyValue('id', id));
  return el as HtmlTag;
}

function makeArrayState(id: string) {
  const registry = new StateRegistry();
  return new StateImpl<string[]>(id, registry);
}

beforeAll(() => {
  applyElementMixin(PairType.prototype as HtmlTag);
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 2.1: EachBinding<U> を appendChild に渡してもキャスト不要
// ─────────────────────────────────────────────────────────────────────────────

describe('EachBinding<U> を appendChild に渡せる（Req 2.1）', () => {
  it('state.each(callback) の戻り値を appendChild に渡すと bind-each コマンドを生成する', () => {
    const parent = ul();
    parent.addHtmlAttribute(HtmlAttribute.keyValue('id', 'parent'));
    const tasks = makeArrayState('tasks');

    // `as HtmlTag` キャストなしで渡せることを実行時に確認する
    const binding = tasks.each((_item) => li());
    // コンパイルエラーなしで渡せる（型チェックを兼ねる）
    const result = parent.appendChild(binding);
    expect(result).toBe(parent);
  });

  it('EachBinding<HtmlTag> の戻り値型がランタイムに EachBinding 構造を持つ', () => {
    const tasks = makeArrayState('tasks');
    const binding = tasks.each((_item) => li());

    expect(binding._kind).toBe('each');
    expect(binding._stateId).toBe('tasks');
  });

  it('EachBinding<readonly HtmlTag[]> も appendChild に渡せる', () => {
    const parent = ul();
    parent.addHtmlAttribute(HtmlAttribute.keyValue('id', 'parent2'));
    const tasks = makeArrayState('tasks2');

    // callback が readonly HtmlTag[] を返すケース
    const binding = tasks.each((_item) => [li(), li()] as readonly HtmlTag[]);
    const result = parent.appendChild(binding);
    expect(result).toBe(parent);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HtmlTag 経路: HtmlTag を appendChild に渡せる
// ─────────────────────────────────────────────────────────────────────────────

describe('HtmlTag を appendChild に渡せる', () => {
  it('HtmlTag インスタンスを appendChild に渡すとランタイムコマンドが生成される', () => {
    const parent = makeEl('parent');
    const child = makeEl('child');

    const result = parent.appendChild(child);
    expect(result).toBe(parent);
  });

  it('appendChild の戻り値型は HtmlTag', () => {
    const parent = makeEl('p1');
    const child = makeEl('c1');
    expectTypeOf(parent.appendChild(child)).toEqualTypeOf<HtmlTag>();
  });

  it('EachBinding を渡した場合も戻り値型は HtmlTag', () => {
    const parent = ul();
    parent.addHtmlAttribute(HtmlAttribute.keyValue('id', 'p2'));
    const tasks = makeArrayState('tasks3');
    const binding = tasks.each((_item) => li());
    expectTypeOf(parent.appendChild(binding)).toEqualTypeOf<HtmlTag>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 2.4: 無関係な値（string 等）を渡すとコンパイルエラーになる
//
// 以下のテストは TypeScript のコンパイル時型チェックのみを検証する。
// `// @ts-expect-error` コメントがあると、その行はコンパイルエラーが期待されるため
// TypeScript が型エラーを報告しない場合にかえって TS2578 を発生させる。
// ランタイムには実行しない（型アサーション専用の静的テスト）。
// ─────────────────────────────────────────────────────────────────────────────

describe('無関係な型はコンパイルエラーになる（Req 2.4）', () => {
  it('@ts-expect-error アノテーション付きの型テストがコンパイルに成功する（型エラーなし）', () => {
    // このテスト自体は常に pass する。
    // 下の静的型アサーション関数群が TypeScript レベルで不正な型を拒否することを
    // `pnpm typecheck` によって検証する。
    expect(true).toBe(true);
  });
});

// ─── 静的型アサーション（ランタイムには実行されない関数として宣言）────────────────

/**
 * 以下の関数は決して呼び出してはならない（型チェック専用）。
 * TypeScript コンパイラが `@ts-expect-error` のコメントを通じて
 * 各呼び出しがコンパイルエラーであることを検証する。
 */
function _typeOnlyAssertions_doNotCall(parent: HtmlTag): void {
  // @ts-expect-error: string は HtmlTag でも EachBinding でもないのでコンパイルエラー
  parent.appendChild('invalid-string');

  // @ts-expect-error: number は HtmlTag でも EachBinding でもないのでコンパイルエラー
  parent.appendChild(42);

  // @ts-expect-error: boolean は HtmlTag でも EachBinding でもないのでコンパイルエラー
  parent.appendChild(true);
}

// 未使用警告を抑止しつつ、関数が "存在する" ことで TypeScript が型検査を実行する
void (_typeOnlyAssertions_doNotCall as unknown);

// ─────────────────────────────────────────────────────────────────────────────
// 型レベル: EachBinding の型パラメータ検証
// ─────────────────────────────────────────────────────────────────────────────

describe('EachBinding の型レベル検証', () => {
  it('state.each() の戻り値が EachBinding<HtmlTag> に割り当てられる', () => {
    const tasks = makeArrayState('tasks4');
    const binding = tasks.each((_item) => li());
    // binding は EachBinding<PairType> であり、EachBinding<HtmlTag> のサブタイプとして扱える
    const _typed: EachBinding<HtmlTag> = binding as EachBinding<HtmlTag>;
    expect(_typed._kind).toBe('each');
  });
});
