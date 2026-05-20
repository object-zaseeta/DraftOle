# DraftOle_TS `App` 最小境界仕様

更新日: 2026-05-05

## この文書の目的

この文書は、P2 で必要になる `App` の最小境界を定義する。

ここで決めたいのは「対話 UI をどう実装するか」の詳細ではない。まず固定したいのは、`page` に残す責務と `App` にだけ許す責務を切り分け、今後の公開 API を混線させないことである。

現時点では `src/app/*` はまだ未実装であり、本文書は **実装前の公開面仕様** である。既存の対話系実装は当面 `Root` 直利用で継続できるが、それは移行用の低レベル経路として扱う。

---

## 1. 背景

P0 で `page` は静的ページの入口として成立した。

- `page` は `PageDocument` を返す
- `page` は runtime content を reject する
- `page` は View DSL を主語にして静的 HTML / CSS を出力する

一方で、現行コードベースには対話性の基盤もすでに存在する。

- `root.state()`
- binding
- runtime prelude
- event handler serialization
- `examples/interactive/mvp-demo.ts`

この 2 つを無造作に混ぜると、利用者から見た主語が再び `Root + DOM + JS 直書き` に戻る。したがって P2 では、`App later` を「後回し」ではなく **`page` と別境界に切り出す** こととして定義する。

---

## 2. 境界の基本方針

DraftOle_TS の公開面は、最低限次の 3 層で考える。

### 2.1 `page`

`page` は **static-first な文書 / ページ公開面** である。

- 主語は View DSL
- 出力は静的 HTML / CSS
- runtime state や client-side event は持ち込まない

### 2.2 `App`

`App` は **対話 UI のための高レベル公開面** である。

- 主語は UI state / binding / event
- runtime を持つことを前提とする
- ただし DOM query や生 script ではなく、UI 概念から書ける公開面を優先する

### 2.3 `Root`

`Root` は当面 **内部基盤兼 low-level escape hatch** として残す。

- `page` の内部実装土台として使ってよい
- `App` 実装前の実験経路としては使ってよい
- ただし初見ユーザー向けの主導線には置かない

要するに、方針は次の 1 行で足りる。

> 静的なものは `page`、対話的なものは `App`、過渡期の低レベル実験だけ `Root`。

---

## 3. `page` に残す責務

`page` に残す責務は、静的ページとして自然なものに限る。

- View DSL による構造化
- semantic HTML の選択
- scoped CSS と modifier 連鎖
- metadata (`lang`, `title`, `description`, `charset`, `viewport`)
- ファイル出力

`page` は「まったく操作不能な HTML」だけを意味しない。**ブラウザ標準だけで成立する挙動** は `page` 側に残してよい。

例:

- リンク遷移
- `form` の通常送信（GET / POST）
- `details` / `summary` の開閉
- `audio` / `video` の標準コントロール
- `:hover`, `:focus`, `:target` など CSS / ブラウザ標準で完結する反応

この文脈での判断基準は単純である。

> DraftOle 側が runtime prelude や state registry を注入しなくても成立するなら `page` に残してよい。

---

## 4. `page` に入れないもの

次は `page` に入れない。

- `state()`
- state からの text / value / class / checked binding
- client-side event handler
- runtime prelude の注入
- `script` の主導線化
- DOM query / DOM mutation
- interactive list rendering のような runtime 前提機能

現在の `page()` 実装はすでに runtime content を reject しており、この方針と一致している。

具体的には次を `page` へ流し込まない。

- `.on("click", ...)`
- `.on("input", ...)`
- `root.state(...)`
- `jqm`
- `$` / `$$`
- binding helpers
- runtime 前提の `each`

`page` 側にボタンや入力要素が存在してもよいが、それは **文書の一部として置かれた要素** であって、client-side state machine の入口ではない。

---

## 5. `App` にだけ許す責務

`App` は、`page` から除外した runtime 責務を引き受ける。

最低限 `App` にだけ許す機能は次である。

- local state の生成と更新
- state と text / value / checked / class の binding
- client-side event handler
- runtime を伴う collection rendering
- runtime bundle の出力
- 対話 UI 全体のライフサイクル管理

P2 時点の最小公開面候補は、概念として次を想定する。

- `app(...)` または `App(...)` の最上位入口
- `state()`
- `.onClick()` / `.onChange()` / `.onSubmit()` のような UI 意味名 API
- `text(state.map(...))`, `value(state)`, `checked(state)` 相当の binding
- `each(state, item => ...)` もしくは同等の collection binding

