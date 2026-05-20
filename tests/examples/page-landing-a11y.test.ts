import { describe, expect, it } from 'vitest';
import { doc } from '../../examples/page-landing.js';

describe('page-landing a11y / セマンティクス構造', () => {
  const html = doc.render();

  it('<html lang="ja"> が存在する', () => {
    expect(html).toContain('lang="ja"');
  });

  it('<main> および <title> が存在する', () => {
    expect(html).toContain('<main');
    expect(html).toContain('<title>');
  });

  it('<section> が 4 つ以上存在する', () => {
    const matches = html.match(/<section/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(4);
  });

  it('<style> タグ内に CSS ルールが存在する (P0 再発防止)', () => {
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    expect(styleMatch).not.toBeNull();
    const styleContent = styleMatch![1];
    expect(styleContent.length).toBeGreaterThan(0);
    expect(styleContent).toContain('{');
  });

  it('<head> 内 <style> 内容の長さが 0 より大きい (旧バグ再発なし)', () => {
    const headEnd = html.indexOf('</head>');
    const headSection = html.slice(0, headEnd);
    const styleMatch = headSection.match(/<style>([\s\S]*?)<\/style>/);
    expect(styleMatch).not.toBeNull();
    expect(styleMatch![1].trim().length).toBeGreaterThan(0);
  });
});
