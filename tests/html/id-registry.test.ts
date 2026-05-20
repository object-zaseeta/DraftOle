/**
 * Task 1.3: IdRegistry クラスのテスト
 *
 * レンダー中に発行された id を集合管理し、重複を検出する責務を検証する。
 *
 * Requirements: 3.4
 */
import { describe, it, expect } from 'vitest';
import { IdRegistry } from '../../src/html/elements/id-registry.js';
import { DraftOleError } from '../../src/utils/errors.js';
import { HtmlError } from '../../src/html/errors/html-error.js';

describe('IdRegistry', () => {
  describe('register / has', () => {
    it('登録した id は has で true を返す', () => {
      const registry = new IdRegistry();
      registry.register('foo', 'div[0]');
      expect(registry.has('foo')).toBe(true);
    });

    it('未登録の id は has で false を返す', () => {
      const registry = new IdRegistry();
      expect(registry.has('foo')).toBe(false);
    });

    it('複数の異なる id を登録できる', () => {
      const registry = new IdRegistry();
      registry.register('foo', 'div[0]');
      registry.register('bar', 'div[1]');
      expect(registry.has('foo')).toBe(true);
      expect(registry.has('bar')).toBe(true);
      expect(registry.has('baz')).toBe(false);
    });
  });

  describe('register の重複検出', () => {
    it('同じ id を二度登録すると DraftOleError をスローする', () => {
      const registry = new IdRegistry();
      registry.register('dup', 'section[0]/div[0]');
      expect(() => registry.register('dup', 'section[0]/div[1]')).toThrow(
        DraftOleError,
      );
    });

    it('スローされるエラーは HtmlError である', () => {
      const registry = new IdRegistry();
      registry.register('dup', 'section[0]/div[0]');
      expect(() => registry.register('dup', 'section[0]/div[1]')).toThrow(
        HtmlError,
      );
    });

    it('エラーメッセージに重複した id と新しい tagPath が含まれる', () => {
      const registry = new IdRegistry();
      registry.register('dup', 'section[0]/div[0]');
      try {
        registry.register('dup', 'section[0]/div[1]');
        throw new Error('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HtmlError);
        const err = error as HtmlError;
        expect(err.message).toContain('dup');
        expect(err.message).toContain('section[0]/div[1]');
      }
    });

    it('エラーメッセージには既に登録済みの tagPath も含まれる', () => {
      const registry = new IdRegistry();
      registry.register('dup', 'first/path');
      try {
        registry.register('dup', 'second/path');
        throw new Error('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HtmlError);
        const err = error as HtmlError;
        expect(err.message).toContain('first/path');
        expect(err.message).toContain('second/path');
      }
    });

    it('衝突時のエラーコードは invalidAttribute', () => {
      const registry = new IdRegistry();
      registry.register('dup', 'a');
      try {
        registry.register('dup', 'b');
        throw new Error('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HtmlError);
        expect((error as HtmlError).code).toBe('invalidAttribute');
      }
    });
  });

  describe('reset', () => {
    it('reset 後はすべての id が has で false を返す', () => {
      const registry = new IdRegistry();
      registry.register('foo', 'div[0]');
      registry.register('bar', 'div[1]');
      registry.reset();
      expect(registry.has('foo')).toBe(false);
      expect(registry.has('bar')).toBe(false);
    });

    it('reset 後は同じ id を再登録できる', () => {
      const registry = new IdRegistry();
      registry.register('foo', 'div[0]');
      registry.reset();
      expect(() => registry.register('foo', 'div[1]')).not.toThrow();
      expect(registry.has('foo')).toBe(true);
    });
  });
});
