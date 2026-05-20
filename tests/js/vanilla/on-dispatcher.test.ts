/**
 * `.on` 実装側 dispatcher の振る舞いテスト（handler-serialization Task 2.2）。
 *
 * テスト対象: `applyElementMixin` が差し込む `on` メソッドの実行時 dispatcher ロジック
 *
 * テスト経路:
 *   1. transformer 経由: `handler._draftoleEmitted = true` をセットした関数を渡し、
 *      その中で `s._emitHandlerBody("code", ["e"])` を呼ぶ
 *      → `handler-body` コマンドが積まれることを確認
 *   2. 従来 HandlerCallback: `(s: ScriptScope) => { s.raw("console.log(1)") }` を渡す
 *      → 従来の `addEventListener` コマンドが積まれることを確認
 *   3. 未変換アロー: transformer 未経由のアロー関数を渡す
 *      → `throw new Error("DraftOle: arrow-function handler requires the draftole TypeScript transformer; see docs/api/handler-serialization.md")` が投げられることを確認
 *
 * 対応 requirement: 1.5, 1.6, 5.2
 * 対応 design.md: D-3, D-5, dispatcher pseudocode
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.ts';
import { PairType } from '../../../src/html/elements/pair-type.ts';
import type { VanillaCommand } from '../../../src/js/vanilla/commands.ts';
import {
  applyElementMixin,
  type ElementMethods,
  type HandlerCallback,
} from '../../../src/js/vanilla/element-methods.ts';
import type { ScriptScope } from '../../../src/js/vanilla/script-scope.ts';
import type { VanillaScope } from '../../../src/js/vanilla/vanilla-script-builder.ts';

// ─── テスト準備 ────────────────────────────────────────────────────────────────

type TestElement = PairType &
  ElementMethods<TestElement> & {
    _pending: VanillaCommand[];
    _scope: VanillaScope | undefined;
  };

function makeEl(id: string): TestElement {
  const el = new PairType('div');
  el.addHtmlAttribute(HtmlAttribute.keyValue('id', id));
  return el as TestElement;
}

// mixin を一度だけプロトタイプに適用する
beforeAll(() => {
  applyElementMixin(PairType.prototype as import('../../../src/html/elements/html-tag.ts').HtmlTag);
});

// ─── テスト群 ─────────────────────────────────────────────────────────────────

describe('.on dispatcher: transformer 経由（_draftoleEmitted = true）', () => {
  it('_draftoleEmitted=true のハンドラが s._emitHandlerBody を呼ぶと handler-body コマンドが _pending に積まれる', () => {
    const el = makeEl('btn');

    // transformer が生成するような内部形を手動で再現する
    // (s) => s._emitHandlerBody("console.log(e)", ["e"]) 相当
    const transformerHandler: HandlerCallback = (s: ScriptScope) => {
      s._emitHandlerBody('console.log(e)', ['e']);
    };
    // transformer が付与するマーカーを手動でセット
    (transformerHandler as { _draftoleEmitted: boolean })._draftoleEmitted = true;

    el.on('click', transformerHandler as import('../../../src/js/vanilla/element-methods.ts').ArrowHandler<Event>);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('handler-body');
    if (cmd.type === 'handler-body') {
      expect(cmd.event).toBe('click');
      expect(cmd.code).toBe('console.log(e)');
      expect(cmd.params).toEqual(['e']);
      // target は #btn セレクタ
      expect(cmd.target).toEqual({ kind: 'sel', selector: '#btn' });
    }
  });

  it('params が空配列の場合も handler-body コマンドが積まれる', () => {
    const el = makeEl('btn2');

    const transformerHandler: HandlerCallback = (s: ScriptScope) => {
      s._emitHandlerBody('doSomething()', []);
    };
    (transformerHandler as { _draftoleEmitted: boolean })._draftoleEmitted = true;

    el.on('submit', transformerHandler as import('../../../src/js/vanilla/element-methods.ts').ArrowHandler<Event>);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('handler-body');
    if (cmd.type === 'handler-body') {
      expect(cmd.event).toBe('submit');
      expect(cmd.code).toBe('doSomething()');
      expect(cmd.params).toEqual([]);
    }
  });
});

describe('.on dispatcher: 従来 HandlerCallback 経路', () => {
  it('通常の関数宣言 HandlerCallback を渡すと addEventListener コマンドが積まれる', () => {
    const el = makeEl('inp');

    // function キーワードを持つ通常の HandlerCallback（従来形式）。
    // アロー関数にすると dispatcher が safety net を発動するため、意図的に function 式を使う。
    // biome-ignore lint/complexity/useArrowFunction: 意図的に function 式（dispatcher の isArrowShape テスト用）
    const cb: HandlerCallback = function(s: ScriptScope) {
      s.call('console.log', [s.raw('1')]);
    };

    el.on('click', cb);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('addEventListener');
    if (cmd.type === 'addEventListener') {
      expect(cmd.event).toBe('click');
      expect(cmd.target).toEqual({ kind: 'sel', selector: '#inp' });
      expect(cmd.handlerCode).toContain('console.log(1)');
    }
  });

  it('HandlerCallback が空の場合は空ハンドラの addEventListener コマンドが積まれる', () => {
    const el = makeEl('empty-el');

    // biome-ignore lint/complexity/useArrowFunction: 意図的に function 式（dispatcher の isArrowShape テスト用）
    const cb: HandlerCallback = function(_s: ScriptScope) {
      // 何も積まない
    };

    el.on('blur', cb);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('addEventListener');
    if (cmd.type === 'addEventListener') {
      expect(cmd.event).toBe('blur');
      expect(cmd.handlerCode).toBe('(e) => {}');
    }
  });
});

describe('.on dispatcher: 未変換アロー関数（transformer 未適用時 safety net）', () => {
  it('transformer を通っていないアロー関数を渡すと Error が throw される', () => {
    const el = makeEl('arrow-el');

    // 素のアロー関数（transformer 未経由）
    const arrowFn = (e: Event) => { void e; };

    expect(() => {
      el.on('click', arrowFn as import('../../../src/js/vanilla/element-methods.ts').ArrowHandler<Event>);
    }).toThrowError(
      'DraftOle: arrow-function handler requires the draftole TypeScript transformer; see docs/api/handler-serialization.md',
    );
  });

  it('引数なしのアロー関数（() => {}）を渡すと Error が throw される', () => {
    const el = makeEl('arrow-el2');

    const arrowFn = () => {};

    expect(() => {
      el.on('click', arrowFn as import('../../../src/js/vanilla/element-methods.ts').ArrowHandler<Event>);
    }).toThrowError(
      'DraftOle: arrow-function handler requires the draftole TypeScript transformer; see docs/api/handler-serialization.md',
    );
  });
});
