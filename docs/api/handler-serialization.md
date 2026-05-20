# DraftOle ハンドラシリアライゼーション ドキュメント

## 概要

DraftOle の `.on(event, fn)` は TypeScript アロー関数ハンドラを受け付け、**ビルド時**に TypeScript Compiler API ベースのカスタム transformer でその本体を AST 解析・ホワイトリスト検査・JS シリアライズします。

本ドキュメントでは以下を説明します。

- transformer の導入手順（`ts-patch` / esbuild / vite 各経路）
- 許可識別子ホワイトリスト仕様（`BUILTIN_GLOBALS` 表）
- 代表エラー事例（DT001〜DT013）

---

## 導入手順

### 前提条件

```bash
npm install draftole
```

transformer プラグイン本体は `draftole/transformer` からエクスポートされています。

---

### 経路 1: ts-patch（推奨）

`ts-patch` を使用すると、`tsconfig.json` の `compilerOptions.plugins` に transformer を記述するだけで有効化できます。

#### インストール

```bash
npm install --save-dev ts-patch
npx ts-patch install
```

#### tsconfig.json 設定

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "draftole/transformer",
        "type": "program"
      }
    ]
  }
}
```

#### 動作確認

```bash
npx tsc --noEmit
```

transformer が正しく適用されると、ホワイトリスト外のクロージャ捕捉がビルドエラーとして報告されます。

---

### 経路 2: esbuild プラグイン

esbuild で DraftOle プロジェクトをバンドルする場合は、`esbuild-plugin-draftole` を使用します。

#### インストール

```bash
npm install --save-dev esbuild esbuild-plugin-draftole
```

#### build.mjs 設定

```js
import { build } from 'esbuild';
import { draftolePlugin } from 'esbuild-plugin-draftole';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  plugins: [draftolePlugin()],
});
```

#### 注意事項

- esbuild 経路では TypeScript の型チェックは行われません。ホワイトリスト検査のみ動作します。
- 型チェックには別途 `tsc --noEmit` を実行することを推奨します。

---

### 経路 3: vite プラグイン

vite でフロントエンドプロジェクトをビルドする場合は、`vite-plugin-draftole` を使用します。

#### インストール

```bash
npm install --save-dev vite vite-plugin-draftole
```

#### vite.config.ts 設定

```ts
import { defineConfig } from 'vite';
import { draftolePlugin } from 'vite-plugin-draftole';

export default defineConfig({
  plugins: [draftolePlugin()],
});
```

#### 開発サーバーでの確認

```bash
npx vite dev
```

vite の HMR（Hot Module Replacement）環境でも transformer が適用され、ホワイトリスト違反はコンパイルエラーとして即時フィードバックされます。

---

## ホワイトリスト仕様

### BUILTIN_GLOBALS

ハンドラ本体内で参照可能な組み込みグローバル識別子の一覧です。下記以外の外部スコープ変数への参照はホワイトリスト違反（`DT001`）となります。

| 識別子 | 許可内容 | 代表的な使用例 |
|--------|----------|----------------|
| `String` | プリミティブラッパー変換 | `String(value)` |
| `Number` | プリミティブラッパー変換 | `Number(value)` |
| `Boolean` | プリミティブラッパー変換 | `Boolean(value)` |
| `Array` | 配列操作。`isArray` / `from` / `of` メソッドを含む | `Array.isArray(x)`, `Array.from(x)`, `Array.of(1,2,3)` |
| `Math` | 数値演算（`Math.floor`, `Math.max` 等） | `Math.floor(value)` |
| `JSON` | シリアライズ（`stringify` / `parse`） | `JSON.stringify(obj)` |
| `Object` | オブジェクト操作（`keys` / `values` / `entries` / `assign`） | `Object.keys(obj)` |
| `console` | デバッグ用（`console.log` 等） | `console.log(msg)` |
| `confirm` | ブラウザ組み込みダイアログ | `confirm("本当に削除しますか？")` |
| `alert` | ブラウザ組み込みダイアログ | `alert("完了しました")` |
| `prompt` | ブラウザ組み込みダイアログ | `prompt("名前を入力")` |

> **設計原則（D-6）**: ホワイトリストは `src/transformer/whitelist-registry.ts` の `BUILTIN_GLOBALS` 定数で一元定義されています。本ドキュメントの表は同定数から生成されており、真実の源泉は常にソースコード側です。

### 許可される参照の種類

ハンドラ本体では以下の識別子参照が許可されます。

1. **state API**: `root.state(...)` で宣言したステートハンドル（`.get()` / `.set()` / `.update()` / `.map()` / `.field()` / `.each()`）
2. **イベント引数**: `.on` の第 1 パラメータ（例: `(e) => { ... }` の `e`）
3. **ローカル変数**: ハンドラ本体内で宣言した変数
4. **ビルトイングローバル**: 上記 BUILTIN_GLOBALS 表に記載の識別子

---

## 代表エラー事例

### DT001: ホワイトリスト外のクロージャ捕捉

**発生条件**: ハンドラ本体内で、state API・イベント引数・ローカル変数・ビルトイン以外の外部スコープ識別子を参照した場合。

```ts
// NG: module スコープの変数をクロージャ捕捉
const threshold = 100;
button.on('click', (e) => {
  if (value.get() > threshold) { // DT001: 'threshold' は外部スコープ
    value.set(0);
  }
});

