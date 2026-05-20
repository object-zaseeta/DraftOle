# DraftOle_TS `App` state / binding / event 公開面仕様

更新日: 2026-05-05

## この文書の目的

この文書は `APP-2 state / binding / event の公開面を整理する` のための仕様である。

`App` 境界そのものは `docs/app-boundary.md` で定義済みであり、ここではその中でも **利用者が最初に触る対話 API** を固定する。

決めたいのは 3 点である。

1. state をどう見せるか
2. binding をどう見せるか
3. event をどう見せるか

基準は一貫している。

> `App` の主語は DOM ではなく UI state である。

---

## 1. 背景

現状の実装には、すでに対話性の部品がある。

- `root.state(...)`
- `ReadableState` / `State` / `Computed`
- `bind-text` / `bind-value` / `bind-checked` / `bind-each`
- `ScriptScope.state(...)`
- generic `.on(event, handler)`
- transformer による handler serialization

ただし、これらの多くは **内部機構としては正しいが、そのまま公開主導線に出すには低レベルすぎる**。

たとえば次は内部実装としては問題ないが、初見ユーザー向けの主語にはしたくない。

- `_runtimeId`
- `state.js.get()`
- `bindText(...)`
- `ScriptStateHandle`
- `__draftole__.state(...)`
- `.on('click', ...)` を汎用イベント文字列 API としてだけ教えること

`App` で整理したいのは、この「動く内部」と「見せる公開面」の差である。

---

## 2. 設計原則

### 2.1 state-first

対話 UI の更新は DOM 操作ではなく state 更新として表現する。

- 良い主語: `count.set(...)`, `draft.update(...)`, `todos.each(...)`
- 悪い主語: `$('#count').text(...)`, `script('...')`, `querySelector(...)`

### 2.2 binding は API 名に埋め込む

binding は `bindText(...)` のような別関数ではなく、要素メソッドの値受理として見せる。

- `text(count.map(...))`
- `value(draft)`
- `checked(done)`
- `class(status.map(...))`

### 2.3 event は UI 意味名を優先する

最初に見せるのは `.onClick()` / `.onInput()` / `.onChange()` / `.onSubmit()` のような意味名 API である。

generic `.on(event, ...)` は残してよいが、escape hatch 扱いにする。

### 2.4 低レベル経路は残しても、主導線にはしない

既存の `Root` / `ScriptScope` / `state.js` / `bind-*` は移行互換や内部実装として残してよい。
ただし `App` ドキュメント・README・examples の最初の導線には置かない。

---

## 3. state 公開面

### 3.1 最上位入口

利用者が最初に触る state 入口は、`Root` ではなく **`App` 文脈の state 入口** とする。

現時点では `App` 自体が未実装なので構文は暫定だが、公開面の原則は固定する。

- `app.state(initial)`
- または `AppContext.state(initial)`

少なくとも、初見導線として `new Root().state(initial)` を教えない。

`root.state(...)` は当面の互換経路として残してよいが、分類は次の通りとする。

- `App` 実装後の公開主導線: `app.state(...)`
- 実装前の移行経路: `root.state(...)`

### 3.2 公開する型

`App` 公開面で利用者に見せる型は最小限に絞る。

- `State<T>`
- `Computed<T>`

`ReadableState<T>` は内部共有型としては存在してよいが、初学者向け公開語彙にはしない。

### 3.3 `State<T>` の正規メソッド

`State<T>` に対して利用者へ見せる正規メソッドは次とする。

- `.get()`
- `.set(value)`
- `.update(fn)`
- `.map(fn)`
- `.field(key)`
- `.each(fn)`

各メソッドの役割は次で固定する。

| メソッド | 役割 | 主な利用場所 |
|------|------|------|
| `.get()` | 現在値の参照 | event handler 内 |
| `.set(value)` | 新しい値へ置換 | event handler 内 |
| `.update(fn)` | 前値から更新 | event handler 内 |
| `.map(fn)` | 表示用派生値 | binding 側 |
| `.field(key)` | オブジェクト内の部分 state | binding / event の両方 |
| `.each(fn)` | 配列要素の描画 | children binding |

