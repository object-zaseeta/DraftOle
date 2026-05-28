# DraftOle Positioning（対外メッセージの固定点）

> このドキュメントは、現フェーズの DraftOle がどう名乗り、何を主役にし、何をまだ主役にしないかを定義する。
> README より詳しく、内部設計書ほど実装事情に踏み込まない、**外向きメッセージの固定点** として扱う。
> 関連 spec: `docs-positioning-spec`、`page-entry-spec`、`page-primitives-spec`、`page-dogfooding-spec`、`page-runtime-separation-spec`。

> **2026-05-28 改訂**: 旧来の「`static page first` — `page first, App later`」フレームを **撤回** した。実装的には `app()` ファサード・`state()`・`.on()` ハンドラシリアライズが完成しており、interactive 経路を「secondary / advanced」扱いするのは過剰な保守。新フレームは **「TypeScript everywhere, including your HTML.」** — `page()` と `app()` を共に first-class エントリとして並べ、共通の modifier-chain DSL で書き切れることを主訴求にする。

---

## What DraftOle is now

DraftOle は **TypeScript-native UI ライブラリ** である。同じ modifier-chain View DSL で、**静的ページ** と **対話型アプリ** の両方を書き出せる。

- 入口は `page()` または `app()` — 用途で選ぶ
- 構成要素は `Section` / `VStack` / `HStack` / `Text` / `Heading` / `Button` / `Link` 等の View プリミティブ
- スタイリングは `.padding()` / `.background()` / `.foregroundStyle()` / `.font()` / `.frame()` / `.cornerRadius()` / `.boxShadow()` / `.border()` などの modifier 連鎖
- 出力は素の HTML + scoped CSS、必要に応じて runtime JS（状態購読・イベントハンドラ）

スローガン:

> **TypeScript everywhere, including your HTML.**

旧スローガン `page first, App later.` は 2026-05-28 をもって **引退**。理由: `app()` 機能が既に出荷済み（counter/todo/form/cart デモが動く）にもかかわらず、コピーが「page しか出来ない」誤読を招いていたため。

---

## Primary entries（同等の主導線）

| 入口 | 用途 | 出力ランタイム |
|---|---|---|
| `page()` | LP / docs / 記事 / レポート / 静的ダッシュボード | HTML + scoped CSS のみ（runtime JS なし） |
| `app()` | counter / todo / form / shopping cart などの対話型アプリ | HTML + scoped CSS + minimal runtime JS（state engine 同梱） |

両者は同じ View プリミティブと modifier API を使う。学習コストの再投資が不要。

### Primary use cases

#### `page()` の代表的用途

- ランディングページ（LP）
- ドキュメントページ
- 記事・ブログ・長文レポート
- 静的なダッシュボード / ステータスページ
- マーケティング系の単発ページ

#### `app()` の代表的用途

- カウンタ・フォーム・トグル等の単発インタラクション
- Todo アプリ・ショッピングカート等の小規模 state アプリ
- 静的ページの中に埋め込むインタラクティブセクション（island 的活用）

---

## Current non-goals（今は主役にしないこと）

次は意図的に二次扱いとする。「禁止」ではなく「本フェーズの主導線ではない」「実装が未整備」という意味である。

- **ルーティング / マルチページアプリ**
  `page()` / `app()` の戻り値は単一ページ。複数ページのリンク構造はユーザー側で組み立てる。
- **SSR / ハイドレーション戦略**
  `app()` の出力は static HTML + 起動時に DOM をマウントする runtime。SSR + hydration の二段モデルは持たない。
- **大型コンポーネントエコシステム**
  View primitive と modifier の組み合わせで構成、Material UI / shadcn 級の事前作成済みコンポーネント群は無い。
- **File-based pages**
  Astro / Next の `pages/*.tsx` 規約は無い。エントリは `node entry.ts` で TS スクリプトを直接実行。
- **状態の永続化**
  localStorage / URL 同期 / hydration cache は持たない（必要なら application 層で実装）。
