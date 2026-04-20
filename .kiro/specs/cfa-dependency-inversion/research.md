# Research & Design Decisions — cfa-dependency-inversion

## Summary
- **Feature**: `cfa-dependency-inversion`
- **Discovery Scope**: Extension（既存コードベースの内部リファクタリング）
- **Key Findings**:
  - プロトコル層（`src/html/protocols/`）は既にクリーンで、`src/css/` や `src/js/` への具象 import は存在しない。CFA-A.2 は「現状維持 + 恒久化のためのガード整備」で足りる。
  - `CssManager` / `JQueryManager` は既に対応プロトコル（`CssManagerInstance` / `JQueryManagerInstance`）を `implements` しており、依存方向は概ね正しい。
  - 問題の中核は `src/html/elements/html-tag.ts` L116–117 の `options?.css ?? new CssManager()` / `options?.jqm ?? new JQueryManager()` という直接 `new` fallback と、そのための具象 import（L36–39 付近）。
  - `Root` クラス・factory 関数群（`factories-*.ts` 経由の `makePairTag` / `makeSelfClosingTag`）は `HtmlTagOptions` を受け取らず、常にデフォルト fallback 経由で具象を生成している。DI 伝播路が factory 層で途切れている。
  - アプリケーションコードでの具象 `new CssManager(` / `new JQueryManager(` 出現箇所は `html-tag.ts` の 2 行のみ（docstring 例は除く）。修正範囲は局所的。

## Research Log

### html-tag.ts における具象依存箇所の特定
- **Context**: CFA-A.1 の適用対象を特定するための起点調査
- **Sources Consulted**: `src/html/elements/html-tag.ts`, `src/html/protocols/`, `src/css/manager/css-manager.ts`, `src/js/jquery-manager.ts`
- **Findings**:
  - `html-tag.ts` は `CssManager` と `JQueryManager` の具象クラスを import し、コンストラクタで fallback として `new` している（2 行のみ）。
  - 他のアプリケーションコード（`root.ts`, `factories-*.ts`, `index.ts` 等）は具象クラスを直接 `new` していない。
- **Implications**: Composition Root へ fallback 生成を移譲し、`html-tag.ts` から具象 import を除去すれば CFA-A.1 は達成可能。影響範囲は 1 ファイル + 新規 1 ファイル。

### プロトコル依存方向の検証
- **Context**: CFA-A.2 でプロトコル層に具象依存がないかを確認
- **Sources Consulted**: `src/html/protocols/*.ts` および `protocols/index.ts`
- **Findings**:
  - プロトコル層はすべて型のみを公開し、`src/css/`・`src/js/` 具象モジュールへの import は存在しない。
  - `CssManager` は `CssManagerInstance` を、`JQueryManager` は `JQueryManagerInstance` を既に `implements`。
- **Implications**: CFA-A.2 は既に満たされている。設計上は「依存方向ガード（import 禁止ルール）を恒久化するテスト」を追加することが主作業。

### factory 関数群の DI 伝播状況
- **Context**: CFA-A.3（Composition Root）+ DI 伝播（Req 4）の実装方針策定
- **Sources Consulted**: `src/html/tags/factories-*.ts`, `src/html/tags/factories-utils.ts`, `src/html/elements/root.ts`
- **Findings**:
  - factory 関数は `HtmlTagOptions` を受け取らず、`makePairTag` / `makeSelfClosingTag` も options を伝播させていない。
  - `Root` クラスのコンストラクタも options を受け取らず、`super('root')` のみ呼び出す。
- **Implications**: factory 関数・`Root` コンストラクタ双方へ optional な `HtmlTagOptions` 引数を追加し、内部の `new PairType(...)` / `new SelfClosingType(...)` / `super(...)` 呼び出しへ委譲する必要がある。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Composition Root + Constructor Injection | `composition-root.ts` を単一の依存解決起点とし、各コンストラクタは注入された依存を使う | 既存 `HtmlTagOptions` 基盤と整合・最小変更・テスト容易 | 利用者が深い階層で差し替えたい場合に options 伝播が必要 | 本スペックで採用 |
| Service Locator / Global Registry | グローバルに現行実装を登録し各所で lookup | 伝播コスト小 | 暗黙依存・テスト並列実行で状態共有事故 | 棄却（本プロジェクトの型安全方針に反する） |
| Factory Interface Abstraction | `CssManagerFactory` / `JQueryManagerFactory` インターフェースをプロトコル層に追加 | 生成戦略の差し替えが可能 | Phase 1 の 1:1 移植方針を超える設計拡張 | Out-of-scope（CFA-B/C と併せて将来検討） |

## Design Decisions

### Decision: Composition Root を関数ベースで提供する
- **Context**: デフォルト `CssManager` / `JQueryManager` の生成責務を一元化する
- **Alternatives Considered**:
  1. クラス（`CompositionRoot`）にして `getDefaultCss()` 等のメソッドを公開
  2. シングルトン関数群を `composition-root.ts` から export（`createDefaultCssManager()` 等）
  3. オブジェクトリテラルで defaults を export
