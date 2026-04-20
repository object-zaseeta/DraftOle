/**
 * `src/js/vanilla/event-api.ts` の振る舞い／型レベルテスト（Task 4.1）。
 *
 * 対応 requirement: 1.1, 1.2, 1.3, 1.4, 1.5
 * 対応 design.md セクション: 「event-api」「types: EventArgRef」
 */

import { describe, expect, expectTypeOf, it } from 'vitest';

import { ref } from '../../../src/js/vanilla/element-ref.ts';
import { on, onDomReady } from '../../../src/js/vanilla/event-api.ts';
import type { EventArgRef, JsExpr } from '../../../src/js/vanilla/types.ts';
import { createVanillaScript } from '../../../src/js/vanilla/vanilla-script-builder.ts';

describe('on(scope, target, event, handler) (Req 1.1, 1.2, 1.4, 1.5)', () => {
  it('emits element.addEventListener for ElementRef target', () => {
    const script = createVanillaScript();
    const input = ref<HTMLInputElement>('inputEl');
    script.fn('setup', (s) => {
      on(s, input, 'click', (_inner, _e) => {
        _inner.call('handleClick');
      });
    });
    const out = script.render();
    expect(out).toContain('inputEl.addEventListener("click", (e) => {');
    expect(out).toContain('handleClick();');
  });

  it('emits document.addEventListener when target is the literal "document"', () => {
    const script = createVanillaScript();
    script.fn('setup', (s) => {
      on(s, 'document', 'keydown', (inner) => {
        inner.call('onGlobalKey');
      });
    });
    const out = script.render();
    expect(out).toContain('document.addEventListener("keydown", (e) => {');
    expect(out).toContain('onGlobalKey();');
  });

  it('uses fixed event arg name "e" in the emitted arrow function', () => {
    const script = createVanillaScript();
    script.fn('setup', (s) => {
      on(s, ref('btn'), 'click', () => {});
    });
    const out = script.render();
    // 引数名は常に "e"
    expect(out).toMatch(/addEventListener\("click", \(e\) => \{/);
  });

  it('EventArgRef.key is usable with JsExpr.eq to emit `e.key === "Enter"`', () => {
    const script = createVanillaScript();
    const input = ref<HTMLInputElement>('inputEl');
    script.fn('setup', (s) => {
      on(s, input, 'keydown', (inner, e) => {
        inner.ifThen(e.key.eq('Enter'), (thenScope) => {
          thenScope.call('submit');
        });
      });
    });
    const out = script.render();
    expect(out).toContain('inputEl.addEventListener("keydown", (e) => {');
    expect(out).toContain('if (e.key === "Enter") {');
    expect(out).toContain('submit();');
  });

  it('does not emit jQuery / $ in the output (Req 1.5)', () => {
    const script = createVanillaScript();
    script.fn('setup', (s) => {
      on(s, ref('btn'), 'click', (inner) => inner.call('noop'));
    });
    const out = script.render();
    expect(out).not.toMatch(/\bjQuery\b/);
    const stripped = out.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
    expect(stripped).not.toMatch(/(^|[^A-Za-z0-9_])\$(?![A-Za-z0-9_])/);
  });

  it('event-arg typing: e is a KeyboardEvent-derived EventArgRef for "keydown"', () => {
    // 型レベルのみの検証。
    type HandlerArgs = Parameters<
      Parameters<typeof on<'keydown'>>[3]
    >;
    // HandlerArgs[1] が EventArgRef<'keydown'> であること
    expectTypeOf<HandlerArgs[1]>().toEqualTypeOf<EventArgRef<'keydown'>>();
    // EventArgRef<'keydown'>.key は JsExpr
    expectTypeOf<EventArgRef<'keydown'>['key']>().toEqualTypeOf<JsExpr>();
  });
});

describe('onDomReady(builder, handler) (Req 1.3)', () => {
  it('delegates to builder.onDomReady and sets hasDomReady', () => {
    const script = createVanillaScript();
    onDomReady(script, (s) => {
      s.call('init');
    });
    expect(script.hasDomReady).toBe(true);
    const out = script.render();
    expect(out).toContain('document.addEventListener("DOMContentLoaded", () => {');
    expect(out).toContain('init();');
  });

  it('throws on nested onDomReady invocation', () => {
    const script = createVanillaScript();
    expect(() => {
      onDomReady(script, () => {
        // ネスト呼び出しはエラー
        onDomReady(script, () => {});
      });
    }).toThrow(Error);
  });

  it('is usable on a fresh builder again after a thrown nested call', () => {
    const script = createVanillaScript();
    try {
      onDomReady(script, () => {
        onDomReady(script, () => {});
      });
    } catch {
      // expected
    }
    // 回復後、新しい onDomReady は受け付けられる
    const script2 = createVanillaScript();
    onDomReady(script2, (s) => s.call('ok'));
    expect(script2.render()).toContain('ok()');
  });
});
