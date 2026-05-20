/**
 * `ScriptScope.state<T>(ref)` と `ScriptStateHandle<T>` の振る舞いテスト（Task 4.2）。
 *
 * 対応 requirement: 6.1, 6.2, 6.3
 * 対応 design.md セクション: 「ScriptScope.state / ScriptStateHandle<T>」
 *
 * 検証観点:
 *   1. `s.state(count).set(5)` が `state-set` コマンドを scope に _append する
 *   2. `s.state(count).set(jsExpr)` が JsExpr の code を value として使う
 *   3. `s.state(count).update(body)` が `state-update` コマンドを _append する
 *   4. `s.state(count).get()` が `__draftole__.state(id).get()` 形式の JsExpr を返す
 *   5. `s.state(count).field(key)` が別キーで ScriptStateHandle を返す
 */

import { describe, expect, it } from 'vitest';

import { createScriptScope } from '../../../src/js/vanilla/script-scope.ts';
import { createVanillaScript } from '../../../src/js/vanilla/vanilla-script-builder.ts';
import type { VanillaCommand } from '../../../src/js/vanilla/commands.ts';
import { StateImpl } from '../../../src/js/vanilla/state/state.ts';
import { StateRegistry } from '../../../src/js/vanilla/state/registry.ts';

describe('ScriptScope.state / ScriptStateHandle (Task 4.2)', () => {
  it('Req 6.1, 6.2: s.state(count).set(5) appends a state-set command', () => {
    const builder = createVanillaScript();
    const scope = createScriptScope(builder);

    const registry = new StateRegistry();
    const count = new StateImpl<number>('s0', registry);

    scope.state(count).set(5);

    const js = builder.render();
    // state-set コマンドが __draftole__.state("s0").set(5); に変換される
    expect(js).toContain('__draftole__.state("s0").set(5)');
  });

  it('Req 6.2: s.state(count).set(jsExpr) uses the expr code verbatim', () => {
    const builder = createVanillaScript();
    const scope = createScriptScope(builder);

    const registry = new StateRegistry();
    const count = new StateImpl<number>('s0', registry);

    const expr = count.get(); // __draftole__.state('s0').get()
    scope.state(count).set(expr);

    const js = builder.render();
    expect(js).toContain('__draftole__.state("s0").set(');
    expect(js).toContain(expr.code);
  });

  it('Req 6.2: s.state(count).update(body) appends a state-update command', () => {
    const builder = createVanillaScript();
    const scope = createScriptScope(builder);

    const registry = new StateRegistry();
    const count = new StateImpl<number>('s0', registry);

    const body = { __jsExpr: true as const, code: 'v => v + 1', eq: () => { throw 0; }, ne: () => { throw 0; }, or: () => { throw 0; }, trim: () => { throw 0; }, isFalsy: () => { throw 0; }, isTruthy: () => { throw 0; } };
    scope.state(count).update(body);

    const js = builder.render();
    expect(js).toContain('__draftole__.state("s0").update(v => v + 1)');
  });

  it('Req 6.1: s.state(count).get() returns a JsExpr with runtime API call', () => {
    const builder = createVanillaScript();
    const scope = createScriptScope(builder);

    const registry = new StateRegistry();
    const count = new StateImpl<number>('s0', registry);

    const handle = scope.state(count);
    const expr = handle.get();

    expect(expr.code).toBe("__draftole__.state('s0').get()");
  });

  it('Req 6.1: s.state(obj).field(key).set(v) appends state-set with field-derived id', () => {
    const builder = createVanillaScript();
    const scope = createScriptScope(builder);

    const registry = new StateRegistry();
    const obj = new StateImpl<{ done: boolean }>('s1', registry);

    // field('done') は新しい ScriptStateHandle を返す
    scope.state(obj).field('done').set(true);

    const js = builder.render();
    // field 派生は s1 の子 state ID を使う
    expect(js).toContain('__draftole__.state(');
    expect(js).toContain('.set(true)');
  });

  it('Req 6.2: state-set command structure uses type discriminant', () => {
    const builder = createVanillaScript();
    const scope = createScriptScope(builder);

    const registry = new StateRegistry();
    const count = new StateImpl<number>('c0', registry);

    // 直接 _append を検証するため、内部コマンドをキャプチャする
    const captured: VanillaCommand[] = [];
    const origAppend = builder.append.bind(builder);
    builder.append = (cmd: VanillaCommand) => {
      captured.push(cmd);
      origAppend(cmd);
    };

    scope.state(count).set(42);

    const stateSetCmd = captured.find(c => c.type === 'state-set');
    expect(stateSetCmd).toBeDefined();
    expect(stateSetCmd?.type).toBe('state-set');
    if (stateSetCmd?.type === 'state-set') {
      expect(stateSetCmd.id).toBe('c0');
      expect(stateSetCmd.value.code).toBe('42');
    }
  });
});
