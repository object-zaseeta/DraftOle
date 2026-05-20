/**
 * Task 4.4 (element-style-colocated): css 属性経由レンダーの統合テスト
 *
 * 公開 API（factory 関数 + Root）から `header({ css: createStyle({...}) })` 等の
 * 利用パターンを通し、HTML 出力と `collectCssStyleString` 出力の整合性を検証する。
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7
 *
 * Boundary: tests/html/css-attribute
 */
import { describe, it, expect } from 'vitest';
import { header, div } from '../../../src/html/tags/factories.js';
import { Root } from '../../../src/html/elements/root.js';
import { createStyle } from '../../../src/css/variables/css-shared-style.js';

/**
 * HTML 文字列から `class="..."` 内に含まれるスコープクラス（`_xxxxxxxx` 形式）を
 * 出現順に抽出する。
 */
function extractScopedClasses(html: string): string[] {
  const matches = html.match(/_[0-9a-f]{8}_[0-9a-f]{8}/g) ?? [];
  return matches;
}

/**
 * 1 要素分の class 属性値（スペース区切り）を取得する。
 */
function getClassAttr(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*class="([^"]+)"`);
  const m = html.match(re);
  return m ? m[1]! : '';
}

describe('css 属性経由レンダー統合 (Task 4.4)', () => {
  it('header({ css: createStyle({...}) }) 出力 HTML に scoped class が付与され、対応 CSS rule が含まれる', () => {
    const root = new Root();
    root.addChild(header({ css: createStyle({ display: 'flex' }) }));

    const html = root.render();
    const css = root.collectCssStyleString();

    const classes = extractScopedClasses(html);
    expect(classes.length).toBeGreaterThanOrEqual(1);

    const cls = classes[0]!;
    expect(css).toContain(`.${cls}`);
    expect(css).toContain('display: flex;');
  });

  it('{ css: [a, b] } 配列指定で 2 つの class が空白区切りでマージされ、両ルールが CSS 出力に含まれる', () => {
    const a = createStyle({ display: 'flex' });
    const b = createStyle({ color: 'red' });

    const root = new Root();
    root.addChild(header({ css: [a, b] }));

    const html = root.render();
    const css = root.collectCssStyleString();

    const classAttr = getClassAttr(html, 'header');
    const tokens = classAttr.split(/\s+/).filter(t => /^_[0-9a-f]{8}_[0-9a-f]{8}$/.test(t));

    expect(tokens.length).toBe(2);
    expect(tokens[0]).not.toBe(tokens[1]);

    expect(css).toContain(`.${tokens[0]}`);
    expect(css).toContain(`.${tokens[1]}`);
    expect(css).toContain('display: flex;');
    expect(css).toContain('color: red;');
  });

  it('{ css: btn, class: "primary" } 共存パターンで両方の class がマージされる', () => {
    const btn = createStyle({ display: 'flex' });

    const root = new Root();
    root.addChild(header({ css: btn, class: 'primary' }));

    const html = root.render();
    const css = root.collectCssStyleString();

    const classAttr = getClassAttr(html, 'header');
    const tokens = classAttr.split(/\s+/).filter(t => t.length > 0);

    expect(tokens).toContain('primary');
    const scoped = tokens.filter(t => /^_[0-9a-f]{8}_[0-9a-f]{8}$/.test(t));
    expect(scoped.length).toBe(1);

    expect(css).toContain(`.${scoped[0]}`);
    expect(css).toContain('display: flex;');
  });

  it('同一 styleObject を 2 箇所に適用したとき、tagPath 由来で別の class 名が生成され、CSS rule が 2 ルール出力される (Req 1.3)', () => {
    const shared = createStyle({ display: 'flex' });

    const root = new Root();
    root.addChild(
      div(
        header({ css: shared }),
      ),
    );
    root.addChild(
      div(
        header({ css: shared }),
      ),
    );

    const html = root.render();
    const css = root.collectCssStyleString();

    const headerClasses: string[] = [];
    const re = /<header[^>]*class="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const tokens = m[1]!.split(/\s+/).filter(t => /^_[0-9a-f]{8}_[0-9a-f]{8}$/.test(t));
      headerClasses.push(...tokens);
    }

    expect(headerClasses.length).toBe(2);
    expect(headerClasses[0]).not.toBe(headerClasses[1]);

    expect(css).toContain(`.${headerClasses[0]}`);
    expect(css).toContain(`.${headerClasses[1]}`);

    const occurrences = (css.match(/display: flex;/g) ?? []).length;
    expect(occurrences).toBe(2);
  });
});
