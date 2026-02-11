/**
 * Task 2.2: CSSSpacing 余白プロパティのテスト
 *
 * TDD RED phase: margin/padding の個別方向設定、一括指定、
 * HlUnit連携、collectProperties→render統一パターンを検証する。
 *
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */
import { describe, it, expect } from 'vitest';
import { CSSSpacing } from '../../../../src/css/style/spacing/css-spacing.js';
import type { HlUnit } from '../../../../src/utils/unit-style.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSSpacing {
  return new CSSSpacing();
}

function makeHlUnit(value: number, unit: HlUnit['unit']): HlUnit {
  return { value, unit };
}

// ============================================================
// CSSSpacing
// ============================================================

describe('CSSSpacing', () => {
  // ── 空レンダリング ──

  describe('空レンダリング', () => {
    it('プロパティ未設定の場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });
  });

  // ── margin 個別方向（文字列） ──

  describe('margin 個別方向（文字列）', () => {
    it('marginTop を設定すると margin-top が出力される', () => {
      const sut = makeSUT();
      sut.setMarginTop('10px');
      expect(sut.render()).toBe('margin-top: 10px;');
    });

    it('marginRight を設定すると margin-right が出力される', () => {
      const sut = makeSUT();
      sut.setMarginRight('20px');
      expect(sut.render()).toBe('margin-right: 20px;');
    });

    it('marginBottom を設定すると margin-bottom が出力される', () => {
      const sut = makeSUT();
      sut.setMarginBottom('30px');
      expect(sut.render()).toBe('margin-bottom: 30px;');
    });

    it('marginLeft を設定すると margin-left が出力される', () => {
      const sut = makeSUT();
      sut.setMarginLeft('40px');
      expect(sut.render()).toBe('margin-left: 40px;');
    });
  });

  // ── margin 一括指定（文字列） ──

  describe('margin 一括指定（文字列）', () => {
    it('margin を一括設定すると margin が出力される', () => {
      const sut = makeSUT();
      sut.setMargin('10px');
      expect(sut.render()).toBe('margin: 10px;');
    });

    it('margin に複数値を設定できる（上下左右）', () => {
      const sut = makeSUT();
      sut.setMargin('10px 20px 30px 40px');
      expect(sut.render()).toBe('margin: 10px 20px 30px 40px;');
    });

    it('margin に auto を設定できる', () => {
      const sut = makeSUT();
      sut.setMargin('0 auto');
      expect(sut.render()).toBe('margin: 0 auto;');
    });
  });

  // ── padding 個別方向（文字列） ──

  describe('padding 個別方向（文字列）', () => {
    it('paddingTop を設定すると padding-top が出力される', () => {
      const sut = makeSUT();
      sut.setPaddingTop('10px');
      expect(sut.render()).toBe('padding-top: 10px;');
    });

    it('paddingRight を設定すると padding-right が出力される', () => {
      const sut = makeSUT();
      sut.setPaddingRight('20px');
      expect(sut.render()).toBe('padding-right: 20px;');
    });

    it('paddingBottom を設定すると padding-bottom が出力される', () => {
      const sut = makeSUT();
      sut.setPaddingBottom('30px');
      expect(sut.render()).toBe('padding-bottom: 30px;');
    });

    it('paddingLeft を設定すると padding-left が出力される', () => {
      const sut = makeSUT();
      sut.setPaddingLeft('40px');
      expect(sut.render()).toBe('padding-left: 40px;');
    });
  });

  // ── padding 一括指定（文字列） ──

  describe('padding 一括指定（文字列）', () => {
    it('padding を一括設定すると padding が出力される', () => {
      const sut = makeSUT();
      sut.setPadding('16px');
      expect(sut.render()).toBe('padding: 16px;');
    });

    it('padding に複数値を設定できる', () => {
      const sut = makeSUT();
      sut.setPadding('10px 20px');
      expect(sut.render()).toBe('padding: 10px 20px;');
    });
  });

  // ── HlUnit ベースの設定 ──

  describe('HlUnit ベースの設定', () => {
    it('marginTop に HlUnit(px) を設定できる', () => {
      const sut = makeSUT();
      sut.setMarginTopUnit(makeHlUnit(10, 'px'));
      expect(sut.render()).toBe('margin-top: 10px;');
    });

    it('marginRight に HlUnit(em) を設定できる', () => {
      const sut = makeSUT();
      sut.setMarginRightUnit(makeHlUnit(2, 'em'));
      expect(sut.render()).toBe('margin-right: 2em;');
    });

    it('marginBottom に HlUnit(rem) を設定できる', () => {
      const sut = makeSUT();
      sut.setMarginBottomUnit(makeHlUnit(1.5, 'rem'));
      expect(sut.render()).toBe('margin-bottom: 1.5rem;');
    });

    it('marginLeft に HlUnit(%) を設定できる', () => {
      const sut = makeSUT();
      sut.setMarginLeftUnit(makeHlUnit(50, '%'));
      expect(sut.render()).toBe('margin-left: 50%;');
    });

    it('paddingTop に HlUnit(vh) を設定できる', () => {
      const sut = makeSUT();
      sut.setPaddingTopUnit(makeHlUnit(5, 'vh'));
      expect(sut.render()).toBe('padding-top: 5vh;');
    });

    it('paddingRight に HlUnit(vw) を設定できる', () => {
      const sut = makeSUT();
      sut.setPaddingRightUnit(makeHlUnit(10, 'vw'));
      expect(sut.render()).toBe('padding-right: 10vw;');
    });

    it('paddingBottom に HlUnit(none) を設定すると数値のみ出力される', () => {
      const sut = makeSUT();
      sut.setPaddingBottomUnit(makeHlUnit(0, 'none'));
      expect(sut.render()).toBe('padding-bottom: 0;');
    });

    it('paddingLeft に HlUnit(px) を設定できる', () => {
      const sut = makeSUT();
      sut.setPaddingLeftUnit(makeHlUnit(8, 'px'));
      expect(sut.render()).toBe('padding-left: 8px;');
    });
  });

  // ── メソッドチェーン（Fluent API） ──

  describe('メソッドチェーン（Fluent API）', () => {
    it('setter が this を返し、チェーンで呼び出せる', () => {
      const sut = makeSUT();
      const result = sut
        .setMarginTop('10px')
        .setMarginRight('20px')
        .setMarginBottom('30px')
        .setMarginLeft('40px');

      expect(result).toBe(sut);
    });

    it('HlUnit setter もチェーンで呼び出せる', () => {
      const sut = makeSUT();
      const result = sut
        .setPaddingTopUnit(makeHlUnit(10, 'px'))
        .setPaddingRightUnit(makeHlUnit(20, 'px'));

      expect(result).toBe(sut);
    });

    it('チェーンで設定した値が正しく render される', () => {
      const sut = makeSUT();
      sut
        .setMarginTop('10px')
        .setPaddingBottom('20px');

      const rendered = sut.render();
      expect(rendered).toContain('margin-top: 10px');
      expect(rendered).toContain('padding-bottom: 20px');
    });
  });

  // ── 複数プロパティの出力とアルファベットソート ──

  describe('複数プロパティの出力とアルファベットソート', () => {
    it('複数プロパティがアルファベット順にソートされて出力される', () => {
      const sut = makeSUT();
      sut
        .setPaddingTop('5px')
        .setMarginTop('10px')
        .setMarginBottom('20px');

      // アルファベット順: margin-bottom < margin-top < padding-top
      expect(sut.render()).toBe(
        'margin-bottom: 20px;\nmargin-top: 10px;\npadding-top: 5px;'
      );
    });

    it('全margin個別方向がアルファベット順で出力される', () => {
      const sut = makeSUT();
      sut
        .setMarginTop('10px')
        .setMarginRight('20px')
        .setMarginBottom('30px')
        .setMarginLeft('40px');

      // margin-bottom < margin-left < margin-right < margin-top
      expect(sut.render()).toBe(
        'margin-bottom: 30px;\nmargin-left: 40px;\nmargin-right: 20px;\nmargin-top: 10px;'
      );
    });

    it('margin一括と個別方向を両方設定すると両方出力される', () => {
      const sut = makeSUT();
      sut
        .setMargin('0 auto')
        .setMarginTop('10px');

      const rendered = sut.render();
      // margin < margin-top（アルファベット順）
      expect(rendered).toBe(
        'margin: 0 auto;\nmargin-top: 10px;'
      );
    });

    it('全padding個別方向がアルファベット順で出力される', () => {
      const sut = makeSUT();
      sut
        .setPaddingTop('10px')
        .setPaddingRight('20px')
        .setPaddingBottom('30px')
        .setPaddingLeft('40px');

      // padding-bottom < padding-left < padding-right < padding-top
      expect(sut.render()).toBe(
        'padding-bottom: 30px;\npadding-left: 40px;\npadding-right: 20px;\npadding-top: 10px;'
      );
    });

    it('margin と padding の混在がアルファベット順で出力される', () => {
      const sut = makeSUT();
      sut
        .setMargin('10px')
        .setPadding('20px');

      // margin < padding
      expect(sut.render()).toBe(
        'margin: 10px;\npadding: 20px;'
      );
    });
  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    it('同じプロパティを上書きすると最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setMarginTop('10px');
      sut.setMarginTop('20px');
      expect(sut.render()).toBe('margin-top: 20px;');
    });

    it('文字列セッターと HlUnit セッターで同じプロパティを上書きできる', () => {
      const sut = makeSUT();
      sut.setMarginTop('10px');
      sut.setMarginTopUnit(makeHlUnit(20, 'em'));
      expect(sut.render()).toBe('margin-top: 20em;');
    });

    it('HlUnit セッターを文字列セッターで上書きできる', () => {
      const sut = makeSUT();
      sut.setMarginTopUnit(makeHlUnit(20, 'em'));
      sut.setMarginTop('10px');
      expect(sut.render()).toBe('margin-top: 10px;');
    });

    it('0px の値も正しく出力される', () => {
      const sut = makeSUT();
      sut.setMarginTop('0px');
      expect(sut.render()).toBe('margin-top: 0px;');
    });

    it('HlUnit の value が 0 でも出力される', () => {
      const sut = makeSUT();
      sut.setMarginTopUnit(makeHlUnit(0, 'px'));
      expect(sut.render()).toBe('margin-top: 0px;');
    });

    it('render() を複数回呼んでも同じ結果を返す（冪等性）', () => {
      const sut = makeSUT();
      sut.setMarginTop('10px').setPaddingBottom('20px');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });

    it('% 単位の値を正しく出力する', () => {
      const sut = makeSUT();
      sut.setMarginTopUnit(makeHlUnit(50, '%'));
      expect(sut.render()).toBe('margin-top: 50%;');
    });

    it('小数値を含む HlUnit を正しく出力する', () => {
      const sut = makeSUT();
      sut.setPaddingTopUnit(makeHlUnit(1.5, 'rem'));
      expect(sut.render()).toBe('padding-top: 1.5rem;');
    });
  });

  // ── Renderable 準拠 ──

  describe('Renderable 準拠', () => {
    it('render メソッドが存在する', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });

    it('render() が string を返す', () => {
      const sut = makeSUT();
      const result = sut.render();
      expect(typeof result).toBe('string');
    });
  });
});
