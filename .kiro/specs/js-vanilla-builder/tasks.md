# Implementation Plan

- [ ] 1. 基盤: 共有型とモジュール構造のセットアップ
- [x] 1.1 `src/js/vanilla/` モジュールスケルトンと共有型を整備する
  - `src/js/vanilla/` ディレクトリを作成し、`index.ts` / `types.ts` / `element-ref.ts` / `commands.ts` / `vanilla-script-builder.ts` / `event-api.ts` / `query-api.ts` / `dom-api.ts` / `tree-api.ts` / `integration.ts` の空ファイル（最低限の export 骨格のみ）を配置する
  - `types.ts` に `JsExpr` / `JsBoolExpr` / `ElementEventName`（`keyof HTMLElementEventMap` エイリアス）/ `EventArgRef<K>` / `StringKeysOf` / `WritableStyleKey` を宣言する
  - `src/index.ts` から `src/js/vanilla/index.ts` を再エクスポートする行を追加し、既存 export を変更しない
  - 観測可能な完了状態: `tsc --noEmit` が strict mode で通り、`src/index.ts` 経由で新モジュールの公開エントリが import 解決できる
  - _Requirements: 7.3_
  - _Boundary: src/js/vanilla (scaffolding)_

- [ ] 2. 要素参照と命令レコード層の実装
- [x] 2.1 (P) `ElementRef` / `ElementListRef` と生成関数を実装する
  - `ref(varName)` / `fromSelector(selector)` / `fromExpr(code)` を実装し、`kind` と `code` を正しく生成する
  - `textContent` / `value`（`value` は `HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement` 条件型）を `JsExpr` として返す
  - `JsExpr` のチェーンメソッド（`eq` / `ne` / `or` / `trim` / `isFalsy` / `isTruthy`）を純関数として実装し、入力文字列は `JSON.stringify` でクォートする
  - 空文字 / 無効な JS 識別子が `ref()` に渡された場合は `Error` を投げる
  - 観測可能な完了状態: `ref("x").textContent.code === "x.textContent"`、`fromSelector("#a").code === 'document.querySelector("#a")'` 等のユニットテストが通る
  - _Requirements: 2.4, 4.1, 4.2, 6.1, 6.2_
  - _Boundary: element-ref, types_

- [x] 2.2 (P) `VanillaCommand` 判別共用体と文字列化関数を実装する
  - `VanillaCommand` の全バリアント（`addEventListener` / `domReady` / `declareFunction` / `declareConst` / `classListToggle` / `classListAdd` / `classListRemove` / `setProp` / `setStyle` / `appendChild` / `remove` / `forEach` / `if` / `expr` / `raw`）を定義する
  - `renderCommand(cmd)` を `switch` + `exhaustive default`（`never` チェック）で実装し、各命令の JS 文字列化を集約する
  - `renderCommands(cmds, indent)` が各行に indent を付与して直列化する
  - セレクタ文字列・クラス名・テキスト値は `JSON.stringify` でクォートし、生成結果に `jQuery` / `$` を出力しない
  - 観測可能な完了状態: 各命令に対する期待 JS 文字列のスナップショットテストが通り、出力全体を正規表現で検査しても `jQuery` / `$` が含まれない
  - _Requirements: 1.5, 7.1, 7.4_
  - _Boundary: commands_

- [ ] 3. `VanillaScriptBuilder` 蓄積器と `VanillaScope` の実装
- [x] 3.1 Builder 本体とスコープ生成を実装する
  - `VanillaScriptBuilder` クラスに、トップレベル命令キュー / `declareFunction` ごとのキュー / 単一 `onDomReady` キュー（複数呼び出しを合流）を持たせる
  - `append(cmd)` / `onDomReady(body)` / `declareFunction(name, params, body)` / `fn(name, body)`（1/2 引数オーバーロード） を実装する
  - `render()` を冪等な文字列生成として実装し、`hasDomReady` を `onDomReady` 呼び出しの有無で返す
  - 子スコープ（関数本体・`onDomReady` 本体・`forEach` 本体・`ifThen` 本体・イベントハンドラ本体）用の子 Builder を生成し、文字列化結果だけを親に持ち上げる仕組みを実装する
  - `VanillaScope` インターフェースを実装し、`raw(code)` / `let(name, value)` / `call(name, args?)` / `return()` / `ifThen(cond, then, else?)` を提供する
  - `createVanillaScript()` ファクトリ関数を公開し、クラスの直接 import を避ける
  - 観測可能な完了状態: 複数の `append` と `onDomReady` の合流・`fn` 出力を含む最小シナリオで、`append` 順が `render()` 出力順と完全に一致し、`hasDomReady` フラグが期待通りに反転する
  - _Requirements: 1.3, 1.5, 7.1, 7.2, 7.4_
  - _Boundary: vanilla-script-builder_
  - _Depends: 2.2_

