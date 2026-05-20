/**
 * each-template.ts の `buildFactoryCode`（closure 形式）スモークテスト。
 *
 * タスク 5.1: factory コード生成の単体テスト（U-1, U-3, U-4, U-5 含む）
 * タスク 2.2: id 除外パス（emitAttributesExcludingId）+ deferred-self 書換パス
 *
 * - U-1: `buildFactoryCode` の戻り文字列が `function(itemId, idx, draftole) {` で始まり、
 *   本体に `arrayId` 識別子を含まない。
 * - U-3: `templateHasBindings` の closure / static 切替が requirements 通り
 *   （バインディング有無で分岐）。
 * - U-4: closure 経路で `snapshot.factoryCode === undefined && _templateRoot !== undefined`、
 *   static 経路で逆になる。
 * - U-5: `buildStaticFactoryCode` の出力が修正前と byte-equal（既存スナップショット）。
 *
 * Requirements: 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4
 * Task 2.2 Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.3, 4.4, 5.1, 5.3
 */

import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { li } from '../../../../src/html/tags/factories-data.js';
import { span } from '../../../../src/html/tags/factories-structure.js';
import {
  buildFactoryCode,
  captureEachTemplate,
} from '../../../../src/js/vanilla/state/each-template.js';
import { StateRegistry } from '../../../../src/js/vanilla/state/registry.js';
import { StateImpl } from '../../../../src/js/vanilla/state/state.js';

