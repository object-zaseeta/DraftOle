/**
 * `src/js/vanilla/tree-api.ts` の振る舞いテスト（Task 4.4）。
 *
 * 対応 requirement: 5.1, 5.2, 5.3, 6.2
 * 対応 design.md セクション: 「tree-api: appendChild / remove / removeAll」
 */

import { describe, expect, it } from 'vitest';

import { query, queryAll } from '../../../src/js/vanilla/query-api.ts';
import { appendChild, remove, removeAll } from '../../../src/js/vanilla/tree-api.ts';
import { createVanillaScript } from '../../../src/js/vanilla/vanilla-script-builder.ts';

describe('appendChild(scope, parent, child) (Req 5.1)', () => {
  it('emits parent.appendChild(child) when child is an ElementRef', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const parent = query(s, '#list');
      const child = query(s, '#item');
      appendChild(s, parent, child);
    });
    const out = script.render();
    expect(out).toContain(
      'document.querySelector("#list").appendChild(document.querySelector("#item"));',
    );
  });

  it('accepts a JsExpr (function call result) as child (Req 6.2)', () => {
    const script = createVanillaScript();
    script.fn('addTodo', (s) => {
      const parent = query(s, '#todo-list');
      // `scope.call()` は ScopeExpr を返すが、これは `{ code }` を持つため JsExpr と構造互換。
      // ただし `scope.call()` は `expr` 命令を append してしまう副作用がある。
      // そのため、副作用のない `scope.raw()` で等価な JsExpr を構築して child に渡す。
      const expr = s.raw('createTodoItem(text)');
      appendChild(s, parent, expr);
    });
    const out = script.render();
    expect(out).toContain(
      'document.querySelector("#todo-list").appendChild(createTodoItem(text));',
    );
  });
});

describe('remove(scope, el) (Req 5.2)', () => {
  it('emits el.remove() for a single element', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = query(s, '#doomed');
      remove(s, el);
    });
    const out = script.render();
    expect(out).toContain('document.querySelector("#doomed").remove();');
  });
});

describe('removeAll(scope, list) (Req 5.3)', () => {
  it('emits a forEach that calls .remove() on each item', () => {
    const script = createVanillaScript();
    script.fn('clearDone', (s) => {
      removeAll(s, queryAll(s, '.done'));
    });
    const out = script.render();
    expect(out).toContain('document.querySelectorAll(".done").forEach((item) => {');
    expect(out).toContain('item.remove();');
  });

  it('output contains no jQuery / $ tokens (Req 1.5 / 7.1 sanity)', () => {
    const script = createVanillaScript();
    script.fn('clearDone', (s) => {
      removeAll(s, queryAll(s, '.done'));
    });
    const out = script.render();
    expect(out).not.toMatch(/\bjQuery\b/);
    expect(out).not.toMatch(/\$\(/);
  });
});
