/**
 * Task 2.1 (unified-element-api): `HtmlTag` への `_pending` / `_scope` 初期状態テスト。
 *
 * 遅延解決モデル（design.md「遅延解決モデル / PendingBuffer」節）の構造的基盤として、
 * `HtmlTag` インスタンスは生成直後に以下の状態を持たねばならない:
 *   - `_pending: VanillaCommand[]` が空配列で初期化されている
 *   - `_scope: VanillaScope | undefined` が `undefined` で初期化されている
 *
 * Requirements: 1.6, 1.7
 * Design: 遅延解決モデル / PendingBuffer + FlushOrchestrator
 *
 * 注意: `_pending` / `_scope` は実装上 private フィールドのため、テスト専用の
 * internal アクセスパターン（unknown 経由キャスト）で読み取る。
 */
import { describe, it, expect } from 'vitest';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import type { TagType } from '../../../src/html/tags/tag-type.js';
import type { VanillaCommand } from '../../../src/js/vanilla/commands.js';
import type { VanillaScope } from '../../../src/js/vanilla/vanilla-script-builder.js';

/** テスト用の具象サブクラス（`HtmlTag` は abstract なため） */
class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

/** 内部フィールドへの test-only アクセスのための型 */
type PendingState = {
  _pending: VanillaCommand[];
  _scope: VanillaScope | undefined;
};

const internals = (tag: HtmlTag): PendingState =>
  tag as PendingState;

describe('HtmlTag: _pending / _scope 初期状態 (Task 2.1)', () => {
  it('生成直後の `_pending` は空配列である', () => {
    const tag = new TestTag();
    const state = internals(tag);
    expect(Array.isArray(state._pending)).toBe(true);
    expect(state._pending).toEqual([]);
    expect(state._pending.length).toBe(0);
  });

  it('生成直後の `_scope` は undefined である', () => {
    const tag = new TestTag();
    const state = internals(tag);
    expect(state._scope).toBeUndefined();
  });

  it('各インスタンスは独立した `_pending` 配列を持つ（共有参照ではない）', () => {
    const a = new TestTag('div');
    const b = new TestTag('span');
    const sa = internals(a);
    const sb = internals(b);
    expect(sa._pending).not.toBe(sb._pending);
  });
});
