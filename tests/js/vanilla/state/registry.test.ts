/**
 * StateRegistry のユニットテスト
 *
 * テスト対象:
 * - 採番一意性（"s0", "s1", ...）
 * - 空判定（isEmpty()）
 * - 初期化コマンド生成（listInitCommands()）
 */

import { describe, it, expect } from 'vitest';
import { StateRegistry } from '../../../../src/js/vanilla/state/registry';

describe('StateRegistry', () => {
  describe('allocateId()', () => {
    it('最初の採番は "s0" を返す', () => {
      const registry = new StateRegistry();
      expect(registry.allocateId()).toBe('s0');
    });

    it('2 回目の採番は "s1" を返す', () => {
      const registry = new StateRegistry();
      registry.allocateId(); // s0
      expect(registry.allocateId()).toBe('s1');
    });

    it('採番は連続して一意な ID を返す', () => {
      const registry = new StateRegistry();
      const ids = Array.from({ length: 5 }, () => registry.allocateId());
      expect(ids).toEqual(['s0', 's1', 's2', 's3', 's4']);
    });

    it('異なる StateRegistry インスタンスは独立してカウントする', () => {
      const r1 = new StateRegistry();
      const r2 = new StateRegistry();
      r1.allocateId(); // r1: s0
      r1.allocateId(); // r1: s1
      expect(r1.allocateId()).toBe('s2');
      expect(r2.allocateId()).toBe('s0'); // r2 は独立
    });
  });

  describe('register() と entries', () => {
    it('register() でエントリを追加できる', () => {
      const registry = new StateRegistry();
      registry.register({ runtimeId: 's0', initialExpr: { __jsExpr: true, code: '0', eq: () => { throw new Error(); }, ne: () => { throw new Error(); }, or: () => { throw new Error(); }, trim: () => { throw new Error(); }, isFalsy: () => { throw new Error(); }, isTruthy: () => { throw new Error(); } } });
      expect(registry.entries.size).toBe(1);
      expect(registry.entries.has('s0')).toBe(true);
    });

    it('複数のエントリを register() できる', () => {
      const registry = new StateRegistry();
      const makeExpr = (code: string) => ({
        __jsExpr: true as const,
        code,
        eq: () => { throw new Error(); },
        ne: () => { throw new Error(); },
        or: () => { throw new Error(); },
        trim: () => { throw new Error(); },
        isFalsy: () => { throw new Error(); },
        isTruthy: () => { throw new Error(); },
      });
      registry.register({ runtimeId: 's0', initialExpr: makeExpr('0') });
      registry.register({ runtimeId: 's1', initialExpr: makeExpr('"hello"') });
      expect(registry.entries.size).toBe(2);
    });
  });

  describe('isEmpty()', () => {
    it('エントリが 0 件のとき true を返す', () => {
      const registry = new StateRegistry();
      expect(registry.isEmpty()).toBe(true);
    });

    it('エントリが 1 件以上あるとき false を返す', () => {
      const registry = new StateRegistry();
      const makeExpr = (code: string) => ({
        __jsExpr: true as const,
        code,
        eq: () => { throw new Error(); },
        ne: () => { throw new Error(); },
        or: () => { throw new Error(); },
        trim: () => { throw new Error(); },
        isFalsy: () => { throw new Error(); },
        isTruthy: () => { throw new Error(); },
      });
      registry.register({ runtimeId: 's0', initialExpr: makeExpr('42') });
      expect(registry.isEmpty()).toBe(false);
    });
  });

  describe('listInitCommands()', () => {
    it('エントリが 0 件のとき空配列を返す', () => {
      const registry = new StateRegistry();
      expect(registry.listInitCommands()).toEqual([]);
    });

    it('各エントリに対して state-init コマンドを返す', () => {
      const registry = new StateRegistry();
      const makeExpr = (code: string) => ({
        __jsExpr: true as const,
        code,
        eq: () => { throw new Error(); },
        ne: () => { throw new Error(); },
        or: () => { throw new Error(); },
        trim: () => { throw new Error(); },
        isFalsy: () => { throw new Error(); },
        isTruthy: () => { throw new Error(); },
      });
      const expr0 = makeExpr('0');
      const expr1 = makeExpr('"hello"');
      registry.register({ runtimeId: 's0', initialExpr: expr0 });
      registry.register({ runtimeId: 's1', initialExpr: expr1 });

      const cmds = registry.listInitCommands();
      expect(cmds).toHaveLength(2);
      expect(cmds[0]).toEqual({ type: 'state-init', id: 's0', initial: expr0 });
      expect(cmds[1]).toEqual({ type: 'state-init', id: 's1', initial: expr1 });
    });

    it('state-init コマンドの type は "state-init" である', () => {
      const registry = new StateRegistry();
      const expr = {
        __jsExpr: true as const,
        code: 'true',
        eq: () => { throw new Error(); },
        ne: () => { throw new Error(); },
        or: () => { throw new Error(); },
        trim: () => { throw new Error(); },
        isFalsy: () => { throw new Error(); },
        isTruthy: () => { throw new Error(); },
      };
      registry.register({ runtimeId: 's0', initialExpr: expr });
      const [cmd] = registry.listInitCommands();
      expect(cmd?.type).toBe('state-init');
    });

    it('state-init コマンドの id と initial が正しく設定される', () => {
      const registry = new StateRegistry();
      const expr = {
        __jsExpr: true as const,
        code: '100',
        eq: () => { throw new Error(); },
        ne: () => { throw new Error(); },
        or: () => { throw new Error(); },
        trim: () => { throw new Error(); },
        isFalsy: () => { throw new Error(); },
        isTruthy: () => { throw new Error(); },
      };
      registry.register({ runtimeId: 's0', initialExpr: expr });
      const [cmd] = registry.listInitCommands();
      expect(cmd?.id).toBe('s0');
      expect(cmd?.initial).toBe(expr);
    });

    it('エントリの登録順でコマンドが返される', () => {
      const registry = new StateRegistry();
      const makeExpr = (code: string) => ({
        __jsExpr: true as const,
        code,
        eq: () => { throw new Error(); },
        ne: () => { throw new Error(); },
        or: () => { throw new Error(); },
        trim: () => { throw new Error(); },
        isFalsy: () => { throw new Error(); },
        isTruthy: () => { throw new Error(); },
      });
      registry.register({ runtimeId: 's0', initialExpr: makeExpr('1') });
      registry.register({ runtimeId: 's1', initialExpr: makeExpr('2') });
      registry.register({ runtimeId: 's2', initialExpr: makeExpr('3') });

      const cmds = registry.listInitCommands();
      expect(cmds.map(c => c.id)).toEqual(['s0', 's1', 's2']);
    });
  });
});
