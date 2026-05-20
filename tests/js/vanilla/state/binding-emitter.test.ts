/**
 * binding-emitter.ts のユニットテスト
 *
 * タスク 3.3: 各エミッタ関数が正しい構造の VanillaCommand を返すことを検証する。
 * タスク 3 (each-template-derived-binding): DerivedTemplateState の派生 State 検出分岐を検証する。
 *
 * Requirements: 4.1–4.7, 1.2, 2.2, 2.3, 5.1
 */

import { describe, it, expect } from 'vitest';
import {
  emitBindText,
  emitBindValue,
  emitBindClassAll,
  emitBindClassAdd,
  emitBindStyle,
  emitBindChecked,
  emitBindEach,
} from '../../../../src/js/vanilla/state/binding-emitter.js';
import type { ElementTarget } from '../../../../src/js/vanilla/element-target.js';
import type { EachBinding } from '../../../../src/js/vanilla/state/state.js';
import { StateImpl, makeJsExpr } from '../../../../src/js/vanilla/state/state.js';
import { StateRegistry } from '../../../../src/js/vanilla/state/registry.js';
import type { EachTemplateSnapshot } from '../../../../src/js/vanilla/state/each-template.js';
import { DerivedTemplateState } from '../../../../src/js/vanilla/state/template-derived-state.js';

// ─── テストヘルパー ───────────────────────────────────────────────────────────

function makeState<T>(id: string): StateImpl<T> {
  const registry = new StateRegistry();
  return new StateImpl<T>(id, registry);
}

const varTarget: ElementTarget = { kind: 'closure-ref', varName: 'myEl' };
const selTarget: ElementTarget = { kind: 'sel', selector: '#app' };

// ─── emitBindText ─────────────────────────────────────────────────────────────

describe('emitBindText', () => {
  it('bind-text コマンドを返す', () => {
    const state = makeState<string>('s0');
    const cmd = emitBindText(varTarget, state);
    expect(cmd.type).toBe('bind-text');
  });

  it('target が正しく設定される（var）', () => {
    const state = makeState<string>('s0');
    const cmd = emitBindText(varTarget, state);
    if (cmd.type !== 'bind-text') throw new Error('unexpected type');
    expect(cmd.target).toEqual({ kind: 'closure-ref', varName: 'myEl' });
  });

  it('target が正しく設定される（sel）', () => {
    const state = makeState<string>('s0');
    const cmd = emitBindText(selTarget, state);
    if (cmd.type !== 'bind-text') throw new Error('unexpected type');
    expect(cmd.target).toEqual({ kind: 'sel', selector: '#app' });
  });

  it('stateId が state._runtimeId と一致する', () => {
    const state = makeState<string>('s42');
    const cmd = emitBindText(varTarget, state);
    if (cmd.type !== 'bind-text') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('s42');
  });

  it('transform は undefined（単純 State の場合）', () => {
    const state = makeState<string>('s0');
    const cmd = emitBindText(varTarget, state);
    if (cmd.type !== 'bind-text') throw new Error('unexpected type');
    expect(cmd.transform).toBeUndefined();
  });
});

// ─── emitBindValue ───────────────────────────────────────────────────────────

describe('emitBindValue', () => {
  it('bind-value コマンドを返す', () => {
    const state = makeState<string>('s1');
    const cmd = emitBindValue(varTarget, state);
    expect(cmd.type).toBe('bind-value');
  });

  it('target が正しく設定される', () => {
    const state = makeState<string>('s1');
    const cmd = emitBindValue(selTarget, state);
    if (cmd.type !== 'bind-value') throw new Error('unexpected type');
    expect(cmd.target).toEqual({ kind: 'sel', selector: '#app' });
  });

  it('stateId が state._runtimeId と一致する', () => {
    const state = makeState<string>('myState');
    const cmd = emitBindValue(varTarget, state);
    if (cmd.type !== 'bind-value') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('myState');
  });
});

// ─── emitBindClassAll ────────────────────────────────────────────────────────

describe('emitBindClassAll', () => {
  it('bind-class-all コマンドを返す', () => {
    const state = makeState<string>('s2');
    const cmd = emitBindClassAll(varTarget, state);
    expect(cmd.type).toBe('bind-class-all');
  });

  it('target が正しく設定される', () => {
    const state = makeState<string>('s2');
    const cmd = emitBindClassAll(varTarget, state);
    if (cmd.type !== 'bind-class-all') throw new Error('unexpected type');
    expect(cmd.target).toEqual({ kind: 'closure-ref', varName: 'myEl' });
  });

  it('stateId が state._runtimeId と一致する', () => {
    const state = makeState<string>('classState');
    const cmd = emitBindClassAll(varTarget, state);
    if (cmd.type !== 'bind-class-all') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('classState');
  });

  it('transform は undefined（単純 State の場合）', () => {
    const state = makeState<string>('s2');
    const cmd = emitBindClassAll(varTarget, state);
    if (cmd.type !== 'bind-class-all') throw new Error('unexpected type');
    expect(cmd.transform).toBeUndefined();
  });
});

