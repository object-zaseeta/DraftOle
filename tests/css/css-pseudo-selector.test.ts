/**
 * MVP-2.4: 疑似セレクタ（:hover, :focus, :active）
 *
 * createStyle の第3引数で疑似セレクタのスタイルを定義。
 */
import { describe, it, expect } from 'vitest';
import { createStyle } from '../../src/css/variables/css-shared-style.js';

describe('MVP-2.4: 疑似セレクタ', () => {

  describe(':hover', () => {
    it('hover スタイルが .className:hover ルールとして出力される', () => {
      const btn = createStyle('btn', { padding: '10px' }, {
        hover: { background: 'rgba(255,255,255,0.10)' },
      });
      expect(btn.css).toContain('.btn {');
      expect(btn.css).toContain('.btn:hover {');
      expect(btn.css).toContain('background: rgba(255,255,255,0.10);');
    });
  });

  describe(':focus', () => {
    it('focus スタイルが出力される', () => {
      const input = createStyle('input', { padding: '11px 12px' }, {
        focus: {
          borderColor: 'rgba(124,92,255,0.65)',
          boxShadow: '0 0 0 3px rgba(124,92,255,0.25)',
        },
      });
      expect(input.css).toContain('.input:focus {');
      expect(input.css).toContain('border-color: rgba(124,92,255,0.65);');
      expect(input.css).toContain('box-shadow: 0 0 0 3px rgba(124,92,255,0.25);');
    });
  });

  describe(':active', () => {
    it('active スタイルが出力される', () => {
      const btn = createStyle('btn', { padding: '10px' }, {
        active: { transform: 'scale(0.98)' },
      });
      expect(btn.css).toContain('.btn:active {');
      expect(btn.css).toContain('transform: scale(0.98);');
    });
  });

  describe('複数の疑似セレクタ', () => {
    it('hover + focus を同時に定義できる', () => {
      const input = createStyle('input', { padding: '11px' }, {
        hover: { borderColor: '#aaa' },
        focus: { borderColor: '#3b82f6', outline: 'none' },
      });
      expect(input.css).toContain('.input:hover {');
      expect(input.css).toContain('.input:focus {');
    });
  });

  describe('疑似セレクタなし（後方互換）', () => {
    it('第3引数なしで従来通り動作', () => {
      const card = createStyle('card', { padding: '16px' });
      expect(card.css).toContain('.card {');
      expect(card.css).not.toContain(':hover');
      expect(card.css).not.toContain(':focus');
    });
  });

  describe('MVP Demo シナリオ', () => {
    it('.input + :focus を再現', () => {
      const inputStyle = createStyle('input', {
        flex: '1 1 260px',
        padding: '11px 12px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.25)',
        color: 'var(--text)',
        outline: 'none',
      }, {
        focus: {
          borderColor: 'rgba(124, 92, 255, 0.65)',
          boxShadow: '0 0 0 3px rgba(124, 92, 255, 0.25)',
        },
      });

      expect(inputStyle.css).toContain('.input {');
      expect(inputStyle.css).toContain('flex: 1 1 260px;');
      expect(inputStyle.css).toContain('.input:focus {');
      expect(inputStyle.css).toContain('border-color: rgba(124, 92, 255, 0.65);');
    });

    it('.btn + :hover を再現', () => {
      const btnStyle = createStyle('btn', {
        padding: '10px 12px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.06)',
        color: 'var(--text)',
        cursor: 'pointer',
      }, {
        hover: { background: 'rgba(255,255,255,0.10)' },
      });

      expect(btnStyle.css).toContain('.btn {');
      expect(btnStyle.css).toContain('.btn:hover {');
      expect(btnStyle.css).toContain('background: rgba(255,255,255,0.10);');
    });
  });
});
