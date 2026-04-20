# JS-2 イベントハンドラ関数本体 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `jsTemplate` に `jsName` による名前付き変数と `afterCreate` コールバックを追加し、生成したDOM要素にイベントリスナー等の生JSコードを差し込めるようにする。

**Architecture:** `jsName` を `AttributeMap` の特殊キーとして扱い、HTML出力からは除外しつつ `jsTemplate` のツリー走査時に変数名として使用する。`afterCreate` コールバックは `refs` マップ（jsName → 変数名）を受け取り、戻り値の生JSを `return` 文の直前に挿入する。

**Tech Stack:** TypeScript, Vitest

---

## ファイル構成

| 操作 | ファイル | 責務 |
|------|---------|------|
| 変更 | `src/js/js-template.ts` | `walkNode` で `jsName` 検出・名前付き変数、`jsTemplate` に `afterCreate` 引数追加 |
| 変更 | `src/html/tags/factories.ts` | `parseAttributeMap` で `jsName` をスキップ（HTML出力から除外） |
| 新規 | `tests/js/js-template-handler.test.ts` | `jsName` + `afterCreate` のテスト |

---

### Task 1: `jsName` による名前付き変数（TDD）

**Files:**
- Create: `tests/js/js-template-handler.test.ts`
- Modify: `src/js/js-template.ts`
- Modify: `src/html/tags/factories.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// tests/js/js-template-handler.test.ts
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
    // jsName は DOM 属性として出力されない
    expect(js).not.toContain('jsName');
    expect(js).not.toContain('setAttribute("jsName"');
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
    expect(js).toContain('const el2 = document.createElement("span")');
    expect(js).toContain('li.appendChild(label)');
    expect(js).toContain('li.appendChild(el2)');
  });

  it('jsName は HTML レンダリングに含まれない', () => {
    const element = div({ className: 'test', jsName: 'myDiv' });
    const html = element.render();
    expect(html).toContain('class="test"');
    expect(html).not.toContain('jsName');
    expect(html).not.toContain('myDiv');
  });
});
```

- [ ] **Step 2: テスト実行して失敗確認**

Run: `pnpm vitest run tests/js/js-template-handler.test.ts`
Expected: FAIL（jsName がまだ実装されていない）

- [ ] **Step 3: factories.ts で jsName を HTML 出力から除外**

`src/html/tags/factories.ts` の `parseAttributeMap` 関数内（`for (const [key, value] of Object.entries(map))` ループの先頭）に `jsName` スキップを追加:

```typescript
function parseAttributeMap(map: AttributeMap): HtmlAttribute[] {
  const result: HtmlAttribute[] = [];
  for (const [key, value] of Object.entries(map)) {
    // jsName は jsTemplate 専用キー。HTML 属性としては出力しない。
    if (key === 'jsName') continue;

    if (typeof value === 'boolean') {
      // ... existing code
```

- [ ] **Step 4: js-template.ts の walkNode で jsName を検出**

`src/js/js-template.ts` の `walkNode` 関数を変更。変数名の決定ロジックを修正:

変更前（行 168）:
```typescript
const varName = `el${counter.value++}`;
```

変更後:
```typescript
// jsName 属性を探す（DOM 出力からは除外済み、属性リスト経由で参照可能）
// ただし jsName は parseAttributeMap でスキップされるため、HtmlAttribute には入らない
// → 元の AttributeMap から取得する必要がある
```

**問題**: `jsName` は `parseAttributeMap` でスキップされるため、`node.attributes` からは取得できない。別の方法が必要。

**解決策**: `jsName` の sentinel エンコーディングを使う。`jsName` を JsParam と同様に sentinel 文字列としてエンコードし、特殊な属性として保存する。

**よりシンプルな解決策**: `parseAttributeMap` で `jsName` をスキップするのではなく、`data-jsname` として保存する。`jsTemplate` の走査時にこれを検出して変数名に使い、JS出力からは除外する。

**最もシンプルな解決策**: `jsName` を `parseAttributeMap` でスキップ**しない**。代わりに `keyValue` 属性として保存し（`jsName="myDiv"` として）、`js-template.ts` の `walkNode` で検出して変数名に使う。`walkNode` ではこの属性の JS 出力をスキップする。HTML レンダリングでは `jsName` 属性がそのまま出力されるが、ブラウザは未知の属性を無視する。

