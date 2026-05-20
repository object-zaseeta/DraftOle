/**
 * Task 3.1: id 未指定要素に対する deferred-self 解決の統合テスト
 *
 * HtmlTag.protoRender 内の `resolveDeferredTargets` ステップにより、
 * id 未指定要素の `.on()` バインディングが自動生成クラスを使った
 * `document.querySelector("._<classHash>")` に解決されることを検証する。
 *
 * 検証観点:
 *   1. id 未指定 + `.on('click', ...)` 要素を protoRender した後、
 *      _pending 内に deferred-self が残らない
 *   2. 生成 HTML に auto-class が付与される（id 属性は付与されない）
 *   3. _pending 内コマンドを renderCommand で文字列化すると
 *      `document.querySelector("._<classHash>").addEventListener('click', ...)` が得られる
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2
 */

import { describe, expect, it } from 'vitest';
import { button, div } from '../../../src/html/tags/index.js';
import { resolveClassName } from '../../../src/css/utils/identifier-resolver.js';
import { renderCommand, type VanillaCommand } from '../../../src/js/vanilla/commands.js';
import type { ElementMethods } from '../../../src/js/vanilla/element-methods.js';

type ButtonWithMethods = ReturnType<typeof button> & ElementMethods<ReturnType<typeof button>>;

describe('Task 3.1: deferred-self → sel 解決（id 未指定 + .on() 経路）', () => {
  it('id 未指定ボタンに .on(click) を呼んでも protoRender 後は deferred-self が _pending に残らない', () => {
    // Arrange: id 未指定の button を div に追加して tagPath を確定させる
    const btn = button() as ButtonWithMethods & { _pending: VanillaCommand[] };
    const container = div(btn);

    // _pending を確認するためのアクセス
    const pending = (btn as { _pending: VanillaCommand[] })._pending;

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (btn as ButtonWithMethods).on('click', function() {});

    // protoRender 前: deferred-self が _pending にある
    expect(pending).toHaveLength(1);
    const cmdBefore = pending[0] as Extract<VanillaCommand, { target: { kind: string } }>;
    expect(cmdBefore.target.kind).toBe('deferred-self');

    // Act: protoRender でクラス自動付与 + deferred-self 解決
    const html = container.protoRender();

    // Assert 1: HTML にクラスが付与されている（id は付与されない）
    const expectedClass = resolveClassName('div>button[0]');
    expect(html).toContain(`class="${expectedClass}"`);
    expect(html).not.toContain('id=');

    // Assert 2: _pending 内のコマンドが sel target に解決されている（deferred-self なし）
    expect(pending).toHaveLength(1);
    const cmdAfter = pending[0] as Extract<VanillaCommand, { target: { kind: string } }>;
    expect(cmdAfter.target.kind).toBe('sel');
    expect((cmdAfter.target as { kind: string; selector: string }).selector).toBe(`.${expectedClass}`);
  });

  it('renderCommand で文字列化すると document.querySelector("._<classHash>").addEventListener が得られる', () => {
    // Arrange
    const btn = button() as ButtonWithMethods & { _pending: VanillaCommand[] };
    const container = div(btn);
    const pending = (btn as { _pending: VanillaCommand[] })._pending;

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (btn as ButtonWithMethods).on('click', function() {});

    // Act: protoRender で解決
    container.protoRender();

    // Assert: renderCommand が document.querySelector("._<classHash>") を含む
    const expectedClass = resolveClassName('div>button[0]');
    const cmd = pending[0]!;
    const jsOutput = renderCommand(cmd);
    expect(jsOutput).toContain(`document.querySelector(".${expectedClass}").addEventListener`);
    expect(jsOutput).toContain('"click"');
  });

  it('明示 id を持つ要素は deferred-self を生成しない（call time に sel target が確定）', () => {
    // Arrange: 明示 id を持つ button
    const btn = button({ id: 'my-btn' }) as ButtonWithMethods & { _pending: VanillaCommand[] };
    const container = div(btn);
    const pending = (btn as { _pending: VanillaCommand[] })._pending;

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (btn as ButtonWithMethods).on('click', function() {});

    // protoRender 前: sel target が既に確定している
    expect(pending).toHaveLength(1);
    const cmdBefore = pending[0] as Extract<VanillaCommand, { target: { kind: string } }>;
    expect(cmdBefore.target.kind).toBe('sel');
    expect((cmdBefore.target as { kind: string; selector: string }).selector).toBe('#my-btn');

    // Act: protoRender（明示 id 経路）
    const html = container.protoRender();

    // Assert: HTML に明示 id が保たれている
    expect(html).toContain('id="my-btn"');

    // 自動生成クラスは含まれない
    const autoClass = resolveClassName('div>button[0]');
    expect(html).not.toContain(autoClass);
  });

  it('複数の .on() バインディングが同一クラスセレクタを共有する', () => {
    // Arrange
    const btn = button() as ButtonWithMethods & { _pending: VanillaCommand[] };
    const container = div(btn);
    const pending = (btn as { _pending: VanillaCommand[] })._pending;

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (btn as ButtonWithMethods).on('click', function() {});
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (btn as ButtonWithMethods).on('mouseenter', function() {});

    // protoRender 前: 2 コマンドとも deferred-self
    expect(pending).toHaveLength(2);
    for (const cmd of pending) {
      const c = cmd as Extract<VanillaCommand, { target: { kind: string } }>;
      expect(c.target.kind).toBe('deferred-self');
    }

    // Act: protoRender
    container.protoRender();

    const expectedClass = resolveClassName('div>button[0]');

    // Assert: 両コマンドが同一クラスセレクタに解決されている
    expect(pending).toHaveLength(2);
    for (const cmd of pending) {
      const c = cmd as Extract<VanillaCommand, { target: { kind: 'sel'; selector: string } }>;
      expect(c.target.kind).toBe('sel');
      expect(c.target.selector).toBe(`.${expectedClass}`);
    }
  });
});
