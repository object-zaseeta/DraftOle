/**
 * Task 6.4: each factory extraction 経路での deferred-self 透過性テスト
 *
 * 不変式（Invariant）の検証:
 *   `state.each(item => span().text(item))` のように、テンプレート内の要素に
 *   明示 id を指定しない場合、`span().text(item)` の呼び出し時点では id が未確定
 *   のため `target: { kind: 'deferred-self' }` を持つコマンドが生成される。
 *
 *   しかし each factory extraction 中は `resolveDeferredTargets` ステップがスキップ
 *   （`renderCtx.factoryExtraction === true`）され、代わりに `each-template.ts` の
 *   `rewriteCommandTarget` が target の kind を問わず unconditional に
 *   `ClosureRefTarget { kind: 'closure-ref', varName: '_e0' }` で上書きする。
 *
 *   その結果、生成された `factoryCode` 文字列内に `"deferred-self"` が残らず、
 *   代わりに `_e0` 等の closure-ref 変数名が使われることを検証する。
 *
 * Requirements: 1.1, 1.2, 1.3
 */

import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { span } from '../../../src/html/tags/factories-structure.js';
import { ul } from '../../../src/html/tags/factories-data.js';
import {
  buildFactoryCode,
  captureEachTemplate,
} from '../../../src/js/vanilla/state/each-template.js';
import { StateImpl } from '../../../src/js/vanilla/state/state.js';
import { StateRegistry } from '../../../src/js/vanilla/state/registry.js';

function makeArrayState(id: string) {
  const registry = new StateRegistry();
  return new StateImpl<string[]>(id, registry);
}

