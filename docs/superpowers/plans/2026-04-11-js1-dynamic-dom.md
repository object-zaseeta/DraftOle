# JS-1 動的DOM生成 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DraftOle の宣言的タグファクトリで定義したDOM構造を、`createElement`/`appendChild` のJS関数として出力する `jsTemplate()` と `param()` を実装する。

**Architecture:** `jsTemplate()` は PairType ツリーを受け取り、再帰的に走査して JS 関数文字列を生成する。`param()` はマーカーオブジェクトを返し、JS出力時に変数参照に変換する。新規ファイル1つ + テスト1つ + エクスポート追加。

**Tech Stack:** TypeScript, Vitest

---

## ファイル構成

| 操作 | ファイル | 責務 |
|------|---------|------|
| 新規 | `src/js/js-template.ts` | `param()`, `JsParam`, `jsTemplate()`, `JsTemplateResult` |
| 新規 | `tests/js/js-template.test.ts` | 単体テスト |
| 変更 | `src/index.ts` | `jsTemplate`, `param` エクスポート追加 |

---

### Task 1: param() と JsParam 型（TDD）

**Files:**
- Create: `tests/js/js-template.test.ts`
- Create: `src/js/js-template.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// tests/js/js-template.test.ts
import { describe, it, expect } from 'vitest';
import { param, isJsParam } from '../../src/js/js-template.js';

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
```

- [ ] **Step 2: テスト実行して失敗確認**

Run: `pnpm vitest run tests/js/js-template.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 最小実装**

```typescript
// src/js/js-template.ts

/**
 * JS テンプレート関数の引数参照マーカー。
 * JS出力時にリテラルではなく変数参照として出力される。
 */
export interface JsParam {
  readonly __jsParam: true;
  readonly name: string;
}

/**
 * JS関数の引数を参照するマーカーを生成する。
 *
 * @example
 * ```typescript
 * span({ textContent: param('text') })
 * // → el.textContent = text;  (変数参照)
 * ```
 */
export function param(name: string): JsParam {
  return { __jsParam: true, name };
}

/**
 * 値が JsParam マーカーかどうかを判定する。
 */
export function isJsParam(value: unknown): value is JsParam {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__jsParam' in value &&
    (value as JsParam).__jsParam === true
  );
}
```

- [ ] **Step 4: テスト実行して全パス確認**

Run: `pnpm vitest run tests/js/js-template.test.ts`
Expected: 2 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/js/js-template.ts tests/js/js-template.test.ts
git commit -m "feat(js-1): add param() and JsParam marker type"
```

---

### Task 2: 単一要素の jsTemplate()（TDD）

**Files:**
- Modify: `tests/js/js-template.test.ts`
- Modify: `src/js/js-template.ts`

- [ ] **Step 1: テストを追加**

`tests/js/js-template.test.ts` に追加:

```typescript
import { param, isJsParam, jsTemplate } from '../../src/js/js-template.js';
import { div, span, li, button } from '../../src/html/tags/factories.js';

describe('jsTemplate()', () => {
  it('単一要素のJS関数を出力する', () => {
    const result = jsTemplate('createBox', [], div({ className: 'box' }));

    expect(result.name).toBe('createBox');
    expect(result.params).toEqual([]);
    expect(result.render()).toBe(
      [
        'function createBox() {',
        '  const el0 = document.createElement("div");',
        '  el0.className = "box";',
        '  return el0;',
        '}',
      ].join('\n'),
    );
  });

  it('複数の属性を持つ要素を出力する', () => {
    const result = jsTemplate('createBtn', [],
      button({ className: 'btn', type: 'button', id: 'my-btn' }),
    );

    const js = result.render();
    expect(js).toContain('document.createElement("button")');
    expect(js).toContain('el0.className = "btn"');
    expect(js).toContain('el0.type = "button"');
    expect(js).toContain('el0.id = "my-btn"');
  });

  it('param() を使った引数参照を変数として出力する', () => {
    const result = jsTemplate('createLabel', ['text'],
      span({ className: 'label', textContent: param('text') }),
    );

    const js = result.render();
    expect(js).toContain('function createLabel(text)');
    expect(js).toContain('el0.className = "label"');
    expect(js).toContain('el0.textContent = text;');
    // textContent はクォートなし（変数参照）
    expect(js).not.toContain('el0.textContent = "text"');
  });

  it('引数なしの場合、関数シグネチャに引数がない', () => {
    const result = jsTemplate('createEmpty', [], div());
    expect(result.render()).toContain('function createEmpty()');
  });

  it('複数引数の場合、カンマ区切りで出力する', () => {
    const result = jsTemplate('create', ['a', 'b', 'c'], div());
    expect(result.render()).toContain('function create(a, b, c)');
  });
});
```

