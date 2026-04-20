/**
 * `src/js/vanilla/element-ref.ts` の振る舞いテスト。
 *
 * 対応 requirement: 2.4, 4.1, 4.2, 6.1, 6.2
 * 対応 design.md セクション: 「element-ref」「types: JsExpr / JsBoolExpr」
 */

import { describe, expect, it } from 'vitest';

import {
  fromExpr,
  fromSelector,
  listFromSelector,
  ref,
  _makeJsExpr,
} from '../../../src/js/vanilla/element-ref.ts';

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
