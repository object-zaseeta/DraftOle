/**
 * root-state.test.ts
 *
 * Task 2.4: Root.state<T>() メソッドの受け入れテスト
 *
 * Req 1.1: root.state<T>(initial) を呼び出すと一意な状態 ID を採番した State<T> を返す
 * Req 1.3: 同一 Root から複数回呼び出すと異なる状態 ID を採番
 */

import { describe, it, expect } from 'vitest';
import { Root } from '../../../../src/html/elements/root.js';

describe('Root.state<T>()', () => {
  it('Req 1.1: State<T> オブジェクトを返す', () => {
    const root = new Root();
    const s = root.state(0);

    // State インタフェースのメソッドが存在する
    expect(s).toBeDefined();
    expect(typeof s.get).toBe('function');
    expect(typeof s.set).toBe('function');
    expect(typeof s.update).toBe('function');
    expect(typeof s.map).toBe('function');
  });

  it('Req 1.1: _runtimeId が "s0" で始まる', () => {
    const root = new Root();
    const s = root.state(0);

    expect(s._runtimeId).toBe('s0');
  });

  it('Req 1.1: get() が JsExpr を返す', () => {
    const root = new Root();
    const s = root.state(42);

    const expr = s.get();
    expect(expr).toBeDefined();
    expect(expr.__jsExpr).toBe(true);
    expect(typeof expr.code).toBe('string');
    expect(expr.code).toContain('s0');
  });

  it('Req 1.3: 同一 Root から複数宣言すると ID が一意', () => {
    const root = new Root();
    const s0 = root.state(0);
    const s1 = root.state('hello');
    const s2 = root.state({ x: 1 });

    expect(s0._runtimeId).toBe('s0');
    expect(s1._runtimeId).toBe('s1');
    expect(s2._runtimeId).toBe('s2');

    // すべて異なる
    const ids = [s0._runtimeId, s1._runtimeId, s2._runtimeId];
    expect(new Set(ids).size).toBe(3);
  });

  it('Req 1.3: 別の Root インスタンスでは ID が独立してリセットされる', () => {
    const root1 = new Root();
    const root2 = new Root();

    const s1 = root1.state(10);
    const s2 = root2.state(20);

    // 同じ ID でも別 Root なので衝突はない（各 Root が独立したレジストリを持つ）
    expect(s1._runtimeId).toBe('s0');
    expect(s2._runtimeId).toBe('s0');
  });

  it('StateRegistry に登録される（_stateRegistry アクセス）', () => {
    const root = new Root();
    root.state(0);

    const registry = (root as { _stateRegistry: unknown })._stateRegistry;
    expect(registry).toBeDefined();
  });

  it('初期値が JSON.stringify でエンコードされた initialExpr として登録される', () => {
    const root = new Root();
    root.state(42);

    const registry = (root as { _stateRegistry: { entries: Map<string, { initialExpr: { code: string } }> } })._stateRegistry;
    const entry = registry.entries.get('s0');
    expect(entry).toBeDefined();
    expect(entry!.initialExpr.code).toBe('42');
  });

  it('文字列初期値が正しくエンコードされる', () => {
    const root = new Root();
    root.state('hello');

    const registry = (root as { _stateRegistry: { entries: Map<string, { initialExpr: { code: string } }> } })._stateRegistry;
    const entry = registry.entries.get('s0');
    expect(entry).toBeDefined();
    expect(entry!.initialExpr.code).toBe('"hello"');
  });
});
