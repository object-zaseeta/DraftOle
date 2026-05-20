/**
 * `src/js/vanilla/element-ref.ts` の振る舞いテスト。
 *
 * 対応 requirement: 2.4, 4.1, 4.2, 6.1, 6.2
 * 対応 design.md セクション: 「element-ref」「types: JsExpr / JsBoolExpr」
 */

import { describe, expect, it } from 'vitest';

import { type VanillaCommand } from '../../../src/js/vanilla/commands.ts';
import {
  fromExpr,
  fromSelector,
  listFromExpr,
  listFromSelector,
  ref,
  _makeJsExpr,
  _makeScopedElementListRef,
  _makeScopedElementRef,
} from '../../../src/js/vanilla/element-ref.ts';
import type { VanillaScope } from '../../../src/js/vanilla/vanilla-script-builder.ts';

// テスト用の最小 VanillaScope。`cache()` のスコープ紐付け経路を検証するためだけに用意する。
function createTestScope(): VanillaScope & { captured: VanillaCommand[] } {
  const captured: VanillaCommand[] = [];
  return {
    captured,
    _append(cmd) {
      captured.push(cmd);
    },
    _childScope(_queue) {
      return createTestScope();
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
      /* not used in these tests */
    },
  };
}

describe('ref()', () => {
  it('creates a kind: "var" ElementRef whose code equals the variable name', () => {
    const r = ref('x');
    expect(r.__ref).toBe(true);
    expect(r.kind).toBe('var');
    expect(r.code).toBe('x');
  });

  it('throws on empty string', () => {
    expect(() => ref('')).toThrow(Error);
  });

  it('throws on invalid JS identifier (starts with a digit)', () => {
    expect(() => ref('1abc')).toThrow(Error);
  });

  it('throws on invalid JS identifier (contains hyphen)', () => {
    expect(() => ref('foo-bar')).toThrow(Error);
  });

  it('accepts identifiers with underscore and dollar sign', () => {
    expect(ref('$el').code).toBe('$el');
    expect(ref('_item').code).toBe('_item');
  });
});

describe('fromSelector()', () => {
  it('produces document.querySelector with a JSON-stringified selector', () => {
    const r = fromSelector('#a');
    expect(r.kind).toBe('selector');
    expect(r.code).toBe('document.querySelector("#a")');
  });

  it('throws on empty selector', () => {
    expect(() => fromSelector('')).toThrow(Error);
  });
});

describe('fromExpr()', () => {
  it('wraps a raw JS expression string', () => {
    const r = fromExpr('foo()');
    expect(r.kind).toBe('expr');
    expect(r.code).toBe('foo()');
  });

  it('throws on empty code', () => {
    expect(() => fromExpr('')).toThrow(Error);
  });
});

describe('ElementRef.textContent', () => {
  it('exposes a JsExpr whose code is `${code}.textContent`', () => {
    const r = ref('x');
    expect(r.textContent.__jsExpr).toBe(true);
    expect(r.textContent.code).toBe('x.textContent');
  });

  it('composes with selector-kind refs', () => {
    const r = fromSelector('#a');
    expect(r.textContent.code).toBe('document.querySelector("#a").textContent');
  });
});

describe('ElementRef.value', () => {
  it('exposes a JsExpr whose code is `${code}.value` for input-like refs', () => {
    const r = ref<HTMLInputElement>('input');
    // 型レベルで許可されるため実行時アクセス可。
    const v = r.value as { code: string; __jsExpr: true };
    expect(v.code).toBe('input.value');
    expect(v.__jsExpr).toBe(true);
  });
});

describe('listFromSelector()', () => {
  it('produces document.querySelectorAll with JSON-stringified selector', () => {
    const l = listFromSelector('.item');
    expect(l.__listRef).toBe(true);
    expect(l.kind).toBe('listSelector');
    expect(l.code).toBe('document.querySelectorAll(".item")');
  });

  it('exposes length as JsExpr "<code>.length"', () => {
    const l = listFromSelector('.item');
    expect(l.length.code).toBe('document.querySelectorAll(".item").length');
  });
});

describe('JsExpr chain methods', () => {
  it('eq quotes string operand with JSON.stringify', () => {
    const e = _makeJsExpr('e.key');
    const b = e.eq('Enter');
    expect(b.__jsBool).toBe(true);
    expect(b.code).toBe('e.key === "Enter"');
  });

  it('eq accepts number operand unquoted', () => {
    const e = _makeJsExpr('x');
    expect(e.eq(42).code).toBe('x === 42');
  });

  it('eq composes with another JsExpr operand', () => {
    const a = _makeJsExpr('a');
    const b = _makeJsExpr('b');
    expect(a.eq(b).code).toBe('a === b');
  });

  it('ne builds strict-not-equal expression', () => {
    const e = _makeJsExpr('y');
    expect(e.ne('foo').code).toBe('y !== "foo"');
  });

  it('or wraps in parens with string literal quoted', () => {
    const r = ref<HTMLInputElement>('input');
    const v = r.value as { or: (f: string) => { code: string } };
    expect(v.or('').code).toBe('(input.value || "")');
  });

  it('or accepts a JsExpr fallback', () => {
    const a = _makeJsExpr('a');
    const b = _makeJsExpr('b');
    expect(a.or(b).code).toBe('(a || b)');
  });

  it('trim appends .trim()', () => {
    const a = _makeJsExpr('a');
    expect(a.trim().code).toBe('a.trim()');
  });

  it('supports chaining: value.or("").trim()', () => {
    const r = ref<HTMLInputElement>('input');
    const v = r.value as {
      or: (f: string) => { trim: () => { code: string } };
    };
    expect(v.or('').trim().code).toBe('(input.value || "").trim()');
  });

  it('isFalsy produces !code as JsBoolExpr', () => {
    const a = _makeJsExpr('text');
    const b = a.isFalsy();
    expect(b.__jsBool).toBe(true);
    expect(b.code).toBe('!text');
  });

  it('isTruthy produces !!code as JsBoolExpr', () => {
    const a = _makeJsExpr('text');
    const b = a.isTruthy();
    expect(b.__jsBool).toBe(true);
    expect(b.code).toBe('!!text');
  });

  it('chain methods return new objects (immutable)', () => {
    const a = _makeJsExpr('a');
    const b = a.trim();
    expect(a.code).toBe('a');
    expect(b.code).toBe('a.trim()');
  });
});

