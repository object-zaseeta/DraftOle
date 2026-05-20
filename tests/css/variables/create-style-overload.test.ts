/**
 * Task 2.1: createStyle overload 追加
 *
 * Requirements: 2.1, 2.2, 2.4, 2.5
 *
 * - 名前あり形 `createStyle("name", {...})` は従来どおり `SharedStyle` を返す
 *   （`className`, `css`, `toString()` の挙動はバイト同等）
 * - 名前あり形の戻り値は内部に `_template: StyleTemplate` を保持する
 * - 無名形 `createStyle({...})` は `StyleTemplate`（`_kind: 'styleTemplate'`）を返す
 * - dispatch は第1引数の型（string か object か）で行う
 * - 同じ properties を別呼び出しで渡しても、それぞれは独立した別オブジェクト
 */
import { describe, it, expect } from 'vitest';
import { createStyle } from '../../../src/css/variables/css-shared-style.js';
import type { StyleTemplate } from '../../../src/css/variables/style-template.js';

describe('Task 2.1: createStyle overload', () => {
  describe('名前あり形 createStyle(name, properties, selectors?)', () => {
    it('従来どおり SharedStyle.className === "name" を返す', () => {
      const style = createStyle('card', { padding: '16px' });
      expect(style.className).toBe('card');
    });

    it('従来どおり .css に CSS ルールを含む', () => {
      const style = createStyle('btn', { padding: '10px' });
      expect(style.css).toContain('.btn {');
      expect(style.css).toContain('padding: 10px;');
    });

    it('toString() がクラス名を返す', () => {
      const style = createStyle('btn', { padding: '10px' });
      expect(`${style}`).toBe('btn');
    });

    it('内部に _template: StyleTemplate を保持する', () => {
      const style = createStyle('row', { display: 'flex', gap: '10px' });
      // _template は SharedStyle の内部フィールド
      const tpl = (style as { _template: StyleTemplate })._template;
      expect(tpl).toBeDefined();
      expect(tpl._kind).toBe('styleTemplate');
      expect(tpl.hasExplicitName).toBe(true);
      expect(tpl.name).toBe('row');
      expect(tpl.properties.display).toBe('flex');
      expect(tpl.properties.gap).toBe('10px');
      expect(typeof tpl.bodyHash).toBe('string');
      expect(tpl.bodyHash.length).toBeGreaterThan(0);
    });

    it('selectors を渡しても _template に反映される', () => {
      const style = createStyle(
        'btn',
        { padding: '10px' },
        { hover: { background: '#222' } },
      );
      const tpl = (style as { _template: StyleTemplate })._template;
      expect(tpl.selectors).toBeDefined();
      expect(tpl.selectors!.hover.background).toBe('#222');
    });
  });

  describe('無名形 createStyle(properties, selectors?)', () => {
    it('StyleTemplate を返す（_kind: "styleTemplate"）', () => {
      const tpl = createStyle({ display: 'flex', gap: '10px' });
      expect(tpl._kind).toBe('styleTemplate');
      expect(tpl.hasExplicitName).toBe(false);
      expect(tpl.name).toBeUndefined();
      expect(tpl.properties.display).toBe('flex');
    });

    it('selectors を渡せる', () => {
      const tpl = createStyle(
        { padding: '10px' },
        { hover: { background: '#222' } },
      );
      expect(tpl.selectors).toBeDefined();
      expect(tpl.selectors!.hover.background).toBe('#222');
    });

    it('bodyHash は同一 properties で同値、異なる properties で別値', () => {
      const a = createStyle({ display: 'flex' });
      const b = createStyle({ display: 'flex' });
      const c = createStyle({ display: 'block' });
      expect(a.bodyHash).toBe(b.bodyHash);
      expect(a.bodyHash).not.toBe(c.bodyHash);
    });

    it('別呼び出しは別オブジェクト（参照同一性なし）', () => {
      const a = createStyle({ display: 'flex' });
      const b = createStyle({ display: 'flex' });
      expect(a).not.toBe(b);
    });
  });

  describe('dispatch（第1引数の型による分岐）', () => {
    it('string を第1引数に渡すと SharedStyle を返す', () => {
      const result = createStyle('foo', { color: 'red' });
      expect(typeof (result as { className: string }).className).toBe('string');
      expect((result as { className: string }).className).toBe('foo');
    });

    it('object を第1引数に渡すと StyleTemplate を返す', () => {
      const result = createStyle({ color: 'red' });
      expect((result as StyleTemplate)._kind).toBe('styleTemplate');
    });
  });
});
