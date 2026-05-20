# DraftOle_TS `page` + `App` 共存検証仕様

更新日: 2026-05-06

## この文書の目的

この文書は `APPX-2 page を壊さずに動的性を載せられるか検証する` のための仕様である。

ここで決めたいのは、新しい対話 API を増やすことではない。まず固定したいのは、**`page` の static-first 契約を保ったまま、動的 UI をどの形なら共存させてよいか** である。

今回の検証対象は「interactive island を正式導入するか」ではない。`docs/interactive-island-decision.md` の結論どおり、P3 の現時点では island は採らない。そのうえで、`page` と `App` をどう並べて使うなら設計を壊さないかを判断する。

---

## 1. 背景

現状の前提は次の通りである。

- `page()` は静的 HTML / CSS のみを出力する
- `page()` は runtime content を reject する
- `App` 側には `app()` と `State<T>` の最小入口がある
- `APPX-1` として `examples/interactive/app-counter.ts` が成立している
- interactive island は「今は導入しない」と判断済みである

つまり P3 で未確定なのは、`page` の中に runtime を流し込むことではなく、**静的な page と動的な App を、どこまで近接配置してよいか** である。

この検証を曖昧なまま進めると、次の 2 つの悪い状態に戻りやすい。

- `page` が例外だらけの半静的 API になる
- `App` の主語が UI state ではなく DOM / script 直書きに戻る

---

## 2. この検証で決めること

`APPX-2` で決めるのは次の 3 点である。

1. `page` と `App` の最小共存形を採用してよいか
2. その共存形が `page` の静的保証を壊していないか
3. API の複雑さと runtime の重さが、P3 の実験として許容範囲か

結論は次の 3 択のどれかに固定する。

### A. 不採用

`page` と `App` はまだ混ぜず、当面は別エントリのまま運用する。

### B. 明示的合成のみ採用

`page` は静的なまま保ち、明示的な mount slot / bootstrap 経路だけを追加して共存させる。

### C. island 相当へ進む

`page` 自体に runtime subtree の例外規則を導入する。

`APPX-2` の初期評価では **B を第一候補** とし、C が必要になるなら現時点では不採用扱いに戻す。

---

## 3. 「`page` を壊す」とは何か

この検証では、次のいずれかが起きたら「`page` を壊した」とみなす。

### 3.1 静的保証の破綻

- `page()` が runtime 担持要素を受理する
- 純粋な `page` 出力に script / runtime prelude が自動混入する
- `page` 単体の export 経路が `App` runtime 前提になる

### 3.2 API 主語の破綻

- `page` 利用者が `state()` / `.on(...)` / `emitHandler(...)` を覚えないと実用例が読めない
- `page` の docs / examples が実質 `Root + script` の説明に戻る
- `page` と `App` の barrel export が混線する

### 3.3 責務分離の破綻

- `page` の export が `App` bundle 生成まで内包し始める
- mount 点が暗黙的に注入され、どこが静的でどこが動的か読めない
- runtime 不要ページでも `App` の依存が常にぶら下がる

---

## 4. 検証対象の最小案

`APPX-2` で主に検証するのは、**`page` と `App` の明示的合成** である。

### 4.1 採用候補: static shell + explicit mount

イメージは次の通り。

- `page(...)` は静的 HTML / CSS だけを生成する
- page 内には「ここに App を載せる」ための明示的な mount slot だけを置く
- 実際の state / binding / event は `App` 側の別経路で構築する
- runtime 注入は mount slot があるときだけ opt-in で起きる

ここで重要なのは、mount slot 自体は **静的なマーカー** であり、`page()` が runtime API を受理する抜け道ではないことだ。

例としては次の程度を想定する。

- `<div data-draftole-app="counter"></div>` のような静的プレースホルダ
- それに対して別ファイルの `App` bootstrap が attach する

API 名はまだ固定しない。ただし性質は固定する。

- 明示的である
- opt-in である
- `page` 側だけ見れば静的文書として読める

### 4.2 比較対象: 完全分離

比較用の基準として、`page` と `App` を完全に別ページ・別出力として保つ案も残す。

これは最も安全だが、次の欠点がある。

- LP / docs の一部だけ対話化したいときに不便
- `page` と `App` の実際の接続面がいつまでも未定義のまま残る

### 4.3 今回は採らない案: `page` 内 island

