/**
 * test-design-gate Group A — addChild + _propagateTagPaths の tagPath 構造を pin
 *
 * Plan: .kiro/test-audit/2026-05-22T22-37-51Z-ff54a2/design-plans/root-flush-and-tagpath-propagation.md
 * Mode: REFACTOR_PREP — 既存挙動を pin する characterization tests
 * Spec ref: DF-2 (html-tag.ts L463–488)
 *
 * これらのテストは現コードに対して PASS することを期待する（REFACTOR_PREP の規約）。
 * 将来の addChild / _propagateTagPaths 統合リファクタの際の安全網になる。
 */
import { describe, it, expect } from 'vitest';
import {
  div,
  p,
  span,
  h1,
  html,
  head,
  body,
  section,
  Text,
} from '../../../src/html/tags/factories.js';
import { Root } from '../../../src/html/elements/root.js';
import type { HTMLTagProtocol } from '../../../src/html/protocols/html-tag-protocol.js';

describe('addChild + _propagateTagPaths の tagPath 構造 (DF-2 / REFACTOR_PREP pin)', () => {
  it('T1: 親に tagPath が無い場合、子は `${parent.tagType}>${child.tagType}[0]` を取る', () => {
    const parent = div();
    const child = p();

    parent.addChild(child);

    expect(child.css.tagPath).toBe('div>p[0]');
  });

  it('T2: 同じ親に 2 件目を addChild すると index が 1 になる', () => {
    const parent = div();
    parent.addChild(p());

    const second = span();
    parent.addChild(second);

    expect(second.css.tagPath).toBe('div>span[1]');
  });

  it('T3: addChild は孫要素の tagPath も再帰的に書き換える', () => {
    const inner = section();
    const leaf = p();
    inner.addChild(leaf);
    // この時点では inner は親を持たないので leaf.tagPath は 'section>p[0]'
    expect(leaf.css.tagPath).toBe('section>p[0]');

    const container = div();
    container.addChild(inner);

    expect(inner.css.tagPath).toBe('div>section[0]');
    expect(leaf.css.tagPath).toBe('div>section[0]>p[0]');
  });

  it('T4: 親の既存 tagPath を prefix として継承する', () => {
    // Root 配下に attach 済みの body の tagPath を動的に取得して期待値を組み立てる
    const root = new Root();
    const bodyEl = body();
    root.addChild(html(head(), bodyEl));

    const bodyPath = bodyEl.css.tagPath;
    expect(bodyPath).not.toBe(''); // 前提: 祖先連鎖から確定済

    const child = p();
    bodyEl.addChild(child);

    expect(child.css.tagPath).toBe(`${bodyPath}>p[0]`);
  });

  it('T5: addChildren は要素ごとに index を 0, 1, 2 と進める (characterization)', () => {
    const parent = div();
    const a = p();
    const b = span();
    const c = h1();

    parent.addChildren([a, b, c]);

    expect([a.css.tagPath, b.css.tagPath, c.css.tagPath]).toEqual([
      'div>p[0]',
      'div>span[1]',
      'div>h1[2]',
    ]);
  });

  it('T6: 非 HtmlTag 子 (Text) に対しては tagPath 更新をスキップし throw しない', () => {
    const parent = div();
    const text = Text('hello');

    expect(() => parent.addChild(text as unknown as HTMLTagProtocol)).not.toThrow();
    expect(parent.children.length).toBe(1);
  });
});
