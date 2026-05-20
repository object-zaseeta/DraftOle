/**
 * Task 2.4 (element-style-colocated): `HtmlTag._pendingStyleTemplates` /
 * `addStyleTemplates(tpls)` の構造テスト。
 *
 * 設計上の役割（design.md「遅延解決モデル」節）:
 *   - 属性パース時（applyAttributeMap）に受理した StyleTemplate を、
 *     render 前は HtmlTag 内部にだけ保持する（CssManager には流さない）
 *   - render 時（Task 3.4）に tagPath が確定した段階で初めて
 *     CssManager.registerTemplate(...) に流し込む
 *
 * 本タスクでは「保持のみ」を担保する:
 *   - 初期状態で `_pendingStyleTemplates` が空配列
 *   - `addStyleTemplates(tpls)` が push 順序を保持
 *   - `addStyleTemplates(tpls)` 自身は `this` を返す
 *   - `addStyleTemplates(tpls)` 呼び出し後、render 前は CssManager 側に
 *     ルールが追加されていない（renderCss() が空のまま）
 *
 * Requirements: 1.1, 1.4
 */
import { describe, it, expect } from 'vitest';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import type { TagType } from '../../../src/html/tags/tag-type.js';
import {
  createStyleTemplate,
  type StyleTemplate,
} from '../../../src/css/variables/style-template.js';

class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

type Internals = {
  _pendingStyleTemplates: StyleTemplate[];
};

const internals = (tag: HtmlTag): Internals =>
  tag as Internals;

const makeTpl = (color: string): StyleTemplate =>
  createStyleTemplate({ properties: { color } });

describe('HtmlTag: _pendingStyleTemplates / addStyleTemplates (Task 2.4)', () => {
  it('生成直後の `_pendingStyleTemplates` は空配列である', () => {
    const tag = new TestTag();
    const state = internals(tag);
    expect(Array.isArray(state._pendingStyleTemplates)).toBe(true);
    expect(state._pendingStyleTemplates).toEqual([]);
  });

  it('各インスタンスは独立した `_pendingStyleTemplates` 配列を持つ', () => {
    const a = new TestTag('div');
    const b = new TestTag('span');
    expect(internals(a)._pendingStyleTemplates).not.toBe(
      internals(b)._pendingStyleTemplates,
    );
  });

  it('`addStyleTemplates(tpls)` は this を返す（メソッドチェーン）', () => {
    const tag = new TestTag();
    const result = tag.addStyleTemplates([makeTpl('red')]);
    expect(result).toBe(tag);
  });

  it('`addStyleTemplates(tpls)` は push 順序を保持する', () => {
    const tag = new TestTag();
    const t1 = makeTpl('red');
    const t2 = makeTpl('green');
    const t3 = makeTpl('blue');
    tag.addStyleTemplates([t1, t2]);
    tag.addStyleTemplates([t3]);
    expect(internals(tag)._pendingStyleTemplates).toEqual([t1, t2, t3]);
  });

  it('空配列を渡しても _pendingStyleTemplates は変化しない', () => {
    const tag = new TestTag();
    const t1 = makeTpl('red');
    tag.addStyleTemplates([t1]);
    tag.addStyleTemplates([]);
    expect(internals(tag)._pendingStyleTemplates).toEqual([t1]);
  });

  it('`addStyleTemplates` は CssManager にルールを流さない（renderCss は空のまま）', () => {
    const tag = new TestTag();
    const before = tag.css.renderCss();
    tag.addStyleTemplates([makeTpl('red'), makeTpl('blue')]);
    const after = tag.css.renderCss();
    expect(after).toBe(before);
    expect(after).toBe('');
  });
});