`page` の subtree だけ runtime を許可する案は、今回の検証対象から外す。

理由:

- `docs/interactive-island-decision.md` の結論と矛盾する
- `page()` の runtime reject 契約を複雑化する
- `App` 最小成功前に部分埋め込みを設計する順序が悪い

もし検証の結果「island 相当でないと成立しない」と分かった場合、その時点で `APPX-2` の結論は **今は不採用** とする。

---

## 5. 合格させたい最小体験

`APPX-2` の合格ラインは、「局所対話を置けること」そのものではなく、**利用体験が still `page first, App later` のまま保てること** である。

最低限ほしい体験は次である。

1. `page` のサンプルは、動的要素があっても静的ページとして読める
2. 動的部分は、`App` 側の独立した責務として追える
3. JS を読まなくても、どこが mount 点か分かる
4. JS を無効にしても page 本体の読書性が壊れない

逆に、次の書き味になったら不合格である。

- `page` サンプルなのに `state`, `emitHandler`, `__draftole__` が前面に出る
- mount のために `page` 利用者が runtime 内部を理解する必要がある
- 動的化のために `page()` 自身の責務説明を書き換えないといけない

---

## 6. 理想ファイル

`APPX-2` の検証で理想とする最小ファイルは次である。

- `docs/page-app-composition.md`
  - 本仕様と判断結果の記録
- `examples/page-with-app-slot.ts`
  - 静的 page に明示的 mount slot を置く最小例
- `examples/interactive/app-form.ts`
  - mount 対象になる最小 `App` 例
- `tests/examples/page-with-app-slot.test.ts`
  - 静的 shell の出力確認
- `tests/architecture/page-app-composition-boundary.test.ts`
  - `page` 側へ runtime が逆流していないことの確認

ファイル名は実装都合で多少前後してよいが、役割の分離は崩さない。

---

## 7. 検証観点

`APPX-2` では少なくとも次の観点で判定する。

| 観点 | 合格条件 |
|------|------|
| 静的保証 | 既存の `page()` runtime reject テストがそのまま通る |
| opt-in 性 | 動的 mount は明示 API / 明示マーカーがあるときだけ有効 |
| API の単純さ | `page` 利用者が覚える新概念は 1 個までに抑えられる |
| 責務分離 | `page` 側コードだけでは state / event を書かない |
| 劣化動作 | JS 無効時でも page 本体の読書性・導線が残る |
| runtime 重量 | 純粋な `page` 出力には JS が増えず、動的時だけ追加される |
| docs 一貫性 | README / docs の主導線を `page first, App later` のまま維持できる |

ここでいう「新概念 1 個」は、たとえば次のいずれかを想定する。

- mount slot 用の View primitive
- mount slot 用の data attribute helper
- page export 時の明示 bootstrap hook

複数の新しい公開概念が必要になる場合、その時点で設計コストが高すぎると判断する。

---

## 8. 完了判定

`APPX-2` は、次を満たしたら完了とみなす。

1. `page` と `App` の共存方式について、採用 / 不採用の結論が文書で固定されている
2. 合成方式を採る場合、`page` 側の静的保証を壊さないことを example と test で示せる
3. 不採用の場合も、「なぜ今は採らないか」を island 再議論なしで説明できる
4. `APPX-1` の counter 実験を踏まえ、runtime 重量と API 複雑さの判断が言語化されている

要するに `APPX-2` の完了とは、機能が出ることではなく **P3 後半に進むための設計判断が固定されること** である。

---

## 9. 不合格時の扱い

検証が不合格になった場合は、次の方針へ戻す。

1. `page` は静的専用のまま維持する
2. 動的 UI は独立した `App` 出力として扱う
3. 局所対話の共存は future work に回す

この場合でも失敗ではない。むしろ `page` の主語を守る判断が明確になったとみなす。

---

## 10. 次の実装順

この仕様に従う場合の順序は次を想定する。

1. `app-form` など、counter 以外の最小 `App` を 1 本用意する
2. 静的 `page` に mount slot だけを置く shell 例を作る
3. `page` 側の静的保証を壊さない boundary test を追加する
4. その結果を見て、完全分離継続か明示的合成採用かを決める

現段階では、機能を先に広げるより **共存条件を先に狭く固定すること** を優先する。

---

## 11. 検証結論

