/**
 * `src/js/vanilla/selector-ref.ts` の `CollectionRef` 振る舞いテスト（Task 3.4）。
 *
 * 対応 requirement: 2.2, 2.3
 * 対応 design.md セクション: 「SelectorRef / CollectionRef」
 *
 * 検証観点:
 *   - CollectionRef.length が JsExpr を返す（Req 2.3）
 *   - CollectionRef.removeAll() が forEach+remove の JS を生成する（Req 2.3）
 *   - CollectionRef.filterNot() がフィルタ済みコレクションを返す（Req 2.3）
 *   - CollectionRef.forEach() が forEach コマンドを生成する（Req 2.3）
 *   - filterNot(...).removeAll() がチェーン可能（Req 2.3）
 */

import { describe, expect, it } from 'vitest';

import { renderCommand, type VanillaCommand } from '../../../src/js/vanilla/commands.ts';
import { _makeScopedElementListRef } from '../../../src/js/vanilla/element-ref.ts';
import type { ScriptScope } from '../../../src/js/vanilla/script-scope.ts';
import { createCollectionRef } from '../../../src/js/vanilla/selector-ref.ts';
import type { VanillaScope } from '../../../src/js/vanilla/vanilla-script-builder.ts';

// ─────────────────────────────────────────────────────────────────────────────
// テスト準備
// ─────────────────────────────────────────────────────────────────────────────

function createTestScope(): VanillaScope & { captured: VanillaCommand[] } {
  const captured: VanillaCommand[] = [];
  return {
    captured,
    _append(cmd) {
      captured.push(cmd);
    },
    _childScope(queue) {
      const captured2: VanillaCommand[] = queue as VanillaCommand[];
      return {
        captured: captured2,
        _append(cmd) {
          queue.push(cmd);
        },
        _childScope(q2) {
          return createTestScope()._childScope(q2);
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
          /* not used */
        },
      };
    },
    raw(code) {
      return { code };
    },
    let(name, value) {
      captured.push({ type: 'declareConst', name, expr: value.code });
      return { code: name };
    },
    call(name, args) {
      const argList = (args ?? []).map((a) => a.code).join(', ');
      const code = `${name}(${argList})`;
      captured.push({ type: 'expr', code });
      return { code };
    },
    return() {
      captured.push({ type: 'raw', code: 'return;' });
    },
    ifThen() {
      /* not used */
    },
  };
}

const LIST_EXPR = 'document.querySelectorAll(".items")';

function makeListRef() {
  return _makeScopedElementListRef<HTMLElement>('listSelector', LIST_EXPR);
}

// ─────────────────────────────────────────────────────────────────────────────
// length（Req 2.3）
// ─────────────────────────────────────────────────────────────────────────────

describe('length（Req 2.3）', () => {
  it('JsExpr を返す（code は list.code + .length）', () => {
    const scope = createTestScope();
    const coll = createCollectionRef(scope, makeListRef());

    expect(coll.length.__jsExpr).toBe(true);
    expect(coll.length.code).toBe(`${LIST_EXPR}.length`);
  });

  it('length 参照で scope にコマンドを追加しない', () => {
    const scope = createTestScope();
    const coll = createCollectionRef(scope, makeListRef());
    void coll.length; // アクセスのみ

    expect(scope.captured).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// removeAll（Req 2.3）
// ─────────────────────────────────────────────────────────────────────────────

describe('removeAll（Req 2.3）', () => {
  it('forEach コマンド（item.remove() 本体）を scope に追加する', () => {
    const scope = createTestScope();
    const coll = createCollectionRef(scope, makeListRef());
    coll.removeAll();

    expect(scope.captured).toHaveLength(1);
    const cmd = scope.captured[0] as Extract<VanillaCommand, { type: 'forEach' }>;
    expect(cmd.type).toBe('forEach');
    expect(cmd.listExpr).toBe(LIST_EXPR);
    expect(cmd.itemVar).toBe('item');
    expect(cmd.bodyCode).toContain('item.remove()');
  });

  it('生成 JS が item.remove() を含む', () => {
    const scope = createTestScope();
    const coll = createCollectionRef(scope, makeListRef());
    coll.removeAll();

    const js = renderCommand(scope.captured[0]);
    expect(js).toContain('.forEach(');
    expect(js).toContain('item.remove()');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// filterNot（Req 2.3）
// ─────────────────────────────────────────────────────────────────────────────

describe('filterNot（Req 2.3）', () => {
  it('フィルタ済みの CollectionRef を返す（scope にコマンドを追加しない）', () => {
    const scope = createTestScope();
    const coll = createCollectionRef(scope, makeListRef());
    const filtered = coll.filterNot((ref) => ref.containsClass('done'));

    expect(scope.captured).toHaveLength(0);
    expect(filtered.length.code).toContain('filter(');
    expect(filtered.length.code).toContain('classList.contains');
  });

  it('filterNot の述語で ref.containsClass を使うとフィルタコードに反映される', () => {
    const scope = createTestScope();
    const coll = createCollectionRef(scope, makeListRef());
    const filtered = coll.filterNot((ref) => ref.containsClass('done'));

    expect(filtered.length.code).toBe(
      `Array.from(${LIST_EXPR}).filter((x) => !(x.classList.contains("done"))).length`,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// filterNot().removeAll() チェーン（Req 2.3）
// ─────────────────────────────────────────────────────────────────────────────

describe('filterNot().removeAll() チェーン（Req 2.3）', () => {
  it('フィルタ済みリストの各要素を remove する forEach コマンドを生成する', () => {
    const scope = createTestScope();
    const coll = createCollectionRef(scope, makeListRef());
    coll.filterNot((ref) => ref.containsClass('done')).removeAll();

    expect(scope.captured).toHaveLength(1);
    const cmd = scope.captured[0] as Extract<VanillaCommand, { type: 'forEach' }>;
    expect(cmd.type).toBe('forEach');
    expect(cmd.listExpr).toContain('filter(');
    expect(cmd.bodyCode).toContain('item.remove()');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// forEach（Req 2.3）
// ─────────────────────────────────────────────────────────────────────────────

describe('forEach（Req 2.3）', () => {
  it('forEach コマンドを scope に追加する', () => {
    const scope = createTestScope();
    const coll = createCollectionRef(scope, makeListRef());
    coll.forEach((_ref, s: ScriptScope) => {
      s.call('process');
    });

    expect(scope.captured).toHaveLength(1);
    const cmd = scope.captured[0] as Extract<VanillaCommand, { type: 'forEach' }>;
    expect(cmd.type).toBe('forEach');
    expect(cmd.listExpr).toBe(LIST_EXPR);
    expect(cmd.bodyCode).toContain('process()');
  });

  it('forEach コールバックで受け取る ref は SelectorRef として操作できる', () => {
    const scope = createTestScope();
    const coll = createCollectionRef(scope, makeListRef());
    coll.forEach((ref, _s: ScriptScope) => {
      ref.addClass('highlight');
    });

    const cmd = scope.captured[0] as Extract<VanillaCommand, { type: 'forEach' }>;
    expect(cmd.bodyCode).toContain('classList.add');
    expect(cmd.bodyCode).toContain('"highlight"');
  });
});
