/**
 * Composition Root unit tests.
 *
 * Covers Requirements: 3.1, 3.2, 3.4, 4.3 and the contracts defined in
 * design.md §Infrastructure/composition-root.ts.
 */
import { describe, expect, it } from 'vitest';
import {
  createDefaultCssManager,
  createDefaultJQueryManager,
  isHtmlTagOptions,
  resolveHtmlTagDependencies,
  type ResolvedHtmlTagDependencies,
} from '../src/composition-root.js';
import type { HtmlTagOptions } from '../src/html/elements/html-tag.js';
import type { CssManagerInstance } from '../src/html/protocols/css-manager-instance-type.js';
import type { JQueryManagerInstance } from '../src/html/protocols/jquery-manager-instance-type.js';

// Minimal fake implementations used for injection tests.
// They satisfy the protocol shape just enough for identity / reference checks.
function makeFakeCss(): CssManagerInstance {
  return {
    layout: {} as CssManagerInstance['layout'],
    styleManager: {} as CssManagerInstance['styleManager'],
    tagPath: 'fake',
    updateTagPath(): void {},
    updateLazyLayoutRegister(): void {},
    renderCss(): string {
      return '';
    },
    render(): string {
      return '';
    },
  };
}

function makeFakeJqm(): JQueryManagerInstance {
  return {
    path: 'fake',
    usedMethods: new Set(),
    css: () => '',
    height: () => '',
    on: () => '',
    click: () => '',
    keydown: () => '',
    keyup: () => '',
    text: () => '',
    html: () => '',
    addClass: () => '',
    removeClass: () => '',
    toggleClass: () => '',
    needsHelper: () => false,
    updatePath(): void {},
    render(): string {
      return '';
    },
  };
}

describe('composition-root', () => {
  describe('createDefaultCssManager', () => {
    it('returns a non-null CssManagerInstance', () => {
      const css = createDefaultCssManager();
      expect(css).not.toBeNull();
      expect(typeof css.renderCss).toBe('function');
    });

    it('returns a fresh instance on each call (Req 3.4)', () => {
      const a = createDefaultCssManager();
      const b = createDefaultCssManager();
      expect(a).not.toBe(b);
    });
  });

  describe('createDefaultJQueryManager', () => {
    it('returns a non-null JQueryManagerInstance', () => {
      const jqm = createDefaultJQueryManager();
      expect(jqm).not.toBeNull();
      expect(typeof jqm.render).toBe('function');
    });

    it('returns a fresh instance on each call (Req 3.4)', () => {
      const a = createDefaultJQueryManager();
      const b = createDefaultJQueryManager();
      expect(a).not.toBe(b);
    });
  });

  describe('resolveHtmlTagDependencies', () => {
    it('returns non-null css and jqm when options is undefined (Req 4.3)', () => {
      const deps: ResolvedHtmlTagDependencies = resolveHtmlTagDependencies();
      expect(deps.css).toBeDefined();
      expect(deps.jqm).toBeDefined();
    });

    it('uses injected css when provided and defaults jqm', () => {
      const css = makeFakeCss();
      const deps = resolveHtmlTagDependencies({ css });
      expect(deps.css).toBe(css);
      expect(deps.jqm).toBeDefined();
    });

    it('uses injected jqm when provided and defaults css', () => {
      const jqm = makeFakeJqm();
      const deps = resolveHtmlTagDependencies({ jqm });
      expect(deps.jqm).toBe(jqm);
      expect(deps.css).toBeDefined();
    });

    it('uses both injected instances when fully specified', () => {
      const css = makeFakeCss();
      const jqm = makeFakeJqm();
      const deps = resolveHtmlTagDependencies({ css, jqm });
      expect(deps.css).toBe(css);
      expect(deps.jqm).toBe(jqm);
    });

    it('returns independent defaults across calls (Req 3.4)', () => {
      const a = resolveHtmlTagDependencies();
      const b = resolveHtmlTagDependencies();
      expect(a.css).not.toBe(b.css);
      expect(a.jqm).not.toBe(b.jqm);
    });
  });

  describe('isHtmlTagOptions', () => {
    it('returns true for objects with css key', () => {
      const value: HtmlTagOptions = { css: makeFakeCss() };
      expect(isHtmlTagOptions(value)).toBe(true);
    });

    it('returns true for objects with jqm key', () => {
      const value: HtmlTagOptions = { jqm: makeFakeJqm() };
      expect(isHtmlTagOptions(value)).toBe(true);
    });

    it('returns true for objects with both css and jqm keys', () => {
      const value: HtmlTagOptions = {
        css: makeFakeCss(),
        jqm: makeFakeJqm(),
      };
      expect(isHtmlTagOptions(value)).toBe(true);
    });

    it('returns false for empty object (cannot be distinguished from attribute map)', () => {
      expect(isHtmlTagOptions({})).toBe(false);
    });

    it('returns false for null', () => {
      expect(isHtmlTagOptions(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isHtmlTagOptions(undefined)).toBe(false);
    });

    it('returns false for non-object primitives', () => {
      expect(isHtmlTagOptions('string')).toBe(false);
      expect(isHtmlTagOptions(42)).toBe(false);
      expect(isHtmlTagOptions(true)).toBe(false);
    });

    it('returns false for objects without css or jqm keys', () => {
      expect(isHtmlTagOptions({ class: 'foo' })).toBe(false);
      expect(isHtmlTagOptions({ id: 'bar', style: 'baz' })).toBe(false);
    });
  });
});
