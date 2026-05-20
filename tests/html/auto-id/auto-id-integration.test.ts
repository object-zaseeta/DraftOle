/**
 * Task 4.5 (element-style-colocated): クラスセレクタ自動付与の統合テスト。
 *
 * Task 3.5 のユニットテストでは `HtmlTag.protoRender` を孤立させて
 * クラスセレクタ解決のロジック単体を検証している。本テストは公開ファクトリ API
 * (`button`, `span`, `div` など) を用いてツリーを組み立て、親要素の
 * `protoRender` から子要素 protoRender へ RenderContext が伝搬する
 * **end-to-end 経路**でクラス自動付与・明示 id 優先が機能することを確認する。
 *
 * 検証観点:
 *   A: JS バインディングを持つ要素にはクラスが自動付与される（id は付与されない）
 *   B: bindings なし要素にはクラスが付与されない
 *   C: 明示 id 指定が自動生成より優先される（自動クラスは出力されない）
 *   D: 同じ tagPath で 2 要素が衝突しても HtmlError は発生しない
 *
 * Requirements: 3.1, 3.2, 3.4
 * Boundary: tests/html/auto-id/
 */
import { describe, expect, it } from 'vitest';
import type { TagType } from '../../../src/html/tags/tag-type.js';
import type { VanillaCommand } from '../../../src/js/vanilla/commands.js';
import { resolveClassName } from '../../../src/css/utils/identifier-resolver.js';
import { createDefaultRenderContext } from '../../../src/html/elements/render-context.js';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import { Root } from '../../../src/html/elements/root.js';
import { button, div, span } from '../../../src/html/tags/index.js';

// HtmlTag._pending への直接アクセス（テスト用・JS バインディング有無の擬似化）
const internals = (tag: HtmlTag): { _pending: VanillaCommand[] } =>
  tag as { _pending: VanillaCommand[] };

const pushBinding = (tag: HtmlTag): void => {
  internals(tag)._pending.push({ type: 'expr', code: '/* test-binding */' });
};

// HtmlTag は abstract のためテスト用具象クラスを用意（衝突ケース D 用）
class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'button') {
    super(tagType);
  }
}

describe('Task 4.5: クラスセレクタ自動付与と統合テスト', () => {
  it('A: JS バインディングを持つ要素にはクラスが自動付与される（id は付与されない）', () => {
    const btn = button();
    const container = div(btn);
    pushBinding(btn);

    const html = container.protoRender();

    const expectedClass = resolveClassName('div>button[0]');
    expect(html).toContain(`class="${expectedClass}"`);
    expect(html).not.toContain('id=');
    expect(expectedClass).toMatch(/^_(?:[a-z0-9-]+__)?[0-9a-f]{8}$/);
    expect(html).toBe(`<div><button class="${expectedClass}"></button></div>`);
  });

  it('B: bindings なし要素にはクラスも id も付与されない', () => {
    const btn = button();
    const container = div(btn);
    // _pending を一切積まない（バインディングなし）

    const html = container.protoRender();

    expect(html).not.toContain('id=');
    // クラス自動付与も走らない
    const wouldBeClass = resolveClassName('div>button[0]');
    expect(html).not.toContain(wouldBeClass);
    expect(html).toBe('<div><button></button></div>');
  });

  it('C: 明示 id 指定が自動生成より優先される（自動クラスは登録/出力されない）', () => {
    // ファクトリの AttributeMap で明示 id を渡す
    const btn = button({ id: 'my-explicit-id' });
    const container = div(btn);
    pushBinding(btn); // bindings あり

    const html = container.protoRender();

    expect(html).toContain('id="my-explicit-id"');
    // 自動生成クラス文字列は出力されない
    const autoClass = resolveClassName('div>button[0]');
    expect(html).not.toContain(autoClass);
    // id 属性は 1 個だけ（重複付与されない）
    const idMatches = html.match(/id="/g) ?? [];
    expect(idMatches.length).toBe(1);
  });

  it('D: 同じ tagPath で 2 要素が衝突しても HtmlError は発生しない', () => {
    const ctx = createDefaultRenderContext();

    const a = new TestTag('button');
    a.css.updateTagPath('root>button[0]');
    pushBinding(a);

    const b = new TestTag('button');
    b.css.updateTagPath('root>button[0]'); // 衝突する同一 tagPath
    pushBinding(b);

    // id 登録がないため衝突せず両方レンダーできる
    expect(() => a.protoRender(ctx)).not.toThrow();
    expect(() => b.protoRender(ctx)).not.toThrow();
  });

  it('補助: bindings なしの兄弟要素は複数あっても id を付与されない', () => {
    const container = div(span('one'), span('two'));

    const html = container.protoRender();
    expect(html).not.toContain('id=');
    expect(html).toBe('<div><span>one</span><span>two</span></div>');
  });

  it('補助: Root 配下でも明示 id は維持される（id="explicit" のみ出力）', () => {
    const root = new Root();
    const btn = button({ id: 'explicit' });
    root.addChild(btn);

    const html = root.protoRender();
    expect(html).toBe('<button id="explicit"></button>');
  });
});
