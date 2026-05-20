# DraftOle Deprecation Policy（非推奨 API の取り扱い方針）

> このドキュメントは、DraftOle における **legacy low-level API の非推奨化（deprecation）方針** を定義する単一ソースである。  
> 個別の `@deprecated` JSDoc コメントおよび CHANGELOG の Deprecation セクションは、本ドキュメントを参照することで一貫した文体・期限・代替経路を示す。  
> 関連 spec: `legacy-low-level-api-deprecation`、`legacy-low-level-api-removal`、`state-deprecated-methods-removal-plan`、`public-surface-positioning-sync`。

---

## Scope

本 policy が対象とする API グループ（**in-scope**, `@deprecated` JSDoc 付与対象）と、対象外（**kept**, 主導線または at-rule として並存維持）を以下に整理する。

### In-scope（`@deprecated` 付与対象）

| API グループ | 元定義 | 代替経路（推奨） |
|--------------|--------|------------------|
| **low-level CSS DSL** — `tag` / `all` / `rule` / `root` | `src/css/variables/global-dsl.ts` | `css.class`（要素単位合成）/ `css.theme` / `css.raw`（最終手段） |
| **per-tag shortcuts** — `tagA` / `tagAbbr` / `tagDiv` / ... （100+ 個、生成ファイル） | `src/css/variables/tag-dsl.generated.ts` | 要素単位クラス合成（`css.class` + View プリミティブの `css` プロパティ） |
| **`createTheme`** | `src/css/variables/css-theme.ts` | `css.theme` |
| **`createStyle`** | `src/css/variables/css-shared-style.ts` | `css.class` |
| **`AppContext`** | `src/app/app.ts`（type 再エクスポート: `src/app/index.ts`） | `app()` 経由の App context（主導線）|
| **`Root` 経路**（過渡期 facade を含む） | `src/html/elements/root.ts` 周辺 | `page()` / `app()` 経由の主導線 |

### Kept（`@deprecated` 対象外、主導線または並存 API）

| カテゴリ | シンボル |
|----------|----------|
| **主導線エントリ** | `page` / `app` |
| **View プリミティブ** | `Button` / `Heading` / `HStack` / `VStack` / `Section` / `Spacer` / `Image` / `Link` / `Text as ViewText` / `AppSlot` |
| **`css` namespace facade** | `css.theme` / `css.class` / `css.raw` / `css.reset` / `css.media` / `css.keyframes` 等 |
| **at-rule（並存維持）** | `media` / `keyframes`（`css.media` / `css.keyframes` と並存）|
| **`sel` namespace 自体** | namespace 配下個別関数のみ `@deprecated` を付与し、`sel` namespace そのものには付与しない（`sel.media` / `sel.keyframes` への strikethrough 副作用を回避する方針）|

---

## Warning Method

本 policy における warning 伝達方式は **JSDoc only** とする。

**理由:**

- runtime 動作・型シグネチャを変更しないため、`console.warn` 等の runtime warning は emit しない（Req 2.6 準拠、利用者の本番ログを汚さない）。
- 型レベル warning（型エラー化）も採用しない（既存利用者のビルドを破壊しないため）。
- IDE LSP（TypeScript Language Service）が JSDoc `@deprecated` タグを解釈し、シンボル参照箇所に **strikethrough（取り消し線）表示** を行う。利用者は IDE hover で代替経路と削除予告を確認できる。

**採用しない手段:**

- runtime warning（`console.warn` / カスタムロガー等）
- 型レベル warning（`@ts-expect-error` 強制 / 戻り値型に `@deprecated` brand を混入する等）
- ESLint カスタムルール等の外部ツール経由 warning

---

## Grace Period

非推奨化されたシンボルは、**0.2.0 〜 1.0.0 直前までの全 `0.x.y` minor バージョン** で deprecated 状態のまま継続提供される。

- **開始**: `legacy-low-level-api-deprecation` spec の実装が含まれる minor リリース（想定: 0.2.0 系以降）。
- **終了**: `1.0.0` 直前の最後の `0.x.y` リリース。
- **猶予中の保証**:
  - runtime 動作不変（既存コードはそのまま動作する）。
  - 型シグネチャ不変（既存型定義は変わらない）。
  - シンボル削除なし（import が解決できなくなることはない）。
- **利用者の移行ペース**: 任意。IDE の strikethrough 表示を参照しながら、各プロジェクトの都合で主導線へ書き換える。

---

## Target Removal Version

deprecated シンボルの削除は **`1.0.0` リリース時（次の major bump）** に一括で実施する。

- 削除実施 spec: `legacy-low-level-api-removal`（本 spec とは別、major bump と同時に進行）。
- `1.0.0` リリースは **breaking change** として CHANGELOG に明示される。
- 利用者は `1.0.0` への upgrade 前に、deprecated シンボルを代替経路へ書き換える必要がある。
- patch / minor リリース（`0.x.y`）では削除しない（後方互換保証のため）。

---

## Cross-Spec Integration

本 policy は他の deprecation spec の **前提・参照点** として機能する。

### `state-deprecated-methods-removal-plan` との整合

`State<T>.get()` / `State<T>.set()` の deprecation も、当該 spec 起票時に以下を採用する想定である:

| 項目 | 採用する値 |
|------|------------|
| Warning Method | JSDoc only（本 policy §Warning Method と同じ）|
| Grace Period | `0.x.y` 系全 minor バージョン（本 policy §Grace Period と同じ）|
| Target Removal Version | `1.0.0`（本 policy §Target Removal Version と同じ）|

当該 spec の起票時に、本 policy を引用するか、本 policy と整合する別 policy を当該 spec 内で再定義するかは、後続 spec 起票時に判断する。本 policy はそのいずれの選択肢も成立するように、対象 API を限定して記述している（State 系には踏み込まない）。