- **`Root` + `html/body/div` の生 HTML DSL を first path に置くこと**
  これは `page()` / `app()` 内部実装および互換目的のために残るが、新規ユーザーの入口としては推奨しない。

これらは将来仕様化される可能性はあるが、**現状のメッセージで匂わせない**。

---

## Why "TypeScript everywhere, including your HTML."

新スローガンが訴求する 3 つの軸:

1. **TypeScript の型が HTML 構造まで届く**
   HTML 属性のタイプミスがコンパイルエラーになる。`strict: true` が end-to-end で効く。
2. **同じ DSL で `page()` も `app()` も書ける**
   静的と対話の境界で言語・構文が割れない。modifier 連鎖の知識が両方で活きる。
3. **JSX / template 言語 / bundler が要らない**
   tsx / ts-node / `node --experimental-strip-types` で動く。`node_modules` に DraftOle 1 個だけ。

旧来の "Zero runtime / Zero deps / Zero bundler" の Three zeros 訴求は **`page()` 経路の文脈ではそのまま有効**。LP セクションのカードで引き続き使用する。`app()` 経路は state engine を同梱するため "Zero runtime" は当てはまらないが、`page()` 経路では引き続き honest claim として成立する。

---

## Legacy APIs and compatibility stance

### 1.0.0 以降の最終状態

`1.0.0` で **legacy low-level API を公開面から除去済み**（`legacy-low-level-api-removal` spec 完了）。`import { tag, all, rule, root, createTheme, createStyle, AppContext } from 'draft-ole'` および per-tag shortcuts（`tagA` 〜 `tagWbr` 112 個）の named import は **TS エラー** になる。

ただし **元定義の実装本体は私有実装として継続使用**: kept policy の `css.theme` / `css.class` / `css.media` / `css.keyframes` / `sel.*` namespace がこれら legacy 実装を内部で参照している。完全な物理削除は将来の Phase 2 spec として別途検討。

### 1.0.0 公開面における旧資産の扱い

| 区分 | 扱い |
| --- | --- |
| legacy low-level API named export（`tag` / `all` / `rule` / `root` / `createTheme` / `createStyle` / `AppContext` / per-tag shortcuts） | **公開面から除去済み**（1.0.0）。利用者は `css.theme` / `css.class` / `css.raw` / `sel.*` / `AppDocument` を使うこと。詳細は [`docs/migration/legacy-low-level-api.md`](migration/legacy-low-level-api.md)。 |
| `Root` クラス | **公開面非露出を不変条件として固定**（1.0.0）。`page()` / `app()` の内部実装としては `src/html/elements/root.ts` に存続。物理削除は Phase 2 spec として検討。 |
| `sel` namespace 自体 | **kept**（policy）。`sel.tag` / `sel.all` / `sel.rule` / `sel.root` / `sel.media` / `sel.keyframes` / `sel.tagA` 〜 `sel.tagWbr` は 1.0.0 でも継続提供。 |
| `media` / `keyframes` at-rule | **kept**（policy）。`'draft-ole'` から直接 import 可能。推奨経路は `css.media` / `css.keyframes` / `sel.media` / `sel.keyframes`。 |
| `examples/interactive/mvp-demo.ts` | **interactive showcase** として `examples/README.md` に配置。2026-05-28 positioning 改訂で "advanced" 表記は撤回、`page()` 例と並ぶ第一級用例として扱う。 |
| `tests/examples/fixtures/mvp-demo0.ts` 〜 `mvp-demo9.ts` ほか MVP 期段階バリエーション | テストフィクスチャ扱い。新規利用の入口でも公開見本でもなく、回帰固定のためにテスト配下に置く。 |
| `examples/interactive/react-demo.tsx` | 外部ランタイム連携の参考例。advanced 扱い。 |
| `transformer` / `jsTemplate` / `createVanillaScript` 等の runtime 系 API | 残置。`page()` 経路の説明には混ぜない。 |