describe('buildFactoryCode (closure 形式 — 5.1)', () => {
  // ────────────────────────────────────────────────────────────
  // U-1: シグネチャが itemId 引数で始まり body に arrayId を含まない
  // ────────────────────────────────────────────────────────────
  it('U-1: 戻り文字列が `function(itemId, idx, draftole) {` で始まり、body に arrayId 識別子を含まない', () => {
    const tag = li(span());
    const code = buildFactoryCode(tag, {
      arrayStateId: 'todos',
      itemStateIdPattern: 'todos.item{i}',
    });
    // シグネチャ
    expect(code).toMatch(/^function\s*\(itemId,\s*idx,\s*draftole\)\s*\{/);
    // body に arrayId 識別子が含まれない（識別子境界で照合）
    expect(code).not.toMatch(/\barrayId\b/);
    expect(code).toContain('return _e0;');
  });

  it('document.createElement を含み、document.querySelector を含まない', () => {
    const tag = li(span());
    const code = buildFactoryCode(tag, {
      arrayStateId: 'todos',
      itemStateIdPattern: 'todos.item{i}',
    });
    expect(code).toContain('document.createElement(');
    expect(code).not.toContain('document.querySelector');
  });

  it('インナー要素ごとに _e0, _e1, ... のローカル変数が採番される', () => {
    const tag = li(span(), span());
    const code = buildFactoryCode(tag, {
      arrayStateId: 'todos',
      itemStateIdPattern: 'todos.item{i}',
    });
    expect(code).toContain('const _e0 = document.createElement("li")');
    expect(code).toContain('const _e1 = document.createElement("span")');
    expect(code).toContain('const _e2 = document.createElement("span")');
    expect(code).toContain('_e0.appendChild(_e1)');
    expect(code).toContain('_e0.appendChild(_e2)');
  });

  it('node:vm 上で factory を実行し Element ツリーを返す（最小 document モック）', () => {
    const tag = li(span());
    const code = buildFactoryCode(tag, {
      arrayStateId: 'todos',
      itemStateIdPattern: 'todos.item{i}',
    });
    type MockEl = {
      tagName: string;
      attributes: Record<string, string>;
      children: MockEl[];
      setAttribute(k: string, v: string): void;
      appendChild(c: MockEl): MockEl;
    };
    const makeEl = (tagName: string): MockEl => ({
      tagName,
      attributes: {},
      children: [],
      setAttribute(k, v) { this.attributes[k] = v; },
      appendChild(c) { this.children.push(c); return c; },
    });
    const sandbox = {
      document: { createElement: (t: string) => makeEl(t) },
      __draftole__: {
        state: () => ({ subscribe: () => {} }),
        bindText: () => {},
        bindValue: () => {},
        bindClassAll: () => {},
        bindClassAdd: () => {},
        bindStyle: () => {},
        bindAttr: () => {},
      },
    };
    const factory = vm.runInNewContext(`(${code})`, sandbox) as (
      itemId: string,
      idx: number,
      draftole: unknown,
    ) => MockEl;
    // 新シグネチャ: 第1引数は itemId（例: "todos.item0"）
    const root = factory('todos.item0', 0, sandbox.__draftole__);
    expect(root).toBeDefined();
    expect(root.tagName).toBe('li');
    expect(root.children.length).toBe(1);
    expect(root.children[0]?.tagName).toBe('span');
  });

  // ────────────────────────────────────────────────────────────
  // U-3 / U-4: templateHasBindings の closure / static 切替
  //   （ build-phase 直後の snapshot 状態を観測する）
  // ────────────────────────────────────────────────────────────
  it('U-3/U-4: バインディング有テンプレートは closure 経路 — factoryCode === undefined && _templateRoot !== undefined', () => {
    const registry = new StateRegistry();
    const todos = new StateImpl<string[]>('todos', registry);
    const binding = captureEachTemplate(todos, (item) =>
      li({ id: 'each-li' }, span({ id: 'each-span' }).setText(item as never)),
    );
    expect(binding._snapshot.factoryKind).toBe('closure');
    expect(binding._snapshot.factoryCode).toBeUndefined();
    expect(binding._snapshot._templateRoot).toBeDefined();
  });

  it('U-3/U-4: バインディング無テンプレートは static-placeholder 経路 — factoryCode は string && _templateRoot === undefined', () => {
    const registry = new StateRegistry();
    const todos = new StateImpl<string[]>('todos', registry);
    const binding = captureEachTemplate(todos, () => li(span()));
    expect(binding._snapshot.factoryKind).toBe('static-placeholder');
    expect(typeof binding._snapshot.factoryCode).toBe('string');
    expect(binding._snapshot._templateRoot).toBeUndefined();
    const code = binding._snapshot.factoryCode as string;
    expect(code).toContain('function(itemId, idx)');
    expect(code).toContain('return _root;');
  });

  // ────────────────────────────────────────────────────────────
  // タスク 4.2: bind-value の transform 対応 / bind-checked の追加
  //   Requirements: 1.3
  // ────────────────────────────────────────────────────────────

  it('4.2-A: bind-value + transform が buildFactoryCode 出力に transform を含む', () => {
    // テンプレート HtmlTag を作り _pending に bind-value+transform を直接注入する
    const tag = li();
    tag._pending.push({
      type: 'bind-value',
      target: { kind: 'closure-ref', varName: '_e0' },
      stateId: 'todos.itemTemplate',
      transform: { code: 'function(v){return String(v);}' },
    });
    const code = buildFactoryCode(tag, {
      arrayStateId: 'todos',
      itemStateIdPattern: 'todos.item{i}',
    });
    // bind-value に transform が付いているので第3引数として渡される
    expect(code).toContain('__draftole__.bindValue(');
    expect(code).toContain('function(v){return String(v);}');
    // 引数区切りカンマの確認（transform が追加されていること）
    expect(code).toMatch(/bindValue\(_e0,\s*itemId,\s*function\(v\)/);
  });

  it('4.2-B: bind-value + transform なし は第2引数のみ（既存動作の回帰なし）', () => {
    const tag = li();
    tag._pending.push({
      type: 'bind-value',
      target: { kind: 'closure-ref', varName: '_e0' },
      stateId: 'todos.itemTemplate',
    });
    const code = buildFactoryCode(tag, {
      arrayStateId: 'todos',
      itemStateIdPattern: 'todos.item{i}',
    });
    expect(code).toContain('__draftole__.bindValue(_e0, itemId);');
  });

  it('4.2-C: bind-checked (transform なし) が bindChecked コードを生成する', () => {
    const tag = li();
    tag._pending.push({
      type: 'bind-checked',
      target: { kind: 'closure-ref', varName: '_e0' },
      stateId: 'todos.itemTemplate',
    });
    const code = buildFactoryCode(tag, {
      arrayStateId: 'todos',
      itemStateIdPattern: 'todos.item{i}',
    });
    expect(code).toContain('__draftole__.bindChecked(_e0, itemId);');
  });

  it('4.2-D: bind-checked + transform が bindChecked コードに transform を含む', () => {
    const tag = li();
    tag._pending.push({
      type: 'bind-checked',
      target: { kind: 'closure-ref', varName: '_e0' },
      stateId: 'todos.itemTemplate',
      transform: { code: 'function(v){return Boolean(v);}' },
    });
    const code = buildFactoryCode(tag, {
      arrayStateId: 'todos',
      itemStateIdPattern: 'todos.item{i}',
    });
    expect(code).toContain('__draftole__.bindChecked(');
    expect(code).toContain('function(v){return Boolean(v);}');
    expect(code).toMatch(/bindChecked\(_e0,\s*itemId,\s*function\(v\)/);
  });

  it('4.2-E: templateHasBindings は bind-checked を含むテンプレートを closure 経路に分類する', () => {
    const registry = new StateRegistry();
    const todos = new StateImpl<boolean[]>('todos', registry);
    // bind-checked コマンドを持つテンプレートは closure 経路になるべき
    const binding = captureEachTemplate(todos, (item) => {
      const tag = li();
      // バインディングを模擬するため _pending に bind-checked を直接注入
      tag._pending.push({
        type: 'bind-checked',
        target: { kind: 'deferred-self' },
        stateId: (item as { _runtimeId: string })._runtimeId,
      });
      return tag;
    });
    // bind-checked があるので closure 経路
    expect(binding._snapshot.factoryKind).toBe('closure');
    expect(binding._snapshot.factoryCode).toBeUndefined();
    expect(binding._snapshot._templateRoot).toBeDefined();
  });

  // ────────────────────────────────────────────────────────────
  // U-5: buildStaticFactoryCode の出力 byte-equality（既知テンプレ）
  // ────────────────────────────────────────────────────────────
  it('U-5: buildStaticFactoryCode の既知テンプレ出力が byte-equal（inline snapshot）', () => {
    const registry = new StateRegistry();
    const todos = new StateImpl<string[]>('todos', registry);
    const binding = captureEachTemplate(todos, () =>
      li({ id: 'each-todo-item' }, span({ class: 'label' })),
    );
    expect(binding._snapshot.factoryKind).toBe('static-placeholder');
    const code = binding._snapshot.factoryCode as string;
    // baseline 文字列との byte-equal 比較（修正前と同一）
    expect(code).toMatchInlineSnapshot(`
      "function(itemId, idx) {
          const _root = document.createElement("li");
          _root.id = "each-todo-item";
          const _root_c0 = document.createElement("span");
          _root_c0.className = "label";
          _root.appendChild(_root_c0);
          return _root;
        }"
    `);
  });

  // ────────────────────────────────────────────────────────────
  // タスク 2.2: id 除外パス（emitAttributesExcludingId）
  // Requirements: 2.1, 2.3, 3.3, 4.4
  // ────────────────────────────────────────────────────────────

  describe('2.2-A: id 属性除外（emitAttributesExcludingId）', () => {
    it('2.2-A-1: 明示 id を持つ tag の factory コードに setAttribute("id", ...) が含まれない', () => {
      // closure 経路: id 属性を持つ tag で buildFactoryCode を呼ぶ
      // 期待: 出力に setAttribute("id", ...) が含まれない
      const tag = li({ id: 'each-todo-item' });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // id 属性は factory コードから除外される（per-iteration 重複防止）
      expect(code).not.toContain('setAttribute("id"');
      expect(code).not.toMatch(/\.id\s*=/);
    });

    it('2.2-A-2: id 以外の属性（class, data-*）は factory コードに含まれる', () => {
      const tag = li({ id: 'each-item', class: 'todo-item' });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // id は除外
      expect(code).not.toContain('setAttribute("id"');
      // class は保持
      expect(code).toContain('setAttribute("class"');
      expect(code).toContain('"todo-item"');
    });

    it('2.2-A-3: id を持たない tag はそのまま出力（除外しても影響なし）', () => {
      const tag = li({ class: 'item' });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).not.toContain('setAttribute("id"');
      expect(code).toContain('setAttribute("class"');
    });

    it('2.2-A-4: 子要素の id も除外される', () => {
      const tag = li(span({ id: 'child-span', class: 'label' }));
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // 子要素の id も factory コードから除外
      expect(code).not.toContain('setAttribute("id"');
      // 子要素の class は保持
      expect(code).toContain('setAttribute("class"');
      expect(code).toContain('"label"');
    });
  });

  // ────────────────────────────────────────────────────────────
  // タスク 2.2: deferred-self → closure-ref 書換パス
  // Requirements: 1.1, 1.3, 1.4, 2.4, 5.1, 5.3
  // ────────────────────────────────────────────────────────────

  describe('2.2-B: deferred-self → closure-ref 書換', () => {
    it('2.2-B-1: deferred-self target を持つ bind-text コマンドが _eN への closure-ref に書き換わる', () => {
      // _pending に deferred-self target の bind-text を持つ tag
      const tag = li();
      tag._pending.push({
        type: 'bind-text',
        target: { kind: 'deferred-self' },
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // deferred-self は _e0 への closure-ref に書き換わる
      // bindText の第1引数は _e0（querySelector ではない）
      expect(code).toContain('__draftole__.bindText(');
      // _e0 を直接参照している（document.querySelector ではない）
      expect(code).not.toContain('document.querySelector');
      // deferred-self のまま renderCommand に渡されてエラーにならない
      // （エラーが出ないこと自体が検証）
    });

    it('2.2-B-2: deferred-self target を持つ bind-checked コマンドが closure-ref に書き換わる', () => {
      const tag = li();
      tag._pending.push({
        type: 'bind-checked',
        target: { kind: 'deferred-self' },
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).toContain('__draftole__.bindChecked(');
      expect(code).not.toContain('document.querySelector');
    });

    it('2.2-B-3: deferred-self target を持つ setProp コマンドが _eN.textContent = ... 形式で出力される', () => {
      const tag = li();
      tag._pending.push({
        type: 'setProp',
        target: { kind: 'deferred-self' },
        prop: 'textContent',
        expr: '"hello"',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // _e0.textContent = "hello"; 形式で出力される
      expect(code).toContain('_e0.textContent = "hello";');
      expect(code).not.toContain('document.querySelector');
    });

    it('2.2-B-4: deferred-self target を持つ bind-text コマンドの vm 実行でエラーが発生しない', () => {
      // Req 1.1 / 5.1 / 5.3: 内部実装エラー（deferred-self target must be resolved）が出ない
      const tag = li();
      tag._pending.push({
        type: 'bind-text',
        target: { kind: 'deferred-self' },
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });

      type MockEl = {
        tagName: string;
        attributes: Record<string, string>;
        children: MockEl[];
        setAttribute(k: string, v: string): void;
        appendChild(c: MockEl): MockEl;
      };
      const makeEl = (tagName: string): MockEl => ({
        tagName,
        attributes: {},
        children: [],
        setAttribute(k, v) { this.attributes[k] = v; },
        appendChild(c) { this.children.push(c); return c; },
      });
      const bindCalls: { el: MockEl; stateId: string }[] = [];
      const sandbox = {
        document: { createElement: (t: string) => makeEl(t) },
        __draftole__: {
          bindText: (el: MockEl, stateId: string) => { bindCalls.push({ el, stateId }); },
          bindValue: () => {},
          bindChecked: () => {},
          bindClassAll: () => {},
          bindClassAdd: () => {},
          bindStyle: () => {},
          bindAttr: () => {},
        },
      };

      // エラーなく factory が実行できること（Req 5.1, 5.3）
      expect(() => {
        const factory = vm.runInNewContext(`(${code})`, sandbox) as (
          itemId: string,
          idx: number,
          draftole: unknown,
        ) => MockEl;
        factory('todos.item0', 0, sandbox.__draftole__);
      }).not.toThrow();

      // bindText が _e0 要素に対して呼ばれていること
      expect(bindCalls.length).toBe(1);
      expect(bindCalls[0]?.stateId).toBe('todos.item0');
    });

    it('2.2-B-5: sel target（明示 id 由来）も closure-ref に書き換えられる（factory 内ローカル変数参照）', () => {
      // each-template factory コード生成では、sel target も closure-ref に書き換える。
      // 要素は document.createElement で生成され _eN に格納されるため、
      // document.querySelector を使う必要がない（Req 1.4, 4.4）。
      const tag = li();
      tag._pending.push({
        type: 'bind-text',
        target: { kind: 'sel', selector: '#existing-el' },
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // sel target は closure-ref（_e0）に書き換えられる
      expect(code).not.toContain('document.querySelector');
      expect(code).toContain('__draftole__.bindText(');
    });
  });
});
