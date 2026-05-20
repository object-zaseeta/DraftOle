/**
 * `src/js/vanilla/element-methods.ts` の振る舞いテスト（Task 3.3）。
 *
 * 対応 requirement: 1.1, 1.2, 1.3, 1.4, 1.5, 4.4, 4.5
 * 対応 design.md セクション: 「ElementMixin」「ElementMethods<Self>」
 *
 * 検証観点:
 *   - 各 DOM 操作メソッドが正しい VanillaCommand を生成する
 *   - 登録前（_scope === undefined）は _pending へ push
 *   - 登録後（_scope !== undefined）は _scope._append を呼ぶ
 *   - string 引数は JSON.stringify でエンコードされる（Req 4.5）
 *   - JsExpr 引数は .code が素通しされる（Req 4.4）
 *   - 戻り値は this であり、CSS チェーンと連結可能（Req 1.5）
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.ts';
import type { HtmlTag } from '../../../src/html/elements/html-tag.ts';
import { PairType } from '../../../src/html/elements/pair-type.ts';
import { type VanillaCommand } from '../../../src/js/vanilla/commands.ts';
import {
  _getElementTarget,
  applyElementMixin,
  type ElementMethods,
  type HasPending,
} from '../../../src/js/vanilla/element-methods.ts';
import { _makeJsBoolExpr, _makeJsExpr } from '../../../src/js/vanilla/element-ref.ts';
import type { ScriptScope } from '../../../src/js/vanilla/script-scope.ts';
import type { VanillaScope } from '../../../src/js/vanilla/vanilla-script-builder.ts';

// --- テスト準備 ---

/** テスト中に使う要素型（PairType + ElementMethods の組み合わせ）。 */
type TestElement = PairType &
  ElementMethods<TestElement> & {
    _pending: VanillaCommand[];
    _scope: VanillaScope | undefined;
  };

/**
 * id 属性付きのテスト要素を生成する。
 * applyElementMixin で追加されたメソッドを型付きで利用できるようにキャストする。
 */
function makeEl(id: string): TestElement {
  const el = new PairType('div');
  el.addHtmlAttribute(HtmlAttribute.keyValue('id', id));
  return el as TestElement;
}

/** テスト用 VanillaScope: _append されたコマンドを蓄積して検査できる。 */
function createTestScope(): VanillaScope & { captured: VanillaCommand[] } {
  const captured: VanillaCommand[] = [];
  return {
    captured,
    _append(cmd) {
      captured.push(cmd);
    },
    _childScope() {
      return createTestScope();
    },
    raw(code) {
      return { code };
    },
    let(name, value) {
      captured.push({ type: 'declareConst', name, expr: value.code });
      return { code: name };
    },
    call(name, args) {
      const argList = (args ?? []).map((a) => a.code).join(', ');
      const code = `${name}(${argList})`;
      captured.push({ type: 'expr', code });
      return { code };
    },
    return() {
      captured.push({ type: 'raw', code: 'return;' });
    },
    ifThen() {
      /* not used in these tests */
    },
  };
}

/**
 * id="test-el" の要素に対して期待される ElementTarget オブジェクト。
 * Task 2.2 で target が string から ElementTarget に変更されたため、
 * オブジェクト形式で検証する。
 */
const TARGET = { kind: 'sel', selector: '#test-el' } as const;

// mixin を一度だけプロトタイプに適用する
beforeAll(() => {
  applyElementMixin(PairType.prototype as import('../../../src/html/elements/html-tag.ts').HtmlTag);
});

// ─────────────────────────────────────────────────────────────────────────────
// 登録前（pending mode）テスト
// ─────────────────────────────────────────────────────────────────────────────

describe('setText（Req 1.1, 4.5）', () => {
  it('文字列値を JSON.stringify でエンコードした setProp コマンドを _pending に追加する', () => {
    const el = makeEl('test-el');
    el.setText('hello');

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'textContent',
      expr: '"hello"',
    });
  });

  it('JsExpr 値の .code を素通しした setProp コマンドを _pending に追加する', () => {
    const el = makeEl('test-el');
    const expr = _makeJsExpr('someVar');
    el.setText(expr);

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'textContent',
      expr: 'someVar',
    });
  });
});

describe('setValue（Req 1.1, 4.5）', () => {
  it('文字列値を JSON.stringify でエンコードした setProp value コマンドを追加する', () => {
    const el = makeEl('test-el');
    el.setValue('abc');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'value',
      expr: '"abc"',
    });
  });

  it('JsExpr 値の .code を素通しした setProp value コマンドを追加する', () => {
    const el = makeEl('test-el');
    el.setValue(_makeJsExpr('inputVal'));

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'value',
      expr: 'inputVal',
    });
  });
});

