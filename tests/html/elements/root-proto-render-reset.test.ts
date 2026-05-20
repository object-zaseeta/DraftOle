/**
 * Task 3.3 (element-style-colocated): Root.protoRender 開始時の IdRegistry reset
 *
 * 検証:
 * - 同一 Root を 2 回 protoRender した結果がバイト等価であること
 *   （reset がなければ 2 回目で id 重複登録によりエラーになる/または状態が残る）
 * - 呼び出し側が事前に id を登録した ctx を渡しても、Root.protoRender 冒頭で
 *   それらが reset され、Root 配下のレンダー時には has(id) === false に戻ること
 *
 * Requirements: 3.4, 3.7
 * Boundary: html/elements/root
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../../src/html/elements/root.js';
import { PairType } from '../../../src/html/elements/pair-type.js';
import { TextType } from '../../../src/html/elements/text-type.js';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import {
  createDefaultRenderContext,
  type RenderContext,
} from '../../../src/html/elements/render-context.js';
import { IdRegistry } from '../../../src/html/elements/id-registry.js';
import { defaultIdentifierResolver } from '../../../src/css/utils/identifier-resolver.js';

/**
 * テスト用 probe: protoRender(ctx) で ctx.registry に id を登録する。
 * register が同一 id で 2 回呼ばれると HtmlError をスローするので、reset が
 * 呼ばれていないと 2 回目の Root.protoRender で例外が起きる。
 */
class IdRegisteringTag extends HtmlTag {
  constructor(
    private readonly idValue: string,
    private readonly tagPath: string,
  ) {
    super('div');
  }
  override protoRender(ctx?: RenderContext): string {
    ctx?.registry.register(this.idValue, this.tagPath);
    return `<div id="${this.idValue}"></div>`;
  }
}

describe('Task 3.3 — Root.protoRender 冒頭で ctx.registry.reset() を呼ぶ', () => {
  it('同一 Root を 2 回 protoRender しても結果がバイト等価である', () => {
    const root = new Root();
    root.addChild(new IdRegisteringTag('a', 'root>div[0]'));
    root.addChild(new IdRegisteringTag('b', 'root>div[1]'));

    const out1 = root.protoRender();
    const out2 = root.protoRender();

    expect(out2).toBe(out1);
  });

  it('通常の子要素でも 2 回 protoRender がバイト等価', () => {
    const root = new Root();
    const child = new PairType('div');
    child.addChild(new TextType('hello'));
    root.addChild(child);

    const out1 = root.protoRender();
    const out2 = root.protoRender();

    expect(out2).toBe(out1);
  });

  it('呼び出し元が事前登録済みの ctx を渡しても、Root 冒頭で registry が reset される', () => {
    const ctx: RenderContext = {
      registry: new IdRegistry(),
      resolver: defaultIdentifierResolver,
    };
    ctx.registry.register('preexisting', 'external');
    expect(ctx.registry.has('preexisting')).toBe(true);

    const root = new Root();
    // 子なし: protoRender で純粋に reset が走ることのみ検証する
    root.protoRender(ctx);

    expect(ctx.registry.has('preexisting')).toBe(false);
  });

  it('createDefaultRenderContext を渡したケースでも 2 回 protoRender(ctx) がバイト等価', () => {
    const root = new Root();
    root.addChild(new IdRegisteringTag('only', 'root>div[0]'));

    const ctx = createDefaultRenderContext();
    const out1 = root.protoRender(ctx);
    const out2 = root.protoRender(ctx);

    expect(out2).toBe(out1);
  });
});