更新日: 2026-05-06

### 採用結論: **Option B（static shell + explicit mount slot）を採用する**

`APPX-2` の検証の結果、`page` の静的保証を完全に維持しながら動的 UI と共存できることが確認された。

---

### 7 つの検証観点の評価

| 観点 | 結果 | 評価詳細 |
|------|------|------|
| 静的保証 | 合格 | 既存の `page()` runtime reject テストがすべてパス。`AppSlot` を含む `page()` は `<script>` タグを一切出力しない |
| opt-in 性 | 合格 | `AppSlot` を使わない `page()` 出力に `data-draftole-mount` 属性ゼロ。mount は明示的に `AppSlot` を配置したときだけ有効 |
| API の単純さ | 合格 | 新たに公開したシンボルは `AppSlot` の 1 個のみ。`id` という 1 引数だけで使用できる |
| 責務分離 | 合格 | `src/view/app-slot.ts` は `app/` を一切 import しない。境界テストで継続検証される |
| 劣化動作 | 合格 | HTML 出力のみで `page` 本体が読める静的構造が維持されている |
| runtime 重量 | 合格 | 純粋な `page` 出力に `<script>` タグなし。JS ゼロ出力を確認済み |
| docs 一貫性 | 合格 | 本セクションの記録により確定 |

全 7 観点が合格。

---

### APPX-1 と APPX-2 の比較

| 比較項目 | APPX-1（app-counter） | APPX-2（AppSlot） |
|------|------|------|
| 実装概要 | `State<number>` + `emitHandler` + 複数の `button` 定義 | `AppSlot("counter")` の 1 行のみ |
| 生成物 | `runtime.js` + `script.js`（JS あり） | 静的 HTML のみ（JS ゼロ） |
| runtime 重量 | `runtime.js` + `script.js` を生成 | `page` 出力には JS 一切なし |
| 必要な API 概念 | `state` / `emitHandler` / `Root` / `FileExporter` の 4 概念 | `AppSlot` の 1 概念のみ |
| page 静的保証への影響 | `page()` とは別経路で運用 | `page()` の静的保証を完全維持 |

APPX-2 は APPX-1 と比較して、API 複雑さを大幅に低減しながら、`page` との共存を実現している。

---

### 結論の根拠

Option B を採用する根拠は次の通りである。

1. **`page` の静的保証が完全に維持される**: `AppSlot` は `StaticView` として実装されており、`HtmlTag` を継承しない。`page()` が runtime content を reject する契約は変わらない。

2. **新概念は `AppSlot` の 1 個のみ**: セクション 7 の要件（新概念 1 個まで）を充足する。利用者は `AppSlot("id")` と書くだけでよい。

3. **型レベルで責務分離が保証される**: `page` 側が `app/` を一切 import しない構造が、ソースコード上で直接確認できる。境界テストがこれを継続的に検証する。

4. **APPX-1 と比較して API 複雑さが大幅に低い**: `state`・`emitHandler`・`Root`・`FileExporter` を必要とした APPX-1 に対し、APPX-2 は `AppSlot` の 1 概念で完結する。

5. **JS 無効時でも page 本体の読書性が保たれる**: `AppSlot` は静的な `data-draftole-mount` 属性付き `div` を出力するだけであり、JS を無効にしても `page` のコンテンツは完全に読める。

Option C（island 相当）は不要であることが確認された。`page()` 自体に runtime subtree の例外規則を導入しなくても、明示的な mount slot による共存が成立するためである。

---

### 実装で確認したファイル

- `src/view/app-slot.ts` — AppSlot StaticView primitive（新規追加）
- `src/view/index.ts`, `src/index.ts` — AppSlot エクスポート追加
- `src/view/page.ts` — 非 HtmlTag の StaticView を受け入れるための修正（`TextType.raw()` でラップ）
- `examples/page-with-app-slot.ts` — 静的 page + AppSlot の最小例（新規追加）
- `examples/interactive/app-form.ts` — App 側の独立した第 2 example（新規追加）
- `tests/examples/page-with-app-slot.test.ts` — 静的シェル出力検証テスト（4 件、全パス）
- `tests/architecture/page-app-composition-boundary.test.ts` — 境界テスト（5 件、全パス）

全テスト合計 9 件がパスし、`APPX-2` の完了判定を満たす。
