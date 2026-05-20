import { describe, expect, it } from 'vitest';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import { TextType } from '../../src/html/elements/text-type.js';
import { button, div, li, span } from '../../src/html/tags/factories.js';
import { encodeJsParam } from '../../src/js/js-param.js';
import { isJsParam, jsTemplate, param } from '../../src/js/js-template.js';

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

// ============================================================
// 分岐網羅: attribute type 分岐 / TextType child / afterCreate
// Requirement 2.5 (global-branch-90-percent)
// ============================================================

describe('jsTemplate() attribute type 分岐', () => {
  it('boolean 属性は el.propName = true を出力する (DOM プロパティ にマップされる キー)', () => {
    // disabled は BooleanAttributeKey かつ DOM_PROPERTY_MAP に存在する
    const result = jsTemplate('createBtn', [], button({ disabled: true }));
    const js = result.render();
    expect(js).toContain('el0.disabled = true;');
    // setAttribute フォールバックは使わない
    expect(js).not.toContain('setAttribute("disabled"');
  });

  it('boolean 属性で DOM_PROPERTY_MAP にないキーはそのままプロパティ名として出力する', () => {
    // autofocus は BooleanAttributeKey だが DOM_PROPERTY_MAP には載っていない
    // → key そのものがプロパティ名としてフォールバック使用される
    const result = jsTemplate('createInput', [], button({ autofocus: true }));
    const js = result.render();
    expect(js).toContain('el0.autofocus = true;');
  });

  it('custom (data-*) 属性に param() を渡すと変数参照として setAttribute される', () => {
    // factories の parseAttributeMap は data-* + JsParam を keyValue 経路にしてしまうため、
    // HtmlAttribute.custom + 手動 sentinel エンコードで custom + param ルート (line 123) を踏む
    const tag = div().addHtmlAttribute(
      HtmlAttribute.custom('id', encodeJsParam(param('itemId'))),
    );
    const result = jsTemplate('createItem', ['itemId'], tag);
    const js = result.render();
    expect(js).toContain('function createItem(itemId)');
    expect(js).toContain('el0.setAttribute("data-id", itemId);');
    // クォートで囲まれていない（変数参照）
    expect(js).not.toContain('el0.setAttribute("data-id", "itemId")');
  });

  it('keyValue で key が "class" の場合は className DOM プロパティとして出力する', () => {
    // factories は className を keyValue('className', ...) に変換するため、
    // 真の key === 'class' ルートを踏むには HtmlAttribute.className を直接 add する
    const tag = div().addHtmlAttribute(HtmlAttribute.className('foo bar'));
    const result = jsTemplate('createDiv', [], tag);
    const js = result.render();
    expect(js).toContain('el0.className = "foo bar";');
    // setAttribute フォールバックではない
    expect(js).not.toContain('setAttribute("class"');
  });

  it('setAttribute フォールバック経路で param() 値を変数参照として展開する', () => {
    // aria-label は DOM_PROPERTY_MAP に存在しないため setAttribute フォールバック
    // 値が JsParam の sentinel の場合は変数参照（クォートなし）になる (line 146)
    const result = jsTemplate('createBtn', ['label'],
      button({ 'aria-label': param('label') }),
    );
    const js = result.render();
    expect(js).toContain('function createBtn(label)');
    expect(js).toContain('el0.setAttribute("aria-label", label);');
    expect(js).not.toContain('el0.setAttribute("aria-label", "label")');
  });
});

describe('jsTemplate() TextType child 分岐', () => {
  it('テキスト子ノード (TextType) は textContent として出力する (要素ノードと区別する)', () => {
    // div('Hello') → 子 TextType → line 199 の true 分岐 + line 206 (raw 文字列)
    // 同じ親に要素子も追加して false 分岐 (要素 appendChild) も網羅する
    const result = jsTemplate('createCard', [],
      div(span({ className: 'inner' }), 'plain text'),
    );
    const js = result.render();
    // 要素子は appendChild
    expect(js).toContain('el0.appendChild(el1);');
    // テキスト子は textContent
    expect(js).toContain('el0.textContent = "plain text";');
  });

  it('TextType の content が param sentinel の場合は変数参照として textContent に代入する', () => {
    // child としての TextType の content に sentinel を埋め込むことで line 203 の true 分岐を踏む
    const textChild = new TextType(encodeJsParam(param('msg')), { escape: false });
    const tag = div(textChild);
    const result = jsTemplate('createLabel', ['msg'], tag);
    const js = result.render();
    expect(js).toContain('function createLabel(msg)');
    expect(js).toContain('el0.textContent = msg;');
    // クォートで囲まれていない（変数参照）
    expect(js).not.toContain('el0.textContent = "msg"');
    expect(js).not.toContain('"\\u0000jsparam');
  });
});

describe('jsTemplate() afterCreate コールバック分岐', () => {
  it('afterCreate が空文字のみを返す場合は何も挿入しない', () => {
    // line 269 の `afterCode.trim().length > 0` が false の経路
    const result = jsTemplate('createBox', [],
      div({ className: 'box' }),
      () => '   \n  \n', // 空白のみ
    );
    const js = result.render();
    // afterCreate 由来の行は無い
    const lines = js.split('\n');
    // function header + createElement + className + return + closing brace
    expect(lines.length).toBe(5);
    expect(js).toContain('return el0;');
  });

  it('afterCreate が空行混じりの複数行コードを返す場合、空行を除いてインデント挿入する', () => {
    // line 267-276 の filter + map + push を踏み、空行が落ちることを確認する
    const result = jsTemplate('create', [],
      div({ jsName: 'el' }),
      () => 'console.log("a");\n\n   \nconsole.log("b");',
    );
    const js = result.render();
    expect(js).toContain('  console.log("a");');
    expect(js).toContain('  console.log("b");');
    // return より前に挿入される
    const aIdx = js.indexOf('console.log("a")');
    const returnIdx = js.indexOf('return el');
    expect(aIdx).toBeLessThan(returnIdx);
    // 空行は落ちている
    expect(js).not.toMatch(/console\.log\("a"\);\n\s*\n\s*\n\s*console\.log\("b"\);/);
  });
});
