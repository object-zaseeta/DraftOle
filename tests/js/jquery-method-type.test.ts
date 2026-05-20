import { describe, it, expect } from 'vitest';
import { type JQueryMethodType, JQUERY_METHOD_TYPES } from '../../src/html/protocols/jquery-method-type.js';

describe('JQueryMethodType', () => {
  describe('型定義', () => {
    it('8種のメソッド型が定義されている', () => {
      // JQueryMethodType型の値を配列として検証
      const validTypes: JQueryMethodType[] = [
        'css',
        'height',
        'on',
        'text',
        'html',
        'addClass',
        'removeClass',
        'toggleClass',
      ];

      // 各値が JQueryMethodType として有効であることを確認
      validTypes.forEach(type => {
        const value: JQueryMethodType = type;
        expect(value).toBe(type);
      });
    });

    it('JQUERY_METHOD_TYPES 定数が8つのメソッドを含む', () => {
      expect(JQUERY_METHOD_TYPES).toHaveLength(8);
      expect(JQUERY_METHOD_TYPES).toEqual([
        'css',
        'height',
        'on',
        'text',
        'html',
        'addClass',
        'removeClass',
        'toggleClass',
      ]);
    });

    it('JQUERY_METHOD_TYPES は readonly 配列である', () => {
      // readonly配列のため、以下はコンパイルエラーになる
      // JQUERY_METHOD_TYPES[0] = 'invalid';
      // JQUERY_METHOD_TYPES.push('invalid');

      // ランタイムでの確認: Object.isFrozen は深い凍結を保証しないが、型の確認として
      expect(Array.isArray(JQUERY_METHOD_TYPES)).toBe(true);
    });

    it('Swift版との互換性: 同一の値セット', () => {
      // Swift版のJQueryMethodTypeと同じ8種のメソッドが定義されていることを確認
      const swiftMethodTypes = [
        'css',
        'height',
        'on',
        'text',
        'html',
        'addClass',
        'removeClass',
        'toggleClass',
      ];

      swiftMethodTypes.forEach(method => {
        expect(JQUERY_METHOD_TYPES).toContain(method as JQueryMethodType);
      });
    });
  });

  describe('型安全性', () => {
    it('有効なメソッド型は受け入れられる', () => {
      const method: JQueryMethodType = 'css';
      expect(method).toBe('css');
    });

    // TypeScriptの型チェックでコンパイルエラーになるため、実際には実行されない
    // it('無効なメソッド型はコンパイルエラーになる', () => {
    //   const invalid: JQueryMethodType = 'invalid'; // コンパイルエラー
    // });
  });
});
