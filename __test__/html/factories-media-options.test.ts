/**
 * Task 4.5: factories-media の factory 群が末尾の `HtmlTagOptions` を
 * 受け取り、生成されるタグに `css` / `jqm` を注入できることを検証する。
 *
 * Requirements: 4.2, 4.4, 6.1, 6.3
 */
import { describe, it, expect, vi } from 'vitest';
import { video, img } from '../../src/html/tags/factories-media.js';
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

describe('factories-media: options 末尾引数のサポート', () => {
  it('video({ controls: true }, "fallback", { css, jqm }) で options を注入できる', () => {
    const mockCss = createMockCss();
    const mockJqm = createMockJqm();
    const tag = video({ controls: true }, 'fallback', { css: mockCss, jqm: mockJqm });
    expect(tag.css).toBe(mockCss);
    expect(tag.jqm).toBe(mockJqm);
    const rendered = tag.render();
    expect(rendered).toContain('controls');
    expect(rendered).toContain('fallback');
  });

  it('img({ src }, { css, jqm }) で自己終了タグにも options を注入できる', () => {
    const mockCss = createMockCss();
    const mockJqm = createMockJqm();
    const tag = img({ src: 'photo.jpg', alt: 'p' }, { css: mockCss, jqm: mockJqm });
    expect(tag.css).toBe(mockCss);
    expect(tag.jqm).toBe(mockJqm);
    expect(tag.render()).toContain('src="photo.jpg"');
  });

  it('options を省略した場合は従来通り動作する（後方互換）', () => {
    const v = video({ controls: true }, 'fallback');
    expect(v.css).toBeDefined();
    expect(v.jqm).toBeDefined();

    const i = img({ src: 'photo.jpg' });
    expect(i.css).toBeDefined();
    expect(i.jqm).toBeDefined();
    expect(i.render()).toContain('src="photo.jpg"');

    const i2 = img();
    expect(i2.css).toBeDefined();
  });
});