// OK: state API に変換する
const threshold = root.state(100);
button.on('click', (e) => {
  if (value.get() > threshold.get()) {
    value.set(0);
  }
});
```

---

### DT002: 空本体の警告

**発生条件**: `() => {}` のように本体が空のアロー関数が渡された場合。ビルドは継続しますが警告が出力されます。

```ts
// Warning: 空本体は実行時に何も行わない
button.on('click', () => {}); // DT002 警告
```

---

### DT003: 非アロー関数

**発生条件**: `.on` の第 2 引数としてアロー関数以外（関数宣言・メソッド参照・変数経由ハンドラ等）が渡された場合。

```ts
// NG: 関数宣言は不可
function handleClick(e) { value.set(0); }
button.on('click', handleClick); // DT003: 非アロー関数

// OK: アロー関数を直接渡す
button.on('click', (e) => { value.set(0); });
```

---

### DT004: async/await 禁止

**発生条件**: ハンドラ本体内に `await` 式が含まれる場合。非同期処理はシリアライズできません。

```ts
// NG
button.on('click', async (e) => {
  const result = await fetchData(); // DT004: async/await は禁止
});

// OK: 同期コードに書き換える
button.on('click', (e) => {
  value.set(cachedData.get());
});
```

---

### DT005: yield/generator 禁止

**発生条件**: ハンドラ本体内に `yield` 式が含まれる場合。Generator 関数はシリアライズできません。

```ts
// NG
button.on('click', function* (e) {
  yield value.get(); // DT005: yield は禁止
});
```

---

### DT006: ++ / -- 禁止

**発生条件**: ハンドラ本体内に後置・前置インクリメント/デクリメント演算子が含まれる場合。

```ts
// NG
button.on('click', (e) => {
  count++; // DT006: ++ は禁止
});

// OK: state.set を使用する
button.on('click', (e) => {
  count.set(count.get() + 1);
});
```

---

### DT007: デコレータ禁止

**発生条件**: ハンドラ本体内にデコレータ構文が含まれる場合。デコレータはシリアライズできません。

```ts
// NG: ハンドラ内でデコレータは使用不可
button.on('click', (e) => {
  @logDecorator // DT007: デコレータは禁止
  class Foo {}
});
```

---

### DT008: 禁止グローバル（window / globalThis）

**発生条件**: ハンドラ内で `window` / `globalThis` / `global` / `self` を参照した場合。シリアライズ後の実行コンテキストではこれらは利用できません。

```ts
// NG
button.on('click', (e) => {
  window.location.href = '/'; // DT008: window は使用不可
});