### 3.4 `.get()` の扱い

`.get()` は公開するが、**描画主導線には使わない**。

推奨:

```ts
Text(count.map((n) => String(n)))
```

非推奨:

```ts
Text(String(count.get()))
```

`get()` は handler 内の更新ロジックで使う。

```ts
button.onClick(() => {
  count.set(count.get() + 1);
});
```

### 3.5 `.update(fn)` の扱い

`App` の公開面では `.update(fn)` を **前値を受け取る高レベル API** として見せる。

```ts
count.update((n) => n + 1);
todo.field('done').update((d) => !d);
```

現実装には `JsExpr` ベースの低レベル更新経路が残っていてよいが、それを `App` の説明の前面には出さない。

### 3.6 `.field(key)` の扱い

`.field(key)` は `App` 公開面に残す。

理由:

- form / object state で自然
- `todo.field('done')` のように item 局所の更新を表現しやすい
- DOM query より UI 意味が明確

### 3.7 `.each(fn)` の扱い

配列描画は `App` 公開面に含める。

正規形は state のメソッドとして扱う。

```ts
todos.each((todo) =>
  li(
    Text(todo.field('text')),
  )
)
```

これにより `bindEach(...)` のような内部語彙を公開しなくて済む。

---

## 4. binding 公開面

### 4.1 基本方針

binding は **専用 helper 名ではなく、要素メソッドへの state 受け入れ** として見せる。

公開主導線:

- `text(stateOrComputed)`
- `value(stateOrComputed)`
- `checked(stateOrComputed)`
- `class(stateOrComputed)`
- `setStyle(prop, stateOrComputed)`
- `appendChild(list.each(...))`

公開主導線にしないもの:

- `bindText`
- `bindValue`
- `bindChecked`
- `bindEach`
- runtime prelude 上の `__draftole__.bind*`

### 4.2 binding の分類

`App` で最初に見せる binding は次の 5 種に限定する。

### A. text binding

```ts
Text('').text(count.map((n) => `${n}`))
```

または

```ts
span().text(activeCount.map((n) => `${n} items`))
```

### B. value binding

```ts
input({ type: 'text' }).value(draft)
```

### C. checked binding

```ts
input({ type: 'checkbox' }).checked(todo.field('done'))
```

### D. class / style binding

```ts
li().class(todo.field('done').map((d) => d ? 'item done' : 'item'))
```

```ts
Text('').setStyle('color', status.map((s) => s ? 'green' : 'gray'))
```

### E. collection binding

```ts
ul().appendChild(
  todos.each((todo) => li(Text(todo.field('text'))))
)
```

### 4.3 one-way binding を標準にする

APP-2 時点では **one-way binding を標準** とする。

つまり、`value(draft)` は state から input への反映を意味するが、input から state への反映は自動化しない。

更新は event handler で明示する。

```ts
input({ type: 'text' })
  .value(draft)
  .onInput((e) => {
    draft.set((e.target as HTMLInputElement).value);
  });
```

この判断により、`v-model` 的な双方向 binding helper を早い段階で導入しなくて済む。

### 4.4 `Computed<T>` の位置づけ

描画用途では `Computed<T>` を積極的に使う。

- `count.map(...)`
- `todo.field('done').map(...)`
- `todos.map(...)`

`Computed<T>` は read-only であり、`.set()` を持たないことを前提に説明する。

### 4.5 非公開にする内部語彙

次は内部実装としては存在してよいが、`App` API ドキュメントの前面には出さない。

- `_runtimeId`
- `state.js`
- `ReadableState`
- `binding-emitter`
- `bind-*` command 名
- `__draftole__.bindText(...)`

---

## 5. event 公開面

### 5.1 最初に見せる API

`App` で最初に見せる event API は意味名付き helper とする。

- `.onClick(handler)`
- `.onInput(handler)`
- `.onChange(handler)`
- `.onSubmit(handler)`

generic `.on(event, handler)` は残してよいが、分類は fallback / advanced とする。

