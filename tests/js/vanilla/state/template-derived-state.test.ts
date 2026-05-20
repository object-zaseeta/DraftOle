/**
 * DerivedTemplateState<T> / isDerivedTemplateState のユニットテスト
 *
 * Task 1.1: DerivedTemplateState クラスと isDerivedTemplateState 型ガードの作成
 *
 * 対象 Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.4, 3.1, 3.2, 3.3, 5.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DerivedTemplateState,
  isDerivedTemplateState,
  TemplateStateImpl,
  createTemplateState,
} from '../../../../src/js/vanilla/state/template-derived-state';
import { StateImpl } from '../../../../src/js/vanilla/state/state';
import { StateRegistry } from '../../../../src/js/vanilla/state/registry';
import type { JsExpr } from '../../../../src/js/vanilla/types';

// テスト用の JsExpr ファクトリ
function makeExpr(code: string): JsExpr {
  return {
    __jsExpr: true as const,
    code,
    eq: () => { throw new Error('not impl'); },
    ne: () => { throw new Error('not impl'); },
    or: () => { throw new Error('not impl'); },
    trim: () => { throw new Error('not impl'); },
    isFalsy: () => { throw new Error('not impl'); },
    isTruthy: () => { throw new Error('not impl'); },
  };
}

describe('DerivedTemplateState', () => {
  const parentId = 's0.itemTemplate';
  const transform = makeExpr('((_v).text)');

  describe('constructor and fields (Req 1.1, 1.4, 1.5)', () => {
    it('_parentTemplateId に親 ID を保持する', () => {
      const dts = new DerivedTemplateState<string>(parentId, transform);
      expect(dts._parentTemplateId).toBe(parentId);
    });

    it('_runtimeId が _parentTemplateId と同値 (Req 1.5: allocateId を呼ばない)', () => {
      const dts = new DerivedTemplateState<string>(parentId, transform);
      expect(dts._runtimeId).toBe(parentId);
      expect(dts._runtimeId).toBe(dts._parentTemplateId);
    });

    it('_transform に渡した JsExpr を保持する', () => {
      const dts = new DerivedTemplateState<string>(parentId, transform);
      expect(dts._transform).toBe(transform);
      expect(dts._transform.code).toBe('((_v).text)');
    });

    it('異なるインスタンスは独立している (Req 1.4)', () => {
      const transform2 = makeExpr('((_v).done)');
      const dts1 = new DerivedTemplateState<string>(parentId, transform);
      const dts2 = new DerivedTemplateState<boolean>(parentId, transform2);
      expect(dts1._transform.code).not.toBe(dts2._transform.code);
    });
  });

  describe('throw on misuse (Req 3.1, 3.2, 3.3)', () => {
    it('.map() は "chained .map() is not supported" エラーをスローする', () => {
      const dts = new DerivedTemplateState<string>(parentId, transform);
      expect(() => dts.map((v: string) => v.toUpperCase())).toThrow(
        'DerivedTemplateState: chained .map() is not supported',
      );
    });

    it('.field() は "chained .map() is not supported" エラーをスローする (Req 2.4 境界)', () => {
      const dts = new DerivedTemplateState<{ text: string }>(parentId, transform);
      expect(() => dts.field('text')).toThrow(
        'DerivedTemplateState: chained .map() is not supported',
      );
    });

    it('.get() は "cannot be called in template context" エラーをスローする', () => {
      const dts = new DerivedTemplateState<string>(parentId, transform);
      expect(() => dts.get()).toThrow('cannot be called in template context');
    });

    it('.subscribe() は "cannot be called in template context" エラーをスローする', () => {
      const dts = new DerivedTemplateState<string>(parentId, transform);
      expect(() => (dts as { subscribe: (fn: unknown) => void }).subscribe(() => {})).toThrow(
        'cannot be called in template context',
      );
    });
  });
});

describe('isDerivedTemplateState', () => {
  const parentId = 's0.itemTemplate';
  const transform = makeExpr('((_v).text)');

  it('DerivedTemplateState インスタンスに対して true を返す (Req 1.1)', () => {
    const dts = new DerivedTemplateState<string>(parentId, transform);
    expect(isDerivedTemplateState(dts)).toBe(true);
  });

  it('通常の StateImpl に対して false を返す (Req 5.1)', () => {
    const registry = new StateRegistry();
    const id = registry.allocateId();
    registry.register({ runtimeId: id, initialExpr: makeExpr('null') });
    const state = new StateImpl<string>(id, registry);
    expect(isDerivedTemplateState(state)).toBe(false);
  });

  it('プリミティブ値に対して false を返す', () => {
    expect(isDerivedTemplateState('hello' as import('../../../../src/js/vanilla/state/state').ReadableState<unknown>)).toBe(false);
    expect(isDerivedTemplateState(null as import('../../../../src/js/vanilla/state/state').ReadableState<unknown>)).toBe(false);
    expect(isDerivedTemplateState(undefined as import('../../../../src/js/vanilla/state/state').ReadableState<unknown>)).toBe(false);
  });

  it('_parentTemplateId を持たない通常オブジェクトに対して false を返す', () => {
    const plain = { _runtimeId: 's0' } as import('../../../../src/js/vanilla/state/state').ReadableState<unknown>;
    expect(isDerivedTemplateState(plain)).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// Task 1.2: TemplateStateImpl<T> / createTemplateState
// ────────────────────────────────────────────────────────────

describe('TemplateStateImpl', () => {
  let registry: StateRegistry;
  let arrayStateId: string;

  beforeEach(() => {
    registry = new StateRegistry();
    arrayStateId = registry.allocateId(); // "s0"
    registry.register({ runtimeId: arrayStateId, initialExpr: makeExpr('[]') });
  });

  describe('constructor and _runtimeId (Req 1.5)', () => {
    it('_runtimeId が "{arrayStateId}.itemTemplate" になる', () => {
      const tsi = new TemplateStateImpl<{ text: string; done: boolean }>(arrayStateId, registry);
      expect(tsi._runtimeId).toBe(`${arrayStateId}.itemTemplate`);
    });

    it('allocateId() を呼ばない（registry の次 ID は変わらない）', () => {
      // allocateId() が呼ばれると "s1" が消費される
      const before = registry.allocateId(); // "s1" を採番
      registry = new StateRegistry();
      arrayStateId = registry.allocateId(); // fresh "s0"
      registry.register({ runtimeId: arrayStateId, initialExpr: makeExpr('[]') });
      // TemplateStateImpl 生成前後で次 allocateId() が "s1" のまま変わらないことを確認
      new TemplateStateImpl<{ text: string }>(arrayStateId, registry);
      const after = registry.allocateId(); // 消費されていなければ "s1"
      expect(before).toBe(after);
    });
  });

  describe('.map(fn) → DerivedTemplateState (Req 1.1, 1.5, 3.1)', () => {
    it('DerivedTemplateState<U> を返す', () => {
      const tsi = new TemplateStateImpl<{ text: string }>(arrayStateId, registry);
      const derived = tsi.map((v) => v.text);
      expect(derived).toBeInstanceOf(DerivedTemplateState);
    });

    it('_runtimeId が "{arrayStateId}.itemTemplate" のまま（新 ID を割り当てない、Req 1.5）', () => {
      const tsi = new TemplateStateImpl<{ text: string }>(arrayStateId, registry);
      const derived = tsi.map((v) => v.text);
      expect(derived._runtimeId).toBe(`${arrayStateId}.itemTemplate`);
    });

    it('_parentTemplateId が "{arrayStateId}.itemTemplate"', () => {
      const tsi = new TemplateStateImpl<{ text: string }>(arrayStateId, registry);
      const derived = tsi.map((v) => v.text);
      expect(derived._parentTemplateId).toBe(`${arrayStateId}.itemTemplate`);
    });

    it('_transform に JsExpr が設定される', () => {
      const tsi = new TemplateStateImpl<{ text: string }>(arrayStateId, registry);
      const derived = tsi.map((v) => v.text);
      expect(derived._transform).toBeDefined();
      expect(derived._transform.__jsExpr).toBe(true);
      expect(typeof derived._transform.code).toBe('string');
    });

    it('transform の code が text フィールドを参照する内容を含む (Req 2.1)', () => {
      const tsi = new TemplateStateImpl<{ text: string }>(arrayStateId, registry);
      const derived = tsi.map((v) => v.text);
      // buildTransformCode は "v => v.text" を "((_v).text)" 相当に変換する
      expect(derived._transform.code).toContain('text');
    });
  });

  describe('.field(key) → DerivedTemplateState (Req 2.1, 2.4, 3.3)', () => {
    it('DerivedTemplateState<T[K]> を返す', () => {
      const tsi = new TemplateStateImpl<{ text: string; done: boolean }>(arrayStateId, registry);
      const derived = tsi.field('text');
      expect(derived).toBeInstanceOf(DerivedTemplateState);
    });

    it('_runtimeId が "{arrayStateId}.itemTemplate"', () => {
      const tsi = new TemplateStateImpl<{ text: string; done: boolean }>(arrayStateId, registry);
      const derived = tsi.field('done');
      expect(derived._runtimeId).toBe(`${arrayStateId}.itemTemplate`);
    });

    it('_parentTemplateId が "{arrayStateId}.itemTemplate"', () => {
      const tsi = new TemplateStateImpl<{ text: string; done: boolean }>(arrayStateId, registry);
      const derived = tsi.field('done');
      expect(derived._parentTemplateId).toBe(`${arrayStateId}.itemTemplate`);
    });

    it('transform の code がフィールド名を含む (Req 2.1)', () => {
      const tsi = new TemplateStateImpl<{ text: string; done: boolean }>(arrayStateId, registry);
      const derived = tsi.field('done');
      expect(derived._transform.code).toContain('done');
    });

    it('.field("text") の transform は .map(v => v.text) と同等の code を生成する (Req 2.1)', () => {
      const tsi1 = new TemplateStateImpl<{ text: string }>(arrayStateId, registry);
      const tsi2 = new TemplateStateImpl<{ text: string }>(arrayStateId, registry);
      const fromMap = tsi1.map((v) => v.text);
      const fromField = tsi2.field('text');
      // 両者の transform code が等価であること（same field access）
      expect(fromField._transform.code).toBe(fromMap._transform.code);
    });
  });

  describe('.get() / .subscribe() throw (Req 3.1, 3.2)', () => {
    it('.get() は "TemplateStateImpl: .get() cannot be called in template context" をスローする', () => {
      const tsi = new TemplateStateImpl<string>(arrayStateId, registry);
      expect(() => tsi.get()).toThrow('TemplateStateImpl: .get() cannot be called in template context');
    });

    it('.subscribe() は "TemplateStateImpl: .subscribe() cannot be called in template context" をスローする', () => {
      const tsi = new TemplateStateImpl<string>(arrayStateId, registry);
      expect(() => (tsi as { subscribe: (fn: unknown) => void }).subscribe(() => {})).toThrow(
        'TemplateStateImpl: .subscribe() cannot be called in template context',
      );
    });
  });
});

describe('isDerivedTemplateState with TemplateStateImpl (Req 1.5)', () => {
  it('TemplateStateImpl インスタンスに対して false を返す（_parentTemplateId を持たない）', () => {
    const registry = new StateRegistry();
    const arrayStateId = registry.allocateId();
    registry.register({ runtimeId: arrayStateId, initialExpr: makeExpr('[]') });
    const tsi = new TemplateStateImpl<string>(arrayStateId, registry);
    expect(isDerivedTemplateState(tsi as import('../../../../src/js/vanilla/state/state').ReadableState<unknown>)).toBe(false);
  });
});

describe('createTemplateState factory', () => {
  it('TemplateStateImpl インスタンスを返す', () => {
    const registry = new StateRegistry();
    const arrayStateId = registry.allocateId();
    registry.register({ runtimeId: arrayStateId, initialExpr: makeExpr('[]') });
    const tsi = createTemplateState<{ text: string }>(arrayStateId, registry);
    expect(tsi).toBeInstanceOf(TemplateStateImpl);
  });

  it('_runtimeId が "{arrayStateId}.itemTemplate"', () => {
    const registry = new StateRegistry();
    const arrayStateId = registry.allocateId();
    registry.register({ runtimeId: arrayStateId, initialExpr: makeExpr('[]') });
    const tsi = createTemplateState<string>(arrayStateId, registry);
    expect(tsi._runtimeId).toBe(`${arrayStateId}.itemTemplate`);
  });
});
