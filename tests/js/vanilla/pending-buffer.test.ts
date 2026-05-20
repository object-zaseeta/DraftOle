/**
 * `src/js/vanilla/pending-buffer.ts` の振る舞いテスト（Task 2.2）。
 *
 * 対応 requirement: 1.6, 1.7, 1.8 (unified-element-api)
 * 対応 design.md セクション: 「遅延解決モデル」「PendingBuffer + FlushOrchestrator」
 *
 * 検証観点:
 *   1. `addChild` 前にバッファへ積まれたコマンドが、`flush` 時に scope に渡る
 *   2. `flush` 後の要素に対するコマンドは即時 scope に流れる（バッファを経由しない）
 *   3. `flush` されずに破棄された要素のバッファコマンドは出力に含まれない
 *   追加: 二重登録ガード / 子要素への再帰フラッシュ
 */

import { describe, expect, it } from 'vitest';

import { PairType } from '../../../src/html/elements/pair-type.ts';
import { renderCommand, type VanillaCommand } from '../../../src/js/vanilla/commands.ts';
import { FlushOrchestrator } from '../../../src/js/vanilla/pending-buffer.ts';
import type { VanillaScope } from '../../../src/js/vanilla/vanilla-script-builder.ts';

function makeElement(): PairType {
  return new PairType('div');
}

function cmdExpr(code: string): VanillaCommand {
  return { type: 'expr', code };
}

/**
 * テスト用 VanillaScope: `_append` された VanillaCommand を内部 queue に蓄積し、
 * render() で連結 JS 文字列として観測可能にする最小実装。
 *
 * FlushOrchestrator.flush(el, scope) の観測境界は「scope の _append に
 * バッファ済みコマンドが届くこと」であり、builder 相当の top-level/DOMReady
 * 合流経路はこのテストの関心ではない。
 */
interface TestScope extends VanillaScope {
  render(): string;
}

function createTestScope(): TestScope {
  const queue: VanillaCommand[] = [];
  const scope: TestScope = {
    _append(cmd) {
      queue.push(cmd);
    },
    _childScope() {
      return createTestScope();
    },
    raw(code) {
      return { code };
    },
    let(name, value) {
      queue.push({ type: 'declareConst', name, expr: value.code });
      return { code: name };
    },
    call(name, args) {
      const argList = (args ?? []).map((a) => a.code).join(', ');
      const code = `${name}(${argList})`;
      queue.push({ type: 'expr', code });
      return { code };
    },
    return() {
      queue.push({ type: 'raw', code: 'return;' });
    },
    ifThen() {
      /* not used in these tests */
    },
    render() {
      return queue.map(renderCommand).join('\n');
    },
  };
  return scope;
}

describe('FlushOrchestrator.flush (Requirement 1.6)', () => {
  it('バッファ済みコマンドが flush 時に scope へ転送される', () => {
    const el = makeElement();
    el._pending.push(cmdExpr('a()'));
    el._pending.push(cmdExpr('b()'));

    const scope = createTestScope();
    FlushOrchestrator.flush(el, scope);

    const output = scope.render();
    expect(output).toContain('a();');
    expect(output).toContain('b();');
    expect(el._pending).toEqual([]);
    expect(el._scope).toBe(scope);
  });
});

describe('post-flush 即時追記 (Requirement 1.7)', () => {
  it('flush 後にプッシュされたコマンドは _scope._append 経由で即時出力される', () => {
    const el = makeElement();
    const scope = createTestScope();
    FlushOrchestrator.flush(el, scope);

    expect(el._scope).toBeDefined();
    const bound = el._scope as VanillaScope;
    bound._append(cmdExpr('late()'));

    expect(scope.render()).toContain('late();');
    expect(el._pending).toEqual([]);
  });
});

describe('未登録要素の破棄 (Requirement 1.8)', () => {
  it('flush されていない要素のバッファ済みコマンドは script 出力に含まれない', () => {
    const discarded = makeElement();
    discarded._pending.push(cmdExpr('discarded()'));

    const registered = makeElement();
    registered._pending.push(cmdExpr('kept()'));

    const scope = createTestScope();
    FlushOrchestrator.flush(registered, scope);

    const output = scope.render();
    expect(output).toContain('kept();');
    expect(output).not.toContain('discarded()');
  });
});

describe('二重登録ガード', () => {
  it('同じ要素を 2 回 flush してもコマンドが二重出力されない', () => {
    const el = makeElement();
    el._pending.push(cmdExpr('once()'));

    const scope = createTestScope();
    FlushOrchestrator.flush(el, scope);
    FlushOrchestrator.flush(el, scope);

    const output = scope.render();
    const occurrences = output.split('once();').length - 1;
    expect(occurrences).toBe(1);
  });

  it('既にフラッシュ済みの要素に別 scope を渡しても上書きしない', () => {
    const el = makeElement();
    const firstScope = createTestScope();
    FlushOrchestrator.flush(el, firstScope);

    const secondScope = createTestScope();
    FlushOrchestrator.flush(el, secondScope);

    expect(el._scope).toBe(firstScope);
  });
});

describe('子要素への再帰フラッシュ', () => {
  it('親 flush 時に HtmlTag 型の子要素も再帰的にフラッシュされる', () => {
    const parent = makeElement();
    const child = makeElement();
    parent.addChild(child);

    child._pending.push(cmdExpr('childCmd()'));
    parent._pending.push(cmdExpr('parentCmd()'));

    const scope = createTestScope();
    FlushOrchestrator.flush(parent, scope);

    const output = scope.render();
    expect(output).toContain('parentCmd();');
    expect(output).toContain('childCmd();');
    expect(child._pending).toEqual([]);
    expect(child._scope).toBe(scope);
  });

  it('非 HtmlTag の子（テキスト等）はスキップされ、例外を投げない', () => {
    const parent = makeElement();
    const textLike = { tagType: 'text', protoRender: () => '' };
    (parent as { _children: unknown[] })._children.push(textLike);

    parent._pending.push(cmdExpr('p()'));
    const scope = createTestScope();
    expect(() => FlushOrchestrator.flush(parent, scope)).not.toThrow();
    expect(scope.render()).toContain('p();');
  });
});