// ─── emitBindClassAdd ────────────────────────────────────────────────────────

describe('emitBindClassAdd', () => {
  it('bind-class-add コマンドを返す', () => {
    const state = makeState<string>('s3');
    const cmd = emitBindClassAdd(varTarget, state);
    expect(cmd.type).toBe('bind-class-add');
  });

  it('target が正しく設定される', () => {
    const state = makeState<string>('s3');
    const cmd = emitBindClassAdd(selTarget, state);
    if (cmd.type !== 'bind-class-add') throw new Error('unexpected type');
    expect(cmd.target).toEqual({ kind: 'sel', selector: '#app' });
  });

  it('stateId が state._runtimeId と一致する', () => {
    const state = makeState<string>('addClassState');
    const cmd = emitBindClassAdd(varTarget, state);
    if (cmd.type !== 'bind-class-add') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('addClassState');
  });

  it('transform は undefined（単純 State の場合）', () => {
    const state = makeState<string>('s3');
    const cmd = emitBindClassAdd(varTarget, state);
    if (cmd.type !== 'bind-class-add') throw new Error('unexpected type');
    expect(cmd.transform).toBeUndefined();
  });
});

// ─── emitBindStyle ───────────────────────────────────────────────────────────

describe('emitBindStyle', () => {
  it('bind-style コマンドを返す', () => {
    const state = makeState<string>('s4');
    const cmd = emitBindStyle(varTarget, 'color', state);
    expect(cmd.type).toBe('bind-style');
  });

  it('target が正しく設定される', () => {
    const state = makeState<string>('s4');
    const cmd = emitBindStyle(varTarget, 'color', state);
    if (cmd.type !== 'bind-style') throw new Error('unexpected type');
    expect(cmd.target).toEqual({ kind: 'closure-ref', varName: 'myEl' });
  });

  it('prop が正しく設定される', () => {
    const state = makeState<string>('s4');
    const cmd = emitBindStyle(varTarget, 'fontSize', state);
    if (cmd.type !== 'bind-style') throw new Error('unexpected type');
    expect(cmd.prop).toBe('fontSize');
  });

  it('stateId が state._runtimeId と一致する', () => {
    const state = makeState<string>('styleState');
    const cmd = emitBindStyle(selTarget, 'color', state);
    if (cmd.type !== 'bind-style') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('styleState');
  });

  it('transform は undefined（単純 State の場合）', () => {
    const state = makeState<string>('s4');
    const cmd = emitBindStyle(varTarget, 'color', state);
    if (cmd.type !== 'bind-style') throw new Error('unexpected type');
    expect(cmd.transform).toBeUndefined();
  });
});

// ─── emitBindChecked ─────────────────────────────────────────────────────────

describe('emitBindChecked', () => {
  it('bind-checked コマンドを返す', () => {
    const state = makeState<boolean>('s5');
    const cmd = emitBindChecked(varTarget, state);
    expect(cmd.type).toBe('bind-checked');
  });

  it('target が正しく設定される', () => {
    const state = makeState<boolean>('s5');
    const cmd = emitBindChecked(varTarget, state);
    if (cmd.type !== 'bind-checked') throw new Error('unexpected type');
    expect(cmd.target).toEqual({ kind: 'closure-ref', varName: 'myEl' });
  });

  it('stateId が state._runtimeId と一致する', () => {
    const state = makeState<boolean>('checkedState');
    const cmd = emitBindChecked(varTarget, state);
    if (cmd.type !== 'bind-checked') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('checkedState');
  });
});

// ─── emitBindEach ─────────────────────────────────────────────────────────────

