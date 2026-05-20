/**
 * Task 2.2: extractStyleTemplates / applyAttributeMap
 *
 * `css` 属性経由で渡された StyleTemplate / SharedStyle / 配列を
 * フラットな `StyleTemplate[]` として抽出し、tag に attributes と
 * pendingStyleTemplates を順に適用することを検証する。
 *
 * Requirements: 1.1, 1.4, 1.5, 1.6
 */
import { describe, it, expect, vi } from 'vitest';
import {
  extractStyleTemplates,
  applyAttributeMap,
  type AttributeMap,
} from '../../src/html/tags/factories-utils.js';
import { createStyle } from '../../src/css/variables/css-shared-style.js';
import type { StyleTemplate } from '../../src/css/variables/style-template.js';
import type { HtmlAttributeShape } from '../../src/html/protocols/html-tag-protocol.js';

interface MockTag {
  attrs: HtmlAttributeShape[];
  tpls: StyleTemplate[];
  addHtmlAttribute(a: HtmlAttributeShape): unknown;
  addStyleTemplates(t: StyleTemplate[]): unknown;
}

function createMockTag(): MockTag {
  const tag: MockTag = {
    attrs: [],
    tpls: [],
    addHtmlAttribute(a) {
      this.attrs.push(a);
      return this;
    },
    addStyleTemplates(t) {
      this.tpls.push(...t);
      return this;
    },
  };
  return tag;
}

describe('extractStyleTemplates', () => {
  it('css キー未指定なら空配列を返す', () => {
    const result = extractStyleTemplates({ class: 'btn' });
    expect(result).toEqual([]);
  });

  it('無名 createStyle (StyleTemplate) を 1 件のリストとして返す', () => {
    const tpl = createStyle({ display: 'flex' });
    const result = extractStyleTemplates({ css: tpl });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(tpl);
  });

  it('名前あり createStyle (SharedStyle) は内部 _template を取り出す', () => {
    const shared = createStyle('btn', { padding: '8px' });
    const result = extractStyleTemplates({ css: shared });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(shared._template);
  });

  it('配列 [tplA, tplB] を順序保持でフラット化する', () => {
    const a = createStyle({ display: 'flex' });
    const b = createStyle({ gap: '10px' });
    const result = extractStyleTemplates({ css: [a, b] });
    expect(result).toEqual([a, b]);
  });

  it('配列内に StyleTemplate と SharedStyle が混在しても両方フラット化する', () => {
    const a = createStyle({ display: 'flex' });
    const b = createStyle('row', { gap: '8px' });
    const result = extractStyleTemplates({ css: [a, b] });
    expect(result[0]).toBe(a);
    expect(result[1]).toBe(b._template);
  });

  it('css 値が非 StyleTemplate なら TypeError をスローする', () => {
    expect(() =>
      extractStyleTemplates({ css: 'invalid' as StyleTemplate }),
    ).toThrow(TypeError);
  });

  it('純関数：入力 map を変更しない', () => {
    const tpl = createStyle({ display: 'flex' });
    const map: AttributeMap = { css: tpl, class: 'btn' };
    const snapshot = JSON.stringify(Object.keys(map));
    extractStyleTemplates(map);
    expect(JSON.stringify(Object.keys(map))).toBe(snapshot);
  });
});

describe('applyAttributeMap', () => {
  it('css 属性のみ：attrs は空、tpls に StyleTemplate を 1 件追加する', () => {
    const tag = createMockTag();
    const tpl = createStyle({ display: 'flex' });
    applyAttributeMap(tag, { css: tpl });
    expect(tag.attrs).toHaveLength(0);
    expect(tag.tpls).toEqual([tpl]);
  });

  it('css 配列：tpls に順序通り全件追加される', () => {
    const tag = createMockTag();
    const a = createStyle({ display: 'flex' });
    const b = createStyle({ gap: '10px' });
    applyAttributeMap(tag, { css: [a, b] });
    expect(tag.tpls).toEqual([a, b]);
    expect(tag.attrs).toHaveLength(0);
  });

  it('css と class 共存：attrs に class が入り、tpls に StyleTemplate が入る', () => {
    const tag = createMockTag();
    const tpl = createStyle({ display: 'flex' });
    applyAttributeMap(tag, { css: tpl, class: 'btn primary' });
    expect(tag.tpls).toEqual([tpl]);
    expect(tag.attrs).toHaveLength(1);
    // class が attrs に存在すること
    const rendered = tag.attrs[0]!.renderAttribute();
    expect(rendered).toContain('class');
    expect(rendered).toContain('btn');
    expect(rendered).toContain('primary');
  });

  it('css なしの通常属性パターンでは tpls は空、attrs は parseAttributeMap と同じ', () => {
    const tag = createMockTag();
    applyAttributeMap(tag, { class: 'btn', id: 'main' });
    expect(tag.tpls).toEqual([]);
    expect(tag.attrs).toHaveLength(2);
  });

  it('呼び出し順：addHtmlAttribute が addStyleTemplates より先に呼ばれる', () => {
    const calls: string[] = [];
    const tpl = createStyle({ display: 'flex' });
    const tag = {
      addHtmlAttribute: vi.fn(() => {
        calls.push('attr');
      }),
      addStyleTemplates: vi.fn(() => {
        calls.push('tpls');
      }),
    };
    applyAttributeMap(tag, { class: 'btn', css: tpl });
    expect(calls[0]).toBe('attr');
    expect(calls[calls.length - 1]).toBe('tpls');
  });

  it('class キーに styleObject (非文字列) が渡されたら TypeError', () => {
    const tag = createMockTag();
    const tpl = createStyle({ display: 'flex' });
    expect(() =>
      // @ts-expect-error: 型レベルでも禁止だが、ランタイムガードの動作を検証する
      applyAttributeMap(tag, { class: tpl }),
    ).toThrow(TypeError);
  });
});
