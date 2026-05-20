/**
 * `src/js/vanilla/script-scope.ts` の振る舞いテスト（Task 3.1）。
 *
 * 対応 requirement: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 (unified-element-api)
 * 対応 design.md セクション: 「ScriptScope」
 *
 * 検証観点:
 *   1. `createScriptScope(builder)` が `fn` / `onDomReady` / `if` / `let` / `return` /
 *      `call` / `raw` を公開し、tsc で型が解決される（コンパイル時に保証）
 *   2. 実装はパススルーであり、各メソッドの呼び出しが内部 `VanillaScriptBuilder` /
 *      `VanillaScope` 側の命令として正しくレンダリングされる
 *   3. ハンドラコールバックに渡される `s: ScriptScope` も同じ API 面を備える (Req 3.5)
 */

import { describe, expect, it } from 'vitest';

import type { ScriptScope } from '../../../src/js/vanilla/script-scope.ts';
import { createScriptScope } from '../../../src/js/vanilla/script-scope.ts';
import type { VanillaScope } from '../../../src/js/vanilla/vanilla-script-builder.ts';
import { createVanillaScript } from '../../../src/js/vanilla/vanilla-script-builder.ts';

describe('ScriptScope (Task 3.1 thin adapter)', () => {
  it('Req 3.2: `fn(name, params?, body)` declares a top-level function', () => {
    const builder = createVanillaScript();
    const script: ScriptScope = createScriptScope(builder);

    script.fn('greet', ['who'], (s) => {
      s.call('console.log', [s.raw('who')]);
    });

    expect(builder.render()).toBe(
      ['function greet(who) {', '  console.log(who);', '}'].join('\n'),
    );
  });

  it('Req 3.2: `fn(name, body)` supports the zero-params overload', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    script.fn('init', (s) => {
      s.raw('x');
    });

    expect(builder.render()).toBe(['function init() {', '', '}'].join('\n'));
  });

  it('Req 3.3: `onDomReady(body)` registers a DOMContentLoaded block', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    script.onDomReady((s) => {
      s.call('boot');
    });

    expect(builder.hasDomReady).toBe(true);
    expect(builder.render()).toContain('document.addEventListener("DOMContentLoaded"');
    expect(builder.render()).toContain('boot();');
  });

  it('Req 3.4: `let` / `call` / `return` / `raw` are passthrough to VanillaScope', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    script.onDomReady((s) => {
      const n = s.let('n', s.raw('1 + 2'));
      s.call('use', [n]);
      s.return();
    });

    const out = builder.render();
    expect(out).toContain('const n = 1 + 2;');
    expect(out).toContain('use(n);');
    expect(out).toContain('return;');
  });

  it('Req 3.4: `if(condition, then)` aliases the underlying `ifThen`', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    script.onDomReady((s) => {
      s.if(s.raw('flag'), (body) => {
        body.call('go');
      });
    });

    const out = builder.render();
    expect(out).toContain('if (flag) {');
    expect(out).toContain('go();');
  });

  it('Req 3.4: `if(condition, then, orElse)` forwards the else branch', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    script.onDomReady((s) => {
      s.if(
        s.raw('cond'),
        (t) => {
          t.call('yes');
        },
        (e) => {
          e.call('no');
        },
      );
    });

    const out = builder.render();
    expect(out).toContain('if (cond) {');
    expect(out).toContain('yes();');
    expect(out).toContain('} else {');
    expect(out).toContain('no();');
  });

  it('Req 3.5: the `s` passed into `fn` / `onDomReady` / `if` bodies is a ScriptScope with the full surface', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    script.onDomReady((s) => {
      // Type-level assertion: all required members exist. If any of these
      // disappear from ScriptScope, this block becomes a compile error.
      const surface: {
        fn: ScriptScope['fn'];
        onDomReady: ScriptScope['onDomReady'];
        if: ScriptScope['if'];
        let: ScriptScope['let'];
        return: ScriptScope['return'];
        call: ScriptScope['call'];
        raw: ScriptScope['raw'];
      } = {
        fn: s.fn,
        onDomReady: s.onDomReady,
        if: s.if,
        let: s.let,
        return: s.return,
        call: s.call,
        raw: s.raw,
      };
      expect(typeof surface.fn).toBe('function');
      expect(typeof surface.onDomReady).toBe('function');
      expect(typeof surface.if).toBe('function');
      expect(typeof surface.let).toBe('function');
      expect(typeof surface.return).toBe('function');
      expect(typeof surface.call).toBe('function');
      expect(typeof surface.raw).toBe('function');
    });
  });

  it('Req 3.5: nested ScriptScope (child of `if`) keeps `fn` / `onDomReady` reachable at runtime', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    script.onDomReady((s) => {
      s.if(s.raw('true'), (body) => {
        body.fn('inner', (inner) => {
          inner.call('noop');
        });
      });
    });

    // `fn` declared from inside an `if` body inside `onDomReady` is still a
    // top-level function on the builder, because the adapter forwards `fn` to
    // the builder itself (passthrough to `declareFunction`).
    const out = builder.render();
    expect(out).toContain('function inner()');
  });

  it('top-level ifThen/if throws with a clear message', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);
    expect(() => script.ifThen(script.raw('true'), () => {})).toThrow(
      /top-level `if\/ifThen` is not supported/,
    );
    expect(() => script.if(script.raw('true'), () => {})).toThrow(
      /top-level `if\/ifThen` is not supported/,
    );
  });

  it('top-level _childScope throws with a clear message', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);
    expect(() => (script as VanillaScope)._childScope([])).toThrow(
      /top-level VanillaScope does not support _childScope/,
    );
  });
});

