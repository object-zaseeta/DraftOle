/**
 * Task 2.2: class名の重複除去・正規化と属性値のHTMLエスケープ
 *
 * Requirements: 2.5, 10.3, 10.4
 */
import { describe, it, expect } from 'vitest';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import { normalizeClassNames, escapeHtml } from '../../src/html/attributes/html-attribute.js';

// ============================================================
// normalizeClassNames (Req 2.5, 10.3)
// ============================================================
describe('normalizeClassNames', () => {
  it('should return single class name as-is', () => {
    expect(normalizeClassNames(['container'])).toBe('container');
  });

  it('should join multiple class names with space', () => {
    expect(normalizeClassNames(['container', 'flex'])).toBe('container flex');
  });

  it('should trim whitespace from class names', () => {
    expect(normalizeClassNames(['  container  ', '  flex  '])).toBe('container flex');
  });

  it('should remove empty strings (Req 10.3)', () => {
    expect(normalizeClassNames(['container', '', 'flex'])).toBe('container flex');
  });

  it('should remove whitespace-only strings', () => {
    expect(normalizeClassNames(['container', '   ', 'flex'])).toBe('container flex');
  });

  it('should deduplicate class names preserving order (Req 2.5)', () => {
    expect(normalizeClassNames(['a', 'b', 'a', 'c', 'b'])).toBe('a b c');
  });

  it('should split space-separated class names within a single entry', () => {
    expect(normalizeClassNames(['container flex', 'items-center'])).toBe('container flex items-center');
  });

  it('should deduplicate across split entries', () => {
    expect(normalizeClassNames(['a b', 'b c'])).toBe('a b c');
  });

  it('should handle all empty inputs', () => {
    expect(normalizeClassNames(['', '', ''])).toBe('');
  });

  it('should handle empty array', () => {
    expect(normalizeClassNames([])).toBe('');
  });

  it('should handle entries with multiple spaces', () => {
    expect(normalizeClassNames(['a   b   c'])).toBe('a b c');
  });
});

// ============================================================
// HtmlAttribute.className with normalization (Req 2.5, 10.3)
// ============================================================
describe('HtmlAttribute.className with normalization', () => {
  it('should normalize and deduplicate class names', () => {
    const attr = HtmlAttribute.className('a', 'b', 'a');
    expect(attr.renderAttribute()).toBe('class="a b"');
  });

  it('should remove empty class names', () => {
    const attr = HtmlAttribute.className('container', '', 'flex');
    expect(attr.renderAttribute()).toBe('class="container flex"');
  });

  it('should trim class names', () => {
    const attr = HtmlAttribute.className('  container  ', '  flex  ');
    expect(attr.renderAttribute()).toBe('class="container flex"');
  });

  it('should split and deduplicate space-separated names', () => {
    const attr = HtmlAttribute.className('a b', 'b c');
    expect(attr.renderAttribute()).toBe('class="a b c"');
  });
});

// ============================================================
// escapeHtml (Req 10.4)
// ============================================================
describe('escapeHtml', () => {
  it('should escape & to &amp;', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('should escape < to &lt;', () => {
    expect(escapeHtml('a<b')).toBe('a&lt;b');
  });

  it('should escape > to &gt;', () => {
    expect(escapeHtml('a>b')).toBe('a&gt;b');
  });

  it('should escape " to &quot;', () => {
    expect(escapeHtml('a"b')).toBe('a&quot;b');
  });

  it("should escape ' to &#39;", () => {
    expect(escapeHtml("a'b")).toBe('a&#39;b');
  });

  it('should escape all special characters in one string', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should not modify strings without special characters', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

// ============================================================
// renderAttribute with HTML escaping (Req 10.4)
// ============================================================
describe('HtmlAttribute renderAttribute with HTML escaping', () => {
  it('should escape keyValue attribute values', () => {
    const attr = HtmlAttribute.keyValue('title', '<script>alert("xss")</script>');
    expect(attr.renderAttribute()).toBe(
      'title="&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"'
    );
  });

  it('should escape custom attribute values', () => {
    const attr = HtmlAttribute.custom('info', '<b>bold</b>');
    expect(attr.renderAttribute()).toBe('data-info="&lt;b&gt;bold&lt;/b&gt;"');
  });

  it('should escape class attribute values with special characters', () => {
    const attr = HtmlAttribute.keyValue('class', 'a&b');
    expect(attr.renderAttribute()).toBe('class="a&amp;b"');
  });

  it('should not escape boolean attributes (no value to escape)', () => {
    const attr = HtmlAttribute.boolean('checked');
    expect(attr.renderAttribute()).toBe('checked');
  });

  it('should escape attribute values with single quotes', () => {
    const attr = HtmlAttribute.keyValue('title', "it's a test");
    expect(attr.renderAttribute()).toBe('title="it&#39;s a test"');
  });

  it('should escape ampersand in href', () => {
    const attr = HtmlAttribute.keyValue('href', '/search?q=a&page=1');
    expect(attr.renderAttribute()).toBe('href="/search?q=a&amp;page=1"');
  });
});
