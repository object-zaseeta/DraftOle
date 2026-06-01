import { describe, it, expect, vi } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import type { CssManagerInstance } from '../../src/html/protocols/css-manager-instance-type.js';
import type { JQueryManagerInstance } from '../../src/html/protocols/jquery-manager-instance-type.js';

describe('Root DI（依存性注入）', () => {
  it('引数なしで従来通りインスタンス化できる（後方互換）', () => {
    const root = new Root();
    expect(root.css).toBeDefined();
    expect(root.jqm).toBeDefined();
  });

  it('HtmlTagOptions で css/jqm を注入できる', () => {
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

    const root = new Root({ css: mockCss, jqm: mockJqm });
    expect(root.css).toBe(mockCss);
    expect(root.jqm).toBe(mockJqm);
  });
});
