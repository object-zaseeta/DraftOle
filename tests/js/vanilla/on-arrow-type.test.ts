/**
 * `ArrowHandler<Ev>` 型と `.on` オーバーロードの型テスト（handler-serialization Task 2.1）。
 *
 * 対応 requirement: 1.1, 1.2, 1.3, 1.4
 * 対応 design.md: D-4, ElementMethods.on overloads
 *
 * 検証観点:
 *   - `.on("click", (e) => ...)` の `e` が `MouseEvent` に推論されること（Req 1.3）
 *   - `.on("click", () => ...)` が型エラーなく受け入れられること（Req 1.2）
 *   - `.on("input", (e) => ...)` の `e` が `InputEvent` に推論されること（Req 1.3）
 *   - `.on("click", (a, b) => ...)` が型エラーになること（2引数は ArrowHandler に不一致）（Req 1.4）
 *   - `ArrowHandler<Ev>` が export されていること（Req 1.1）
 */

import { beforeAll, describe, expectTypeOf, it } from 'vitest';

import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.ts';
import { PairType } from '../../../src/html/elements/pair-type.ts';
import type { HtmlTag } from '../../../src/html/elements/html-tag.ts';
// module augmentation を有効化するため applyElementMixin をインポート
import { applyElementMixin, type ArrowHandler } from '../../../src/js/vanilla/element-methods.ts';

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
// Req 1.1: ArrowHandler<Ev> 型が export されていること
// ─────────────────────────────────────────────────────────────────────────────

describe('ArrowHandler<Ev> 型が export されていること（Req 1.1）', () => {
  it('ArrowHandler<MouseEvent> は () => void を受け付ける', () => {
    const fn: ArrowHandler<MouseEvent> = () => {};
    expectTypeOf(fn).toMatchTypeOf<ArrowHandler<MouseEvent>>();
  });

  it('ArrowHandler<MouseEvent> は (e: MouseEvent) => void を受け付ける', () => {
    const fn: ArrowHandler<MouseEvent> = (_e: MouseEvent) => {};
    expectTypeOf(fn).toMatchTypeOf<ArrowHandler<MouseEvent>>();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: イベント名からハンドラ引数型が推論されること
// ─────────────────────────────────────────────────────────────────────────────

describe('.on のイベント引数型推論（Req 1.3）', () => {
  // 型テスト（コンパイル時の型推論を検証）
  // Task 2.2 以降、transformer 未通過のアロー関数を .on に渡すと実行時 safety-net エラーが発生する。
  // これらのテストは型チェック（tsc）が通ることを確認するものであり、
  // 実行時に throw されることは Task 2.2 の仕様に沿っている（Req 5.2）。

  it('.on("click", (e) => e.button) が型エラーなし（e が MouseEvent に推論される）', () => {
    const el = makeEl('a');
    // e.button は MouseEvent のプロパティ。型エラーがなければ e は MouseEvent に推論されている。
    // 実行時は transformer 未通過の safety-net により throw される（Task 2.2 仕様通り）。
    expect(() => {
      el.on('click', (e) => {
        const _button: number = e.button;
        void _button;
      });
    }).toThrowError('DraftOle: arrow-function handler requires the draftole TypeScript transformer');
  });

  it('.on("click", (e) => ...) の e は MouseEvent 型', () => {
    // 関数シグネチャを直接 expectTypeOf で検証するために型ヘルパーを使う
    type ClickHandler = (e: MouseEvent) => void;
    const fn: ClickHandler = (_e) => {};
    const el = makeEl('a');
    // ArrowHandler<MouseEvent> = (() => void) | ((e: MouseEvent) => void) に一致することを確認。
    // 実行時は transformer 未通過の safety-net により throw される（Task 2.2 仕様通り）。
    expect(() => {
      el.on('click', fn);
    }).toThrowError('DraftOle: arrow-function handler requires the draftole TypeScript transformer');
  });

  it('.on("input", (e) => e.data) が型エラーなし（e が InputEvent に推論される）', () => {
    const el = makeEl('a');
    // e.data は InputEvent のプロパティ。
    // 実行時は transformer 未通過の safety-net により throw される（Task 2.2 仕様通り）。
    expect(() => {
      el.on('input', (e) => {
        const _data: string | null = e.data;
        void _data;
      });
    }).toThrowError('DraftOle: arrow-function handler requires the draftole TypeScript transformer');
  });

  it('.on("click", () => ...) が型エラーなし（ゼロ引数形式）', () => {
    const el = makeEl('a');
    // 実行時は transformer 未通過の safety-net により throw される（Task 2.2 仕様通り）。
    expect(() => {
      el.on('click', () => {});
    }).toThrowError('DraftOle: arrow-function handler requires the draftole TypeScript transformer');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.4: 不正な使い方はコンパイルエラーになること
// ─────────────────────────────────────────────────────────────────────────────

describe('不正なハンドラはコンパイルエラーになること（Req 1.4）', () => {
  it('.on("click", (a, b) => ...) は型エラーになる（2引数は ArrowHandler に不一致）', () => {
    const el = makeEl('a');
    // @ts-expect-error: 2引数関数は ArrowHandler でも HandlerCallback でもないため型エラー
    // 実行時は transformer 未通過の safety-net により throw される（Task 2.2 仕様通り）。
    expect(() => {
      // @ts-expect-error: 型エラー確認（上の @ts-expect-error が直接行に適用されるため重複させる）
      el.on('click', (_a: MouseEvent, _b: string) => {});
    }).toThrowError('DraftOle: arrow-function handler requires the draftole TypeScript transformer');
  });
});