describe('setStyle（Req 1.1, 4.5）', () => {
  it('文字列値の setStyle コマンドを _pending に追加する', () => {
    const el = makeEl('test-el');
    el.setStyle('color', 'red');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setStyle',
      target: TARGET,
      key: 'color',
      expr: '"red"',
    });
  });

  it('JsExpr 値の setStyle コマンドを追加する', () => {
    const el = makeEl('test-el');
    el.setStyle('color', _makeJsExpr('themeColor'));

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setStyle',
      target: TARGET,
      key: 'color',
      expr: 'themeColor',
    });
  });
});

describe('addClass（Req 1.1）', () => {
  it('classListAdd コマンドを _pending に追加する', () => {
    const el = makeEl('test-el');
    el.addClass('active');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'classListAdd',
      target: TARGET,
      name: 'active',
    });
  });
});

describe('toggleClass（Req 1.1）', () => {
  it('force なしの classListToggle コマンドを追加する', () => {
    const el = makeEl('test-el');
    el.toggleClass('done');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'classListToggle',
      target: TARGET,
      name: 'done',
      force: undefined,
    });
  });

  it('JsBoolExpr force 付きの classListToggle コマンドを追加する', () => {
    const el = makeEl('test-el');
    const force = _makeJsBoolExpr('flagExpr');
    el.toggleClass('done', force);

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'classListToggle',
      target: TARGET,
      name: 'done',
      force: 'flagExpr',
    });
  });
});

describe('removeClass（Req 1.1）', () => {
  it('classListRemove コマンドを _pending に追加する', () => {
    const el = makeEl('test-el');
    el.removeClass('done');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'classListRemove',
      target: TARGET,
      name: 'done',
    });
  });
});

describe('appendChild（Req 1.1）', () => {
  it('親・子それぞれの id からコードを生成した appendChild コマンドを追加する', () => {
    const parent = makeEl('parent-el');
    const child = makeEl('child-el');
    parent.appendChild(child as import('../../../src/html/elements/html-tag.ts').HtmlTag);

    expect(parent._pending[0]).toEqual<VanillaCommand>({
      type: 'appendChild',
      parent: { kind: 'sel', selector: '#parent-el' },
      child: { kind: 'sel', selector: '#child-el' },
    });
  });
});

