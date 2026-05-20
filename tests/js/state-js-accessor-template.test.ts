/**
 * TemplateState 版 StateJsAccessor — ユニットテスト
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * TemplateStateImpl と DerivedTemplateState の `.js` アクセサが
 * テンプレートID形式（"<arrayId>.itemTemplate"）を返すことを検証する。
 */

import type { StateJsAccessor } from '../../src/js/vanilla/index';
import { makeJsExpr } from '../../src/js/vanilla/state/state';
import { DerivedTemplateState, TemplateStateImpl } from '../../src/js/vanilla/state/template-derived-state';

// テスト用の最小 StateRegistry スタブ
const makeRegistry = () => {
  let counter = 0;
  return {
    allocateId: () => `s${counter++}`,
    register: () => {},
    registerDerived: () => {},
    getAll: () => [],
    getDerived: () => [],
  } as import('../../src/js/vanilla/state/registry').StateRegistry;
};

// ────────────────────────────────────────────────────────────
// TemplateStateImpl の .js アクセサ
// ────────────────────────────────────────────────────────────

describe('TemplateStateImpl.js — Requirement 1.1, 1.5', () => {
  it('_runtimeId は "<arrayStateId>.itemTemplate" 形式になる', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<number[]>('s0', registry);
    expect(item._runtimeId).toBe('s0.itemTemplate');
  });

  it('.js は StateJsAccessor を実装している', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<number[]>('s0', registry);
    const acc: StateJsAccessor = item.js;
    expect(typeof acc.get).toBe('function');
    expect(typeof acc.set).toBe('function');
    expect(typeof acc.update).toBe('function');
  });

  it('.js.get() はテンプレートID形式の文字列を返す', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<number[]>('s0', registry);
    expect(item.js.get()).toBe("__draftole__.state('s0.itemTemplate').get()");
  });

  it('.js.get() は __draftole__ を含む', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<string[]>('myArray', registry);
    expect(item.js.get()).toContain('__draftole__');
  });

  it('.js.get() はテンプレートID（".itemTemplate" サフィックス）を含む', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<string[]>('s1', registry);
    expect(item.js.get()).toContain('s1.itemTemplate');
  });

  it('.js.set(expr) はテンプレートIDを含む正しいJS文を返す', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<number[]>('s0', registry);
    expect(item.js.set('newValue')).toBe("__draftole__.state('s0.itemTemplate').set(newValue)");
  });

  it('.js.update(body) はアロー関数形式のJS文を返す', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<number[]>('s0', registry);
    expect(item.js.update('return __v + 1')).toBe(
      "__draftole__.state('s0.itemTemplate').set((__v) => { return __v + 1 })"
    );
  });

  it('異なるarrayStateIdは異なるget()文字列を生成する', () => {
    const r1 = makeRegistry();
    const r2 = makeRegistry();
    const item1 = new TemplateStateImpl<number[]>('s0', r1);
    const item2 = new TemplateStateImpl<number[]>('s1', r2);
    expect(item1.js.get()).not.toBe(item2.js.get());
  });
});

// ────────────────────────────────────────────────────────────
// DerivedTemplateState の .js アクセサ
// ────────────────────────────────────────────────────────────

describe('DerivedTemplateState.js — Requirement 1.1, 1.5', () => {
  it('_runtimeId は親テンプレートIDと同値', () => {
    const transform = makeJsExpr('(_v).name');
    const derived = new DerivedTemplateState<string>('s0.itemTemplate', transform);
    expect(derived._runtimeId).toBe('s0.itemTemplate');
    expect(derived._parentTemplateId).toBe('s0.itemTemplate');
  });

  it('.js.get() は parentTemplateId を使った文字列を返す', () => {
    const transform = makeJsExpr('(_v).name');
    const derived = new DerivedTemplateState<string>('s0.itemTemplate', transform);
    expect(derived.js.get()).toBe("__draftole__.state('s0.itemTemplate').get()");
  });

  it('.js.get() は __draftole__ を含む', () => {
    const transform = makeJsExpr('(_v).count');
    const derived = new DerivedTemplateState<number>('myArr.itemTemplate', transform);
    expect(derived.js.get()).toContain('__draftole__');
  });

  it('.js.set() は parentTemplateId に基づく正しいJS文を返す', () => {
    const transform = makeJsExpr('(_v)');
    const derived = new DerivedTemplateState<string>('s0.itemTemplate', transform);
    expect(derived.js.set('val')).toBe("__draftole__.state('s0.itemTemplate').set(val)");
  });
});

// ────────────────────────────────────────────────────────────
// TemplateStateImpl.map() → DerivedTemplateState.js
// ────────────────────────────────────────────────────────────

describe('TemplateStateImpl.map() で生成した DerivedTemplateState の .js — Requirement 1.5', () => {
  it('map() で派生した DerivedTemplateState も .js を持つ', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<{ name: string }[]>('s0', registry);
    const derived = item.map((v) => v);
    expect(derived.js).toBeDefined();
    expect(typeof derived.js.get).toBe('function');
  });

  it('map() 派生の .js.get() はテンプレートIDを含む', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<{ count: number }[]>('s2', registry);
    const derived = item.map((v) => v);
    // DerivedTemplateState._runtimeId は parentTemplateId = "s2.itemTemplate"
    expect(derived.js.get()).toContain('s2.itemTemplate');
    expect(derived.js.get()).toContain('__draftole__');
  });

  it('field() で派生した DerivedTemplateState も .js を持つ', () => {
    const registry = makeRegistry();
    const item = new TemplateStateImpl<{ name: string }[]>('s0', registry);
    const derived = item.field('name' as never);
    expect((derived as { js: StateJsAccessor }).js).toBeDefined();
  });
});
