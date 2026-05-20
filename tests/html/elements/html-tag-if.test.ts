/**
 * Task 3.3 (swiftui-layout): `HtmlTag.if()` 条件付き修飾子のテスト。
 *
 * `.if(condition, modifier)` メソッドが以下を満たすことを検証する:
 * - condition === true の場合、modifier が呼び出され適用結果を返す
 * - condition === false の場合、modifier を呼び出さず this をそのまま返す
 * - modifier が null / undefined を返した場合は元の要素を返す
 * - 戻り値の型はサブクラス型を保持する（型安全）
 * - メソッドチェーンの任意位置で使用できる
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 * Design: D-3.3 .if() 条件付き修飾子
 */
import { describe, expect, it, vi } from 'vitest';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import type { TagType } from '../../../src/html/tags/tag-type.js';

/** テスト用の具象サブクラス（`HtmlTag` は abstract なため） */
class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

/**
 * background スタイルが設定されているか検証するヘルパー。
 */
function getBackgroundStyle(tag: HtmlTag): string {
  return tag.style.backgroundColor.render();
}

describe('HtmlTag.if() (Task 3.3)', () => {
  // ── 要件 10.1: condition === true の場合 modifier を適用する ──
  describe('10.1: condition === true のとき modifier を呼び出す', () => {
    it('.if(true, el => el.background("#f00")) が background を設定する', () => {
      const tag = new TestTag();
      tag.if(true, el => el.background('#f00'));
      expect(getBackgroundStyle(tag)).toContain('#f00');
    });

    it('.if(true, ...) の戻り値が同一インスタンスである', () => {
      const tag = new TestTag();
      const result = tag.if(true, el => el.background('#f00'));
      expect(result).toBe(tag);
    });
  });

  // ── 要件 10.2: condition === false の場合 modifier を呼び出さない ──
  describe('10.2: condition === false のとき modifier を呼び出さない', () => {
    it('.if(false, el => el.background("#f00")) が background を設定しない', () => {
      const tag = new TestTag();
      tag.if(false, el => el.background('#f00'));
      expect(getBackgroundStyle(tag)).not.toContain('#f00');
    });

    it('.if(false, ...) が modifier を呼び出さない', () => {
      const tag = new TestTag();
      const modifier = vi.fn((el: TestTag) => el);
      tag.if(false, modifier);
      expect(modifier).not.toHaveBeenCalled();
    });

    it('.if(false, ...) の戻り値が同一インスタンスである', () => {
      const tag = new TestTag();
      const result = tag.if(false, el => el.background('#f00'));
      expect(result).toBe(tag);
    });
  });

  // ── 要件 10.3: 型安全 - 戻り値の型がサブクラス型を保持する ──
  describe('10.3: 型安全 - 戻り値の型はサブクラス型を保持する', () => {
    it('.if() の戻り値に対して引き続きメソッドチェーンできる', () => {
      const tag = new TestTag();
      // TypeScript コンパイル時に型チェックされることを確認
      // 実行時: background() が呼び出せれば型が正しく保持されている
      const result = tag.if(true, el => el.background('#00f')).padding('8px');
      expect(result).toBe(tag);
    });
  });

  // ── 要件 10.4: メソッドチェーンの任意位置で使用できる ──
  describe('10.4: メソッドチェーンの任意位置で使用できる', () => {
    it('チェーン先頭で .if() を使用できる', () => {
      const tag = new TestTag();
      const result = tag.if(true, el => el.background('#f00')).padding('16px');
      expect(result).toBe(tag);
      expect(getBackgroundStyle(tag)).toContain('#f00');
    });

    it('チェーン中間で .if() を使用できる', () => {
      const tag = new TestTag();
      tag.padding('8px').if(true, el => el.background('#0f0')).padding('16px');
      expect(getBackgroundStyle(tag)).toContain('#0f0');
    });

    it('チェーン末尾で .if() を使用できる', () => {
      const tag = new TestTag();
      const result = tag.padding('8px').background('#fff').if(false, el => el.background('#f00'));
      expect(result).toBe(tag);
      // false なので background は #fff のまま
      expect(getBackgroundStyle(tag)).toContain('#fff');
      expect(getBackgroundStyle(tag)).not.toContain('#f00');
    });
  });

  // ── 要件 10.5: modifier が null/undefined を返した場合は元の要素を返す ──
  describe('10.5: modifier が null/undefined を返した場合は元の要素を返す', () => {
    it('modifier が null を返した場合は元の要素を返す', () => {
      const tag = new TestTag();
      const result = tag.if(true, _el => null);
      expect(result).toBe(tag);
    });

    it('modifier が undefined を返した場合は元の要素を返す', () => {
      const tag = new TestTag();
      const result = tag.if(true, _el => undefined);
      expect(result).toBe(tag);
    });
  });
});
