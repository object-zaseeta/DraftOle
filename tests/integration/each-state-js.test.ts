/**
 * Task 13.1: each 内の item.js.* がランタイムで正しく動作することを検証する
 *
 * 検証観点:
 *   Req 1.5: State accessor API が each テンプレートコールバックの `item` 引数にも
 *            利用可能であること。
 *   Req 1.3: each テンプレート内で `item.js.get()` / `item.js.set()` が生成する
 *            JS 文字列が手書きレガシーパターンと同一であること。
 *
 * テストの観点:
 *   これはコンパイル時/文字列レベルのテストである。
 *   1. each テンプレートの `item` が `.js` アクセサを持つ（TemplateStateImpl 経由）。
 *   2. `item.js.get()` が ".itemTemplate" パターンを含む文字列を返す。
 *   3. `item.js.set(expr)` が ".itemTemplate" パターンを含む文字列を返す。
 *   4. `emitHandler(item.js.set(expr))` を each テンプレート内の要素の `.on()` に渡すと
 *      handler-body コマンドが正しい code で積まれる。
 *   5. E2E: buildFactoryCode で生成された factory コードに item.js.set() 由来の
 *      addEventListener が含まれ、mock runtime で正しく実行される。
 *   6. E2E: FileExporter 経由で each バインディングが script.js に出力される。
 *
 * Requirements: 1.3, 1.5
 * Depends: Task 4.4 (completed)
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';

import { Root } from '../../src/html/elements/root.js';
import { PairType } from '../../src/html/elements/pair-type.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import { html as htmlTag, body as bodyTag, li, span, ul } from '../../src/html/tags/factories.js';
import { applyElementMixin, type ArrowHandler, type ElementMethods } from '../../src/js/vanilla/element-methods.js';
import { emitHandler } from '../../src/js/vanilla/emit-handler.js';
import { renderCommand, type VanillaCommand } from '../../src/js/vanilla/commands.js';
import { StateImpl } from '../../src/js/vanilla/state/state.js';
import { StateRegistry } from '../../src/js/vanilla/state/registry.js';
import { TemplateStateImpl } from '../../src/js/vanilla/state/template-derived-state.js';
import { buildFactoryCode, captureEachTemplate } from '../../src/js/vanilla/state/each-template.js';
import type { HtmlTag } from '../../src/html/elements/html-tag.js';
import { FileExporter } from '../../src/publisher/file-exporter.js';

// ─── 型エイリアス ──────────────────────────────────────────────────────────────

type ElementWithMethods = PairType & ElementMethods<PairType> & {
  _pending: VanillaCommand[];
};

type SpanWithMethods = ReturnType<typeof span> & ElementMethods<ReturnType<typeof span>>;

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeAll(() => {
  applyElementMixin(PairType.prototype as HtmlTag);
});

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function makeArrayState<T>(id: string): StateImpl<T[]> {
  const registry = new StateRegistry();
  return new StateImpl<T[]>(id, registry);
}

function makeElementWithId(tagName: string, id: string): ElementWithMethods {
  const el = new PairType(tagName);
  el.addHtmlAttribute(HtmlAttribute.keyValue('id', id));
  return el as ElementWithMethods;
}

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.5: each テンプレート内の item が .js アクセサを持つ
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.5: each テンプレート内の item が .js アクセサを持つ', () => {
  it('each テンプレートコールバックの item は StateJsAccessor を実装している', () => {
    const todos = makeArrayState<string>('s0');
    let capturedItem: StateImpl<string> | null = null;

    captureEachTemplate(todos, (item) => {
      capturedItem = item as StateImpl<string>;
      return li() as HtmlTag;
    });

    expect(capturedItem).not.toBeNull();
    const itemJs = (capturedItem as StateImpl<string>).js;
    expect(itemJs).toBeDefined();
    expect(typeof itemJs.get).toBe('function');
    expect(typeof itemJs.set).toBe('function');
    expect(typeof itemJs.update).toBe('function');
  });

  it('TemplateStateImpl の .js アクセサが存在する', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('s0', registry);
    expect(item.js).toBeDefined();
    expect(typeof item.js.get).toBe('function');
    expect(typeof item.js.set).toBe('function');
  });

  it('root.state().each() コールバックの item も .js アクセサを持つ', () => {
    const root = new Root();
    const items = root.state<string[]>([]);
    let capturedItem: StateImpl<string> | null = null;

    items.each((item) => {
      capturedItem = item as StateImpl<string>;
      return li() as HtmlTag;
    });

    expect(capturedItem).not.toBeNull();
    expect((capturedItem as StateImpl<string>).js).toBeDefined();
    expect(typeof (capturedItem as StateImpl<string>).js.get).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: item.js.get() が ".itemTemplate" パターンを含む文字列を返す
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: item.js.get() が正しい itemTemplate 形式の文字列を返す', () => {
  it('item.js.get() は "__draftole__.state(\'<arrayId>.itemTemplate\').get()" を返す', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('s0', registry);
    expect(item.js.get()).toBe("__draftole__.state('s0.itemTemplate').get()");
  });

  it('item.js.get() は __draftole__ を含む', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('todos', registry);
    expect(item.js.get()).toContain('__draftole__');
  });

  it('item.js.get() は ".itemTemplate" サフィックスを含む', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('s1', registry);
    expect(item.js.get()).toContain('s1.itemTemplate');
    expect(item.js.get()).toContain('.itemTemplate');
  });

  it('each テンプレートコールバックの item.js.get() が正しい形式を返す', () => {
    const todos = makeArrayState<string>('todos');
    let jsGet: string | null = null;

    captureEachTemplate(todos, (item) => {
      jsGet = item.js.get();
      return li() as HtmlTag;
    });

    expect(jsGet).toBe("__draftole__.state('todos.itemTemplate').get()");
  });

  it('異なる arrayId に対して異なる itemTemplate ID が生成される', () => {
    const r1 = new StateRegistry();
    const r2 = new StateRegistry();
    const item1 = new TemplateStateImpl<string>('s0', r1);
    const item2 = new TemplateStateImpl<string>('s1', r2);
    expect(item1.js.get()).not.toBe(item2.js.get());
    expect(item1.js.get()).toContain('s0.itemTemplate');
    expect(item2.js.get()).toContain('s1.itemTemplate');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: item.js.set(expr) が正しい文字列を返す
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: item.js.set(expr) が正しい itemTemplate 形式の文字列を返す', () => {
  it('item.js.set(expr) は "__draftole__.state(\'<arrayId>.itemTemplate\').set(<expr>)" を返す', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('s0', registry);
    expect(item.js.set('newValue')).toBe("__draftole__.state('s0.itemTemplate').set(newValue)");
  });

  it('item.js.set(expr) と手書きレガシーパターンが byte-identical', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('todos', registry);
    const expr = 'e.target.value';
    const legacy = `__draftole__.state('todos.itemTemplate').set(${expr})`;
    expect(item.js.set(expr)).toBe(legacy);
  });

  it('item.js.update(body) がアロー関数ラッパ形式を返す', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('s0', registry);
    expect(item.js.update("return __v + '!'")).toBe(
      "__draftole__.state('s0.itemTemplate').set((__v) => { return __v + '!' })",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: emitHandler(item.js.set(expr)) が handler-body コマンドを生成する
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: emitHandler(item.js.set(expr)) が each テンプレート内で正しい handler-body コマンドを生成する', () => {
  it('each コールバック内で item.js.set() を使った emitHandler が _pending に handler-body を積む', () => {
    const todos = makeArrayState<string>('todos');
    let capturedItemId: string | null = null;
    let pendingCommands: VanillaCommand[] = [];

    captureEachTemplate(todos, (item) => {
      capturedItemId = item._runtimeId;

      const btn = makeElementWithId('button', 'done-btn');
      const handler = emitHandler(item.js.set('"done"'));
      btn.on('click', handler as ArrowHandler<Event>);
      pendingCommands = [...btn._pending];

      return btn as HtmlTag;
    });

    // item._runtimeId は "<arrayId>.itemTemplate"
    expect(capturedItemId).toBe('todos.itemTemplate');

    // handler-body コマンドが積まれている
    expect(pendingCommands).toHaveLength(1);
    const cmd = pendingCommands[0];
    expect(cmd?.type).toBe('handler-body');
    if (cmd?.type === 'handler-body') {
      expect(cmd.code).toBe("__draftole__.state('todos.itemTemplate').set(\"done\")");
      expect(cmd.params).toEqual([]);
      expect(cmd.event).toBe('click');
    }
  });

  it('params あり: each 内の item.js.set() + params が handler-body に反映される', () => {
    const items = makeArrayState<string>('s0');
    let capturedCode: string | null = null;
    let capturedParams: readonly string[] | null = null;

    captureEachTemplate(items, (item) => {
      const inp = makeElementWithId('input', 'item-input');
      const handler = emitHandler(item.js.set('e.target.value'), ['e']);
      inp.on('input', handler as ArrowHandler<Event>);

      const cmd = inp._pending[0];
      if (cmd?.type === 'handler-body') {
        capturedCode = cmd.code;
        capturedParams = cmd.params;
      }
      return inp as HtmlTag;
    });

    expect(capturedCode).toBe("__draftole__.state('s0.itemTemplate').set(e.target.value)");
    expect(capturedParams).toEqual(['e']);
  });

  it('emitHandler(item.js.set()) と手書き文字列 emitHandler が同一の handler-body を生成する', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('s0', registry);
    const target = { kind: 'sel' as const, selector: '#btn' };

    const qAccessor: VanillaCommand[] = [];
    const qLegacy: VanillaCommand[] = [];

    const stubScope = (q: VanillaCommand[]) =>
      ({
        _emitHandlerBody(code: string, params: readonly string[]) {
          q.push({ type: 'handler-body', target, event: 'click', code, params });
        },
      }) as import('../../src/js/vanilla/script-scope.js').ScriptScope;

    emitHandler(item.js.set('"done"'))(stubScope(qAccessor));
    emitHandler("__draftole__.state('s0.itemTemplate').set(\"done\")")(stubScope(qLegacy));

    expect(qAccessor).toHaveLength(1);
    expect(qLegacy).toHaveLength(1);
    expect(qAccessor[0]).toEqual(qLegacy[0]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: renderCommand(handler-body) 出力が手書きと byte-identical
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: renderCommand で item.js.set() 由来の handler-body が手書きと byte-identical', () => {
  it('item.js.set() と手書きレガシー文字列が同一の renderCommand 出力を生成する', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('s0', registry);
    const target = { kind: 'closure-ref' as const, varName: '_e0' };

    const cmdAccessor: VanillaCommand = {
      type: 'handler-body',
      target,
      event: 'click',
      code: item.js.set('"done"'),
      params: [],
    };

    const cmdLegacy: VanillaCommand = {
      type: 'handler-body',
      target,
      event: 'click',
      code: "__draftole__.state('s0.itemTemplate').set(\"done\")",
      params: [],
    };

    expect(renderCommand(cmdAccessor)).toBe(renderCommand(cmdLegacy));
  });

  it('renderCommand 出力が _e0.addEventListener("click", ...) 形式である', () => {
    const registry = new StateRegistry();
    const item = new TemplateStateImpl<string>('todos', registry);
    const target = { kind: 'closure-ref' as const, varName: '_e0' };

    const cmd: VanillaCommand = {
      type: 'handler-body',
      target,
      event: 'click',
      code: item.js.set('"done"'),
      params: [],
    };

    const rendered = renderCommand(cmd);
    expect(rendered).toContain('_e0.addEventListener("click"');
    expect(rendered).toContain("__draftole__.state('todos.itemTemplate').set(\"done\")");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3, 1.5: E2E — buildFactoryCode が item.js.set() 由来の handler-body を含む
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3, 1.5: E2E — each factory コードに item.js.set() 由来のハンドラが含まれる', () => {
  function buildItemJsSetFactory() {
    const registry = new StateRegistry();
    const todos = new StateImpl<string[]>('todos', registry);

    const binding = captureEachTemplate(todos, (item) => {
      const liEl = li({ id: 'todo-li' });
      const spanEl = span({ id: 'todo-span' });
      (spanEl as SpanWithMethods).setText(item as never);

      const btnEl = makeElementWithId('button', 'done-btn');
      const handler = emitHandler(item.js.set('"done"'));
      btnEl.on('click', handler as ArrowHandler<Event>);

      liEl.addChild(spanEl);
      liEl.addChild(btnEl);
      return liEl as HtmlTag;
    });

    if (binding._snapshot.factoryCode === undefined && binding._snapshot._templateRoot !== undefined) {
      binding._snapshot.factoryCode = buildFactoryCode(binding._snapshot._templateRoot, {
        arrayStateId: todos._runtimeId,
        itemStateIdPattern: binding._snapshot.itemStateIdPattern,
      });
    }

    return { binding, todos };
  }

  it('factoryCode が item.js.set() 由来の addEventListener を含む', () => {
    const { binding } = buildItemJsSetFactory();
    const code = binding._snapshot.factoryCode;
    expect(code).toBeDefined();
    expect(code).toContain('addEventListener("click"');
    expect(code).toContain('__draftole__');
  });

  it('factoryCode が document.querySelector を含まない（closure factory 確認）', () => {
    const { binding } = buildItemJsSetFactory();
    const code = binding._snapshot.factoryCode;
    expect(code).toBeDefined();
    expect(code).not.toContain('document.querySelector');
  });

  it('item.js.get() 経由の bindText のみ使う each テンプレートの factoryCode が正しく生成される', () => {
    const registry = new StateRegistry();
    const items = new StateImpl<string[]>('items', registry);

    const binding = captureEachTemplate(items, (item) => {
      const liEl = li({ id: 'item-li' });
      const spanEl = span({ id: 'item-text' });
      (spanEl as SpanWithMethods).setText(item as never);
      liEl.addChild(spanEl);
      return liEl as HtmlTag;
    });

    if (binding._snapshot.factoryCode === undefined && binding._snapshot._templateRoot !== undefined) {
      binding._snapshot.factoryCode = buildFactoryCode(binding._snapshot._templateRoot, {
        arrayStateId: items._runtimeId,
        itemStateIdPattern: binding._snapshot.itemStateIdPattern,
      });
    }

    const code = binding._snapshot.factoryCode;
    expect(code).toBeDefined();
    expect(code).toContain('bindText');
    expect(code).toContain('__draftole__');
    expect(code).not.toContain('document.querySelector');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.5: E2E — FileExporter 経由での each バインディング出力検証
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.5: E2E — FileExporter 経由で each + item バインディングが script.js に出力される', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'draftole-each-state-js-'));
  });

  afterAll(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('each テンプレートを含む root から exportFromRoot すると script.js に __draftole__ と each 関連コードが含まれる', () => {
    const root = new Root();
    const items = root.state<string[]>(['a', 'b', 'c']);

    // each テンプレート: item のテキストを表示する span
    const eachBinding = items.each((item) => {
      const spanEl = span({ id: 'item-span' });
      (spanEl as SpanWithMethods).setText(item as never);
      return spanEl as HtmlTag;
    });

    const listEl = ul({ id: 'item-list' });
    (listEl as ElementWithMethods).appendChild(eachBinding as HtmlTag);

    const page = htmlTag({}, bodyTag({}, listEl));
    root.addChild(page);

    const outDir = join(tmpDir, 'each-basic');
    mkdirSync(outDir, { recursive: true });

    const exporter = new FileExporter();
    exporter.exportFromRoot(root, outDir);

    const scriptJs = readFileSync(join(outDir, 'script.js'), 'utf-8');

    // プレリュードが含まれる
    expect(scriptJs).toContain('__draftole__');
    // 配列 state の初期化が含まれる
    expect(scriptJs).toContain('initState("s0"');
    // each バインディングコード（bindArray または bindEach）が含まれる
    expect(scriptJs).toMatch(/bindArray|bindEach/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 1.3: mock runtime E2E
// — item.js.set() 由来の addEventListener が mock runtime で正しく動作する
// ─────────────────────────────────────────────────────────────────────────────

describe('Req 1.3: mock runtime E2E — item.js.set() 由来の addEventListener が動作する', () => {
  // 最小 DOM 実装
  interface MockEl {
    tagName: string;
    attributes: Record<string, string>;
    children: MockEl[];
    textContent: string;
    listeners: Record<string, Array<(e: unknown) => void>>;
    setAttribute(k: string, v: string): void;
    appendChild(c: MockEl): MockEl;
    removeChild(c: MockEl): MockEl;
    addEventListener(event: string, fn: (e: unknown) => void): void;
  }

  function makeEl(tagName: string): MockEl {
    const el: MockEl = {
      tagName,
      attributes: {},
      children: [],
      textContent: '',
      listeners: {},
      setAttribute(k, v) { el.attributes[k] = v; },
      appendChild(c) { el.children.push(c); return c; },
      removeChild(c) {
        const i = el.children.indexOf(c);
        if (i >= 0) el.children.splice(i, 1);
        return c;
      },
      addEventListener(event, fn) {
        if (el.listeners[event] === undefined) el.listeners[event] = [];
        el.listeners[event].push(fn);
      },
    };
    return el;
  }

  interface MockState {
    value: unknown;
    subs: Set<(v: unknown) => void>;
  }

  function createMockRuntime() {
    const states = new Map<string, MockState>();

    function ensure(id: string, initial: unknown): MockState {
      let e = states.get(id);
      if (e === undefined) {
        e = { value: initial, subs: new Set() };
        states.set(id, e);
      }
      return e;
    }

    function setValue(id: string, v: unknown): void {
      const e = states.get(id);
      if (e === undefined) throw new Error(`unknown state: ${id}`);
      if (e.value === v) return;
      e.value = v;
      for (const sub of e.subs) { sub(v); }
    }

    const rt = {
      initState(id: string, initial: unknown) { ensure(id, initial); },
      state(id: string) {
        const entry = ensure(id, undefined);
        return {
          get(): unknown { return entry.value; },
          set(v: unknown): void { setValue(id, v); },
          subscribe(fn: (v: unknown) => void): () => void {
            entry.subs.add(fn);
            fn(entry.value);
            return () => { entry.subs.delete(fn); };
          },
        };
      },
      bindText(el: MockEl, stateId: string) {
        rt.state(stateId).subscribe((v) => { el.textContent = String(v); });
      },
      bindArray(
        parent: MockEl,
        arrayStateId: string,
        factory: (itemId: string, idx: number, runtime: typeof rt) => MockEl,
      ) {
        rt.state(arrayStateId).subscribe((arrRaw) => {
          const arr = (arrRaw as unknown[]) ?? [];
          while (parent.children.length < arr.length) {
            const idx = parent.children.length;
            const slotId = `${arrayStateId}.item${idx}`;
            ensure(slotId, arr[idx]);
            const node = factory(slotId, idx, rt);
            parent.appendChild(node);
          }
          while (parent.children.length > arr.length) {
            const last = parent.children.at(-1);
            if (last !== undefined) parent.removeChild(last);
          }
          for (let i = 0; i < arr.length; i++) {
            const slotId = `${arrayStateId}.item${i}`;
            const e = states.get(slotId);
            if (e !== undefined && e.value !== arr[i]) setValue(slotId, arr[i]);
          }
        });
      },
    };
    return rt;
  }

  type MockRuntime = ReturnType<typeof createMockRuntime>;

  function compileFactory(
    code: string,
    document: { createElement: (t: string) => MockEl },
    runtime: MockRuntime,
  ): (itemId: string, idx: number, rt: MockRuntime) => MockEl {
    const sandbox = { document, __draftole__: runtime };
    return vm.runInNewContext(`(${code})`, sandbox) as (
      itemId: string,
      idx: number,
      rt: MockRuntime,
    ) => MockEl;
  }

  it('factory コードの addEventListener が mock runtime 上で各 li 要素に登録され、click で state が更新される', () => {
    // 設計上の注記:
    //   handler-body コマンドの `code` フィールドは buildFactoryCode の rewriteCommandTarget
    //   によって target（closure-ref）は書き換えられるが、code 文字列自体（stateId）は
    //   書き換えられない（bind-* 系コマンドのみ stateId の動的解決が行われる）。
    //   そのため factory 内の addEventListener の code は
    //   `__draftole__.state('todos.itemTemplate').set("done")` のまま出力される。
    //   これは意図した動作であり、ランタイム側で todos.itemTemplate state を更新する。
    //
    // このテストでは:
    //   1. factory が各 li に addEventListener を登録すること
    //   2. click ハンドラの code が item.js.set() 由来の正しい文字列であること
    //   3. ハンドラを発火すると __draftole__.state('todos.itemTemplate') が更新されること
    // を検証する。

    const registry = new StateRegistry();
    const todos = new StateImpl<string[]>('todos', registry);

    // item.js.set('"done"') を使った each テンプレート
    const binding = captureEachTemplate(todos, (item) => {
      const liEl = li({ id: 'todo-li' });
      const spanEl = span({ id: 'todo-span' });
      (spanEl as SpanWithMethods).setText(item as never);

      const btnEl = makeElementWithId('button', 'done-btn');
      const handler = emitHandler(item.js.set('"done"'));
      btnEl.on('click', handler as ArrowHandler<Event>);

      liEl.addChild(spanEl);
      liEl.addChild(btnEl);
      return liEl as HtmlTag;
    });

    // closure factory を生成
    if (binding._snapshot.factoryCode === undefined && binding._snapshot._templateRoot !== undefined) {
      binding._snapshot.factoryCode = buildFactoryCode(binding._snapshot._templateRoot, {
        arrayStateId: todos._runtimeId,
        itemStateIdPattern: binding._snapshot.itemStateIdPattern,
      });
    }

    const code = binding._snapshot.factoryCode;
    expect(code).toBeDefined();

    // factoryCode に addEventListener("click", ...) が含まれる
    expect(code).toContain('addEventListener("click"');
    // handler-body の code が item.js.set('"done"') 由来であること
    // （rewriteCommandTarget は handler-body の code を書き換えないため、
    //   todos.itemTemplate が stateId として残る）
    expect(code).toContain("__draftole__.state('todos.itemTemplate').set(\"done\")");

    // mock runtime でコンパイル・展開
    const runtime = createMockRuntime();
    const document = { createElement: (t: string) => makeEl(t) };
    const factory = compileFactory(code as string, document, runtime);

    // todos.itemTemplate state を事前に初期化（click ハンドラが state() を呼べるように）
    runtime.initState('todos.itemTemplate', undefined);
    runtime.initState('todos', ['first', 'second']);
    const mount = makeEl('ul');
    runtime.bindArray(mount, 'todos', factory);

    // 2 ノードが構築される
    expect(mount.children.length).toBe(2);
    const li0 = mount.children[0];
    const li1 = mount.children[1];
    expect(li0).toBeDefined();
    expect(li1).toBeDefined();

    // span の textContent が正しく設定されている
    expect(li0?.children[0]?.textContent).toBe('first');
    expect(li1?.children[0]?.textContent).toBe('second');

    // button に click リスナーが登録されている
    const btn0 = li0?.children[1];
    const clickListeners = btn0?.listeners['click'];
    expect(clickListeners).toBeDefined();
    expect(clickListeners?.length).toBeGreaterThan(0);

    // click リスナーを発火 → __draftole__.state('todos.itemTemplate').set("done") が実行される
    // handler-body の code は todos.itemTemplate stateId を使うため、
    // todos.itemTemplate state が "done" に更新される
    clickListeners?.[0]?.({});
    expect(runtime.state('todos.itemTemplate').get()).toBe('done');

    // 他のスロット state は独立している
    expect(runtime.state('todos.item0').get()).toBe('first');
    expect(runtime.state('todos.item1').get()).toBe('second');
  });

  it('item.js.get() 経由の bindText が mock runtime 上で textContent を正しく更新する', () => {
    const registry = new StateRegistry();
    const todos = new StateImpl<string[]>('todos', registry);

    // テキストバインディングのみの each テンプレート
    const binding = captureEachTemplate(todos, (item) => {
      const spanEl = span({ id: 'item-text' });
      (spanEl as SpanWithMethods).setText(item as never);
      return spanEl as HtmlTag;
    });

    if (binding._snapshot.factoryCode === undefined && binding._snapshot._templateRoot !== undefined) {
      binding._snapshot.factoryCode = buildFactoryCode(binding._snapshot._templateRoot, {
        arrayStateId: todos._runtimeId,
        itemStateIdPattern: binding._snapshot.itemStateIdPattern,
      });
    }

    const code = binding._snapshot.factoryCode;
    expect(code).toBeDefined();

    const runtime = createMockRuntime();
    const document = { createElement: (t: string) => makeEl(t) };
    const factory = compileFactory(code as string, document, runtime);

    runtime.initState('todos', ['alpha', 'beta', 'gamma']);
    const mount = makeEl('div');
    runtime.bindArray(mount, 'todos', factory);

    expect(mount.children.length).toBe(3);
    expect(mount.children[0]?.textContent).toBe('alpha');
    expect(mount.children[1]?.textContent).toBe('beta');
    expect(mount.children[2]?.textContent).toBe('gamma');

    // state 更新で textContent が変わる
    runtime.state('todos.item1').set('BETA');
    expect(mount.children[1]?.textContent).toBe('BETA');
    // 他は不変
    expect(mount.children[0]?.textContent).toBe('alpha');
    expect(mount.children[2]?.textContent).toBe('gamma');
  });
});