新しいコード・新しいドキュメント・新しい examples は、原則として **`page()` または `app()` を入口に書く**（`Root` 直接利用は internal 扱い）。`page()` と `app()` の選択は用途で決め、`app` を「advanced」とラベリングする旧運用は 2026-05-28 に撤回した。

詳細な deprecation policy は [`docs/deprecation-policy.md`](deprecation-policy.md) を、`1.0.0` 移行の具体的なコード書き換え手順は [`docs/migration/legacy-low-level-api.md`](migration/legacy-low-level-api.md) を参照。

### `examples/` と `tests/examples/fixtures/` の役割境界

`examples/` と `tests/examples/fixtures/` は名前が似ているが、対象読者と動作保証レベルが明確に異なる。新規ファイルを追加するときは下記 policy を参照し、誤配置による役割混在を予防すること。

#### 比較表

| 観点 | `examples/` | `tests/examples/fixtures/` |
| --- | --- | --- |
| 誰が見るか | **ライブラリ利用者**（user-facing canonical） | **ライブラリメンテナのみ**（test infrastructure、非 user-facing） |
| demo script (`pnpm demo:*`) 必須 | **必須**（`package.json.scripts` に `demo:<name>` を登録） | 不要（test runner から間接的に消費される） |
| Playwright e2e spec 必須 | **必須**（`tests/e2e/<name>.spec.ts` を 1 本以上配置） | 不要（unit / integration / snapshot test から参照される） |
| 命名規約 | 機能を表す名前（`page-landing.ts` / `showcase-button.ts` / `interactive/priority-tasks.ts` 等） | **`.fixture.ts` suffix を推奨**（例: `mvp-demo-transformed.fixture.ts` / `run-flag.fixture.ts`）。`.ts` のみのファイル名は test infra 起源であることを明示しにくいため極力避ける |
| API 制約 | 1.0.0 公開 API のみ（`app, css, el, hstack, vstack, AppDocument` 等） | 1.0.0 公開 API 推奨。transformer post-output などの専用 fixture は内部 helper を直接参照してよい |
| 削除可否 | 個別の利用者影響を考慮（CHANGELOG に明記） | 対象 test と一体で retire 可能（個別利用者影響なし） |

#### `.fixture.ts` 命名規約

`tests/examples/fixtures/` 配下で **test 専用の入力 artifact** として作成するファイルは `<name>.fixture.ts` suffix を推奨する。これにより `.ts` のみのファイル名と区別され、「user-facing ではない」「test 起源である」ことがファイル名から自明になる。既存の `run-flag.fixture.ts` / `transformer-warning.fixture.ts` / `whitelist-violation.fixture.ts` / `mvp-demo-transformed.fixture.ts` がこの規約の reference 例。

例外として、`tests/examples/fixtures/mvp-demo-helper.ts` のように「振る舞いテスト用の helper module で `.fixture.ts` suffix だと意味が変わる」ものはこの限りではない。判断に迷う場合は `.fixture.ts` を付けて test infra 起源であることを優先表現する。

#### 新規ファイル追加時の判断フローチャート

```mermaid
graph TD
  Start[新規ファイルを追加したい] --> Q1{ライブラリ利用者が読む<br/>user-facing canonical か？}
  Q1 -- YES --> ExDir[examples/ に配置]
  ExDir --> Demo[package.json に demo:&lt;name&gt; script 追加]
  Demo --> E2E[tests/e2e/&lt;name&gt;.spec.ts を追加]
  E2E --> Cfg[playwright.config.ts の projects/webServer に登録]
  Q1 -- NO --> Q2{特定 test の入力 artifact か？<br/>demo にも e2e にも出ないが run 可能なファイル}
  Q2 -- YES --> FixtureDir[tests/examples/fixtures/ に &lt;name&gt;.fixture.ts として配置]
  FixtureDir --> RefTest[参照する test ファイルを明示]
  Q2 -- NO --> Reconsider[配置先を再検討<br/>helper ならば tests/&lt;layer&gt;/_helpers/<br/>doc 用断片ならば docs/ への inline]
```

