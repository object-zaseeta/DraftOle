/**
 * Contextual CSS keyword resolver のユニットテスト
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 5.1, 5.2
 * Spec: .kiro/specs/contextual-keyword-resolver/
 */
import { describe, it, expect } from 'vitest';
import {
  resolveTokenRefs,
  CSS_KEYWORDS,
  COLOR_PROPERTIES,
  NON_COLOR_KEYWORDS,
  COLOR_KEYWORDS,
  getKeywordsForProperty,
  defaultKeywordResolver,
} from '../../src/css/variables/unified-theme.js';

describe('COLOR_PROPERTIES', () => {
  it('代表的な color 系プロパティを含む', () => {
    for (const p of [
      'color',
      'background',
      'background-color',
      'border-color',
      'border-top-color',
      'outline-color',
      'text-decoration-color',
      'caret-color',
      'fill',
      'stroke',
    ]) {
      expect(COLOR_PROPERTIES.has(p)).toBe(true);
    }
  });

  it('非カラー系プロパティを含まない', () => {
    for (const p of ['cursor', 'display', 'font-weight', 'border-style']) {
      expect(COLOR_PROPERTIES.has(p)).toBe(false);
    }
  });
});

describe('NON_COLOR_KEYWORDS', () => {
  it('cursor/display/auto 等のカラー値として無効な keyword を含む', () => {
    for (const k of ['text', 'pointer', 'block', 'auto', 'bold', 'solid']) {
      expect(NON_COLOR_KEYWORDS.has(k)).toBe(true);
    }
  });

  it('color プロパティでも有効な keyword は含まない', () => {
    for (const k of [
      'inherit',
      'initial',
      'unset',
      'revert',
      'none',
      'transparent',
      'currentcolor',
      'red',
      'white',
    ]) {
      expect(NON_COLOR_KEYWORDS.has(k)).toBe(false);
    }
  });
});

describe('COLOR_KEYWORDS', () => {
  it('CSS_KEYWORDS から NON_COLOR_KEYWORDS を除いた集合になっている', () => {
    expect(COLOR_KEYWORDS.has('text')).toBe(false);
    expect(COLOR_KEYWORDS.has('pointer')).toBe(false);
    expect(COLOR_KEYWORDS.has('block')).toBe(false);
    expect(COLOR_KEYWORDS.has('auto')).toBe(false);
    expect(COLOR_KEYWORDS.has('red')).toBe(true);
    expect(COLOR_KEYWORDS.has('transparent')).toBe(true);
    expect(COLOR_KEYWORDS.has('inherit')).toBe(true);
  });
});

describe('getKeywordsForProperty', () => {
  it('color プロパティに対し COLOR_KEYWORDS を返す', () => {
    expect(getKeywordsForProperty('color')).toBe(COLOR_KEYWORDS);
    expect(getKeywordsForProperty('background')).toBe(COLOR_KEYWORDS);
    expect(getKeywordsForProperty('border-color')).toBe(COLOR_KEYWORDS);
  });

  it('非カラープロパティに対し CSS_KEYWORDS を返す', () => {
    expect(getKeywordsForProperty('cursor')).toBe(CSS_KEYWORDS);
    expect(getKeywordsForProperty('display')).toBe(CSS_KEYWORDS);
  });

  it('未知プロパティに対し default (CSS_KEYWORDS) を返す', () => {
    expect(getKeywordsForProperty('unknown-prop')).toBe(CSS_KEYWORDS);
    expect(getKeywordsForProperty('')).toBe(CSS_KEYWORDS);
  });

  it('大文字小文字を正規化（CSS プロパティ名は case-insensitive）', () => {
    expect(getKeywordsForProperty('Color')).toBe(COLOR_KEYWORDS);
    expect(getKeywordsForProperty('BACKGROUND')).toBe(COLOR_KEYWORDS);
  });

  it('defaultKeywordResolver は getKeywordsForProperty と等価', () => {
    expect(defaultKeywordResolver('color')).toBe(getKeywordsForProperty('color'));
    expect(defaultKeywordResolver('cursor')).toBe(getKeywordsForProperty('cursor'));
  });
});