describe('ScriptScope branch coverage (Task 5.1)', () => {
  /**
   * 分岐網羅補強: `fn(name, params, body)` の 3 引数オーバーロードで
   * body が未指定（undefined）の場合に明確なエラーを投げる経路を検証する。
   * 対応 requirement: 2.1 (state.ts 由来の分岐網羅方針), 6.1, 6.2
   * 検証対象行: src/js/vanilla/script-scope.ts 145-147
   */
  it('Req 6.1: fn(name, params, undefined) throws a clear error when body is missing', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    // 第 2 引数が配列（params）であり、第 3 引数（body）が undefined の経路。
    // 型上は body が必須だが、ランタイム防衛として `maybeBody === undefined`
    // 分岐を踏ませるため意図的に未指定で呼び出す。
    expect(() =>
      (script.fn as unknown as (
        name: string,
        params: readonly string[],
        body?: (s: unknown) => void,
      ) => void)('greet', ['who']),
    ).toThrow(/fn\(\): body function is required when params are provided/);
  });

  /**
   * 分岐網羅補強: `_emitHandlerBody` を直接呼ぶと「handler-body scope 専用」
   * である旨のエラーを投げる経路を検証する。
   * 対応 requirement: 6.1, 6.2
   * 検証対象行: src/js/vanilla/script-scope.ts 162-166
   */
  it('Req 6.1: top-level _emitHandlerBody throws because it is only valid in .on dispatcher', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    expect(() => script._emitHandlerBody('console.log(e);', ['e'])).toThrow(
      /_emitHandlerBody\(\) is only available in a handler-body scope/,
    );

    // onDomReady 経由で渡される `s` でも同じ防衛が効くこと（wrapScope 経由）。
    script.onDomReady((s) => {
      expect(() => s._emitHandlerBody('x;', [])).toThrow(
        /_emitHandlerBody\(\) is only available in a handler-body scope/,
      );
    });
  });

  /**
   * 分岐網羅補強: トップレベル `topScope` の `raw` / `let` / `call` / `return`
   * を `script` 直下から呼んだときに、`builder.append` に正しい command が
   * 発行されることを検証する。
   * 対応 requirement: 6.1, 6.2
   * 検証対象行: src/js/vanilla/script-scope.ts 211-225
   */
  it('Req 6.1: top-level `raw(code)` returns a JsExpr with the same code verbatim', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    const expr = script.raw('1 + 2');
    expect(expr.code).toBe('1 + 2');
    // raw だけでは builder にコマンドは積まれない。
    expect(builder.render()).toBe('');
  });

  it('Req 6.1: top-level `let(name, value)` emits a declareConst and returns a JsExpr referencing the name', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    const n = script.let('n', script.raw('1 + 2'));
    expect(n.code).toBe('n');
    expect(builder.render()).toContain('const n = 1 + 2;');
  });

  it('Req 6.1: top-level `call(name, args)` emits an expr command and returns the call JsExpr', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    const r = script.call('boot', [script.raw('1'), script.raw('2')]);
    expect(r.code).toBe('boot(1, 2)');
    expect(builder.render()).toContain('boot(1, 2);');
  });

  it('Req 6.1: top-level `call(name)` without args defaults to empty argument list', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    const r = script.call('init');
    expect(r.code).toBe('init()');
    expect(builder.render()).toContain('init();');
  });

  it('Req 6.1: top-level `return()` emits a raw `return;` command', () => {
    const builder = createVanillaScript();
    const script = createScriptScope(builder);

    script.return();
    expect(builder.render()).toContain('return;');
  });
});
