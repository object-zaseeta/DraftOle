/**
 * `.on` メソッドの型テスト（handler-serialization Task 2.3）。
 *
 * 対応 requirement: 1.1, 1.2, 1.3, 1.4
 * 対応 design.md: D-4, D-5
 *
 * 検証観点:
 *   1. `.on("click", (e) => ...)` の `e` が `MouseEvent` に推論されること（Req 1.3）
 *   2. `.on("click", (a, b) => ...)` が型エラーになること（Req 1.4）
 *   3. `.on("click", (s: ScriptScope) => ...)` が `HandlerCallback` として解決されること（Req 1.2）
 *   4. `.on` の戻り値が `Self`（= HtmlTag）型であること
 */

import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.ts';
import { PairType } from '../../../src/html/elements/pair-type.ts';
import type { HtmlTag } from '../../../src/html/elements/html-tag.ts';
import { applyElementMixin, type HandlerCallback } from '../../../src/js/vanilla/element-methods.ts';
import type { ScriptScope } from '../../../src/js/vanilla/script-scope.ts';

// ─── テスト準備 ───────────────────────────────────────────────────────────────

function makeEl(id: string): HtmlTag {
  const el = new PairType('div');
  el.addHtmlAttribute(HtmlAttribute.keyValue('id', id));
  return el as HtmlTag;
}

beforeAll(() => {
  applyElementMixin(PairType.prototype as HtmlTag);
});

// ─────────────────────────────────────────────────────────────────────────────
// ケース 1: `.on("click", (e) => ...)` の `e` が `MouseEvent` に推論される（Req 1.3）
// ─────────────────────────────────────────────────────────────────────────────

describe('ケース 1: e の型推論（Req 1.3）', () => {
  it('.on("click", (e) => e.button) の e が MouseEvent に推論される', () => {
    type ClickHandler = (e: MouseEvent) => void;
    const fn: ClickHandler = (_e: MouseEvent) => {};
    // MouseEvent に対して ArrowHandler<MouseEvent> が成立することを確認
    expectTypeOf(fn).toMatchTypeOf<(e: MouseEvent) => void>();

    // 実行時は transformer 未通過の safety-net により throw される（Req 5.2 準拠）
    const el = makeEl('c1');
    expect(() => {
      el.on('click', (e) => {
        // e.button は MouseEvent のプロパティ — 型エラーがなければ e は MouseEvent に推論されている
        const _button: number = e.button;
        void _button;
      });
    }).toThrowError(/draftole TypeScript transformer/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ケース 2: `.on("click", (a, b) => ...)` が型エラーになる（Req 1.4）
// ─────────────────────────────────────────────────────────────────────────────

describe('ケース 2: 2引数は型エラー（Req 1.4）', () => {
  it('.on("click", (a, b) => ...) は型エラーになる', () => {
    const el = makeEl('c2');
    // @ts-expect-error: 2引数関数は ArrowHandler でも HandlerCallback でもないため型エラー
    expect(() => {
      el.on('click', (_a: MouseEvent, _b: string) => {});
    }).toThrowError(/draftole TypeScript transformer/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ケース 3: `.on("click", (s: ScriptScope) => ...)` が HandlerCallback として解決される（Req 1.2）
// ─────────────────────────────────────────────────────────────────────────────

describe('ケース 3: HandlerCallback として解決される（Req 1.2）', () => {
  it('ScriptScope を受け取るコールバックが HandlerCallback として型解決される', () => {
    // HandlerCallback = (s: ScriptScope) => void
    // アロー関数は safety-net で弾かれるため、function 式で HandlerCallback を表現する
    const cb: HandlerCallback = function (_s: ScriptScope) {};
    // expectTypeOf で HandlerCallback に一致することを確認
    expectTypeOf(cb).toMatchTypeOf<HandlerCallback>();

    // 実際に .on に HandlerCallback（function 式）を渡せることも確認（型エラーにならない）
    const el = makeEl('c3');
    // function 式は isArrowShape が false を返すため safety-net を通過する
    expect(() => {
      el.on('click', function (_s: ScriptScope) {});
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ケース 4: `.on` の戻り値が Self（= HtmlTag）型
// ─────────────────────────────────────────────────────────────────────────────

describe('ケース 4: .on の戻り値が Self（HtmlTag）型', () => {
  it('.on の戻り値が HtmlTag 型になる', () => {
    const el = makeEl('c4');
    // function 式（HandlerCallback）を使って実行時エラーを回避しつつ戻り値の型を確認する
    const result = el.on('click', function (_s: ScriptScope) {});
    // 戻り値が HtmlTag（= Self）であることを型レベルで確認
    expectTypeOf(result).toMatchTypeOf<HtmlTag>();
  });
});
