/**
 * Task 6.2: 明示 id 経路の byte equality 統合テスト
 *
 * 明示 id を持つ要素 + 各 binding メソッド呼び出しで生成される JS / HTML が
 * deferred-target-resolution spec 導入前後で完全同等（byte-identical）であることを assert する。
 *
 * 検証観点:
 *   1. 明示 id ボタン + .on('click', handler) → JS が
 *      `document.querySelector("#my-btn").addEventListener("click", ...)` を含む
 *   2. 明示 id スパン + .text(state) → JS が
 *      `__draftole__.bindText(document.querySelector("#counter"), ...)` を含む
 *   3. HTML 出力に id 属性が正しく含まれる（`<button id="my-btn">` 等）
 *   4. renderElementTarget({kind:'sel',selector:'#foo'}) の出力が
 *      `document.querySelector("#foo")` と byte-identical
 *
 * 注: 明示 id の要素は deferred-self を経由しない（call time に sel target が確定）。
 *     よって protoRender 前後で _pending 内の target.kind が 'sel' のままであることも検証する。
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { button, div, span } from '../../../src/html/tags/index.js';
import { renderCommand, renderElementTarget, type VanillaCommand } from '../../../src/js/vanilla/commands.js';
import { applyElementMixin, type ElementMethods } from '../../../src/js/vanilla/element-methods.js';
import { PairType } from '../../../src/html/elements/pair-type.js';
import type { HtmlTag } from '../../../src/html/elements/html-tag.js';
import { StateImpl } from '../../../src/js/vanilla/state/state.js';
import type { ReadableState } from '../../../src/js/vanilla/state/state.js';

// ─── 型エイリアス ──────────────────────────────────────────────────────────────

type ButtonWithMethods = ReturnType<typeof button> & ElementMethods<ReturnType<typeof button>> & {
  _pending: VanillaCommand[];
};

type SpanWithMethods = ReturnType<typeof span> & ElementMethods<ReturnType<typeof span>> & {
  _pending: VanillaCommand[];
};

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

/** テスト用 StateRegistry モック（element-methods-state.test.ts と同等の実装）。 */
function makeRegistry() {
  let counter = 0;
  return {
    allocateId: () => `s${counter++}`,
    register: () => {},
    registerDerived: () => {},
  };
}