判断のキーは Q1 と Q2 の 2 段。「demo script と e2e の両方を整備するコストを払う価値があるか」が `examples/` の判定基準、「特定 test の入力として再現性を保ちたいか」が `tests/examples/fixtures/` の判定基準である。

#### `tests/meta/e2e-coverage.test.ts` の分類対応表

`tests/meta/e2e-coverage.test.ts` は demo / fixture を 3 配列（`WHITELIST` / `REQUIRED` / `TODO`）に機械的に分類し、policy 違反を vitest 段階で検出する。本サブセクションの role boundary は下表の通り meta test 配列とリンクする。

| meta test 配列 | 対応する役割 | 含めるファイル種別 | 補足 |
| --- | --- | --- | --- |
| `REQUIRED` | `examples/` 配下の user-facing canonical | `examples/<name>.ts` および `examples/interactive/<name>.ts` のうち、demo script と Playwright project の両方が成立しているもの | `{ demo, project }` mapping を必須。新規 example 追加時は同期更新が必要 |
| `WHITELIST` | demo として実行しない fixture / 構文サンプル | `tests/examples/fixtures/*.fixture.ts`、`mvp-demo-helper.ts` 等の test 専用 helper、demo 化しない構文サンプル | **除外理由を必ず添える**（配列の `reason` フィールド）。理由欄が空のエントリは追加禁止 |
| `TODO` | 将来 retire / promote される過渡的 fixture | 本 spec で retire 予定の `mvp-demo*.ts` 系など、`REQUIRED` でも `WHITELIST` でもない過渡状態のファイル | 本 spec 完了時には空集合になることを目標とする |

policy 文書（本サブセクション）と meta test 配列の drift を防ぐため、`tests/meta/e2e-coverage.test.ts` 冒頭コメントから本サブセクションへ相対 link を張ってある。新規ファイル追加時はまず本フローチャートで配置を決定し、続いて meta test 配列を更新する流れを守ること。

### `examples/` と `tests/examples/fixtures/` の役割境界

`examples/` と `tests/examples/fixtures/` は名前が似ているが、対象読者と動作保証レベルが明確に異なる。新規ファイルを追加するときは下記 policy を参照し、誤配置による役割混在を予防すること。

#### 比較表

| 観点 | `examples/` | `tests/examples/fixtures/` |
| --- | --- | --- |
| 誰が見るか | **ライブラリ利用者**（user-facing canonical） | **ライブラリメンテナのみ**（test infrastructure、非 user-facing） |
| demo script (`pnpm demo:*`) 必須 | **必須**（`package.json.scripts` に `demo:<name>` を登録） | 不要（test runner から間接的に消費される） |
| Playwright e2e spec 必須 | **必須**（`tests/e2e/<name>.spec.ts` を 1 本以上配置） | 不要（unit / integration / snapshot test から参照される） |
| 命名規約 | 機能を表す名前（`page-landing.ts` / `showcase-button.ts` / `interactive/priority-tasks.ts` 等） | **`.fixture.ts` suffix を推奨**（例: `mvp-demo-transformed.fixture.ts` / `run-flag.fixture.ts`）。`.ts` のみのファイル名は test infra 起源であることを明示しにくいため極力避ける |
| API 制約 | 1.0.0 公開 API のみ（`app, css, el, hstack, vstack, AppDocument` 等） | 1.0.0 公開 API 推奨。transformer post-output などの専用 fixture は内部 helper を直接参照してよい |
| 削除可否 | 個別の利用者影響を考慮（CHANGELOG に明記） | 対象 test と一体で retire 可能（個別利用者影響なし） |

#### `.fixture.ts` 命名規約

`tests/examples/fixtures/` 配下で **test 専用の入力 artifact** として作成するファイルは `<name>.fixture.ts` suffix を推奨する。これにより `.ts` のみのファイル名と区別され、「user-facing ではない」「test 起源である」ことがファイル名から自明になる。既存の `run-flag.fixture.ts` / `transformer-warning.fixture.ts` / `whitelist-violation.fixture.ts` / `mvp-demo-transformed.fixture.ts` がこの規約の reference 例。

