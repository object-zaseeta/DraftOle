/**
 * Task 4.2: factories-structure の factory 群が末尾の `HtmlTagOptions` を
 * 受け取り、生成されるタグに `css` / `jqm` を注入できることを検証する。
 *
 * Requirements: 4.2, 4.4, 6.1, 6.3
 */
import { describe, it, expect, vi } from 'vitest';
import { html, div, span } from '../../src/html/tags/factories-structure.js';
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
  } as unknown as CssManagerInstance;
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
  } as unknown as JQueryManagerInstance;
}

describe('factories-structure: options 末尾引数のサポート', () => {
  it('html({ css, jqm }) で css/jqm を注入できる', () => {
    const mockCss = createMockCss();
    const mockJqm = createMockJqm();
    const tag = html({ css: mockCss, jqm: mockJqm });
    expect(tag.css).toBe(mockCss);
    expect(tag.jqm).toBe(mockJqm);
  });

  it('div({ id }, span("child"), { css }) で attribute/child を保持しつつ options を注入できる', () => {
    const mockCss = createMockCss();
    const child = span('child');
    const tag = div({ id: 'x' }, child, { css: mockCss });
    expect(tag.css).toBe(mockCss);
    const rendered = tag.render();
    expect(rendered).toContain('id="x"');
    expect(rendered).toContain('child');
  });

  it('options を省略した場合は従来通り動作する（後方互換）', () => {
    const tag = div({ class: 'container' }, span('hi'));
    expect(tag.css).toBeDefined();
    expect(tag.jqm).toBeDefined();
    const rendered = tag.render();
    expect(rendered).toContain('class="container"');
    expect(rendered).toContain('hi');
  });
});
