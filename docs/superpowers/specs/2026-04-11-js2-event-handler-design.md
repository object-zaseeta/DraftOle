# JS-2 イベントハンドラ関数本体

**日付**: 2026-04-11
**ステータス**: 承認済み
**カテゴリ**: JS拡張

## 背景

JS-1 で `jsTemplate()` による宣言的DOM生成を実装した。しかし、生成した要素にイベントリスナーを追加する手段がない。MVP Demoでは `btn.addEventListener("click", () => { ... })` のようなハンドラが必要だが、現状は生JS文字列で別途記述するしかない。

JQueryManager の `on()` メソッドは既にインライン関数を文字列として受け取れる（技術的には動く）が、本質的なニーズは `jsTemplate` 内で生成した要素にリスナーを付けること。

## 決定事項

| 項目 | 決定 |
|------|------|
| 記述方法 | 生JS文字列（A案） |
| 出力形式 | 既存 JQueryManager の `on()` 拡張ではなく `jsTemplate` に `afterCreate` 追加 |
| 要素参照 | `jsName` による名前付き参照（位置ベース `el0` ではなく） |

## 設計

### API

```typescript
const createTodoItem = jsTemplate('createTodoItem', ['text'],
  li({ className: 'item', jsName: 'li' },
    span({ className: 'text', textContent: param('text'), jsName: 'label' }),
    span({ className: 'pill ng', textContent: 'active', jsName: 'pill' }),
    button({ className: 'btn', type: 'button', textContent: 'toggle', jsName: 'btn' }),
  ),
  (refs) => `
${refs.btn}.addEventListener("click", () => {
  ${refs.li}.classList.toggle("done");
  const done = ${refs.li}.classList.contains("done");
  ${refs.pill}.textContent = done ? "done" : "active";
  ${refs.pill}.classList.toggle("ok", done);
  ${refs.pill}.classList.toggle("ng", !done);
  updateCount();
});`
);
```

### 出力されるJS

```javascript
function createTodoItem(text) {
  const li = document.createElement("li");
  li.className = "item";
  const label = document.createElement("span");
  label.className = "text";
  label.textContent = text;
  li.appendChild(label);
  const pill = document.createElement("span");
  pill.className = "pill ng";
  pill.textContent = "active";
  li.appendChild(pill);
  const btn = document.createElement("button");
  btn.className = "btn";
  btn.type = "button";
  btn.textContent = "toggle";
  li.appendChild(btn);
  btn.addEventListener("click", () => {
    li.classList.toggle("done");
    const done = li.classList.contains("done");
    pill.textContent = done ? "done" : "active";
    pill.classList.toggle("ok", done);
    pill.classList.toggle("ng", !done);
    updateCount();
  });
  return li;
}
```

### `jsName` の仕組み

- `AttributeMap` の特殊キー
- `jsTemplate` のツリー走査時に検出し、`el0` の代わりにその名前を変数名として使用
- HTML出力には含めない（DOM属性としてレンダリングしない）
- `jsName` がない要素は従来通り `el0`, `el1`... で採番

### `afterCreate` コールバック

```typescript
function jsTemplate(
  name: string,
  params: string[],
  rootElement: HTMLTagProtocol,
  afterCreate?: (refs: Record<string, string>) => string,
): JsTemplateResult;
```

- 第4引数にコールバック関数を渡す（オプション）
- `refs` は `{ jsName: 実際の変数名 }` のマップ
- コールバックの戻り値（生JS文字列）が `return` 文の直前に挿入される
- `afterCreate` なしの場合は JS-1 と同じ動作（後方互換）

### ファイル構成

| 操作 | ファイル | 責務 |
|------|---------|------|
| 変更 | `src/js/js-template.ts` | `afterCreate` 引数追加、`jsName` 検出、名前付き変数 |
| 変更 | `src/html/tags/factories.ts` | `jsName` を HTML 出力から除外 |
| 新規 | `tests/js/js-template-handler.test.ts` | イベントハンドラのテスト |

## スコープ外

- ビルダーパターンでのロジック記述
- `addEventListener` の自動生成ヘルパー
- JQueryManager の `on()` 変更（既に動く）
