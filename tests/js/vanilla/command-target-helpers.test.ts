/**
 * CommandWithTarget 型・rewriteCommandTarget・hasCommandTarget 型ガード の単体テスト
 *
 * Task 1.4 の完了条件:
 * (a) target を持たない command 型が CommandWithTarget 集合に含まれない
 * (b) rewriteCommandTarget が variant の型を保ったまま target を書き換える
 * (c) hasCommandTarget が真偽を正しく返す
 *
 * Requirements: 1.4, 4.1, 4.2
 */
import { describe, expect, it } from 'vitest';
import { expectTypeOf } from 'vitest';
import {
  type CommandWithTarget,
  hasCommandTarget,
  rewriteCommandTarget,
  type VanillaCommand,
} from '../../../src/js/vanilla/commands.js';
import type { ElementTarget } from '../../../src/js/vanilla/element-target.js';

// ────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ────────────────────────────────────────────────────────────────────────────

const selTarget: ElementTarget = { kind: 'sel', selector: '#x' };
const deferredTarget: ElementTarget = { kind: 'deferred-self' };
const closureTarget: ElementTarget = { kind: 'closure-ref', varName: '_e0' };

// target を持つ command
const classListAddCmd: VanillaCommand = {
  type: 'classListAdd',
  target: selTarget,
  name: 'foo',
};

// target を持つ command (bind-text)
const bindTextCmd: VanillaCommand = {
  type: 'bind-text',
  target: selTarget,
  stateId: 'myState',
};

// target を持たない command
const domReadyCmd: VanillaCommand = {
  type: 'domReady',
  bodyCode: '',
};

const appendChildCmd: VanillaCommand = {
  type: 'appendChild',
  parent: { kind: 'closure-ref', varName: 'parentEl' },
  child: { kind: 'closure-ref', varName: 'childEl' },
};

const stateInitCmd: VanillaCommand = {
  type: 'state-init',
  id: 'myState',
  initial: { code: '0' },
};

// ────────────────────────────────────────────────────────────────────────────
// (a) CommandWithTarget 型テスト
// ────────────────────────────────────────────────────────────────────────────

