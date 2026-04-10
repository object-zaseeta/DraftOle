/**
 * Task 3.3: CSSBorder -- 枠線プロパティのテスト
 *
 * TDD RED phase: border-width, border-style, border-color（各方向個別対応）、
 * border-radius（各角個別対応）、CSSColor連携、collectProperties→render統一パターンを検証する。
 *
 * Requirements: 5.6, 5.7
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSBorder } from '../../../../src/css/style/border/css-border.js';
import { CSSColor } from '../../../../src/css/style/color/css-color.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSBorder {
  return new CSSBorder();
}

// ============================================================
// CSSBorder
// ============================================================

describe('CSSBorder', () => {
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

    it('render() が string を返す', () => {
      const sut = makeSUT();
      const result = sut.render();
      expect(typeof result).toBe('string');
    });
  });

  // ── border-width（一括） ──

  describe('border-width（一括）', () => {
    it('border-width を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderWidth('1px');
      expect(sut.render()).toBe('border-width: 1px;');
    });

    it('border-width に複数値を設定できる（上右下左）', () => {
      const sut = makeSUT();
      sut.setBorderWidth('1px 2px 3px 4px');
      expect(sut.render()).toBe('border-width: 1px 2px 3px 4px;');
    });

    it('border-width に thin を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderWidth('thin');
      expect(sut.render()).toBe('border-width: thin;');
    });

    it('border-width に medium を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderWidth('medium');
      expect(sut.render()).toBe('border-width: medium;');
    });

    it('border-width に thick を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderWidth('thick');
      expect(sut.render()).toBe('border-width: thick;');
    });
  });

  // ── border-style（一括） ──

  describe('border-style（一括）', () => {
    it('border-style: solid を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderStyle('solid');
      expect(sut.render()).toBe('border-style: solid;');
    });

    it('border-style: dashed を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderStyle('dashed');
      expect(sut.render()).toBe('border-style: dashed;');
    });

    it('border-style: dotted を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderStyle('dotted');
      expect(sut.render()).toBe('border-style: dotted;');
    });

    it('border-style: double を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderStyle('double');
      expect(sut.render()).toBe('border-style: double;');
    });

    it('border-style: none を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderStyle('none');
      expect(sut.render()).toBe('border-style: none;');
    });

    it('border-style に複数値を設定できる（上右下左）', () => {
      const sut = makeSUT();
      sut.setBorderStyle('solid dashed dotted double');
      expect(sut.render()).toBe('border-style: solid dashed dotted double;');
    });
  });

  // ── border-color（一括） ──

  describe('border-color（一括）', () => {
    it('border-color を文字列で設定できる', () => {
      const sut = makeSUT();
      sut.setBorderColor('red');
      expect(sut.render()).toBe('border-color: red;');
    });

    it('border-color に HEX 値を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderColor('#ff0000');
      expect(sut.render()).toBe('border-color: #ff0000;');
    });

    it('border-color に複数値を設定できる（上右下左）', () => {
      const sut = makeSUT();
      sut.setBorderColor('red green blue yellow');
      expect(sut.render()).toBe('border-color: red green blue yellow;');
    });
  });

  // ── border-radius（一括） ──

  describe('border-radius（一括）', () => {
    it('border-radius を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderRadius('5px');
      expect(sut.render()).toBe('border-radius: 5px;');
    });

    it('border-radius に % を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderRadius('50%');
      expect(sut.render()).toBe('border-radius: 50%;');
    });

    it('border-radius に複数値を設定できる（四隅）', () => {
      const sut = makeSUT();
      sut.setBorderRadius('5px 10px 15px 20px');
      expect(sut.render()).toBe('border-radius: 5px 10px 15px 20px;');
    });

    it('border-radius に 0 を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderRadius('0');
      expect(sut.render()).toBe('border-radius: 0;');
    });
  });

  // ── border-*-width（各方向） ──

  describe('border-*-width（各方向）', () => {
    it('border-top-width を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopWidth('1px');
      expect(sut.render()).toBe('border-top-width: 1px;');
    });

    it('border-right-width を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderRightWidth('2px');
      expect(sut.render()).toBe('border-right-width: 2px;');
    });

    it('border-bottom-width を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderBottomWidth('3px');
      expect(sut.render()).toBe('border-bottom-width: 3px;');
    });

    it('border-left-width を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderLeftWidth('4px');
      expect(sut.render()).toBe('border-left-width: 4px;');
    });

    it('全方向の width を個別に設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopWidth('1px');
      sut.setBorderRightWidth('2px');
      sut.setBorderBottomWidth('3px');
      sut.setBorderLeftWidth('4px');

      const rendered = sut.render();
      expect(rendered).toContain('border-top-width: 1px');
      expect(rendered).toContain('border-right-width: 2px');
      expect(rendered).toContain('border-bottom-width: 3px');
      expect(rendered).toContain('border-left-width: 4px');
    });
  });

  // ── border-*-style（各方向） ──

  describe('border-*-style（各方向）', () => {
    it('border-top-style を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopStyle('solid');
      expect(sut.render()).toBe('border-top-style: solid;');
    });

    it('border-right-style を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderRightStyle('dashed');
      expect(sut.render()).toBe('border-right-style: dashed;');
    });

    it('border-bottom-style を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderBottomStyle('dotted');
      expect(sut.render()).toBe('border-bottom-style: dotted;');
    });

    it('border-left-style を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderLeftStyle('double');
      expect(sut.render()).toBe('border-left-style: double;');
    });

    it('全方向の style を個別に設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopStyle('solid');
      sut.setBorderRightStyle('dashed');
      sut.setBorderBottomStyle('dotted');
      sut.setBorderLeftStyle('double');

      const rendered = sut.render();
      expect(rendered).toContain('border-top-style: solid');
      expect(rendered).toContain('border-right-style: dashed');
      expect(rendered).toContain('border-bottom-style: dotted');
      expect(rendered).toContain('border-left-style: double');
    });
  });

  // ── border-*-color（各方向） ──

  describe('border-*-color（各方向）', () => {
    it('border-top-color を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopColor('red');
      expect(sut.render()).toBe('border-top-color: red;');
    });

    it('border-right-color を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderRightColor('green');
      expect(sut.render()).toBe('border-right-color: green;');
    });

    it('border-bottom-color を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderBottomColor('blue');
      expect(sut.render()).toBe('border-bottom-color: blue;');
    });

    it('border-left-color を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderLeftColor('yellow');
      expect(sut.render()).toBe('border-left-color: yellow;');
    });

    it('全方向の color を個別に設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopColor('red');
      sut.setBorderRightColor('green');
      sut.setBorderBottomColor('blue');
      sut.setBorderLeftColor('yellow');

      const rendered = sut.render();
      expect(rendered).toContain('border-top-color: red');
      expect(rendered).toContain('border-right-color: green');
      expect(rendered).toContain('border-bottom-color: blue');
      expect(rendered).toContain('border-left-color: yellow');
    });
  });

  // ── border-*-*-radius（各角） ──

  describe('border-*-*-radius（各角）', () => {
    it('border-top-left-radius を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopLeftRadius('5px');
      expect(sut.render()).toBe('border-top-left-radius: 5px;');
    });

    it('border-top-right-radius を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopRightRadius('10px');
      expect(sut.render()).toBe('border-top-right-radius: 10px;');
    });

    it('border-bottom-right-radius を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderBottomRightRadius('15px');
      expect(sut.render()).toBe('border-bottom-right-radius: 15px;');
    });

    it('border-bottom-left-radius を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderBottomLeftRadius('20px');
      expect(sut.render()).toBe('border-bottom-left-radius: 20px;');
    });

    it('全角の radius を個別に設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopLeftRadius('5px');
      sut.setBorderTopRightRadius('10px');
      sut.setBorderBottomRightRadius('15px');
      sut.setBorderBottomLeftRadius('20px');

      const rendered = sut.render();
      expect(rendered).toContain('border-top-left-radius: 5px');
      expect(rendered).toContain('border-top-right-radius: 10px');
      expect(rendered).toContain('border-bottom-right-radius: 15px');
      expect(rendered).toContain('border-bottom-left-radius: 20px');
    });

    it('border-top-left-radius に % を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderTopLeftRadius('50%');
      expect(sut.render()).toBe('border-top-left-radius: 50%;');
    });

    it('border-bottom-right-radius に em を設定できる', () => {
      const sut = makeSUT();
      sut.setBorderBottomRightRadius('1.5em');
      expect(sut.render()).toBe('border-bottom-right-radius: 1.5em;');
    });
  });

  // ── CSSColor連携 ──

  describe('CSSColor連携', () => {
    it('setBorderColorValue で CSSColor(HEX) を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.hex('#ff0000');
      sut.setBorderColorValue(color);
      expect(sut.render()).toBe('border-color: #ff0000;');
    });

    it('setBorderColorValue で CSSColor(RGB) を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.rgb(255, 0, 0);
      sut.setBorderColorValue(color);
      expect(sut.render()).toBe('border-color: rgb(255, 0, 0);');
    });

    it('setBorderColorValue で CSSColor(RGBA) を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.rgba(255, 0, 0, 0.5);
      sut.setBorderColorValue(color);
      expect(sut.render()).toBe('border-color: rgba(255, 0, 0, 0.5);');
    });

    it('setBorderColorValue で CSSColor(named) を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.named('red');
      sut.setBorderColorValue(color);
      expect(sut.render()).toBe('border-color: red;');
    });

    it('setBorderColorValue で CSSColor(raw) を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.raw('var(--border-color)');
      sut.setBorderColorValue(color);
      expect(sut.render()).toBe('border-color: var(--border-color);');
    });

    it('setBorderTopColorValue で CSSColor を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.hex('#00ff00');
      sut.setBorderTopColorValue(color);
      expect(sut.render()).toBe('border-top-color: #00ff00;');
    });

    it('setBorderRightColorValue で CSSColor を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.rgb(0, 0, 255);
      sut.setBorderRightColorValue(color);
      expect(sut.render()).toBe('border-right-color: rgb(0, 0, 255);');
    });

    it('setBorderBottomColorValue で CSSColor を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.rgba(0, 0, 0, 0.3);
      sut.setBorderBottomColorValue(color);
      expect(sut.render()).toBe('border-bottom-color: rgba(0, 0, 0, 0.3);');
    });

    it('setBorderLeftColorValue で CSSColor を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.named('blue');
      sut.setBorderLeftColorValue(color);
      expect(sut.render()).toBe('border-left-color: blue;');
    });
  });

  // ── メソッドチェーン ──

  describe('メソッドチェーン', () => {
    it('setBorderWidth が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderWidth('1px');
      expect(result).toBe(sut);
    });

    it('setBorderStyle が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderStyle('solid');
      expect(result).toBe(sut);
    });

    it('setBorderColor が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderColor('red');
      expect(result).toBe(sut);
    });

    it('setBorderRadius が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderRadius('5px');
      expect(result).toBe(sut);
    });

    it('setBorderTopWidth が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderTopWidth('1px');
      expect(result).toBe(sut);
    });

    it('setBorderRightWidth が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderRightWidth('1px');
      expect(result).toBe(sut);
    });

    it('setBorderBottomWidth が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderBottomWidth('1px');
      expect(result).toBe(sut);
    });

    it('setBorderLeftWidth が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderLeftWidth('1px');
      expect(result).toBe(sut);
    });

    it('setBorderTopStyle が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderTopStyle('solid');
      expect(result).toBe(sut);
    });

    it('setBorderRightStyle が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderRightStyle('solid');
      expect(result).toBe(sut);
    });

    it('setBorderBottomStyle が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderBottomStyle('solid');
      expect(result).toBe(sut);
    });

    it('setBorderLeftStyle が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderLeftStyle('solid');
      expect(result).toBe(sut);
    });

    it('setBorderTopColor が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderTopColor('red');
      expect(result).toBe(sut);
    });

    it('setBorderRightColor が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderRightColor('red');
      expect(result).toBe(sut);
    });

    it('setBorderBottomColor が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderBottomColor('red');
      expect(result).toBe(sut);
    });

    it('setBorderLeftColor が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderLeftColor('red');
      expect(result).toBe(sut);
    });

    it('setBorderTopLeftRadius が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderTopLeftRadius('5px');
      expect(result).toBe(sut);
    });

    it('setBorderTopRightRadius が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderTopRightRadius('5px');
      expect(result).toBe(sut);
    });

    it('setBorderBottomRightRadius が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderBottomRightRadius('5px');
      expect(result).toBe(sut);
    });

    it('setBorderBottomLeftRadius が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderBottomLeftRadius('5px');
      expect(result).toBe(sut);
    });

    it('setBorderColorValue が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderColorValue(CSSColor.hex('#000'));
      expect(result).toBe(sut);
    });

    it('setBorderTopColorValue が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderTopColorValue(CSSColor.hex('#000'));
      expect(result).toBe(sut);
    });

    it('setBorderRightColorValue が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderRightColorValue(CSSColor.hex('#000'));
      expect(result).toBe(sut);
    });

    it('setBorderBottomColorValue が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderBottomColorValue(CSSColor.hex('#000'));
      expect(result).toBe(sut);
    });

    it('setBorderLeftColorValue が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBorderLeftColorValue(CSSColor.hex('#000'));
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setBorderWidth('1px')
        .setBorderStyle('solid')
        .setBorderColor('red')
        .setBorderRadius('5px');
      expect(result).toBe(sut);

      const rendered = sut.render();
      expect(rendered).toContain('border-width: 1px');
      expect(rendered).toContain('border-style: solid');
      expect(rendered).toContain('border-color: red');
      expect(rendered).toContain('border-radius: 5px');
    });

    it('一括と方向別をチェーンで混在できる', () => {
      const sut = makeSUT();
      const result = sut
        .setBorderWidth('1px')
        .setBorderTopStyle('solid')
        .setBorderColorValue(CSSColor.hex('#000'))
        .setBorderTopLeftRadius('5px');
      expect(result).toBe(sut);
    });
  });

  // ── プロパティソート順 ──

  describe('プロパティソート順', () => {
    it('複数プロパティがアルファベット順にソートされる', () => {
      const sut = makeSUT();
      // 意図的に逆順で設定
      sut.setBorderWidth('1px');
      sut.setBorderStyle('solid');
      sut.setBorderColor('red');
      sut.setBorderRadius('5px');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // border-color < border-radius < border-style < border-width
      expect(lines[0]).toBe('border-color: red');
      expect(lines[1]).toBe('border-radius: 5px');
      expect(lines[2]).toBe('border-style: solid');
      expect(lines[3]).toBe('border-width: 1px;');
    });

    it('方向別プロパティがアルファベット順にソートされる', () => {
      const sut = makeSUT();
      sut.setBorderLeftWidth('4px');
      sut.setBorderTopWidth('1px');
      sut.setBorderBottomWidth('3px');
      sut.setBorderRightWidth('2px');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // border-bottom-width < border-left-width < border-right-width < border-top-width
      expect(lines[0]).toBe('border-bottom-width: 3px');
      expect(lines[1]).toBe('border-left-width: 4px');
      expect(lines[2]).toBe('border-right-width: 2px');
      expect(lines[3]).toBe('border-top-width: 1px;');
    });

    it('radius 各角がアルファベット順にソートされる', () => {
      const sut = makeSUT();
      sut.setBorderTopRightRadius('10px');
      sut.setBorderBottomLeftRadius('20px');
      sut.setBorderTopLeftRadius('5px');
      sut.setBorderBottomRightRadius('15px');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // border-bottom-left-radius < border-bottom-right-radius < border-top-left-radius < border-top-right-radius
      expect(lines[0]).toBe('border-bottom-left-radius: 20px');
      expect(lines[1]).toBe('border-bottom-right-radius: 15px');
      expect(lines[2]).toBe('border-top-left-radius: 5px');
      expect(lines[3]).toBe('border-top-right-radius: 10px;');
    });

    it('一括と方向別が混在した場合もアルファベット順にソートされる', () => {
      const sut = makeSUT();
      sut.setBorderWidth('1px');
      sut.setBorderTopWidth('2px');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // border-top-width < border-width
      expect(lines[0]).toBe('border-top-width: 2px');
      expect(lines[1]).toBe('border-width: 1px;');
    });

    it('color の方向別がアルファベット順にソートされる', () => {
      const sut = makeSUT();
      sut.setBorderLeftColor('yellow');
      sut.setBorderTopColor('red');
      sut.setBorderBottomColor('blue');
      sut.setBorderRightColor('green');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // border-bottom-color < border-left-color < border-right-color < border-top-color
      expect(lines[0]).toBe('border-bottom-color: blue');
      expect(lines[1]).toBe('border-left-color: yellow');
      expect(lines[2]).toBe('border-right-color: green');
      expect(lines[3]).toBe('border-top-color: red;');
    });

    it('style の方向別がアルファベット順にソートされる', () => {
      const sut = makeSUT();
      sut.setBorderLeftStyle('double');
      sut.setBorderTopStyle('solid');
      sut.setBorderBottomStyle('dotted');
      sut.setBorderRightStyle('dashed');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // border-bottom-style < border-left-style < border-right-style < border-top-style
      expect(lines[0]).toBe('border-bottom-style: dotted');
      expect(lines[1]).toBe('border-left-style: double');
      expect(lines[2]).toBe('border-right-style: dashed');
      expect(lines[3]).toBe('border-top-style: solid;');
    });
  });

  // ── render()出力フォーマット ──

  describe('render()出力フォーマット', () => {
    it('単一プロパティの場合、セミコロンで終わる', () => {
      const sut = makeSUT();
      sut.setBorderWidth('1px');
      expect(sut.render()).toBe('border-width: 1px;');
    });

    it('複数プロパティの場合、セミコロン+改行で区切られ、最後にセミコロンが付く', () => {
      const sut = makeSUT();
      sut.setBorderWidth('1px');
      sut.setBorderStyle('solid');
      expect(sut.render()).toBe('border-style: solid;\nborder-width: 1px;');
    });

    it('3つ以上のプロパティの場合も正しいフォーマットになる', () => {
      const sut = makeSUT();
      sut.setBorderWidth('1px');
      sut.setBorderStyle('solid');
      sut.setBorderColor('red');
      expect(sut.render()).toBe(
        'border-color: red;\nborder-style: solid;\nborder-width: 1px;'
      );
    });
  });

  // ── 一括設定と方向別設定の組み合わせ ──

  describe('一括設定と方向別設定の組み合わせ', () => {
    const savedDev = process.env.DRAFT_OLE_DEV;
    beforeEach(() => { delete process.env.DRAFT_OLE_DEV; });
    afterEach(() => {
      if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
      else process.env.DRAFT_OLE_DEV = savedDev;
    });

    it('border-width 一括と border-top-width を同時に設定できる', () => {
      const sut = makeSUT();
      sut.setBorderWidth('1px');
      sut.setBorderTopWidth('2px');

      const rendered = sut.render();
      expect(rendered).toContain('border-width: 1px');
      expect(rendered).toContain('border-top-width: 2px');
    });

    it('border-color 一括と方向別 color を同時に設定できる', () => {
      const sut = makeSUT();
      sut.setBorderColor('red');
      sut.setBorderTopColor('blue');

      const rendered = sut.render();
      expect(rendered).toContain('border-color: red');
      expect(rendered).toContain('border-top-color: blue');
    });

    it('border-style 一括と方向別 style を同時に設定できる', () => {
      const sut = makeSUT();
      sut.setBorderStyle('solid');
      sut.setBorderBottomStyle('dashed');

      const rendered = sut.render();
      expect(rendered).toContain('border-style: solid');
      expect(rendered).toContain('border-bottom-style: dashed');
    });

    it('border-radius 一括と個別角の radius を同時に設定できる', () => {
      const sut = makeSUT();
      sut.setBorderRadius('5px');
      sut.setBorderTopLeftRadius('10px');

      const rendered = sut.render();
      expect(rendered).toContain('border-radius: 5px');
      expect(rendered).toContain('border-top-left-radius: 10px');
    });

    it('width, style, color を全方向個別に設定した場合、12個のプロパティが出力される', () => {
      const sut = makeSUT();
      // width 4方向
      sut.setBorderTopWidth('1px');
      sut.setBorderRightWidth('2px');
      sut.setBorderBottomWidth('3px');
      sut.setBorderLeftWidth('4px');
      // style 4方向
      sut.setBorderTopStyle('solid');
      sut.setBorderRightStyle('dashed');
      sut.setBorderBottomStyle('dotted');
      sut.setBorderLeftStyle('double');
      // color 4方向
      sut.setBorderTopColor('red');
      sut.setBorderRightColor('green');
      sut.setBorderBottomColor('blue');
      sut.setBorderLeftColor('yellow');

      const rendered = sut.render();
      const lines = rendered.split(';\n');
      expect(lines).toHaveLength(12);
    });

    it('文字列セッターと CSSColor セッターで同じ色プロパティを上書きできる', () => {
      const sut = makeSUT();
      sut.setBorderColor('red');
      sut.setBorderColorValue(CSSColor.hex('#00ff00'));
      expect(sut.render()).toBe('border-color: #00ff00;');
    });

    it('CSSColor セッターを文字列セッターで上書きできる', () => {
      const sut = makeSUT();
      sut.setBorderColorValue(CSSColor.hex('#00ff00'));
      sut.setBorderColor('red');
      expect(sut.render()).toBe('border-color: red;');
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
      sut.setBorderWidth('1px');
      sut.setBorderWidth('2px');
      expect(sut.render()).toBe('border-width: 2px;');
    });

    it('render() を複数回呼んでも同じ値を返す（冪等性）', () => {
      const sut = makeSUT();
      sut.setBorderWidth('1px');
      sut.setBorderStyle('solid');
      sut.setBorderColor('red');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });

    it('全20プロパティを設定した場合のrender()が正常に動作する', () => {
      const sut = makeSUT();
      // 一括 (4)
      sut.setBorderWidth('1px');
      sut.setBorderStyle('solid');
      sut.setBorderColor('red');
      sut.setBorderRadius('5px');
      // width 方向別 (4)
      sut.setBorderTopWidth('1px');
      sut.setBorderRightWidth('2px');
      sut.setBorderBottomWidth('3px');
      sut.setBorderLeftWidth('4px');
      // style 方向別 (4)
      sut.setBorderTopStyle('solid');
      sut.setBorderRightStyle('dashed');
      sut.setBorderBottomStyle('dotted');
      sut.setBorderLeftStyle('double');
      // color 方向別 (4)
      sut.setBorderTopColor('red');
      sut.setBorderRightColor('green');
      sut.setBorderBottomColor('blue');
      sut.setBorderLeftColor('yellow');
      // radius 角別 (4)
      sut.setBorderTopLeftRadius('5px');
      sut.setBorderTopRightRadius('10px');
      sut.setBorderBottomRightRadius('15px');
      sut.setBorderBottomLeftRadius('20px');

      const rendered = sut.render();

      // 20プロパティすべてが出力に含まれる
      expect(rendered).toContain('border-width: 1px');
      expect(rendered).toContain('border-style: solid');
      expect(rendered).toContain('border-color: red');
      expect(rendered).toContain('border-radius: 5px');
      expect(rendered).toContain('border-top-width: 1px');
      expect(rendered).toContain('border-right-width: 2px');
      expect(rendered).toContain('border-bottom-width: 3px');
      expect(rendered).toContain('border-left-width: 4px');
      expect(rendered).toContain('border-top-style: solid');
      expect(rendered).toContain('border-right-style: dashed');
      expect(rendered).toContain('border-bottom-style: dotted');
      expect(rendered).toContain('border-left-style: double');
      expect(rendered).toContain('border-top-color: red');
      expect(rendered).toContain('border-right-color: green');
      expect(rendered).toContain('border-bottom-color: blue');
      expect(rendered).toContain('border-left-color: yellow');
      expect(rendered).toContain('border-top-left-radius: 5px');
      expect(rendered).toContain('border-top-right-radius: 10px');
      expect(rendered).toContain('border-bottom-right-radius: 15px');
      expect(rendered).toContain('border-bottom-left-radius: 20px');

      // 行数の確認（20プロパティ = 20行）
      const lines = rendered.split(';\n');
      expect(lines).toHaveLength(20);
    });

    it('設定プロパティのみが出力され、未設定プロパティは含まれない', () => {
      const sut = makeSUT();
      sut.setBorderWidth('1px');
      const rendered = sut.render();
      expect(rendered).toBe('border-width: 1px;');
      expect(rendered).not.toContain('border-style');
      expect(rendered).not.toContain('border-color');
      expect(rendered).not.toContain('border-radius');
      expect(rendered).not.toContain('border-top');
      expect(rendered).not.toContain('border-right');
      expect(rendered).not.toContain('border-bottom');
      expect(rendered).not.toContain('border-left');
    });

    it('border-top-color のみ設定した場合、他の color は含まれない', () => {
      const sut = makeSUT();
      sut.setBorderTopColor('red');
      const rendered = sut.render();
      expect(rendered).toBe('border-top-color: red;');
      expect(rendered).not.toContain('border-right-color');
      expect(rendered).not.toContain('border-bottom-color');
      expect(rendered).not.toContain('border-left-color');
      expect(rendered).not.toContain('border-color:');
    });

    it('0 の値を正しく出力する', () => {
      const sut = makeSUT();
      sut.setBorderWidth('0');
      expect(sut.render()).toBe('border-width: 0;');
    });

    it('border-radius に 0 を設定しても出力される', () => {
      const sut = makeSUT();
      sut.setBorderRadius('0');
      expect(sut.render()).toBe('border-radius: 0;');
    });

    it('方向別 color を CSSColor で上書きできる', () => {
      const sut = makeSUT();
      sut.setBorderTopColor('red');
      sut.setBorderTopColorValue(CSSColor.hex('#00ff00'));
      expect(sut.render()).toBe('border-top-color: #00ff00;');
    });

    it('CSSColor の方向別設定を文字列セッターで上書きできる', () => {
      const sut = makeSUT();
      sut.setBorderTopColorValue(CSSColor.hex('#00ff00'));
      sut.setBorderTopColor('red');
      expect(sut.render()).toBe('border-top-color: red;');
    });
  });
});
