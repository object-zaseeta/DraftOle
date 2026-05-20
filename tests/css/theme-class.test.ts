/**
 * theme-class-method spec: theme.class() の振る舞い検証
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 5.1, 5.2,
 * 5.3, 5.4, 6.1, 6.3, 6.4
 */
import { describe, it, expect } from 'vitest';
import { css } from '../../src/css/css.js';
import { buildUnifiedTheme } from '../../src/css/variables/unified-theme.js';

describe('theme-class-method: theme.class()', () => {
  describe('T1: 無名形戻り値（StyleTemplate）', () => {
    it('properties のみ → _kind=styleTemplate / hasExplicitName=false', () => {
      const theme = css.theme({ panel: '#222' });
      const tpl = theme.class({ background: 'panel' });
      expect(tpl._kind).toBe('styleTemplate');
      expect(tpl.hasExplicitName).toBe(false);
      expect(tpl.properties.background).toBe('var(--panel)');
    });
  });

  describe('T2: 明示名形戻り値（SharedStyle）', () => {
    it('name + properties → className=name / css に .name ブロック', () => {
      const theme = css.theme({ panel: '#222' });
      const style = theme.class('card', { background: 'panel' });
      expect(style.className).toBe('card');
      expect(style.css).toContain('.card {');
      expect(style.css).toContain('background: var(--panel);');
    });
  });

  describe('T3: 決定論的（同入力で同 bodyHash / properties）', () => {
    it('同 properties で 2 回呼んでも一致', () => {
      const theme = css.theme({ panel: '#222' });
      const a = theme.class({ background: 'panel' });
      const b = theme.class({ background: 'panel' });
      expect(a.bodyHash).toBe(b.bodyHash);
      expect(a.properties).toEqual(b.properties);
    });
  });

  describe('T4: token 名一致 → var(--name) / CSS keyword はそのまま', () => {
    it('token 名一致は var() に解決、keyword は変換しない', () => {
      const theme = css.theme({ panel: '#222' });
      const tpl = theme.class({
        background: 'panel',
        cursor: 'pointer',
        color: 'transparent',
      });
      expect(tpl.properties.background).toBe('var(--panel)');
      expect(tpl.properties.cursor).toBe('pointer');
      expect(tpl.properties.color).toBe('transparent');
    });

    it('未定義リテラル / 複合値はそのまま', () => {
      const theme = css.theme({ panel: '#222' });
      const tpl = theme.class({
        padding: '16px',
        color: '#fff',
        border: '1px solid red',
      });
      expect(tpl.properties.padding).toBe('16px');
      expect(tpl.properties.color).toBe('#fff');
      expect(tpl.properties.border).toBe('1px solid red');
    });
  });

  describe('T5: 出力 CSS の同一性（theme.class vs css.theme 内クラスエントリ）', () => {
    it('明示名形 .card ブロックが css.theme({card:{...}}) と一致', () => {
      const themeA = css.theme({ panel: '#222' });
      const styleA = themeA.class('card', { background: 'panel' });

      const themeB = css.theme({
        panel: '#222',
        card: { background: 'panel' },
      });
      // themeB.css は :root + .card ブロックを含む
      expect(themeB.css).toContain('.card {');
      expect(themeB.css).toContain('background: var(--panel);');
      // styleA.css の .card ブロック行が themeB.css に完全に現れる
      expect(themeB.css).toContain(styleA.css);
    });
  });

  describe('T6 / 4.1, 4.2: theme.css は theme.class() 呼び出しの影響を受けない', () => {
    it('呼び出し前後で theme.css が一致', () => {
      const theme = css.theme({ panel: '#222' });
      const before = theme.css;
      theme.class({ background: 'panel' });
      theme.class('card', { background: 'panel' });
      const after = theme.css;
      expect(after).toBe(before);
    });

    it('theme.css にはトークンのみ含まれ、theme.class 経由のクラスは含まれない', () => {
      const theme = css.theme({ panel: '#222' });
      theme.class('card', { background: 'panel' });
      expect(theme.css).toContain('--panel: #222;');
      expect(theme.css).not.toContain('.card');
    });
  });

  describe('T7 / 5.1: 既存形式 css.theme({...,card:{...}}) は変化なし', () => {
    it('既存形式 theme の出力 CSS に :root と .card ブロックが含まれる', () => {
      const theme = css.theme({
        panel: '#222',
        card: { background: 'panel' },
      });
      expect(theme.css).toContain(':root {');
      expect(theme.css).toContain('--panel: #222;');
      expect(theme.css).toContain('.card {');
      expect(theme.card.className).toBe('card');
    });
  });

  describe('T8 / 3.5: selectors 内 properties にも token 解決', () => {
    it('selectors の properties に対しても token → var() 変換', () => {
      const theme = css.theme({ panel: '#222', accent: '#7c5cff' });
      const style = theme.class('btn', { background: 'panel' }, {
        hover: { background: 'accent' },
      });
      expect(style.css).toContain('.btn:hover');
      expect(style.css).toContain('background: var(--accent);');
    });
  });

  describe('Object.keys 列挙性（class は enumerable:false）', () => {
    it('class は Object.keys に現れない', () => {
      const theme = css.theme({ panel: '#222' });
      expect(Object.keys(theme)).not.toContain('class');
      expect(Object.keys(theme)).not.toContain('css');
      expect(typeof theme.class).toBe('function');
    });
  });

  describe('buildUnifiedTheme 直接呼び出しでも class が付与される', () => {
    it('buildUnifiedTheme(...) の戻り値に class メソッドがある', () => {
      const theme = buildUnifiedTheme({ panel: '#222' });
      expect(typeof theme.class).toBe('function');
      const tpl = theme.class({ background: 'panel' });
      expect(tpl._kind).toBe('styleTemplate');
    });
  });
});
