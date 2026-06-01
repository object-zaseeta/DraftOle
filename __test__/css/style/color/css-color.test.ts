/**
 * Task 1.2: CSSColor 値オブジェクトのテスト
 *
 * TDD RED phase: CSSColor の全ファクトリメソッド・検証メソッド・toString() を検証する。
 */
import { describe, it, expect } from 'vitest';
import { CSSColor } from '../../../../src/css/style/color/css-color.js';
import {
  CSSColorName,
  type CSSColorNameValue,
} from '../../../../src/css/style/color/css-color-name.js';

// ============================================================
// CSSColorName 定数
// ============================================================

describe('CSSColorName', () => {
  it('主要な色名が定義されている', () => {
    expect(CSSColorName.black).toBe('black');
    expect(CSSColorName.white).toBe('white');
    expect(CSSColorName.red).toBe('red');
    expect(CSSColorName.green).toBe('green');
    expect(CSSColorName.blue).toBe('blue');
    expect(CSSColorName.yellow).toBe('yellow');
    expect(CSSColorName.cyan).toBe('cyan');
    expect(CSSColorName.magenta).toBe('magenta');
    expect(CSSColorName.gray).toBe('gray');
    expect(CSSColorName.grey).toBe('grey');
    expect(CSSColorName.orange).toBe('orange');
    expect(CSSColorName.pink).toBe('pink');
    expect(CSSColorName.purple).toBe('purple');
    expect(CSSColorName.brown).toBe('brown');
  });

  it('特殊キーワードが定義されている', () => {
    expect(CSSColorName.transparent).toBe('transparent');
    expect(CSSColorName.currentColor).toBe('currentColor');
    expect(CSSColorName.inherit).toBe('inherit');
  });

  it('CSSColorNameValue 型として使用できる', () => {
    const name: CSSColorNameValue = CSSColorName.red;
    expect(name).toBe('red');
  });
});

// ============================================================
// CSSColor ファクトリメソッド + toString()
// ============================================================

