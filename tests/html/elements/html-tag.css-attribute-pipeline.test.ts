/**
 * Task 3.4 (element-style-colocated): protoRender 内 css 属性パイプラインのテスト。
 *
 * - `_pendingStyleTemplates` が tagPath 確定後に CssManager.registerTemplate に流し込まれる
 * - 解決済み className が class 属性にマージされる
 * - 既存スコープクラス自動付与の挙動（resolver 経由）がバイト単位で旧形式と一致する
 *
 * Requirements: 1.1, 1.2, 1.5, 1.7
 */
import { describe, it, expect } from 'vitest';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.js';
import type { TagType } from '../../../src/html/tags/tag-type.js';
import { createStyleTemplate } from '../../../src/css/variables/style-template.js';
import { generateScopedClassName } from '../../../src/css/utils/scoped-css-generator.js';
import { resolveClassName } from '../../../src/css/utils/identifier-resolver.js';

class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'header') {
    super(tagType);
  }
}

describe('HtmlTag.protoRender: css 属性パイプライン (Task 3.4)', () => {
  it('css 属性経由の StyleTemplate が render 時にスコープクラス＋ CSS rule に展開される', () => {
    const tag = new TestTag('header');
    tag.css.updateTagPath('html>body>header[0]');
    const tpl = createStyleTemplate({ properties: { display: 'flex' } });
    tag.addStyleTemplates([tpl]);

    const html = tag.protoRender();
    const expectedClass = resolveClassName('html>body>header[0]', tpl.bodyHash);

    expect(html).toBe(`<header class="${expectedClass}"></header>`);

    const css = tag.css.renderCss();
    expect(css).toContain(`.${expectedClass}`);
    expect(css).toContain('display: flex;');
  });

  it('css 属性のクラスと既存 class 属性が共存してマージされる', () => {
    const tag = new TestTag('div');
    tag.css.updateTagPath('html>body>div[0]');
    tag.addHtmlAttribute(HtmlAttribute.className('primary'));
    const tpl = createStyleTemplate({ properties: { color: 'red' } });
    tag.addStyleTemplates([tpl]);

    const html = tag.protoRender();
    const tplClass = resolveClassName('html>body>div[0]', tpl.bodyHash);
    expect(html).toContain('class="primary ');
    expect(html).toContain(tplClass);
    expect(html.startsWith('<div class="primary')).toBe(true);
  });

  it('複数 StyleTemplate が登録順に CSS rule として出力される', () => {
    const tag = new TestTag('section');
    tag.css.updateTagPath('html>body>section[0]');
    const a = createStyleTemplate({ properties: { color: 'red' } });
    const b = createStyleTemplate({ properties: { padding: '8px' } });
    tag.addStyleTemplates([a, b]);

    const html = tag.protoRender();
    const ca = resolveClassName('html>body>section[0]', a.bodyHash);
    const cb = resolveClassName('html>body>section[0]', b.bodyHash);
    expect(html).toContain(ca);
    expect(html).toContain(cb);

    const css = tag.css.renderCss();
    expect(css.indexOf(`.${ca}`)).toBeLessThan(css.indexOf(`.${cb}`));
  });

  it('既存スコープクラス自動付与が旧 generateScopedClassName と同一バイトを保つ', () => {
    const tag = new TestTag('div');
    tag.css.updateTagPath('html>body>div[0]');
    tag.style.font.setFontSize('16px');

    const html = tag.protoRender();
    const expected = generateScopedClassName('html>body>div[0]');
    expect(html).toBe(`<div class="${expected}"></div>`);
  });

  it('css 属性が空かつ CSS 未設定なら class 属性は付与されない', () => {
    const tag = new TestTag('span');
    tag.css.updateTagPath('html>body>span[0]');

    const html = tag.protoRender();
    expect(html).toBe('<span></span>');
  });

  it('tagPath 未設定（空文字列）かつ pending templates だけある場合は registerTemplate を呼ばない', () => {
    const tag = new TestTag('div');
    // tagPath は空のまま
    const tpl = createStyleTemplate({ properties: { color: 'red' } });
    tag.addStyleTemplates([tpl]);

    const html = tag.protoRender();
    // 自動 class 付与なし
    expect(html).toBe('<div></div>');
    // CSS rule も登録されない
    expect(tag.css.renderCss()).toBe('');
  });
});
