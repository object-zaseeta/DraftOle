/**
 * Task 1.1: CSSPropertyGroup -- 抽象基底クラスのテスト
 *
 * TDD RED phase: CSSPropertyGroup の setProp / getProp / render() を検証する。
 *
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSPropertyGroup } from '../../../src/css/style/css-property-group.js';
import { DuplicateCssPropertyError } from '../../../src/utils/errors.js';

// ============================================================
// テスト用具体サブクラス（抽象クラスのテストのために必要）
// ============================================================

class TestCSSGroup extends CSSPropertyGroup {
  setTestProp(key: string, value: string): this {
    return this.setProp(key, value);
  }

  getTestProp(key: string): string | undefined {
    return this.getProp(key);
  }
}

function makeSUT(): TestCSSGroup {
  return new TestCSSGroup();
}

// ============================================================
// CSSPropertyGroup
// ============================================================

describe('CSSPropertyGroup', () => {
  // ── render() 空出力テスト ──

  describe('render() — 空状態', () => {
    it('プロパティ未設定の場合、空文字列を返す (要件 3.2)', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });
  });

  // ── Renderable準拠 ──

  describe('Renderable準拠', () => {
    it('render() メソッドを持つ (要件 3.1)', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });
  });

  // ── setProp / render() 出力テスト ──

  describe('setProp / render() — 設定済みプロパティ', () => {
    it('setProp で設定した値が render() 出力に含まれる (要件 2.3, 3.3)', () => {
      const sut = makeSUT();
      sut.setTestProp('font-size', '16px');
      expect(sut.render()).toContain('font-size: 16px');
    });

    it('複数プロパティをアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setTestProp('font-weight', 'bold');
      sut.setTestProp('color', 'red');
      const result = sut.render();
      expect(result.indexOf('color')).toBeLessThan(result.indexOf('font-weight'));
    });

    it('render() の形式が key: value; 形式である', () => {
      const sut = makeSUT();
      sut.setTestProp('font-size', '16px');
      expect(sut.render()).toBe('font-size: 16px;');
    });
  });

  // ── getProp テスト ──

  describe('getProp — プロパティ取得', () => {
    it('setProp で設定した値を getProp で取得できる', () => {
      const sut = makeSUT();
      sut.setTestProp('color', 'blue');
      expect(sut.getTestProp('color')).toBe('blue');
    });

    it('未設定のキーは undefined を返す', () => {
      const sut = makeSUT();
      expect(sut.getTestProp('color')).toBeUndefined();
    });
  });

  // ── setProp メソッドチェーン ──

  describe('setProp — メソッドチェーン', () => {
    it('setProp は this を返す (要件 1.1)', () => {
      const sut = makeSUT();
      const result = sut.setTestProp('color', 'red');
      expect(result).toBe(sut);
    });
  });

  // ── 重複検知テスト (DEVモード) ──

  describe('setProp — 重複検知 (DEV モード)', () => {
    beforeEach(() => {
      process.env.DRAFT_OLE_DEV = 'true';
    });

    afterEach(() => {
      delete process.env.DRAFT_OLE_DEV;
    });

    it('同一キーへの2回目の setProp は DuplicateCssPropertyError をスローする (要件 1.2, 1.4)', () => {
      const sut = makeSUT();
      sut.setTestProp('font-size', '16px');
      expect(() => sut.setTestProp('font-size', '18px')).toThrow(DuplicateCssPropertyError);
    });

    it('異なるキーへの setProp は例外をスローしない', () => {
      const sut = makeSUT();
      sut.setTestProp('font-size', '16px');
      expect(() => sut.setTestProp('color', 'red')).not.toThrow();
    });
  });

  // ── サニタイズ (SEC-2) ──

  describe('render() — サニタイズ (要件 3.4)', () => {
    it('url(javascript:) を含む値はサニタイズされ出力から除外される', () => {
      const sut = makeSUT();
      sut.setTestProp('background', 'url(javascript:alert(1))');
      expect(sut.render()).toBe('');
    });
  });

  // ── 未設定プロパティは出力されない ──

  describe('render() — 未設定プロパティの除外 (要件 2.2)', () => {
    it('設定されたプロパティのみ出力する', () => {
      const sut = makeSUT();
      sut.setTestProp('font-size', '16px');
      const result = sut.render();
      expect(result).not.toContain('color');
      expect(result).toContain('font-size');
    });
  });
});
