/**
 * Task 0.2: CssManagerInstance / DefaultCssManager のテスト
 *
 * TDD RED phase: DefaultCssManager の振る舞いを検証する。
 * - render() はデフォルトで空文字列を返す
 * - renderCss() はデフォルトで空文字列を返す
 * - tagPath はデフォルトで空文字列
 * - updateTagPath() で tagPath を更新できる
 */
import { describe, it, expect } from 'vitest';
import { DefaultCssManager } from '../../../src/css/manager/default-css-manager.js';
import type { CssManagerInstance } from '../../../src/css/manager/css-manager-instance-type.js';

describe('DefaultCssManager', () => {
  // ── ファクトリ ──

  function makeSUT(): DefaultCssManager {
    return new DefaultCssManager();
  }

  // ── render() ──

  describe('render()', () => {
    it('デフォルトで空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });

    it('返り値の型が string である', () => {
      const sut = makeSUT();
      expect(typeof sut.render()).toBe('string');
    });
  });

  // ── renderCss() ──

  describe('renderCss()', () => {
    it('デフォルトで空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.renderCss()).toBe('');
    });

    it('返り値の型が string である', () => {
      const sut = makeSUT();
      expect(typeof sut.renderCss()).toBe('string');
    });
  });

  // ── tagPath ──

  describe('tagPath', () => {
    it('デフォルトで空文字列である', () => {
      const sut = makeSUT();
      expect(sut.tagPath).toBe('');
    });
  });

  // ── updateTagPath() ──

  describe('updateTagPath()', () => {
    it('tagPath を更新できる', () => {
      const sut = makeSUT();
      sut.updateTagPath('div.container');
      expect(sut.tagPath).toBe('div.container');
    });

    it('複数回更新すると最後の値が保持される', () => {
      const sut = makeSUT();
      sut.updateTagPath('div.first');
      sut.updateTagPath('div.second');
      expect(sut.tagPath).toBe('div.second');
    });

    it('空文字列で更新できる', () => {
      const sut = makeSUT();
      sut.updateTagPath('div.container');
      sut.updateTagPath('');
      expect(sut.tagPath).toBe('');
    });
  });

  // ── layout プロパティ ──

  describe('layout', () => {
    it('layout プロパティが存在する', () => {
      const sut = makeSUT();
      expect(sut.layout).toBeDefined();
    });

    it('layout.description が空オブジェクトを返す', () => {
      const sut = makeSUT();
      expect(sut.layout.description).toEqual({});
    });

    it('layout.render() が空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.layout.render()).toBe('');
    });

    it('layout.getLLRegister() が undefined を返す', () => {
      const sut = makeSUT();
      expect(sut.layout.getLLRegister()).toBeUndefined();
    });

    it('layout.placeAbsoluteWith() が no-op である', () => {
      const sut = makeSUT();
      expect(() => sut.layout.placeAbsoluteWith(() => {})).not.toThrow();
    });

    it('layout.placeRelativeWith() が no-op である', () => {
      const sut = makeSUT();
      expect(() => sut.layout.placeRelativeWith(() => {})).not.toThrow();
    });

    it('layout.placeStaticWith() が no-op である', () => {
      const sut = makeSUT();
      expect(() => sut.layout.placeStaticWith(() => {})).not.toThrow();
    });

    it('layout.placeFixedWith() が no-op である', () => {
      const sut = makeSUT();
      expect(() => sut.layout.placeFixedWith(() => {})).not.toThrow();
    });

    it('layout.updateLLRegister() が no-op である', () => {
      const sut = makeSUT();
      expect(() => sut.layout.updateLLRegister(undefined)).not.toThrow();
    });
  });

  // ── styleManager プロパティ ──

  describe('styleManager', () => {
    it('styleManager プロパティが存在する', () => {
      const sut = makeSUT();
      expect(sut.styleManager).toBeDefined();
    });

    it('styleManager.style.render() が空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.styleManager.style.render()).toBe('');
    });

    it('styleManager.getFontSizeUnit() が undefined を返す', () => {
      const sut = makeSUT();
      expect(sut.styleManager.getFontSizeUnit()).toBeUndefined();
    });

    it('styleManager.render() が空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.styleManager.render()).toBe('');
    });
  });

  // ── updateLazyLayoutRegister() ──

  describe('updateLazyLayoutRegister()', () => {
    it('undefined を渡しても no-op である', () => {
      const sut = makeSUT();
      expect(() => sut.updateLazyLayoutRegister(undefined)).not.toThrow();
    });
  });

  // ── CssManagerInstance プロトコル準拠 ──

  describe('CssManagerInstance プロトコル準拠', () => {
    it('CssManagerInstance として使用できる', () => {
      const sut: CssManagerInstance = makeSUT();
      expect(typeof sut.render).toBe('function');
      expect(typeof sut.renderCss).toBe('function');
      expect(typeof sut.updateTagPath).toBe('function');
      expect(typeof sut.tagPath).toBe('string');
    });
  });
});
