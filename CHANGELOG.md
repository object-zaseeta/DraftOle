# CHANGELOG

このファイルはすべての注目すべき変更を記録する。
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づき、
バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) に従う。

> **Note**: 0.9.0 は pre-1.0 のフィードバック収集フェーズ。公開 API は概ね固まっているが、1.0.0 までは小幅な調整が入る可能性がある。

---

## [Unreleased]

（次リリースに向けた変更を記載）

---

## [0.9.0] - 2026-05-20

DraftOle の最初のパブリックリリース。Page-first View DSL の公開 API がほぼ確定したため、フィードバック収集を目的として 0.9.0 として公開する。

### Notable changes — Legacy low-level API の公開面除去

`legacy-low-level-api-deprecation`（旧 0.2.x 系で `@deprecated` JSDoc を付与）で予告された legacy low-level API 群を **公開 API 面から除去** した。`'draft-ole'` メイン entry および `'draft-ole/app'` secondary entry から該当 named export が消滅する。

**重要 — 内部実装としては保持**: 元定義ファイル（`src/css/variables/global-dsl.ts` / `css-theme.ts` / `css-shared-style.ts` / `tag-dsl.generated.ts` および `src/app/app.ts` の `AppContext` インターフェース）は **私有実装** として継続使用される。これは kept policy の `css.theme` / `css.class` / `css.media` / `css.keyframes` / `sel.*` namespace が legacy 実装を内部で参照しているためである。

詳細な移行手順とコード例は [`docs/migration/legacy-low-level-api.md`](docs/migration/legacy-low-level-api.md) を参照。

#### Removed（公開面から除去された API、内部実装は保持）

| 削除 API | 主導線代替 | 補助代替（`sel.*` 等） |
|---------|----------|--------------------|
| `createTheme` | `css.theme`（薄いエイリアス、入出力等価） | — |
| `createStyle` | `css.class`（薄いエイリアス、入出力等価） | — |
| `tag` / `all` / `rule` / `root` | `css.raw`（escape hatch） | `sel.tag` / `sel.all` / `sel.rule` / `sel.root` |
| `AppContext`（型） | `AppDocument`（`app()` 戻り値型、構造的サブタイプ） | — |
| per-tag shortcuts（`tagA` / `tagAbbr` / … / `tagWbr` 全 112 個） | `css.class` + View プリミティブの `css` プロパティ | `sel.tagA` 〜 `sel.tagWbr` |
| `Root`（公開面非露出の固定） | `page()` / `app()` | — |

### Notable changes — `Page` プリミティブの廃止 / `page()` の variadic 化

`Page` プリミティブが廃止され、`page()` 関数が直接 `StaticView` の可変長引数を受け取るように変更された。

#### 変更内容

- **削除**: `Page` プリミティブ（`StaticView[]` を受け取り `StaticView` を返す関数）
- **変更**: `page(content: Page, opts?)` → `page(...views: StaticView[], opts?)` の variadic シグネチャ
- **追加**: `page()` が内部で `<main>` 要素を自動挿入するようになった

#### 移行方法

`Page(...)` ラッパーを削除し、引数をそのまま `page()` に渡す機械的な書き換えで対応できる。

```ts
// Before（旧形式）
import { Page, page } from 'draft-ole';

page(Page(s1, s2, s3));
page(Page(s1, s2, s3), { title: 'MyPage', style: myStyle });

// After（新形式）
import { page } from 'draft-ole';

page(s1, s2, s3);
page(s1, s2, s3, { title: 'MyPage', style: myStyle });
```

#### 移行パターン早見表

| 旧形式 | 新形式 |
|--------|--------|
| `import { Page, page }` | `import { page }` |
| `page(Page(s1, s2, s3))` | `page(s1, s2, s3)` |
| `page(Page(s1, s2, s3), opts)` | `page(s1, s2, s3, opts)` |

### 公開 API（0.9.0 で安定）

- 主導線: `page` / `app` / View プリミティブ（`Page` / `Section` / `VStack` / `HStack` / `Text` / `Button` / `Heading` 等）
- CSS facade: `css.theme` / `css.class` / `css.raw` / `css.reset` / `css.media` / `css.keyframes`
- Namespace（kept policy）: `sel.{root, all, tag, rule, media, keyframes, tagA, ...tagWbr}`
- At-rule: `media` / `keyframes`（`'draft-ole'` から直接 import 可能）
- 型: `GlobalCss` / `Theme` / `SharedStyle` / `UnifiedTheme` 等

### Distribution

- ESM + CJS + `.d.ts` を `dist/` から提供
- Subpath exports: `draft-ole`（main）/ `draft-ole/page` / `draft-ole/app` / `draft-ole/transformer`
- Node.js 18+

---