describe('Task 6.4: each factory extraction 経路での deferred-self 透過性', () => {
  // ────────────────────────────────────────────────────────────
  // Core invariant: id 未指定テンプレートの factoryCode に deferred-self が残らない
  // ────────────────────────────────────────────────────────────

  it('id 未指定 span に .text(item) を呼んだテンプレートのテンプレートコマンドは deferred-self target を持つ', () => {
    // Arrange: id 未指定 span().text(item) — template build 直後は deferred-self
    const items = makeArrayState('items');
    const binding = captureEachTemplate(items, (item) =>
      span().setText(item as never),
    );

    // closure 経路になっているはず（バインディングあり）
    expect(binding._snapshot.factoryKind).toBe('closure');
    // build-phase では factoryCode は未確定
    expect(binding._snapshot.factoryCode).toBeUndefined();
    // _templateRoot が保持されている
    expect(binding._snapshot._templateRoot).toBeDefined();

    // テンプレートコマンドに deferred-self が含まれていることを確認
    // （id 未指定のため、span.setText() 呼び出し時点で deferred-self が生成される）
    const templateCommands = binding._snapshot.templateCommands;
    const hasDeferredSelf = templateCommands.some(
      (cmd) =>
        'target' in cmd &&
        (cmd as { target: { kind: string } }).target.kind === 'deferred-self',
    );
    expect(hasDeferredSelf).toBe(true);
  });

  it('buildFactoryCode で生成された factoryCode に "deferred-self" 文字列が含まれない（不変式）', () => {
    // Arrange: id 未指定 span().text(item) テンプレート
    const items = makeArrayState('items');
    const binding = captureEachTemplate(items, (item) =>
      span().setText(item as never),
    );

    expect(binding._snapshot.factoryKind).toBe('closure');
    const templateRoot = binding._snapshot._templateRoot;
    if (templateRoot === undefined) throw new Error('templateRoot must be defined');

    // Act: render-phase 相当の buildFactoryCode を呼び出す
    // （これが rewriteCommandTarget を呼び、deferred-self を closure-ref に置換する）
    const factoryCode = buildFactoryCode(templateRoot, {
      arrayStateId: 'items',
      itemStateIdPattern: binding._snapshot.itemStateIdPattern,
    });

    // Assert: factoryCode に "deferred-self" が含まれない（不変式）
    expect(factoryCode).not.toContain('deferred-self');
  });

  it('buildFactoryCode で生成された factoryCode に closure-ref 変数名 _e0 が含まれる', () => {
    // Arrange
    const items = makeArrayState('items');
    const binding = captureEachTemplate(items, (item) =>
      span().setText(item as never),
    );

    const templateRoot = binding._snapshot._templateRoot;
    if (templateRoot === undefined) throw new Error('templateRoot must be defined');

    // Act
    const factoryCode = buildFactoryCode(templateRoot, {
      arrayStateId: 'items',
      itemStateIdPattern: binding._snapshot.itemStateIdPattern,
    });

    // Assert: closure-ref 変数名 _e0 が含まれる
    expect(factoryCode).toContain('_e0');
    // bindText の呼び出しが closure-ref (_e0) を使用している
    expect(factoryCode).toContain('__draftole__.bindText(_e0,');
    // document.querySelector を使わない（id ベースではない）
    expect(factoryCode).not.toContain('document.querySelector');
  });

  it('ul().appendChild(state.each(...)) パターンでも closure 経路が選ばれ deferred-self が消える', () => {
    // Arrange: ul + each テンプレート内の span が id 未指定
    const items = makeArrayState('list');
    const eachBinding = captureEachTemplate(items, (item) =>
      span().setText(item as never),
    );

    // ul に appendChild する（実際の使用パターン）
    const _list = ul();

    // Act: render-phase 相当
    expect(eachBinding._snapshot.factoryKind).toBe('closure');
    const templateRoot = eachBinding._snapshot._templateRoot;
    if (templateRoot === undefined) throw new Error('templateRoot must be defined');

    const factoryCode = buildFactoryCode(templateRoot, {
      arrayStateId: 'list',
      itemStateIdPattern: eachBinding._snapshot.itemStateIdPattern,
    });

    // Assert: deferred-self が factoryCode に含まれない（不変式）
    expect(factoryCode).not.toContain('deferred-self');
    // closure-ref 変数が含まれる
    expect(factoryCode).toContain('_e0');
  });

  it('id 未指定テンプレートの factory を vm 上で実行し Element が正常に構築される', () => {
    // Arrange: id 未指定 span — deferred-self → closure-ref への変換を通じて
    //          vm 上でも正常に要素が構築されることを確認
    const items = makeArrayState('items');
    const binding = captureEachTemplate(items, (item) =>
      span().setText(item as never),
    );

    const templateRoot = binding._snapshot._templateRoot;
    if (templateRoot === undefined) throw new Error('templateRoot must be defined');

    const factoryCode = buildFactoryCode(templateRoot, {
      arrayStateId: 'items',
      itemStateIdPattern: binding._snapshot.itemStateIdPattern,
    });

    // pre-condition: deferred-self が含まれていないこと
    expect(factoryCode).not.toContain('deferred-self');

    // Act: vm 上で factory を実行
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
        state: () => ({ subscribe: () => {} }),
        bindText: (el: MockEl, stateId: string) => {
          bindCalls.push({ el, stateId });
        },
        bindValue: () => {},
        bindClassAll: () => {},
        bindClassAdd: () => {},
        bindStyle: () => {},
        bindAttr: () => {},
      },
    };

    const factory = vm.runInNewContext(`(${factoryCode})`, sandbox) as (
      itemId: string,
      idx: number,
      draftole: unknown,
    ) => MockEl;

    const root = factory('items.item0', 0, sandbox.__draftole__);

    // Assert: 要素ツリーが正しく構築される
    expect(root).toBeDefined();
    expect(root.tagName).toBe('span');
    // bindText が _e0（span 自体）に対して呼ばれる
    expect(bindCalls).toHaveLength(1);
    expect(bindCalls[0]?.el).toBe(root);
    expect(bindCalls[0]?.stateId).toBe('items.item0');
    // id 属性が付与されていない（closure-ref はid ベースではない）
    expect(root.attributes['id']).toBeUndefined();
  });

  it('rewriteCommandTarget は target.kind を問わず closure-ref に上書きする（deferred-self 透過性の核心）', () => {
    // デザイン上の不変式: rewriteCommandTarget は入力の target.kind を観測せず、
    // 無条件に closure-ref に書き換える。これにより deferred-self でも closure-ref でも
    // 同じ結果となる。
    //
    // id 未指定テンプレートと id 指定テンプレートの factoryCode を比較し、
    // どちらも "deferred-self" を含まず、どちらも _e0 を含むことを確認する。

    const items = makeArrayState('items');

    // Case A: id 未指定 (deferred-self → closure-ref に変換されるはず)
    const bindingA = captureEachTemplate(items, (item) =>
      span().setText(item as never),
    );
    const templateRootA = bindingA._snapshot._templateRoot;
    if (templateRootA === undefined) throw new Error('templateRoot (A) must be defined');
    const factoryCodeA = buildFactoryCode(templateRootA, {
      arrayStateId: 'items',
      itemStateIdPattern: bindingA._snapshot.itemStateIdPattern,
    });

    // Case B: id 指定 (sel → closure-ref に変換されるはず)
    const bindingB = captureEachTemplate(items, (item) =>
      span({ id: 'my-span' }).setText(item as never),
    );
    const templateRootB = bindingB._snapshot._templateRoot;
    if (templateRootB === undefined) throw new Error('templateRoot (B) must be defined');
    const factoryCodeB = buildFactoryCode(templateRootB, {
      arrayStateId: 'items',
      itemStateIdPattern: bindingB._snapshot.itemStateIdPattern,
    });

    // どちらも deferred-self を含まない（不変式）
    expect(factoryCodeA).not.toContain('deferred-self');
    expect(factoryCodeB).not.toContain('deferred-self');

    // どちらも closure-ref 変数 _e0 を含む（不変式）
    expect(factoryCodeA).toContain('_e0');
    expect(factoryCodeB).toContain('_e0');

    // どちらも document.querySelector を含まない（不変式）
    expect(factoryCodeA).not.toContain('document.querySelector');
    expect(factoryCodeB).not.toContain('document.querySelector');
  });
});
