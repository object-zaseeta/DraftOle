import { describe, it, expect } from 'vitest';
import { param, isJsParam, jsTemplate } from '../../src/js/js-template.js';
import { div, span, li, button } from '../../src/html/tags/factories.js';

describe('param()', () => {
  it('__jsParam: true と name を持つマーカーオブジェクトを返す', () => {
    const p = param('text');
    expect(p).toEqual({ __jsParam: true, name: 'text' });
  });

  it('isJsParam() でマーカーを判定できる', () => {
    expect(isJsParam(param('x'))).toBe(true);
    expect(isJsParam('hello')).toBe(false);
    expect(isJsParam(null)).toBe(false);
    expect(isJsParam(undefined)).toBe(false);
    expect(isJsParam(42)).toBe(false);
  });
});

describe('jsTemplate()', () => {
  it('単一要素のJS関数を出力する', () => {
    const result = jsTemplate('createBox', [], div({ className: 'box' }));
    expect(result.name).toBe('createBox');
    expect(result.params).toEqual([]);
    const js = result.render();
    expect(js).toContain('function createBox()');
    expect(js).toContain('document.createElement("div")');
    expect(js).toContain('el0.className = "box"');
    expect(js).toContain('return el0;');
  });

  it('param() を使った引数参照を変数として出力する', () => {
    const result = jsTemplate('createLabel', ['text'],
      span({ className: 'label', textContent: param('text') }),
    );
    const js = result.render();
    expect(js).toContain('function createLabel(text)');
    expect(js).toContain('el0.textContent = text;');
    expect(js).not.toContain('el0.textContent = "text"');
  });

  it('複数引数の場合、カンマ区切りで出力する', () => {
    const result = jsTemplate('create', ['a', 'b', 'c'], div());
    expect(result.render()).toContain('function create(a, b, c)');
  });

  it('ネストされた子要素で createElement + appendChild を出力する', () => {
    const result = jsTemplate('createCard', [],
      div({ className: 'card' },
        span({ className: 'title', textContent: 'Hello' }),
        span({ className: 'body', textContent: 'World' }),
      ),
    );
    const js = result.render();
    expect(js).toContain('el0.className = "card"');
    expect(js).toContain('el1.className = "title"');
    expect(js).toContain('el1.textContent = "Hello"');
    expect(js).toContain('el0.appendChild(el1)');
    expect(js).toContain('el2.className = "body"');
    expect(js).toContain('el2.textContent = "World"');
    expect(js).toContain('el0.appendChild(el2)');
  });

  it('深くネストされた構造を正しく出力する', () => {
    const result = jsTemplate('createNested', [],
      div({ className: 'outer' },
        div({ className: 'inner' },
          span({ textContent: 'deep' }),
        ),
      ),
    );
    const js = result.render();
    expect(js).toContain('el0.appendChild(el1)');
    expect(js).toContain('el1.appendChild(el2)');
    expect(js).toContain('el2.textContent = "deep"');
  });

  it('MVP Demo の createTodoItem 相当の構造を出力する', () => {
    const result = jsTemplate('createTodoItem', ['text'],
      li({ className: 'item' },
        span({ className: 'text', textContent: param('text') }),
        span({ className: 'pill ng', textContent: 'active' }),
        button({ className: 'btn', type: 'button', textContent: 'toggle' }),
      ),
    );
    const js = result.render();
    expect(js).toContain('function createTodoItem(text)');
    expect(js).toContain('document.createElement("li")');
    expect(js).toContain('el0.className = "item"');
    expect(js).toContain('el1.textContent = text;');
    expect(js).toContain('el2.className = "pill ng"');
    expect(js).toContain('el2.textContent = "active"');
    expect(js).toContain('el3.type = "button"');
    expect(js).toContain('el0.appendChild(el1)');
    expect(js).toContain('el0.appendChild(el2)');
    expect(js).toContain('el0.appendChild(el3)');
    expect(js).toContain('return el0;');
  });

  it('文字列の子要素は textContent として出力する', () => {
    const result = jsTemplate('createP', [], div('Hello World'));
    const js = result.render();
    expect(js).toContain('el0.textContent = "Hello World"');
  });

  it('setAttribute フォールバック: DOM プロパティ以外は setAttribute で出力', () => {
    const result = jsTemplate('createCustom', [],
      div({ 'aria-label': 'test', 'data-id': '123' }),
    );
    const js = result.render();
    expect(js).toContain('el0.setAttribute("aria-label", "test")');
    expect(js).toContain('el0.setAttribute("data-id", "123")');
  });
});
