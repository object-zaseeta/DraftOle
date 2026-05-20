# `createTheme` と `createStyle` の使い分け

DraftOle の CSS API は **値の語彙** と **ルールの語彙** を別レイヤとして提供する。
両者は置き換え可能ではなく、併用することを前提に設計されている。

## サマリ

| API | 役割 | 出力 | 例えるなら |
|---|---|---|---|
| `createTheme` | デザイントークン（CSS Custom Properties）を定義 | `:root { --name: value; }` ブロックと、`var(--name)` を返すアクセサ | デザインシステムの「変数表」 |
| `createStyle` | クラスベース CSS ルールを定義 | `.className { … }` ルール（疑似/複合/子孫セレクタ含む） | SwiftUI の `ViewModifier` |

## `createTheme` — デザイントークン

- ソース: [`src/css/variables/css-theme.ts`](../../src/css/variables/css-theme.ts)
- 用途: 色・スペーシング・半径・フォントなど、**値を一元管理** して複数箇所から参照させたいとき。
- 戻り値: 各プロパティが `var(--name)` 文字列、`.css` で `:root { … }` ブロックを得る。

```ts
const theme = createTheme({
  bg: '#0b1220',
  accent: '#7c5cff',
  radius: '14px',
});

root.addGlobalCss(theme.css);
// → :root { --bg: #0b1220; --accent: #7c5cff; --radius: 14px; }

div().background(theme.bg);
// → background-color: var(--bg);
```

トークンの差し替え（ダーク/ライト切り替えなど）は `:root` の上書きだけで済むため、
利用側のコードを書き換えずにテーマ変更が可能になる。

## `createStyle` — 共有 CSS ルール

- ソース: [`src/css/variables/css-shared-style.ts`](../../src/css/variables/css-shared-style.ts)
- 用途: 複数要素に **同じ見た目（プロパティ群 + ホバーなどの状態）** を当てたいとき。
- 戻り値:
  - 名前あり形 `createStyle('btn', props, selectors?)` → `SharedStyle`（`.className` を要素に適用）
  - 名前なし形 `createStyle(props, selectors?)` → `StyleTemplate`（colocated パイプライン用）
- セレクタキーの規則:
  - `hover` / `focus` / `active` / … → `.name:hover`
  - `&.modifier` → `.name.modifier`
  - ` .child`（先頭スペース）→ `.name .child`
  - `&.state .child` → `.name.state .child`

```ts
const btn = createStyle('btn', {
  padding: '10px 12px',
  cursor: 'pointer',
}, {
  hover: { background: 'rgba(255,255,255,0.10)' },
  '&.primary': { borderColor: '#7c5cff' },
});

root.addGlobalCss(btn.css);
button().className(btn.className);
```

## 使い分け基準

| 状況 | 使う API |
|---|---|
| 色・スペーシング・フォントなどの **値** を共通化したい | `createTheme` |
| プロパティ群と疑似状態をまとめて **複数要素に再利用** したい | `createStyle` |
| 一回限り、その要素に閉じた装飾 | どちらも不要。`.background()` 等を直接呼ぶ |

## 推奨パターン: 併用

両方を組み合わせるのが標準形。`createStyle` の値として `createTheme` のトークンを埋め込む。

```ts
const theme = createTheme({
  bg: '#0b1220',
  accent: '#7c5cff',
  radius: '14px',
});

const btn = createStyle('btn', {
  background: theme.bg,         // ← トークン参照
  borderColor: theme.accent,
  borderRadius: theme.radius,
}, {
  hover: { background: theme.accent },
});

root.addGlobalCss(theme.css);
root.addGlobalCss(btn.css);
```

### 注意点

- `createStyle` のプロパティ値に色や寸法を **直書き** すると、後でテーマ化するときに
  `createStyle` 側を全部書き換えることになる。最初から `createTheme` 経由の値を
  渡しておくのが安全。
- `createTheme` だけでは要素に「形」を与えられない（値の語彙にすぎない）。
  形を与えるのは `createStyle`、または DSL 側の `.background()` / `.padding()` 等。
- 両 API とも `sanitizeCssValue` を通しており、`url(javascript:...)` などの危険な
  値は無音で除去される。サニタイズ後に空になった値は出力からも省かれる。

## 関連

- [page-api.md](./page-api.md) — Page/Root レベルでの `addGlobalCss` と適用順序
- `tests/css/css-theme.test.ts` / `tests/css/css-shared-style.test.ts` — 期待される
  出力形式の正典としての挙動仕様
