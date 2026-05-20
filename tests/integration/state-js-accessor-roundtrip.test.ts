/**
 * Task 13.1: state.js.* × emitHandler の E2E ラウンドトリップテスト
 *
 * 検証観点:
 *   Req 1.3: state accessor API でコンポーズしたイベントハンドラが
 *            レガシーパターン `__draftole__.state('${id}').get()` / `.set(...)` と
 *            同一の出力を生成すること。
 *   Req 1.5: state オブジェクトが `.js` アクセサを持つこと。
 *
 * テストの観点:
 *   これはコンパイル時/文字列レベルのテストである。
 *   1. `state.js.get()` が生成する JS 文字列が手書きと同一である。
 *   2. `state.js.set(expr)` が生成する JS 文字列が手書きと同一である。
 *   3. `emitHandler(state.js.set('...'))` が `.on()` を経由したとき、
 *      `emitHandler("__draftole__.state('s0').set(...)")` と同じ handler-body コマンドを生成する。
 *   4. `renderCommand` レベルでの `handler-body` 出力が一致する。
 *   5. FileExporter 経由でも state.js.set() の出力が正しく script.js に含まれる。
 *
 * Requirements: 1.3, 1.5
 * Depends: Task 4.4 (completed)
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Root } from '../../src/html/elements/root.js';
import { PairType } from '../../src/html/elements/pair-type.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import { applyElementMixin, type ElementMethods } from '../../src/js/vanilla/element-methods.js';
import { emitHandler } from '../../src/js/vanilla/emit-handler.js';
import { renderCommand, type VanillaCommand } from '../../src/js/vanilla/commands.js';
import { StateImpl } from '../../src/js/vanilla/state/state.js';
import { StateRegistry } from '../../src/js/vanilla/state/registry.js';
import type { HtmlTag } from '../../src/html/elements/html-tag.js';
import { FileExporter } from '../../src/publisher/file-exporter.js';
import type { ScriptScope } from '../../src/js/vanilla/script-scope.js';
import type { ArrowHandler } from '../../src/js/vanilla/element-methods.js';

// ─── 型エイリアス ──────────────────────────────────────────────────────────────

type ElementWithMethods = PairType & ElementMethods<PairType> & {
  _pending: VanillaCommand[];
};

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeAll(() => {
  applyElementMixin(PairType.prototype as HtmlTag);
});

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function makeState<T>(id: string): StateImpl<T> {
  const registry = new StateRegistry();
  return new StateImpl<T>(id, registry);
}

function makeElementWithId(tagName: string, id: string): ElementWithMethods {
  const el = new PairType(tagName);
  el.addHtmlAttribute(HtmlAttribute.keyValue('id', id));
  return el as ElementWithMethods;
}

// ScriptScope の最小スタブ（_emitHandlerBody のみ実装）
function makeHandlerScope(
  queue: VanillaCommand[],
  target: { kind: 'sel'; selector: string },
  event: string,
): ScriptScope {
  return {
    _emitHandlerBody(code: string, params: readonly string[]) {
      queue.push({ type: 'handler-body', target, event, code, params });
    },
  } as ScriptScope;
}

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.5: state.js アクセサの存在確認
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.5: state.js アクセサが StateImpl 上に存在する', () => {
  it('state.js は StateJsAccessor インターフェースを実装している', () => {
    const state = makeState<number>('s0');
    expect(state.js).toBeDefined();
    expect(typeof state.js.get).toBe('function');
    expect(typeof state.js.set).toBe('function');
    expect(typeof state.js.update).toBe('function');
  });

  it('root.state() で生成した State も .js アクセサを持つ', () => {
    const root = new Root();
    const count = root.state(0);
    expect(count.js).toBeDefined();
    expect(typeof count.js.get).toBe('function');
    expect(typeof count.js.set).toBe('function');
    expect(typeof count.js.update).toBe('function');
  });

  it('root.state() で複数 state を宣言しても各々が独立した .js アクセサを持つ', () => {
    const root = new Root();
    const count = root.state(0);
    const name = root.state('');
    // 各アクセサは独立した runtimeId を持つ
    expect(count.js.get()).not.toBe(name.js.get());
    expect(count.js.get()).toContain('s0');
    expect(name.js.get()).toContain('s1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: state.js.get() の文字列が手書きレガシーパターンと一致する
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: state.js.get() が手書きレガシーパターンと byte-identical な文字列を返す', () => {
  it('state.js.get() は "__draftole__.state(\'s0\').get()" を返す', () => {
    const state = makeState<number>('s0');
    // 手書きレガシーパターン
    const legacy = "__draftole__.state('s0').get()";
    expect(state.js.get()).toBe(legacy);
  });

  it('異なる runtimeId に対して正しい get() 文字列を生成する', () => {
    expect(makeState<string>('s0').js.get()).toBe("__draftole__.state('s0').get()");
    expect(makeState<number>('s1').js.get()).toBe("__draftole__.state('s1').get()");
    expect(makeState<boolean>('myState').js.get()).toBe("__draftole__.state('myState').get()");
  });

  it('root.state() で採番された state の get() も正しい ID を持つ', () => {
    const root = new Root();
    const count = root.state(0);
    const name = root.state('');
    // root.state() は s0, s1, ... と採番する
    expect(count.js.get()).toBe("__draftole__.state('s0').get()");
    expect(name.js.get()).toBe("__draftole__.state('s1').get()");
  });

  it('state.js.get() の出力が __draftole__ グローバルを参照している', () => {
    const state = makeState<number>('anyId');
    expect(state.js.get()).toContain('__draftole__');
    expect(state.js.get()).toContain('.get()');
    expect(state.js.get()).toContain("'anyId'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: state.js.set(expr) の文字列が手書きレガシーパターンと一致する
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: state.js.set(expr) が手書きレガシーパターンと byte-identical な文字列を返す', () => {
  it('state.js.set(expr) は "__draftole__.state(\'s0\').set(<expr>)" を返す', () => {
    const state = makeState<number>('s0');
    const expr = 'e.target.value';
    const legacy = `__draftole__.state('s0').set(${expr})`;
    expect(state.js.set(expr)).toBe(legacy);
  });

  it('数値リテラル式も正しく set() 文字列を生成する', () => {
    const state = makeState<number>('s1');
    expect(state.js.set('42')).toBe("__draftole__.state('s1').set(42)");
  });

  it('state.js.update(body) はアロー関数ラッパ形式を返す', () => {
    const state = makeState<number>('s0');
    const body = 'return __v + 1';
    const expected = "__draftole__.state('s0').set((__v) => { return __v + 1 })";
    expect(state.js.update(body)).toBe(expected);
  });

  it('get() を含む複合 set() 式が手書きパターンと一致する', () => {
    const state = makeState<string[]>('s0');
    // state.js.get() を使った複合式
    const expr = `[...${state.js.get()}, 'new item']`;
    const expected = `__draftole__.state('s0').set([...__draftole__.state('s0').get(), 'new item'])`;
    expect(state.js.set(expr)).toBe(expected);
  });

  it('空文字列 set() も正しい形式を返す', () => {
    const state = makeState<string>('s2');
    expect(state.js.set('""')).toBe(`__draftole__.state('s2').set("")`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: emitHandler(state.js.set('...')) の handler-body コマンド生成
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: emitHandler(state.js.set(expr)) が正しい handler-body コマンドを生成する', () => {
  it('emitHandler(state.js.set(expr)) を .on() に渡すと handler-body コマンドが積まれる', () => {
    const state = makeState<number>('s0');
    const btn = makeElementWithId('button', 'my-btn');

    const handler = emitHandler(state.js.set('42'));
    btn.on('click', handler as ArrowHandler<Event>);

    expect(btn._pending).toHaveLength(1);
    const cmd = btn._pending[0];
    expect(cmd.type).toBe('handler-body');
    if (cmd.type === 'handler-body') {
      expect(cmd.code).toBe("__draftole__.state('s0').set(42)");
      expect(cmd.params).toEqual([]);
      expect(cmd.event).toBe('click');
      expect(cmd.target).toEqual({ kind: 'sel', selector: '#my-btn' });
    }
  });

  it('params を渡すと handler-body の params に反映される', () => {
    const state = makeState<string>('s1');
    const inp = makeElementWithId('input', 'my-input');

    const handler = emitHandler(state.js.set('e.target.value'), ['e']);
    inp.on('input', handler as ArrowHandler<Event>);

    expect(inp._pending).toHaveLength(1);
    const cmd = inp._pending[0];
    expect(cmd.type).toBe('handler-body');
    if (cmd.type === 'handler-body') {
      expect(cmd.code).toBe("__draftole__.state('s1').set(e.target.value)");
      expect(cmd.params).toEqual(['e']);
    }
  });

  it('state.js.set() と手書き文字列を emitHandler に渡したとき、同一の handler-body コマンドを生成する', () => {
    const state = makeState<number>('s0');
    const id = state._runtimeId; // 's0'
    const stubTarget = { kind: 'sel' as const, selector: '#btn' };

    // 手書きレガシー文字列
    const handlerLegacy = emitHandler(`__draftole__.state('${id}').set(99)`);
    // state.js.set() 由来
    const handlerAccessor = emitHandler(state.js.set('99'));

    const qLegacy: VanillaCommand[] = [];
    const qAccessor: VanillaCommand[] = [];

    handlerLegacy(makeHandlerScope(qLegacy, stubTarget, 'click'));
    handlerAccessor(makeHandlerScope(qAccessor, stubTarget, 'click'));

    expect(qLegacy).toHaveLength(1);
    expect(qAccessor).toHaveLength(1);
    // 同一コマンドが生成される
    expect(qLegacy[0]).toEqual(qAccessor[0]);
  });

  it('emitHandler が返す関数は _draftoleEmitted: true マーカーを持つ', () => {
    const state = makeState<number>('s0');
    const handler = emitHandler(state.js.set('1'));
    expect((handler as { _draftoleEmitted: boolean })._draftoleEmitted).toBe(true);
  });

  it('.on() に渡すと transformer 経由パス（handler-body）が選択される（addEventListener ではない）', () => {
    const state = makeState<number>('s0');
    const btn = makeElementWithId('button', 'btn');

    const handler = emitHandler(state.js.set('5'));
    btn.on('click', handler as ArrowHandler<Event>);

    expect(btn._pending.length).toBeGreaterThan(0);
    expect(btn._pending[0]?.type).toBe('handler-body');
    // addEventListener コマンドではない
    expect(btn._pending[0]?.type).not.toBe('addEventListener');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: renderCommand レベルでの出力 byte-equality
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: renderCommand(handler-body) の出力が手書きレガシーパターンと byte-identical', () => {
  it('state.js.set() 由来の handler-body が手書き文字列と byte-identical な JS を生成する', () => {
    const state = makeState<number>('s0');
    const target = { kind: 'sel' as const, selector: '#my-btn' };

    const cmdAccessor: VanillaCommand = {
      type: 'handler-body',
      target,
      event: 'click',
      code: state.js.set('42'),
      params: [],
    };

    const cmdLegacy: VanillaCommand = {
      type: 'handler-body',
      target,
      event: 'click',
      code: `__draftole__.state('${state._runtimeId}').set(42)`,
      params: [],
    };

    expect(renderCommand(cmdAccessor)).toBe(renderCommand(cmdLegacy));
  });

  it('params あり: state.js.set() 由来の handler-body が手書きと同一の JS を生成する', () => {
    const state = makeState<string>('s1');
    const target = { kind: 'sel' as const, selector: '#input' };

    const cmdAccessor: VanillaCommand = {
      type: 'handler-body',
      target,
      event: 'input',
      code: state.js.set('e.target.value'),
      params: ['e'],
    };

    const cmdLegacy: VanillaCommand = {
      type: 'handler-body',
      target,
      event: 'input',
      code: `__draftole__.state('${state._runtimeId}').set(e.target.value)`,
      params: ['e'],
    };

    expect(renderCommand(cmdAccessor)).toBe(renderCommand(cmdLegacy));
  });

  it('renderCommand(handler-body) 出力が addEventListener 形式である', () => {
    const state = makeState<number>('s0');
    const target = { kind: 'sel' as const, selector: '#btn' };

    const cmd: VanillaCommand = {
      type: 'handler-body',
      target,
      event: 'click',
      code: state.js.set('0'),
      params: [],
    };

    const rendered = renderCommand(cmd);
    // addEventListener 形式
    expect(rendered).toContain('addEventListener("click"');
    expect(rendered).toContain("__draftole__.state('s0').set(0)");
    expect(rendered).toContain('document.querySelector("#btn")');
    // function キーワード形式（params 空 → 引数なし関数）
    expect(rendered).toContain('function()');
  });

  it('params あり: function(e) { ... } 形式で出力される', () => {
    const state = makeState<string>('s1');
    const target = { kind: 'sel' as const, selector: '#input' };

    const cmd: VanillaCommand = {
      type: 'handler-body',
      target,
      event: 'input',
      code: state.js.set('e.target.value'),
      params: ['e'],
    };

    const rendered = renderCommand(cmd);
    expect(rendered).toContain('function(e)');
    expect(rendered).toContain("__draftole__.state('s1').set(e.target.value)");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: E2E — FileExporter 経由での script.js 出力検証
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: E2E — FileExporter 経由で state.js.set() が script.js に正しく出力される', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'draftole-state-js-roundtrip-'));
  });

  afterAll(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('state.js.set() を emitHandler に渡したハンドラが script.js に正しい addEventListener を出力する', () => {
    const root = new Root();
    const count = root.state(0);

    // ボタン要素を構築（id 必須）
    const btn = new PairType('button');
    btn.addHtmlAttribute(HtmlAttribute.keyValue('id', 'reset-btn'));
    const btnWithMethods = btn as ElementWithMethods;

    // state.js.set() を emitHandler に渡す
    const handler = emitHandler(count.js.set('0'));
    btnWithMethods.on('click', handler as ArrowHandler<Event>);

    // Root ツリーに追加
    const bodyEl = new PairType('body');
    bodyEl.addChild(btn);
    const htmlEl = new PairType('html');
    htmlEl.addChild(bodyEl);
    root.addChild(htmlEl);

    const outDir = join(tmpDir, 'e2e-basic');
    mkdirSync(outDir, { recursive: true });
    const exporter = new FileExporter();
    exporter.exportFromRoot(root, outDir);

    const scriptJs = readFileSync(join(outDir, 'script.js'), 'utf-8');

    // プレリュードと state 初期化が含まれる
    expect(scriptJs).toContain('__draftole__');
    expect(scriptJs).toContain('initState("s0", 0)');

    // state.js.set() のコードが addEventListener 内に含まれる
    expect(scriptJs).toContain("__draftole__.state('s0').set(0)");
    expect(scriptJs).toContain('addEventListener("click"');
    expect(scriptJs).toContain('document.querySelector("#reset-btn")');
  });

  it('state.js.get() を含む複合 set() 式が script.js に正しく展開される', () => {
    const root = new Root();
    const todos = root.state<string[]>([]);

    const btn = new PairType('button');
    btn.addHtmlAttribute(HtmlAttribute.keyValue('id', 'add-btn'));
    const btnWithMethods = btn as ElementWithMethods;

    // todos.js.get() を使った複合式（手書きレガシーパターンを state.js.get() で再現）
    const addExpr = `[...${todos.js.get()}, 'new item']`;
    const handler = emitHandler(todos.js.set(addExpr));
    btnWithMethods.on('click', handler as ArrowHandler<Event>);

    const bodyEl = new PairType('body');
    bodyEl.addChild(btn);
    const htmlEl = new PairType('html');
    htmlEl.addChild(bodyEl);
    root.addChild(htmlEl);

    const outDir = join(tmpDir, 'e2e-complex');
    mkdirSync(outDir, { recursive: true });
    const exporter = new FileExporter();
    exporter.exportFromRoot(root, outDir);

    const scriptJs = readFileSync(join(outDir, 'script.js'), 'utf-8');

    // 複合式の検証
    expect(scriptJs).toContain("__draftole__.state('s0').get()");
    expect(scriptJs).toContain("__draftole__.state('s0').set(");
    expect(scriptJs).toContain("'new item'");
  });

  it('state.js.set() と手書き文字列で構成したハンドラが同一の script.js 出力を生成する', () => {
    // ケース A: state.js.set() を使ったハンドラ
    const rootA = new Root();
    const countA = rootA.state(0);
    const btnA = new PairType('button');
    btnA.addHtmlAttribute(HtmlAttribute.keyValue('id', 'btn'));
    const btnAWithMethods = btnA as ElementWithMethods;
    btnAWithMethods.on('click', emitHandler(countA.js.set('1')) as ArrowHandler<Event>);
    const bodyA = new PairType('body');
    bodyA.addChild(btnA);
    const htmlA = new PairType('html');
    htmlA.addChild(bodyA);
    rootA.addChild(htmlA);

    // ケース B: 手書き文字列を使ったハンドラ
    const rootB = new Root();
    rootB.state(0); // s0 を確保（initState を合わせる）
    const btnB = new PairType('button');
    btnB.addHtmlAttribute(HtmlAttribute.keyValue('id', 'btn'));
    const btnBWithMethods = btnB as ElementWithMethods;
    btnBWithMethods.on('click', emitHandler("__draftole__.state('s0').set(1)") as ArrowHandler<Event>);
    const bodyB = new PairType('body');
    bodyB.addChild(btnB);
    const htmlB = new PairType('html');
    htmlB.addChild(bodyB);
    rootB.addChild(htmlB);

    const outDirA = join(tmpDir, 'e2e-accessor');
    const outDirB = join(tmpDir, 'e2e-legacy');
    mkdirSync(outDirA, { recursive: true });
    mkdirSync(outDirB, { recursive: true });

    const exporter = new FileExporter();
    exporter.exportFromRoot(rootA, outDirA);
    exporter.exportFromRoot(rootB, outDirB);

    const jsA = readFileSync(join(outDirA, 'script.js'), 'utf-8');
    const jsB = readFileSync(join(outDirB, 'script.js'), 'utf-8');

    // 両者の script.js が byte-identical であること（Req 1.3 の核心）
    expect(jsA).toBe(jsB);
  });
});
