/**
 * `src/js/vanilla/root-facade.ts` + `src/html/elements/root.ts` の振る舞いテスト。
 *
 * Task 4.1: script / expr / $ / $$ の同一参照・型・挙動を検証
 * Task 4.2: Root.addChild 時のバッファフラッシュを検証
 *
 * 対応 requirement: 2.1, 2.2, 3.1, 4.1, 4.3 (unified-element-api)
 */

import { describe, expect, it } from 'vitest';
import { PairType } from '../../../src/html/elements/pair-type.ts';
import { Root } from '../../../src/html/elements/root.ts';
import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.ts';
import type { VanillaCommand } from '../../../src/js/vanilla/commands.ts';

// root.ts をインポートすると自動的に applyRootFacade が適用される。

// ─────────────────────────────────────────────────────────────────────
// Task 4.1: script プロパティ
// ─────────────────────────────────────────────────────────────────────

describe('RootFacade - script プロパティ', () => {
  it('root.script === root.script（同一参照）', () => {
    const root = new Root();
    const s1 = (root as { script: unknown }).script;
    const s2 = (root as { script: unknown }).script;
    expect(s1).toBe(s2);
  });

  it('異なる Root インスタンスは異なる ScriptScope を持つ', () => {
    const r1 = new Root();
    const r2 = new Root();
    const s1 = (r1 as { script: unknown }).script;
    const s2 = (r2 as { script: unknown }).script;
    expect(s1).not.toBe(s2);
  });

  it('script.fn を呼ぶと renderVanillaScript に関数定義が出力される', () => {
    const root = new Root();
    const script = (root as { script: { fn: (name: string, body: (s: unknown) => void) => void } }).script;
    script.fn('greet', (_s) => {});
    const output = root.renderVanillaScript();
    expect(output).toContain('function greet');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Task 4.1: expr プロパティ
// ─────────────────────────────────────────────────────────────────────

describe('RootFacade - expr プロパティ', () => {
  it('root.expr(code) が code を保持する JsExpr を返す', () => {
    const root = new Root();
    const expr = (root as { expr: (code: string) => { code: string } }).expr;
    expect(expr('x + 1').code).toBe('x + 1');
  });

  it('root.expr.bool(code) が JsBoolExpr を返す', () => {
    const root = new Root();
    const expr = (root as { expr: { bool: (code: string) => { code: string; __jsBool: boolean } } }).expr;
    const boolExpr = expr.bool('flag');
    expect(boolExpr.code).toBe('flag');
    expect(boolExpr.__jsBool).toBe(true);
  });

  it('root.expr は同一参照（シングルトン）', () => {
    const root = new Root();
    const e1 = (root as { expr: unknown }).expr;
    const e2 = (root as { expr: unknown }).expr;
    expect(e1).toBe(e2);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Task 4.1: $ / $$ プロパティ
// ─────────────────────────────────────────────────────────────────────

describe('RootFacade - $()', () => {
  it('root.$() が ElementMethods を備えた SelectorRef を返す', () => {
    const root = new Root();
    const facade = root as { $: (sel: string) => { setText?: unknown; on?: unknown } };
    const sel = facade.$('#btn');
    expect(sel).toBeDefined();
    expect(typeof sel.setText).toBe('function');
    expect(typeof sel.on).toBe('function');
  });

  it('root.$().setText() を呼ぶと renderVanillaScript に textContent 操作が現れる', () => {
    const root = new Root();
    const facade = root as { $: (sel: string) => { setText: (v: string) => unknown } };
    facade.$('#btn').setText('Hello');
    const output = root.renderVanillaScript();
    expect(output).toContain('"Hello"');
    expect(output).toContain('textContent');
  });
});

describe('RootFacade - $$()', () => {
  it('root.$$() が length を持つ CollectionRef を返す', () => {
    const root = new Root();
    const facade = root as { $$: (sel: string) => { length: { code: string } } };
    const col = facade.$$('.items');
    expect(col).toBeDefined();
    expect(col.length.code).toContain('.length');
  });
});

// ─────────────────────────────────────────────────────────────────────
// Task 4.2: Root.addChild によるバッファフラッシュ
// ─────────────────────────────────────────────────────────────────────

describe('Root.addChild フラッシュ (Task 4.2)', () => {
  function makeEl(): PairType {
    const el = new PairType('div');
    el.addHtmlAttribute(HtmlAttribute.keyValue('id', 'myEl'));
    return el;
  }

  it('addChild 呼び出し時にバッファ済みコマンドが script に転送される', () => {
    const root = new Root();
    const el = makeEl();

    // addChild 前にコマンドを手動バッファ
    const cmd: VanillaCommand = {
      type: 'setProp',
      target: { kind: 'sel', selector: '#myEl' },
      prop: 'textContent',
      expr: '"buffered"',
    };
    el._pending.push(cmd);

    root.addChild(el);

    const output = root.renderVanillaScript();
    expect(output).toContain('"buffered"');
    expect(output).toContain('textContent');
  });

  it('addChild 後に _pending が空になり _scope が設定される', () => {
    const root = new Root();
    const el = makeEl();
    el._pending.push({ type: 'expr', code: 'x()' } as VanillaCommand);

    root.addChild(el);

    expect(el._pending.length).toBe(0);
    expect(el._scope).toBeDefined();
  });

  it('addChild 後の要素への追加コマンドは即時 scope へ流れる', () => {
    const root = new Root();
    const el = makeEl();
    root.addChild(el);

    // addChild 後にコマンドを直接 scope へ
    expect(el._scope).toBeDefined();
    if (el._scope === undefined) return;
    el._scope._append({ type: 'expr', code: 'postFlush()' });

    const output = root.renderVanillaScript();
    expect(output).toContain('postFlush()');
  });

  it('script を先にアクセスして addChild してもフラッシュされる', () => {
    const root = new Root();
    const script = (root as { script: unknown }).script;
    expect(script).toBeDefined();

    const el = makeEl();
    el._pending.push({ type: 'expr', code: 'preScript()' } as VanillaCommand);
    root.addChild(el);

    const output = root.renderVanillaScript();
    expect(output).toContain('preScript()');
  });

  it('addChild なしで scope を先に作成した場合も script に出力される', () => {
    const root = new Root();
    // $() を使って scope を初期化（root. 経由で呼ぶことで this を保持）
    const facade = root as { $: (sel: string) => { setText: (v: string) => unknown } };
    facade.$('#x').setText('via selector');
    const output = root.renderVanillaScript();
    expect(output).toContain('"via selector"');
  });
});
