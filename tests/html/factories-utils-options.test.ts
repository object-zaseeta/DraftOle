/**
 * Task 4.1: factories-utils ヘルパへの options 引数追加
 *
 * `makePairTag` / `makeSelfClosingTag` が末尾の `HtmlTagOptions` 引数を
 * 受け取り、生成される PairType / SelfClosingType に `css` / `jqm` を
 * 注入できることを検証する。
 *
 * Requirements: 4.2, 4.3, 6.1
 */
import { describe, it, expect, vi } from 'vitest';
import {
  makePairTag,
  makeSelfClosingTag,
} from '../../src/html/tags/factories-utils.js';
import type { CssManagerInstance } from '../../src/html/protocols/css-manager-instance-type.js';
import type { JQueryManagerInstance } from '../../src/html/protocols/jquery-manager-instance-type.js';

function createMockCss(): CssManagerInstance {
  return {
    layout: {},
    styleManager: { style: {} },
    tagPath: 'mock',
    config: {},
    updateTagPath: vi.fn(),
    updateLazyLayoutRegister: vi.fn(),
    render: () => 'mock-css-render',
    renderCss: () => 'mock-css',
  } as CssManagerInstance;
}

function createMockJqm(): JQueryManagerInstance {
  return {
    path: 'mock',
    usedMethods: new Set(),
    css: vi.fn(() => ''),
    height: vi.fn(() => ''),
    on: vi.fn(() => ''),
    click: vi.fn(() => ''),
    keydown: vi.fn(() => ''),
    keyup: vi.fn(() => ''),
    text: vi.fn(() => ''),
    html: vi.fn(() => ''),
    addClass: vi.fn(() => ''),
    removeClass: vi.fn(() => ''),
    toggleClass: vi.fn(() => ''),
    needsHelper: () => false,
    updatePath: vi.fn(),
    render: () => 'mock-jqm-render',
  } as JQueryManagerInstance;
}

describe('factories-utils: options 引数のサポート', () => {
  describe('makePairTag', () => {
    it('options なしでも従来通り動作する', () => {
      const tag = makePairTag('div', [{ id: 'x' }, 'hello']);
      expect(tag.css).toBeDefined();
      expect(tag.jqm).toBeDefined();
      expect(tag.render()).toContain('id="x"');
      expect(tag.render()).toContain('hello');
    });

    it('options で css / jqm を注入できる', () => {
      const mockCss = createMockCss();
      const mockJqm = createMockJqm();
      const tag = makePairTag('div', [{ id: 'x' }], { css: mockCss, jqm: mockJqm });
      expect(tag.css).toBe(mockCss);
      expect(tag.jqm).toBe(mockJqm);
    });

    it('attribute map がない場合でも options を受け付ける', () => {
      const mockCss = createMockCss();
      const tag = makePairTag('div', ['child text'], { css: mockCss });
      expect(tag.css).toBe(mockCss);
      expect(tag.render()).toContain('child text');
    });

    it('args が空でも options を受け付ける', () => {
      const mockCss = createMockCss();
      const tag = makePairTag('div', [], { css: mockCss });
      expect(tag.css).toBe(mockCss);
    });
  });

  describe('makeSelfClosingTag', () => {
    it('options なしでも従来通り動作する', () => {
      const tag = makeSelfClosingTag('br', []);
      expect(tag.css).toBeDefined();
      expect(tag.jqm).toBeDefined();
    });

    it('options で css / jqm を注入できる', () => {
      const mockCss = createMockCss();
      const mockJqm = createMockJqm();
      const tag = makeSelfClosingTag(
        'img',
        [{ src: 'photo.jpg' }],
        { css: mockCss, jqm: mockJqm },
      );
      expect(tag.css).toBe(mockCss);
      expect(tag.jqm).toBe(mockJqm);
      expect(tag.render()).toContain('src="photo.jpg"');
    });

    it('args が空でも options を受け付ける', () => {
      const mockJqm = createMockJqm();
      const tag = makeSelfClosingTag('br', [], { jqm: mockJqm });
      expect(tag.jqm).toBe(mockJqm);
    });
  });
});