describe('emitBindEach', () => {
  function makeEachBindingWithSnapshot(): EachBinding<unknown> & { _snapshot: EachTemplateSnapshot } {
    const snapshot: EachTemplateSnapshot = {
      itemStateIdPattern: 'todos.item{i}',
      templateCommands: [],
    };
    return {
      _kind: 'each',
      _stateId: 'todos',
      _template: {},
      _snapshot: snapshot,
    };
  }

  it('bind-each コマンドを返す', () => {
    const binding = makeEachBindingWithSnapshot();
    const cmd = emitBindEach(varTarget, binding);
    expect(cmd.type).toBe('bind-each');
  });

  it('target が正しく設定される', () => {
    const binding = makeEachBindingWithSnapshot();
    const cmd = emitBindEach(varTarget, binding);
    if (cmd.type !== 'bind-each') throw new Error('unexpected type');
    expect(cmd.target).toEqual({ kind: 'closure-ref', varName: 'myEl' });
  });

  it('stateId が binding._stateId と一致する', () => {
    const binding = makeEachBindingWithSnapshot();
    const cmd = emitBindEach(varTarget, binding);
    if (cmd.type !== 'bind-each') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('todos');
  });

  it('template が binding._snapshot と一致する', () => {
    const binding = makeEachBindingWithSnapshot();
    const cmd = emitBindEach(varTarget, binding);
    if (cmd.type !== 'bind-each') throw new Error('unexpected type');
    expect(cmd.template.itemStateIdPattern).toBe('todos.item{i}');
    expect(Array.isArray(cmd.template.templateCommands)).toBe(true);
  });

  it('template の itemStateIdPattern が正しい', () => {
    const snapshot: EachTemplateSnapshot = {
      itemStateIdPattern: 'items.item{i}',
      templateCommands: [],
    };
    const binding: EachBinding<unknown> & { _snapshot: EachTemplateSnapshot } = {
      _kind: 'each',
      _stateId: 'items',
      _template: {},
      _snapshot: snapshot,
    };
    const cmd = emitBindEach(varTarget, binding);
    if (cmd.type !== 'bind-each') throw new Error('unexpected type');
    expect(cmd.template.itemStateIdPattern).toBe('items.item{i}');
  });
});

// ─── DerivedTemplateState 分岐テスト（Task 3: each-template-derived-binding） ─────

function makeDerived<T>(parentId: string, transformCode: string): DerivedTemplateState<T> {
  return new DerivedTemplateState<T>(parentId, makeJsExpr(transformCode));
}

describe('emitBindText + DerivedTemplateState', () => {
  it('DerivedTemplateState の場合 type は bind-text', () => {
    const derived = makeDerived<string>('s0.itemTemplate', '((_v).name)');
    const cmd = emitBindText(varTarget, derived);
    expect(cmd.type).toBe('bind-text');
  });

  it('DerivedTemplateState の場合 stateId は _parentTemplateId', () => {
    const derived = makeDerived<string>('s0.itemTemplate', '((_v).name)');
    const cmd = emitBindText(varTarget, derived);
    if (cmd.type !== 'bind-text') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('s0.itemTemplate');
  });

  it('DerivedTemplateState の場合 transform が設定される', () => {
    const transform = makeJsExpr('((_v).name)');
    const derived = new DerivedTemplateState<string>('s0.itemTemplate', transform);
    const cmd = emitBindText(varTarget, derived);
    if (cmd.type !== 'bind-text') throw new Error('unexpected type');
    expect(cmd.transform).toBe(transform);
  });
});

describe('emitBindChecked (Task 3: type 変更 + DerivedTemplateState)', () => {
  it('通常 State の場合 type は bind-checked (bind-attr から変更)', () => {
    const state = new StateImpl<boolean>('s5', new StateRegistry());
    const cmd = emitBindChecked(varTarget, state);
    expect(cmd.type).toBe('bind-checked');
  });

  it('通常 State の場合 stateId は _runtimeId', () => {
    const state = new StateImpl<boolean>('checkedState', new StateRegistry());
    const cmd = emitBindChecked(varTarget, state);
    if (cmd.type !== 'bind-checked') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('checkedState');
  });

  it('通常 State の場合 transform は undefined', () => {
    const state = new StateImpl<boolean>('s5', new StateRegistry());
    const cmd = emitBindChecked(varTarget, state);
    if (cmd.type !== 'bind-checked') throw new Error('unexpected type');
    expect(cmd.transform).toBeUndefined();
  });

  it('DerivedTemplateState の場合 type は bind-checked', () => {
    const derived = makeDerived<boolean>('s0.itemTemplate', '((_v).active)');
    const cmd = emitBindChecked(varTarget, derived);
    expect(cmd.type).toBe('bind-checked');
  });

  it('DerivedTemplateState の場合 stateId は _parentTemplateId', () => {
    const derived = makeDerived<boolean>('s0.itemTemplate', '((_v).active)');
    const cmd = emitBindChecked(varTarget, derived);
    if (cmd.type !== 'bind-checked') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('s0.itemTemplate');
  });

  it('DerivedTemplateState の場合 transform が設定される', () => {
    const transform = makeJsExpr('((_v).active)');
    const derived = new DerivedTemplateState<boolean>('s0.itemTemplate', transform);
    const cmd = emitBindChecked(varTarget, derived);
    if (cmd.type !== 'bind-checked') throw new Error('unexpected type');
    expect(cmd.transform).toBe(transform);
  });
});