**採用する解決策**: `parseAttributeMap` では `jsName` をスキップしてHTML出力から除外する（Step 3）。`jsTemplate` 側では、`walkNode` に渡す前に元の `AttributeMap` から `jsName` を抽出する仕組みを作る。

具体的には、`jsTemplate` 専用のツリー走査で、各ノードの属性リストを調べる前に、ノード自体に `jsName` 情報を埋め込む方法を検討する。

**最終的な採用案**: HtmlTag に `jsName` を直接保存するのではなく、`jsTemplate` の呼び出し時に別のマッピングを構築する。しかし `jsTemplate` はツリーを受け取るだけで、構築時の `AttributeMap` にはアクセスできない。

**実装方針の転換**: `parseAttributeMap` で `jsName` をスキップ**せず**、`keyValue` 属性として保存する。`walkNode` でこの属性を検出して変数名に使い、JS出力の属性行からは除外する。HTML レンダリングでは `jsName="xxx"` が出力されるが、これは `jsTemplate` 用のテンプレートツリーであり直接HTMLとして使われないため問題ない。

`src/html/tags/factories.ts` の `parseAttributeMap` は Step 3 の変更を**元に戻す**。`jsName` は通常の `keyValue` 属性として保存する。

`src/js/js-template.ts` の `walkNode` を変更:

```typescript
function walkNode(
  node: HTMLTagProtocol,
  counter: { value: number },
  lines: string[],
  refs: Record<string, string>,
): string {
  // jsName 属性を検出して変数名に使う
  let varName = `el${counter.value++}`;
  const jsNameAttr = node.attributes.find(a => a.key === 'jsName');
  if (jsNameAttr && jsNameAttr.attributeValue.type === 'keyValue') {
    varName = jsNameAttr.attributeValue.value;
    refs[varName] = varName;
  }

  const tagType = node.tagType;
  lines.push(`const ${varName} = document.createElement("${tagType}");`);

  // 属性の出力（jsName はスキップ）
  for (const attr of node.attributes) {
    if (attr.key === 'jsName') continue;
    const attrLines = attrToJsLines(varName, attr);
    for (const line of attrLines) {
      lines.push(line);
    }
  }

  // 子要素の出力
  for (const child of node.children) {
    if (child instanceof TextType) {
      const content = child.content;
      const paramName = decodeJsParamSentinel(content);
      if (paramName !== null) {
        lines.push(`${varName}.textContent = ${paramName};`);
      } else {
        lines.push(`${varName}.textContent = ${JSON.stringify(content)};`);
      }
    } else {
      const childVar = walkNode(child, counter, lines, refs);
      lines.push(`${varName}.appendChild(${childVar});`);
    }
  }

  return varName;
}
```

- [ ] **Step 5: jsTemplate の関数シグネチャを更新して refs を構築**

