/**
 * Task 7.1: each closure factory 統合テスト
 *
 * 観測可能な完了:
 *   - mock runtime 環境（最小 DOM + 簡易 `__draftole__` 実装）で each テンプレートを
 *     3 アイテム展開し、state 更新が各 DOM ノードに正しく反映される
 *   - state コレクションへの append / remove / update が正しく反映される
 *   - 同じ each テンプレートを 2 箇所に展開した場合に互いに独立にバインドされる
 *   - 出力 factory コードに `document.querySelector` 文字列が含まれない
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 *
 * 設計メモ:
 *   - jsdom / happy-dom を依存に追加せず、テスト局所の最小 Element 実装で代用する。
 *     生成 factory が必要とする API は document.createElement / setAttribute /
 *     appendChild / removeChild / textContent / children / lastChild のみ。
 *   - `__draftole__` は本物の prelude（runtime/prelude.ts）を再利用せず、
 *     設計契約に最小限従うスタブを実装する：
 *       * state(id) → { get, set, subscribe }（subscribe 即時通知）
 *       * bindText(el, stateId) → state 購読 + el.textContent 更新
 *       * bindEach(parent, stateId, factory) → 配列差分による append/remove/update
 *     prelude 側 bindEach は factory(itemId, idx) の 2 引数で呼ぶ実装になっているが、
 *     6.1 で導入された closure factory のシグネチャは (arrayId, idx, draftole)。
 *     本タスクの mock runtime は closure factory のシグネチャ契約に従って
 *     factory(arrayStateId, idx, runtime) を呼ぶ。
 */

import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { li, ul } from '../../../src/html/tags/factories-data.js';
import { span } from '../../../src/html/tags/factories-structure.js';
import { buildFactoryCode, captureEachTemplate, type EachBindingWithSnapshot } from '../../../src/js/vanilla/state/each-template.js';
import { StateImpl } from '../../../src/js/vanilla/state/state.js';
import { StateRegistry } from '../../../src/js/vanilla/state/registry.js';
import { createStyle } from '../../../src/css/variables/css-shared-style.js';
import type { HtmlTag } from '../../../src/html/elements/html-tag.js';
import { resolveEachFactories } from '../../../src/html/elements/each-factory-resolver.js';
import { createDefaultRenderContext } from '../../../src/html/elements/render-context.js';

// ────────────────────────────────────────────────────────────
// 最小 DOM 実装
// ────────────────────────────────────────────────────────────

interface MockEl {
  tagName: string;
  attributes: Record<string, string>;
  children: MockEl[];
  textContent: string;
  readonly lastChild: MockEl | null;
  setAttribute(k: string, v: string): void;
  appendChild(c: MockEl): MockEl;
  removeChild(c: MockEl): MockEl;
}

function makeEl(tagName: string): MockEl {
  const el: MockEl = {
    tagName,
    attributes: {},
    children: [],
    textContent: '',
    get lastChild(): MockEl | null {
      return el.children.length === 0 ? null : (el.children[el.children.length - 1] as MockEl);
    },
    setAttribute(k, v) {
      el.attributes[k] = v;
    },
    appendChild(c) {
      el.children.push(c);
      return c;
    },
    removeChild(c) {
      const idx = el.children.indexOf(c);
      if (idx >= 0) el.children.splice(idx, 1);
      return c;
    },
  };
  return el;
}

function makeDocument(): { createElement: (t: string) => MockEl } {
  return { createElement: (t: string) => makeEl(t) };
}

// ────────────────────────────────────────────────────────────
// 簡易 `__draftole__` 実装
// ────────────────────────────────────────────────────────────

interface MockState {
  value: unknown;
  subs: Set<(v: unknown) => void>;
}

interface MockRuntime {
  initState(id: string, initial: unknown): void;
  state(id: string): {
    get(): unknown;
    set(v: unknown): void;
    subscribe(fn: (v: unknown) => void): () => void;
  };
  bindText(el: MockEl, stateId: string, transform?: (v: unknown) => string): void;
  bindValue(el: MockEl, stateId: string): void;
  bindClassAll(el: MockEl, stateId: string, transform?: (v: unknown) => string): void;
  bindClassAdd(el: MockEl, stateId: string, transform?: (v: unknown) => string): void;
  bindStyle(el: MockEl, prop: string, stateId: string, transform?: (v: unknown) => string): void;
  bindAttr(el: MockEl, attr: string, stateId: string, transform?: (v: unknown) => string): void;
  /**
   * bindArray: 配列 state を購読し、変化時に append/remove/update を反映する。
   * factory は closure factory（task 6.1）の契約に従い (arrayStateId, idx, runtime) で呼ぶ。
   */
  bindArray(parent: MockEl, arrayStateId: string, factory: (arrayId: string, idx: number, runtime: MockRuntime) => MockEl): void;
}

