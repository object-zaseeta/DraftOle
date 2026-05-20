# View DSL — よくある落とし穴

更新日: 2026-05-05

`'draft-ole'` から View DSL を使うときに踏みやすい API の落とし穴をまとめる。

---

## 1. `ViewText as Text` — `Text` の名前衝突

### 問題

`'draft-ole'` のトップレベル export には **2 つの `Text`** が存在する。

| 名前 | 実体 | 用途 |
|------|------|------|
| `Text` | `TextType`（HTML タグ層） | 低レベル html DSL |
| `ViewText` | View DSL の Text プリミティブ | `page()` + View DSL |

`Text` をそのまま import して View DSL で使うと、HTML タグ層の TextType として扱われるため、
出力が `<p>` ではなく生テキストに近い形になり、スタイルが期待通りに当たらない。

### 解決策

```ts
// NG: TextType が import される
import { Text } from 'draft-ole';

// OK: ViewText を Text として alias する
import { ViewText as Text } from 'draft-ole';
```

以降は `Text('Hello')` と書けば View DSL のプリミティブとして動く。

### 参考: showcase での実際の import

```ts
import { HStack, Page, Section, ViewText as Text, VStack, page } from 'draft-ole';
```

---

## 2. `PseudoStyleBuilder` — `.hover()` 内で使えないメソッド

### 問題

`.hover(s => s.XXX())` のコールバックで受け取る `s` は `PseudoStyleBuilder` であり、
View modifier と同名でも **存在しないメソッドがある**。

最も踏みやすいのは `.foregroundStyle()` の不在である。

```ts
// NG: PseudoStyleBuilder に foregroundStyle() は存在しない
btn.hover((s) => s.background('#333').foregroundStyle('#fff'));
//                                    ^^^^^^^^^^^^^^^^^ TypeError
```

### 解決策

ホバー時のテキスト色には `.color()` を使う。

```ts
// OK
btn.hover((s) => s.background('#333').color('#fff'));
```

### `PseudoStyleBuilder` の利用可能なメソッド一覧

| メソッド | 対応 CSS プロパティ |
|----------|-------------------|
| `.color(v)` | `color` |
| `.background(v)` | `background` |
| `.backgroundColor(v)` | `background-color` |
| `.opacity(v)` | `opacity` |
| `.transform(v)` | `transform` |
| `.boxShadow(v)` | `box-shadow` |
| `.border(v)` | `border` |
| `.borderColor(v)` | `border-color` |
| `.borderRadius(v)` | `border-radius` |
| `.fontSize(v)` | `font-size` |
| `.fontWeight(v)` | `font-weight` |
| `.textDecoration(v)` | `text-decoration` |
| `.padding(v)` | `padding` |
| `.width(v)` | `width` |
| `.height(v)` | `height` |
| `.cursor(v)` | `cursor` |
| `.transition(v)` | `transition` |
| `.set(prop, val)` | 任意プロパティ |

View modifier の `.foregroundStyle()` / `.font()` / `.frame()` 等は **存在しない**。

---

## 3. `GridOptions` — `columns` vs `templateColumns`

### 問題

`.grid()` modifier に渡す `GridOptions` の列指定プロパティ名は `columns` であり、
CSS の `grid-template-columns` を連想して `templateColumns` と書くと型エラーになる。

```ts
// NG
HStack(...).grid({ templateColumns: '1fr 1fr 1fr', gap: '8px' });
//           ^^^^^^^^^^^^^^^ 存在しないプロパティ

// OK
HStack(...).grid({ columns: '1fr 1fr 1fr', gap: '8px' });
```

### `GridOptions` のプロパティ一覧

| プロパティ | 対応 CSS プロパティ | 備考 |
|-----------|-------------------|------|
| `columns` | `grid-template-columns` | 列定義 |
| `rows` | `grid-template-rows` | 行定義 |
| `gap` | `gap` | 行・列共通の隙間 |
| `areas` | `grid-template-areas` | 名前付きエリア |
| `autoFlow` | `grid-auto-flow` | 自動配置方向 |

---

---

## 4. `Page` プリミティブの廃止（破壊的変更）

### 問題

`Page` プリミティブは **廃止済み** であり、`'draft-ole'` からエクスポートされなくなった。
旧 API である `page(Page(s1, s2, s3), opts)` を使用するとコンパイルエラーが発生する。

```ts
// NG: Page は廃止されたためインポートできない
import { Page, page } from 'draft-ole';
//       ^^^^ エラー: 'Page' は 'draft-ole' からエクスポートされていません

// NG: Page を使った旧形式の呼び出し
page(Page(s1, s2, s3), { title: 'MyPage' });
```

### 解決策

`page()` が直接 `StaticView` の可変長引数を受け取るようになった。
`Page(...)` ラッパーを外してそのまま `page()` に渡すだけで移行できる。

```ts
// OK: 新形式（Page ラッパー不要）
import { page } from 'draft-ole';

// Before: page(Page(s1, s2, s3), { ...opts })
// After:
page(s1, s2, s3, { title: 'MyPage' });

// Before: page(Page(s1, s2, s3))
// After:
page(s1, s2, s3);
```

### 移行パターン早見表

| 旧形式 | 新形式 |
|--------|--------|
| `page(Page(s1, s2, s3))` | `page(s1, s2, s3)` |
| `page(Page(s1, s2, s3), opts)` | `page(s1, s2, s3, opts)` |
| `import { Page, page }` | `import { page }` |

### `<main>` の自動挿入について

新 API では `page()` が内部で自動的に `<main>` 要素を挿入する。
旧 API で手動で `<main>` を追加していた場合は、重複しないよう注意する。

---

## まとめ

| 落とし穴 | 正しい書き方 |
|---------|------------|
| `import { Text }` | `import { ViewText as Text }` |
| `.hover(s => s.foregroundStyle(...))` | `.hover(s => s.color(...))` |
| `.grid({ templateColumns: ... })` | `.grid({ columns: ... })` |
| `page(Page(s1, s2, s3), opts)` | `page(s1, s2, s3, opts)` |
