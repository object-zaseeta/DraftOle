# DraftOle_TS interactive island 判断メモ

更新日: 2026-05-05

## この文書の目的

この文書は `APP-3 interactive island の必要性を判断する` の結論を固定する。

ここで判断したいのは、「`page` の中に局所対話を埋め込む island を、いまの DraftOle_TS に導入すべきか」である。

結論を先に書く。

> **P2 / 現在の P3 スコープでは interactive island は不要であり、採用しない。**

これは island という考え方自体を否定する結論ではない。現段階の DraftOle_TS において、優先度と設計コストが見合わないという判断である。

---

## 1. 判断対象

この文書でいう interactive island は、次のようなものを指す。

- `page(...)` で作る静的ページの一部だけに runtime を載せる
- ページ全体は static-first のまま保つ
- 特定の subtree だけが state / binding / event を持つ

イメージとしては次のような要求である。

- LP の hero だけカウンタにしたい
- 記事ページの末尾だけアンケート UI を置きたい
- docs ページ中の 1 箇所だけ form preview を動かしたい

---

## 2. 比較した選択肢

### A. すぐに island を導入する

`page` の中に `Island(...)` や `mountApp(...)` のような局所対話ノードを許す案。

### B. いったん導入せず、対話は独立 `App` に寄せる

`page` は static-first を維持し、対話は小さくても独立した `App` として扱う案。

### C. 低レベル `Root` 直利用で都度しのぐ

公開面を増やさず、必要な実験だけ既存の低レベル経路で吸収する案。

現在の結論は、**公開方針としては B、移行上の逃げ道として C を許容** である。

---

## 3. island を採らない理由

### 3.1 `page()` の静的保証と衝突する

現在の `page()` は runtime content を reject する。

- `tests/view/page-static-validation.test.ts`
- `tests/view/page-api.test.ts` の runtime 担持要素拒否ケース

この契約は、DraftOle_TS の `page first` 方針の核になっている。

island を導入すると、`page` に対して次の例外規則を持ち込む必要がある。

- 原則 runtime 禁止
- ただし island subtree だけ runtime 許可
- さらに export / CSS / script 注入は island 経由だけ例外

これは `page` の理解コストを上げる。P0 で獲得した「静的なら `page`」という単純さを崩す。

### 3.2 `App` 自体がまだ最小成功していない

island は `App` の部分適用に近い機能である。

しかし現状は、まだ次が終わっていない。

- `examples/app-counter.ts`
- `examples/app-form.ts`
- `docs/app-minimal.md`

つまり、**独立 `App` の最小成功例すら固定できていない段階で、部分埋め込み版を先に設計するのは順序が逆** である。

先に必要なのは island ではなく、`App` の基本書き味の確定である。

### 3.3 export / runtime 注入の責務が複雑化する

island を入れると、少なくとも次の設計が必要になる。

- island のマウント点をどう表現するか
- page export 時に runtime をどこまで混ぜるか
- 複数 island があるとき runtime を共有するか
- CSS / script の依存を page と island でどう分けるか
- HTML だけ開いたときの劣化動作をどう定義するか

いまの DraftOle_TS は、ここを整理するより先に

- `App` の最小入口
- state / binding / event の公開面
- `Root` 責務分離

を片付けるほうが筋がよい。

### 3.4 想定ユースケースがまだ小さい

P3 で想定している最小実験は次である。

- counter
- form
- mini todo

この段階では、ページ埋め込みでないと成立しない対話ユースケースはまだ示されていない。

counter と form の検証目的は、

- state が UI 概念として読めるか
- binding が自然か
- event が DOM 生 API に戻らないか

であり、island がなくても十分検証できる。

### 3.5 主導線が再びぶれる

`page first, App later` の意図は、入口を増やしすぎないことにある。

ここで island を入れると、利用者の最初の選択肢が次の 3 つになる。

- `page`
- `App`
- `page + island`

この 3 つは、いまの段階では多い。先に `page` と `App` の 2 境界を安定させるべきである。

---

## 4. island が必要になる条件

今回の判断は「永久に不要」ではない。次の条件が揃ったら再評価してよい。

1. 独立 `App` の最小 API が成立している
2. `app-counter` と `app-form` が UI 概念として自然に読める
3. `page` の静的保証を壊さずに mount point を導入する設計案がある
4. 実際に「ページ全体を `App` にするほどではないが、局所対話は欲しい」ユースケースが複数ある
5. export / runtime 注入の責務分離が `Root` 再設計と整合する

この 5 条件のうち 1 つでも欠ける間は、island を急いで導入しない。

---

## 5. 現時点の代替方針

island を採らない代わりに、現時点では次の運用で足りる。

### 5.1 静的なものは `page`

- LP
- docs
- article
- static report

### 5.2 対話は独立 `App`

- counter
- input preview
- form validation
- todo

### 5.3 実験は `Root` 直利用

公開面が揃う前の低レベル実験は、既存の `mvp-demo.ts` のように `Root` 直利用で許容する。

ただしこれは docs の主導線ではなく、移行期の実験経路である。

---

## 6. 将来もし island を導入するなら

今回採用はしないが、将来の方向だけは制約として残す。

### 6.1 `page()` の意味を壊さない

`page()` 全体を runtime-aware にしてはならない。

導入するなら次のどちらかに限る。

- 明示的な island node
- 明示的な mount directive

暗黙注入は不可。

### 6.2 island は `App` の縮小版として扱う

独自の state / binding / event 体系を island 専用に作らない。

island を導入するなら、`App` 公開面をそのまま部分適用できることが前提である。

### 6.3 runtime 注入は page 全体ではなく island 起点で制御する

「静的 page なのに毎回 runtime が混ざる」状態を避ける必要がある。

---

## 7. 結論

現時点の結論は次の通り。

1. interactive island は P2 / 現在の P3 スコープでは不要
2. `page` の中に局所対話を載せる案は、今は採らない
3. 対話は独立 `App` として成立させることを先に優先する
4. island の再評価は `app-counter` / `app-form` 完了後でよい

この結論により、`APP-3` は完了とみなせる。

---

## 関連文書

- `docs/app-boundary.md`
- `docs/app-api-surface.md`
- `.internal/ai_Docs/myTask.md`
- `examples/interactive/mvp-demo.ts`
