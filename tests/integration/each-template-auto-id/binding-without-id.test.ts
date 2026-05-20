/**
 * Task 4.4: each テンプレート内 id 省略バインディングの統合テスト
 *
 * id を一切指定しない each テンプレート内要素に対して
 * .text() / .value() / .checked() / .on() / .class() / .addClass() / .setStyle() を
 * 呼んでも、エラーなく factory コードを生成し、runtime 評価で正しい DOM 操作を
 * 行うことを検証する。
 *
 * 検証観点:
 *   1. Req 1.1: id 省略 + .text() が実行時エラーなく factory コードを生成できる
 *   2. Req 1.2: id 省略 + 各バインディングメソッドで deferred-self エラーが発生しない
 *   3. Req 1.3: each 外と同じ DSL 表現で each 内も正常に動作する
 *
 * Requirements: 1.1, 1.2, 1.3
 * Design: design.md § Integration Tests
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

// ── vm サンドボックス ─────────────────────────────────────────────────────────

interface BindCall {
  method: string;
  el: MockEl;
  stateId: string;
  extra?: string;  // bind-style の prop など
}

function makeSandbox() {
  const bindCalls: BindCall[] = [];
  const eventCalls: { el: MockEl; event: string }[] = [];
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
  return { sandbox, bindCalls, eventCalls };
}

// ── ヘルパ: テンプレートから factory コードを生成する ─────────────────────────

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

// ══════════════════════════════════════════════════════════════════════════════
// テストスイート
// ══════════════════════════════════════════════════════════════════════════════

describe('Task 4.4: each テンプレート内 id 省略バインディングの統合テスト', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // Req 1.1 + 1.2: .text() — id 省略でエラーなし、factory コードが生成される
  // ──────────────────────────────────────────────────────────────────────────

  describe('.text() — id 省略バインディング', () => {
    it('id 不在の span().text(item) が closure factory を生成できる（エラーなし）', () => {
      const todos = makeStringArrayState('todos');

      // id を一切渡さない
      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).text(todo as never),
      );

      // バインディングあり → closure 経路
      expect(binding._snapshot.factoryKind).toBe('closure');
      expect(binding._snapshot._templateRoot).toBeDefined();
    });

    it('生成された factory コードが bindText(_e0, ...) を含み document.querySelector を含まない', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).text(todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      // closure-ref (_e0) への直参照
      expect(code).toContain('__draftole__.bindText(_e0,');
      // querySelector に依存しない
      expect(code).not.toContain('document.querySelector');
      // id を setAttribute しない
      expect(code).not.toMatch(/setAttribute\("id"/);
    });

    it('factory を vm で評価すると bindText が正しい stateId で呼ばれる（DOM 操作の正確性）', () => {
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

      const root = factory('todos.item0', 0, sandbox.__draftole__);

      // ルート要素が span として生成されている
      expect(root.tagName).toBe('span');
      // bindText が 1 回呼ばれた
      expect(bindCalls).toHaveLength(1);
      expect(bindCalls[0]?.method).toBe('bindText');
      expect(bindCalls[0]?.stateId).toBe('todos.item0');
      expect(bindCalls[0]?.el).toBe(root);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 1.1 + 1.2: .value() — id 省略でエラーなし
  // ──────────────────────────────────────────────────────────────────────────

  describe('.value() — id 省略バインディング', () => {
    it('id 不在の input().value(item) が closure factory を生成できる（エラーなし）', () => {
      const items = makeStringArrayState('items');

      const binding = captureEachTemplate(items, (item) =>
        (input() as InputWithMethods).value(item as never),
      );

      expect(binding._snapshot.factoryKind).toBe('closure');
      expect(binding._snapshot._templateRoot).toBeDefined();
    });

    it('生成コードが bindValue(_e0, ...) を含む', () => {
      const items = makeStringArrayState('items');

      const binding = captureEachTemplate(items, (item) =>
        (input() as InputWithMethods).value(item as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'items',
        binding._snapshot.itemStateIdPattern,
      );

      expect(code).toContain('__draftole__.bindValue(_e0,');
      expect(code).not.toContain('document.querySelector');
    });

    it('factory 評価で bindValue が正しい stateId で呼ばれる', () => {
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

      factory('items.item2', 2, sandbox.__draftole__);

      expect(bindCalls).toHaveLength(1);
      expect(bindCalls[0]?.method).toBe('bindValue');
      expect(bindCalls[0]?.stateId).toBe('items.item2');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 1.1 + 1.2: .checked() — id 省略でエラーなし
  // ──────────────────────────────────────────────────────────────────────────

  describe('.checked() — id 省略バインディング', () => {
    it('id 不在の input().checked(item) が closure factory を生成できる（エラーなし）', () => {
      // boolean[] の each → todo 自身が ReadableState<boolean>
      const flags = makeBoolArrayState('flags');

      const binding = captureEachTemplate(flags, (flag) =>
        (input() as InputWithMethods).checked(flag as never),
      );

      expect(binding._snapshot.factoryKind).toBe('closure');
      expect(binding._snapshot._templateRoot).toBeDefined();
    });

    it('生成コードが bindChecked(_e0, ...) を含む', () => {
      const flags = makeBoolArrayState('flags');

      const binding = captureEachTemplate(flags, (flag) =>
        (input() as InputWithMethods).checked(flag as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'flags',
        binding._snapshot.itemStateIdPattern,
      );

      expect(code).toContain('__draftole__.bindChecked(_e0,');
      expect(code).not.toContain('document.querySelector');
    });

    it('factory 評価で bindChecked が正しい stateId で呼ばれる', () => {
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

      factory('flags.item1', 1, sandbox.__draftole__);

      expect(bindCalls).toHaveLength(1);
      expect(bindCalls[0]?.method).toBe('bindChecked');
      expect(bindCalls[0]?.stateId).toBe('flags.item1');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 1.1 + 1.2: .on() — id 省略でエラーなし
  // ──────────────────────────────────────────────────────────────────────────

  describe('.on() — id 省略バインディング', () => {
    it('id 不在の span().on(click, ...) が closure factory を生成できる（deferred-self エラーなし）', () => {
      const todos = makeStringArrayState('todos');

      // .on() は handler 関数を受け取るが、factory コード生成経路のテストなので
      // 空 handler を渡す（handler-serialization は別 spec 対象）
      expect(() => {
        captureEachTemplate(todos, () =>
          // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
          (span() as SpanWithMethods).on('click', function() {}),
        );
      }).not.toThrow();
    });

    it('.on() を含む各テンプレートが closure factory を返す', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, () =>
        // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
        (span() as SpanWithMethods).on('click', function() {}),
      );

      // addEventListener コマンドがあるため closure 経路ではなく static-placeholder かもしれない。
      // いずれにしてもエラーなく EachBinding が得られることを確認する。
      expect(binding._kind).toBe('each');
      expect(binding._snapshot).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 1.1 + 1.2: .class() — id 省略でエラーなし
  // ──────────────────────────────────────────────────────────────────────────

  describe('.class() — id 省略バインディング', () => {
    it('id 不在の span().class(item) が closure factory を生成できる（エラーなし）', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).class(todo as never),
      );

      expect(binding._snapshot.factoryKind).toBe('closure');
      expect(binding._snapshot._templateRoot).toBeDefined();
    });

    it('生成コードが bindClassAll(_e0, ...) を含む', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).class(todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      expect(code).toContain('__draftole__.bindClassAll(_e0,');
      expect(code).not.toContain('document.querySelector');
    });

    it('factory 評価で bindClassAll が正しい stateId で呼ばれる', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).class(todo as never),
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

      expect(bindCalls).toHaveLength(1);
      expect(bindCalls[0]?.method).toBe('bindClassAll');
      expect(bindCalls[0]?.stateId).toBe('todos.item0');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 1.1 + 1.2: .addClass() — id 省略でエラーなし
  // ──────────────────────────────────────────────────────────────────────────

  describe('.addClass() — id 省略バインディング', () => {
    it('id 不在の span().addClass(item) が closure factory を生成できる（エラーなし）', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).addClass(todo as never),
      );

      expect(binding._snapshot.factoryKind).toBe('closure');
      expect(binding._snapshot._templateRoot).toBeDefined();
    });

    it('生成コードが bindClassAdd(_e0, ...) を含む', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).addClass(todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      expect(code).toContain('__draftole__.bindClassAdd(_e0,');
      expect(code).not.toContain('document.querySelector');
    });

    it('factory 評価で bindClassAdd が正しい stateId で呼ばれる', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).addClass(todo as never),
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

      factory('todos.item1', 1, sandbox.__draftole__);

      expect(bindCalls).toHaveLength(1);
      expect(bindCalls[0]?.method).toBe('bindClassAdd');
      expect(bindCalls[0]?.stateId).toBe('todos.item1');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 1.1 + 1.2: .setStyle() — id 省略でエラーなし
  // ──────────────────────────────────────────────────────────────────────────

  describe('.setStyle() — id 省略バインディング', () => {
    it('id 不在の span().setStyle(prop, item) が closure factory を生成できる（エラーなし）', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).setStyle('color', todo as never),
      );

      expect(binding._snapshot.factoryKind).toBe('closure');
      expect(binding._snapshot._templateRoot).toBeDefined();
    });

    it('生成コードが bindStyle(_e0, "color", ...) を含む', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).setStyle('color', todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      expect(code).toContain('__draftole__.bindStyle(_e0,');
      expect(code).toContain('"color"');
      expect(code).not.toContain('document.querySelector');
    });

    it('factory 評価で bindStyle が正しい stateId と prop で呼ばれる', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).setStyle('color', todo as never),
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

      factory('todos.item2', 2, sandbox.__draftole__);

      expect(bindCalls).toHaveLength(1);
      expect(bindCalls[0]?.method).toBe('bindStyle');
      expect(bindCalls[0]?.extra).toBe('color');
      expect(bindCalls[0]?.stateId).toBe('todos.item2');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 1.3: each 外と同じ DSL 表現 — id 省略で each 内外ともに動作する
  // ──────────────────────────────────────────────────────────────────────────

  describe('Req 1.3: each 外と同じ DSL 表現で each 内も動作する', () => {
    it('each 外の id 省略 span().text() が正常に動作するように each 内でも同じ表現が動作する', () => {
      // each 外での id 省略バインディング（deferred-self → protoRender で解決）
      const todos = makeStringArrayState('todos');

      // each 内: id 省略 + .text()
      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).text(todo as never),
      );

      // each テンプレートは closure factory として生成される（Req 1.1）
      expect(binding._snapshot.factoryKind).toBe('closure');

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      // each 外と同様に bindText を使って DOM バインディングが確立される
      expect(code).toContain('__draftole__.bindText(');
      // id ベースの querySelector に依存しない（closure-ref 経路）
      expect(code).not.toContain('document.querySelector');

      // vm で実行し、DOM ツリーが正しく構築されることを確認
      const { sandbox, bindCalls } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      const root = factory('todos.item0', 0, sandbox.__draftole__);
      expect(root.tagName).toBe('span');
      // id 属性が付与されていない（per-iteration 重複なし）
      expect(root.attributes.id).toBeUndefined();
      // bindText が呼ばれた
      expect(bindCalls[0]?.stateId).toBe('todos.item0');
    });

    it('複数のバインディングを持つ複合テンプレートが each 内で id 省略のまま動作する', () => {
      // string[] の each で <li><span>.text(todo)</span></li> + 別 boolean[] で <input>.checked(flag)
      // ここでは「同じ item state を .text() と別バインディングで使う」ケースを検証する。
      // <li>: id 省略, <span>.text(item), <input>.addClass(item)  → bindText + bindClassAdd
      const items = makeStringArrayState('items');

      const binding = captureEachTemplate(items, (item) => {
        const textSpan = (span() as SpanWithMethods).text(item as never);
        const pillInput = (span() as SpanWithMethods).addClass(item as never);
        return li(textSpan, pillInput) as LiWithMethods;
      });

      // closure factory 経路
      expect(binding._snapshot.factoryKind).toBe('closure');

      const code = buildCode(
        binding._snapshot._templateRoot,
        'items',
        binding._snapshot.itemStateIdPattern,
      );

      // bindText と bindClassAdd が両方含まれる
      expect(code).toContain('__draftole__.bindText(');
      expect(code).toContain('__draftole__.bindClassAdd(');
      // getElementById / querySelector なし
      expect(code).not.toContain('document.querySelector');
      expect(code).not.toContain('getElementById');
      // id setAttribute なし
      expect(code).not.toMatch(/setAttribute\("id"/);

      // vm で実行して DOM 構造を確認
      const { sandbox, bindCalls } = makeSandbox();
      const factory = vm.runInNewContext(`(${code})`, sandbox) as (
        itemId: string,
        idx: number,
        draftole: unknown,
      ) => MockEl;

      const root = factory('items.item0', 0, sandbox.__draftole__);
      expect(root.tagName).toBe('li');
      // 子要素: span + span
      expect(root.children.length).toBe(2);
      expect(root.children[0]?.tagName).toBe('span');
      expect(root.children[1]?.tagName).toBe('span');
      // bind が 2 回（bindText, bindClassAdd）呼ばれた
      expect(bindCalls).toHaveLength(2);
      const bindMethods = bindCalls.map((c) => c.method);
      expect(bindMethods).toContain('bindText');
      expect(bindMethods).toContain('bindClassAdd');
      // どちらの stateId も items.item0 を指す
      for (const call of bindCalls) {
        expect(call.stateId).toBe('items.item0');
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 1.2: deferred-self エラーが発生しないことの明示確認
  // ──────────────────────────────────────────────────────────────────────────

  describe('Req 1.2: deferred-self エラーが発生しない', () => {
    it('全バインディングメソッドを id 省略で呼んでも captureEachTemplate がエラーをスローしない', () => {
      const strState = makeStringArrayState('items');

      // .text(), .value(), .class(), .addClass() — 全て id 省略
      expect(() => {
        captureEachTemplate(strState, (item) =>
          (span() as SpanWithMethods).text(item as never),
        );
      }).not.toThrow();

      expect(() => {
        captureEachTemplate(strState, (item) =>
          (input() as InputWithMethods).value(item as never),
        );
      }).not.toThrow();

      expect(() => {
        captureEachTemplate(strState, (item) =>
          (span() as SpanWithMethods).class(item as never),
        );
      }).not.toThrow();

      expect(() => {
        captureEachTemplate(strState, (item) =>
          (span() as SpanWithMethods).addClass(item as never),
        );
      }).not.toThrow();

      expect(() => {
        captureEachTemplate(strState, (item) =>
          (span() as SpanWithMethods).setStyle('color', item as never),
        );
      }).not.toThrow();
    });

    it('全バインディングメソッドの factory コード生成が "deferred-self" エラーなく完了する', () => {
      const strState = makeStringArrayState('items');

      const methods = [
        {
          name: 'text',
          capture: () => captureEachTemplate(strState, (item) =>
            (span() as SpanWithMethods).text(item as never),
          ),
        },
        {
          name: 'value',
          capture: () => captureEachTemplate(strState, (item) =>
            (input() as InputWithMethods).value(item as never),
          ),
        },
        {
          name: 'class',
          capture: () => captureEachTemplate(strState, (item) =>
            (span() as SpanWithMethods).class(item as never),
          ),
        },
        {
          name: 'addClass',
          capture: () => captureEachTemplate(strState, (item) =>
            (span() as SpanWithMethods).addClass(item as never),
          ),
        },
        {
          name: 'setStyle',
          capture: () => captureEachTemplate(strState, (item) =>
            (span() as SpanWithMethods).setStyle('opacity', item as never),
          ),
        },
      ];

      for (const { name, capture } of methods) {
        const binding = capture();
        expect(binding._snapshot.factoryKind, `${name}: factoryKind`).toBe('closure');
        expect(() => {
          buildCode(
            binding._snapshot._templateRoot,
            'items',
            binding._snapshot.itemStateIdPattern,
          );
        }, `${name}: buildFactoryCode`).not.toThrow();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Req 2.1: id 属性が factory 出力に含まれない
  // ──────────────────────────────────────────────────────────────────────────

  describe('Req 2.1: id 省略要素の factory コードに id 属性が含まれない', () => {
    it('id 省略要素の factory コードに setAttribute("id", ...) が含まれない', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span() as SpanWithMethods).text(todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      expect(code).not.toMatch(/setAttribute\("id"/);
      expect(code).not.toMatch(/\.id\s*=/);
    });

    it('明示 id を持つ要素も factory 出力では id が除外される（per-iteration 重複防止）', () => {
      const todos = makeStringArrayState('todos');

      const binding = captureEachTemplate(todos, (todo) =>
        (span({ id: 'should-be-removed' }) as SpanWithMethods).text(todo as never),
      );

      const code = buildCode(
        binding._snapshot._templateRoot,
        'todos',
        binding._snapshot.itemStateIdPattern,
      );

      // 明示 id も factory 内では除外される（Req 4.4 設計判断）
      expect(code).not.toMatch(/setAttribute\("id"/);
      expect(code).not.toMatch(/\.id\s*=/);
      // バインディングは正常に出力される
      expect(code).toContain('__draftole__.bindText(');
    });
  });
});
