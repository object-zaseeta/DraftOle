/**
 * Task 3.2: AppSlotTests — `src/view/app-slot.ts` の branch coverage を 90% 以上にする。
 *
 * 対応 requirement: 5.2 (global-branch-90-percent)
 * 対応 design.md セクション: "AppSlotTests" (Components and Interfaces 表)
 *
 * 検証観点:
 *   - `AppSlot('')` で empty id throw（src/view/app-slot.ts:25）
 *   - `AppSlot('my-id').collectCssStyleString()` が空文字列を返す（line 34）
 *   - `AppSlot('my-id').protoRender()` が `data-draftole-mount` 属性を含む（StaticView protocol 遵守）
 *   - `AppSlot('my-id')` の戻り値が StaticView interface を満たす
 */

import { describe, expect, it } from 'vitest';

import { AppSlot } from '../../src/view/app-slot.js';
import type { StaticView } from '../../src/view/types.js';

describe('AppSlot (Task 3.2)', () => {
  describe('empty id ガード（src/view/app-slot.ts:25）', () => {
    it('AppSlot("") は Error を throw する', () => {
      expect(() => AppSlot('')).toThrow(Error);
    });

    it('AppSlot("") の Error メッセージは non-empty string 要件を含む', () => {
      expect(() => AppSlot('')).toThrow(/non-empty string/);
    });

    it('AppSlotOptions 形式の空 id（{ id: "" }）も throw する', () => {
      expect(() => AppSlot({ id: '' })).toThrow(/non-empty string/);
    });
  });

  describe('collectCssStyleString（line 34）', () => {
    it('AppSlot("my-id").collectCssStyleString() は空文字列を返す', () => {
      const slot = AppSlot('my-id');
      expect(slot.collectCssStyleString()).toBe('');
    });

    it('AppSlotOptions 経由でも collectCssStyleString は空文字列を返す', () => {
      const slot = AppSlot({ id: 'other-id' });
      expect(slot.collectCssStyleString()).toBe('');
    });
  });

  describe('protoRender (StaticView protocol 遵守)', () => {
    it('protoRender() は data-draftole-mount 属性を含む div を返す', () => {
      const slot = AppSlot('my-id');
      const html = slot.protoRender();
      expect(html).toContain('data-draftole-mount');
      expect(html).toBe('<div data-draftole-mount="my-id"></div>');
    });

    it('AppSlotOptions 形式でも protoRender は同じ HTML を生成する', () => {
      const slot = AppSlot({ id: 'mount-1' });
      expect(slot.protoRender()).toBe('<div data-draftole-mount="mount-1"></div>');
    });

    it('protoRender(ctx) に RenderContext を渡しても無視される（StaticView 純粋契約）', () => {
      const slot = AppSlot('my-id');
      // ctx 引数を渡しても出力は変化しない（_ctx は使われない）
      const html = slot.protoRender({} as unknown as Parameters<StaticView['protoRender']>[0]);
      expect(html).toBe('<div data-draftole-mount="my-id"></div>');
    });
  });

  describe('StaticView interface compliance', () => {
    it('戻り値は protoRender と collectCssStyleString の両方を持つ', () => {
      const slot = AppSlot('my-id');
      expect(typeof slot.protoRender).toBe('function');
      expect(typeof slot.collectCssStyleString).toBe('function');
    });

    it('戻り値は StaticView として代入可能（構造的部分型）', () => {
      const slot: StaticView = AppSlot('my-id');
      // protoRender / collectCssStyleString 経由でアクセス可能
      expect(slot.protoRender()).toContain('data-draftole-mount');
      expect(slot.collectCssStyleString()).toBe('');
    });
  });
});
