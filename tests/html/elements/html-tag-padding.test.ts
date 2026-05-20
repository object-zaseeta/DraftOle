/**
 * Task 3.2 (swiftui-layout): `HtmlTag.padding()` オーバーロード拡張のテスト。
 *
 * 以下の 3 シグネチャを検証する:
 *   1. padding(v: string): this  — 既存（後方互換）
 *   2. padding(v: number): this  — 全方向 {v}px
 *   3. padding(edge: EdgeSet, v: number): this — エッジセット指定
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 * Design: D-3.2 padding() 拡張オーバーロード
 */
import { describe, expect, it } from 'vitest';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import type { TagType } from '../../../src/html/tags/tag-type.js';

/** テスト用の具象サブクラス（`HtmlTag` は abstract なため） */
class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

/** spacing の render 出力を取得するヘルパー */
function getSpacingString(tag: HtmlTag): string {
  return tag.style.spacing.render();
}

describe('HtmlTag.padding() オーバーロード (Task 3.2)', () => {
  // ── 要件 7.5: 既存 string オーバーロードの後方互換性 ──
  describe('7.5: 既存 padding(string) は後方互換を保持する', () => {
    it('padding("16px") が padding: 16px を設定する', () => {
      const tag = new TestTag();
      tag.padding('16px');
      expect(getSpacingString(tag)).toContain('padding: 16px');
    });

    it('padding("16px 8px") が padding: 16px 8px を設定する', () => {
      const tag = new TestTag();
      tag.padding('16px 8px');
      expect(getSpacingString(tag)).toContain('padding: 16px 8px');
    });

    it('padding("0") が padding: 0 を設定する', () => {
      const tag = new TestTag();
      tag.padding('0');
      expect(getSpacingString(tag)).toContain('padding: 0');
    });

    it('padding(string) が this を返す', () => {
      const tag = new TestTag();
      const result = tag.padding('8px');
      expect(result).toBe(tag);
    });
  });

  // ── 要件 7.1: 数値オーバーロード（全方向）──
  describe('7.1: padding(number) は全方向に {n}px を設定する', () => {
    it('padding(16) が padding: 16px を設定する', () => {
      const tag = new TestTag();
      tag.padding(16);
      expect(getSpacingString(tag)).toContain('padding: 16px');
    });

    it('padding(0) が padding: 0px を設定する', () => {
      const tag = new TestTag();
      tag.padding(0);
      expect(getSpacingString(tag)).toContain('padding: 0px');
    });

    it('padding(24) が padding: 24px を設定する', () => {
      const tag = new TestTag();
      tag.padding(24);
      expect(getSpacingString(tag)).toContain('padding: 24px');
    });

    it('padding(number) が this を返す', () => {
      const tag = new TestTag();
      const result = tag.padding(16);
      expect(result).toBe(tag);
    });
  });

  // ── 要件 7.2: エッジセット horizontal ──
  describe('7.2: padding("horizontal", number) は padding-left と padding-right を設定する', () => {
    it('padding("horizontal", 8) が padding-left: 8px と padding-right: 8px を設定する', () => {
      const tag = new TestTag();
      tag.padding('horizontal', 8);
      const style = getSpacingString(tag);
      expect(style).toContain('padding-left: 8px');
      expect(style).toContain('padding-right: 8px');
    });

    it('padding("horizontal", 0) が padding-left: 0px と padding-right: 0px を設定する', () => {
      const tag = new TestTag();
      tag.padding('horizontal', 0);
      const style = getSpacingString(tag);
      expect(style).toContain('padding-left: 0px');
      expect(style).toContain('padding-right: 0px');
    });

    it('padding("horizontal", 16) は padding-top / padding-bottom を設定しない', () => {
      const tag = new TestTag();
      tag.padding('horizontal', 16);
      const style = getSpacingString(tag);
      expect(style).not.toContain('padding-top');
      expect(style).not.toContain('padding-bottom');
    });
  });

  // ── 要件 7.3: エッジセット vertical ──
  describe('7.3: padding("vertical", number) は padding-top と padding-bottom を設定する', () => {
    it('padding("vertical", 12) が padding-top: 12px と padding-bottom: 12px を設定する', () => {
      const tag = new TestTag();
      tag.padding('vertical', 12);
      const style = getSpacingString(tag);
      expect(style).toContain('padding-top: 12px');
      expect(style).toContain('padding-bottom: 12px');
    });

    it('padding("vertical", 12) は padding-left / padding-right を設定しない', () => {
      const tag = new TestTag();
      tag.padding('vertical', 12);
      const style = getSpacingString(tag);
      expect(style).not.toContain('padding-left');
      expect(style).not.toContain('padding-right');
    });
  });

  // ── 要件 7.4: 個別エッジセット（top / right / bottom / left）──
  describe('7.4: padding(edge, number) は指定された方向のみに {n}px を設定する', () => {
    it('padding("top", 20) が padding-top: 20px を設定する', () => {
      const tag = new TestTag();
      tag.padding('top', 20);
      expect(getSpacingString(tag)).toContain('padding-top: 20px');
    });

    it('padding("right", 10) が padding-right: 10px を設定する', () => {
      const tag = new TestTag();
      tag.padding('right', 10);
      expect(getSpacingString(tag)).toContain('padding-right: 10px');
    });

    it('padding("bottom", 32) が padding-bottom: 32px を設定する', () => {
      const tag = new TestTag();
      tag.padding('bottom', 32);
      expect(getSpacingString(tag)).toContain('padding-bottom: 32px');
    });

    it('padding("left", 4) が padding-left: 4px を設定する', () => {
      const tag = new TestTag();
      tag.padding('left', 4);
      expect(getSpacingString(tag)).toContain('padding-left: 4px');
    });

    it('padding("top", 20) は他の方向を設定しない', () => {
      const tag = new TestTag();
      tag.padding('top', 20);
      const style = getSpacingString(tag);
      expect(style).not.toContain('padding-right');
      expect(style).not.toContain('padding-bottom');
      expect(style).not.toContain('padding-left');
    });

    it('padding(edge, number) が this を返す', () => {
      const tag = new TestTag();
      const result = tag.padding('top', 8);
      expect(result).toBe(tag);
    });
  });

  // ── メソッドチェーンの確認 ──
  describe('メソッドチェーン', () => {
    it('padding(16).background("#fff") のようなチェーンが動作する', () => {
      const tag = new TestTag();
      const result = tag.padding(16).background('#fff');
      expect(result).toBe(tag);
      expect(getSpacingString(tag)).toContain('padding: 16px');
    });

    it('padding("horizontal", 8).padding("vertical", 16) の複合チェーンが動作する', () => {
      const tag = new TestTag();
      tag.padding('horizontal', 8).padding('vertical', 16);
      const style = getSpacingString(tag);
      expect(style).toContain('padding-left: 8px');
      expect(style).toContain('padding-right: 8px');
      expect(style).toContain('padding-top: 16px');
      expect(style).toContain('padding-bottom: 16px');
    });
  });
});