describe('CommandWithTarget 型', () => {
  it('target を持つ command 型は CommandWithTarget に含まれる（コンパイル時チェック）', () => {
    // target を持つ command バリアントは CommandWithTarget に代入できる
    const withTarget: CommandWithTarget = classListAddCmd as Extract<
      VanillaCommand,
      { type: 'classListAdd' }
    >;
    expect(withTarget.target).toEqual(selTarget);
  });

  it('target を持つ hasCommandTarget で runtime に集合外判定ができる（domReady は false）', () => {
    // domReady は target を持たないので CommandWithTarget 集合に含まれない
    expect(hasCommandTarget(domReadyCmd)).toBe(false);
  });

  it('appendChild は target を持たないので CommandWithTarget 集合に含まれない', () => {
    expect(hasCommandTarget(appendChildCmd)).toBe(false);
  });

  it('state-init は target を持たないので CommandWithTarget 集合に含まれない', () => {
    expect(hasCommandTarget(stateInitCmd)).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// (c) hasCommandTarget 型ガード
// ────────────────────────────────────────────────────────────────────────────

describe('hasCommandTarget', () => {
  it('target を持つ command（classListAdd）は true を返す', () => {
    expect(hasCommandTarget(classListAddCmd)).toBe(true);
  });

  it('target を持つ command（bind-text）は true を返す', () => {
    expect(hasCommandTarget(bindTextCmd)).toBe(true);
  });

  it('target を持たない command（domReady）は false を返す', () => {
    expect(hasCommandTarget(domReadyCmd)).toBe(false);
  });

  it('target を持たない command（appendChild）は false を返す', () => {
    expect(hasCommandTarget(appendChildCmd)).toBe(false);
  });

  it('target が deferred-self の command は true を返す', () => {
    const cmd: VanillaCommand = {
      type: 'classListAdd',
      target: deferredTarget,
      name: 'bar',
    };
    expect(hasCommandTarget(cmd)).toBe(true);
  });

  it('型ガード後に target プロパティにアクセスできる（型レベル）', () => {
    if (hasCommandTarget(classListAddCmd)) {
      // 型ガード後は cmd.target が ElementTarget として参照できる
      expectTypeOf(classListAddCmd.target).toMatchTypeOf<ElementTarget>();
    }
  });

  it('各 target kind に対してすべて true を返す', () => {
    const withSel: VanillaCommand = { type: 'classListAdd', target: selTarget, name: 'x' };
    const withDeferred: VanillaCommand = { type: 'classListAdd', target: deferredTarget, name: 'x' };
    const withClosure: VanillaCommand = { type: 'classListAdd', target: closureTarget, name: 'x' };

    expect(hasCommandTarget(withSel)).toBe(true);
    expect(hasCommandTarget(withDeferred)).toBe(true);
    expect(hasCommandTarget(withClosure)).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// (b) rewriteCommandTarget
// ────────────────────────────────────────────────────────────────────────────

describe('rewriteCommandTarget', () => {
  it('target フィールドが書き換えられる', () => {
    const newTarget: ElementTarget = { kind: 'sel', selector: '#new' };
    const result = rewriteCommandTarget(classListAddCmd as Extract<VanillaCommand, { type: 'classListAdd' }>, newTarget);
    expect(result.target).toEqual(newTarget);
  });

  it('target 以外のフィールドが保持される', () => {
    const newTarget: ElementTarget = { kind: 'sel', selector: '#new' };
    const cmd = classListAddCmd as Extract<VanillaCommand, { type: 'classListAdd' }>;
    const result = rewriteCommandTarget(cmd, newTarget);
    expect(result.type).toBe('classListAdd');
    expect(result.name).toBe('foo');
  });

  it('返り値の型が具体的な variant 型を維持する（classListAdd）', () => {
    type ClassListAddCmd = Extract<VanillaCommand, { type: 'classListAdd' }>;
    const cmd: ClassListAddCmd = {
      type: 'classListAdd',
      target: selTarget,
      name: 'foo',
    };
    const newTarget: ElementTarget = { kind: 'sel', selector: '#updated' };
    const result = rewriteCommandTarget(cmd, newTarget);

    // 型が ClassListAddCmd に維持されていることをコンパイル時チェック
    expectTypeOf(result).toEqualTypeOf<ClassListAddCmd>();
  });

  it('deferred-self から sel への書き換えが正しく動作する', () => {
    type ClassListAddCmd = Extract<VanillaCommand, { type: 'classListAdd' }>;
    const cmd: ClassListAddCmd = {
      type: 'classListAdd',
      target: deferredTarget,
      name: 'bar',
    };
    const resolvedTarget: ElementTarget = { kind: 'sel', selector: '#auto-generated' };
    const result = rewriteCommandTarget(cmd, resolvedTarget);

    expect(result.target).toEqual(resolvedTarget);
    expect(result.target.kind).toBe('sel');
    expect(result.name).toBe('bar');
  });

  it('返り値の型が bind-text variant を維持する', () => {
    type BindTextCmd = Extract<VanillaCommand, { type: 'bind-text' }>;
    const cmd: BindTextCmd = {
      type: 'bind-text',
      target: deferredTarget,
      stateId: 'counter',
    };
    const newTarget: ElementTarget = { kind: 'sel', selector: '#span1' };
    const result = rewriteCommandTarget(cmd, newTarget);

    expectTypeOf(result).toEqualTypeOf<BindTextCmd>();
    expect(result.stateId).toBe('counter');
    expect(result.target).toEqual(newTarget);
  });

  it('元のオブジェクトは変更されない（immutable）', () => {
    type ClassListAddCmd = Extract<VanillaCommand, { type: 'classListAdd' }>;
    const cmd: ClassListAddCmd = {
      type: 'classListAdd',
      target: selTarget,
      name: 'original',
    };
    const newTarget: ElementTarget = { kind: 'sel', selector: '#new' };
    const result = rewriteCommandTarget(cmd, newTarget);

    // 元のオブジェクトは変更されていない
    expect(cmd.target).toEqual(selTarget);
    // 新しいオブジェクトが返される
    expect(result).not.toBe(cmd);
  });
});