function createMockRuntime(): MockRuntime {
  const states = new Map<string, MockState>();

  function ensure(id: string, initial: unknown): MockState {
    let entry = states.get(id);
    if (entry === undefined) {
      entry = { value: initial, subs: new Set() };
      states.set(id, entry);
    }
    return entry;
  }
  function getOrThrow(id: string): MockState {
    const e = states.get(id);
    if (e === undefined) throw new Error(`unknown state: ${id}`);
    return e;
  }
  function setValue(id: string, v: unknown): void {
    const e = getOrThrow(id);
    if (e.value === v) return;
    e.value = v;
    // 同期通知（テスト局所の簡易実装）
    e.subs.forEach((sub) => sub(v));
  }

  const runtime: MockRuntime = {
    initState(id, initial) {
      ensure(id, initial);
    },
    state(id) {
      // unknown でも作る（each スロット動的生成のため）
      const entry = ensure(id, undefined);
      return {
        get(): unknown {
          return entry.value;
        },
        set(v: unknown): void {
          setValue(id, v);
        },
        subscribe(fn: (v: unknown) => void): () => void {
          entry.subs.add(fn);
          // 初回即時通知（prelude と同じ挙動）— テスト中は throw する
          fn(entry.value);
          return () => {
            entry.subs.delete(fn);
          };
        },
      };
    },
    bindText(el, stateId, transform) {
      runtime.state(stateId).subscribe((v) => {
        el.textContent = transform !== undefined ? transform(v) : String(v);
      });
    },
    bindValue(el, stateId) {
      runtime.state(stateId).subscribe((v) => {
        (el as { value: string }).value = String(v);
      });
    },
    bindClassAll(el, stateId, transform) {
      runtime.state(stateId).subscribe((v) => {
        el.attributes['class'] = transform !== undefined ? transform(v) : String(v);
      });
    },
    bindClassAdd(el, stateId, transform) {
      let prev = '';
      runtime.state(stateId).subscribe((v) => {
        const next = transform !== undefined ? transform(v) : String(v);
        const cur = (el.attributes['class'] ?? '').split(/\s+/).filter(Boolean);
        if (prev !== '' && prev !== next) {
          const i = cur.indexOf(prev);
          if (i >= 0) cur.splice(i, 1);
        }
        if (next !== '' && next !== prev && !cur.includes(next)) {
          cur.push(next);
        }
        el.attributes['class'] = cur.join(' ');
        prev = next;
      });
    },
    bindStyle(el, prop, stateId, transform) {
      runtime.state(stateId).subscribe((v) => {
        const val = transform !== undefined ? transform(v) : String(v);
        const styleAttr = el.attributes['style'] ?? '';
        // 単純実装：既存 prop を上書きしないままキー=値;を追記
        el.attributes['style'] = `${styleAttr}${prop}:${val};`;
      });
    },
    bindAttr(el, attr, stateId, transform) {
      runtime.state(stateId).subscribe((v) => {
        el.attributes[attr] = transform !== undefined ? transform(v) : String(v);
      });
    },
    bindArray(parent, arrayStateId, factory) {
      runtime.state(arrayStateId).subscribe((arrRaw) => {
        const arr = (arrRaw as unknown[]) ?? [];
        // append: 不足分を生成
        while (parent.children.length < arr.length) {
          const idx = parent.children.length;
          const slotId = `${arrayStateId}.item${idx}`;
          // スロット state を初期化（factory 内部の bindText 等が即時通知できるよう）
          ensure(slotId, arr[idx]);
          const itemId = `${arrayStateId}.item${idx}`;
          const node = factory(itemId, idx, runtime);
          parent.appendChild(node);
        }
        // remove: 余剰分を削除
        while (parent.children.length > arr.length) {
          const last = parent.lastChild;
          if (last !== null) parent.removeChild(last);
        }
        // update: 既存スロット state に新しい値を流す（同期通知）
        for (let i = 0; i < arr.length; i++) {
          const slotId = `${arrayStateId}.item${i}`;
          const e = states.get(slotId);
          if (e !== undefined && e.value !== arr[i]) {
            setValue(slotId, arr[i]);
          }
        }
      });
    },
  };
  return runtime;
}

