# JS-1 動的DOM生成

**日付**: 2026-04-11
**ステータス**: 承認済み
**カテゴリ**: JS拡張

## 背景

DraftOle はビルド時にHTML構造を生成するのみ。実行時に `createElement` でDOM要素を動的に追加するパターンをサポートしない。MVP Demoでは `createTodoItem()` を生JS文字列で記述しており、DraftOle DSLの恩恵を受けられない。

### 現状の問題（mvp-demo.ts）

```typescript
const appJs = `function createTodoItem(text) {
  const li = document.createElement("li");
  li.className = "item";
  const span = document.createElement("span");
  span.className = "text";
  span.textContent = text;
  // ... 20行以上の生JS
}`;
```

## 決定事項

| 項目 | 決定 |
|------|------|
| ゴールレベル | createElement ビルダー（DSLで定義→JS関数出力） |
| 関数スコープ | グローバル関数 |
| API設計 | 宣言的ツリー構造（既存タグファクトリを再利用） |
| パラメータ参照 | `param()` マーカー関数 |
| イベントリスナー | JS-2で対応（スコープ外） |

## 設計

### API

```typescript
import { jsTemplate, param, li, span, button } from 'draft-ole';

const createTodoItem = jsTemplate('createTodoItem', ['text'],
  li({ className: 'item' },
    span({ className: 'text', textContent: param('text') }),
    span({ className: 'pill ng', textContent: 'active' }),
    button({ className: 'btn', type: 'button', textContent: 'toggle' }),
  )
);

// 出力
console.log(createTodoItem.render());
```

### 出力されるJS

```javascript
function createTodoItem(text) {
  const el0 = document.createElement("li");
  el0.className = "item";
  const el1 = document.createElement("span");
  el1.className = "text";
  el1.textContent = text;
  el0.appendChild(el1);
  const el2 = document.createElement("span");
  el2.className = "pill ng";
  el2.textContent = "active";
  el0.appendChild(el2);
  const el3 = document.createElement("button");
  el3.className = "btn";
  el3.type = "button";
  el3.textContent = "toggle";
  el0.appendChild(el3);
  return el0;
}
```

### `param()` 関数

```typescript
interface JsParam {
  readonly __jsParam: true;
  readonly name: string;
}

function param(name: string): JsParam {
  return { __jsParam: true, name };
}
```

`param('text')` は特殊なマーカーオブジェクトを返す。JS出力時にプロパティ値がこのマーカーなら、文字列リテラルではなく変数参照として出力する。

- `textContent: 'hello'` → `el.textContent = "hello";`
- `textContent: param('text')` → `el.textContent = text;`

### `jsTemplate()` 関数

```typescript
function jsTemplate(
  name: string,           // JS関数名
  params: string[],       // 引数リスト
  rootElement: PairType,  // DraftOle タグツリー
): JsTemplateResult;
```

`jsTemplate()` は既存の `PairType` ツリーを受け取り、そのツリー構造を再帰的に走査して `createElement` / `appendChild` のJS文を生成する。

### `JsTemplateResult`

```typescript
interface JsTemplateResult {
  readonly name: string;
  readonly params: readonly string[];
  render(): string;
}
```

`render()` が完全なJS関数文字列を返す。

### 対応するプロパティ

DOM要素に設定可能なプロパティ:

| DraftOle属性 | JS出力 | 値の型 |
|-------------|--------|--------|
| `className` | `el.className = "..."` | string / JsParam |
| `textContent` | `el.textContent = "..."` | string / JsParam |
| `id` | `el.id = "..."` | string / JsParam |
| `type` | `el.type = "..."` | string / JsParam |
| その他の属性 | `el.setAttribute("name", "value")` | string / JsParam |

### ツリー走査アルゴリズム

1. ルート要素に `el0` を割り当て
2. `document.createElement(tagType)` を出力
3. 要素の属性を走査し、プロパティ設定文を出力
4. 子要素を再帰的に処理（`el1`, `el2`, ...）
5. 各子要素について `parentEl.appendChild(childEl)` を出力
6. TextType の子要素は `el.textContent = "..."` として出力
7. ルート要素を `return el0;` で返す

### ファイル構成

| 操作 | ファイル | 責務 |
|------|---------|------|
| 新規 | `src/js/js-template.ts` | `jsTemplate()`, `param()`, `JsParam`, `JsTemplateResult` |
| 新規 | `tests/js/js-template.test.ts` | 単体テスト |
| 変更 | `src/index.ts` | `jsTemplate`, `param` エクスポート追加 |

### テスト方針

- 単一要素のJS出力
- ネストされた子要素のJS出力
- `param()` を使った動的値のJS出力
- `textContent` を持つ要素
- 複数の属性を持つ要素
- `setAttribute` フォールバック

## スコープ外

- イベントリスナー（`addEventListener`）→ JS-2
- IIFE / ESM モジュールラップ → 将来
- 式・条件分岐・ループ → 将来
- SelfClosingType（`<img>`, `<input>` 等の動的生成）→ 必要になったら追加
