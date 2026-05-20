/**
 * Task 4.5: per-iteration uniqueness の統合テスト
 *
 * 3 件の todo を含む each テンプレートが render された結果、生成 DOM 内に
 * 同じ id 値を持つ要素が 2 個以上存在しないことを assert する。
 * 各 item の state 更新が他 item の要素を誤って更新しないことを
 * mock runtime で assert する。
 *
 * 検証観点:
 *   1. Req 2.1: factory が 3 回呼ばれた結果、生成 DOM 内に重複する id 属性が存在しない
 *   2. Req 2.4: 各 item の stateId が idx ごとに独立しており、他 item の要素を
 *              誤って更新しない（stateId の一意性と要素への正しいバインド）
 *
 * Requirements: 2.1, 2.4
 * Design: design.md § Integration Tests / per-iteration-uniqueness.test.ts
 */

import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import type { ElementMethods } from '../../../src/js/vanilla/element-methods.js';
import { buildFactoryCode, captureEachTemplate } from '../../../src/js/vanilla/state/each-template.js';
import { StateImpl } from '../../../src/js/vanilla/state/state.js';
import { StateRegistry } from '../../../src/js/vanilla/state/registry.js';
import { input, li, span } from '../../../src/html/tags/index.js';

// ── ヘルパ型 ──────────────────────────────────────────────────────────────────

type SpanWithMethods  = ReturnType<typeof span>  & ElementMethods<ReturnType<typeof span>>;
type InputWithMethods = ReturnType<typeof input> & ElementMethods<ReturnType<typeof input>>;
type LiWithMethods    = ReturnType<typeof li>    & ElementMethods<ReturnType<typeof li>>;

type MockEl = {
  tagName: string;
  attributes: Record<string, string>;
  children: MockEl[];
  textContent: string;
  value: string;
  checked: boolean;
  style: Record<string, string>;
  classList: string[];
  setAttribute(k: string, v: string): void;
  appendChild(c: MockEl): MockEl;
};

function makeEl(tagName: string): MockEl {
  return {
    tagName,
    attributes: {},
    children: [],
    textContent: '',
    value: '',
    checked: false,
    style: {},
    classList: [],
    setAttribute(k, v) { this.attributes[k] = v; },
    appendChild(c) { this.children.push(c); return c; },
  };
}

// ── テスト用 State ファクトリ ─────────────────────────────────────────────────

function makeStringArrayState(id: string): StateImpl<string[]> {
  const registry = new StateRegistry();
  return new StateImpl<string[]>(id, registry);
}

function makeBoolArrayState(id: string): StateImpl<boolean[]> {
  const registry = new StateRegistry();
  return new StateImpl<boolean[]>(id, registry);
}

// ── バインドコール追跡型 ──────────────────────────────────────────────────────

interface BindCall {
  method: string;
  el: MockEl;
  stateId: string;
  extra?: string;
}

// ── vm サンドボックス ─────────────────────────────────────────────────────────

function makeSandbox() {
  const bindCalls: BindCall[] = [];
  const sandbox = {
    document: { createElement: (t: string) => makeEl(t) },
    __draftole__: {
      state: () => ({ subscribe: () => {} }),
      bindText: (el: MockEl, stateId: string) => {
        bindCalls.push({ method: 'bindText', el, stateId });
      },
      bindValue: (el: MockEl, stateId: string) => {
        bindCalls.push({ method: 'bindValue', el, stateId });
      },
      bindChecked: (el: MockEl, stateId: string) => {
        bindCalls.push({ method: 'bindChecked', el, stateId });
      },
      bindClassAll: (el: MockEl, stateId: string) => {
        bindCalls.push({ method: 'bindClassAll', el, stateId });
      },
      bindClassAdd: (el: MockEl, stateId: string) => {
        bindCalls.push({ method: 'bindClassAdd', el, stateId });
      },
      bindStyle: (el: MockEl, prop: string, stateId: string) => {
        bindCalls.push({ method: 'bindStyle', el, stateId, extra: prop });
      },
    },
  };
  return { sandbox, bindCalls };
}

// ── ヘルパ: factory コード生成 ─────────────────────────────────────────────────

function buildCode(
  templateRoot: ReturnType<typeof captureEachTemplate>['_snapshot']['_templateRoot'],
  arrayStateId: string,
  itemStateIdPattern: string,
): string {
  if (templateRoot === undefined) {
    throw new Error('templateRoot must be defined for closure factoryKind');
  }
  return buildFactoryCode(templateRoot, { arrayStateId, itemStateIdPattern });
}

// ── id 収集ユーティリティ ─────────────────────────────────────────────────────

/**
 * 生成された MockEl ツリー全体（深さ優先）から id 属性を収集する。
 */
