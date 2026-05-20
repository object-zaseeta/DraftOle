/**
 * each-template.ts の `rewriteCommandTarget` における stateId 連結式生成の単体テスト。
 *
 * タスク 5.2 (P): U-2 — stateId 連結式の単体テスト
 *
 * 観測可能な完了:
 *   1. スロットルート（rest 空）→ `itemId` を生成
 *   2. スロット子ノード（rest あり、例 `.text`）→ `itemId + ".text"` を生成
 *   3. スロットプレフィックスに該当しない stateId はリテラルのまま（書き換えなし）
 *
 * 加えて旧形 `arrayId + ".item"` 文字列が出力に含まれないことを正規表現で防御する。
 *
 * Requirements: 3.3, 4.1, 4.3, 4.5, 4.7
 */

import { describe, expect, it } from 'vitest';
import { li } from '../../../../src/html/tags/factories-data.js';
import { span } from '../../../../src/html/tags/factories-structure.js';
import {
  buildFactoryCode,
  captureEachTemplate,
  type EachBindingWithSnapshot,
} from '../../../../src/js/vanilla/state/each-template.js';
import { StateRegistry } from '../../../../src/js/vanilla/state/registry.js';
import { StateImpl } from '../../../../src/js/vanilla/state/state.js';

/**
 * closure 経路の snapshot から factoryCode を生成して返すヘルパ。
 * `captureEachTemplate` は closure 経路では `factoryCode === undefined` のまま
 * `_templateRoot` を保持するため、`buildFactoryCode` を直接呼んで factory 文字列を確定させる。
 */
function buildClosureFactoryFromBinding(
  binding: EachBindingWithSnapshot<unknown>,
  arrayStateId: string,
): string {
  expect(binding._snapshot.factoryKind).toBe('closure');
  expect(binding._snapshot.factoryCode).toBeUndefined();
  const root = binding._snapshot._templateRoot;
  if (root === undefined) {
    throw new Error('expected _templateRoot to be defined for closure-path snapshot');
  }
  return buildFactoryCode(root, {
    arrayStateId,
    itemStateIdPattern: binding._snapshot.itemStateIdPattern,
  });
}

describe('rewriteCommandTarget — stateId 連結式（U-2）', () => {
  // ────────────────────────────────────────────────────────────
  // ケース 1: スロットルート（rest 空）→ `itemId` を生成
  // ────────────────────────────────────────────────────────────
  it('U-2-a: スロットルートへの bind は dynamic stateId として `itemId`（連結式なし）を生成する', () => {
    const registry = new StateRegistry();
    const todos = new StateImpl<string[]>('todos', registry);
    // todo の _runtimeId は "todos.itemTemplate"（slotPrefix そのもの = rest 空）
    const binding = captureEachTemplate(todos, (todo) =>
      li(span({ id: 'each-span' }).setText(todo as never)),
    );
    const code = buildClosureFactoryFromBinding(binding, 'todos');

    // bindText の第二引数が裸の識別子 `itemId`（クォートなし、連結なし）であること
    expect(code).toMatch(/__draftole__\.bindText\(\s*_e\d+\s*,\s*itemId\s*\)\s*;/);
    // クォート付きスロット ID（"todos.itemTemplate"）が出力に残っていないこと
    expect(code).not.toContain('"todos.itemTemplate"');
    // 旧形 `arrayId + ".item"` 連結式が現れないことを正規表現で防御
    expect(code).not.toMatch(/arrayId\s*\+\s*"\.item"/);
  });

  // ────────────────────────────────────────────────────────────
  // ケース 2: スロット子ノード（rest あり）→ `itemId + ".text"`
  // ────────────────────────────────────────────────────────────
  it('U-2-b: スロット子ノード（rest=".text"）への bind は `itemId + ".text"` 連結式を生成する', () => {
    const registry = new StateRegistry();
    const todos = new StateImpl<{ text: string }[]>('todos', registry);
    // 仮想スロット子ノードを直接構築する（_runtimeId = "todos.itemTemplate.text"）
    const childState = new StateImpl<string>('todos.itemTemplate.text', registry);
    const binding = captureEachTemplate(todos, () =>
      li(span({ id: 'each-span' }).setText(childState as never)),
    );
    const code = buildClosureFactoryFromBinding(binding, 'todos');

    // bindText が `itemId + ".text"` 連結式で呼ばれていること
    expect(code).toMatch(
      /__draftole__\.bindText\(\s*_e\d+\s*,\s*itemId\s*\+\s*"\.text"\s*\)\s*;/,
    );
    // クォート付きスロット ID（"todos.itemTemplate.text"）が出力に残っていないこと
    expect(code).not.toContain('"todos.itemTemplate.text"');
    // 旧形 `arrayId + ".item"` 連結式が現れないことを正規表現で防御
    expect(code).not.toMatch(/arrayId\s*\+\s*"\.item"/);
  });

  // ────────────────────────────────────────────────────────────
  // ケース 3: スロットプレフィックスに該当しない stateId はリテラルのまま
  // ────────────────────────────────────────────────────────────
  it('U-2-c: 非スロット state への bind は stateId をリテラル（クォート付き）で出力し書き換えない', () => {
    const registry = new StateRegistry();
    const todos = new StateImpl<string[]>('todos', registry);
    // スロットプレフィックスに該当しない外部 state（例: グローバル設定）
    const externalState = new StateImpl<string>('settings.title', registry);
    const binding = captureEachTemplate(todos, () =>
      li(span({ id: 'each-span' }).setText(externalState as never)),
    );
    const code = buildClosureFactoryFromBinding(binding, 'todos');

    // bindText の第二引数がクォート付きリテラル "settings.title" であること
    expect(code).toMatch(
      /__draftole__\.bindText\(\s*_e\d+\s*,\s*"settings\.title"\s*\)\s*;/,
    );
    // 動的解決経路の識別子（itemId / itemId + …）に書き換えられていないこと
    expect(code).not.toMatch(/bindText\(\s*_e\d+\s*,\s*itemId/);
    // 旧形 `arrayId + ".item"` 連結式が現れないことを正規表現で防御
    expect(code).not.toMatch(/arrayId\s*\+\s*"\.item"/);
  });
});