例外として、`tests/examples/fixtures/mvp-demo-helper.ts` のように「振る舞いテスト用の helper module で `.fixture.ts` suffix だと意味が変わる」ものはこの限りではない。判断に迷う場合は `.fixture.ts` を付けて test infra 起源であることを優先表現する。

#### 新規ファイル追加時の判断フローチャート

```mermaid
graph TD
  Start[新規ファイルを追加したい] --> Q1{ライブラリ利用者が読む<br/>user-facing canonical か？}
  Q1 -- YES --> ExDir[examples/ に配置]
  ExDir --> Demo[package.json に demo:&lt;name&gt; script 追加]
  Demo --> E2E[tests/e2e/&lt;name&gt;.spec.ts を追加]
  E2E --> Cfg[playwright.config.ts の projects/webServer に登録]
  Q1 -- NO --> Q2{特定 test の入力 artifact か？<br/>demo にも e2e にも出ないが run 可能なファイル}
  Q2 -- YES --> FixtureDir[tests/examples/fixtures/ に &lt;name&gt;.fixture.ts として配置]
  FixtureDir --> RefTest[参照する test ファイルを明示]
  Q2 -- NO --> Reconsider[配置先を再検討<br/>helper ならば tests/&lt;layer&gt;/_helpers/<br/>doc 用断片ならば docs/ への inline]
```

判断のキーは Q1 と Q2 の 2 段。「demo script と e2e の両方を整備するコストを払う価値があるか」が `examples/` の判定基準、「特定 test の入力として再現性を保ちたいか」が `tests/examples/fixtures/` の判定基準である。

#### `tests/meta/e2e-coverage.test.ts` の分類対応表

`tests/meta/e2e-coverage.test.ts` は demo / fixture を 3 配列（`WHITELIST` / `REQUIRED` / `TODO`）に機械的に分類し、policy 違反を vitest 段階で検出する。本サブセクションの role boundary は下表の通り meta test 配列とリンクする。

| meta test 配列 | 対応する役割 | 含めるファイル種別 | 補足 |
| --- | --- | --- | --- |
| `REQUIRED` | `examples/` 配下の user-facing canonical | `examples/<name>.ts` および `examples/interactive/<name>.ts` のうち、demo script と Playwright project の両方が成立しているもの | `{ demo, project }` mapping を必須。新規 example 追加時は同期更新が必要 |
| `WHITELIST` | demo として実行しない fixture / 構文サンプル | `tests/examples/fixtures/*.fixture.ts`、`mvp-demo-helper.ts` 等の test 専用 helper、demo 化しない構文サンプル | **除外理由を必ず添える**（配列の `reason` フィールド）。理由欄が空のエントリは追加禁止 |
| `TODO` | 将来 retire / promote される過渡的 fixture | 本 spec で retire 予定の `mvp-demo*.ts` 系など、`REQUIRED` でも `WHITELIST` でもない過渡状態のファイル | 本 spec 完了時には空集合になることを目標とする |

policy 文書（本サブセクション）と meta test 配列の drift を防ぐため、`tests/meta/e2e-coverage.test.ts` 冒頭コメントから本サブセクションへ相対 link を張ってある。新規ファイル追加時はまず本フローチャートで配置を決定し、続いて meta test 配列を更新する流れを守ること。

---

## このドキュメントの使い方

- README（英日）はこのドキュメントの主張を **短く前面に出す**
- `examples/README.md` はこのドキュメントの順序（page-minimal → page-landing → showcase → interactive/advanced）に従う
- 内部進捗を示す `.internal/ai_Docs/done.md` の P1 完了エントリは、このドキュメントを **対外メッセージの固定点** として参照する
- 今後の spec は、このドキュメントに反する主張（例: README 冒頭で App を主役に出す、`Root` を first path に戻す等）をしないこと。方針を変えるときは本ドキュメントを先に更新する
