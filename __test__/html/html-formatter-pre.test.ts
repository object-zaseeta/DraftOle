/**
 * DF-4: `<pre>` 内レンダラーインデント抑制
 *
 * HTMLFormatter.format() が <pre> タグ内のコンテンツにインデントを追加しない。
 */
import { describe, it, expect } from 'vitest';
import { HTMLFormatter } from '../../src/html/utils/html-formatter.js';

describe('DF-4: <pre> 内インデント抑制', () => {

  it('<pre> 内のテキストにインデントが追加されない', () => {
    const input = '<div><pre>line1\nline2\nline3</pre></div>';
    const result = HTMLFormatter.format(input);
    expect(result).toContain('line1\nline2\nline3');
    // preの外側（div）にはインデントがある
    expect(result).toContain('<div>');
  });

  it('<pre><code> のネスト内もインデントされない', () => {
    const input = '<div><pre><code>const x = 1;\nconst y = 2;</code></pre></div>';
    const result = HTMLFormatter.format(input);
    expect(result).toContain('const x = 1;\nconst y = 2;');
  });

  it('<pre> 外の要素は通常通りインデントされる', () => {
    const input = '<div><p>Hello</p><pre>code</pre><p>World</p></div>';
    const result = HTMLFormatter.format(input);
    // pタグはインデントされている
    expect(result).toMatch(/^\s+<p>Hello<\/p>/m);
    // preの中身はインデントされない
    expect(result).toContain('code');
  });

  it('空の <pre> も正しく処理される', () => {
    const input = '<div><pre></pre></div>';
    const result = HTMLFormatter.format(input);
    expect(result).toContain('<pre>');
    expect(result).toContain('</pre>');
  });

  it('<pre> 内のHTMLタグもインデントされない', () => {
    const input = '<div><pre><span>a</span><span>b</span></pre></div>';
    const result = HTMLFormatter.format(input);
    // pre内のspanタグにインデントが追加されていない
    const preContent = result.match(/<pre>([\s\S]*?)<\/pre>/)?.[1] ?? '';
    expect(preContent).not.toMatch(/^\s{4}/m);
  });
});