/** テスト用 State<string> を生成する。 */
function makeStringState(id: string): ReadableState<string> {
  const registry = makeRegistry();
  return new StateImpl<string>(id, registry as never);
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeAll(() => {
  applyElementMixin(PairType.prototype as HtmlTag);
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 3.1: renderElementTarget byte-identity 検証
// ─────────────────────────────────────────────────────────────────────────────

describe('renderElementTarget の byte-identical 出力（Req 3.1）', () => {
  it('sel target が document.querySelector("#foo") を byte-identical に出力する', () => {
    const result = renderElementTarget({ kind: 'sel', selector: '#foo' });
    expect(result).toBe('document.querySelector("#foo")');
  });

  it('sel target + 任意の id が document.querySelector("#<id>") を出力する', () => {
    expect(renderElementTarget({ kind: 'sel', selector: '#my-btn' })).toBe('document.querySelector("#my-btn")');
    expect(renderElementTarget({ kind: 'sel', selector: '#counter' })).toBe('document.querySelector("#counter")');
    expect(renderElementTarget({ kind: 'sel', selector: '#todo-input' })).toBe('document.querySelector("#todo-input")');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 3.2: 明示 id + .on('click', handler) の JS byte-equality
// ─────────────────────────────────────────────────────────────────────────────

describe('明示 id ボタン + .on("click") → JS byte-equality（Req 3.2）', () => {
  it('protoRender 前の _pending に sel target が既に確定している（deferred-self を経由しない）', () => {
    const btn = button({ id: 'my-btn' }) as ButtonWithMethods;
    const container = div(btn);
    const pending = btn._pending;

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (btn as ElementMethods<typeof btn>).on('click', function() {});

    // protoRender 前: deferred-self ではなく sel が確定している
    expect(pending).toHaveLength(1);
    const cmd = pending[0] as Extract<VanillaCommand, { target: { kind: string } }>;
    expect(cmd.target.kind).toBe('sel');
    expect((cmd.target as { kind: string; selector: string }).selector).toBe('#my-btn');

    // protoRender 後も sel のままで変化しない
    container.protoRender();
    const cmdAfter = pending[0] as Extract<VanillaCommand, { target: { kind: string } }>;
    expect(cmdAfter.target.kind).toBe('sel');
    expect((cmdAfter.target as { kind: string; selector: string }).selector).toBe('#my-btn');
  });

  it('renderCommand が document.querySelector("#my-btn").addEventListener("click", ...) を出力する', () => {
    const btn = button({ id: 'my-btn' }) as ButtonWithMethods;
    const container = div(btn);
    const pending = btn._pending;

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (btn as ElementMethods<typeof btn>).on('click', function() {});

    container.protoRender();

    const jsOutput = renderCommand(pending[0]!);
    expect(jsOutput).toContain('document.querySelector("#my-btn").addEventListener');
    expect(jsOutput).toContain('"click"');
  });

  it('HTML 出力に id="my-btn" が含まれる（Req 3.3）', () => {
    const btn = button({ id: 'my-btn' }) as ButtonWithMethods;
    const container = div(btn);

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (btn as ElementMethods<typeof btn>).on('click', function() {});

    const html = container.protoRender();
    expect(html).toContain('id="my-btn"');
  });

  it('明示 id の場合は auto-id が付与されない（Req 3.4）', () => {
    const btn = button({ id: 'explicit-id' }) as ButtonWithMethods;
    const container = div(btn);

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (btn as ElementMethods<typeof btn>).on('click', function() {});

    const html = container.protoRender();
    // 明示 id が存在
    expect(html).toContain('id="explicit-id"');
    // auto-id が混入しない（data-draftole- prefix 等の自動 id パターン）
    expect(html).not.toMatch(/id="[a-z0-9]+-[a-z0-9]+-[a-z0-9]+"/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 3.2 / 3.3: 明示 id + .text(state) の JS byte-equality
// ─────────────────────────────────────────────────────────────────────────────

describe('明示 id スパン + .text(state) → JS byte-equality（Req 3.2, 3.3）', () => {
  it('protoRender 前の _pending に sel target が既に確定している', () => {
    const counter = span({ id: 'counter' }) as SpanWithMethods;
    const container = div(counter);
    const pending = counter._pending;

    const state = makeStringState('count-state');
    (counter as { text(v: ReadableState<string>): SpanWithMethods }).text(state);

    // protoRender 前: sel target が確定している
    expect(pending).toHaveLength(1);
    const cmd = pending[0] as Extract<VanillaCommand, { type: 'bind-text'; target: { kind: string } }>;
    expect(cmd.type).toBe('bind-text');
    expect(cmd.target.kind).toBe('sel');
    expect((cmd.target as { kind: string; selector: string }).selector).toBe('#counter');

    // protoRender 後も変化しない
    container.protoRender();
    const cmdAfter = pending[0] as Extract<VanillaCommand, { type: 'bind-text'; target: { kind: string } }>;
    expect(cmdAfter.target.kind).toBe('sel');
  });

  it('renderCommand が __draftole__.bindText(document.querySelector("#counter"), ...) を出力する', () => {
    const counter = span({ id: 'counter' }) as SpanWithMethods;
    const container = div(counter);
    const pending = counter._pending;

    const state = makeStringState('count-state');
    (counter as { text(v: ReadableState<string>): SpanWithMethods }).text(state);

    container.protoRender();

    const jsOutput = renderCommand(pending[0]!);
    expect(jsOutput).toContain('__draftole__.bindText(document.querySelector("#counter"),');
    expect(jsOutput).toContain('"count-state"');
  });

  it('HTML 出力に id="counter" が含まれる', () => {
    const counter = span({ id: 'counter' }) as SpanWithMethods;
    const container = div(counter);

    const state = makeStringState('count-state');
    (counter as { text(v: ReadableState<string>): SpanWithMethods }).text(state);

    const html = container.protoRender();
    expect(html).toContain('id="counter"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 3.4: 複数の明示 id 要素が各自の selector を保持する
// ─────────────────────────────────────────────────────────────────────────────

describe('複数の明示 id 要素が各自の selector を保持する（Req 3.4）', () => {
  it('add-btn / clear-btn / todo-input が各自の selector で addEventListener を出力する', () => {
    const addBtn = button({ id: 'add-btn' }) as ButtonWithMethods;
    const clearBtn = button({ id: 'clear-btn' }) as ButtonWithMethods;
    const container = div(addBtn, clearBtn);

    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (addBtn as ElementMethods<typeof addBtn>).on('click', function() {});
    // biome-ignore lint/complexity/useArrowFunction: dispatcher の isArrowShape テスト回避
    (clearBtn as ElementMethods<typeof clearBtn>).on('click', function() {});

    container.protoRender();

    const addJs = renderCommand(addBtn._pending[0]!);
    const clearJs = renderCommand(clearBtn._pending[0]!);

    expect(addJs).toContain('document.querySelector("#add-btn").addEventListener');
    expect(clearJs).toContain('document.querySelector("#clear-btn").addEventListener');

    // cross-contamination がない
    expect(addJs).not.toContain('#clear-btn');
    expect(clearJs).not.toContain('#add-btn');
  });
});
