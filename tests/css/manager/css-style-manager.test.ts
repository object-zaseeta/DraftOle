/**
 * Task 6.2: CssStyleManager -- HtmlStyleラッパーのテスト
 *
 * TDD RED phase: CssStyleManager の全機能を検証する。
 * - HtmlStyleインスタンスを保持し、Renderableを委譲する
 * - フォントサイズ取得メソッドを提供する（コンテキスト伝播用）
 * - CssStyleManagerTypeインターフェースに準拠する
 *
 * Requirements: 1.2
 */
import { describe, it, expect } from 'vitest';
import { CssStyleManager } from '../../../src/css/manager/css-style-manager.js';
import { HtmlStyle } from '../../../src/css/style/html-style.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CssStyleManager {
  return new CssStyleManager();
}

// ============================================================
// CssStyleManager
// ============================================================

describe('CssStyleManager', () => {
  // ── CssStyleManagerType 準拠 ──

  describe('CssStyleManagerType準拠', () => {
    it('render() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });

    it('style プロパティが HtmlStyle インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.style).toBeInstanceOf(HtmlStyle);
    });

    it('getFontSizeUnit() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.getFontSizeUnit).toBe('function');
    });
  });

  // ── render() 委譲検証 ──

  describe('render()委譲', () => {
    it('HtmlStyle.render() の結果を返す', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('16px');
      expect(sut.render()).toBe('font-size: 16px;');
    });

    it('プロパティ未設定の場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });

    it('複数プロパティクラス設定時も正しく委譲する', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('16px');
      sut.style.spacing.setMargin('10px');
      expect(sut.render()).toBe('font-size: 16px;\nmargin: 10px;');
    });

    it('HtmlStyle の全13クラス経由の出力を正しく委譲する', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('14px');
      sut.style.backgroundColor.setBackgroundColor('white');
      sut.style.position.setDisplay('flex');

      const rendered = sut.render();
      expect(rendered).toContain('font-size: 14px;');
      expect(rendered).toContain('background-color: white;');
      expect(rendered).toContain('display: flex;');
    });
  });

  // ── getFontSizeUnit() 検証 ──

  describe('getFontSizeUnit()', () => {
    it('フォントサイズ未設定の場合、undefined を返す', () => {
      const sut = makeSUT();
      expect(sut.getFontSizeUnit()).toBeUndefined();
    });

    it('px 単位のフォントサイズを HlUnit で返す', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('16px');
      expect(sut.getFontSizeUnit()).toEqual({ value: 16, unit: 'px' });
    });

    it('em 単位のフォントサイズを HlUnit で返す', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('1.5em');
      expect(sut.getFontSizeUnit()).toEqual({ value: 1.5, unit: 'em' });
    });

    it('rem 単位のフォントサイズを HlUnit で返す', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('2rem');
      expect(sut.getFontSizeUnit()).toEqual({ value: 2, unit: 'rem' });
    });

    it('% 単位のフォントサイズを HlUnit で返す', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('100%');
      expect(sut.getFontSizeUnit()).toEqual({ value: 100, unit: '%' });
    });

    it('vh 単位のフォントサイズを HlUnit で返す', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('5vh');
      expect(sut.getFontSizeUnit()).toEqual({ value: 5, unit: 'vh' });
    });

    it('vw 単位のフォントサイズを HlUnit で返す', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('10vw');
      expect(sut.getFontSizeUnit()).toEqual({ value: 10, unit: 'vw' });
    });

    it('単位なし数値の場合、unit: "none" で返す', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('0');
      expect(sut.getFontSizeUnit()).toEqual({ value: 0, unit: 'none' });
    });

    it('パース不可能な値の場合、undefined を返す', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('inherit');
      expect(sut.getFontSizeUnit()).toBeUndefined();
    });

    it('小数値を正しくパースする', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('0.875rem');
      expect(sut.getFontSizeUnit()).toEqual({ value: 0.875, unit: 'rem' });
    });

    it('負の値を正しくパースする', () => {
      const sut = makeSUT();
      sut.style.font.setFontSize('-2px');
      expect(sut.getFontSizeUnit()).toEqual({ value: -2, unit: 'px' });
    });
  });

  // ── インスタンス独立性 ──

  describe('インスタンス独立性', () => {
    it('異なるインスタンスの style は独立している', () => {
      const sut1 = makeSUT();
      const sut2 = makeSUT();

      sut1.style.font.setFontSize('16px');

      expect(sut1.render()).toBe('font-size: 16px;');
      expect(sut2.render()).toBe('');
    });

    it('同一インスタンスの style は常に同じオブジェクトを返す', () => {
      const sut = makeSUT();
      expect(sut.style).toBe(sut.style);
    });
  });
});