### 5.2 `onXxx` を優先する理由

これにより、利用者の認知負荷を下げられる。

- DOM の event 文字列を最初から覚えなくてよい
- フォーム系の主導線が見える
- `App` の説明が UI 意味で読める

つまり、

```ts
button.on('click', ...)
```

よりも、

```ts
button.onClick(...)
```

を主導線にする。

### 5.3 ハンドラ内で許す主語

`App` ハンドラ内で最初に見せる主語は次である。

- `state.get()`
- `state.set(...)`
- `state.update(...)`
- `event` 引数
- ローカル変数

非推奨または escape hatch 扱い:

- `root.$(...)`
- `root.$$ (...)`
- `jqm`
- `script("...")`
- DOM query ベースの更新

### 5.4 submit の扱い

`onSubmit` は `App` の公開面に含める。

理由:

- form は `App` の最小ユースケースに直結する
- `onClick` / `onInput` / `onChange` だけでは form の主導線が弱い

標準形のイメージ:

```ts
form().onSubmit((e) => {
  e.preventDefault();
  submitCount.update((n) => n + 1);
});
```

### 5.5 既存 `.on(...)` との関係

generic `.on(...)` を消す必要はない。

ただし公開面の序列は次で固定する。

1. `onClick` / `onInput` / `onChange` / `onSubmit`
2. generic `.on(...)`
3. `ScriptScope` / `root.script` / raw JS

---

## 6. 公開するもの / 隠すもの

| 区分 | もの | 扱い |
|------|------|------|
| 公開主導線 | `app.state(...)` | `App` の state 入口 |
| 公開主導線 | `State<T>` / `Computed<T>` | 利用者が意識する型 |
| 公開主導線 | `.text(...)` / `.value(...)` / `.checked(...)` / `.class(...)` | binding の正規形 |
| 公開主導線 | `.onClick()` / `.onInput()` / `.onChange()` / `.onSubmit()` | event の正規形 |
| 公開主導線 | `.map()` / `.field()` / `.each()` | 派生・部分 state・配列描画 |
| 互換経路 | `root.state(...)` | 実装前の移行手段 |
| 互換経路 | generic `.on(...)` | fallback |
| escape hatch | `root.script`, `ScriptScope.state(...)` | 低レベル実験用 |
| 非公開内部 | `_runtimeId`, `state.js`, `ReadableState`, `bind-*`, `__draftole__.*` | docs の前面に出さない |

---

## 7. `App` 最小サンプルの書き味目標

APP-2 の時点で固定したい書き味は次である。

```ts
const count = app.state(0);
const draft = app.state('');

button('Add')
  .text(count.map((n) => n === 0 ? 'Add' : String(n)))
  .onClick(() => {
    count.update((n) => n + 1);
  });

input({ type: 'text' })
  .value(draft)
  .onInput((e) => {
    draft.set((e.target as HTMLInputElement).value);
  });
```

ここで重要なのは次である。

- state が主語
- binding が要素メソッドで読める
- event が UI 意味名で読める
- DOM query や raw script が前面に出てこない

---

## 8. この仕様で固定したこと

1. state の入口は将来 `App` 側に置き、`root.state(...)` は主導線にしない
2. binding は `bindText` ではなく要素メソッドへの state 受け入れとして見せる
3. `State<T>` / `Computed<T>` を最小公開型とし、`ReadableState` など内部型は前面に出さない
4. `.get()` は handler 用、描画は `.map()` と binding で表現する
5. binding の標準は one-way であり、入力から state への反映は event handler で明示する
6. event は `.onClick()` / `.onInput()` / `.onChange()` / `.onSubmit()` を優先し、generic `.on(...)` は fallback に回す
7. `_runtimeId`, `state.js`, `bind-*`, `__draftole__.*` は内部語彙であり、`App` docs の主語にしない

この 7 点が揃っていれば、`APP-2` は完了とみなせる。

---

## 関連文書

- `docs/app-boundary.md`
- `docs/roadmap.md`
- `docs/api/handler-serialization.md`
- `examples/interactive/mvp-demo.ts`
