/**
 * Task 3.1: CSSFont -- フォント・文字色プロパティのテスト
 *
 * TDD RED phase: CSSFont の全setter・render()出力・エッジケースを検証する。
 * - font-family, font-size, font-weight, font-style
 * - color（文字色）: 文字列setter + CSSColor連携
 * - line-height, letter-spacing
 * - collectProperties -> render 統一パターン準拠
 * - Fluent setter（メソッドチェーン）対応
 * - 設定プロパティのみ出力、未設定は出力しない
 * - プロパティソート順（アルファベット順）
 *
 * Requirements: 5.1, 5.2, 5.7
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSFont } from '../../../../src/css/style/font/css-font.js';
import { CSSColor } from '../../../../src/css/style/color/css-color.js';
import { CSSColorName } from '../../../../src/css/style/color/css-color-name.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSFont {
  return new CSSFont();
}

// ============================================================
// CSSFont
// ============================================================

describe('CSSFont', () => {
  // ── 空出力テスト ──

  describe('空出力', () => {
    it('プロパティ未設定の場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });
  });

  // ── Renderable準拠 ──

  describe('Renderable準拠', () => {
    it('render() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });
  });

  // ── font-family プロパティ ──

  describe('font-family', () => {
    it('font-family を単一フォントで設定できる', () => {
      const sut = makeSUT();
      sut.setFontFamily('Arial');
      expect(sut.render()).toBe('font-family: Arial;');
    });

    it('font-family をフォールバック付きで設定できる', () => {
      const sut = makeSUT();
      sut.setFontFamily("'Helvetica Neue', Arial, sans-serif");
      expect(sut.render()).toBe("font-family: 'Helvetica Neue', Arial, sans-serif;");
    });

    it('font-family をジェネリックファミリで設定できる', () => {
      const sut = makeSUT();
      sut.setFontFamily('serif');
      expect(sut.render()).toBe('font-family: serif;');
    });

    it('font-family を monospace で設定できる', () => {
      const sut = makeSUT();
      sut.setFontFamily('monospace');
      expect(sut.render()).toBe('font-family: monospace;');
    });

    it('font-family を cursive で設定できる', () => {
      const sut = makeSUT();
      sut.setFontFamily('cursive');
      expect(sut.render()).toBe('font-family: cursive;');
    });
  });

  // ── font-size プロパティ ──

  describe('font-size', () => {
    it('font-size を px 単位で設定できる', () => {
      const sut = makeSUT();
      sut.setFontSize('16px');
      expect(sut.render()).toBe('font-size: 16px;');
    });

    it('font-size を em 単位で設定できる', () => {
      const sut = makeSUT();
      sut.setFontSize('1.5em');
      expect(sut.render()).toBe('font-size: 1.5em;');
    });

    it('font-size を rem 単位で設定できる', () => {
      const sut = makeSUT();
      sut.setFontSize('1rem');
      expect(sut.render()).toBe('font-size: 1rem;');
    });

    it('font-size を % 単位で設定できる', () => {
      const sut = makeSUT();
      sut.setFontSize('120%');
      expect(sut.render()).toBe('font-size: 120%;');
    });

    it('font-size をキーワードで設定できる', () => {
      const sut = makeSUT();
      sut.setFontSize('large');
      expect(sut.render()).toBe('font-size: large;');
    });

    it('font-size を small で設定できる', () => {
      const sut = makeSUT();
      sut.setFontSize('small');
      expect(sut.render()).toBe('font-size: small;');
    });
  });

  // ── font-weight プロパティ ──

  describe('font-weight', () => {
    it('font-weight をキーワードで設定できる', () => {
      const sut = makeSUT();
      sut.setFontWeight('bold');
      expect(sut.render()).toBe('font-weight: bold;');
    });

    it('font-weight を数値で設定できる', () => {
      const sut = makeSUT();
      sut.setFontWeight('700');
      expect(sut.render()).toBe('font-weight: 700;');
    });

    it('font-weight を normal で設定できる', () => {
      const sut = makeSUT();
      sut.setFontWeight('normal');
      expect(sut.render()).toBe('font-weight: normal;');
    });

    it('font-weight を lighter で設定できる', () => {
      const sut = makeSUT();
      sut.setFontWeight('lighter');
      expect(sut.render()).toBe('font-weight: lighter;');
    });

    it('font-weight を 100 で設定できる', () => {
      const sut = makeSUT();
      sut.setFontWeight('100');
      expect(sut.render()).toBe('font-weight: 100;');
    });

    it('font-weight を 900 で設定できる', () => {
      const sut = makeSUT();
      sut.setFontWeight('900');
      expect(sut.render()).toBe('font-weight: 900;');
    });
  });

  // ── font-style プロパティ ──

  describe('font-style', () => {
    it('font-style: italic を設定できる', () => {
      const sut = makeSUT();
      sut.setFontStyle('italic');
      expect(sut.render()).toBe('font-style: italic;');
    });

    it('font-style: normal を設定できる', () => {
      const sut = makeSUT();
      sut.setFontStyle('normal');
      expect(sut.render()).toBe('font-style: normal;');
    });

    it('font-style: oblique を設定できる', () => {
      const sut = makeSUT();
      sut.setFontStyle('oblique');
      expect(sut.render()).toBe('font-style: oblique;');
    });
  });

  // ── color（文字色）プロパティ ──

  describe('color', () => {
    it('color を文字列で設定できる', () => {
      const sut = makeSUT();
      sut.setColor('red');
      expect(sut.render()).toBe('color: red;');
    });

    it('color を HEX 値で設定できる', () => {
      const sut = makeSUT();
      sut.setColor('#FF0000');
      expect(sut.render()).toBe('color: #FF0000;');
    });

    it('color を rgb() で設定できる', () => {
      const sut = makeSUT();
      sut.setColor('rgb(255, 0, 0)');
      expect(sut.render()).toBe('color: rgb(255, 0, 0);');
    });

    it('color を rgba() で設定できる', () => {
      const sut = makeSUT();
      sut.setColor('rgba(255, 0, 0, 0.5)');
      expect(sut.render()).toBe('color: rgba(255, 0, 0, 0.5);');
    });

    it('color に inherit を設定できる', () => {
      const sut = makeSUT();
      sut.setColor('inherit');
      expect(sut.render()).toBe('color: inherit;');
    });

    // CSSColor 連携テスト
    describe('CSSColor連携', () => {
      it('CSSColor.hex() で文字色を設定できる', () => {
        const sut = makeSUT();
        const color = CSSColor.hex('#FF0000');
        sut.setColorValue(color);
        expect(sut.render()).toBe('color: #FF0000;');
      });

      it('CSSColor.rgb() で文字色を設定できる', () => {
        const sut = makeSUT();
        const color = CSSColor.rgb(0, 128, 255);
        sut.setColorValue(color);
        expect(sut.render()).toBe('color: rgb(0, 128, 255);');
      });

      it('CSSColor.rgba() で文字色を設定できる', () => {
        const sut = makeSUT();
        const color = CSSColor.rgba(255, 255, 0, 0.8);
        sut.setColorValue(color);
        expect(sut.render()).toBe('color: rgba(255, 255, 0, 0.8);');
      });

      it('CSSColor.named() で文字色を設定できる', () => {
        const sut = makeSUT();
        const color = CSSColor.named(CSSColorName.blue);
        sut.setColorValue(color);
        expect(sut.render()).toBe('color: blue;');
      });

      it('CSSColor.raw() で文字色を設定できる', () => {
        const sut = makeSUT();
        const color = CSSColor.raw('var(--text-color)');
        sut.setColorValue(color);
        expect(sut.render()).toBe('color: var(--text-color);');
      });

      it('CSSColor.named(transparent) で文字色を設定できる', () => {
        const sut = makeSUT();
        const color = CSSColor.named(CSSColorName.transparent);
        sut.setColorValue(color);
        expect(sut.render()).toBe('color: transparent;');
      });

      it('CSSColor.named(currentColor) で文字色を設定できる', () => {
        const sut = makeSUT();
        const color = CSSColor.named(CSSColorName.currentColor);
        sut.setColorValue(color);
        expect(sut.render()).toBe('color: currentColor;');
      });
    });
  });

  // ── line-height プロパティ ──

  describe('line-height', () => {
    it('line-height を数値で設定できる', () => {
      const sut = makeSUT();
      sut.setLineHeight('1.5');
      expect(sut.render()).toBe('line-height: 1.5;');
    });

    it('line-height を px 単位で設定できる', () => {
      const sut = makeSUT();
      sut.setLineHeight('24px');
      expect(sut.render()).toBe('line-height: 24px;');
    });

    it('line-height を em 単位で設定できる', () => {
      const sut = makeSUT();
      sut.setLineHeight('1.6em');
      expect(sut.render()).toBe('line-height: 1.6em;');
    });

    it('line-height に normal を設定できる', () => {
      const sut = makeSUT();
      sut.setLineHeight('normal');
      expect(sut.render()).toBe('line-height: normal;');
    });

    it('line-height を % 単位で設定できる', () => {
      const sut = makeSUT();
      sut.setLineHeight('150%');
      expect(sut.render()).toBe('line-height: 150%;');
    });
  });

  // ── letter-spacing プロパティ ──

  describe('letter-spacing', () => {
    it('letter-spacing を px 単位で設定できる', () => {
      const sut = makeSUT();
      sut.setLetterSpacing('2px');
      expect(sut.render()).toBe('letter-spacing: 2px;');
    });

    it('letter-spacing を em 単位で設定できる', () => {
      const sut = makeSUT();
      sut.setLetterSpacing('0.05em');
      expect(sut.render()).toBe('letter-spacing: 0.05em;');
    });

    it('letter-spacing に normal を設定できる', () => {
      const sut = makeSUT();
      sut.setLetterSpacing('normal');
      expect(sut.render()).toBe('letter-spacing: normal;');
    });

    it('letter-spacing を負の値で設定できる', () => {
      const sut = makeSUT();
      sut.setLetterSpacing('-1px');
      expect(sut.render()).toBe('letter-spacing: -1px;');
    });
  });

  // ── Fluent setter（メソッドチェーン） ──

  describe('メソッドチェーン', () => {
    it('setFontFamily が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFontFamily('Arial');
      expect(result).toBe(sut);
    });

    it('setFontSize が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFontSize('16px');
      expect(result).toBe(sut);
    });

    it('setFontWeight が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFontWeight('bold');
      expect(result).toBe(sut);
    });

    it('setFontStyle が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setFontStyle('italic');
      expect(result).toBe(sut);
    });

    it('setColor が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setColor('red');
      expect(result).toBe(sut);
    });

    it('setColorValue が this を返す', () => {
      const sut = makeSUT();
      const color = CSSColor.hex('#000');
      const result = sut.setColorValue(color);
      expect(result).toBe(sut);
    });

    it('setLineHeight が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setLineHeight('1.5');
      expect(result).toBe(sut);
    });

    it('setLetterSpacing が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setLetterSpacing('2px');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setFontFamily('Arial')
        .setFontSize('16px')
        .setFontWeight('bold')
        .setFontStyle('italic')
        .setColor('#333')
        .setLineHeight('1.5')
        .setLetterSpacing('0.5px');
      expect(result).toBe(sut);
      const rendered = sut.render();
      expect(rendered).toContain('font-family: Arial');
      expect(rendered).toContain('font-size: 16px');
      expect(rendered).toContain('font-weight: bold');
      expect(rendered).toContain('font-style: italic');
      expect(rendered).toContain('color: #333');
      expect(rendered).toContain('line-height: 1.5');
      expect(rendered).toContain('letter-spacing: 0.5px');
    });

    it('setColorValue をチェーンの中で使用できる', () => {
      const sut = makeSUT();
      const color = CSSColor.named(CSSColorName.red);
      const result = sut
        .setFontSize('14px')
        .setColorValue(color)
        .setFontWeight('normal');
      expect(result).toBe(sut);
      const rendered = sut.render();
      expect(rendered).toContain('font-size: 14px');
      expect(rendered).toContain('color: red');
      expect(rendered).toContain('font-weight: normal');
    });
  });

  // ── プロパティソート順の検証 ──

  describe('プロパティソート順（アルファベット順）', () => {
    it('全プロパティがアルファベット順にソートされる', () => {
      const sut = makeSUT();
      // 意図的にアルファベット逆順で設定
      sut.setLineHeight('1.5');
      sut.setLetterSpacing('2px');
      sut.setFontWeight('bold');
      sut.setFontStyle('italic');
      sut.setFontSize('16px');
      sut.setFontFamily('Arial');
      sut.setColor('red');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // アルファベット順: color < font-family < font-size < font-style < font-weight < letter-spacing < line-height
      expect(lines[0]).toBe('color: red');
      expect(lines[1]).toBe('font-family: Arial');
      expect(lines[2]).toBe('font-size: 16px');
      expect(lines[3]).toBe('font-style: italic');
      expect(lines[4]).toBe('font-weight: bold');
      expect(lines[5]).toBe('letter-spacing: 2px');
      expect(lines[6]).toBe('line-height: 1.5;'); // 最後のエントリにはセミコロンが付く
    });

    it('color と font-family の順序が正しい', () => {
      const sut = makeSUT();
      sut.setFontFamily('Arial');
      sut.setColor('blue');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // color < font-family
      expect(lines[0]).toBe('color: blue');
      expect(lines[1]).toBe('font-family: Arial;');
    });

    it('font-size と font-weight の順序が正しい', () => {
      const sut = makeSUT();
      sut.setFontWeight('bold');
      sut.setFontSize('16px');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // font-size < font-weight
      expect(lines[0]).toBe('font-size: 16px');
      expect(lines[1]).toBe('font-weight: bold;');
    });

    it('letter-spacing と line-height の順序が正しい', () => {
      const sut = makeSUT();
      sut.setLineHeight('1.5');
      sut.setLetterSpacing('2px');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // letter-spacing < line-height
      expect(lines[0]).toBe('letter-spacing: 2px');
      expect(lines[1]).toBe('line-height: 1.5;');
    });
  });

  // ── render() 出力フォーマット ──

  describe('render()出力フォーマット', () => {
    it('単一プロパティの場合、セミコロンで終わる', () => {
      const sut = makeSUT();
      sut.setFontSize('16px');
      expect(sut.render()).toBe('font-size: 16px;');
    });

    it('複数プロパティの場合、セミコロン+改行で区切られ、最後にセミコロンが付く', () => {
      const sut = makeSUT();
      sut.setFontFamily('Arial');
      sut.setFontSize('16px');
      expect(sut.render()).toBe('font-family: Arial;\nfont-size: 16px;');
    });

    it('3つ以上のプロパティの場合も正しいフォーマットになる', () => {
      const sut = makeSUT();
      sut.setColor('#333');
      sut.setFontFamily('Arial');
      sut.setFontSize('16px');
      expect(sut.render()).toBe('color: #333;\nfont-family: Arial;\nfont-size: 16px;');
    });
  });

  // ── 設定プロパティのみ出力（未設定は出力しない） ──

  describe('設定プロパティのみ出力', () => {
    it('font-family のみ設定した場合、font-family のみ出力される', () => {
      const sut = makeSUT();
      sut.setFontFamily('Arial');
      const rendered = sut.render();
      expect(rendered).toBe('font-family: Arial;');
      expect(rendered).not.toContain('font-size');
      expect(rendered).not.toContain('font-weight');
      expect(rendered).not.toContain('font-style');
      expect(rendered).not.toContain('color');
      expect(rendered).not.toContain('line-height');
      expect(rendered).not.toContain('letter-spacing');
    });

    it('color のみ設定した場合、color のみ出力される', () => {
      const sut = makeSUT();
      sut.setColor('red');
      const rendered = sut.render();
      expect(rendered).toBe('color: red;');
      expect(rendered).not.toContain('font-family');
      expect(rendered).not.toContain('font-size');
    });

    it('line-height のみ設定した場合、line-height のみ出力される', () => {
      const sut = makeSUT();
      sut.setLineHeight('1.5');
      const rendered = sut.render();
      expect(rendered).toBe('line-height: 1.5;');
      expect(rendered).not.toContain('font');
      expect(rendered).not.toContain('color');
      expect(rendered).not.toContain('letter-spacing');
    });
  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    const savedDev = process.env.DRAFT_OLE_DEV;
    beforeEach(() => { delete process.env.DRAFT_OLE_DEV; });
    afterEach(() => {
      if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
      else process.env.DRAFT_OLE_DEV = savedDev;
    });

    it('同じプロパティを複数回設定した場合、最後の値が使われる', () => {
      const sut = makeSUT();
      sut.setFontSize('12px');
      sut.setFontSize('16px');
      expect(sut.render()).toBe('font-size: 16px;');
    });

    it('setColor で設定後に setColorValue で上書きできる', () => {
      const sut = makeSUT();
      sut.setColor('red');
      sut.setColorValue(CSSColor.hex('#0000FF'));
      expect(sut.render()).toBe('color: #0000FF;');
    });

    it('setColorValue で設定後に setColor で上書きできる', () => {
      const sut = makeSUT();
      sut.setColorValue(CSSColor.named(CSSColorName.blue));
      sut.setColor('green');
      expect(sut.render()).toBe('color: green;');
    });

    it('render() を複数回呼んでも同じ値を返す', () => {
      const sut = makeSUT();
      sut.setFontFamily('Arial');
      sut.setFontSize('16px');
      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });

    it('全プロパティを設定した場合のrender()が正常に動作する', () => {
      const sut = makeSUT();
      sut.setFontFamily('Arial');
      sut.setFontSize('16px');
      sut.setFontWeight('bold');
      sut.setFontStyle('italic');
      sut.setColor('#333');
      sut.setLineHeight('1.5');
      sut.setLetterSpacing('2px');

      const rendered = sut.render();
      // 7プロパティすべてが出力に含まれる
      expect(rendered).toContain('font-family: Arial');
      expect(rendered).toContain('font-size: 16px');
      expect(rendered).toContain('font-weight: bold');
      expect(rendered).toContain('font-style: italic');
      expect(rendered).toContain('color: #333');
      expect(rendered).toContain('line-height: 1.5');
      expect(rendered).toContain('letter-spacing: 2px');

      // 行数の確認（7プロパティ = 7行、;\n区切り）
      const lines = rendered.split(';\n');
      expect(lines).toHaveLength(7);
    });

    it('font-family にクォート付きフォント名を設定できる', () => {
      const sut = makeSUT();
      sut.setFontFamily('"Times New Roman"');
      expect(sut.render()).toBe('font-family: "Times New Roman";');
    });

    it('font-family に日本語フォント名を設定できる', () => {
      const sut = makeSUT();
      sut.setFontFamily("'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif");
      expect(sut.render()).toBe("font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;");
    });
  });
});