describe('resolveTokenRefs with property-aware resolver', () => {
  describe('Requirement 1: カラー系プロパティでの token 優先', () => {
    it('Req 1.1: color: "text" + text token → var(--text)', () => {
      const r = resolveTokenRefs(
        { color: 'text' },
        new Set(['text']),
        defaultKeywordResolver,
      );
      expect(r.color).toBe('var(--text)');
    });

    it('Req 1.2: background: "panel" + panel token → var(--panel)', () => {
      const r = resolveTokenRefs(
        { background: 'panel' },
        new Set(['panel']),
        defaultKeywordResolver,
      );
      expect(r.background).toBe('var(--panel)');
    });

    it('Req 1.2 派生: background-color: "panel" → var(--panel)', () => {
      const r = resolveTokenRefs(
        { 'background-color': 'panel' },
        new Set(['panel']),
        defaultKeywordResolver,
      );
      expect(r['background-color']).toBe('var(--panel)');
    });

    it('Req 1.3: border-color: "accent" + accent token → var(--accent)', () => {
      const r = resolveTokenRefs(
        { 'border-color': 'accent' },
        new Set(['accent']),
        defaultKeywordResolver,
      );
      expect(r['border-color']).toBe('var(--accent)');
    });

    it('Req 1.3: outline-color: "accent" + accent token → var(--accent)', () => {
      const r = resolveTokenRefs(
        { 'outline-color': 'accent' },
        new Set(['accent']),
        defaultKeywordResolver,
      );
      expect(r['outline-color']).toBe('var(--accent)');
    });

    it('Req 1.4: 衝突時 token 優先（color で `text` は token 解決される）', () => {
      const tokens = new Set(['text']);
      const r = resolveTokenRefs({ color: 'text' }, tokens, defaultKeywordResolver);
      expect(r.color).toBe('var(--text)');
    });

    it('Req 1.5: color: "text" token 未登録 → リテラル維持', () => {
      const r = resolveTokenRefs(
        { color: 'text' },
        new Set(),
        defaultKeywordResolver,
      );
      expect(r.color).toBe('text');
    });
  });

  describe('Requirement 2: 非カラー系プロパティの既存挙動維持', () => {
    it('Req 2.1: cursor: "text" + text token → keyword 優先で cursor: text', () => {
      const r = resolveTokenRefs(
        { cursor: 'text' },
        new Set(['text']),
        defaultKeywordResolver,
      );
      expect(r.cursor).toBe('text');
    });

    it('Req 2.2: display: "block" + block token → keyword 優先', () => {
      const r = resolveTokenRefs(
        { display: 'block' },
        new Set(['block']),
        defaultKeywordResolver,
      );
      expect(r.display).toBe('block');
    });

    it('Req 2.2: pointer-events: "auto" → keyword 維持', () => {
      const r = resolveTokenRefs(
        { 'pointer-events': 'auto' },
        new Set(),
        defaultKeywordResolver,
      );
      expect(r['pointer-events']).toBe('auto');
    });

    it('Req 2.3: 非カラープロパティで token と keyword 衝突 → keyword 優先', () => {
      const r = resolveTokenRefs(
        { 'font-weight': 'bold' },
        new Set(['bold']),
        defaultKeywordResolver,
      );
      expect(r['font-weight']).toBe('bold');
    });
  });

  describe('Requirement 4: 既存挙動互換性', () => {
    it('Req 4.3: color: "transparent" → named keyword 維持', () => {
      const r = resolveTokenRefs(
        { color: 'transparent' },
        new Set(['transparent']),
        defaultKeywordResolver,
      );
      expect(r.color).toBe('transparent');
    });

    it('Req 4.3: color: "red" → named color 維持', () => {
      const r = resolveTokenRefs(
        { color: 'red' },
        new Set(['red']),
        defaultKeywordResolver,
      );
      expect(r.color).toBe('red');
    });

    it('Req 4.3: color: "inherit" → CSS-wide keyword 維持', () => {
      const r = resolveTokenRefs(
        { color: 'inherit' },
        new Set(),
        defaultKeywordResolver,
      );
      expect(r.color).toBe('inherit');
    });

    it('Req 4.2: 既存ケース（background + token）の結果不変', () => {
      const r = resolveTokenRefs(
        { background: 'bg' },
        new Set(['bg']),
        defaultKeywordResolver,
      );
      expect(r.background).toBe('var(--bg)');
    });

    it('Req 4.2: 複合値（空白含む）は元値保持', () => {
      const r = resolveTokenRefs(
        { border: '1px solid red' },
        new Set(['red']),
        defaultKeywordResolver,
      );
      expect(r.border).toBe('1px solid red');
    });
  });
});
