/**
 * `src/js/vanilla/dom-api.ts` の振る舞いテスト（Task 4.3）。
 *
 * 対応 requirement: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4
 * 対応 design.md セクション: 「dom-api」「types: WritableStyleKey」
 */

import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  addClass,
  containsClass,
  getText,
  getValue,
  removeClass,
  setStyle,
  setText,
  setValue,
  toggleClass,
} from '../../../src/js/vanilla/dom-api.ts';
import { ref } from '../../../src/js/vanilla/element-ref.ts';
import { query } from '../../../src/js/vanilla/query-api.ts';
import type { ElementRef, JsBoolExpr, JsExpr, WritableStyleKey } from '../../../src/js/vanilla/types.ts';
import { createVanillaScript } from '../../../src/js/vanilla/vanilla-script-builder.ts';

describe('toggleClass(scope, el, name, force?) (Req 3.1, 3.2)', () => {
  it('emits element.classList.toggle("name") without force', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = query(s, '.item');
      toggleClass(s, el, 'done');
    });
    const out = script.render();
    expect(out).toContain('document.querySelector(".item").classList.toggle("done");');
  });

  it('emits element.classList.toggle("name", force) with boolean force (as JsBoolExpr)', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = query(s, '.item');
      const cond = el.containsClass('done');
      toggleClass(s, el, 'active', cond);
    });
    const out = script.render();
    expect(out).toMatch(
      /classList\.toggle\("active", document\.querySelector\("\.item"\)\.classList\.contains\("done"\)\)/,
    );
  });
});

describe('addClass / removeClass (Req 3.3)', () => {
  it('addClass emits classList.add', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = ref('el');
      addClass(s, el, 'done');
    });
    expect(script.render()).toContain('el.classList.add("done");');
  });

  it('removeClass emits classList.remove', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = ref('el');
      removeClass(s, el, 'done');
    });
    expect(script.render()).toContain('el.classList.remove("done");');
  });
});

describe('containsClass(el, name) (Req 3.4) — free function', () => {
  it('returns a JsBoolExpr of element.classList.contains(name)', () => {
    const el = ref('el');
    const expr = containsClass(el, 'done');
    expect(expr.__jsBool).toBe(true);
    expect(expr.code).toBe('el.classList.contains("done")');
  });
});

describe('setText / getText (Req 4.1)', () => {
  it('setText with string value quotes via JSON.stringify', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = ref('el');
      setText(s, el, 'hello "world"');
    });
    expect(script.render()).toContain('el.textContent = "hello \\"world\\"";');
  });

  it('setText with JsExpr inlines code without quoting', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = ref('el');
      const other = ref('other');
      setText(s, el, other.textContent);
    });
    expect(script.render()).toContain('el.textContent = other.textContent;');
  });

  it('getText returns a JsExpr of element.textContent', () => {
    const el = ref('el');
    const e = getText(el);
    expect(e.code).toBe('el.textContent');
    expect(e.__jsExpr).toBe(true);
  });
});

describe('setValue / getValue (Req 4.2)', () => {
  it('setValue with empty string emits value = ""', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const input = ref<HTMLInputElement>('input');
      setValue(s, input, '');
    });
    expect(script.render()).toContain('input.value = "";');
  });

  it('setValue with JsExpr passes through without quoting', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const input = ref<HTMLInputElement>('input');
      const other = ref<HTMLInputElement>('other');
      setValue(s, input, other.value);
    });
    expect(script.render()).toContain('input.value = other.value;');
  });

  it('getValue returns a JsExpr of element.value', () => {
    const input = ref<HTMLInputElement>('input');
    const e = getValue(input);
    expect(e.code).toBe('input.value');
  });
});

describe('setStyle<K extends WritableStyleKey>(scope, el, key, value) (Req 4.3, 4.4)', () => {
  it('emits element.style.<key> = "value" for string value', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = ref('el');
      setStyle(s, el, 'borderColor', 'red');
    });
    expect(script.render()).toContain('el.style.borderColor = "red";');
  });

  it('inlines JsExpr value without quoting', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = ref('el');
      const other = ref('other');
      setStyle(s, el, 'color', other.textContent);
    });
    expect(script.render()).toContain('el.style.color = other.textContent;');
  });
});

describe('type-level tests (Req 4.4 / 4.2)', () => {
  it('WritableStyleKey includes borderColor and excludes length/parentRule/cssText', () => {
    expectTypeOf<'borderColor'>().toExtend<WritableStyleKey>();
    expectTypeOf<'color'>().toExtend<WritableStyleKey>();
    // length / parentRule / cssText must NOT be in WritableStyleKey
    expectTypeOf<'length'>().not.toExtend<WritableStyleKey>();
    expectTypeOf<'parentRule'>().not.toExtend<WritableStyleKey>();
    expectTypeOf<'cssText'>().not.toExtend<WritableStyleKey>();
  });

  it('setStyle rejects unknown style keys and setValue rejects non-input refs at compile time', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el: ElementRef<HTMLElement> = ref('el');
      // @ts-expect-error: "nonexistent" is not a WritableStyleKey
      setStyle(s, el, 'nonexistent', 'red');

      const div: ElementRef<HTMLDivElement> = ref('div');
      // @ts-expect-error: setValue requires HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      setValue(s, div, '');

      // @ts-expect-error: getValue requires HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      getValue(div);
    });
  });

  it('value types flow: getText returns JsExpr, containsClass returns JsBoolExpr', () => {
    const el = ref('el');
    expectTypeOf(getText(el)).toEqualTypeOf<JsExpr>();
    expectTypeOf(containsClass(el, 'x')).toEqualTypeOf<JsBoolExpr>();
  });
});

describe('output contains no jQuery / $ tokens (Req 1.5 / 7.1 sanity)', () => {
  it('produced code has no jQuery identifiers', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const el = query(s, '.item');
      toggleClass(s, el, 'done');
      setStyle(s, el, 'borderColor', 'red');
      const input = ref<HTMLInputElement>('input');
      setValue(s, input, '');
    });
    const out = script.render();
    expect(out).not.toMatch(/\bjQuery\b/);
    expect(out).not.toMatch(/\$\(/);
  });
});
