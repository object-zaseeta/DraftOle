/**
 * Task 6.3: 複数バインディング併用時の同一 target 共有テスト
 *
 * id 未指定の同一要素に対して `.text(state)` と `.on('click', h)` を連鎖させたとき、
 * 生成される JS 内で両コマンドの target が同一のクラスセレクタ（`"._<classHash>"`）を参照することを検証する。
 *
 * 検証観点:
 *   1. `.text(ReadableState)` と `.on('click', ...)` を同一要素に呼ぶと _pending に 2 コマンド積まれる
 *   2. protoRender 後、両コマンドともに同一の sel target に解決される
 *   3. renderCommand で文字列化すると bindText と addEventListener が同じクラスセレクタを参照する
 *   4. 生成 HTML のクラス属性値と JS 内のセレクタが一致する
 *   5. 複数呼び出しでも sel target は単一値に確定する
 *
 * Requirements: 4.1, 4.2
 */

import { describe, expect, it } from 'vitest';
import { div, span } from '../../../src/html/tags/index.js';
import { resolveClassName } from '../../../src/css/utils/identifier-resolver.js';
import { renderCommand, type VanillaCommand } from '../../../src/js/vanilla/commands.js';
import type { ElementMethods } from '../../../src/js/vanilla/element-methods.js';
import { StateImpl } from '../../../src/js/vanilla/state/state.js';
import { StateRegistry } from '../../../src/js/vanilla/state/registry.js';

type SpanWithMethods = ReturnType<typeof span> & ElementMethods<ReturnType<typeof span>>;

/** テスト用 ReadableState<string> を生成するヘルパ */
function makeState(id: string): StateImpl<string> {
  const registry = new StateRegistry();
  return new StateImpl<string>(id, registry);
}

describe('Task 6.3: 複数バインディング併用時の同一 target 共有', () => {
  it('.text(state) と .on(click) の両コマンドが protoRender 後に同一クラスセレクタへ解決される', () => {
    const s = span() as SpanWithMethods & { _pending: VanillaCommand[] };
    const container = div(s);
    const pending = (s as { _pending: VanillaCommand[] })._pending;

    const textState = makeState('s0');

    (s as SpanWithMethods).text(textState);
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (s as SpanWithMethods).on('click', function() {});

    // protoRender 前: 2 コマンドとも deferred-self
    expect(pending).toHaveLength(2);
    for (const cmd of pending) {
      const c = cmd as Extract<VanillaCommand, { target: { kind: string } }>;
      expect(c.target.kind).toBe('deferred-self');
    }

    // Act: protoRender でクラス自動付与 + deferred-self 解決
    const html = container.protoRender();

    const expectedClass = resolveClassName('div>span[0]');

    // Assert 1: HTML にクラスが付与されている（id は付与されない）
    expect(html).toContain(`class="${expectedClass}"`);
    expect(html).not.toContain('id=');

    // Assert 2: 両コマンドとも同一の sel target に解決されている
    expect(pending).toHaveLength(2);
    for (const cmd of pending) {
      const c = cmd as Extract<VanillaCommand, { target: { kind: 'sel'; selector: string } }>;
      expect(c.target.kind).toBe('sel');
      expect(c.target.selector).toBe(`.${expectedClass}`);
    }
  });

  it('renderCommand 文字列化で bindText と addEventListener が同一クラスセレクタを参照する', () => {
    const s = span() as SpanWithMethods & { _pending: VanillaCommand[] };
    const container = div(s);
    const pending = (s as { _pending: VanillaCommand[] })._pending;

    const textState = makeState('s1');

    (s as SpanWithMethods).text(textState);
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (s as SpanWithMethods).on('click', function() {});

    container.protoRender();

    const expectedClass = resolveClassName('div>span[0]');

    expect(pending).toHaveLength(2);

    const bindTextCmd = pending[0];
    const addEventCmd = pending[1];
    if (!bindTextCmd || !addEventCmd) throw new Error('pending commands missing');

    const bindTextJs = renderCommand(bindTextCmd);
    const addEventJs = renderCommand(addEventCmd);

    expect(bindTextJs).toContain(`document.querySelector(".${expectedClass}")`);
    expect(bindTextJs).toContain('bindText');

    expect(addEventJs).toContain(`document.querySelector(".${expectedClass}")`);
    expect(addEventJs).toContain('"click"');
    expect(addEventJs).toContain('addEventListener');
  });

  it('JS 内クラスセレクタと HTML class 属性が一致する', () => {
    const s = span() as SpanWithMethods & { _pending: VanillaCommand[] };
    const container = div(s);
    const pending = (s as { _pending: VanillaCommand[] })._pending;

    const textState = makeState('s2');

    (s as SpanWithMethods).text(textState);
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (s as SpanWithMethods).on('click', function() {});

    const html = container.protoRender();

    // HTML から class 属性値を抽出
    const classMatch = html.match(/class="([^"]+)"/);
    expect(classMatch).not.toBeNull();
    const htmlAutoClass = classMatch![1];

    // Assert: _pending の各コマンドのセレクタが HTML の class 属性値と一致する
    for (const cmd of pending) {
      const c = cmd as Extract<VanillaCommand, { target: { kind: 'sel'; selector: string } }>;
      expect(c.target.selector).toBe(`.${htmlAutoClass}`);
    }

    // resolveClassName で計算した期待値とも一致する
    const expectedClass = resolveClassName('div>span[0]');
    expect(htmlAutoClass).toBe(expectedClass);
  });

  it('3 つのバインディング（text + on×2）でも sel target が単一値に確定する', () => {
    const s = span() as SpanWithMethods & { _pending: VanillaCommand[] };
    const container = div(s);
    const pending = (s as { _pending: VanillaCommand[] })._pending;

    const textState = makeState('s3');

    (s as SpanWithMethods).text(textState);
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (s as SpanWithMethods).on('click', function() {});
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (s as SpanWithMethods).on('mouseenter', function() {});

    expect(pending).toHaveLength(3);
    for (const cmd of pending) {
      const c = cmd as Extract<VanillaCommand, { target: { kind: string } }>;
      expect(c.target.kind).toBe('deferred-self');
    }

    container.protoRender();

    const expectedClass = resolveClassName('div>span[0]');

    expect(pending).toHaveLength(3);
    for (const cmd of pending) {
      const c = cmd as Extract<VanillaCommand, { target: { kind: 'sel'; selector: string } }>;
      expect(c.target.kind).toBe('sel');
      expect(c.target.selector).toBe(`.${expectedClass}`);
    }

    const selectors = pending.map(
      (cmd) => (cmd as Extract<VanillaCommand, { target: { kind: 'sel'; selector: string } }>).target.selector,
    );
    const uniqueSelectors = new Set(selectors);
    expect(uniqueSelectors.size).toBe(1);
  });
});