describe('emitBindValue + DerivedTemplateState', () => {
  it('DerivedTemplateState の場合 stateId は _parentTemplateId', () => {
    const derived = makeDerived<string>('s1.itemTemplate', '((_v).val)');
    const cmd = emitBindValue(varTarget, derived);
    if (cmd.type !== 'bind-value') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('s1.itemTemplate');
  });

  it('DerivedTemplateState の場合 transform が設定される', () => {
    const transform = makeJsExpr('((_v).val)');
    const derived = new DerivedTemplateState<string>('s1.itemTemplate', transform);
    const cmd = emitBindValue(varTarget, derived);
    if (cmd.type !== 'bind-value') throw new Error('unexpected type');
    expect(cmd.transform).toBe(transform);
  });
});

describe('emitBindClassAll + DerivedTemplateState', () => {
  it('DerivedTemplateState の場合 stateId は _parentTemplateId', () => {
    const derived = makeDerived<string>('s2.itemTemplate', '((_v).cls)');
    const cmd = emitBindClassAll(varTarget, derived);
    if (cmd.type !== 'bind-class-all') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('s2.itemTemplate');
  });

  it('DerivedTemplateState の場合 transform が設定される', () => {
    const transform = makeJsExpr('((_v).cls)');
    const derived = new DerivedTemplateState<string>('s2.itemTemplate', transform);
    const cmd = emitBindClassAll(varTarget, derived);
    if (cmd.type !== 'bind-class-all') throw new Error('unexpected type');
    expect(cmd.transform).toBe(transform);
  });
});

describe('emitBindClassAdd + DerivedTemplateState', () => {
  it('DerivedTemplateState の場合 stateId は _parentTemplateId', () => {
    const derived = makeDerived<string>('s3.itemTemplate', '((_v).tag)');
    const cmd = emitBindClassAdd(varTarget, derived);
    if (cmd.type !== 'bind-class-add') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('s3.itemTemplate');
  });

  it('DerivedTemplateState の場合 transform が設定される', () => {
    const transform = makeJsExpr('((_v).tag)');
    const derived = new DerivedTemplateState<string>('s3.itemTemplate', transform);
    const cmd = emitBindClassAdd(varTarget, derived);
    if (cmd.type !== 'bind-class-add') throw new Error('unexpected type');
    expect(cmd.transform).toBe(transform);
  });
});

describe('emitBindStyle + DerivedTemplateState', () => {
  it('DerivedTemplateState の場合 stateId は _parentTemplateId', () => {
    const derived = makeDerived<string>('s4.itemTemplate', '((_v).color)');
    const cmd = emitBindStyle(varTarget, 'color', derived);
    if (cmd.type !== 'bind-style') throw new Error('unexpected type');
    expect(cmd.stateId).toBe('s4.itemTemplate');
  });

  it('DerivedTemplateState の場合 transform が設定される', () => {
    const transform = makeJsExpr('((_v).color)');
    const derived = new DerivedTemplateState<string>('s4.itemTemplate', transform);
    const cmd = emitBindStyle(varTarget, 'color', derived);
    if (cmd.type !== 'bind-style') throw new Error('unexpected type');
    expect(cmd.transform).toBe(transform);
  });
});

// ─── 境界テスト ──────────────────────────────────────────────────────────────

describe('境界テスト', () => {
  it('各エミッタは独立した VanillaCommand オブジェクトを返す', () => {
    const state = makeState<string>('s0');
    const cmd1 = emitBindText(varTarget, state);
    const cmd2 = emitBindText(varTarget, state);
    // 同一オブジェクトではなく独立したオブジェクトであること
    expect(cmd1).not.toBe(cmd2);
  });

  it('異なる stateId のコマンドは異なる stateId を持つ', () => {
    const state1 = makeState<string>('alpha');
    const state2 = makeState<string>('beta');
    const cmd1 = emitBindText(varTarget, state1);
    const cmd2 = emitBindText(varTarget, state2);
    if (cmd1.type !== 'bind-text' || cmd2.type !== 'bind-text') throw new Error('unexpected type');
    expect(cmd1.stateId).not.toBe(cmd2.stateId);
    expect(cmd1.stateId).toBe('alpha');
    expect(cmd2.stateId).toBe('beta');
  });
});
