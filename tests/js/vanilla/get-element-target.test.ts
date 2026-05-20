/**
 * `_getElementTarget` の挙動テスト（deferred-target-resolution Task 2.1）。
 *
 * 対応 requirement: 1.1, 1.2, 1.3, 2.1
 * 対応 design.md セクション: `_getElementTarget の挙動変更`
 *
 * 検証観点:
 *   - id 明示要素 → `{ kind: 'sel', selector: '#<id>' }` を返す
 *   - id 不在要素 → `{ kind: 'deferred-self' }` を返す（throw しない）
 *   - 純関数性（同入力同出力、副作用なし）
 */

import { describe, expect, it } from 'vitest';

import { _getElementTarget } from '../../../src/js/vanilla/element-methods.ts';
import type { HasPending } from '../../../src/js/vanilla/element-methods.ts';

// ─── テスト用モックオブジェクト構築 ───────────────────────────────────────────

function makeElWithId(id: string): HasPending {
  return {
    _pending: [],
    _scope: undefined,
    attributes: [{ key: 'id', attributeValue: { type: 'keyValue', value: id } }],
  };
}

function makeElWithoutId(): HasPending {
  return {
    _pending: [],
    _scope: undefined,
    attributes: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Req 2.1: id 明示要素 → { kind: 'sel', selector: '#<id>' }
// ─────────────────────────────────────────────────────────────────────────────

describe('_getElementTarget: id 明示要素の挙動（Req 2.1）', () => {
  it('id を持つ要素は { kind: "sel", selector: "#<id>" } を返す', () => {
    const el = makeElWithId('my-id');
    const result = _getElementTarget(el);
    expect(result).toEqual({ kind: 'sel', selector: '#my-id' });
  });

  it('異なる id 値で selector が正しく構築される', () => {
    const el = makeElWithId('foo-bar');
    const result = _getElementTarget(el);
    expect(result).toEqual({ kind: 'sel', selector: '#foo-bar' });
  });

  it('id ありケースの戻り値は spec 導入前と同じ JSON シリアライズになる', () => {
    const el = makeElWithId('test-elem');
    const result = _getElementTarget(el);
    expect(JSON.stringify(result)).toBe(JSON.stringify({ kind: 'sel', selector: '#test-elem' }));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.1, 1.2, 1.3: id 不在要素 → { kind: 'deferred-self' }（throw しない）
// ─────────────────────────────────────────────────────────────────────────────

describe('_getElementTarget: id 不在要素の挙動（Req 1.1, 1.2, 1.3）', () => {
  it('id を持たない要素は例外を投げない', () => {
    const el = makeElWithoutId();
    expect(() => _getElementTarget(el)).not.toThrow();
  });

  it('id を持たない要素は { kind: "deferred-self" } を返す', () => {
    const el = makeElWithoutId();
    const result = _getElementTarget(el);
    expect(result).toEqual({ kind: 'deferred-self' });
  });

  it('attributes が空でも deferred-self を返す', () => {
    const el: HasPending = {
      _pending: [],
      _scope: undefined,
      attributes: [],
    };
    const result = _getElementTarget(el);
    expect(result).toEqual({ kind: 'deferred-self' });
  });

  it('id 以外の属性のみを持つ要素でも deferred-self を返す', () => {
    const el: HasPending = {
      _pending: [],
      _scope: undefined,
      attributes: [
        { key: 'class', attributeValue: { type: 'keyValue', value: 'some-class' } },
      ],
    };
    const result = _getElementTarget(el);
    expect(result).toEqual({ kind: 'deferred-self' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 純関数性（同入力同出力、副作用なし）
// ─────────────────────────────────────────────────────────────────────────────

describe('_getElementTarget: 純関数性', () => {
  it('同じ id あり要素を複数回呼んでも同一結果を返す', () => {
    const el = makeElWithId('pure-id');
    const result1 = _getElementTarget(el);
    const result2 = _getElementTarget(el);
    expect(result1).toEqual(result2);
  });

  it('同じ id なし要素を複数回呼んでも同一結果を返す', () => {
    const el = makeElWithoutId();
    const result1 = _getElementTarget(el);
    const result2 = _getElementTarget(el);
    expect(result1).toEqual(result2);
  });

  it('_getElementTarget は _pending を変更しない', () => {
    const el = makeElWithoutId();
    const pendingBefore = [...el._pending];
    _getElementTarget(el);
    expect(el._pending).toEqual(pendingBefore);
  });
});
