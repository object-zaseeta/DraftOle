/**
 * `StaticView` narrow interface の型レベルテスト（Task 1.1）。
 *
 * 対応 requirement: 1.1, 1.2, 6.1, 6.2 (page-runtime-separation-spec)
 * 対応 design.md セクション: §3.5, §6.1
 *
 * 検証観点:
 *   - `HtmlTag` が構造的部分型として `StaticView` を満たす（代入可能）
 *   - `StaticView` 経由で `protoRender` / `collectCssStyleString` に到達可能
 *   - `StaticView` から runtime プロパティ
 *     (`jqm`, `state`, `script`, `$`, `$$`) に到達不能（型エラー）
 *
 * 実装方針:
 *   - `expectTypeOf` (vitest) で正の型アサーション
 *   - `// @ts-expect-error` で負の型アサーション（TypeScript コンパイラが検証）
 */

import { describe, expectTypeOf, it } from 'vitest';

import type { HtmlTag } from '../../src/html/elements/html-tag.ts';
import type { StaticView } from '../../src/view/types.ts';

describe('StaticView narrow interface (Task 1.1)', () => {
  it('HtmlTag は構造的部分型として StaticView を満たす（Req 1.1, 6.1）', () => {
    expectTypeOf<HtmlTag>().toMatchTypeOf<StaticView>();
  });

  it('StaticView は protoRender を公開する（design §6.1）', () => {
    expectTypeOf<StaticView>().toHaveProperty('protoRender');
  });

  it('StaticView は collectCssStyleString を公開する（design §6.1）', () => {
    expectTypeOf<StaticView>().toHaveProperty('collectCssStyleString');
  });

  it('StaticView から runtime プロパティに到達できない（Req 1.1, 1.2, 6.2）', () => {
    const view = {} as StaticView;

    // @ts-expect-error: jqm は StaticView の公開面に存在しない
    void view.jqm;
    // @ts-expect-error: state は StaticView の公開面に存在しない
    void view.state;
    // @ts-expect-error: script は StaticView の公開面に存在しない
    void view.script;
    // @ts-expect-error: $ は StaticView の公開面に存在しない
    void view.$;
    // @ts-expect-error: $$ は StaticView の公開面に存在しない
    void view.$$;
  });
});
