/**
 * Task 4.7: factories-data の factory 群が末尾の `HtmlTagOptions` を
 * 受け取り、生成されるタグに `css` / `jqm` を注入できることを検証する。
 *
 * Requirements: 4.2, 4.4, 6.1, 6.3
 */
import { describe, it, expect, vi } from 'vitest';
import { table, tr, td } from '../../src/html/tags/factories-data.js';
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

describe('factories-data: options 末尾引数のサポート', () => {
  it('table({ css, jqm }) で css/jqm を注入できる', () => {
    const mockCss = createMockCss();
    const mockJqm = createMockJqm();
    const tag = table({ css: mockCss, jqm: mockJqm });
    expect(tag.css).toBe(mockCss);
    expect(tag.jqm).toBe(mockJqm);
  });

  it('tr({ class }, td("cell"), { css }) で attribute/child を保持しつつ options を注入できる', () => {
    const mockCss = createMockCss();
    const cell = td('cell');
    const row = tr({ class: 'row1' }, cell, { css: mockCss });
    expect(row.css).toBe(mockCss);
    const rendered = row.render();
    expect(rendered).toContain('row1');
    expect(rendered).toContain('cell');
  });

  it('options を省略した場合は従来通り動作する（後方互換）', () => {
    const row = tr({ class: 'r' }, td('x'));
    expect(row.css).toBeDefined();
    expect(row.jqm).toBeDefined();
    const rendered = row.render();
    expect(rendered).toContain('class="r');
    expect(rendered).toContain('x');
  });
});