// OK: state API やイベント引数を使用する
button.on('click', (e) => {
  navTarget.set('/');
});
```

---

### DT009: transformer 内部エラー

**発生条件**: transformer 自体の内部例外が発生した場合。TypeScript API のバージョン非互換等が原因となります。

```
DT009: DraftOle transformer internal error while processing 'xxx'.
This may be caused by a TypeScript version incompatibility.
```

**対処法**: `draftole-transformer` のバージョンと TypeScript のバージョンの組み合わせを確認してください。

---

### DT010: 追加情報・汎用メッセージ

**発生条件**: 上記以外の追加情報提供が必要な場合に表示される汎用メッセージ（`DiagnosticCategory.Message`）。

```
DT010: DraftOle handler validation note for 'xxx'. ...
```

---

### DT011: 解決不能な State 識別子

**発生条件**: ハンドラ内で参照されている State 識別子の `_runtimeId` を、型リテラル経路でもフォールバック (`buildSourceStateNameMap`) でも解決できなかった場合。ヘルパー関数で包んだ `root.state(...)` 生成、配列やオブジェクトへの分割代入、複数 Root を含むファイルなど、フォールバックの非サポートパターンが該当する。

```
DT011: State identifier 'xxx' cannot be resolved without fallback assumptions.
Annotate the State with a string literal type, e.g. root.state<"xxx-id">(...).
```

**対処法**: 該当 State を文字列リテラル型で明示的に注釈する（例: `root.state<"counter-id">(0)`）か、ヘルパー関数を経由せず Root の直下で `const x = root.state(...)` の形式で宣言する。

---

### DT012: ヘルパー関数インライン展開対象外

**発生条件**: `.on(event, () => { helper(); })` のハンドラ本体から呼ばれるヘルパー関数が、inline recovery のサポート形状に合致しない場合に発行される。仕様: [transformer-inline-recovery-spec](../.kiro/specs/transformer-inline-recovery-spec/design.md)。

#### サポート対象（採用条件、すべて AND）

ハンドラ直下の `helper();` 呼び出しが次の 5 条件すべてを満たすときのみインライン展開される:

1. `ExpressionStatement` 直下の `CallExpression` で、callee が単純 `Identifier`
2. 呼び出し引数が **0 個**
3. 解決された宣言が `VariableDeclaration` で、initializer が `ArrowFunction`
4. 解決された arrow の `parameters.length === 0`
5. 宣言を含む `VariableStatement` がモジュールトップレベルかつ宣言キーワードが **`const`**

#### 不採用となる 5 形状（DT012 を発行）

優先順位（先勝ち）:

| 優先 | reason | 例 |
|---|---|---|
| 1 | `function-declaration` | `function helper() {}` |
| 2 | `not-module-level` | ブロック内 / cross-file / import alias |
| 3 | `mutable-binding` | `let helper = () => {};` |
| 4 | `has-parameters` | `const helper = (x) => {};` |
| 5 | `has-arguments` | 呼び出し側 `helper(1);` |

```
DT012: Helper 'helper' is not eligible for inline recovery (has-parameters: helper takes 1 parameter(s)).
Supported shape: zero-argument module-level const arrow function, single level.
```

#### `strictHelpers` オプション

```ts
draftoleTransformer(program, { strictHelpers: true });
```

- 既定 `false`: `Suggestion`。tsc CLI の既定では表示されない可能性があるため、CI で観測したい場合は `strictHelpers: true` を指定する
- `true`: `Warning`。tsc CLI でも常に出力され、CI で境界を強制可能
- いずれも `Error` ではないため、ファイル全体の rewrite 抑制 (`hasFileError`) には寄与しない

#### Out of Boundary（本仕様の対象外）

ヘルパー多引数 / 関数宣言 / ネスト helper の **実サポートは本 spec の Out of Boundary**。サポートを広げる場合は別 spec で段階的に検討する。

---

### DT013: __draftole_label__ 注入不能

**発生条件**: `theme.class(...)` の varName ラベリング対象を検出したが、当該ファイルに DraftOle からの import が存在せず `__draftole_label__` を注入できない場合に発行される。仕様: [class-name-varname-extraction](../.kiro/specs/class-name-varname-extraction/design.md)。

```
DT013: Cannot inject __draftole_label__ for theme.class() varName extraction on 'foo':
no existing DraftOle import found in this file.
The class name will fall back to the anonymous format.
```

- カテゴリは `Suggestion`。`Error` ではないため、ファイル全体の rewrite 抑制 (`hasFileError`) には寄与しない
- 該当 `theme.class()` 呼び出しの wrap はスキップされ、クラス名は匿名フォールバック形式となる
- 修正: DraftOle からの named import（例: `import { Root } from 'draft-ole';`）を当該ファイルに追加する

### DT014: enclosing-helper recovery 不可能な helper 形状

**発生条件**: `.on(arrow)` を内包するモジュールレベル helper を発見したが、採用形状（zero-parameter module-level const arrow function、各 call-site の each-scope context が一貫している）を満たさない場合に発行される。仕様: [helper-inline-recovery](../../.kiro/specs/helper-inline-recovery/design.md) (TXDX-2)。

```
DT014: Enclosing helper 'addButton' is not eligible for inline-recovery
(mutable-binding: helper is declared with let (mutable binding)).
Supported shape: zero-parameter module-level const arrow function with a
consistent each-scope context across all call sites.
```

#### 採用される helper 形状

```ts
// OK: zero-param module-level const arrow
const addButton = () => el.button({}, "Add").on("click", () => {
  todos.set([...todos.get(), { text: "", done: false }]);
});
addButton(); // 単一の呼び出し位置（または .each 文脈一貫した複数 call-sites）
```

#### 不採用となる代表形状（DT014 を発行）

| reason code | 形状 |
|-------------|------|
| `not-module-level` | helper 宣言がブロックスコープ内 |
| `mutable-binding` | `let` で宣言された helper |
| `function-declaration` | `function helper() { ... }` 形式 |
| `non-arrow-initializer` | `const helper = function() { ... }` |
| `has-parameters` | `const helper = (x) => ...` |
| `no-call-sites` | 同一ファイル内に helper の呼び出しがない |
| `ambiguous-call-sites` | 複数 call-site の each-scope context が不一致（混在 / 異なる `item` 名） |

- カテゴリは `Error`。ただし本診断は **当該 handler のみ** スキップさせる目的で発行され、`hasFileError` 集計からは **除外** される（同一ファイル内の他の `.on` 書き換えは継続）
- 修正: helper を上記「採用される形状」に書き直すか、`.on(...)` を呼び出し位置にインライン化する

---

## transformer 未適用時の動作

transformer が適用されていない状態でアロー関数ハンドラを渡した場合、**実行時**に明示的なエラーが投げられます（silent failure 禁止）。

```
Error: DraftOle: arrow-function handler requires the draftole TypeScript transformer;
see docs/api/handler-serialization.md
```

このエラーが出た場合は、上記の導入手順に従って transformer を設定してください。

---

## 関連ファイル

| ファイル | 説明 |
|----------|------|
| `src/transformer/whitelist-registry.ts` | BUILTIN_GLOBALS / FORBIDDEN_SYNTAX の一元定義 |
| `src/transformer/diagnostic-reporter.ts` | DT001〜DT014 エラーコードテーブル |
| `src/transformer/inline-recovery.ts` | ヘルパー関数インライン展開（handler→helper 方向）の採否判定と DT012 診断生成 |
| `src/transformer/helper-context-resolver.ts` | enclosing helper（helper→handler 方向）の発見・eligibility 判定と DT014 診断生成 |
| `src/transformer/whitelist-validator.ts` | ホワイトリスト検査ロジック |
| `src/transformer/handler-serializer.ts` | AST → JS シリアライゼーション |
| `tests/transformer/docs-sync.test.ts` | 本ドキュメントとソースコードの同期テスト |
