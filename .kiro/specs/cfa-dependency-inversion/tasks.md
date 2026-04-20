# Implementation Plan

## Foundation

- [x] 1. Composition Root モジュールの新設
  - `src/composition-root.ts` を新規作成し、デフォルトの `CssManager` / `JQueryManager` 生成を一元化する
  - `createDefaultCssManager()` および `createDefaultJQueryManager()` を純関数として公開（毎回新規インスタンスを返す）
  - `resolveHtmlTagDependencies(options?)` を実装し、部分指定・完全指定・未指定のいずれでも `CssManagerInstance` / `JQueryManagerInstance` 非 null の解決結果を返す
  - `isHtmlTagOptions(value)` 型ガードを実装し、`'css' in value || 'jqm' in value` の構造的チェックで判定する
  - 完了観測: `src/composition-root.ts` が存在し、`tsc --noEmit` が通る／モジュールが `CssManagerInstance` / `JQueryManagerInstance` 型を返却する
  - _Requirements: 3.1, 3.2, 3.4, 4.3_
  - _Boundary: composition-root_

## Core

- [ ] 2. HtmlTag コンストラクタの依存反転
- [x] 2.1 html-tag.ts から具象 import と fallback `new` を除去
  - `src/html/elements/html-tag.ts` から `CssManager` / `JQueryManager` 具象クラスの `import` 行を削除する
  - コンストラクタ内の `options?.css ?? new CssManager()` / `options?.jqm ?? new JQueryManager()` を `resolveHtmlTagDependencies(options)` 呼び出しに置き換える
  - `_css` / `_jqm` に解決結果を代入し、型はプロトコル（`CssManagerInstance` / `JQueryManagerInstance`）のみを参照するように維持する
  - 完了観測: `html-tag.ts` 内で `CssManager` / `JQueryManager` の文字列検索がゼロ件、かつ既存型チェックが通る
  - _Depends: 1_
  - _Requirements: 1.1, 1.2, 1.3, 3.2, 3.3_
  - _Boundary: HtmlTag_

- [ ] 3. Root コンストラクタへの DI 伝播
- [x] 3.1 Root クラスに optional `HtmlTagOptions` を受け付けるシグネチャを追加
  - `src/html/elements/root.ts` の `Root` コンストラクタを `constructor(options?: HtmlTagOptions)` に拡張する
  - 内部で `super('root', options)` に委譲し、子孫ツリーへ同一参照を共有させる
  - 既存の引数なし呼び出し互換を維持する（optional 引数）
  - 完了観測: `new Root()` と `new Root({ css: mockCss, jqm: mockJqm })` がともにコンパイル・動作し、後者では子孫 `HtmlTag` の `_css` / `_jqm` が注入参照と `===` 一致する
  - _Depends: 2.1_
  - _Requirements: 4.1, 4.4, 6.1_
  - _Boundary: Root_

- [ ] 4. factory 関数群への options 伝播
- [x] 4.1 factories-utils.ts のヘルパに options を追加
  - `makePairTag(tagType, args, options?)` および `makeSelfClosingTag(tagType, args, options?)` のシグネチャを拡張する
  - 内部の `new PairType(...)` / `new SelfClosingType(...)` 呼び出しへ `options` を伝播させる
  - 可変長引数末尾の options 抽出ヘルパ（`extractOptions(args)` 等）を用意し、`isHtmlTagOptions` を利用して判別する
  - 完了観測: `makePairTag('div', [{ id: 'x' }], { css: mockCss })` で生成したタグの `_css` が `mockCss` と `===` 一致する
  - _Depends: 2.1, 1_
  - _Requirements: 4.2, 4.3, 6.1_
  - _Boundary: factories-utils_

- [x] 4.2 (P) factories-structure.ts の factory 群で options を末尾引数として受け取る
  - `html`, `head`, `body`, `div`, `section` 等の可変長引数末尾で `isHtmlTagOptions` により options を分離し `makePairTag` / `makeSelfClosingTag` に引き渡す
  - 既存シグネチャの非破壊性（options 省略時の動作）を保つ
  - 完了観測: 代表関数 `html(...)` と `div(...)` の both パターン（options あり／なし）で TS コンパイル通過・既存スナップショット一致
  - _Depends: 4.1_
  - _Requirements: 4.2, 4.4, 6.1, 6.3_
  - _Boundary: factories-structure_

- [x] 4.3 (P) factories-form.ts の factory 群に options を適用
  - `form`, `input`, `button`, `select` 等へ 4.2 と同パターンを適用
  - 完了観測: 代表関数 2 種で options あり／なしの双方が TS 通過・出力一致
  - _Depends: 4.1_
  - _Requirements: 4.2, 4.4, 6.1, 6.3_
  - _Boundary: factories-form_

- [x] 4.4 (P) factories-inline.ts の factory 群に options を適用
  - `span`, `a`, `strong` 等へ同パターンを適用
  - 完了観測: 代表関数 2 種で options あり／なしの双方が TS 通過・出力一致
  - _Depends: 4.1_
  - _Requirements: 4.2, 4.4, 6.1, 6.3_
  - _Boundary: factories-inline_

- [x] 4.5 (P) factories-media.ts の factory 群に options を適用
  - `img`, `video`, `audio` 等へ同パターンを適用
  - 完了観測: 代表関数 2 種で options あり／なしの双方が TS 通過・出力一致
  - _Depends: 4.1_
  - _Requirements: 4.2, 4.4, 6.1, 6.3_
  - _Boundary: factories-media_

