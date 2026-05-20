# DraftOle_TS `page` API 仕様

更新日: 2026-05-03

## この文書の目的

この文書は、DraftOle_TS における `page` 入口の最小仕様を定義する。

ここで定義したいのは、単なる関数名ではない。利用者に最初に見せる主語を、`Root + html/body/div` から `page + View DSL` へ移すための公開面である。

---

## 1. 背景

現行の DraftOle_TS は、内部的には十分な実装資産を持っている。

- `Root` を起点に HTML / CSS / JS を生成できる
- scoped CSS がある
- `hstack` / `vstack` / `spacer` / `divider` がある
- state / runtime の基盤もある

ただし公開面の第一印象はまだ `HTML DSL` に寄っている。

- `new Root()`
- `html(...)`
- `head(...)`
- `body(...)`
- `div(...)`

このままだと、利用者は「View を組んでいる」のではなく「HTML を積んでいる」と感じやすい。

したがって、静的ページ用途の最初の入口として `page` を導入する。

---

## 2. `page` の役割

`page` は、**静的ページを組み立てるための最上位入口**である。

対象は次のような用途とする。

- LP
- ドキュメントページ
- 記事ページ
- 説明ページ
- レポートのような読み物ページ

`page` は静的ページに必要な責務だけを公開面に持つ。

- ページ全体の構造化
- View DSL からの HTML 出力
- scoped CSS の収集
- semantics / a11y / SEO の最低限整合

逆に、次は `page` の主責務にしない。

- state
- binding
- event
- runtime prelude
- `App` 相当の対話実行モデル

---

## 3. 目指す利用体験

利用者が最初に書くコードは、次のような方向を目指す。

```ts
const doc = page(
  Page(
    VStack(
      HeroSection(),
      FeaturesSection(),
      CTASection(),
      FooterSection(),
    )
      .padding(24)
      .frame({ maxWidth: 960 }),
  ),
);
```

ここで重要なのは次の点である。

- `Root` が主語ではない
- `html/head/body/div` が主語ではない
- レイアウトと部品が主語である
- modifier が主要導線である

この段階では、完全な実装詳細はまだ固定しない。
ただし少なくとも利用者には「ページを組んでいる感覚」を与える必要がある。

---

## 4. API の最小要件

`page` 入口は最低限、次の要件を満たす。

### 4.1 呼び出しの主語

- `page(...)` もしくは `Page(...)` を最初の入口として使える
- 利用者が `Root` を直接 new しなくてもよい

### 4.2 受け取るもの

`page` は最小的には次を受け取る。

- ルート View
- ページメタ情報
- 必要なら page-level options

最低限の page-level options 候補:

- `lang`
- `title`
- `description`
- `viewport`
- `charset`

### 4.3 返すもの

`page` の返り値は、少なくとも次のどちらかの形に揃える。

1. render 可能な `PageDocument`
2. 内部で `Root` を保持する page 用ラッパー

重要なのは、返り値の内部実装より次である。

- `render()` できる
- CSS を収集できる
- export 可能である

### 4.4 最小 View 語彙との接続

`page` と一緒に最初に見せる語彙は次を想定する。

- `Page`
- `VStack`
- `HStack`
- `Text`
- `Image`
- `Section`
- `Spacer`

この段階では、既存の `hstack` / `vstack` を内部実装または移行互換として残してよい。
ただし公開導線は `View` 側へ寄せる。

---

## 5. `Root` との関係

`Root` はすぐには消さない。

現時点では、`Root` は次のどちらかとして扱う。

1. 内部実装の土台
2. 上級者向けの低レベル入口

ただし、`page` 導入後の基本方針は明確である。

- 初見ユーザーに `Root` を最初に見せない
- `page` の内部で `Root` を使うことは許容する
- `Root` の責務は今後分離していく

つまり `Root` は **消す対象ではなく、前面から下げる対象** である。

---

## 6. HTML との関係

`page` は HTML を隠し切ることを目的にしない。

ただし HTML は通常の主語にはしない。

方針は次の通り。

- 通常は View DSL を使う
- renderer が semantic HTML を選ぶ
- 必要時だけ HTML / DOM / 属性レベルへ降りられる

`page` が最低限保証すべきこと:

- 見出し構造が破綻しない
- section / link / button / image の意味が壊れない
- a11y / SEO の基本線を外さない

---

## 7. `page` に含めないもの

次は `page` の初期スコープに含めない。

- `state()`
- `binding`
- `.onClick()` などのイベント主導 API
- runtime prelude の自動注入
- `App` 全体の実行モデル

もし静的ページの一部に対話性が必要になっても、それは後段で次のどちらかとして扱う。

1. `App` 文脈
2. interactive island

この段階では未確定とする。

---

## 8. 想定する最小ファイル構成

`PAGE-1` の完了時点で理想とする最小ファイルは次である。

- `src/view/page.ts`
- `src/view/primitives.ts`
- `src/view/index.ts`
- `src/index.ts`
- `tests/view/page-api.test.ts`
- `tests/view/page-rendering.test.ts`
- `examples/page-minimal.ts`

このファイル群が揃うことで、利用者は少なくとも「新しい入口が何か」を理解できる。

---

## 9. 受け入れ条件

`PAGE-1` は、次を満たしたら完了と判断する。

1. `page` の責務がこの文書で明文化されている
2. `Root` を公開主導線から下げる方針が明記されている
3. `page` が静的ページ用途の入口であることが明確である
4. `page` に state / runtime を持ち込まないことが確認できる
5. `tests/view/page-api.test.ts` と `tests/view/page-rendering.test.ts` が将来追加可能な粒度まで仕様が固定されている

---

## 10. 次のタスク

この仕様の次に着手するのは次である。

1. `src/view/page.ts` の雛形作成
2. `src/view/primitives.ts` の最小公開面作成
3. `tests/view/page-api.test.ts` の追加
4. `examples/page-minimal.ts` の追加

この 4 つが揃えば、`PAGE-1` は文書だけでなく実装へ進んだと判断できる。