describe('CSSColor', () => {
  // ── ファクトリ ──

  function makeSUT_hex6(): CSSColor {
    return CSSColor.hex('#FF0000');
  }

  function makeSUT_hex3(): CSSColor {
    return CSSColor.hex('#F00');
  }

  function makeSUT_rgb(): CSSColor {
    return CSSColor.rgb(255, 0, 0);
  }

  function makeSUT_rgba(): CSSColor {
    return CSSColor.rgba(255, 0, 0, 0.5);
  }

  function makeSUT_named(): CSSColor {
    return CSSColor.named(CSSColorName.red);
  }

  function makeSUT_raw(): CSSColor {
    return CSSColor.raw('hsl(0, 100%, 50%)');
  }

  // ── hex() ──

  describe('hex()', () => {
    it('6桁HEX値で CSSColor を生成し toString() で返す', () => {
      const sut = makeSUT_hex6();
      expect(sut.toString()).toBe('#FF0000');
    });

    it('3桁HEX値で CSSColor を生成し toString() で返す', () => {
      const sut = makeSUT_hex3();
      expect(sut.toString()).toBe('#F00');
    });

    it('小文字のHEX値も受け付ける', () => {
      const sut = CSSColor.hex('#ff0000');
      expect(sut.toString()).toBe('#ff0000');
    });

    it('8桁HEX値（アルファ付き）も受け付ける', () => {
      const sut = CSSColor.hex('#FF000080');
      expect(sut.toString()).toBe('#FF000080');
    });
  });

  // ── rgb() ──

  describe('rgb()', () => {
    it('RGB値で CSSColor を生成し toString() で返す', () => {
      const sut = makeSUT_rgb();
      expect(sut.toString()).toBe('rgb(255, 0, 0)');
    });

    it('境界値 0, 0, 0 を扱える', () => {
      const sut = CSSColor.rgb(0, 0, 0);
      expect(sut.toString()).toBe('rgb(0, 0, 0)');
    });

    it('境界値 255, 255, 255 を扱える', () => {
      const sut = CSSColor.rgb(255, 255, 255);
      expect(sut.toString()).toBe('rgb(255, 255, 255)');
    });
  });

  // ── rgba() ──

  describe('rgba()', () => {
    it('RGBA値で CSSColor を生成し toString() で返す', () => {
      const sut = makeSUT_rgba();
      expect(sut.toString()).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('アルファ 0 を扱える', () => {
      const sut = CSSColor.rgba(0, 0, 0, 0);
      expect(sut.toString()).toBe('rgba(0, 0, 0, 0)');
    });

    it('アルファ 1 を扱える', () => {
      const sut = CSSColor.rgba(255, 255, 255, 1);
      expect(sut.toString()).toBe('rgba(255, 255, 255, 1)');
    });
  });

  // ── named() ──

  describe('named()', () => {
    it('色名で CSSColor を生成し toString() で返す', () => {
      const sut = makeSUT_named();
      expect(sut.toString()).toBe('red');
    });

    it('transparent を扱える', () => {
      const sut = CSSColor.named(CSSColorName.transparent);
      expect(sut.toString()).toBe('transparent');
    });

    it('currentColor を扱える', () => {
      const sut = CSSColor.named(CSSColorName.currentColor);
      expect(sut.toString()).toBe('currentColor');
    });

    it('inherit を扱える', () => {
      const sut = CSSColor.named(CSSColorName.inherit);
      expect(sut.toString()).toBe('inherit');
    });
  });

  // ── raw() ──

  describe('raw()', () => {
    it('任意のCSS色文字列で CSSColor を生成し toString() で返す', () => {
      const sut = makeSUT_raw();
      expect(sut.toString()).toBe('hsl(0, 100%, 50%)');
    });

    it('var() 関数を扱える', () => {
      const sut = CSSColor.raw('var(--primary-color)');
      expect(sut.toString()).toBe('var(--primary-color)');
    });
  });

  // ── isHex() ──

  describe('isHex()', () => {
    it('hex() で生成した場合 true を返す', () => {
      const sut = makeSUT_hex6();
      expect(sut.isHex()).toBe(true);
    });

    it('3桁 hex() で生成した場合も true を返す', () => {
      const sut = makeSUT_hex3();
      expect(sut.isHex()).toBe(true);
    });

    it('rgb() で生成した場合 false を返す', () => {
      const sut = makeSUT_rgb();
      expect(sut.isHex()).toBe(false);
    });

    it('named() で生成した場合 false を返す', () => {
      const sut = makeSUT_named();
      expect(sut.isHex()).toBe(false);
    });

    it('raw() で HEX風文字列を渡した場合 true を返す', () => {
      const sut = CSSColor.raw('#ABC');
      expect(sut.isHex()).toBe(true);
    });
  });

  // ── isRgb() ──

  describe('isRgb()', () => {
    it('rgb() で生成した場合 true を返す', () => {
      const sut = makeSUT_rgb();
      expect(sut.isRgb()).toBe(true);
    });

    it('rgba() で生成した場合 false を返す', () => {
      const sut = makeSUT_rgba();
      expect(sut.isRgb()).toBe(false);
    });

    it('hex() で生成した場合 false を返す', () => {
      const sut = makeSUT_hex6();
      expect(sut.isRgb()).toBe(false);
    });
  });

  // ── isRgba() ──

  describe('isRgba()', () => {
    it('rgba() で生成した場合 true を返す', () => {
      const sut = makeSUT_rgba();
      expect(sut.isRgba()).toBe(true);
    });

    it('rgb() で生成した場合 false を返す', () => {
      const sut = makeSUT_rgb();
      expect(sut.isRgba()).toBe(false);
    });

    it('hex() で生成した場合 false を返す', () => {
      const sut = makeSUT_hex6();
      expect(sut.isRgba()).toBe(false);
    });
  });

  // ── isColorName() ──

  describe('isColorName()', () => {
    it('named() で生成した場合 true を返す', () => {
      const sut = makeSUT_named();
      expect(sut.isColorName()).toBe(true);
    });

    it('hex() で生成した場合 false を返す', () => {
      const sut = makeSUT_hex6();
      expect(sut.isColorName()).toBe(false);
    });

    it('rgb() で生成した場合 false を返す', () => {
      const sut = makeSUT_rgb();
      expect(sut.isColorName()).toBe(false);
    });

    it('raw() で色名風文字列を渡した場合も CSSColorName に含まれれば true を返す', () => {
      const sut = CSSColor.raw('blue');
      expect(sut.isColorName()).toBe(true);
    });

    it('raw() で色名に含まれない文字列を渡した場合 false を返す', () => {
      const sut = CSSColor.raw('hsl(0, 100%, 50%)');
      expect(sut.isColorName()).toBe(false);
    });
  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    it('toString() を複数回呼んでも同じ値を返す（イミュータブル）', () => {
      const sut = makeSUT_hex6();
      expect(sut.toString()).toBe('#FF0000');
      expect(sut.toString()).toBe('#FF0000');
    });

    it('異なるファクトリで同じ値を表現しても toString() が一致する', () => {
      const named = CSSColor.named(CSSColorName.red);
      const raw = CSSColor.raw('red');
      expect(named.toString()).toBe(raw.toString());
    });
  });
});