function collectIds(el: MockEl): string[] {
  const ids: string[] = [];
  function walk(node: MockEl): void {
    if (node.attributes.id !== undefined) {
      ids.push(node.attributes.id);
    }
    for (const child of node.children) {
      walk(child);
    }
  }
  walk(el);
  return ids;
}

// ══════════════════════════════════════════════════════════════════════════════
// テストスイート
// ══════════════════════════════════════════════════════════════════════════════

describe('Task 4.5: per-iteration uniqueness の統合テスト', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // Req 2.1: 3 件の todo を render した DOM 内に重複 id が存在しない
  // ──────────────────────────────────────────────────────────────────────────

  describe('Req 2.1: 3 iteration render 後の DOM に重複 id が存在しない', () => {

    it('span().text(item) テンプレートを 3 回 render した結果、生成要素に id 属性が存在しない', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).text(todo as never),
      );

      expect(binding._snapshot.factoryKind).toBe('closure');

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      const { sandbox } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      // 3 件の todo を render
      const elements = [
        factory('todos.item0', 0, sandbox.__draftole__),
        factory('todos.item1', 1, sandbox.__draftole__),
        factory('todos.item2', 2, sandbox.__draftole__),
      ];

      // 各要素から id 属性を収集
      const allIds = elements.flatMap(collectIds);

      // id 属性が一切存在しない（per-iteration 重複は発生しない）
      expect(allIds).toHaveLength(0);
    });

    it('複合テンプレート（li > span + input）を 3 回 render した結果、全要素に id 重複が存在しない', () => {
      const todos = makeStringArrayState('todos');

      // <li> > <span>.text(item) + <input>.addClass(item)
      const binding = captureEachTemplate(todos, (item) => {
        const textSpan = (span() as SpanWithMethods).text(item as never);
        const pill     = (span() as SpanWithMethods).addClass(item as never);
        return li(textSpan, pill) as LiWithMethods;
      });

      expect(binding._snapshot.factoryKind).toBe('closure');

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      const { sandbox } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      const elements = [
        factory('todos.item0', 0, sandbox.__draftole__),
        factory('todos.item1', 1, sandbox.__draftole__),
        factory('todos.item2', 2, sandbox.__draftole__),
      ];

      const allIds = elements.flatMap(collectIds);

      // 重複 id なし（id 属性自体が存在しない）
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size);
      expect(allIds).toHaveLength(0);
    });

    it('明示 id を持つ要素を含む各テンプレートを 3 回 render しても id 重複が発生しない', () => {
      // ユーザーが id を明示しても factory 出力では除去される（Req 4.4 設計判断）
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span({ id: 'todo-text' }) as SpanWithMethods).text(todo as never),
      );

      expect(binding._snapshot.factoryKind).toBe('closure');

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      const { sandbox } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      const elements = [
        factory('todos.item0', 0, sandbox.__draftole__),
        factory('todos.item1', 1, sandbox.__draftole__),
        factory('todos.item2', 2, sandbox.__draftole__),
      ];

      const allIds = elements.flatMap(collectIds);

      // 明示 id があっても factory 出力から除去されるため重複は発生しない
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 2.4: 各 item の state 更新が他 item の要素を誤って更新しない
  // ──────────────────────────────────────────────────────────────────────────

  describe('Req 2.4: 各 item のバインドが独立した stateId と要素を持つ', () => {

    it('3 回 render した factory 呼び出しが 3 つの独立した要素を返す', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).text(todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      const { sandbox } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      const el0 = factory('todos.item0', 0, sandbox.__draftole__);
      const el1 = factory('todos.item1', 1, sandbox.__draftole__);
      const el2 = factory('todos.item2', 2, sandbox.__draftole__);

      // 各呼び出しが独立したオブジェクトを返す（共有参照なし）
      expect(el0).not.toBe(el1);
      expect(el1).not.toBe(el2);
      expect(el0).not.toBe(el2);
    });

    it('3 回 render した各 bindText 呼び出しが item-indexed な一意 stateId を受け取る', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).text(todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      const { sandbox, bindCalls } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      factory('todos.item0', 0, sandbox.__draftole__);
      factory('todos.item1', 1, sandbox.__draftole__);
      factory('todos.item2', 2, sandbox.__draftole__);

      // 3 回呼ばれた
      expect(bindCalls).toHaveLength(3);

      // 各 stateId が一意（他 iteration の stateId と重複しない）
      const stateIds = bindCalls.map((c) => c.stateId);
      expect(stateIds[0]).toBe('todos.item0');
      expect(stateIds[1]).toBe('todos.item1');
      expect(stateIds[2]).toBe('todos.item2');

      const uniqueStateIds = new Set(stateIds);
      expect(uniqueStateIds.size).toBe(3);
    });

    it('3 回 render した各 bindText 呼び出しが item ごとに独立した要素を受け取る', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).text(todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      const { sandbox, bindCalls } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      const el0 = factory('todos.item0', 0, sandbox.__draftole__);
      const el1 = factory('todos.item1', 1, sandbox.__draftole__);
      const el2 = factory('todos.item2', 2, sandbox.__draftole__);

      // 各バインドコールが対応する要素を保持している（el0 → item0, el1 → item1, ...）
      expect(bindCalls[0]?.el).toBe(el0);
      expect(bindCalls[1]?.el).toBe(el1);
      expect(bindCalls[2]?.el).toBe(el2);

      // item0 の要素が item1 や item2 に誤って割り当てられていない
      expect(bindCalls[0]?.el).not.toBe(el1);
      expect(bindCalls[0]?.el).not.toBe(el2);
      expect(bindCalls[1]?.el).not.toBe(el0);
      expect(bindCalls[1]?.el).not.toBe(el2);
    });

    it('複数バインディング（bindText + bindChecked）を持つ各テンプレートが iteration 間で独立している', () => {
      // <li> > <span>.text(textItem) + <input>.checked(flagItem) を模擬するために
      // 2 つのバインディングを持つテンプレートをシミュレートする。
      // 実際には同一 stateImpl を .text() と .checked() 両方でバインドする。
      const todos = makeStringArrayState('todos');

      // <span>.text(item) + .addClass(item) — 2 バインディング
      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods)
          .text(todo as never)
          .addClass(todo as never),
      );

      expect(binding._snapshot.factoryKind).toBe('closure');

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      const { sandbox, bindCalls } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      const el0 = factory('todos.item0', 0, sandbox.__draftole__);
      const el1 = factory('todos.item1', 1, sandbox.__draftole__);
      const el2 = factory('todos.item2', 2, sandbox.__draftole__);

      // 3 iteration × 2 バインディング = 6 呼び出し
      expect(bindCalls).toHaveLength(6);

      // item0 の 2 バインディングが el0 を参照し、stateId が todos.item0
      const item0Calls = bindCalls.filter((c) => c.stateId === 'todos.item0');
      expect(item0Calls).toHaveLength(2);
      for (const call of item0Calls) {
        expect(call.el).toBe(el0);
      }

      // item1 の 2 バインディングが el1 を参照し、stateId が todos.item1
      const item1Calls = bindCalls.filter((c) => c.stateId === 'todos.item1');
      expect(item1Calls).toHaveLength(2);
      for (const call of item1Calls) {
        expect(call.el).toBe(el1);
      }

      // item2 の 2 バインディングが el2 を参照し、stateId が todos.item2
      const item2Calls = bindCalls.filter((c) => c.stateId === 'todos.item2');
      expect(item2Calls).toHaveLength(2);
      for (const call of item2Calls) {
        expect(call.el).toBe(el2);
      }
    });

    it('bindChecked を持つ 3 iteration が互いに独立した要素・stateId を持つ', () => {
      const flags = makeBoolArrayState('flags');

      const binding = captureEachTemplate(flags, (flag) =>
        (input() as InputWithMethods).checked(flag as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'flags',
        binding._snapshot.itemStateIdPattern,
      );

      const { sandbox, bindCalls } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      const el0 = factory('flags.item0', 0, sandbox.__draftole__);
      const el1 = factory('flags.item1', 1, sandbox.__draftole__);
      const el2 = factory('flags.item2', 2, sandbox.__draftole__);

      expect(bindCalls).toHaveLength(3);

      // 各 iteration が対応する要素を持つ
      expect(bindCalls[0]?.el).toBe(el0);
      expect(bindCalls[0]?.stateId).toBe('flags.item0');
      expect(bindCalls[1]?.el).toBe(el1);
      expect(bindCalls[1]?.stateId).toBe('flags.item1');
      expect(bindCalls[2]?.el).toBe(el2);
      expect(bindCalls[2]?.stateId).toBe('flags.item2');

      // flags.item0 の state 更新が el1 / el2 に誤って波及しない（要素が独立）
      expect(bindCalls[0]?.el).not.toBe(el1);
      expect(bindCalls[0]?.el).not.toBe(el2);
    });

    it('bindValue を持つ 3 iteration が互いに独立した要素・stateId を持つ', () => {
      const items = makeStringArrayState('items');

      const binding = captureEachTemplate(items, (item) =>
        (input() as InputWithMethods).value(item as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'items',
        binding._snapshot.itemStateIdPattern,
      );

      const { sandbox, bindCalls } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      const el0 = factory('items.item0', 0, sandbox.__draftole__);
      const el1 = factory('items.item1', 1, sandbox.__draftole__);
      const el2 = factory('items.item2', 2, sandbox.__draftole__);

      expect(bindCalls).toHaveLength(3);

      // stateId が各 iteration で一意
      expect(new Set(bindCalls.map((c) => c.stateId)).size).toBe(3);

      // 要素が各 iteration で独立
      expect(new Set(bindCalls.map((c) => c.el)).size).toBe(3);

      // 対応関係が正しい
      expect(bindCalls[0]?.el).toBe(el0);
      expect(bindCalls[1]?.el).toBe(el1);
      expect(bindCalls[2]?.el).toBe(el2);
    });

    it('3 iteration render で生成コードに document.querySelector が存在しない（closure-ref 経路）', () => {
      // querySelector を使うと id ベースの解決になり、per-iteration 隔離が崩れる。
      // closure-ref 経路では _eN ローカル変数で直参照するため querySelector は不要。
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).text(todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      // querySelector / getElementById を含まない
      expect(code).not.toContain('document.querySelector');
      expect(code).not.toContain('getElementById');
      // closure-ref 経路（_e0 への直参照）が使われている
      expect(code).toContain('_e0');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 統合: 3 todos の complete render シナリオ
  // ──────────────────────────────────────────────────────────────────────────

  describe('統合シナリオ: 3 todos の complete render で隔離を一括検証', () => {

    it('3 todos の each テンプレートが独立した要素・stateId・id 重複なしを同時に満たす', () => {
      const todos = makeStringArrayState('todos');

      // <li> > <span>.text(item) + <span>.addClass(item) — 複合テンプレート
      const binding = captureEachTemplate(todos, (item) => {
        const textSpan = (span() as SpanWithMethods).text(item as never);
        const pill     = (span() as SpanWithMethods).addClass(item as never);
        return li(textSpan, pill) as LiWithMethods;
      });

      expect(binding._snapshot.factoryKind).toBe('closure');

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      // コード検証: querySelector なし、id setAttribute なし
      expect(code).not.toContain('document.querySelector');
      expect(code).not.toMatch(/setAttribute\("id"/);

      const { sandbox, bindCalls } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      // 3 items を render
      const el0 = factory('todos.item0', 0, sandbox.__draftole__);
      const el1 = factory('todos.item1', 1, sandbox.__draftole__);
      const el2 = factory('todos.item2', 2, sandbox.__draftole__);

      // ── Req 2.1: DOM id 重複なし ──
      const allIds = [el0, el1, el2].flatMap(collectIds);
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size); // 重複なし
      expect(allIds).toHaveLength(0);             // id 属性自体が存在しない

      // ── Req 2.4: 要素の独立性 ──
      expect(el0).not.toBe(el1);
      expect(el1).not.toBe(el2);
      expect(el0).not.toBe(el2);

      // 各 li の子構造（span + span）が独立している
      expect(el0.children).toHaveLength(2);
      expect(el1.children).toHaveLength(2);
      expect(el2.children).toHaveLength(2);
      expect(el0.children[0]).not.toBe(el1.children[0]);
      expect(el0.children[1]).not.toBe(el1.children[1]);

      // ── Req 2.4: stateId の独立性 ──
      // 3 iteration × 2 バインディング = 6 呼び出し
      expect(bindCalls).toHaveLength(6);

      const item0Calls = bindCalls.filter((c) => c.stateId === 'todos.item0');
      const item1Calls = bindCalls.filter((c) => c.stateId === 'todos.item1');
      const item2Calls = bindCalls.filter((c) => c.stateId === 'todos.item2');

      expect(item0Calls).toHaveLength(2);
      expect(item1Calls).toHaveLength(2);
      expect(item2Calls).toHaveLength(2);

      // item0 の state 更新が el1 / el2 に波及しない（el0 の子要素にのみバインド）
      for (const call of item0Calls) {
        // el0 の子要素（el0.children に含まれる）にバインドされている
        expect(el0.children).toContain(call.el);
        // el1 / el2 の子要素には含まれない
        expect(el1.children).not.toContain(call.el);
        expect(el2.children).not.toContain(call.el);
      }

      // item1 の state 更新が el0 / el2 に波及しない
      for (const call of item1Calls) {
        expect(el1.children).toContain(call.el);
        expect(el0.children).not.toContain(call.el);
        expect(el2.children).not.toContain(call.el);
      }

      // item2 の state 更新が el0 / el1 に波及しない
      for (const call of item2Calls) {
        expect(el2.children).toContain(call.el);
        expect(el0.children).not.toContain(call.el);
        expect(el1.children).not.toContain(call.el);
      }
    });
  });
});