ここで重要なのは、`App` が runtime を許すこと自体ではない。**runtime を DOM 生 API ではなく UI 概念で包むこと** が主眼である。

したがって、`App` の主導線は次に寄せる。

- 状態
- ユーザーイベント
- UI 更新

逆に、次は `App` の主導線にしない。

- `script("...")` の文字列直書き
- `$()` / `$$()` による query 主導
- `jqm` のメソッド名をそのまま覚える使い方

これらは残すとしても escape hatch であり、`App` の第一印象には置かない。

---

## 6. `page` と `App` の使い分け表

| ケース | 境界 | 理由 |
|------|------|------|
| LP / docs / 記事 / 利用規約 | `page` | 静的 HTML / CSS で完結する |
| CTA ボタンで別 URL へ遷移 | `page` | 標準リンクで完結する |
| 通常の問い合わせフォーム送信 | `page` | ブラウザ標準 submit で成立する |
| `details` の開閉 | `page` | 標準要素の振る舞いで成立する |
| 入力値とプレビューの live binding | `App` | state と event が必要 |
| カウンタ / Todo / フィルタ / タブ | `App` | client-side state machine が必要 |
| submit 前バリデーションや非同期送信 | `App` | client event と runtime が必要 |
| DOM を query して直接書き換える実験 | `Root` 直利用 | 過渡期の低レベル経路であり、公開主導線ではない |

迷ったときの判定ルール:

1. runtime state が必要なら `App`
2. event handler を書きたいなら `App`
3. HTML 標準機能だけで足りるなら `page`
4. 公開面としてまだ整っていない低レベル操作しか使えないなら一時的に `Root`

---

## 7. interactive island の判断

P2 の判断としては、**初期 `App` 境界に island を含めない**。

理由は次の通り。

- `page` の静的保証を単純に保てる
- `page()` の runtime reject 仕様と矛盾しない
- 先に `App` の最小成功例を作らないと island の必要最小面が判断できない

したがって現時点の決定はこうする。

- `page` は全文静的のまま保つ
- 局所対話を載せたい場合も、まずは独立した `App` として考える
- island は P3 の counter / form 実験後に再評価する

これは island を否定する決定ではなく、**今は導入しない** という決定である。判断の詳細は `docs/interactive-island-decision.md` に分離した。

---

## 8. 将来の API 設計制約

将来 `src/app/*` を実装するときは、最低限次を守る。

### 8.1 入口を `Root` から隠す

- `new Root()` を `App` の主導線にしない
- `app(...)` / `App(...)` を最初の入口にする

### 8.2 `page` と export 面を分ける

- `src/view/*` は static-first を維持する
- `src/app/*` は runtime-aware な公開面を持つ
- barrel export でも `page` と `App` の語彙を混線させない

### 8.3 DOM 生 API を主語にしない

- イベントは `.onClick()` / `.onChange()` / `.onSubmit()` を優先する
- binding は state から読める API を優先する
- 生の `script` / `$` / `$$` は必要なら escape hatch に限定する

### 8.4 `page` の軽さを壊さない

- `App` 用 runtime を `page` へ自動注入しない
- `page` の bundle / export 経路に interactive runtime を混ぜない

---

## 9. 現時点での実装上の扱い

`App` 実装前の当面の扱いは次とする。

- 静的ページ例は `page` で書く
- 対話サンプルは `Root` 直利用で維持してよい
- ただし docs / README / examples の主導線は `page first, App later` を守る

つまり `examples/interactive/mvp-demo.ts` のような既存資産は否定しないが、それをそのまま将来の `App` 公開面と見なしてはならない。

---

## 10. この仕様で固定したこと

この文書で固定したのは次である。

1. `page` は static-first であり runtime state を持ち込まない
2. `App` は state / binding / event を引き受ける別境界である
3. `Root` は当面 internal / low-level 経路として残す
4. `page` 側に残す対話性は、ブラウザ標準だけで成立する範囲に限る
5. interactive island は初期 `App` 境界には含めず、P3 後に再評価する

この 5 点が揃っていれば、P2 の `APP-1` は完了とみなせる。

---

## 関連文書

- `docs/api/page-api.md`
- `docs/api/page-runtime-boundary.md`
- `.internal/ai_Docs/myTask.md` の P2 節
- `examples/interactive/mvp-demo.ts`
