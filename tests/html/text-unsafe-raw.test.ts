/**
 * DX-2 + SEC-3: Text.unsafeRaw() 静的メソッド
 *
 * エスケープなしテキストを明示的に生成する。
 * 命名で危険性を伝える（SEC-3）。
 */
import { describe, it, expect } from 'vitest';
import { Text } from '../../src/html/tags/factories.js';
import { pre, code } from '../../src/html/tags/factories.js';

describe('DX-2: Text.unsafeRaw()', () => {

  it('Text.unsafeRaw() がエスケープなしで返す', () => {
    const el = Text.unsafeRaw('<b>bold</b>');
    expect(el.protoRender()).toBe('<b>bold</b>');
  });

  it('Text() はエスケープする（対比）', () => {
    const el = Text('<b>bold</b>');
    expect(el.protoRender()).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('HTMLタグを含むコード例に使える', () => {
    const el = pre(code(Text.unsafeRaw('<div class="card"><h2>Hello</h2></div>')));
    const html = el.protoRender();
    expect(html).toContain('<div class="card">');
  });

  it('マルチラインテキストが正しく保持される', () => {
    const el = Text.unsafeRaw('line1\nline2\nline3');
    expect(el.protoRender()).toBe('line1\nline2\nline3');
  });

  it('空文字列を受け付ける', () => {
    const el = Text.unsafeRaw('');
    expect(el.protoRender()).toBe('');
  });
});
