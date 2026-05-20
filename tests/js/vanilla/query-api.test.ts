/**
 * `src/js/vanilla/query-api.ts` の振る舞いテスト（Task 4.2）。
 *
 * 対応 requirement: 2.1, 2.2, 2.3, 2.4
 * 対応 design.md セクション: 「query-api」「element-ref: ElementRef.cache」
 */

import { describe, expect, it } from 'vitest';

import { ref } from '../../../src/js/vanilla/element-ref.ts';
import {
  filterNot,
  forEach,
  length,
  query,
  queryAll,
} from '../../../src/js/vanilla/internal/index.js';
import { createVanillaScript } from '../../../src/js/vanilla/vanilla-script-builder.ts';

describe('query(scope, selector) (Req 2.1)', () => {
  it('returns a kind: "selector" ElementRef with JSON.stringify-quoted selector', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const r = query(s, '#a .b');
      expect(r.__ref).toBe(true);
      expect(r.kind).toBe('selector');
      expect(r.code).toBe('document.querySelector("#a .b")');
    });
  });

  it('throws on empty selector', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      expect(() => query(s, '')).toThrow(Error);
    });
  });
});

describe('queryAll(scope, selector) (Req 2.2)', () => {
  it('returns a kind: "listSelector" ElementListRef with quoted selector', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const list = queryAll(s, '.done');
      expect(list.__listRef).toBe(true);
      expect(list.kind).toBe('listSelector');
      expect(list.code).toBe('document.querySelectorAll(".done")');
    });
  });

  it('throws on empty selector', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      expect(() => queryAll(s, '')).toThrow(Error);
    });
  });
});

describe('forEach(scope, list, body) (Req 2.3 side-effect)', () => {
  it('emits a forEach command binding "item" in child scope', () => {
    const script = createVanillaScript();
    script.fn('removeAll', (s) => {
      const list = queryAll(s, '.done');
      forEach(s, list, (inner, item) => {
        inner._append({ type: 'remove', target: { kind: 'closure-ref', varName: item.code } });
      });
    });
    const out = script.render();
    expect(out).toContain(
      'document.querySelectorAll(".done").forEach((item) => {',
    );
    expect(out).toContain('item.remove();');
  });
});

describe('filterNot(list, predicate) / length(list) (Req 2.3 value)', () => {
  it('composes Array.from(...).filter((x) => !<pred>).length via ElementRef.containsClass', () => {
    const script = createVanillaScript();
    // design.md observable: queryAll("#a .b").filterNot(it => it.containsClass("done")).length.code
    // === Array.from(document.querySelectorAll("#a .b")).filter(x => !x.classList.contains("done")).length
    script.fn('count', (s) => {
      const list = queryAll(s, '#a .b');
      const remaining = filterNot(list, (it) => it.containsClass('done'));
      const countExpr = length(remaining);
      expect(countExpr.code).toBe(
        'Array.from(document.querySelectorAll("#a .b")).filter((x) => !(x.classList.contains("done"))).length',
      );
    });
  });

  it('length(list) returns Array.from(...).length for a raw listSelector', () => {
    const script = createVanillaScript();
    script.fn('count', (s) => {
      const list = queryAll(s, '.item');
      expect(length(list).code).toBe(
        'document.querySelectorAll(".item").length',
      );
    });
  });
});

describe('ElementRef.cache(name?) (Req 2.1 / Issue 3)', () => {
  it('appends a declareConst command in the current scope and returns a kind: "var" ref', () => {
    const script = createVanillaScript();
    script.fn('addTodo', (s) => {
      const input = query<HTMLInputElement>(s, '#todo-input');
      const cached = input.cache('input');
      expect(cached.kind).toBe('var');
      expect(cached.code).toBe('input');
    });
    const out = script.render();
    expect(out).toContain('const input = document.querySelector("#todo-input");');
  });

  it('auto-generates a name when none is supplied', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const r = query(s, '#x');
      const cached = r.cache();
      expect(cached.kind).toBe('var');
      expect(cached.code).toMatch(/^_cached_\d+$/);
    });
    const out = script.render();
    expect(out).toMatch(/const _cached_\d+ = document\.querySelector\("#x"\);/);
  });

  it('throws when called on a ref() / fromSelector() that is not bound to a scope', () => {
    expect(() => ref('x').cache()).toThrow(Error);
  });
});

describe('ElementRef.containsClass(name)', () => {
  it('returns a JsBoolExpr of classList.contains(...)', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const r = query(s, '.item');
      const expr = r.containsClass('done');
      expect(expr.__jsBool).toBe(true);
      expect(expr.code).toBe(
        'document.querySelector(".item").classList.contains("done")',
      );
    });
  });
});

describe('output contains no jQuery / $ tokens (Req 1.5 / 7.1 sanity)', () => {
  it('produced code has no jQuery identifiers', () => {
    const script = createVanillaScript();
    script.fn('removeDone', (s) => {
      const list = queryAll(s, '.done');
      forEach(s, list, (inner, item) => {
        inner._append({ type: 'remove', target: { kind: 'closure-ref', varName: item.code } });
      });
    });
    const out = script.render();
    expect(out).not.toMatch(/\bjQuery\b/);
    expect(out).not.toMatch(/\$\(/);
  });
});
