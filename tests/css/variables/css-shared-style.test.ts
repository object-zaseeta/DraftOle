/**
 * Task 6.3: CssSharedStyleTests
 *
 * Requirements: 4.3
 *
 * src/css/variables/css-shared-style.ts の未到達分岐を網羅する。
 * - createStyle overload dispatch（named vs unnamed）
 * - renderCssBody の sanitize フィルタ経路（dangerous value で空化）
 * - resolveSelector の `:key` フォールバック経路（line 113）
 * - createStyleNamed の selectors 省略 / 空 properties / 空 selectors 経路
 */
import { describe, it, expect } from 'vitest';
import {
  createStyle,
  createStyleNamed,
} from '../../../src/css/variables/css-shared-style.js';
import type { StyleTemplate } from '../../../src/css/variables/style-template.js';

describe('Task 6.3: css-shared-style branch coverage', () => {
  describe('createStyle overload dispatch', () => {
    it('named form（第1引数 string）は SharedStyle を返す', () => {
      const result = createStyle('btn', { padding: '8px' });
      // SharedStyle は className を持つ
      expect((result as { className: string }).className).toBe('btn');
      expect((result as { css: string }).css).toContain('.btn {');
      // _template も内部に保持される
      const tpl = (result as { _template: StyleTemplate })._template;
      expect(tpl._kind).toBe('styleTemplate');
      expect(tpl.hasExplicitName).toBe(true);
      expect(tpl.name).toBe('btn');
    });

    it('named form の selectors 引数（第3引数）は _template に反映される', () => {
      const result = createStyle(
        'card',
        { padding: '8px' },
        { hover: { background: '#111' } },
      );
      const tpl = (result as { _template: StyleTemplate })._template;
      expect(tpl.selectors).toBeDefined();
      expect(tpl.selectors!.hover.background).toBe('#111');
    });

    it('unnamed form（第1引数 object）は StyleTemplate を返す', () => {
      const result = createStyle({ display: 'flex' });
      expect((result as StyleTemplate)._kind).toBe('styleTemplate');
      expect((result as StyleTemplate).hasExplicitName).toBe(false);
      expect((result as StyleTemplate).name).toBeUndefined();
    });

    it('unnamed form でも selectors（第2引数）を渡せる', () => {
      const tpl = createStyle(
        { color: 'red' },
        { hover: { color: 'blue' } },
      ) as StyleTemplate;
      expect(tpl.selectors).toBeDefined();
      expect(tpl.selectors!.hover.color).toBe('blue');
    });

    it('unnamed form で selectors を省略しても StyleTemplate を返す', () => {
      const tpl = createStyle({ color: 'red' }) as StyleTemplate;
      expect(tpl._kind).toBe('styleTemplate');
      expect(tpl.selectors).toBeUndefined();
    });
  });

  describe('renderCssBody sanitize filter（line 46: dangerous value → 空化）', () => {
    it('url(javascript:...) を含む値は出力から除外される', () => {
      const style = createStyleNamed('xss-url', {
        background: 'url(javascript:alert(1))',
        color: '#fff',
      });
      // dangerous value は除外され、安全な値だけが残る
      expect(style.css).not.toContain('javascript:');
      expect(style.css).not.toContain('background:');
      expect(style.css).toContain('color: #fff;');
    });

    it('expression(...) を含む値は出力から除外される', () => {
      const style = createStyleNamed('xss-expr', {
        width: 'expression(alert(1))',
        padding: '8px',
      });
      expect(style.css).not.toContain('expression(');
      expect(style.css).not.toContain('width:');
      expect(style.css).toContain('padding: 8px;');
    });

    it('全プロパティが dangerous の場合、CSS body は空行のみ', () => {
      const style = createStyleNamed('all-bad', {
        background: 'url(javascript:alert(1))',
      });
      // base rule は出力されるが、本文行は空
      expect(style.css).toContain('.all-bad {');
      expect(style.css).not.toContain('javascript:');
      expect(style.css).not.toContain('background:');
    });

    it('selectors 内の dangerous value も除外される', () => {
      const style = createStyleNamed(
        'btn',
        { padding: '8px' },
        {
          hover: {
            background: 'url(vbscript:msg(1))',
            color: '#fff',
          },
        },
      );
      expect(style.css).not.toContain('vbscript:');
      // 安全な color は残る
      expect(style.css).toContain('.btn:hover {');
      expect(style.css).toContain('color: #fff;');
    });
  });

  describe('resolveSelector fallback（line 113: non-pseudo, non-compound, non-descendant → :key）', () => {
    it('未知のキー（非疑似クラス・非 & 始まり・非空白始まり）は :key として扱われる', () => {
      const style = createStyleNamed(
        'btn',
        { padding: '8px' },
        {
          // "checked" は PSEUDO_SELECTORS セットに含まれない（IDE 補完対象外）
          // → fallback で .btn:checked になる
          checked: { color: 'green' },
        },
      );
      expect(style.css).toContain('.btn:checked {');
      expect(style.css).toContain('color: green;');
    });

    it('::pseudo-element 風の任意キーも :key フォールバックで連結される', () => {
      const style = createStyleNamed(
        'box',
        { display: 'block' },
        {
          ':before': { content: '"x"' },
        },
      );
      // resolveSelector の fallback により `.box::before` 相当の連結
      expect(style.css).toContain('.box::before {');
      expect(style.css).toContain('content: "x";');
    });
  });

  describe('createStyleNamed の base rule 出力分岐', () => {
    it('properties が空オブジェクトの場合、base rule は出力されない', () => {
      const style = createStyleNamed('empty', {});
      expect(style.className).toBe('empty');
      expect(style.css).toBe('');
    });

    it('properties は空でも selectors が指定されれば selector rule のみ出力される', () => {
      const style = createStyleNamed(
        'only-hover',
        {},
        { hover: { color: '#fff' } },
      );
      expect(style.css).not.toContain('.only-hover {\n');
      expect(style.css).toContain('.only-hover:hover {');
      expect(style.css).toContain('color: #fff;');
    });

    it('selectors の個別エントリが空 props の場合、その selector は出力されない', () => {
      const style = createStyleNamed(
        'btn',
        { padding: '8px' },
        {
          hover: {}, // 空 → 出力されない
          focus: { outline: '2px solid' },
        },
      );
      expect(style.css).toContain('.btn {');
      expect(style.css).not.toContain('.btn:hover {');
      expect(style.css).toContain('.btn:focus {');
    });

    it('selectors が undefined の場合、base rule のみ出力される', () => {
      const style = createStyleNamed('plain', { padding: '8px' });
      expect(style.css).toContain('.plain {');
      expect(style.css).toContain('padding: 8px;');
      // selector rule（`.plain:hover`, `.plain.modifier`, `.plain .child`）は無い
      expect(style.css).not.toMatch(/\.plain:/);
      expect(style.css).not.toMatch(/\.plain\./);
      expect(style.css).not.toMatch(/\.plain \./);
    });
  });

  describe('resolveSelector 既存分岐の確認（regression guard）', () => {
    it('hover は PSEUDO_SELECTORS にあるので `.name:hover`', () => {
      const style = createStyleNamed(
        'btn',
        { padding: '8px' },
        { hover: { color: 'red' } },
      );
      expect(style.css).toContain('.btn:hover {');
    });

    it('& 始まりは compound selector `.name.modifier`', () => {
      const style = createStyleNamed(
        'btn',
        { padding: '8px' },
        { '&.primary': { borderColor: 'blue' } },
      );
      expect(style.css).toContain('.btn.primary {');
    });

    it('空白始まりは descendant selector `.name .child`', () => {
      const style = createStyleNamed(
        'card',
        { padding: '8px' },
        { ' .icon': { width: '16px' } },
      );
      expect(style.css).toContain('.card .icon {');
    });
  });
});
