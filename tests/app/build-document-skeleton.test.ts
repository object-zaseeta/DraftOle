/**
 * buildDocumentSkeleton の単体テスト
 *
 * Requirements: 1.4, 3.4
 * Boundary: tests/app/build-document-skeleton.test.ts
 */

import { describe, it, expect } from 'vitest';
import { Root } from '../../src/html/elements/root';
import { buildDocumentSkeleton } from '../../src/app/build-document-skeleton';

describe('buildDocumentSkeleton', () => {
  it('(a) options 全省略 — charset UTF-8・空 title・body が空で生成される', () => {
    const root = new Root();
    const { bodyEl } = buildDocumentSkeleton(root, {});
    const html = root.render();

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('<title></title>');
    expect(html).toContain('<body></body>');
    expect(bodyEl).toBeDefined();
  });

  it('(b) 全フィールド指定 — lang / title / viewport / description が反映される', () => {
    const root = new Root();
    buildDocumentSkeleton(root, {
      lang: 'ja',
      title: 'My App',
      charset: 'UTF-8',
      viewport: 'width=device-width,initial-scale=1',
      description: 'Test description',
    });
    const html = root.render();

    expect(html).toContain('<html lang="ja">');
    expect(html).toContain('<title>My App</title>');
    expect(html).toContain('name="viewport"');
    expect(html).toContain('width=device-width,initial-scale=1');
    expect(html).toContain('name="description"');
    expect(html).toContain('Test description');
  });

  it('(c) 戻り値 bodyEl が空（子ノードなし）', () => {
    const root = new Root();
    const { bodyEl } = buildDocumentSkeleton(root, {});
    const html = root.render();
    // body は空なので <body></body>
    expect(html).toContain('<body></body>');
    expect(bodyEl).toBeDefined();
  });

  it('(d) setDoctype(true) 呼び出し済み — DOCTYPE 宣言がレンダリングされる', () => {
    const root = new Root();
    buildDocumentSkeleton(root, {});
    expect(root.render()).toMatch(/^<!DOCTYPE html>/);
  });

  it('lang 未指定の場合 <html> に lang 属性が付かない', () => {
    const root = new Root();
    buildDocumentSkeleton(root, { title: 'No lang' });
    const html = root.render();
    expect(html).not.toContain('lang=');
  });

  it('viewport 未指定の場合 viewport meta が出力されない', () => {
    const root = new Root();
    buildDocumentSkeleton(root, {});
    const html = root.render();
    expect(html).not.toContain('name="viewport"');
  });

  it('description 未指定の場合 description meta が出力されない', () => {
    const root = new Root();
    buildDocumentSkeleton(root, {});
    const html = root.render();
    expect(html).not.toContain('name="description"');
  });
});
