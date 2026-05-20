/**
 * Task 4.6: factories-semantic の factory 群が末尾の `HtmlTagOptions` を
 * 受け取り、生成されるタグに `css` / `jqm` を注入できることを検証する。
 *
 * Requirements: 4.2, 4.4, 6.1, 6.3
 */
import { describe, it, expect, vi } from 'vitest';
import { article, nav } from '../../src/html/tags/factories-semantic.js';
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

describe('factories-semantic: options 末尾引数のサポート', () => {
  it('article({ id }, "body", { css, jqm }) で options を注入できる', () => {
    const mockCss = createMockCss();
    const mockJqm = createMockJqm();
    const tag = article({ id: 'post-1' }, 'body', { css: mockCss, jqm: mockJqm });
    expect(tag.css).toBe(mockCss);
    expect(tag.jqm).toBe(mockJqm);
    const rendered = tag.render();
    expect(rendered).toContain('id="post-1"');
    expect(rendered).toContain('body');
  });

  it('nav("links", { css, jqm }) で options を注入できる', () => {
    const mockCss = createMockCss();
    const mockJqm = createMockJqm();
    const tag = nav('links', { css: mockCss, jqm: mockJqm });
    expect(tag.css).toBe(mockCss);
    expect(tag.jqm).toBe(mockJqm);
    expect(tag.render()).toContain('links');
  });

  it('options を省略した場合は従来通り動作する（後方互換）', () => {
    const a = article({ id: 'x' }, 'body');
    expect(a.css).toBeDefined();
    expect(a.jqm).toBeDefined();
    expect(a.render()).toContain('id="x"');

    const n = nav('links');
    expect(n.css).toBeDefined();
    expect(n.jqm).toBeDefined();
    expect(n.render()).toContain('links');
  });
});
