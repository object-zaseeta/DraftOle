/**
 * Task 3.1 (swiftui-layout): `HtmlTag.frame()` メソッドのテスト。
 *
 * `.frame(options: FrameOptions): this` メソッドが以下を満たすことを検証する:
 * - 数値 → `{n}px` 変換
 * - `Infinity` → `'100%'` 変換（maxWidth / maxHeight）
 * - 文字列はそのまま渡す
 * - 未指定プロパティは既存値を保持（上書きしない）
 * - メソッドチェーンで `this` を返す
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 * Design: D-3.1 frame() 修飾子
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

/**
 * style.position から CSS 文字列を取得するヘルパー。
 * protoRender() をトリガーせずに直接 style を検証する。
 */
function getStyleString(tag: HtmlTag): string {
  // style.position の各プロパティを直接 render で取得
  return tag.style.position.render();
}

describe('HtmlTag.frame() (Task 3.1)', () => {
  // ── 要件 6.1: width 数値変換 ──
  describe('6.1: width: 数値 → {n}px', () => {
    it('frame({ width: 700 }) が width: 700px を設定する', () => {
      const tag = new TestTag();
      tag.frame({ width: 700 });
      expect(getStyleString(tag)).toContain('width: 700px');
    });

    it('frame({ width: 0 }) が width: 0px を設定する', () => {
      const tag = new TestTag();
      tag.frame({ width: 0 });
      expect(getStyleString(tag)).toContain('width: 0px');
    });
  });

  // ── 要件 6.2: height 数値変換 ──
  describe('6.2: height: 数値 → {n}px', () => {
    it('frame({ height: 400 }) が height: 400px を設定する', () => {
      const tag = new TestTag();
      tag.frame({ height: 400 });
      expect(getStyleString(tag)).toContain('height: 400px');
    });
  });

  // ── 要件 6.3: maxWidth: Infinity → 100% ──
  describe('6.3: maxWidth: Infinity → max-width: 100%', () => {
    it('frame({ maxWidth: Infinity }) が max-width: 100% を設定する', () => {
      const tag = new TestTag();
      tag.frame({ maxWidth: Infinity });
      expect(getStyleString(tag)).toContain('max-width: 100%');
    });

    it('frame({ width: 700, maxWidth: Infinity }) が width: 700px と max-width: 100% を両方設定する', () => {
      const tag = new TestTag();
      tag.frame({ width: 700, maxWidth: Infinity });
      const style = getStyleString(tag);
      expect(style).toContain('width: 700px');
      expect(style).toContain('max-width: 100%');
    });
  });

  // ── 要件 6.4: minWidth/maxWidth 数値変換 ──
  describe('6.4: minWidth/maxWidth 数値 → px', () => {
    it('frame({ minWidth: 100, maxWidth: 800 }) が min-width: 100px と max-width: 800px を設定する', () => {
      const tag = new TestTag();
      tag.frame({ minWidth: 100, maxWidth: 800 });
      const style = getStyleString(tag);
      expect(style).toContain('min-width: 100px');
      expect(style).toContain('max-width: 800px');
    });

    it('frame({ minHeight: 50, maxHeight: 300 }) が min-height: 50px と max-height: 300px を設定する', () => {
      const tag = new TestTag();
      tag.frame({ minHeight: 50, maxHeight: 300 });
      const style = getStyleString(tag);
      expect(style).toContain('min-height: 50px');
      expect(style).toContain('max-height: 300px');
    });
  });

  // ── 要件 6.5: 未指定プロパティは既存値を保持 ──
  describe('6.5: 未指定プロパティは既存値を保持する', () => {
    it('frame({ width: 700, maxWidth: Infinity }) 後に frame({ width: 200 }) が maxWidth を変更しない', () => {
      const tag = new TestTag();
      tag.frame({ width: 700, maxWidth: Infinity });
      tag.frame({ width: 200 });
      const style = getStyleString(tag);
      // width は更新される
      expect(style).toContain('width: 200px');
      // maxWidth は保持される
      expect(style).toContain('max-width: 100%');
    });

    it('frame({ height: 400 }) が既存の width 設定を変更しない', () => {
      const tag = new TestTag();
      tag.frame({ width: 500 });
      tag.frame({ height: 400 });
      const style = getStyleString(tag);
      expect(style).toContain('width: 500px');
      expect(style).toContain('height: 400px');
    });
  });

  // ── 要件 6.6: fluent チェーン（this を返す） ──
  describe('6.6: frame() はすべての既存要素で使用可能（this を返す）', () => {
    it('frame() が this を返しメソッドチェーンが継続できる', () => {
      const tag = new TestTag();
      const result = tag.frame({ width: 300 });
      expect(result).toBe(tag);
    });

    it('frame().padding().background() のようなチェーンが動作する', () => {
      const tag = new TestTag();
      const result = tag.frame({ width: 300, height: 200 }).padding('16px').background('#fff');
      expect(result).toBe(tag);
      expect(getStyleString(tag)).toContain('width: 300px');
      expect(getStyleString(tag)).toContain('height: 200px');
    });
  });

  // ── 文字列値はそのまま渡す ──
  describe('文字列値はそのまま CSS 値として使用される', () => {
    it('frame({ width: "50%" }) が width: 50% を設定する', () => {
      const tag = new TestTag();
      tag.frame({ width: '50%' });
      expect(getStyleString(tag)).toContain('width: 50%');
    });

    it('frame({ maxWidth: "none" }) が max-width: none を設定する', () => {
      const tag = new TestTag();
      tag.frame({ maxWidth: 'none' });
      expect(getStyleString(tag)).toContain('max-width: none');
    });
  });
});
