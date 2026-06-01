/**
 * Task 8.1: スコープドCSSハッシュ生成機能のテスト
 *
 * TDD RED phase: djb2ハッシュとスコープドCSSクラス名生成を検証する。
 * - djb2アルゴリズムによる文字列ハッシュ計算
 * - `_` プレフィックス + 8文字16進数のクラス名生成（例: `_a1b2c3d4`）
 * - 同一入力に対して常に同一出力を保証する（決定的ハッシュ）
 * - 異なる入力での出力一意性
 * - フォーマット正確性
 *
 * Requirements: 8.1, 8.4
 */
import { describe, it, expect } from 'vitest';
import {
  djb2Hash,
  generateScopedClassName,
} from '../../../src/css/utils/scoped-css-generator.js';

// ============================================================
// djb2Hash
// ============================================================

describe('djb2Hash', () => {
  // ── 決定性検証 ──

  describe('決定性', () => {
    it('同一入力に対して常に同一出力を返す', () => {
      const input = 'html>body>div';
      const result1 = djb2Hash(input);
      const result2 = djb2Hash(input);
      expect(result1).toBe(result2);
    });

    it('複数回呼び出しても結果が変わらない', () => {
      const input = 'html>body>div>p>span';
      const results = Array.from({ length: 100 }, () => djb2Hash(input));
      const allSame = results.every((r) => r === results[0]);
      expect(allSame).toBe(true);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('8文字の16進数文字列を返す', () => {
      const result = djb2Hash('test');
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });

    it('空文字列入力でも8文字の16進数を返す', () => {
      const result = djb2Hash('');
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });

    it('長い文字列でも8文字の16進数を返す', () => {
      const longInput = 'a'.repeat(1000);
      const result = djb2Hash(longInput);
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });
  });

  // ── 異なる入力での一意性 ──

  describe('一意性', () => {
    it('異なる入力に対して異なる出力を返す', () => {
      const hash1 = djb2Hash('html>body>div');
      const hash2 = djb2Hash('html>body>span');
      expect(hash1).not.toBe(hash2);
    });

    it('類似した入力でも異なるハッシュを生成する', () => {
      const hash1 = djb2Hash('div1');
      const hash2 = djb2Hash('div2');
      expect(hash1).not.toBe(hash2);
    });

    it('複数の異なるパスに対してユニークなハッシュを生成する', () => {
      const paths = [
        'html>body>div',
        'html>body>span',
        'html>body>div>p',
        'html>body>div>h1',
        'html>body>section>article',
      ];
      const hashes = paths.map((p) => djb2Hash(p));
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(paths.length);
    });
  });

  // ── 特殊文字 ──

  describe('特殊文字', () => {
    it('Unicode文字を含む入力を処理できる', () => {
      const result = djb2Hash('日本語テスト');
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });

    it('記号を含む入力を処理できる', () => {
      const result = djb2Hash('html>body>div.class#id');
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });
  });
});

// ============================================================
// generateScopedClassName
// ============================================================

describe('generateScopedClassName', () => {
  // ── フォーマット正確性 ──

  describe('フォーマット', () => {
    it('`_` プレフィックス + 8文字16進数のクラス名を生成する', () => {
      const result = generateScopedClassName('html>body>div');
      expect(result).toMatch(/^_[0-9a-f]{8}$/);
    });

    it('結果の長さは9文字（_ + 8文字hex）', () => {
      const result = generateScopedClassName('html>body>div');
      expect(result).toHaveLength(9);
    });
  });

  // ── 決定性検証 ──

  describe('決定性', () => {
    it('同一tagPathに対して常に同一クラス名を返す', () => {
      const tagPath = 'html>body>div>p';
      const result1 = generateScopedClassName(tagPath);
      const result2 = generateScopedClassName(tagPath);
      expect(result1).toBe(result2);
    });
  });

  // ── 異なるパスでの一意性 ──

  describe('一意性', () => {
    it('異なるtagPathに対して異なるクラス名を返す', () => {
      const class1 = generateScopedClassName('html>body>div');
      const class2 = generateScopedClassName('html>body>span');
      expect(class1).not.toBe(class2);
    });
  });

  // ── djb2Hashとの一貫性 ──

  describe('djb2Hashとの一貫性', () => {
    it('内部でdjb2Hashを使用してクラス名を生成する', () => {
      const tagPath = 'html>body>div';
      const expectedHash = djb2Hash(tagPath);
      const className = generateScopedClassName(tagPath);
      expect(className).toBe(`_${expectedHash}`);
    });
  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    it('空文字列でも有効なクラス名を返す', () => {
      const result = generateScopedClassName('');
      expect(result).toMatch(/^_[0-9a-f]{8}$/);
    });

    it('長いパスでも有効なクラス名を返す', () => {
      const longPath = Array.from({ length: 50 }, (_, i) => `div${i}`).join('>');
      const result = generateScopedClassName(longPath);
      expect(result).toMatch(/^_[0-9a-f]{8}$/);
    });
  });
});
