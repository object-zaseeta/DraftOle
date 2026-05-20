import { describe, expect, it } from 'vitest';
import { doc } from '../../examples/page-landing.js';

function normalize(src: string): string {
  return src
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
    .join('\n');
}

describe('page-landing スナップショット', () => {
  const html = doc.render();

  it('HTML が生成される', () => {
    expect(html.length).toBeGreaterThan(0);
  });

  it('CSS が <head> に インライン されている', () => {
    expect(html).toContain('<style>');
    const headEnd = html.indexOf('</head>');
    const stylePos = html.indexOf('<style>');
    expect(stylePos).toBeGreaterThan(-1);
    expect(headEnd).toBeGreaterThan(-1);
    expect(stylePos).toBeLessThan(headEnd);
  });

  it('<main> および <section> が存在する', () => {
    expect(html).toContain('<main');
    expect(html).toContain('<section');
  });

  it('スナップショットと一致する', () => {
    expect(normalize(html)).toMatchSnapshot();
  });
});
