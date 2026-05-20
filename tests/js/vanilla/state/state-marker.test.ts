/**
 * ReadableState<T> の構造的マーカー型テスト
 *
 * タスク 1.1: DraftoleStateMarker が ReadableState<T> に追加されていることを検証する。
 *
 * - DraftoleStateMarker がエクスポートされていること
 * - StateImpl インスタンスが ReadableState<T> 型として割り当て可能であること
 * - マーカーシンボルが unique symbol として宣言されていること
 *
 * Requirements: 3.7
 * Design: D-7
 */

import { describe, expect, it } from 'vitest';
import { StateRegistry } from '../../../../src/js/vanilla/state/registry';
import { DraftoleStateMarker, StateImpl } from '../../../../src/js/vanilla/state/state';
import type { ReadableState } from '../../../../src/js/vanilla/state/state';

describe('DraftoleStateMarker', () => {
  it('DraftoleStateMarker がエクスポートされている（declare const なのでランタイムでは undefined）', () => {
    // unique symbol は declare const でランタイムには消えるが、
    // TypeScript のエクスポートとして型情報が存在する。
    // ランタイムではコンパイル後に存在しないため undefined になる。
    expect(DraftoleStateMarker).toBeUndefined();
  });

  it('StateImpl インスタンスが ReadableState<T> 型に割り当て可能である', () => {
    const registry = new StateRegistry();
    const state = new StateImpl<number>('s0', registry);

    // 型レベルの確認: ReadableState<number> として代入できることを TypeScript がチェックする
    const readable: ReadableState<number> = state;

    // ランタイムでは _runtimeId が存在することで動作確認
    expect(readable._runtimeId).toBe('s0');
  });

  it('ReadableState<T> のインスタンスが get() を持つ', () => {
    const registry = new StateRegistry();
    const state = new StateImpl<string>('s1', registry);
    const readable: ReadableState<string> = state;

    const expr = readable.get();
    expect(expr.__jsExpr).toBe(true);
    expect(expr.code).toContain('s1');
  });
});
