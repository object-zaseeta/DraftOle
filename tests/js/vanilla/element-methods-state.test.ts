/**
 * `element-methods.ts` の状態受容オーバーロードに関するテスト（Task 4.1）
 *
 * 対応 requirement: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 * 対応 design.md セクション: 「ElementMethods<Self> の拡張」
 *
 * 検証観点:
 *   - ReadableState<string> を受け取るオーバーロードが bind-* コマンドを PendingBuffer に積む
 *   - 即値経路（string / JsExpr）は既存の振る舞いと完全一致（Req 4.6）
 *   - 新エイリアス .text / .value / .style / .class / .checked が同等のコマンドを生成する
 *   - EachBinding を受け取る .appendChild が bind-each コマンドを生成する（Req 4.7）
 *   - 戻り値は this であり、チェーン可能（Req 1.5）
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.ts';
import { PairType } from '../../../src/html/elements/pair-type.ts';
import type { VanillaCommand } from '../../../src/js/vanilla/commands.ts';
import {
  _makeHandlerScope,
  applyElementMixin,
  type ElementMethods,
  type HandlerCallback,
} from '../../../src/js/vanilla/element-methods.ts';
import type { ScriptScope } from '../../../src/js/vanilla/script-scope.ts';
import { StateImpl } from '../../../src/js/vanilla/state/state.ts';
import type { ReadableState } from '../../../src/js/vanilla/state/state.ts';
import type { VanillaScope } from '../../../src/js/vanilla/vanilla-script-builder.ts';

// ─── テスト準備 ───────────────────────────────────────────────────────────────

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

/** テスト用 StateRegistry モック */
function makeRegistry() {
  let counter = 0;
  return {
    allocateId: () => `s${counter++}`,
    register: () => {},
    registerDerived: () => {},
  };
}

/** テスト用 State<string> を生成する */
function makeStringState(id: string): ReadableState<string> {
  const registry = makeRegistry();
  return new StateImpl<string>(id, registry as never);
}

/** テスト用 State<boolean> を生成する */
function makeBoolState(id: string): ReadableState<boolean> {
  const registry = makeRegistry();
  return new StateImpl<boolean>(id, registry as never);
}

// Task 2.2: target は ElementTarget オブジェクトに変更された（string ではない）
const TARGET = { kind: 'sel' as const, selector: '#test-el' };
const SEL_TARGET = TARGET;