// ────────────────────────────────────────────────────────────
// factory コード実行ヘルパ
// ────────────────────────────────────────────────────────────

function compileFactory(code: string, document: { createElement: (t: string) => MockEl }, runtime: MockRuntime): (arrayId: string, idx: number, draftole: MockRuntime) => MockEl {
  const sandbox = { document, __draftole__: runtime };
  return vm.runInNewContext(`(${code})`, sandbox) as (
    arrayId: string,
    idx: number,
    draftole: MockRuntime,
  ) => MockEl;
}

// ────────────────────────────────────────────────────────────
// シナリオ
// ────────────────────────────────────────────────────────────

describe('each closure factory 統合テスト（Task 7.1）', () => {
  function captureTodoEach() {
    const registry = new StateRegistry();
    const todos = new StateImpl<string[]>('todos', registry);
    const binding = captureEachTemplate(todos, (todo) => {
      // 各アイテムは li > span(text=todo)
      return li(span({ id: 'todo-text' }).setText(todo as never));
    });
    // closure 経路の factoryCode は render-phase（resolveEachFactories）で確定するため、
    // mock runtime テストでは template ルートから直接 buildFactoryCode を呼んで snapshot に注入する。
    if (binding._snapshot.factoryCode === undefined && binding._snapshot._templateRoot !== undefined) {
      binding._snapshot.factoryCode = buildFactoryCode(binding._snapshot._templateRoot, {
        arrayStateId: todos._runtimeId,
        itemStateIdPattern: binding._snapshot.itemStateIdPattern,
      });
    }
    return { registry, todos, binding };
  }

  it('Req 4.4: 出力 factory コードに `document.querySelector` 文字列が含まれない', () => {
    const { binding } = captureTodoEach();
    const code = binding._snapshot.factoryCode as string;
    expect(code).toBeDefined();
    expect(code).not.toContain('document.querySelector');
    expect(code).not.toContain('document.querySelectorAll');
  });

  it('Req 4.1, 4.2: mock runtime 環境で 3 アイテム展開し、各 DOM ノードに state 値が反映される', () => {
    const { binding } = captureTodoEach();
    const code = binding._snapshot.factoryCode as string;

    const runtime = createMockRuntime();
    const document = makeDocument();
    const factory = compileFactory(code, document, runtime);

    // 配列 state を初期化し、3 アイテムで bindArray
    runtime.initState('todos', ['a', 'b', 'c']);
    const mount = makeEl('ul');
    runtime.bindArray(mount, 'todos', factory);

    // 3 ノードが構築される
    expect(mount.children.length).toBe(3);
    expect(mount.children[0]?.tagName).toBe('li');
    // li > span（最初の子）に textContent が反映されている
    expect(mount.children[0]?.children[0]?.textContent).toBe('a');
    expect(mount.children[1]?.children[0]?.textContent).toBe('b');
    expect(mount.children[2]?.children[0]?.textContent).toBe('c');
  });

  it('Req 4.2: update（要素単独）で対応するノードのみが更新される（他は不変）', () => {
    const { binding } = captureTodoEach();
    const code = binding._snapshot.factoryCode as string;

    const runtime = createMockRuntime();
    const document = makeDocument();
    const factory = compileFactory(code, document, runtime);

    runtime.initState('todos', ['a', 'b', 'c']);
    const mount = makeEl('ul');
    runtime.bindArray(mount, 'todos', factory);

    // item1 のみ直接 set → 対応するノードだけが変わる
    runtime.state('todos.item1').set('B!');
    expect(mount.children[0]?.children[0]?.textContent).toBe('a');
    expect(mount.children[1]?.children[0]?.textContent).toBe('B!');
    expect(mount.children[2]?.children[0]?.textContent).toBe('c');
  });

  it('Req 4.2: append（配列拡張）で新しいノードが追加され、内容も反映される', () => {
    const { binding } = captureTodoEach();
    const code = binding._snapshot.factoryCode as string;

    const runtime = createMockRuntime();
    const document = makeDocument();
    const factory = compileFactory(code, document, runtime);

    runtime.initState('todos', ['a', 'b', 'c']);
    const mount = makeEl('ul');
    runtime.bindArray(mount, 'todos', factory);
    expect(mount.children.length).toBe(3);

    // append: 4 アイテムへ
    runtime.state('todos').set(['a', 'b', 'c', 'd']);
    expect(mount.children.length).toBe(4);
    expect(mount.children[3]?.children[0]?.textContent).toBe('d');
  });

  it('Req 4.2: remove（配列縮小）で末尾ノードが削除される', () => {
    const { binding } = captureTodoEach();
    const code = binding._snapshot.factoryCode as string;

    const runtime = createMockRuntime();
    const document = makeDocument();
    const factory = compileFactory(code, document, runtime);

    runtime.initState('todos', ['a', 'b', 'c']);
    const mount = makeEl('ul');
    runtime.bindArray(mount, 'todos', factory);
    expect(mount.children.length).toBe(3);

    // remove: 2 アイテムへ
    runtime.state('todos').set(['a', 'b']);
    expect(mount.children.length).toBe(2);
    expect(mount.children[0]?.children[0]?.textContent).toBe('a');
    expect(mount.children[1]?.children[0]?.textContent).toBe('b');
  });

  it('Req 4.2: update（配列内位置変更）で各ノードの内容が同期される', () => {
    const { binding } = captureTodoEach();
    const code = binding._snapshot.factoryCode as string;

    const runtime = createMockRuntime();
    const document = makeDocument();
    const factory = compileFactory(code, document, runtime);

    runtime.initState('todos', ['a', 'b', 'c']);
    const mount = makeEl('ul');
    runtime.bindArray(mount, 'todos', factory);

    // 全件入れ替え
    runtime.state('todos').set(['x', 'y', 'z']);
    expect(mount.children[0]?.children[0]?.textContent).toBe('x');
    expect(mount.children[1]?.children[0]?.textContent).toBe('y');
    expect(mount.children[2]?.children[0]?.textContent).toBe('z');
  });

  it('Req 4.3: 同じ each テンプレートを 2 箇所に展開した場合、互いに独立にバインドされる', () => {
    // 2 個の独立した runtime / 配列 state を用いて、同じ factoryCode を別々の mount に展開する
    // → 一方の更新が他方に波及しないことを検証する。
    const { binding } = captureTodoEach();
    const code = binding._snapshot.factoryCode as string;

    // mount A
    const runtimeA = createMockRuntime();
    const factoryA = compileFactory(code, makeDocument(), runtimeA);
    runtimeA.initState('todos', ['a1', 'a2', 'a3']);
    const mountA = makeEl('ul');
    runtimeA.bindArray(mountA, 'todos', factoryA);

    // mount B
    const runtimeB = createMockRuntime();
    const factoryB = compileFactory(code, makeDocument(), runtimeB);
    runtimeB.initState('todos', ['b1', 'b2', 'b3']);
    const mountB = makeEl('ul');
    runtimeB.bindArray(mountB, 'todos', factoryB);

    // 初期状態：両者は独立
    expect(mountA.children[0]?.children[0]?.textContent).toBe('a1');
    expect(mountB.children[0]?.children[0]?.textContent).toBe('b1');

    // A だけ更新
    runtimeA.state('todos').set(['a1*', 'a2*', 'a3*']);
    expect(mountA.children[0]?.children[0]?.textContent).toBe('a1*');
    // B には波及しない
    expect(mountB.children[0]?.children[0]?.textContent).toBe('b1');
    expect(mountB.children[1]?.children[0]?.textContent).toBe('b2');
    expect(mountB.children[2]?.children[0]?.textContent).toBe('b3');

    // B だけ append → A には影響なし
    runtimeB.state('todos').set(['b1', 'b2', 'b3', 'b4']);
    expect(mountB.children.length).toBe(4);
    expect(mountA.children.length).toBe(3);

    // 各 mount の DOM ノードは別インスタンス
    expect(mountA.children[0]).not.toBe(mountB.children[0]);
  });

  it('Req 4.3 (同一 runtime 内 2 mount): 同じ runtime / 同じ配列 state を 2 箇所にマウントしても、各 mount が独立した DOM ツリーを保持する', () => {
    // 同一 runtime + 同一 stateId をマウントすると state スロットを共有するため、
    // update は両 mount に同じ値が反映されるが、DOM ノード自体は別インスタンスである
    // ことを検証する（DOM の独立性 = Req 4.3 の中核）。
    const { binding } = captureTodoEach();
    const code = binding._snapshot.factoryCode as string;

    const runtime = createMockRuntime();
    const document = makeDocument();
    const factory = compileFactory(code, document, runtime);

    runtime.initState('todos', ['x', 'y', 'z']);
    const mount1 = makeEl('ul');
    const mount2 = makeEl('ul');
    runtime.bindArray(mount1, 'todos', factory);
    runtime.bindArray(mount2, 'todos', factory);

    // 双方 3 件
    expect(mount1.children.length).toBe(3);
    expect(mount2.children.length).toBe(3);
    // DOM ノードは別インスタンス
    expect(mount1.children[0]).not.toBe(mount2.children[0]);
    expect(mount1.children[0]?.children[0]).not.toBe(mount2.children[0]?.children[0]);
    // ただし state は共有 → 同じ値
    expect(mount1.children[0]?.children[0]?.textContent).toBe('x');
    expect(mount2.children[0]?.children[0]?.textContent).toBe('x');

    // update → 両 mount に反映される（state 共有の自然な帰結）
    runtime.state('todos.item0').set('X!');
    expect(mount1.children[0]?.children[0]?.textContent).toBe('X!');
    expect(mount2.children[0]?.children[0]?.textContent).toBe('X!');
  });

  // ────────────────────────────────────────────────────────────
  // 回帰: Bug B / Bug C
  // ────────────────────────────────────────────────────────────

  /**
   * `css: createStyle({...})` を含む each テンプレートを Root 経由で
   * render-phase まで通し、factoryCode に解決済み class が埋め込まれた
   * 状態にして binding を返す。E-6 / E-7 双方の起点として共有する。
   */
  function captureTodoEachWithCss(opts: { staticClass?: string; cssProps?: Record<string, string> } = {}): {
    binding: EachBindingWithSnapshot<HtmlTag>;
    factoryCode: string;
  } {
    // 注意: Root.addChild は FlushOrchestrator により _pending を scope に移送して
    // しまうため、resolveEachFactories からは bind-each cmd が見えなくなる。
    // テストでは scope を持たない素の HtmlTag (ul) を親にし、appendChild で
    // bind-each を _pending に積んだ上で resolveEachFactories(parent, ctx) を
    // 直接駆動する。
    const registry = new StateRegistry();
    const todosState = new StateImpl<string[]>('todos', registry);
    const styleObj = createStyle(opts.cssProps ?? { color: 'red' });

    // 各アイテム: li[class="<static>"][css=styleObj] > span(text=todo)
    const eachBinding = captureEachTemplate<string, HtmlTag>(todosState, (todo) => {
      const liAttrs: Record<string, unknown> = { css: styleObj };
      if (opts.staticClass !== undefined) {
        liAttrs['class'] = opts.staticClass;
      }
      return li(liAttrs as never).addChild(span({ id: 'todo-text' }).setText(todo as never));
    });

    // bind-each を持つ親 ul を構築（id 必須: appendChild が ElementTarget を要求するため）
    const list = ul({ id: 'todo-list' }).appendChild(eachBinding);

    // 親 tagPath を確定させる（Root を経由しないので手動で割り当てる）
    const listInternal = list as { _css: { tagPath: string; updateTagPath?: (p: string) => void } };
    if (typeof listInternal._css.updateTagPath === 'function') {
      listInternal._css.updateTagPath('ul[0]');
    } else {
      listInternal._css.tagPath = 'ul[0]';
    }

    // render-phase フックを直接駆動 → snapshot.factoryCode を確定
    const ctx = createDefaultRenderContext();
    resolveEachFactories(list as HtmlTag, ctx);

    const factoryCode = eachBinding._snapshot.factoryCode;
    if (factoryCode === undefined) {
      throw new Error('factoryCode was not resolved by render-phase hook');
    }
    return { binding: eachBinding, factoryCode };
  }

  it('E-6 (Bug B 回帰): css: createStyle で解決された class が factoryCode の setAttribute と全 mock DOM ノードに反映される', () => {
    const { factoryCode } = captureTodoEachWithCss({ cssProps: { color: 'red' } });

    // 1) factoryCode が `setAttribute("class", "<resolved>")` を含む
    const classMatch = factoryCode.match(/setAttribute\("class",\s*"([^"]+)"\)/);
    expect(classMatch).not.toBeNull();
    const resolvedClassAttr = classMatch![1]!;
    // resolveClassName はスコープクラス形式 `_xxxxxxxx_yyyyyyyy` を生成する
    expect(resolvedClassAttr).toMatch(/_[0-9a-f]{8}_[0-9a-f]{8}/);

    // 2) bindArray 展開後の各 DOM ノードの attributes['class'] に同 class が含まれる
    const runtime = createMockRuntime();
    const document = makeDocument();
    const factory = compileFactory(factoryCode, document, runtime);

    runtime.initState('todos', ['a', 'b', 'c']);
    const mount = makeEl('ul');
    runtime.bindArray(mount, 'todos', factory);

    expect(mount.children.length).toBe(3);
    for (let i = 0; i < 3; i++) {
      const cls = mount.children[i]?.attributes['class'];
      expect(cls).toBeDefined();
      expect(cls).toBe(resolvedClassAttr);
    }
    // 3) 複数アイテム間で全ノードの class が同一
    expect(mount.children[0]?.attributes['class']).toBe(mount.children[1]?.attributes['class']);
    expect(mount.children[1]?.attributes['class']).toBe(mount.children[2]?.attributes['class']);
  });

  it('E-6 (Bug B 回帰): 静的 class と css: 由来 class が空白区切りで factoryCode 出力にマージされる', () => {
    const { factoryCode } = captureTodoEachWithCss({ staticClass: 'static-li', cssProps: { color: 'blue' } });

    const classMatch = factoryCode.match(/setAttribute\("class",\s*"([^"]+)"\)/);
    expect(classMatch).not.toBeNull();
    const resolvedClassAttr = classMatch![1]!;
    const tokens = resolvedClassAttr.split(/\s+/).filter(Boolean);

    // 静的 class と css 由来 class の両方を含む（順序不問）
    expect(tokens).toContain('static-li');
    const scoped = tokens.filter((t) => /^_[0-9a-f]{8}_[0-9a-f]{8}$/.test(t));
    expect(scoped.length).toBeGreaterThanOrEqual(1);
    // マージは空白 1 文字で区切られる
    expect(resolvedClassAttr).toMatch(/\S+\s\S+/);

    // mock DOM ノードにも同じ class 文字列がそのまま反映される
    const runtime = createMockRuntime();
    const factory = compileFactory(factoryCode, makeDocument(), runtime);
    runtime.initState('todos', ['x', 'y']);
    const mount = makeEl('ul');
    runtime.bindArray(mount, 'todos', factory);
    expect(mount.children[0]?.attributes['class']).toBe(resolvedClassAttr);
    expect(mount.children[1]?.attributes['class']).toBe(resolvedClassAttr);
  });

  it('E-7 (Bug C 回帰): factoryCode は arrayId + ".item" を含まず itemId を直接参照する', () => {
    // captureTodoEach（既存パス）でも itemId シグネチャは満たされている前提
    const { binding } = captureTodoEach();
    const code = binding._snapshot.factoryCode as string;
    expect(code).toBeDefined();

    // arrayId + ".item" 連結が出力に含まれないこと（Bug C 防御）
    expect(code).not.toMatch(/arrayId\s*\+\s*"\.item"/);
    // factoryCode の引数および本体は itemId を参照する
    expect(code).toMatch(/^function\(itemId,\s*idx,\s*draftole\)/);
    expect(code).toContain('itemId');

    // mock runtime でスロット直接更新が対応 1 ノードのみに反映される（itemId バインディングが効いている）
    const runtime = createMockRuntime();
    const factory = compileFactory(code, makeDocument(), runtime);
    runtime.initState('todos', ['a', 'b', 'c']);
    const mount = makeEl('ul');
    runtime.bindArray(mount, 'todos', factory);

    runtime.state('todos.item1').set('B!');
    expect(mount.children[0]?.children[0]?.textContent).toBe('a');
    expect(mount.children[1]?.children[0]?.textContent).toBe('B!');
    expect(mount.children[2]?.children[0]?.textContent).toBe('c');

    // 配列拡張時にも新しい itemId スロットへ正しくバインドされる（既存 E-2 の延長）
    runtime.state('todos').set(['a', 'B!', 'c', 'd']);
    expect(mount.children.length).toBe(4);
    expect(mount.children[3]?.children[0]?.textContent).toBe('d');
    runtime.state('todos.item3').set('D!');
    expect(mount.children[3]?.children[0]?.textContent).toBe('D!');
  });

  // ────────────────────────────────────────────────────────────
  // Task 6.4: I-2 — CssManager 連携テスト
  //
  // each テンプレートに `css:` 属性を付けた場合、factoryExtraction の
  // protoRender と通常 protoRender の双方が走っても、テンプレートルートの
  // CssManager.renderCss() に該当スタイル定義が **1 回だけ** 含まれることを
  // 検証する（CssManager.registerTemplate の冪等契約を統合経路で確認）。
  //
  // _Requirements: 1.1, 1.4_
  // ────────────────────────────────────────────────────────────

  it('I-2 (Task 6.4): each + css の CssManager 出力に該当スタイルが 1 回だけ含まれる（factoryExtraction + 通常 protoRender 双方走行下で dedup）', () => {
    // captureTodoEachWithCss 内部で resolveEachFactories（factoryExtraction protoRender）を
    // 1 回呼んでおり、この時点で templateRoot._css に css 属性のテンプレートが登録される。
    const { binding } = captureTodoEachWithCss({ cssProps: { color: 'tomato' } });

    const templateRoot = binding._snapshot._templateRoot;
    expect(templateRoot).toBeDefined();
    const tplCss = (templateRoot as HtmlTag).css;

    // 1 回目（factoryExtraction で既に走った後）の renderCss を取得
    const firstOut = tplCss.renderCss();
    // CssManager は scoped CSS 形式（`._{hash} { ... }`）で出力する
    expect(firstOut).toContain('color: tomato;');

    // factoryExtraction protoRender を **再度** 呼んでも _pendingStyleTemplates は
    // 既に空であり、CssManager 側の registerTemplate も (tagPath, bodyHash) で
    // dedup されるため、同じスタイル定義が 2 回現れてはいけない。
    const factoryCtx2: RenderContext = { ...createDefaultRenderContext(), factoryExtraction: true };
    templateRoot!.protoRender(factoryCtx2);

    // 通常 protoRender（factoryExtraction なし）も走らせる
    const normalCtx: RenderContext = createDefaultRenderContext();
    templateRoot!.protoRender(normalCtx);

    const finalOut = tplCss.renderCss();
    // 出力長は 1 回目から増えていない（dedup されている）
    expect(finalOut).toBe(firstOut);

    // セレクタ `.<scopedClass> {` が **1 つだけ** 含まれることを確認
    const selectorMatches = finalOut.match(/\._[0-9a-f]{8}_[0-9a-f]{8}\s*\{/g) ?? [];
    expect(selectorMatches.length).toBe(1);

    // プロパティ宣言も 1 回だけ
    const colorOccurrences = finalOut.split('color: tomato;').length - 1;
    expect(colorOccurrences).toBe(1);
  });

  // ────────────────────────────────────────────────────────────
  // Task 6.5: I-3 — IdRegistry 抑止テスト
  //
  // factoryExtraction の protoRender が template 配下の id を IdRegistry に
  // 登録しないこと（同 id 衝突エラーが発生しないこと）を検証する。
  // 加えて parent 自身の id 自動付与は通常 protoRender で正しく動作することも
  // 確認する。
  //
  // _Requirements: 1.4, 2.1_
  // ────────────────────────────────────────────────────────────

  it('I-3 (Task 6.5): factoryExtraction protoRender は template 配下の id を IdRegistry に登録しない（衝突なし）', () => {
    // template 配下に bind-text を持つ要素（span）を含めた構成。
    // span は明示 id を持つため auto-id は走らないが、resolveEachFactories は
    // templateRoot.protoRender({ factoryExtraction: true }) を経由して template 全体を
    // 走査する。本テストでは:
    //  - factoryExtraction 経路を 2 回（resolveEachFactories を 2 回）走らせ、
    //    同 id 衝突が起きないこと（template 配下の id が registry に蓄積しない）
    //  - 通常 protoRender（factoryExtraction なし）を走らせても registry に
    //    template 配下の id が出現しないこと
    // を検証する。
    const registry = new StateRegistry();
    const todosState = new StateImpl<string[]>('todos', registry);

    const eachBinding = captureEachTemplate<string, HtmlTag>(todosState, (todo) => {
      // li > span(id='todo-text', setText=todo)
      return li({}).addChild(span({ id: 'todo-text' }).setText(todo as never));
    });

    // 親 ul は appendChild に必須の id を明示指定する。
    const list = ul({ id: 'todo-list' }).appendChild(eachBinding);

    // 親 tagPath を確定（Root を経由しないので手動で割り当てる）
    const listInternal = list as { _css: { tagPath: string; updateTagPath?: (p: string) => void } };
    if (typeof listInternal._css.updateTagPath === 'function') {
      listInternal._css.updateTagPath('ul[0]');
    } else {
      listInternal._css.tagPath = 'ul[0]';
    }

    const ctx = createDefaultRenderContext();

    // 1) factoryExtraction 経路: resolveEachFactories は内部で
    //    templateRoot.protoRender({ factoryExtraction: true }) を呼ぶ。
    //    template 配下の auto-id 生成と IdRegistry.register は抑止される必要がある。
    expect(() => resolveEachFactories(list as HtmlTag, ctx)).not.toThrow();

    // 2) 同一 ctx.registry で 2 回目の resolveEachFactories を呼んでも、
    //    template 配下の id が登録されていれば衝突エラーになるが、抑止されていれば衝突しない。
    //    （加えて factoryCode 確定済みのため idempotent に早期 return される）
    expect(() => resolveEachFactories(list as HtmlTag, ctx)).not.toThrow();

    // 3) 通常 protoRender（factoryExtraction なし）を走らせる。
    //    親 ul は明示 id を持つため auto-id 生成は走らない。
    //    template 配下の id が registry に登録されていなければ、protoRender 内部で
    //    走る resolveEachFactories（idempotent path）も衝突を起こさない。
    expect(() => (list as HtmlTag).protoRender(ctx)).not.toThrow();

    // 4) 観測: ctx.registry に template 配下の tagPath 由来の id が残っていない。
    //    template root（li）の tagPath は resolveEachFactories により `ul[0].each0` が注入される。
    const templateRoot = eachBinding._snapshot._templateRoot;
    expect(templateRoot).toBeDefined();
    const templateTagPath = (templateRoot as { _css: { tagPath: string } })._css.tagPath;
    expect(templateTagPath).toBe('ul[0].each0');

    // template root（li）の tagPath 由来の auto-id 候補は登録されていない
    const liWouldBeId = ctx.resolver.resolveId(templateTagPath);
    expect(ctx.registry.has(liWouldBeId)).toBe(false);

    // template 配下要素（span）の明示 id 'todo-text' も registry には登録されていない
    // （明示 id は IdRegistry には載らない仕様 — 抑止と独立に false が期待値）
    expect(ctx.registry.has('todo-text')).toBe(false);

    // 親 ul の明示 id 'todo-list' も同様（明示 id は registry 非登録）
    expect(ctx.registry.has('todo-list')).toBe(false);
  });

  it('I-3 (Task 6.5): parent 自身のクラス自動付与は通常 protoRender で動作する（template 抑止と独立）', () => {
    // 親 ul に明示 id を **付けず**、_pending に直接合成コマンドを push して
    // クラス自動付与条件（_pending.length > 0 + tagPath 設定済み + 明示 id なし）を整える。
    // id 属性ではなく class 属性でクラスセレクタが発行されることを確認する。
    const parent = ul({});
    (parent as { _pending: Array<{ type: string; code: string }> })._pending.push({
      type: 'expr',
      code: '/* synthetic for auto-class test */',
    });

    const parentInternal = parent as { _css: { tagPath: string; updateTagPath?: (p: string) => void } };
    if (typeof parentInternal._css.updateTagPath === 'function') {
      parentInternal._css.updateTagPath('ul[0]');
    } else {
      parentInternal._css.tagPath = 'ul[0]';
    }

    const ctx = createDefaultRenderContext();
    const html = (parent as HtmlTag).protoRender(ctx);

    // id 属性は付与されず、class 属性でクラスセレクタが付与される
    const expectedClass = ctx.resolver.resolveClassName('ul[0]');
    expect(html).not.toContain('id=');
    expect(html).toContain(`class="${expectedClass}"`);
  });
});
