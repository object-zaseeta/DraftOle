# DraftOle Examples

このディレクトリは **`page` から入って interactive へ進む** 順序で読むことを推奨します。  
DraftOle は現在 **static page first** の View DSL です。最初の数本は `page()` と View プリミティブだけで完結し、interactive ランタイム（`App` 相当・埋め込み JS）は advanced 例として末尾に位置づけています。

---

## 1. Get started — `page()` 最小例

最初に読む 1 本。`page()` がどう書け、何を出力するかをここで掴みます。

| 例 | 目的 | 実行 |
| --- | --- | --- |
| [`page-minimal.ts`](page-minimal.ts) | `page()` + `Page` / `Section` / `VStack` / `HStack` / `Text` の最小構成。modifier 6 種（`.font` / `.padding` / `.foregroundStyle` / `.background` / `.frame` / `.cornerRadius`）を一通り使う | `pnpm tsx examples/page-minimal.ts` |

---

## 2. Static page examples — LP レベルの発展

`page-minimal` の次に読みます。複数セクションを組み合わせてランディングページ相当を組む例です。

| 例 | 目的 | 実行 |
| --- | --- | --- |
| [`page-landing.ts`](page-landing.ts) | Hero / Feature / CTA / Footer の 4 セクション LP。`featureCard()` のような小ヘルパで View を再利用する | `pnpm tsx examples/page-landing.ts` |

---

## 3. Layout / Modifier showcase — 個別パターンの参照

特定の UI パターンを公開 Fluent API のみで宣言的に書くサンプル。`declarative-api-verification` spec の DX Rubric 定量評価サンプルです。  
順番に読む必要はなく、必要なときに参照してください。

| ショーケース | 目的 | 実行 | Swift 版想定行数 |
| --- | --- | --- | --- |
| **Card** ([`showcase-card.ts`](showcase-card.ts)) | `.padding` / `.background` / `.cornerRadius` / `.boxShadow` の単一チェーン記述 | `pnpm tsx examples/showcase-card.ts` | 9 行 |
| **Button** ([`showcase-button.ts`](showcase-button.ts)) | `padding` + `background` + `color` + `:hover` 擬似クラス（`createStyle` の selectors 経由） | `pnpm tsx examples/showcase-button.ts` | 11 行 |
| **List** ([`showcase-list.ts`](showcase-list.ts)) | `.grid()` と `.flex()` を組み合わせたテーブル風レイアウト | `pnpm tsx examples/showcase-list.ts` | 12 行 |

`tsx` が未インストールの環境では Node.js の型ストリップ機能にフォールバックできます:

```bash
node --experimental-strip-types examples/showcase-card.ts
```

ショーケース実行前に `pnpm build` で `dist/` を作っておいてください。

### Swift 版との行数比較方針

各ショーケースのヘッダコメントに記載された「Swift 版想定行数」に対して、TS 版の本体記述行数が **±30% に収まること** を DX Rubric の定量閾値とします。  
- 下限: `floor(Swift 行数 × 0.7)`  
- 上限: `ceil(Swift 行数 × 1.3)`

逸脱した場合は Fluent API のギャップとして記録し、GATE-A 前検討候補に積みます。

---

## 4. Interactive / Advanced examples

`page` の static path とは別の、interactive ランタイム / 既存 `Root` API を使った発展例です。  
`page` 入口を理解した後で読むことを想定しています。

| 例 | 位置づけ | 実行 |
| --- | --- | --- |
| [`interactive/mvp-demo.ts`](interactive/mvp-demo.ts) | **interactive / advanced** — `Root` + `html/body/div` + `createVanillaScript` を用いた Todo アプリ。テーマ・scoped スタイル・埋め込み JS を一式含む。`page` の static path とは別系統 | `pnpm demo:mvp` |
| [`interactive/priority-tasks.ts`](interactive/priority-tasks.ts) | Priority Task Manager (3 優先度 + each-template-auto-id 全機能ショーケース) | `pnpm demo:priority-tasks` |
| [`interactive/shopping-cart.ts`](interactive/shopping-cart.ts) | Shopping Cart (api-ergonomics 全機能ショーケース) | `pnpm demo:shopping-cart` |
| [`interactive/react-demo.tsx`](interactive/react-demo.tsx) | React 連携パターン（外部ランタイムとの統合例） | — |

過去の MVP 期段階バリエーション (`mvp-demo0.ts` 〜 `mvp-demo9.ts`、`mvp-demo-colocated.ts`、`mvp-demo-showcase.ts`) は **retire 済み** (git 履歴で参照可能)。`tests/examples/fixtures/` 配下に残るのは `mvp-demo-helper.ts` (test 専用 helper) と `mvp-demo-transformed.fixture.ts` (transformer post-output specimen) の 2 件のみ。

### `mvp-demo` の出力先

```
.out/runs/mvp_demo/
├── index.html
├── style.css
└── script.js
```

ブラウザでの確認:

```bash
open .out/runs/mvp_demo/index.html
```

---

## 読み順サマリ

```
page-minimal.ts  →  page-landing.ts  →  showcase-* (任意)  →  interactive/mvp-demo.ts (advanced)
```

外向きの主導線は **page first**。`interactive/mvp-demo.ts` および `Root/html/body` 系は **降格された advanced reference** であり、新規利用の最初の例として配置しません。

---

## 役割境界 policy

新規 example ファイルを追加するときは `examples/` と `tests/examples/fixtures/` の役割境界を必ず確認してください。  
判断基準・命名規約（`.fixture.ts` suffix）・新規追加時のフローチャートは [役割境界 policy](../docs/positioning.md#examples-と-testsexamplesfixtures-の役割境界) に正本としてまとめてあります。  
本 README は読み順の主導線のみを示し、policy 本文は positioning.md 側を単一情報源とします。
