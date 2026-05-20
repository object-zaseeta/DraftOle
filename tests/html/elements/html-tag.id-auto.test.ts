/**
 * Task 3.5 (element-style-colocated): protoRender 内のクラスセレクタ自動解決テスト。
 *
 * - `_pending` を持つ要素（JSバインディング対象）かつ id 明示なしのとき、
 *   `ctx.resolver.resolveClassName(tagPath)` でクラス名を生成し HTML に付与する。
 *   id 属性は付与しない（クラスセレクタで代替）。
 * - `_pending` が空の要素にはクラスも id も自動付与しない
 * - id 明示指定がある要素には自動クラス付与をスキップする
 *
 * Requirements: 3.1, 3.2, 3.4
 */
import { describe, expect, it } from 'vitest';
import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.js';
import { resolveClassName } from '../../../src/css/utils/identifier-resolver.js';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import { createDefaultRenderContext } from '../../../src/html/elements/render-context.js';
import type { TagType } from '../../../src/html/tags/tag-type.js';
import type { VanillaCommand } from '../../../src/js/vanilla/commands.js';

class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

const internals = (tag: HtmlTag) =>
  tag as { _pending: VanillaCommand[] };

const dummyCommand = (): VanillaCommand => ({
  type: 'expr',
  code: '/* noop */',
});

describe('HtmlTag.protoRender: クラスセレクタ自動付与 (Task 3.5)', () => {
  it('bindings あり & id 未指定 → resolveClassName(tagPath) でクラス付与し id は付与しない', () => {
    const tag = new TestTag('button');
    tag.css.updateTagPath('html>body>button[0]');
    internals(tag)._pending.push(dummyCommand());

    const ctx = createDefaultRenderContext();
    const html = tag.protoRender(ctx);
    const expectedClass = resolveClassName('html>body>button[0]');

    expect(html).toContain(`class="${expectedClass}"`);
    expect(html).not.toContain('id=');
    expect(html).toBe(`<button class="${expectedClass}"></button>`);
  });

  it('bindings なし → id もクラスも自動付与しない', () => {
    const tag = new TestTag('span');
    tag.css.updateTagPath('html>body>span[0]');

    const ctx = createDefaultRenderContext();
    const html = tag.protoRender(ctx);

    expect(html).toBe('<span></span>');
    expect(html.includes('id=')).toBe(false);
    expect(html.includes('class=')).toBe(false);
  });

  it('id 明示指定あり & bindings あり → 明示 id を保持しクラス自動生成は行わない', () => {
    const tag = new TestTag('button');
    tag.css.updateTagPath('html>body>button[0]');
    tag.addHtmlAttribute(HtmlAttribute.keyValue('id', 'my-explicit-id'));
    internals(tag)._pending.push(dummyCommand());

    const ctx = createDefaultRenderContext();
    const html = tag.protoRender(ctx);

    expect(html).toBe('<button id="my-explicit-id"></button>');
    // 自動生成クラスは付与されない
    const autoClass = resolveClassName('html>body>button[0]');
    expect(html).not.toContain(autoClass);
  });

  it('tagPath が空文字列のとき自動生成しない（resolver を使わない）', () => {
    const tag = new TestTag('div');
    // tagPath は更新せず空のまま
    internals(tag)._pending.push(dummyCommand());

    const ctx = createDefaultRenderContext();
    const html = tag.protoRender(ctx);
    expect(html).toBe('<div></div>');
  });

  it('同一 tagPath を持つ二要素を同一 ctx でレンダーしても衝突しない（id 登録なし）', () => {
    const ctx = createDefaultRenderContext();

    const a = new TestTag('button');
    a.css.updateTagPath('html>body>button[0]');
    internals(a)._pending.push(dummyCommand());

    const b = new TestTag('button');
    b.css.updateTagPath('html>body>button[0]');
    internals(b)._pending.push(dummyCommand());

    expect(() => a.protoRender(ctx)).not.toThrow();
    expect(() => b.protoRender(ctx)).not.toThrow();
  });
});
