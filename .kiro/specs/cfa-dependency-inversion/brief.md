# Brief: cfa-dependency-inversion

## Problem
`html-tag.ts` が `CssManager`・`JQueryManager` の具象クラスを直接 import して `new` しているため、html/ → css/, js/ という逆方向依存が生じている。テスト時にモック注入ができず、将来の設計拡張も困難。

## Current State
- `HtmlTagOptions`（`css?`, `jqm?`）は既存だが、fallback で `new CssManager()` / `new JQueryManager()` を直接生成している
- プロトコルファイル（`css-manager-type.ts`, `jquery-manager-protocol.ts`）は存在するが、具象型への依存が残っている可能性がある
- Composition Root が存在せず、具象クラスの生成がコード全体に散在している

## Desired Outcome
- `html-tag.ts` が `CssManager` / `JQueryManager` の具象クラスを import しない
- プロトコル定義が `protocols/` 内で完結し、css/, js/ がそれを実装する形になっている
- `src/composition-root.ts` がデフォルトのインスタンス生成を一元管理する
- テスト時にモックを注入できる
- 外部公開APIに破壊的変更なし

## Approach
既存の `HtmlTagOptions` DI基盤を活用しつつ、fallback の直接生成を Composition Root に移譲する。プロトコルの依存方向を修正し、html/ が css/, js/ に依存しない構造にする。

## Scope
- **In**:
  - `html-tag.ts` から具象 `CssManager` / `JQueryManager` の import・直接生成を除去（CFA-A.1）
  - `protocols/` 内プロトコルの具象依存を解消（CFA-A.2）
  - `src/composition-root.ts` 新規作成（CFA-A.3）
  - `root.ts` および factory 関数群への DI オプション伝播
- **Out**:
  - 外部公開APIの変更
  - CssManager / JQueryManager 自体の実装変更
  - ファイル分割（CFA-B）
  - 型定義分散（CFA-C）

## Boundary Candidates
- プロトコル定義の整理（CFA-A.2）
- Composition Root の設計（CFA-A.3）
- factory 関数群への伝播範囲

## Out of Boundary
- `CssManager` / `JQueryManager` の実装ロジック変更
- パブリック API（`src/index.ts`）の変更
- テストファイルの大規模書き換え（モック注入テストの追加は対象内）

## Upstream / Downstream
- **Upstream**: 現行の `HtmlTagOptions` DI基盤、既存プロトコルファイル
- **Downstream**: JS-1（動的DOM生成）、JS-2（ハンドラ関数本体）の設計品質向上

## Constraints
- 外部公開APIの後方互換性を維持すること
- 既存 2,371 テストが全 PASS であること
