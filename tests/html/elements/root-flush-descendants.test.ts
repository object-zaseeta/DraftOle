/**
 * test-design-gate Group B — Root.flushDescendants の観測可能挙動を pin
 *
 * Plan: .kiro/test-audit/2026-05-22T22-37-51Z-ff54a2/design-plans/root-flush-and-tagpath-propagation.md
 * Mode: REFACTOR_PREP — 既存挙動を pin する characterization tests
 * Spec ref: root.ts L256–266 / unified-element-api Req 1.6, 1.7
 *
 * 検証経路: AppDocument.exportTo と同じ「bodyEl.addChild(view) → root.flushDescendants(view)」
 * のシナリオで、observable な renderVanillaScript() 出力を pin する。
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../../src/html/elements/root.js';
import { html, head, body, section, div, p, Text } from '../../../src/html/tags/factories.js';
import type { HTMLTagProtocol } from '../../../src/html/protocols/html-tag-protocol.js';
import type { ScriptScope } from '../../../src/js/vanilla/script-scope.js';

/**
 * AppDocument.exportTo 相当の最小セットアップ。
 * Root に html(head, body) を addChild 済み（= root scope 確立、bodyEl._scope セット済み）。
 */
function makeFlushTestRoot(): { root: Root; bodyEl: ReturnType<typeof body> } {
  const root = new Root();
  const bodyEl = body();
  root.addChild(html(head(), bodyEl));
  return { root, bodyEl };
}

describe('Root.flushDescendants の観測可能挙動 (REFACTOR_PREP pin)', () => {
  it('T7: HtmlTag 子の pending JS コマンドを Root scope へ移送する', () => {
    const { root, bodyEl } = makeFlushTestRoot();

    // view 配下に pending を持つ要素を組み立てる（Root.addChild を経由しないので未 flush）
    const btn = p();
    // biome-ignore lint/complexity/useArrowFunction: HandlerCallback は function 式が必要
    btn.on('click', function (s: ScriptScope) {
      s.call('handleClickT7');
    });
    const view = section();
    view.addChild(btn);

    // bodyEl.addChild は HtmlTag.addChild — flush しない（AppDocument.exportTo と同じ経路）
    bodyEl.addChild(view as unknown as HTMLTagProtocol);
    const before = root.renderVanillaScript();
    expect(before).not.toContain('handleClickT7');

    root.flushDescendants(view as unknown as HTMLTagProtocol);

    const after = root.renderVanillaScript();
    expect(after).toContain('handleClickT7');
  });

  it('T8: 非 HtmlTag 入力 (Text) に対し no-op で script を変化させない', () => {
    const { root } = makeFlushTestRoot();
    const before = root.renderVanillaScript();

    const textNode = Text('hello');

    expect(() => {
      root.flushDescendants(textNode as unknown as HTMLTagProtocol);
    }).not.toThrow();

    expect(root.renderVanillaScript()).toBe(before);
  });

  it('T9: 孫の HtmlTag に対しても DFS 再帰で pending を転送する', () => {
    const { root, bodyEl } = makeFlushTestRoot();

    const grandchild = p();
    // biome-ignore lint/complexity/useArrowFunction: HandlerCallback は function 式が必要
    grandchild.on('click', function (s: ScriptScope) {
      s.call('grandT9');
    });
    const middle = div();
    middle.addChild(grandchild);
    const view = section();
    view.addChild(middle);

    bodyEl.addChild(view as unknown as HTMLTagProtocol);
    expect(root.renderVanillaScript()).not.toContain('grandT9');

    root.flushDescendants(view as unknown as HTMLTagProtocol);

    expect(root.renderVanillaScript()).toContain('grandT9');
  });

  it('T10: 既にフラッシュ済みの child に対して呼び出してもコマンドが重複しない', () => {
    const { root, bodyEl } = makeFlushTestRoot();

    const btn = p();
    // biome-ignore lint/complexity/useArrowFunction: HandlerCallback は function 式が必要
    btn.on('click', function (s: ScriptScope) {
      s.call('idemT10');
    });
    const view = section();
    view.addChild(btn);

    bodyEl.addChild(view as unknown as HTMLTagProtocol);
    root.flushDescendants(view as unknown as HTMLTagProtocol); // 1 回目
    const script1 = root.renderVanillaScript();
    expect(script1).toContain('idemT10');

    root.flushDescendants(view as unknown as HTMLTagProtocol); // 2 回目（冪等）

    const script2 = root.renderVanillaScript();
    expect(script2).toBe(script1);
  });

  it('T11: pending を持たない child では script 出力が変化しない', () => {
    const { root, bodyEl } = makeFlushTestRoot();
    const before = root.renderVanillaScript();

    const view = section(); // element method 未呼出 = pending 0 件
    bodyEl.addChild(view as unknown as HTMLTagProtocol);

    root.flushDescendants(view as unknown as HTMLTagProtocol);

    expect(root.renderVanillaScript()).toBe(before);
  });
});