```typescript
export function jsTemplate(
  name: string,
  params: string[],
  rootElement: HTMLTagProtocol,
  afterCreate?: (refs: Record<string, string>) => string,
): JsTemplateResult {
  return {
    name,
    params: [...params],
    render(): string {
      const bodyLines: string[] = [];
      const counter = { value: 0 };
      const refs: Record<string, string> = {};
      const rootVarName = walkNode(rootElement, counter, bodyLines, refs);

      const paramsStr = params.join(', ');
      const indented = bodyLines.map(l => `  ${l}`).join('\n');

      const parts = [
        `function ${name}(${paramsStr}) {`,
        indented,
      ];

      // afterCreate コールバックの出力
      if (afterCreate) {
        const afterCode = afterCreate(refs);
        if (afterCode.trim().length > 0) {
          const afterLines = afterCode
            .split('\n')
            .filter(l => l.trim().length > 0)
            .map(l => `  ${l}`)
            .join('\n');
          parts.push(afterLines);
        }
      }

      parts.push(`  return ${rootVarName};`);
      parts.push('}');

      return parts.join('\n');
    },
  };
}
```

- [ ] **Step 6: parseAttributeMap で jsName をスキップ**

実装方針の転換により、`parseAttributeMap` では `jsName` をスキップ**する**（HTML レンダリングに含めないため）。ただし `jsTemplate` が属性リストから検出できるようにするため、`jsName` は別ルートで保持する必要がある。

**最終解決策**: `parseAttributeMap` で `jsName` を特殊な `data-` 属性としてエンコードする:

```typescript
// parseAttributeMap 内
if (key === 'jsName') {
  // jsTemplate 用メタデータ。data-jsname として保存し、HTML出力には含めるが無害。
  // jsTemplate の walkNode で検出して使う。
  result.push(HtmlAttribute.custom('jsname', typeof value === 'string' ? value : ''));
  continue;
}
```

そして `walkNode` で `data-jsname` を検出:

```typescript
// jsName (data-jsname) 属性を検出して変数名に使う
let varName = `el${counter.value++}`;
const jsNameAttr = node.attributes.find(
  a => a.attributeValue.type === 'custom' && a.attributeValue.name === 'jsname'
);
if (jsNameAttr && jsNameAttr.attributeValue.type === 'custom') {
  varName = jsNameAttr.attributeValue.value;
  refs[varName] = varName;
}
```

そして `attrToJsLines` / 属性出力ループで `data-jsname` をスキップ:

```typescript
for (const attr of node.attributes) {
  // data-jsname は jsTemplate 用メタデータ。JS 出力からスキップ。
  if (attr.attributeValue.type === 'custom' && attr.attributeValue.name === 'jsname') continue;
  const attrLines = attrToJsLines(varName, attr);
  for (const line of attrLines) {
    lines.push(line);
  }
}
```

- [ ] **Step 7: テスト実行して全パス確認**

Run: `pnpm vitest run tests/js/js-template-handler.test.ts`
Expected: 全テスト PASS

Run: `pnpm vitest run tests/js/js-template.test.ts`
Expected: 既存テストも全 PASS

- [ ] **Step 8: コミット**

```bash
git add src/js/js-template.ts src/html/tags/factories.ts tests/js/js-template-handler.test.ts
git commit -m "feat(js-2): add jsName for named variable references in jsTemplate"
```

---

### Task 2: afterCreate コールバック（TDD）

**Files:**
- Modify: `tests/js/js-template-handler.test.ts`

- [ ] **Step 1: afterCreate テストを追加**

`tests/js/js-template-handler.test.ts` に追加:

```typescript
describe('jsTemplate afterCreate', () => {
  it('afterCreate コールバックの出力が return 前に挿入される', () => {
    const result = jsTemplate('createBtn', [],
      button({ className: 'btn', jsName: 'btn' }),
      (refs) => `${refs.btn}.addEventListener("click", () => { alert("clicked"); });`,
    );
    const js = result.render();
    const lines = js.split('\n');

    // addEventListener は return の前にある
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
      (refs) => `${refs.btn}.addEventListener("click", () => {
  ${refs.li}.classList.toggle("done");
  const done = ${refs.li}.classList.contains("done");
  ${refs.pill}.textContent = done ? "done" : "active";
  ${refs.pill}.classList.toggle("ok", done);
  ${refs.pill}.classList.toggle("ng", !done);
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
      (refs) => `${refs.el}.style.color = "red";
${refs.el}.style.background = "blue";`,
    );
    const js = result.render();
    expect(js).toContain('  el.style.color = "red";');
    expect(js).toContain('  el.style.background = "blue";');
  });
});
```

- [ ] **Step 2: テスト実行**

Run: `pnpm vitest run tests/js/js-template-handler.test.ts`
Expected: `afterCreate` テストは Task 1 の実装で既に PASS するはず。失敗した場合は修正。

- [ ] **Step 3: 修正が必要な場合のみ実装修正**

Task 1 で `afterCreate` のシグネチャと挿入ロジックは実装済み。テスト失敗があれば修正。

- [ ] **Step 4: 全テスト確認**

Run: `pnpm vitest run`
Expected: 全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add tests/js/js-template-handler.test.ts src/js/js-template.ts
git commit -m "feat(js-2): add afterCreate callback with refs map for event handlers"
```

---

### Task 3: ビルド確認 + 全テスト + コミット

**Files:**
- なし（検証のみ）

- [ ] **Step 1: ビルド確認**

Run: `pnpm run build`
Expected: 成功

- [ ] **Step 2: 全テスト**

Run: `pnpm vitest run`
Expected: 全テスト PASS

- [ ] **Step 3: 最終コミット（必要な場合のみ）**

ビルドやテストで問題が見つかった場合のみ修正してコミット。
