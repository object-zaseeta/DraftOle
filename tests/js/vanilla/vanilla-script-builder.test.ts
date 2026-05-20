/**
 * `src/js/vanilla/vanilla-script-builder.ts` の振る舞いテスト（Task 3.1）。
 *
 * 対応 requirement: 1.3, 1.5, 7.1, 7.2, 7.4
 * 対応 design.md セクション: 「vanilla-script-builder」「VanillaScope」
 */

import { describe, expect, it } from 'vitest';

import {
  createVanillaScript,
  type VanillaScope,
} from '../../../src/js/vanilla/vanilla-script-builder.ts';

describe('createVanillaScript (factory)', () => {
  it('returns a VanillaScript instance with render() and hasDomReady', () => {
    const script = createVanillaScript();
    expect(typeof script.render).toBe('function');
    expect(script.hasDomReady).toBe(false);
    expect(script.render()).toBe('');
  });

  it('is idempotent: render() can be called multiple times and returns the same string', () => {
    const script = createVanillaScript();
    script.onDomReady((s) => {
      s.call('foo');
    });
    const a = script.render();
    const b = script.render();
    expect(a).toBe(b);
  });
});

describe('hasDomReady flag (Req 1.3)', () => {
  it('is false until onDomReady is invoked', () => {
    const script = createVanillaScript();
    script.fn('noop', () => {});
    expect(script.hasDomReady).toBe(false);
  });

  it('flips to true after onDomReady is invoked', () => {
    const script = createVanillaScript();
    script.onDomReady((s) => {
      s.call('foo');
    });
    expect(script.hasDomReady).toBe(true);
  });

  it('multiple onDomReady calls merge into a single DOMContentLoaded block', () => {
    const script = createVanillaScript();
    script.onDomReady((s) => {
      s.call('a');
    });
    script.onDomReady((s) => {
      s.call('b');
    });
    const out = script.render();
    const matches = out.match(/document\.addEventListener\("DOMContentLoaded"/g) ?? [];
    expect(matches.length).toBe(1);
    const aIdx = out.indexOf('a()');
    const bIdx = out.indexOf('b()');
    expect(aIdx).toBeGreaterThan(-1);
    expect(bIdx).toBeGreaterThan(aIdx);
  });
});

describe('declareFunction / fn (Req 7.4 execution order)', () => {
  it('renders a top-level function declaration with params and body', () => {
    const script = createVanillaScript();
    script.declareFunction('add', ['a', 'b'], (s) => {
      s.let('sum', s.raw('a + b'));
    });
    const out = script.render();
    expect(out).toContain('function add(a, b) {');
    expect(out).toContain('const sum = a + b;');
  });

  it('fn(name, body) defaults params to []', () => {
    const script = createVanillaScript();
    script.fn('noop', (s) => {
      s.return();
    });
    const out = script.render();
    expect(out).toContain('function noop() {');
    expect(out).toContain('return;');
  });

  it('fn(name, params, body) forwards to declareFunction', () => {
    const script = createVanillaScript();
    script.fn('greet', ['name'], (s) => {
      s.call('console.log', [s.raw('name')]);
    });
    const out = script.render();
    expect(out).toContain('function greet(name) {');
    expect(out).toContain('console.log(name);');
  });
});

describe('append order == render() order (Req 7.4)', () => {
  it('preserves top-level append order across append / fn / onDomReady', () => {
    const script = createVanillaScript();
    // 1) 生コマンド
    script.append({ type: 'raw', code: '/* first */' });
    // 2) 関数宣言
    script.fn('second', (s) => {
      s.return();
    });
    // 3) さらに生コマンド
    script.append({ type: 'raw', code: '/* third */' });
    // 4) DOMContentLoaded
    script.onDomReady((s) => {
      s.call('fourth');
    });
    const out = script.render();
    const i1 = out.indexOf('/* first */');
    const i2 = out.indexOf('function second');
    const i3 = out.indexOf('/* third */');
    const i4 = out.indexOf('fourth()');
    expect(i1).toBeGreaterThanOrEqual(0);
    expect(i2).toBeGreaterThan(i1);
    expect(i3).toBeGreaterThan(i2);
    expect(i4).toBeGreaterThan(i3);
  });
});

describe('VanillaScope methods (Req 1.5, 7.1, 7.4)', () => {
  it('raw(code) returns an expression-like value used in composition', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      // raw 単独は式。値を受け取る API (let / call / ifThen) と組み合わせて使う。
      s.let('r', s.raw('foo.bar()'));
    });
    expect(script.render()).toContain('const r = foo.bar();');
  });

  it('let(name, value) emits a const declaration and returns a ScopeExpr-like object', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      const x = s.let('x', s.raw('1 + 2'));
      s.call('use', [x]);
    });
    const out = script.render();
    expect(out).toContain('const x = 1 + 2;');
    expect(out).toContain('use(x);');
  });

  it('call(name, args?) emits an expression with comma-joined args', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      s.call('noop');
      s.call('greet', [s.raw('name'), s.raw('"hello"')]);
    });
    const out = script.render();
    expect(out).toContain('noop();');
    expect(out).toContain('greet(name, "hello");');
  });

  it('return() emits a bare return', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      s.return();
    });
    expect(script.render()).toContain('return;');
  });

  it('ifThen(cond, then) emits an if block', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      s.ifThen(s.raw('cond'), (inner) => {
        inner.call('yes');
      });
    });
    const out = script.render();
    expect(out).toContain('if (cond) {');
    expect(out).toContain('yes();');
  });

  it('ifThen(cond, then, else) emits if/else', () => {
    const script = createVanillaScript();
    script.fn('f', (s) => {
      s.ifThen(
        s.raw('cond'),
        (inner) => inner.call('yes'),
        (inner) => inner.call('no'),
      );
    });
    const out = script.render();
    expect(out).toContain('if (cond) {');
    expect(out).toContain('yes();');
    expect(out).toContain('} else {');
    expect(out).toContain('no();');
  });
});

describe('jQuery / $ exclusion (Req 1.5, 7.1)', () => {
  it('render() output contains neither jQuery nor bare $ identifier', () => {
    const script = createVanillaScript();
    script.fn('updateCount', (s) => {
      const x = s.let('x', s.raw('document.querySelectorAll("#a .b").length'));
      s.ifThen(s.raw(`${x.code} > 0`), (inner) => {
        inner.call('foo');
      });
    });
    script.onDomReady((s) => {
      s.call('updateCount');
    });
    const out = script.render();
    expect(out).not.toMatch(/\bjQuery\b/);
    const stripped = out.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
    expect(stripped).not.toMatch(/(^|[^A-Za-z0-9_])\$(?![A-Za-z0-9_])/);
  });
});

describe('VanillaScope typing', () => {
  it('exports the VanillaScope interface for consumer API definitions', () => {
    // 型のみ検証用：VanillaScope が import 可能であること。
    const _typeCheck = (scope: VanillaScope): void => {
      scope.raw('noop');
    };
    void _typeCheck;
    expect(true).toBe(true);
  });
});