- [ ] 4. ユーザ向け API レイヤの実装
- [ ] 4.1 (P) イベント登録 API (`on` / `onDomReady`) を実装する
  - `on<K extends keyof HTMLElementEventMap>(target, event, handler)` で `addEventListener` 命令を append する
  - ハンドラ本体は子 `VanillaScope` で組み立て、イベント引数名は固定の `"e"` で出力する（`(e) => { ... }`）
  - `EventArgRef<K>` を構築し、`HTMLElementEventMap[K]` の文字列/数値/真偽プロパティを `JsExpr` として露出する
  - `onDomReady(handler)` を Builder の `onDomReady` へ委譲し、ネスト呼び出しは `Error` を投げる
  - `target === 'document'` のケースで `document.addEventListener(...)` を出力できる
  - 観測可能な完了状態: `on(ref, "keydown", (s, e) => s.ifThen(e.key.eq("Enter"), ...))` で `addEventListener("keydown", (e) => { if (e.key === "Enter") { ... } })` 相当の文字列が生成され、型レベルテスト（`expectTypeOf`）で `e` が `KeyboardEvent` 派生として推論される
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - _Boundary: event-api_
  - _Depends: 2.1, 3.1_

- [ ] 4.2 (P) DOM クエリ API (`query` / `queryAll` / `forEach` / `filterNot` / `length` / `cache`) を実装する
  - `query(sel)` / `queryAll(sel)` で `kind: "selector"` / `"listSelector"` の参照を返す（セレクタは `JSON.stringify` でクォート）
  - `forEach(list, body)` で `forEach` 命令を発行し、子スコープで項目名 `item` を束縛した `ElementRef` を渡す
  - `filterNot(list, predicate)` / `length(list)` は合成 `JsExpr` を返し、`Array.from(...).filter(...).length` 形で埋め込まれる
  - `ElementRef.cache(name?)` を実装し、現在スコープに `declareConst` 命令を append してから `kind: "var"` の新参照を返す
  - 空文字セレクタを拒否する検証を入れる
  - 観測可能な完了状態: `queryAll("#a .b").filterNot(it => it.containsClass("done")).length.code` が `Array.from(document.querySelectorAll("#a .b")).filter(x => !x.classList.contains("done")).length` と等価な文字列になる
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - _Boundary: query-api_
  - _Depends: 2.1, 3.1_

- [ ] 4.3 (P) クラス・プロパティ・スタイル操作 API を実装する
  - `toggleClass(el, name, force?)` / `addClass` / `removeClass` / `containsClass`（`JsBoolExpr` を返す）を実装する
  - `setText` / `getText` / `setValue` / `getValue` を実装し、`setValue` は要素型を `HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement` に型制約する
  - `setStyle<K extends WritableStyleKey>(el, key, value)` を実装し、`WritableStyleKey` が `CSSStyleDeclaration` の書き込み可能プロパティのみを抽出する
  - 文字列値は `JSON.stringify` でクォートし、`JsExpr` は未クォートで挿入する
  - 観測可能な完了状態: `toggleClass(el, "done")` / `setStyle(el, "borderColor", "red")` / `setValue(ref<HTMLInputElement>, "")` が期待通りの JS 文字列を生成し、`setStyle(el, "nonexistent", ...)` が tsc 型エラーになる type-level テストが通る
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_
  - _Boundary: dom-api_
  - _Depends: 2.1, 3.1_

- [ ] 4.4 (P) DOM ツリー操作 API (`appendChild` / `remove` / `removeAll`) を実装する
  - `appendChild(parent, child)` で `child` に `ElementRef` または `JsExpr`（関数呼び出し結果など）を受け取れるようにする
  - `remove(el)` で単一要素 remove 命令、`removeAll(list)` で `list.forEach(el => el.remove())` 相当の命令を発行する
  - 観測可能な完了状態: `appendChild(parent, call("createTodoItem", [text]))` が `parent.appendChild(createTodoItem(text));` として出力され、`removeAll(queryAll(".done"))` が `forEach` 系の期待 JS に変換される
  - _Requirements: 5.1, 5.2, 5.3, 6.2_
  - _Boundary: tree-api_
  - _Depends: 2.1, 3.1_