describe('Requirement 6.1: jsName refs are usable as API inputs', () => {
  it('ref("itemEl") produces a code usable in appendChild-like expressions', () => {
    const parent = ref('container');
    const child = ref('itemEl');
    // 後続 API で合成される想定の形。ここでは code の構成可能性のみ検証する。
    expect(`${parent.code}.appendChild(${child.code})`).toBe('container.appendChild(itemEl)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 5.4 / Req 2.4 — `cache()` error paths（src 100-113）と
// `listFromSelector` / `listFromExpr` 空入力エラー（src 192, 204-207）の網羅
// ─────────────────────────────────────────────────────────────────────────────

describe('ElementRef.cache() error paths（Task 5.4 / Req 2.4）', () => {
  it('throws when called on an unbound ref produced by ref()', () => {
    const r = ref('x');
    expect(() => r.cache()).toThrow(/not bound to a scope/);
  });

  it('throws when called on an unbound ref produced by fromSelector()', () => {
    const r = fromSelector('#a');
    expect(() => r.cache('foo')).toThrow(/not bound to a scope/);
  });

  it('throws when called on an unbound ref produced by fromExpr()', () => {
    const r = fromExpr('foo()');
    expect(() => r.cache()).toThrow(/not bound to a scope/);
  });

  it('throws on a scoped ref when an invalid JS identifier name is supplied', () => {
    const scope = createTestScope();
    const r = _makeScopedElementRef<HTMLElement>('selector', 'document.querySelector("#a")', scope);
    expect(() => r.cache('invalid-id')).toThrow(/invalid JS identifier/);
    // 識別子検証で弾かれた場合、scope には declareConst が追加されていないことを確認する。
    expect(scope.captured).toHaveLength(0);
  });

  it('throws on a scoped ref when an empty string is supplied as name', () => {
    const scope = createTestScope();
    const r = _makeScopedElementRef<HTMLElement>('selector', 'document.querySelector("#a")', scope);
    expect(() => r.cache('')).toThrow(/invalid JS identifier/);
    expect(scope.captured).toHaveLength(0);
  });

  it('appends a declareConst command and returns a kind: "var" ref when called with a valid name', () => {
    const scope = createTestScope();
    const r = _makeScopedElementRef<HTMLElement>('selector', 'document.querySelector("#a")', scope);
    const cached = r.cache('myEl');
    expect(scope.captured).toHaveLength(1);
    expect(scope.captured[0]).toEqual<VanillaCommand>({
      type: 'declareConst',
      name: 'myEl',
      expr: 'document.querySelector("#a")',
    });
    expect(cached.kind).toBe('var');
    expect(cached.code).toBe('myEl');
  });

  it('auto-generates a _cached_N identifier when no name is provided', () => {
    const scope = createTestScope();
    const r = _makeScopedElementRef<HTMLElement>('selector', 'document.querySelector("#a")', scope);
    const cached = r.cache();
    expect(scope.captured).toHaveLength(1);
    const cmd = scope.captured[0];
    expect(cmd.type).toBe('declareConst');
    if (cmd.type === 'declareConst') {
      expect(cmd.name).toMatch(/^_cached_\d+$/);
      expect(cmd.expr).toBe('document.querySelector("#a")');
      expect(cached.code).toBe(cmd.name);
    }
    expect(cached.kind).toBe('var');
  });
});

describe('listFromSelector() / listFromExpr() empty input guards（Task 5.4）', () => {
  it('listFromSelector throws on empty selector (src line 192)', () => {
    expect(() => listFromSelector('')).toThrow(/must not be empty/);
  });

  it('listFromExpr produces an ElementListRef with listExpr kind and `.length`', () => {
    const l = listFromExpr('Array.from(xs).filter(Boolean)');
    expect(l.__listRef).toBe(true);
    expect(l.kind).toBe('listExpr');
    expect(l.code).toBe('Array.from(xs).filter(Boolean)');
    expect(l.length.code).toBe('Array.from(xs).filter(Boolean).length');
  });

  it('listFromExpr throws on empty code (src lines 204-207)', () => {
    expect(() => listFromExpr('')).toThrow(/must not be empty/);
  });
});

describe('_makeScopedElementListRef（internal factory）', () => {
  it('returns an ElementListRef with the supplied kind/code and `.length` accessor', () => {
    const l = _makeScopedElementListRef<HTMLElement>(
      'listSelector',
      'document.querySelectorAll(".item")',
    );
    expect(l.__listRef).toBe(true);
    expect(l.kind).toBe('listSelector');
    expect(l.code).toBe('document.querySelectorAll(".item")');
    expect(l.length.code).toBe('document.querySelectorAll(".item").length');
  });
});
