/**
 * Task 3.1 (element-style-colocated): `HtmlTag.protoRender(ctx?: RenderContext)`
 * シグネチャ拡張のテスト。
 *
 * 本タスクの責務（design.md / Task 3.1）:
 *   - `protoRender` が optional な `RenderContext` 引数を受け取れるよう
 *     シグネチャを拡張する。
 *   - ctx 省略時は内部で `createDefaultRenderContext()` 相当を組み立て、
 *     旧呼び出し（引数なし）と完全に同一の出力を返すことで後方互換性を
 *     担保する。
 *   - 既存呼び出し（引数省略形）が引き続きそのまま動作することを確認する。
 *
 * 注意: 本タスクでは `protoRender` 本体の処理（generateScopedClassName 等）
 *       を ctx.resolver で置き換えることは行わない。あくまでシグネチャ拡張と
 *       デフォルト ctx の構築経路の存在のみを確認する。
 *
 * Requirements: 3.1, 3.4
 */
import { describe, it, expect } from 'vitest';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import {
  createDefaultRenderContext,
  type RenderContext,
} from '../../../src/html/elements/render-context.js';
import type { TagType } from '../../../src/html/tags/tag-type.js';

class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

describe('HtmlTag.protoRender(ctx?) — Task 3.1 シグネチャ拡張', () => {
  it('ctx を省略しても従来どおり HTML 文字列を返す', () => {
    const tag = new TestTag('div');
    const out = tag.protoRender();
    expect(typeof out).toBe('string');
    expect(out).toBe('<div></div>');
  });

  it('明示的に RenderContext を渡しても呼び出しが成立する', () => {
    const tag = new TestTag('span');
    const ctx: RenderContext = createDefaultRenderContext();
    const out = tag.protoRender(ctx);
    expect(typeof out).toBe('string');
    expect(out).toBe('<span></span>');
  });

  it('ctx 省略形と ctx 明示形の出力が同一である（バイト等価）', () => {
    const a = new TestTag('p');
    const b = new TestTag('p');
    const ctx = createDefaultRenderContext();
    expect(a.protoRender()).toBe(b.protoRender(ctx));
  });

  it('protoRender は ctx 引数を 1 つ宣言する（実引数なしでも呼び出せる）', () => {
    const tag = new TestTag('div');
    // ctx? は実行時には 1 個のパラメータとしてカウントされる（既定値構文ではないため）。
    // 旧シグネチャ `protoRender(): string` では 0 となるので、1 になっていれば
    // パラメータが追加されたことを確認できる。
    expect(tag.protoRender.length).toBe(1);
  });
});
