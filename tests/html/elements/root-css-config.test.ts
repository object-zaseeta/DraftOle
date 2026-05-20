/**
 * Task 2.2: Root + cssConfig 統合テスト
 *
 * `new Root({ cssConfig: ... })` で構築した Root が `collectCssStyleString()` 経由で
 * minify-aware な class 名を出力することを検証する。
 *
 * Requirements: 2.1, 2.2, 2.3, 7.3
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Root } from '../../../src/html/elements/root.js';
import { CssConfig } from '../../../src/css/config/css-config.js';
import { div } from '../../../src/html/tags/factories.js';

describe('Root + cssConfig', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('cssConfig: minifyClassNames=true → collectCssStyleString が minify class 名のみ出力', () => {
    delete process.env.NODE_ENV;
    const root = new Root({
      css: [],
      cssConfig: new CssConfig({ minifyClassNames: true }),
    });
    const elem = div();
    elem.css.styleManager.style.font.setFontSize('16px');
    root.addChild(elem);

    const css = root.collectCssStyleString();
    // CSS rule の wrapper class は `_<8hex>` 形式
    const classMatches = css.match(/\._[a-z0-9_-]+\s*\{/g) ?? [];
    expect(classMatches.length).toBeGreaterThan(0);
    for (const m of classMatches) {
      expect(m).toMatch(/^\._[0-9a-f]{8}\s*\{$/);
    }
  });

  it('cssConfig 省略 → collectCssStyleString が既存 debuggable 形式（byte-equivalent）', () => {
    delete process.env.NODE_ENV;
    const rootA = new Root({ css: [] });
    const rootB = new Root({ css: [], cssConfig: new CssConfig() });

    const divA = div();
    divA.css.styleManager.style.font.setFontSize('16px');
    rootA.addChild(divA);

    const divB = div();
    divB.css.styleManager.style.font.setFontSize('16px');
    rootB.addChild(divB);

    expect(rootA.collectCssStyleString()).toBe(rootB.collectCssStyleString());
  });
});
