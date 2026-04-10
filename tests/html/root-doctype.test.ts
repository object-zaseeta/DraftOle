/**
 * DF-6: <!DOCTYPE html> 出力オプション
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import { html, head, title, body, p } from '../../src/html/tags/factories.js';

describe('DF-6: DOCTYPE出力', () => {

  it('デフォルトではDOCTYPEなし（後方互換）', () => {
    const root = new Root();
    root.addChild(html(head(title('Test')), body(p('Hello'))));
    const result = root.render();
    expect(result).not.toContain('<!DOCTYPE html>');
    expect(result).toMatch(/^<html/);
  });

  it('setDoctype() でDOCTYPEが出力される', () => {
    const root = new Root();
    root.setDoctype();
    root.addChild(html(head(title('Test')), body(p('Hello'))));
    const result = root.render();
    expect(result).toMatch(/^<!DOCTYPE html>\n<html/);
  });

  it('setDoctype(true) でDOCTYPEが出力される', () => {
    const root = new Root();
    root.setDoctype(true);
    root.addChild(html(head(title('Test')), body(p('Hello'))));
    const result = root.render();
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('setDoctype(false) でDOCTYPEを無効化できる', () => {
    const root = new Root();
    root.setDoctype(true);
    root.setDoctype(false);
    root.addChild(html(head(title('Test')), body(p('Hello'))));
    const result = root.render();
    expect(result).not.toContain('<!DOCTYPE html>');
  });

  it('メソッドチェーンが可能', () => {
    const root = new Root();
    const result = root.setDoctype();
    expect(result).toBe(root);
  });

  it('DOCTYPEは1行目に出力される', () => {
    const root = new Root();
    root.setDoctype();
    root.addChild(html(body(p('Hello'))));
    const lines = root.render().split('\n');
    expect(lines[0]).toBe('<!DOCTYPE html>');
  });
});
