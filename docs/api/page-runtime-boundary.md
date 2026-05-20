# `page` Runtime 境界仕様（解説）

> **本文書の位置づけ**: 本ドキュメントは `page` 公開面と runtime 実装の境界について `page` 利用者向けの解説を行う**従属文書**である。`Root` の責務分類に関する**識別の正本（normative source）は `.kiro/specs/page-runtime-separation-spec/design.md` §3.5** であり、両者に齟齬がある場合は design.md §3.5 を優先する。本文書はその表を引用したうえで利用ガイドを補足するに留まる。

関連要件: `requirements.md` §4.2, §4.3（内部実装としての `Root` 再利用）

---

## 1. 背景

DraftOle_TS の `page` は **静的 HTML / CSS のみを出力する公開面**であり、interactive runtime（`state()`, `script`, `$`, `$$`, `jqm`, binding, event 等）は `page` から到達できない。一方で実装上は `Root`（`src/html/elements/root.ts`）を内部再利用しているため、`Root` の各責務が `page` 利用者から見て「使ってよいもの」「使えないもの」「そもそも見えないもの」「別経路に置換されるもの」のいずれに該当するのかを明確化する必要がある。

design.md §3.5 はこの分類を以下の 4 区分で正規化している。

- **page-facing**: `PageDocument` 経由で `page` 利用者に間接公開される責務
- **internal-only**: `page()` の内部実装でのみ使用され、`page` 公開面には露出しない責務
- **hidden**: `Root` 上には存続するが、`page` 公開面のいかなる型・関数からも到達不能であることを architecture test が保証する責務
- **replaced**: `page` 経路では `Root` 側の実装を呼ばず、別経路（`StaticPageWriter`）に置き換えられる責務

---

## 2. 責務分類表（design.md §3.5 引用）

> 以下の表は design.md §3.5 からの引用である。識別の正本は design.md 側にある。

| `Root` 責務 / API | 区分 | 根拠 / 置換先 | 関連要件 |
|------------------|------|--------------|---------|
| `addChild()` | internal-only | `page()` 内部での html ツリー組み立てに使用。`PageDocument` 経由では露出しない | 4.1, 4.2 |
| `protoRender()` | internal-only | `StaticView` interface の最小契約として露出するが、`page` caller が直接呼ぶことは想定しない | 4.1, 4.2 |
| `render()` | page-facing（経由） | `PageDocument.render()` がラップして公開。`Root` 自身は外に出さない | 5.1, 5.2 |
| `collectCssStyleString()` | page-facing（経由） | 同上。静的 CSS 収集として `PageDocument` から間接公開 | 5.1, 5.2 |
| `export()` | replaced | `Root.export()` 経由ではなく **`StaticPageWriter`** へ置換。`FileExporter` を通さない | 2.1, 2.2, 5.1 |
| `state<T>()`, `_stateRegistry` | hidden | `page` 公開面から到達不能。`StaticView` interface に含めない | 1.1, 3.1 |
| `renderJs()`, `renderVanillaScript()`, `collectJsContent()`, `collectUsedMethods()` | hidden（検証用に内部参照のみ） | 出力には絶対に使わない。`page()` 構築時の **静的性検証 walk** からのみ参照する | 2.1, 2.2, 3.1, 3.2, 7.1 |
| `jqm` facade, `script`, `$`, `$$`, binding helpers | hidden | `StaticView` interface に存在しないため `page` caller は到達不能 | 1.1, 1.2, 3.1, 3.2 |
| `setDoctype()` / `_doctype` | internal-only | `page()` 内部で doctype を有効化する用途のみ | 5.1 |
| `addGlobalCss()` / `_globalCss` / reset CSS | internal-only（限定再利用） | 静的 CSS 機能として `PageDocument` 経由で将来再利用余地あり。初期 scope では `page()` 引数に追加しない | 5.2 |

**Hidden の意味**: API そのものは `Root` 上に存続する（制約「既存 `Root` API は直ちに削除しない」）が、`page` 公開面のいかなる型・関数からも到達不能であることを architecture test が保証する。

**Replaced の意味**: `page` 経路では `Root` 側の実装を呼ばず、別経路（`StaticPageWriter`）に置き換える。`Root` 側の API は interactive 経路でそのまま使われる。

---

## 3. `page` 利用者向けガイド

### 3.1 使ってよい API（page-facing）

`page` 利用者が直接呼んでよいのは、`page()` が返す `PageDocument` の以下のメソッドのみである。

- `PageDocument.render()` — 静的 HTML 文字列を返す。runtime prelude は一切含まない。
- `PageDocument.export()` — `StaticPageWriter` 経由で HTML / CSS をファイル出力する。`FileExporter` は通らない。
- `PageDocument` から間接公開される CSS 収集（`collectCssStyleString()` 相当の出力）

これらはすべて静的出力に限定されており、JS runtime や prelude は出力に紛れ込まない。

### 3.2 使えない API と、本来の経路

以下は `page` 公開面からは到達不能である（`StaticView` interface に存在せず、`view/index.ts` 経由でも露出しない）。これらを使いたい場合は **`page` ではなく、interactive 用 API（将来の `App` / island 経路、または既存の低レベル `Root` 直接利用経路）** を選択する必要がある。

| 使えない API（`page` 経路で到達不能） | 区分 | 本来の経路 |
|--------------------------------------|------|-----------|
| `state<T>()` / `_stateRegistry` | hidden | interactive 経路（`Root` 直接 / 将来の `App`） |
| `renderJs()` / `renderVanillaScript()` / `collectJsContent()` / `collectUsedMethods()` | hidden | `Root` + `FileExporter`（interactive 経路） |
| `jqm` facade / `script` / `$` / `$$` / binding helpers | hidden | interactive 経路（`Root` 直接 / 将来の `App`） |
| `Root.export()` | replaced | `page` では `StaticPageWriter` に置換。interactive で必要なら `Root` を直接使う |
| `Root.addChild()` / `Root.protoRender()` | internal-only | `page` 内部実装。利用者は `page()` ファクトリ経由で構築する |
| `Root.setDoctype()` / `addGlobalCss()` | internal-only | 現 scope では `page()` 引数で代替手段を提供しない（将来拡張余地あり） |

**注意**: hidden / replaced 区分の API を `page` 経由で呼ぶ抜け道は architecture test で恒常的に塞がれている（要件 7.1 / design.md §3.5 末尾）。

### 3.3 将来の `App` 経路の予告

design.md §6（将来の `App` / island との境界）に基づき、interactive runtime を必要とするユースケースは将来別途用意される **`App` / island 公開面**で扱う予定である。`page` はあくまで「静的優先（static-first）」の公開面として位置づけられ、`App` の runtime を `page` に流し込むことは設計上禁じられている。

`App` 仕様が起票された時点で、本文書および design.md §3.5 は再検証の対象となる（design.md §3 *Revalidation Triggers* 参照）。それまでの間、interactive な機能が必要な箇所は `Root` を直接利用する低レベル経路を一時的に使うこと。

---

## 4. 参照

- 識別の正本: `.kiro/specs/page-runtime-separation-spec/design.md` §3.5
- 関連要件: `.kiro/specs/page-runtime-separation-spec/requirements.md` §4.2, §4.3
- 依存方向: design.md §4.1（静的経路 / interactive 経路の分離）
- 静的性保証テスト: `tests/architecture/root-boundary.test.ts`（要件 7.1）