- **Selected Approach**: 2（関数群を export）。`resolveHtmlTagDependencies(options?: HtmlTagOptions): Required<HtmlTagOptions>` と、個別の `createDefaultCssManager()` / `createDefaultJQueryManager()` をセットで公開。
- **Rationale**: 最小構成で副作用（状態共有）を持たず、純粋関数として毎回新規インスタンスを返せる。現行の `new CssManager()` 毎回生成セマンティクスを保存できる。
- **Trade-offs**: シングルトン共有は提供しないため、利用側が参照共有したい場合は自分で options を保持する責務を負う（Req 4.4 の「利用者指定の同一参照を共有」とは矛盾しない）。
- **Follow-up**: モック注入テストで関数経由の fallback が働くことを確認する。

### Decision: `html-tag.ts` 側の fallback を `resolveHtmlTagDependencies` 呼び出しに置き換える
- **Context**: 具象 import を除去しつつデフォルト生成の挙動を維持する
- **Alternatives Considered**:
  1. `html-tag.ts` 内で `??` による 2 回の関数呼び出し（`createDefaultCssManager` / `createDefaultJQueryManager`）
  2. Composition Root に集約した `resolveHtmlTagDependencies(options)` 1 回呼び出し
- **Selected Approach**: 2。コンストラクタは `const deps = resolveHtmlTagDependencies(options)` を呼び、`deps.css` / `deps.jqm` を使用する。
- **Rationale**: 将来の依存追加時に呼び出し箇所を増やさずに済む。テスト時は `options` 完全指定で関数内デフォルト生成が発生しないことを検証しやすい。
- **Trade-offs**: 軽微な間接化（関数 1 層）。パフォーマンス影響は無視できる。

### Decision: `Root` と factory 関数群へ optional `HtmlTagOptions` を追加
- **Context**: Req 4（DI 伝播）を満たすための API 拡張
- **Alternatives Considered**:
  1. factory 関数すべてにシグネチャを追加
  2. factory 引数の末尾に optional `HtmlTagOptions` を追加
  3. 新規 `createRootWithOptions(options)` 関数を追加し既存 factory は変更せず
- **Selected Approach**: 2 を基本に、`Root` コンストラクタと `makePairTag` / `makeSelfClosingTag` ヘルパへ optional `HtmlTagOptions` を追加する。外部 factory（`html()`, `div()` ... など多数）は既存シグネチャを維持しつつ、末尾に optional 引数を追加できる形で統一する（後方互換）。
- **Rationale**: 既存 API シグネチャを破壊せず、必要なときだけ DI を指示できる。Req 6（後方互換）とも整合。
- **Trade-offs**: factory の引数処理で `AttributeMap | ChildArg | HtmlTagOptions` の判別ロジックが必要になる箇所がある（既存の attribute/child 判別に倣う）。
- **Follow-up**: 判別ロジックのテストを追加。

### Decision: プロトコル依存方向ガードテストを追加
- **Context**: CFA-A.2 は現状満たされているが、退行を防ぐ恒久策が必要
- **Alternatives Considered**:
  1. Lint ルール（ESLint `no-restricted-imports`）で `src/html/**` からの `src/css/**` / `src/js/**` 具象 import を禁止
  2. 単体テストで AST/文字列スキャンにより禁止 import を検出
  3. ドキュメントのみで運用ルールとして明示
- **Selected Approach**: 1（ESLint ルール追加）を第一選択。プロジェクトの既存 lint 設定に従う。ESLint 未導入の場合は 2 で代替。
- **Rationale**: 静的検査で CI ゲート化でき、テスト実行より軽量。
- **Follow-up**: 実装タスクで既存 lint 設定を確認し、ルール追加位置を決定する。

## Risks & Mitigations
- **Risk 1**: factory 関数の引数末尾に `HtmlTagOptions` を追加すると、既存利用側の可変長引数（`AttributeMap | ChildArg`）との型判別で誤判定が起こる可能性。  
  **Mitigation**: `HtmlTagOptions` 判別用の型ガード（`isHtmlTagOptions(value): value is HtmlTagOptions`）を Composition Root に同梱し、`factories-utils.ts` で一元利用する。型ガードは `'css' in value || 'jqm' in value` 等の構造的チェックで実装する。
- **Risk 2**: Composition Root 導入により、テスト時に実体生成が発生しないはずが、モック不完全により fallback が働く。  
  **Mitigation**: モック注入テストで `resolveHtmlTagDependencies` を spy し、モック提供時にデフォルト生成関数が呼ばれないことを検証する。
- **Risk 3**: 既存 2,371 件テストの互換性劣化。  
  **Mitigation**: 既存テストを変更せず全件 PASS を維持するのを完了条件にする。`tsc --noEmit` とテスト全走を CI で実施。

## References
- Martin, Robert C. *Agile Software Development, Principles, Patterns, and Practices* — Dependency Inversion Principle
- Mark Seemann, *Composition Root* — https://blog.ploeh.dk/2011/07/28/CompositionRoot/
- 本プロジェクト: `src/html/elements/html-tag.ts`, `src/html/protocols/`, `src/css/manager/css-manager.ts`, `src/js/jquery-manager.ts`