### `legacy-low-level-api-removal` との接続（**1.0.0 で完了**）

本 policy で **予告された削除** を、`legacy-low-level-api-removal` spec が **1.0.0 リリースで実行済み**。

**完了スコープ**:
- 公開 API 面（`src/index.ts` / `src/app/index.ts` / `src/entries/app.ts` / `src/app/app.ts`）から本 policy 対象 API の named export を全件除去
- 元定義 4 ファイル（`src/css/variables/global-dsl.ts` / `css-theme.ts` / `css-shared-style.ts` / `tag-dsl.generated.ts`）および `src/app/app.ts` の `AppContext` インターフェース内 JSDoc を **`@deprecated` → `@internal`** に書き換え

**Out of scope（将来 Phase 2 spec として検討）**:
- 元定義 4 ファイル + 生成スクリプト `scripts/gen-tag-dsl.ts` の **物理削除**
- `Root` クラス（`src/html/elements/root.ts`）の物理削除と主導線 document/runtime/export 束ね責務の再構築

**Why partial removal**: kept policy の `css.theme` / `css.class` / `css.media` / `css.keyframes` および `sel.*` namespace（`sel.root` / `sel.all` / `sel.tag` / `sel.rule` / `sel.media` / `sel.keyframes` / `sel.tagA` 〜 `sel.tagWbr`）はこれら legacy 元実装を内部で参照しているため、物理削除には主導線側の refactor が必要。本 spec では Option A（私有実装として保持 + 公開面のみ除去）を採用し、Phase 2 spec を別途検討する方針とした。詳細は `.kiro/specs/legacy-low-level-api-removal/research.md` §5.5 参照。

利用者向け移行手順は [`docs/migration/legacy-low-level-api.md`](migration/legacy-low-level-api.md) を参照。

---

## Non-Goals

本 policy では以下を **行わない**。これらは将来別 spec で扱うか、あるいは恒久的に対象外とする。

- **runtime warning の emit** — `console.warn` / 環境変数による有効化等は採用しない。
- **型レベル warning** — 型エラー化 / 型 brand 混入による警告は採用しない。
- **`sel` namespace 全体への `@deprecated` 付与** — 配下の個別関数のみ `@deprecated` とし、`sel` namespace そのものには付与しない（`sel.media` / `sel.keyframes` への strikethrough 副作用を避ける）。
- **`media` / `keyframes` への `@deprecated` 付与** — at-rule として `css.media` / `css.keyframes` と並存させる（並存維持が既定）。
- **本仕様内での migration guide 詳細化** — 各 deprecated シンボルから代替経路への移行例集（`docs/migration/legacy-low-level-api.md` 等の詳細化）は本 policy のスコープ外。後段 `legacy-low-level-api-removal` の前段で別タスクとして整備する。
- **policy doc とコード JSDoc の自動同期検証** — CI による語彙整合チェック等は本仕様のスコープ外。policy 変更時は手動レビューで JSDoc を同時更新する運用とする。

---

## JSDoc Template

各 deprecated シンボルの JSDoc は、本節のテンプレートに整合する文面とする。テンプレートは **「再エクスポート側用」** と **「元定義側用」** の 2 種類を用意する（相対パスがファイル位置によって異なるため）。

### 再エクスポート側用（例: `src/index.ts` の `createTheme` 再エクスポート）

```ts
/**
 * @deprecated `css.theme` の利用を推奨。`createTheme` は後方互換のため 0.x.y 系で維持されるが、
 * **1.0.0 で削除予定**。詳細は [docs/deprecation-policy.md](../docs/deprecation-policy.md) 参照。
 */
export { createTheme } from "./css/variables/css-theme";
```

### 元定義側用（例: `src/css/variables/css-theme.ts` 内の `createTheme` 定義）

```ts
/**
 * @deprecated `css.theme` の利用を推奨。`createTheme` は後方互換のため 0.x.y 系で維持されるが、
 * **1.0.0 で削除予定**。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export function createTheme(/* ... */) {
  /* ... */
}
```

### 相対パスの調整について

`docs/deprecation-policy.md` への Markdown リンクの相対パスは、JSDoc を記述するファイルの階層によって異なる。各定義ファイルでは適切な相対パスに調整すること（IDE で hover した際にリンクが解決されることが望ましいが、解決失敗時もテキストとして読める前提で許容する）。

| 元ファイル位置 | 相対パス例 |
|----------------|------------|
| `src/index.ts` | `../docs/deprecation-policy.md` |
| `src/app/*.ts`（例: `src/app/index.ts`、`src/app/app.ts`）| `../../docs/deprecation-policy.md` |
| `src/css/variables/*.ts`（例: `css-theme.ts`、`global-dsl.ts`）| `../../../docs/deprecation-policy.md` |

### テンプレートが満たすべき 3 要素（Req 3.1 準拠）

各 JSDoc ブロックは以下 3 要素を必ず含むこと:

1. **`@deprecated` タグ** — IDE LSP が strikethrough を表示するために必須。
2. **推奨代替経路（symbol 名 + 概要）** — 利用者が「何へ書き換えるか」を hover で読み取れるようにする。代替経路が 1:1 で存在しない場合は複数経路（例: `css.theme` / `css.raw`）を列挙する（Req 3.2 準拠）。
3. **削除予告 version** — `1.0.0 で削除予定` の文言で明示し、本 policy への Markdown リンクを付ける（Req 3.5 準拠）。

文体は **日本語ベース + 英語 `@deprecated` タグの混在** で統一し、既存 JSDoc（`createTheme` / `createStyle` / `root` / `all` / `tag` / `rule` / `AppContext`）の語調と一貫させる（Req 3.3 準拠）。