- [ ] 5. `jsTemplate` 統合
- [ ] 5.1 `attach()` ブリッジと `jsName` 参照共有を実装する
  - `attach(build)` を実装し、`jsTemplate` の `afterCreate(refs)` 契約に一致するコールバックを返す
  - 内部で一時 Builder を生成し、`refs[jsName]` を `ref(jsName)` に変換して `VanillaScope` に渡す
  - `attach` 内では `onDomReady` / `declareFunction` 呼び出しを検出して `Error` を投げる
  - `jsTemplate()` の既存公開シグネチャ（`JsTemplateResult` / `afterCreate` 契約）を一切変更しない
  - 観測可能な完了状態: 既存 `jsTemplate` を使ったユニットテストが全て緑のまま、`attach` が返すコールバックが `refs["root"]` を正しく参照するバニラ JS 本体文字列を返す
  - _Requirements: 6.1, 6.2, 6.3_
  - _Boundary: integration, js-template (参照のみ)_
  - _Depends: 3.1_

- [ ] 6. 公開 API 集約と mvp-demo の書き換え
- [ ] 6.1 `src/js/vanilla/index.ts` から公開 API を確定する
  - `createVanillaScript` / `ref` / `attach` と公開型（`ElementRef` / `ElementListRef` / `VanillaScript` / `VanillaScope` / `JsExpr` / `JsBoolExpr` / `EventArgRef` / `WritableStyleKey`）のみを export する
  - 命令レコード型やブリッジ内部型は export しない
  - `src/index.ts` から上記のみを再エクスポートする
  - 観測可能な完了状態: `import { createVanillaScript, ref, attach } from 'draftole'` が解決でき、非公開内部型は外から import できない（tsc で失敗する）
  - _Requirements: 7.3, 8.1_
  - _Boundary: src/js/vanilla/index, src/index_
  - _Depends: 4.1, 4.2, 4.3, 4.4, 5.1_

- [ ] 6.2 `examples/mvp-demo.ts` の `appJs` を本ビルダー呼び出しへ置換する
  - `updateCount` / `clearDone` / `addTodo` を `script.fn(...)` で組み、`script.onDomReady(...)` 内にイベント登録と初期化呼び出しを記述する
  - 生 JS のテンプレートリテラル / 文字列リテラルを撤去し、`exporter.export(..., script.render(), ...)` に差し替える
  - `hasDomReady === true` のため `wrapDOMReady` は適用しない
  - 観測可能な完了状態: ビルド後に `output/mvp_demo/script.js` が生成され、実行時の可視挙動（追加・完了トグル・完了クリア・件数表示・Enter 投入）が従来版と同等になる
  - _Requirements: 8.1, 8.2, 8.4_
  - _Boundary: examples/mvp-demo_
  - _Depends: 6.1_

- [ ] 7. 検証・回帰テスト
- [ ] 7.1 (P) ユニット/型レベルテストを追加する
  - `tests/js/vanilla/` 配下に `vanilla-script.test.ts` / `event-api.test.ts` / `query-api.test.ts` / `dom-api.test.ts` / `tree-api.test.ts` / `integration.test.ts` を作成する
  - 命令→JS 文字列のスナップショット、`append` 順と出力順の一致、`jQuery` / `$` 非混入を正規表現で検証する
  - `expectTypeOf` 等で `on` のイベント引数型推論、`setValue` の要素型制約、`WritableStyleKey` の抽出結果を検証する
  - 観測可能な完了状態: `vitest run tests/js/vanilla` が全テスト緑で完了し、スナップショットが安定する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 7.1, 7.4_
  - _Boundary: tests/js/vanilla_
  - _Depends: 6.1_

- [ ] 7.2 (P) `mvp-demo` パリティテストとリポジトリ衛生テストを追加する
  - `tests/js/vanilla/mvp-demo-parity.test.ts` で本ビルダー生成結果と旧 `appJs` を空白正規化後にトークナイズ比較し、`DOMContentLoaded` 登録・ハンドラ骨格・セレクタ 1 回評価パターンの一致を検証する
  - `tests/repo-source-js.test.ts` でリポジトリ直下の `.js` ファイルが `eslint.config.js` のみであること（`dist/` / `output/` / `node_modules/` 除外）を検証する
  - `tests/examples-raw-js.test.ts` で `examples/**.{ts,tsx}` 中に `addEventListener` / `querySelector` を含む長大テンプレートリテラルが残存しないことを検証する
  - 観測可能な完了状態: 3 本のテストが緑で通り、`examples/` と直下の衛生条件が CI で継続検知できる
  - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - _Boundary: tests (repo-level)_
  - _Depends: 6.2_