- [ ] **Step 2: テスト実行して失敗確認**

Run: `pnpm vitest run tests/js/js-template.test.ts`
Expected: FAIL（jsTemplate が未定義）

- [ ] **Step 3: jsTemplate 実装**

`src/js/js-template.ts` に追加:

```typescript
import type { HTMLTagProtocol, HtmlAttributeShape } from '../html/protocols/html-tag-protocol.js';
import { HtmlTag } from '../html/elements/html-tag.js';
import { TextType } from '../html/elements/text-type.js';

/**
 * jsTemplate() の戻り値。render() でJS関数文字列を生成する。
 */
export interface JsTemplateResult {
  readonly name: string;
  readonly params: readonly string[];
  render(): string;
}

/** DOM プロパティとして直接設定するキー */
const DOM_PROPERTIES = new Set([
  'className', 'textContent', 'id', 'type', 'value', 'placeholder',
  'href', 'src', 'alt', 'name', 'for',
]);

/**
 * 属性値をJS文字列としてフォーマットする。
 * JsParam の場合は変数名をそのまま、文字列の場合はクォート付き。
 */
function formatValue(value: string | JsParam): string {
  if (isJsParam(value)) {
    return value.name;
  }
  return `"${value}"`;
}

/**
 * HtmlTag ツリーを再帰的に走査し、createElement/appendChild の JS 文を生成する。
 */
function walkTree(
  node: HTMLTagProtocol,
  varName: string,
  counter: { value: number },
  lines: string[],
  indent: string,
): void {
  if (node instanceof TextType) {
    // TextType は親の textContent として処理済み（子としては出現しない想定）
    return;
  }

  if (!(node instanceof HtmlTag)) {
    return;
  }

  const tag = node as HtmlTag;

  // createElement
  lines.push(`${indent}const ${varName} = document.createElement("${tag.tagType}");`);

  // 属性を走査
  for (const attr of tag.attributes) {
    const key = attr.key;
    const rawValue = attr.attributeValue?.value;
    if (key === undefined || rawValue === undefined) continue;

    // class → className に変換
    const propKey = key === 'class' ? 'className' : key;

    if (DOM_PROPERTIES.has(propKey)) {
      lines.push(`${indent}${varName}.${propKey} = ${formatValue(rawValue)};`);
    } else {
      lines.push(`${indent}${varName}.setAttribute("${key}", ${formatValue(rawValue)});`);
    }
  }

  // 子要素を再帰走査
  for (const child of tag.children) {
    if (child instanceof TextType) {
      // テキスト子要素 → 親の textContent に設定
      const textContent = (child as TextType).protoRender();
      lines.push(`${indent}${varName}.textContent = ${formatValue(textContent)};`);
    } else if (child instanceof HtmlTag) {
      counter.value++;
      const childVar = `el${counter.value}`;
      walkTree(child, childVar, counter, lines, indent);
      lines.push(`${indent}${varName}.appendChild(${childVar});`);
    }
  }
}

/**
 * DraftOle タグツリーから createElement/appendChild の JS 関数を生成する。
 *
 * @param name - 生成する JS 関数名
 * @param params - 関数の引数名リスト
 * @param rootElement - DraftOle タグファクトリで構築したツリーのルート要素
 * @returns JsTemplateResult（render() で JS 関数文字列を取得）
 *
 * @example
 * ```typescript
 * const tmpl = jsTemplate('createItem', ['text'],
 *   li({ className: 'item' },
 *     span({ className: 'label', textContent: param('text') }),
 *   )
 * );
 * console.log(tmpl.render());
 * ```
 */
export function jsTemplate(
  name: string,
  params: string[],
  rootElement: HTMLTagProtocol,
): JsTemplateResult {
  return {
    name,
    params: [...params],
    render(): string {
      const lines: string[] = [];
      const counter = { value: 0 };
      const indent = '  ';

      // 関数ヘッダ
      lines.push(`function ${name}(${params.join(', ')}) {`);

      // ツリー走査
      walkTree(rootElement, 'el0', counter, lines, indent);

      // return ルート要素
      lines.push(`${indent}return el0;`);
      lines.push('}');

      return lines.join('\n');
    },
  };
}
```

- [ ] **Step 4: テスト実行して全パス確認**

Run: `pnpm vitest run tests/js/js-template.test.ts`
Expected: 全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add src/js/js-template.ts tests/js/js-template.test.ts
git commit -m "feat(js-1): implement jsTemplate() for single elements"
```

---

### Task 3: ネストされた子要素のサポート（TDD）

**Files:**
- Modify: `tests/js/js-template.test.ts`

- [ ] **Step 1: ネストテストを追加**

`tests/js/js-template.test.ts` の `describe('jsTemplate()')` 内に追加:

```typescript
  it('ネストされた子要素で createElement + appendChild を出力する', () => {
    const result = jsTemplate('createCard', [],
      div({ className: 'card' },
        span({ className: 'title', textContent: 'Hello' }),
        span({ className: 'body', textContent: 'World' }),
      ),
    );

    expect(result.render()).toBe(
      [
        'function createCard() {',
        '  const el0 = document.createElement("div");',
        '  el0.className = "card";',
        '  const el1 = document.createElement("span");',
        '  el1.className = "title";',
        '  el1.textContent = "Hello";',
        '  el0.appendChild(el1);',
        '  const el2 = document.createElement("span");',
        '  el2.className = "body";',
        '  el2.textContent = "World";',
        '  el0.appendChild(el2);',
        '  return el0;',
        '}',
      ].join('\n'),
    );
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
    expect(js).toContain('document.createElement("span")');
    expect(js).toContain('el1.textContent = text;');
    expect(js).toContain('el2.className = "pill ng"');
    expect(js).toContain('el2.textContent = "active"');
    expect(js).toContain('document.createElement("button")');
    expect(js).toContain('el3.type = "button"');
    expect(js).toContain('el0.appendChild(el1)');
    expect(js).toContain('el0.appendChild(el2)');
    expect(js).toContain('el0.appendChild(el3)');
    expect(js).toContain('return el0;');
  });

  it('文字列の子要素は textContent として出力する', () => {
    const result = jsTemplate('createP', [],
      div('Hello World'),
    );

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
```

- [ ] **Step 2: テスト実行**

Run: `pnpm vitest run tests/js/js-template.test.ts`
Expected: 全テスト PASS（Task 2 の実装でネスト対応済みのはず。失敗した場合は walkTree を修正）

- [ ] **Step 3: 修正が必要な場合のみ実装を修正**

テスト結果に基づいて `walkTree` を修正。特に注意:
- `HtmlAttributeShape` の `key` / `attributeValue.value` のアクセス方法が実際のインターフェースと合っているか確認
- `TextType.protoRender()` がエスケープされたテキストを返す場合、エスケープ前の生テキストが必要かもしれない

実装修正が必要な場合は、`src/html/protocols/html-tag-protocol.ts` の `HtmlAttributeShape` 定義を確認し、正しいプロパティアクセスに修正する。

- [ ] **Step 4: テスト全パス確認**

Run: `pnpm vitest run tests/js/js-template.test.ts`
Expected: 全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add src/js/js-template.ts tests/js/js-template.test.ts
git commit -m "feat(js-1): nested child elements and setAttribute fallback"
```

---

### Task 4: エクスポート追加 + 全テスト

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: エクスポート追加**

`src/index.ts` の JS Module セクション（`Phase 4: JS Module` 付近）に追加:

```typescript
// Phase 4: JS Template
export {
  jsTemplate,
  param,
  isJsParam,
} from './js/js-template.js';

export type {
  JsParam,
  JsTemplateResult,
} from './js/js-template.js';
```

- [ ] **Step 2: ビルド確認**

Run: `pnpm run build`
Expected: 成功

- [ ] **Step 3: 全テスト実行**

Run: `pnpm vitest run`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/index.ts
git commit -m "feat(js-1): export jsTemplate and param from index.ts"
```