- [x] 4.6 (P) factories-semantic.ts の factory 群に options を適用
  - `article`, `nav`, `aside` 等へ同パターンを適用
  - 完了観測: 代表関数 2 種で options あり／なしの双方が TS 通過・出力一致
  - _Depends: 4.1_
  - _Requirements: 4.2, 4.4, 6.1, 6.3_
  - _Boundary: factories-semantic_

- [x] 4.7 (P) factories-data.ts の factory 群に options を適用
  - `table`, `tr`, `td` 等へ同パターンを適用
  - 完了観測: 代表関数 2 種で options あり／なしの双方が TS 通過・出力一致
  - _Depends: 4.1_
  - _Requirements: 4.2, 4.4, 6.1, 6.3_
  - _Boundary: factories-data_

## Integration

- [ ] 5. プロトコル依存方向ガードの追加
- [x] 5.1 ESLint `no-restricted-imports` で html/ および html/protocols/ から css/, js/ 具象への import を禁止
  - プロジェクトの ESLint 設定に overrides を追加し、`src/html/**` および `src/html/protocols/**` を対象ディレクトリとする
  - 禁止パターン: `*/css/manager/*`, `*/js/jquery-manager*`, `*/js/jquery-helper*`
  - ESLint 未導入の場合は単体テストでディレクトリ配下の TS ファイルを走査し禁止 import を検出する fallback を作成する
  - 完了観測: `html-tag.ts` に試しに `import { CssManager } ...` を入れると CI（lint/test）が失敗する
  - _Depends: 2.1_
  - _Requirements: 1.4, 2.1_
  - _Boundary: lint-config_

- [x] 5.2 (P) CssManager / JQueryManager の implements 整合性確認
  - `CssManager implements CssManagerInstance` および `JQueryManager implements JQueryManagerInstance` が宣言されていることを静的検査（`tsc --noEmit`）で確認する
  - プロトコル公開メソッド・プロパティがすべて具象側で満たされているかコンパイルレベルで検証する
  - ソースに `implements` 明示が欠けていれば追加する
  - 完了観測: `tsc --noEmit` が両クラスで implements エラーなし
  - _Depends: 1_
  - _Requirements: 2.2, 2.3, 2.4_
  - _Boundary: CssManager, JQueryManager_

## Validation

- [ ] 6. テスト追加
- [x] 6.1 (P) composition-root.ts の単体テスト
  - options 未指定／部分指定（css のみ／jqm のみ）／完全指定の 4 ケースで `resolveHtmlTagDependencies` の戻り値を検証する
  - 完全指定時は渡した参照と `===` 一致、部分指定時は指定側のみ参照一致・未指定側は `CssManagerInstance` / `JQueryManagerInstance` 契約を満たすデフォルト
  - `isHtmlTagOptions` を `{ css }` / `{ jqm }` / `{ css, jqm }` / `{}` / `{ id: 'x' }` / 文字列 / `null` / `undefined` で網羅検証する
  - 完了観測: 追加したテストが全 PASS し、4 + 8 ケース分のアサーションが実行される
  - _Depends: 1_
  - _Requirements: 3.1, 3.4, 4.3, 5.3_
  - _Boundary: composition-root_

- [x] 6.2 (P) HtmlTag のモック注入単体テスト
  - `CssManagerInstance` / `JQueryManagerInstance` 契約を満たすモック（最小メソッド集合）を用意する
  - モック注入時に `_css` / `_jqm` アクセサ経由で注入参照と `===` 一致することを確認する
  - spy を用いて具象 `CssManager` / `JQueryManager` コンストラクタがモック注入ケースで呼ばれないことを検証する
  - 完了観測: 追加したテストが全 PASS し、具象コンストラクタ非呼び出しアサーションが通る
  - _Depends: 2.1_
  - _Requirements: 1.2, 5.1, 5.2, 5.3_
  - _Boundary: HtmlTag_

- [x] 6.3 factory および Root 経由の DI 伝播統合テスト
  - `new Root({ css: mockCss, jqm: mockJqm })` および `html({ css: mockCss, jqm: mockJqm })` 相当で生成したツリーの全ノードが注入参照を `===` で共有することを確認する
  - options を省略した呼び出しでは従来同様にデフォルト生成されることを確認する
  - 完了観測: 両経路での参照共有アサーションが PASS し、options 省略時の出力が既存スナップショット（または直接比較）と一致する
  - _Depends: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - _Requirements: 4.1, 4.2, 4.4, 5.1, 6.3_
  - _Boundary: Root, factories-*_

- [ ] 7. 既存テストスイート全件回帰と公開 API 不変確認
  - `tsc --noEmit` と既存テストランナーを実行し、2,371 件を全 PASS させる
  - `src/index.ts` の export 一覧に対し改修前後で差分がないことを確認する（シンボル追加なし・削除なし・型シグネチャ不変）
  - options 未指定の代表 factory 呼び出し（`html()`, `div()`, `p()`, `img()`, `table()`）の出力文字列が改修前と一致することを確認する
  - 完了観測: 2,371 件全 PASS、`src/index.ts` 差分が lint 観点でゼロ、代表出力文字列が一致
  - _Depends: 2.1, 3.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 6.1, 6.2, 6.3_
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - _Boundary: 全ライブラリ_
