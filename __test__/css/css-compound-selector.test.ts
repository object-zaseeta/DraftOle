/**
 * MVP-2.5 + CSS-3: 複合セレクタ・子孫セレクタ
 *
 * createStyle の第3引数で複合セレクタ（.btn.primary）、
 * 子孫セレクタ（.item .text）を定義。
 */
import { describe, it, expect } from 'vitest';
import { createStyle } from '../../src/css/variables/css-shared-style.js';

describe('MVP-2.5 + CSS-3: 複合セレクタ・子孫セレクタ', () => {

  // ── 複合セレクタ ──

  describe('複合セレクタ（&.modifier）', () => {
    it('&.primary → .btn.primary ルールが出力される', () => {
      const btn = createStyle('btn', { padding: '10px' }, {
        '&.primary': {
          borderColor: 'rgba(124, 92, 255, 0.55)',
          background: 'linear-gradient(180deg, rgba(124, 92, 255, 0.35), rgba(124, 92, 255, 0.18))',
        },
      });
      expect(btn.css).toContain('.btn.primary {');
      expect(btn.css).toContain('border-color: rgba(124, 92, 255, 0.55);');
    });

    it('&.done → .item.done ルールが出力される', () => {
      const item = createStyle('item', { display: 'flex' }, {
        '&.done': { opacity: '0.5' },
      });
      expect(item.css).toContain('.item.done {');
      expect(item.css).toContain('opacity: 0.5;');
    });
  });

  // ── 子孫セレクタ ──

  describe('子孫セレクタ（ .child）', () => {
    it(' .text → .item .text ルールが出力される', () => {
      const item = createStyle('item', { display: 'flex' }, {
        ' .text': { flex: '1 1 auto' },
      });
      expect(item.css).toContain('.item .text {');
      expect(item.css).toContain('flex: 1 1 auto;');
    });
  });

  // ── 複合 + 子孫 ──

  describe('複合 + 子孫セレクタ', () => {
    it('&.done .text → .item.done .text ルールが出力される', () => {
      const item = createStyle('item', { display: 'flex' }, {
        '&.done .text': {
          textDecoration: 'line-through',
          color: 'rgba(255, 255, 255, 0.55)',
        },
      });
      expect(item.css).toContain('.item.done .text {');
      expect(item.css).toContain('text-decoration: line-through;');
    });
  });

  // ── 疑似セレクタとの混在 ──

  describe('疑似 + 複合 + 子孫の混在', () => {
    it('hover + &.primary + .text を同時に定義できる', () => {
      const btn = createStyle('btn', { padding: '10px' }, {
        hover: { background: 'rgba(255,255,255,0.10)' },
        '&.primary': { borderColor: '#7c5cff' },
        ' .icon': { width: '16px' },
      });
      expect(btn.css).toContain('.btn:hover {');
      expect(btn.css).toContain('.btn.primary {');
      expect(btn.css).toContain('.btn .icon {');
    });
  });

  // ── MVP Demo シナリオ ──

  describe('MVP Demo シナリオ', () => {
    it('.btn + :hover + .primary を再現', () => {
      const btnStyle = createStyle('btn', {
        padding: '10px 12px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.06)',
        color: 'var(--text)',
        cursor: 'pointer',
      }, {
        hover: { background: 'rgba(255,255,255,0.10)' },
        '&.primary': {
          borderColor: 'rgba(124, 92, 255, 0.55)',
          background: 'linear-gradient(180deg, rgba(124, 92, 255, 0.35), rgba(124, 92, 255, 0.18))',
        },
      });

      expect(btnStyle.css).toContain('.btn {');
      expect(btnStyle.css).toContain('.btn:hover {');
      expect(btnStyle.css).toContain('.btn.primary {');
    });

    it('.item + .text + .done .text を再現', () => {
      const itemStyle = createStyle('item', {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'rgba(0, 0, 0, 0.22)',
      }, {
        ' .text': { flex: '1 1 auto' },
        '&.done .text': {
          textDecoration: 'line-through',
          color: 'rgba(255, 255, 255, 0.55)',
        },
      });

      expect(itemStyle.css).toContain('.item {');
      expect(itemStyle.css).toContain('.item .text {');
      expect(itemStyle.css).toContain('.item.done .text {');
    });

    it('.pill + .ok + .ng を再現', () => {
      const pillStyle = createStyle('pill', {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '999px',
        padding: '6px 10px',
        border: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--muted)',
        fontSize: '12px',
      }, {
        '&.ok': { color: 'rgba(50, 211, 153, 0.95)', borderColor: 'rgba(50, 211, 153, 0.35)' },
        '&.ng': { color: 'rgba(239, 68, 68, 0.95)', borderColor: 'rgba(239, 68, 68, 0.35)' },
      });

      expect(pillStyle.css).toContain('.pill {');
      expect(pillStyle.css).toContain('.pill.ok {');
      expect(pillStyle.css).toContain('.pill.ng {');
    });
  });
});