describe('on（Req 1.3）', () => {
  it('addEventListener コマンドを _pending に追加し、ハンドラ本体を handlerCode に含む', () => {
    const el = makeEl('test-el');
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト用（HandlerCallback は function 式で渡す必要がある）
    el.on('click', function(s: ScriptScope) {
      s.call('doSomething');
    });

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0] as Extract<VanillaCommand, { type: 'addEventListener' }>;
    expect(cmd.type).toBe('addEventListener');
    expect(cmd.target).toEqual(TARGET);
    expect(cmd.event).toBe('click');
    expect(cmd.handlerCode).toContain('doSomething()');
  });

  it('空のハンドラの場合は (e) => {} の handlerCode を生成する', () => {
    const el = makeEl('test-el');
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト用（HandlerCallback は function 式で渡す必要がある）
    el.on('click', function() {});

    const cmd = el._pending[0] as Extract<VanillaCommand, { type: 'addEventListener' }>;
    expect(cmd.handlerCode).toBe('(e) => {}');
  });

  it('ハンドラ内で複数の scope 操作が呼び出し順に handlerCode に反映される（Req 1.2）', () => {
    const el = makeEl('test-el');
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト用（HandlerCallback は function 式で渡す必要がある）
    el.on('change', function(s: ScriptScope) {
      s.call('first');
      s.call('second');
    });

    const cmd = el._pending[0] as Extract<VanillaCommand, { type: 'addEventListener' }>;
    const idx1 = cmd.handlerCode.indexOf('first()');
    const idx2 = cmd.handlerCode.indexOf('second()');
    expect(idx1).toBeLessThan(idx2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 登録後（bound mode: _scope 設定済み）テスト
// ─────────────────────────────────────────────────────────────────────────────

describe('登録後は _scope._append を通じてコマンドが発行される（Req 1.7）', () => {
  it('setText はバッファを使わず直接 _scope._append を呼ぶ', () => {
    const el = makeEl('test-el');
    const scope = createTestScope();
    el._scope = scope;

    el.setText('world');

    expect(el._pending).toHaveLength(0);
    expect(scope.captured).toHaveLength(1);
    expect(scope.captured[0]).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'textContent',
      expr: '"world"',
    });
  });

  it('on は addEventListener コマンドを _scope._append に発行する', () => {
    const el = makeEl('test-el');
    const scope = createTestScope();
    el._scope = scope;

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト用（HandlerCallback は function 式で渡す必要がある）
    el.on('click', function(s: ScriptScope) {
      s.call('handler');
    });

    expect(el._pending).toHaveLength(0);
    expect(scope.captured).toHaveLength(1);
    const cmd = scope.captured[0] as Extract<VanillaCommand, { type: 'addEventListener' }>;
    expect(cmd.type).toBe('addEventListener');
    expect(cmd.handlerCode).toContain('handler()');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// チェーン互換テスト（Req 1.5）
// ─────────────────────────────────────────────────────────────────────────────

describe('メソッドチェーン（Req 1.5）', () => {
  it('DOM 操作メソッドは this を返し、連続チェーンが可能', () => {
    const el = makeEl('test-el');
    const result = el.addClass('a').removeClass('b').setText('ok');

    expect(result).toBe(el);
    expect(el._pending).toHaveLength(3);
  });

  it('CSS チェーンメソッド（margin 等）と JS メソッドを同一チェーンで連結できる', () => {
    const el = makeEl('test-el');
    // margin() は HtmlTag の既存 CSS メソッド、addClass は ElementMixin のメソッド
    const result = el.margin('10px').addClass('btn').margin('0');

    expect(result).toBe(el);
    expect(el._pending).toHaveLength(1); // addClass のみが JS コマンドを生成
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// エラーケーステスト
// ─────────────────────────────────────────────────────────────────────────────

// NOTE (deferred-target-resolution Task 2.2):
// Task 2.2 で全 binding メソッドが `_getTargetCode` 呼び出しをやめ、
// `_getElementTarget(this)` を直接 command の target に渡すようになった。
// これにより id 不在時も call time に例外を投げず、deferred-self target を _pending に積む。
// deferred-self の解決は render フェーズ（protoRender 内 resolveDeferredTargets）で行われる。

describe('id 属性なし要素に対する deferred-self 経路（Req 1.1, 1.2, 1.3）', () => {
  it('id なし要素で setText(string) を呼んでも例外を投げず _pending に deferred-self target を持つコマンドを積む', () => {
    const noIdEl = new PairType('div') as TestElement;
    // Task 2.2 以降: _getTargetCode を呼ばないため call time に throw しない
    expect(() => noIdEl.setText('x')).not.toThrow();
    // _pending に setProp コマンドが積まれ、target が deferred-self になっている
    const pending = (noIdEl as { _pending: unknown[] })._pending;
    expect(pending).toHaveLength(1);
    const cmd = pending[0] as { type: string; target: { kind: string } };
    expect(cmd.type).toBe('setProp');
    expect(cmd.target.kind).toBe('deferred-self');
  });
});

// Task 2.1: captureEachTemplate 内での appendChild deferred 化テスト
// （Req 1.1, 1.2, 5.1, 5.3）
//
// 変更前: appendChild mixin が renderElementTarget を eager に呼んでいたため、
// id 不在要素（deferred-self target）を持つ要素で呼ぶと
// `TypeError: renderElementTarget: deferred-self target must be resolved before rendering`
// が発生していた。
// 変更後: task 1.1 で appendChild が ElementTarget を生のままコマンドに積むよう defer 化された。
// captureEachTemplate 内で appendChild を呼んでも throw しなくなった。
describe('appendChild mixin の defer 化 — captureEachTemplate 内での deferred-self 経路（Task 2.1: Req 1.1, 1.2, 5.1, 5.3）', () => {
  it('id なし親・子要素で appendChild を呼んでも "deferred-self target must be resolved before rendering" を throw しない', () => {
    // id 属性なし → _getElementTarget が { kind: 'deferred-self' } を返す
    const parent = new PairType('div') as TestElement;
    const child = new PairType('span') as TestElement;

    // captureEachTemplate 内部でも同様の呼び出しが発生するため、
    // この expect が pass することで「捕捉中に throw しない」ことを証明する。
    expect(() =>
      parent.appendChild(child as import('../../../src/html/elements/html-tag.ts').HtmlTag),
    ).not.toThrow();
  });

  it('id なし親・子要素での appendChild は parent / child を deferred-self ElementTarget として _pending に積む', () => {
    const parent = new PairType('div') as TestElement;
    const child = new PairType('span') as TestElement;

    parent.appendChild(child as import('../../../src/html/elements/html-tag.ts').HtmlTag);

    const pending = (parent as { _pending: VanillaCommand[] })._pending;
    expect(pending).toHaveLength(1);
    const cmd = pending[0] as Extract<VanillaCommand, { type: 'appendChild' }>;
    expect(cmd.type).toBe('appendChild');
    // parent / child どちらも deferred-self として保持されている（renderElementTarget 未呼び出し）
    expect(cmd.parent).toEqual({ kind: 'deferred-self' });
    expect(cmd.child).toEqual({ kind: 'deferred-self' });
  });

  it('id なし親 + id あり子での appendChild は parent が deferred-self、child が sel として _pending に積む', () => {
    const parent = new PairType('div') as TestElement;
    const child = makeEl('child-el');

    parent.appendChild(child as import('../../../src/html/elements/html-tag.ts').HtmlTag);

    const pending = (parent as { _pending: VanillaCommand[] })._pending;
    expect(pending).toHaveLength(1);
    const cmd = pending[0] as Extract<VanillaCommand, { type: 'appendChild' }>;
    expect(cmd.type).toBe('appendChild');
    expect(cmd.parent).toEqual({ kind: 'deferred-self' });
    expect(cmd.child).toEqual({ kind: 'sel', selector: '#child-el' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// global-branch-90-percent Task 5.3:
// element-methods.ts の残ブランチ網羅補強テスト群
// 対象 requirement: 2.3
// 対応 design.md セクション: 「ElementMethodsTests」
// ─────────────────────────────────────────────────────────────────────────────

describe('.class() 即値経路（Req 2.3, 4.5）', () => {
  it('文字列を渡すと classListAdd コマンドを _pending に積む（line 472: typeof name === "string"）', () => {
    const el = makeEl('test-el');
    (el as { class(v: string): TestElement }).class('btn');

    expect(el._pending).toHaveLength(1);
    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'classListAdd',
      target: TARGET,
      name: 'btn',
    });
  });

  it('JsExpr を渡すと .code を name に使った classListAdd コマンドを積む（line 472: name.code 経路）', () => {
    const el = makeEl('test-el');
    const expr = _makeJsExpr('dynamicClass');
    (el as { class(v: import('../../../src/js/vanilla/types.ts').JsExpr): TestElement }).class(expr);

    expect(el._pending).toHaveLength(1);
    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'classListAdd',
      target: TARGET,
      name: 'dynamicClass',
    });
  });

  it('文字列経路は this を返してチェーン可能', () => {
    const el = makeEl('test-el');
    const result = (el as { class(v: string): TestElement }).class('btn');
    expect(result).toBe(el);
  });
});

describe('.value() / .text() 即値エイリアス（Req 2.3, 4.1, 4.2）', () => {
  it('.value("abc") は setValue と同等の setProp value コマンドを生成する', () => {
    const el = makeEl('test-el');
    (el as { value(v: string): TestElement }).value('abc');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'value',
      expr: '"abc"',
    });
  });

  it('.text(jsExpr) は setText と同等の setProp textContent コマンドを生成する', () => {
    const el = makeEl('test-el');
    const expr = _makeJsExpr('someExpr');
    (el as { text(v: import('../../../src/js/vanilla/types.ts').JsExpr): TestElement }).text(expr);

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'textContent',
      expr: 'someExpr',
    });
  });
});

describe('appendChild の _appendedChildren 記録（Req 2.3）', () => {
  it('親要素に _appendedChildren 配列が事前に存在する場合、appendChild 経路で child を push する（line 515）', () => {
    const parent = makeEl('parent-el');
    const child = makeEl('child-el');
    // each-template factory コード生成で参照される追跡フィールドを事前付与する
    (parent as unknown as { _appendedChildren: HtmlTag[] })._appendedChildren = [];

    parent.appendChild(child as HtmlTag);

    const recorded = (parent as unknown as { _appendedChildren: HtmlTag[] })._appendedChildren;
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toBe(child as unknown as HtmlTag);
  });

  it('_appendedChildren を強制的に undefined にした場合でも appendChild は throw せず コマンドを積む（line 515 false 経路の防御確認）', () => {
    const parent = makeEl('parent-el');
    const child = makeEl('child-el');
    // HtmlTag は通常 _appendedChildren=[] を持つが、何らかの理由で破壊されたケース（防御分岐）を再現する
    (parent as unknown as { _appendedChildren?: HtmlTag[] })._appendedChildren = undefined;

    expect(() => parent.appendChild(child as HtmlTag)).not.toThrow();
    expect(parent._pending).toHaveLength(1);
    expect(parent._pending[0]?.type).toBe('appendChild');
  });
});

describe('_getElementTarget: id 属性が keyValue 以外（boolean）の防御分岐（Req 2.3）', () => {
  it('id 属性の attributeValue.type が "keyValue" でない場合は deferred-self を返す（line 216 else 経路）', () => {
    // 通常 id は keyValue だが、union 型の安全側ガード（line 216）を網羅する。
    // HasPending インターフェース経由で boolean 型の id 属性を構成する。
    const el: HasPending = {
      _pending: [],
      _scope: undefined,
      attributes: [
        { key: 'id', attributeValue: { type: 'boolean' } },
      ],
    };

    const result = _getElementTarget(el);
    expect(result).toEqual({ kind: 'deferred-self' });
  });
});
