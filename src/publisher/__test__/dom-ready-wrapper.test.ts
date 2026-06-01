import { describe, it, expect } from 'vitest';
import { wrapDOMReady } from '../dom-ready';

describe('MVP-3.3: wrapDOMReady', () => {
  it('JSコードをDOMContentLoadedでラップする', () => {
    const js = 'console.log("hello");';
    const result = wrapDOMReady(js);
    expect(result).toBe(
      'document.addEventListener("DOMContentLoaded", () => {\nconsole.log("hello");\n});'
    );
  });

  it('空文字列は空文字列のまま返す', () => {
    expect(wrapDOMReady('')).toBe('');
  });

  it('空白のみは空文字列を返す', () => {
    expect(wrapDOMReady('   ')).toBe('');
    expect(wrapDOMReady('\n\n')).toBe('');
  });

  it('複数行のJSをラップする', () => {
    const js = 'const a = 1;\nconst b = 2;\nconsole.log(a + b);';
    const result = wrapDOMReady(js);
    expect(result).toContain('document.addEventListener("DOMContentLoaded"');
    expect(result).toContain('const a = 1;');
    expect(result).toContain('console.log(a + b);');
    expect(result).toMatch(/\}\);$/);
  });

  it('既にDOMContentLoadedを含むJSはラップしない', () => {
    const js = 'document.addEventListener("DOMContentLoaded", () => {\n  init();\n});';
    const result = wrapDOMReady(js);
    // 二重ラップしない
    expect(result).toBe(js);
  });
});
