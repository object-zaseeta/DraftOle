import { describe, it, expect, vi } from 'vitest';
import { PairType } from '../../src/html/elements/pair-type.js';
import type { CssManagerInstance } from '../../src/html/protocols/css-manager-instance-type.js';
import type { JQueryManagerInstance } from '../../src/html/protocols/jquery-manager-instance-type.js';

describe('HtmlTag DI（依存性注入）', () => {
  it('オプション引数なしでデフォルトの CssManager/JQueryManager が使用される', () => {
    const tag = new PairType('div');
    expect(tag.css).toBeDefined();
    expect(tag.css.render()).toBe('');
    expect(tag.jqm).toBeDefined();
    expect(tag.jqm.render()).toBe('');
  });

  it('CssManagerInstance をオプション引数で注入できる', () => {
    const mockCss = {
      layout: {},
      styleManager: { style: {} },
      tagPath: 'mock',
      config: {},
      updateTagPath: vi.fn(),
      updateLazyLayoutRegister: vi.fn(),
      render: () => 'mock-css-render',
      renderCss: () => 'mock-css',
    } as unknown as CssManagerInstance;

    const tag = new PairType('div', { css: mockCss });
    expect(tag.css).toBe(mockCss);
    expect(tag.css.render()).toBe('mock-css-render');
  });

  it('JQueryManagerInstance をオプション引数で注入できる', () => {
    const mockJqm = {
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
      render: () => 'mock-js-render',
    } as unknown as JQueryManagerInstance;

    const tag = new PairType('div', { jqm: mockJqm });
    expect(tag.jqm).toBe(mockJqm);
    expect(tag.jqm.render()).toBe('mock-js-render');
  });
});