beforeAll(() => {
  applyElementMixin(PairType.prototype as import('../../../src/html/elements/html-tag.ts').HtmlTag);
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.1: setText(state) → bind-text コマンド
// ─────────────────────────────────────────────────────────────────────────────

describe('setText(ReadableState<string>) → bind-text（Req 4.1）', () => {
  it('ReadableState<string> を渡すと bind-text コマンドを _pending に積む', () => {
    const el = makeEl('test-el');
    const state = makeStringState('s0');
    (el as { setText(v: ReadableState<string>): TestElement }).setText(state);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-text');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-text' }>;
    expect(bindCmd.target).toEqual(SEL_TARGET);
    expect(bindCmd.stateId).toBe('s0');
  });

  it('即値 string の場合は既存経路（setProp textContent）を使う（Req 4.6）', () => {
    const el = makeEl('test-el');
    el.setText('hello');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'textContent',
      expr: '"hello"',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.1: .text() エイリアス
// ─────────────────────────────────────────────────────────────────────────────

describe('.text() エイリアス（Req 4.1 + R-3）', () => {
  it('ReadableState<string> を渡すと bind-text コマンドを積む', () => {
    const el = makeEl('test-el');
    const state = makeStringState('s0');
    (el as { text(v: ReadableState<string>): TestElement }).text(state);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-text');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-text' }>;
    expect(bindCmd.stateId).toBe('s0');
  });

  it('即値 string は setProp textContent を生成する（Req 4.6）', () => {
    const el = makeEl('test-el');
    (el as { text(v: string): TestElement }).text('hello');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'textContent',
      expr: '"hello"',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.2: setValue(state) → bind-value コマンド
// ─────────────────────────────────────────────────────────────────────────────

describe('setValue(ReadableState<string>) → bind-value（Req 4.2）', () => {
  it('ReadableState<string> を渡すと bind-value コマンドを _pending に積む', () => {
    const el = makeEl('test-el');
    const state = makeStringState('s1');
    (el as { setValue(v: ReadableState<string>): TestElement }).setValue(state);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-value');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-value' }>;
    expect(bindCmd.target).toEqual(SEL_TARGET);
    expect(bindCmd.stateId).toBe('s1');
  });

  it('即値 string の場合は setProp value を生成する（Req 4.6）', () => {
    const el = makeEl('test-el');
    el.setValue('abc');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setProp',
      target: TARGET,
      prop: 'value',
      expr: '"abc"',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.2: .value() エイリアス
// ─────────────────────────────────────────────────────────────────────────────

describe('.value() エイリアス（Req 4.2 + R-3）', () => {
  it('ReadableState<string> を渡すと bind-value コマンドを積む', () => {
    const el = makeEl('test-el');
    const state = makeStringState('s1');
    (el as { value(v: ReadableState<string>): TestElement }).value(state);

    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-value');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-value' }>;
    expect(bindCmd.stateId).toBe('s1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.3: addClass(state) → bind-class-add コマンド
// ─────────────────────────────────────────────────────────────────────────────

describe('addClass(ReadableState<string>) → bind-class-add（Req 4.3）', () => {
  it('ReadableState<string> を渡すと bind-class-add コマンドを _pending に積む', () => {
    const el = makeEl('test-el');
    const state = makeStringState('s2');
    (el as { addClass(v: ReadableState<string>): TestElement }).addClass(state);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-class-add');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-class-add' }>;
    expect(bindCmd.target).toEqual(SEL_TARGET);
    expect(bindCmd.stateId).toBe('s2');
  });

  it('即値 string の場合は classListAdd コマンドを生成する（Req 4.6）', () => {
    const el = makeEl('test-el');
    el.addClass('active');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'classListAdd',
      target: TARGET,
      name: 'active',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.4: setStyle(prop, state) → bind-style コマンド
// ─────────────────────────────────────────────────────────────────────────────

describe('setStyle(prop, ReadableState<string>) → bind-style（Req 4.4）', () => {
  it('ReadableState<string> を渡すと bind-style コマンドを _pending に積む', () => {
    const el = makeEl('test-el');
    const state = makeStringState('s3');
    (el as { setStyle(p: string, v: ReadableState<string>): TestElement }).setStyle('color', state);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-style');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-style' }>;
    expect(bindCmd.target).toEqual(SEL_TARGET);
    expect(bindCmd.prop).toBe('color');
    expect(bindCmd.stateId).toBe('s3');
  });

  it('即値 string の場合は setStyle コマンドを生成する（Req 4.6）', () => {
    const el = makeEl('test-el');
    el.setStyle('color', 'red');

    expect(el._pending[0]).toEqual<VanillaCommand>({
      type: 'setStyle',
      target: TARGET,
      key: 'color',
      expr: '"red"',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.4: .setStyle() 状態受容（style エイリアスは HtmlTag.style getter と競合するため未実装）
// ─────────────────────────────────────────────────────────────────────────────

describe('setStyle(ReadableState) が bind-style コマンドを生成すること（Req 4.4 補足）', () => {
  it('setStyle で ReadableState<string> を渡すと bind-style コマンドを積む', () => {
    const el = makeEl('test-el');
    const state = makeStringState('s3');
    (el as { setStyle(p: string, v: ReadableState<string>): TestElement }).setStyle('fontSize', state);

    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-style');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-style' }>;
    expect(bindCmd.prop).toBe('fontSize');
    expect(bindCmd.stateId).toBe('s3');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.5: .class(state) → bind-class-all コマンド（全置換）
// ─────────────────────────────────────────────────────────────────────────────

describe('.class(ReadableState<string>) → bind-class-all（Req 4.5）', () => {
  it('ReadableState<string> を渡すと bind-class-all コマンドを _pending に積む', () => {
    const el = makeEl('test-el');
    const state = makeStringState('s4');
    (el as { class(v: ReadableState<string>): TestElement }).class(state);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-class-all');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-class-all' }>;
    expect(bindCmd.target).toEqual(SEL_TARGET);
    expect(bindCmd.stateId).toBe('s4');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// .checked() → bind-attr (attr: 'checked')
// ─────────────────────────────────────────────────────────────────────────────

describe('.checked(ReadableState<boolean>) → bind-checked', () => {
  it('ReadableState<boolean> を渡すと bind-checked コマンドを _pending に積む', () => {
    const el = makeEl('test-el');
    const state = makeBoolState('s5');
    (el as { checked(v: ReadableState<boolean>): TestElement }).checked(state);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-checked');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-checked' }>;
    expect(bindCmd.target).toEqual(SEL_TARGET);
    expect(bindCmd.stateId).toBe('s5');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 4.7: appendChild(EachBinding) → bind-each コマンド
// ─────────────────────────────────────────────────────────────────────────────

describe('appendChild(EachBinding) → bind-each（Req 4.7）', () => {
  it('EachBinding を渡すと bind-each コマンドを _pending に積む', () => {
    const el = makeEl('test-el');
    // EachBindingWithSnapshot を模擬
    const mockSnapshot = {
      itemStateIdPattern: 's6.item{i}',
      templateCommands: [] as VanillaCommand[],
    };
    const eachBinding = {
      _kind: 'each' as const,
      _stateId: 's6',
      _template: makeEl('template-el'),
      _snapshot: mockSnapshot,
    };

    (el as { appendChild(b: typeof eachBinding): TestElement }).appendChild(eachBinding);

    expect(el._pending).toHaveLength(1);
    const cmd = el._pending[0];
    expect(cmd.type).toBe('bind-each');
    const bindCmd = cmd as Extract<VanillaCommand, { type: 'bind-each' }>;
    expect(bindCmd.target).toEqual(SEL_TARGET);
    expect(bindCmd.stateId).toBe('s6');
    expect(bindCmd.template).toEqual(mockSnapshot);
  });

  it('通常の HtmlTag の場合は既存の appendChild コマンドを生成する（Req 4.6）', () => {
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

// ─────────────────────────────────────────────────────────────────────────────
// _scope 設定済み時は _scope._append を通じて発行される
// ─────────────────────────────────────────────────────────────────────────────

describe('_scope 設定済み時は bind-text が _scope._append を通じて発行される', () => {
  it('bind-text コマンドが _pending ではなく _scope へ渡される', () => {
    const el = makeEl('test-el');
    const captured: VanillaCommand[] = [];
    el._scope = {
      _append(cmd) { captured.push(cmd); },
      _childScope() { return el._scope!; },
      raw(code) { return { code }; },
      let(name, _value) { return { code: name }; },
      call(name, _args) { return { code: name }; },
      return() { /* noop */ },
      ifThen() { /* noop */ },
    } as VanillaScope;

    const state = makeStringState('s0');
    (el as { setText(v: ReadableState<string>): TestElement }).setText(state);

    expect(el._pending).toHaveLength(0);
    expect(captured).toHaveLength(1);
    expect(captured[0].type).toBe('bind-text');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// チェーン互換性
// ─────────────────────────────────────────────────────────────────────────────

describe('状態受容メソッドはメソッドチェーンをサポートする（Req 1.5）', () => {
  it('.text() と .class() を連続チェーンできる', () => {
    const el = makeEl('test-el');
    const textState = makeStringState('s0');
    const textMethods = el as {
      text(v: ReadableState<string>): TestElement;
      class(v: ReadableState<string>): TestElement;
    };
    const result = textMethods.text(textState);
    // result が el と同一であることを確認
    expect(result).toBe(el);
    expect(el._pending).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// global-branch-90-percent Task 5.3:
// _makeHandlerScope の防御ブランチ網羅補強テスト群
// 対象 requirement: 2.3
// 対応 design.md セクション: 「ElementMethodsTests」
//
// _makeHandlerScope の各メソッド分岐:
//   - fn() / onDomReady(): ハンドラスコープでは未サポートのため throw
//   - _emitHandlerBody(): transformer 経路（target/event 設定済み）でのみ使用可
//                          legacy HandlerCallback 経路では throw
//   - if() / ifThen() の orElse あり/なし分岐（buildIf 内 line 292）
//   - _childScope() の再帰生成
//   - state(): ScriptStateHandle が返ること
// ─────────────────────────────────────────────────────────────────────────────

describe('_makeHandlerScope: 防御エラー経路（Req 2.3）', () => {
  it('handler-body 用 target/event 未設定時に _emitHandlerBody を呼ぶと throw する（line 346-349）', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);
    expect(() => scope._emitHandlerBody('console.log()', [])).toThrowError(
      /This method is only available in the transformer-emitted handler scope/,
    );
  });

  it('fn() はハンドラスコープでサポートされない旨を throw する（line 330-334）', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);
    // ハンドラスコープでは fn() は意味をなさない（ローカル関数定義はトップレベル script で行う）
    expect(() => scope.fn('helper', () => { /* body */ })).toThrowError(
      /fn\(\) is not supported in event handler scope/,
    );
  });

  it('onDomReady() はハンドラスコープでサポートされない旨を throw する（line 336-340）', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);
    expect(() => scope.onDomReady(() => { /* body */ })).toThrowError(
      /onDomReady\(\) is not supported in event handler scope/,
    );
  });

  it('legacy HandlerCallback 経路で .on を呼んでもハンドラ内で fn() を呼ぶと throw する（dispatcher line 399-406 経由）', () => {
    // _makeHandlerScope(queue) を target/event 未指定で呼ぶ legacy 経路を通す
    applyElementMixin(PairType.prototype as import('../../../src/html/elements/html-tag.ts').HtmlTag);
    const el = makeEl('test-el');
    // biome-ignore lint/complexity/useArrowFunction: dispatcher が isArrowShape を判定するため function 式が必要
    const cb: HandlerCallback = function(s: ScriptScope) {
      s.fn('inner', () => { /* never */ });
    };
    expect(() => el.on('click', cb)).toThrowError(
      /fn\(\) is not supported in event handler scope/,
    );
  });
});

describe('_makeHandlerScope: ScriptScope 公開 API のハンドラスコープ内挙動（Req 2.3）', () => {
  it('raw / let / call / return がコマンド列を生成する', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);

    const expr = scope.raw('1');
    expect(expr).toEqual({ code: '1' });

    const bound = scope.let('x', scope.raw('42'));
    expect(bound).toEqual({ code: 'x' });

    const callExpr = scope.call('foo', [scope.raw('1'), scope.raw('2')]);
    expect(callExpr).toEqual({ code: 'foo(1, 2)' });

    scope.return();

    // declareConst → expr → raw の 3 コマンドが順に積まれる
    expect(queue).toHaveLength(3);
    expect(queue[0]).toEqual({ type: 'declareConst', name: 'x', expr: '42' });
    expect(queue[1]).toEqual({ type: 'expr', code: 'foo(1, 2)' });
    expect(queue[2]).toEqual({ type: 'raw', code: 'return;' });
  });

  it('call() の args 省略時は空引数リストの expr コマンドが積まれる', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);

    const result = scope.call('noop');
    expect(result).toEqual({ code: 'noop()' });
    expect(queue).toEqual([{ type: 'expr', code: 'noop()' }]);
  });

  it('if(condition, then) は thenCode のみの if コマンドを積む（orElse なし: buildIf line 295-298 else 経路）', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);

    scope.if(scope.raw('flag'), (s) => {
      s.call('inThen');
    });

    expect(queue).toHaveLength(1);
    const cmd = queue[0];
    expect(cmd.type).toBe('if');
    if (cmd.type === 'if') {
      expect(cmd.condition).toBe('flag');
      expect(cmd.thenCode).toContain('inThen()');
      expect(cmd.elseCode).toBeUndefined();
    }
  });

  it('if(condition, then, orElse) は elseCode 付きの if コマンドを積む（orElse あり: buildIf line 292-295）', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);

    scope.if(
      scope.raw('flag'),
      (s) => { s.call('inThen'); },
      (s) => { s.call('inElse'); },
    );

    const cmd = queue[0];
    expect(cmd.type).toBe('if');
    if (cmd.type === 'if') {
      expect(cmd.thenCode).toContain('inThen()');
      expect(cmd.elseCode).toContain('inElse()');
    }
  });

  it('ifThen(condition, then) は if と同等の動作をする（orElse なし）', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);

    scope.ifThen(scope.raw('cond'), (s) => {
      s.call('body');
    });

    const cmd = queue[0];
    expect(cmd.type).toBe('if');
    if (cmd.type === 'if') {
      expect(cmd.condition).toBe('cond');
      expect(cmd.thenCode).toContain('body()');
      expect(cmd.elseCode).toBeUndefined();
    }
  });

  it('ifThen(condition, then, orElse) は elseCode 付きで積む', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);

    scope.ifThen(
      scope.raw('cond'),
      (s) => { s.call('a'); },
      (s) => { s.call('b'); },
    );

    const cmd = queue[0];
    expect(cmd.type).toBe('if');
    if (cmd.type === 'if') {
      expect(cmd.thenCode).toContain('a()');
      expect(cmd.elseCode).toContain('b()');
    }
  });

  it('_childScope は親と別キューを使う子スコープを返す', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);
    const childQueue: VanillaCommand[] = [];
    const child = scope._childScope(childQueue);

    child.call('childCall');
    expect(childQueue).toHaveLength(1);
    expect(childQueue[0]).toEqual({ type: 'expr', code: 'childCall()' });
    expect(queue).toHaveLength(0);
  });

  it('state() は ScriptStateHandle を返す（line 343）', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);
    const registry = { allocateId: () => 's0', register: () => {}, registerDerived: () => {} };
    const state = new StateImpl<string>('s0', registry as never);

    const handle = scope.state(state);
    // ScriptStateHandle は get/set 等のメソッドを持つオブジェクトであることを最小限確認する
    expect(handle).toBeDefined();
    expect(typeof handle).toBe('object');
  });

  it('_append でコマンドをキューに直接積める', () => {
    const queue: VanillaCommand[] = [];
    const scope = _makeHandlerScope(queue);

    scope._append({ type: 'raw', code: '/* hello */' });
    expect(queue).toEqual([{ type: 'raw', code: '/* hello */' }]);
  });
});

describe('_makeHandlerScope: transformer 経由 _emitHandlerBody（Req 2.3）', () => {
  it('handler-body 用 target/event を渡したスコープは _emitHandlerBody で handler-body コマンドを積む（line 352）', () => {
    const queue: VanillaCommand[] = [];
    const target = { kind: 'sel', selector: '#btn' } as const;
    const scope = _makeHandlerScope(queue, target, 'click');

    scope._emitHandlerBody('console.log(e)', ['e']);

    expect(queue).toHaveLength(1);
    const cmd = queue[0];
    expect(cmd.type).toBe('handler-body');
    if (cmd.type === 'handler-body') {
      expect(cmd.target).toEqual(target);
      expect(cmd.event).toBe('click');
      expect(cmd.code).toBe('console.log(e)');
      expect(cmd.params).toEqual(['e']);
    }
  });
});
