import { describe, it, expect } from 'vitest';
import { jsTemplate, param } from '../../src/js/js-template.js';
import { div, span, li, button } from '../../src/html/tags/factories.js';

describe('jsTemplate jsName', () => {
  it('jsName を指定した要素は名前付き変数を使用する', () => {
    const result = jsTemplate('createBox', [],
      div({ className: 'box', jsName: 'box' }),
    );
    const js = result.render();
    expect(js).toContain('const box = document.createElement("div")');
    expect(js).toContain('box.className = "box"');
    expect(js).toContain('return box;');
    expect(js).not.toContain('setAttribute("data-jsname"');
  });

  it('jsName なしの要素は従来通り el0, el1 で採番する', () => {
    const result = jsTemplate('createCard', [],
      div({ className: 'card' },
        span({ textContent: 'hello' }),
      ),
    );
    const js = result.render();
    expect(js).toContain('const el0 = document.createElement("div")');
    expect(js).toContain('const el1 = document.createElement("span")');
  });

  it('jsName ありとなしが混在する場合、それぞれ正しく処理する', () => {
    const result = jsTemplate('createItem', [],
      li({ className: 'item', jsName: 'li' },
        span({ className: 'text', jsName: 'label' }),
        span({ className: 'pill' }),
      ),
    );
    const js = result.render();
    expect(js).toContain('const li = document.createElement("li")');
    expect(js).toContain('const label = document.createElement("span")');
    // jsName のない span はカウンタから el0 を取得する（jsName 要素はカウンタを消費しない）
    expect(js).toContain('const el0 = document.createElement("span")');
    expect(js).toContain('li.appendChild(label)');
    expect(js).toContain('li.appendChild(el0)');
  });
});

describe('jsTemplate afterCreate', () => {
  it('afterCreate コールバックの出力が return 前に挿入される', () => {
    const result = jsTemplate('createBtn', [],
      button({ className: 'btn', jsName: 'btn' }),
      (refs) => `${refs['btn']}.addEventListener("click", () => { alert("clicked"); });`,
    );
    const js = result.render();
    const lines = js.split('\n');
    const addEventIdx = lines.findIndex(l => l.includes('addEventListener'));
    const returnIdx = lines.findIndex(l => l.includes('return'));
    expect(addEventIdx).toBeGreaterThan(-1);
    expect(returnIdx).toBeGreaterThan(addEventIdx);
  });

  it('refs マップに jsName のある全要素が含まれる', () => {
    let capturedRefs: Record<string, string> = {};
    const result = jsTemplate('createItem', [],
      li({ className: 'item', jsName: 'li' },
        span({ jsName: 'label' }),
        button({ jsName: 'btn' }),
      ),
      (refs) => {
        capturedRefs = { ...refs };
        return '';
      },
    );
    result.render();
    expect(capturedRefs).toEqual({
      li: 'li',
      label: 'label',
      btn: 'btn',
    });
  });

  it('afterCreate なしの場合は従来通り動作する', () => {
    const result = jsTemplate('createBox', [],
      div({ className: 'box' }),
    );
    const js = result.render();
    expect(js).toContain('return el0;');
    expect(js).not.toContain('addEventListener');
  });

  it('MVP Demo の createTodoItem を完全に再現する', () => {
    const result = jsTemplate('createTodoItem', ['text'],
      li({ className: 'item', jsName: 'li' },
        span({ className: 'text', textContent: param('text'), jsName: 'label' }),
        span({ className: 'pill ng', textContent: 'active', jsName: 'pill' }),
        button({ className: 'btn', type: 'button', textContent: 'toggle', jsName: 'btn' }),
      ),
      (refs) => `${refs['btn']}.addEventListener("click", () => {
  ${refs['li']}.classList.toggle("done");
  const done = ${refs['li']}.classList.contains("done");
  ${refs['pill']}.textContent = done ? "done" : "active";
  ${refs['pill']}.classList.toggle("ok", done);
  ${refs['pill']}.classList.toggle("ng", !done);
  updateCount();
});`,
    );

    const js = result.render();
    expect(js).toContain('function createTodoItem(text)');
    expect(js).toContain('const li = document.createElement("li")');
    expect(js).toContain('const label = document.createElement("span")');
    expect(js).toContain('label.textContent = text;');
    expect(js).toContain('const pill = document.createElement("span")');
    expect(js).toContain('pill.textContent = "active"');
    expect(js).toContain('const btn = document.createElement("button")');
    expect(js).toContain('btn.addEventListener("click"');
    expect(js).toContain('li.classList.toggle("done")');
    expect(js).toContain('pill.textContent = done ? "done" : "active"');
    expect(js).toContain('return li;');
  });

  it('afterCreate の複数行コードが正しくインデントされる', () => {
    const result = jsTemplate('create', [],
      div({ jsName: 'el' }),
      (refs) => `${refs['el']}.style.color = "red";
${refs['el']}.style.background = "blue";`,
    );
    const js = result.render();
    expect(js).toContain('  el.style.color = "red";');
    expect(js).toContain('  el.style.background = "blue";');
  });
});
