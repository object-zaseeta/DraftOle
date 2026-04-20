# DraftOle TypeScript版 - タスク管理

## 📊 プロジェクト進捗（2026-04-20更新）

### ✅ Phase 1-5完了 + P0/P1多数完了
- **テスト状況**: 2,371個全てPASS（56テストファイル）
- **実装状況**: HTML/CSS/JS生成の基本機能完成。CSS拡張・DX改善・セキュリティP0完了
- **現在地**: P1 CFA構造改善・SEC・JS拡張が残存メインタスク

### 📁 実装済みモジュール
| モジュール | ファイル数 | テスト数 | 状態 |
|-----------|-----------|---------|------|
| HTML | 23ファイル | 689テスト | ✅ 完了 |
| CSS | 30+ファイル | 1,463テスト | ✅ コア完了 |
| JS | 4ファイル | 119テスト | ✅ 完了 |
| Publisher | 3ファイル | 100テスト | ✅ 完了 |

---

## 🗺️ 全タスク優先度マップ

| 優先度 | カテゴリ | タスクID | 内容 | 状態 |
|:------:|---------|---------|------|:----:|
| **P0** | DF修正 | DF-1 | collectCssStyleString() 子再帰修正 | [x] |
| **P0** | DF修正 | DF-2 | スコープCSSクラスのHTML自動付与 | [x] |
| **P0** | MVP Demo | 6.1 | examples/mvp-demo.ts 作成 | [x] |
| **P0** | MVP Demo | 6.2 | 統合テスト追加 | [x] |
| **P0** | MVP Demo | 6.3 | examples/README.md 作成 | [x] |
| **P0** | MVP Demo | 6.4 | package.json スクリプト追加 | [x] |
| **P1** | DF修正 | DF-3 | Text() HTMLエスケープのデフォルト化 | [x] |
| **P1** | DF修正 | DF-4 | `<pre>` 内レンダラーインデント抑制 | [x] |
| **P1** | DF修正 | DF-5 | CSS APIショートハンド（5段階→3段階チェーン） | [x] |
| **P1** | CFA構造改善 | CFA-A.1 | html-tag.ts 具象依存除去 | [ ] |
| **P1** | CFA構造改善 | CFA-A.2 | protocol 依存反転 | [ ] |
| **P1** | CFA構造改善 | CFA-A.3 | Composition Root 導入 | [ ] |
| **P1** | DX改善 | DX-1 | ファクトリ関数の文字列引数で `Text()` を不要にする | [x] |
| **P1** | DX改善 | DX-2 | `Text.unsafeRaw()` 静的メソッド追加 | [x] |
| **P2** | DF修正 | DF-6 | `<!DOCTYPE html>` 出力オプション | [x] |
| **P2** | DF修正 | DF-7 | `setFlex()` CSSショートハンド追加 | [x] |
| **P1** | DX改善 | DF-8 | コンポーネント分割パターン（関数ベース） | [x] |
| **P2** | DX改善 | DX-3 | コンポーネントProps型定義パターンの確立 | [x] |
| **P2** | DX改善 | DX-4 | 複数引数コンポーネントのオブジェクト引数化 | [x] |
| **P0** | セキュリティ | SEC-1 | 属性値サニタイズ（href の javascript: 検出・拒否） | [x] |
| **P1** | セキュリティ | SEC-2 | CSS値サニタイズ（url(), expression() 検出・拒否） | [ ] |
| **P1** | セキュリティ | SEC-3 | 危険APIの命名改善（TextType → unsafeRaw 等） | [x] |
| **P1** | セキュリティ | SEC-4 | HTMX統合時のCSRFトークン機構 | [ ] |
| **P2** | セキュリティ | SEC-5 | CSP対応（nonce生成、style-src制御） | [ ] |
| **P1** | CSS拡張 | 6.5 | CSS変数（:root定義 + var()参照） | [x] |
| **P1** | CSS拡張 | MVP-2.4 | 疑似セレクタ（:hover, :focus, :active） | [x] |
| **P1** | CSS拡張 | MVP-2.5 | 複合セレクタ（.btn.primary, .item.done .text） | [x] |
| **P1** | CSS拡張 | 6.6 | radial-gradient 実装 | [x] |
| **P1** | CSS拡張 | CSS-1 | class共有スタイル（複数要素に同じスタイル適用） | [x] |
| **P1** | CSS拡張 | CSS-2 | グローバルCSS注入（*, html,body 等のリセット） | [x] |
| **P1** | CSS拡張 | CSS-3 | 子孫セレクタ（.parent .child スタイリング） | [x] |
| **P1** | JS拡張 | JS-1 | 動的DOM生成（createElement + appendChild） | [ ] |
| **P1** | JS拡張 | JS-2 | イベントハンドラ関数本体（名前だけでなくロジック記述） | [ ] |
| **P2** | 機能拡張 | 6.7 | examples/基本例追加 | [ ] |
| **P2** | JS | MVP-3.3 | DOMContentLoadedラッパー | [x] |
| **P2** | CFA分割 | CFA-B.1 | attribute-builder.ts 分割（966行→6ファイル） | [x] |
| **P2** | CFA分割 | CFA-B.2 | factories.ts 分割（805行→5ファイル） | [x] |
| **P2** | CFA分割 | CFA-B.3 | attribute-keys.ts 分割 | [ ] |
| **P2** | CFA分割 | CFA-B.4 | index.ts エクスポート分散 | [ ] |
| **P3** | CFA型分散 | CFA-C.1 | errors.ts エラーコード分散 | [ ] |
| **P3** | CFA型分散 | CFA-C.2 | style-keys.ts カテゴリ別分割 | [ ] |
| **P3** | CSS拡張 | MVP-2.3 | CSS変数（Custom Properties）サポート（→6.5に統合） | [x] |
| **P3** | 改善 | 3 | テストフレームワーク統一（Swift Testing） | [ ] |
| **P4** | 宣言的API | D-1.2〜D-4.1 | Result Builder / Fluent CSS / イミュータブル | [ ] |
| **P4** | SSG | 1-A〜1-E | CLI / コンテンツ読込 / テンプレート / 開発サーバー | [ ] |
| **P4** | Webアプリ | 2-A〜2-B | Vapor統合 / HTMX統合 | [ ] |
| **P4** | コンポーネント | POST-C | UIコンポーネント集 / テーマ / ダークモード | [ ] |
| **P4** | ドキュメント | POST-D | サンプル集 / APIリファレンス / チュートリアル | [ ] |
| — | BIP | BIP-1〜4 | BuildInPublicコンテンツ改善 | [ ] |

### 🎯 クリティカルパス

```
P0: ✅ 全完了（v0.9達成）
         ↓
P1-CFA: CFA-A.1〜A.3（並列可）
P1-SEC: SEC-2(CSSサニタイズ) / SEC-4(CSRF)
P1-JS:  JS-1(動的DOM) / JS-2(ハンドラ関数本体)
         ↓
P2: SEC-5 / CFA-B.1〜B.4 / 6.7(examples)
         ↓
P4: 宣言的API / SSG / Webアプリ
```

---

## P1: 高優先度 — CFA構造改善（依存方向修正 + DI導入）

> **出典**: `ai_Docs/cfa-report.md`（2026-02-11 診断）
> **方針**: 外部APIの後方互換性を維持しつつ内部構造を改善
> **推奨spec**: `spec/fix-dependency-direction`
> **目標**: html/ → css/, js/ の逆方向依存を解消し、テスト時のモック注入を可能にする

### 既存タスクとの関係

| CFA タスク | 既存タスクとの関係 |
|-----------|------------------|
| CFA-A（依存方向修正） | 旧タスク「2. HTMLTagProtocolの責務分離」を包含・発展 |
| CFA-A（DI導入） | Task 6.5（CSS変数）実装前に完了すると設計品質向上 |

### [ ] CFA-A.1: html-tag.ts の具象依存除去
- **対象**: `src/html/elements/html-tag.ts`
- **現状**: `CssManager`, `JQueryManager` を直接 import & new している（CFA原則2,4違反）
- **改善**: コンストラクタまたはファクトリ関数で `CssManagerInstance` / `JQueryManagerInstance` を注入可能にする
- **影響ファイル**: html-tag.ts, root.ts
- **工数**: 3-4時間

### [ ] CFA-A.2: protocol 依存反転
- **対象**: `src/html/protocols/css-manager-type.ts`, `jquery-manager-protocol.ts`
- **現状**: protocol定義が css/, js/ の具象型に依存
- **改善**: インターフェース定義を protocols/ 内で完結させ、css/, js/ がそれを実装する形に反転
- **工数**: 2-3時間

### [ ] CFA-A.3: Composition Root 導入
- **対象**: 新規 `src/composition-root.ts` または `src/container.ts`
- **現状**: 具象クラスの生成が Feature 内部に散在（Composition Root 不在）
- **改善**: CssManager/JQueryManager の生成を1箇所に集約。テスト時のモック注入を可能にする
- **工数**: 2-3時間
- **注意**: ライブラリとしてユーザーが直接利用するAPIは維持し、内部のみリファクタリング

---

## P1: 高優先度 — セキュリティ

> **目標**: ユーザー入力を含むHTML生成時のXSS・インジェクション対策

### [ ] SEC-2: CSS値サニタイズ（P1）
- **対象**: Fluent CSSメソッド全体、CSSプロパティクラスの setter
- **現状**: `div().background(userInput)` で `url('https://evil.com/steal')` や `expression()` を注入可能
- **改善**: CSS値に `url()`, `expression()`, `-moz-binding` 等の危険パターンを検出・警告。`background-image` で外部URLを使う場合は明示的API（`backgroundImage.url()`）を要求
- **工数**: 2-3時間

### [ ] SEC-4: HTMX統合時のCSRFトークン機構（P1）
- **対象**: 将来のHTMX統合モジュール
- **現状**: 未実装。HTMX統合時にPOST/PUT/DELETEリクエストにCSRFトークンが必要
- **改善**: `meta({ name: 'csrf-token', content: token })` の自動挿入、HTMX の `hx-headers` でのトークン送信パターンを提供
- **工数**: 2時間（HTMX統合時に実装）

### [ ] SEC-5: CSP対応（P2）
- **対象**: FileExporter, Root
- **現状**: インラインスタイル・スクリプトに対するCSP対応なし
- **改善**: nonce生成機能、`<style nonce="...">` / `<script nonce="...">` の自動付与
- **工数**: 2時間

---

## P1: 高優先度 — JS拡張

> **出典**: MVP Demo精査（2026-04-10）
> **目標**: JQueryManagerの機能をWebアプリレベルに引き上げる

### [ ] JS-1: 動的DOM生成
- **対象**: JQueryManager or 新規モジュール
- **現状**: DraftOleはビルド時にHTML構造を生成するのみ。実行時に`createElement`でDOM要素を動的追加するパターンをサポートしない
- **改善**: テンプレート関数をJS出力に含める。例: `createTodoItem(text)` のようなファクトリをDraftOle DSLで定義 → JS関数として出力
- **工数**: 4-5時間（設計が必要）

### [ ] JS-2: イベントハンドラ関数本体
- **対象**: JQueryManager
- **現状**: `jqm.click('handlerName')` は関数名の参照のみ。`() => { ... }` のような関数本体を記述・出力できない
- **改善**: `jqm.on('click', '() => { alert("clicked") }')` またはビルダーパターンでハンドラロジックを記述
- **工数**: 3-4時間

---

## P2: 中優先度 — ファイル分割

> **推奨spec**: `spec/split-large-files`
> **目標**: マージ容易性の向上。1ファイル1責務に近づける

### [ ] CFA-B.1: attribute-builder.ts 分割
- **対象**: `src/html/attributes/attribute-builder.ts`（966行、6クラス混在）
- **改善**: ビルダーごとにファイル分割
  - `base-attribute-builder.ts`
  - `form-attribute-builder.ts`
  - `input-attribute-builder.ts`
  - `image-attribute-builder.ts`
  - `link-attribute-builder.ts`
  - `button-attribute-builder.ts`
- **工数**: 2-3時間

### [ ] CFA-B.2: factories.ts 分割
- **対象**: `src/html/tags/factories.ts`（805行、56タグファクトリ関数）
- **改善**: カテゴリ別に分割
  - `structure-tags.ts`（div, section, article, header, footer 等）
  - `form-tags.ts`（form, input, select, textarea 等）
  - `text-tags.ts`（p, span, h1-h6, a 等）
  - `media-tags.ts`（img, video, audio 等）
  - `table-tags.ts`（table, tr, td, th 等）
- **工数**: 2-3時間

### [ ] CFA-B.3: attribute-keys.ts 分割
- **対象**: `src/html/attributes/attribute-keys.ts`（613行）
- **改善**: 属性種別ごとにファイル分割（BooleanAttributeKey, KeyValueAttributeKey, AriaAttributeKey 等）
- **工数**: 1-2時間

### [ ] CFA-B.4: index.ts エクスポート分散
- **対象**: `src/index.ts`（218行、全モジュールのエクスポート集約）
- **改善**: モジュール別の re-export ファイルに分割（例: `index-html.ts`, `index-css.ts`）
- **注意**: パブリックAPIのため破壊的変更に注意。サブパスエクスポート（`draft-ole/html`, `draft-ole/css`）の検討
- **工数**: 1-2時間

### [ ] Task 6.7: examples/基本例追加
- basic-html.ts - 基本的なHTML生成
- styled-component.ts - CSS統合例
- interactive-page.ts - JS統合例
- 工数: 3時間

---

## P3: 低優先度 — 型定義分散

> **着手条件**: P1, P2 完了後

### [ ] CFA-C.1: errors.ts のエラーコード分散
- **対象**: `src/utils/errors.ts`（165行、全モジュールのエラーコード型が集約）
- **改善**: エラーコード型をモジュールごとに分散配置
- **工数**: 1時間

### [ ] CFA-C.2: style-keys.ts カテゴリ別分割
- **対象**: `src/css/style/style-keys.ts`（224行、146 CSSプロパティキー）
- **改善**: カテゴリ別に分割（現状はconst objectなので衝突リスクは中程度）
- **工数**: 1時間

### [ ] テストフレームワークの統一（Swift版）
- Swift Testing (新): 16ファイル、54テスト → XCTest (旧): 7ファイル、91テスト
- Swift Testing への統一移行

---

## P4: 将来 — 宣言的API / SSG / Webアプリ

> **着手条件**: P0〜P2 完了後

### 宣言的API改善（Post-MVP）

| 順序 | タスクID | 内容 | 依存 |
|:---:|---------|------|------|
| 1 | D-1.1 | Bug 3修正（CSS消失） | ✅ 完了 |
| 2 | D-1.2 | addChild戻り値変更 | D-1.1 |
| 3 | D-2.1 | HTMLBuilder実装 | D-1.1 |
| 4 | D-2.2 | タグファクトリ拡張 | D-2.1 |
| 5 | D-2.3 | テキストノード変換 | D-2.1 |
| 6 | D-3.1 | Fluent CSSメソッド | D-1.2 |
| 7 | D-2.4 | 条件分岐サポート | D-2.2 |
| 8 | D-2.5 | ループサポート | D-2.2 |
| 9 | D-3.2 | レイアウトショートカット | D-3.1 |
| 10 | D-4.1 | イミュータブル設計 | 全完了後 |

### SSG完成タスク（Phase 1-A〜E）

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 1-A | CLI実装（build/serve） | ⚪ 未着手 |
| 1-B | コンテンツ読込（JSON/YAML/Markdown） | ⚪ 未着手 |
| 1-C | テンプレート分離 | ⚪ 未着手 |
| 1-D | 開発サーバー（ホットリロード） | ⚪ 未着手 |
| 1-E | ドキュメント・サンプル | ⚪ 未着手 |

### Webアプリフレームワーク（Phase 2）

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 2-A | Vapor統合 | ⚪ 未着手 |
| 2-B | HTMX統合（動的UI対応） | ⚪ 未着手 |

### マイルストーン

| バージョン | 達成状態 |
|-----------|---------|
| **v0.9** | MVP Demo完成（P0） ✅ |
| **v0.95** | CFA構造改善完了（P1） |
| **v1.0** | 機能拡張+SSG完成（P2+Phase 1） |
| **v1.1** | 宣言的API（Phase D-1〜D-2） |
| **v1.3** | Fluent CSS API（Phase D-3） |
| **v2.0** | Webアプリフレームワーク（Phase 2） |

---

## 📊 CFA改善の期待効果

| 指標 | 改善前 | 改善後（期待） |
|------|--------|---------------|
| テスト時モック注入 | 不可 | 可能（CFA-A.3） |
| 最大ファイル行数 | 966行 | ~200行以下（CFA-B.1,B.2） |
| 依存方向 | html/ → css/, js/（逆方向） | html/ ← css/, js/（正方向） |
| 高衝突リスクファイル | 7ファイル | 2-3ファイル |

---

## 📝 BuildInPublicコンテンツ改善タスク

> **優先度**: 投稿時に対応（開発タスクとは独立）

| ID | 内容 | 優先度 | トリガー |
|----|------|:------:|---------|
| BIP-1 | Bluesky投稿用：コードブロック対応 | 中 | Bluesky投稿前 |
| BIP-2 | X/Twitter投稿用：コードブロック対応 | 中 | X投稿前 |
| BIP-3 | DEV.to投稿時：front matter調整 | 低 | DEV.to投稿時 |
| BIP-4 | 開発期間表記の修正 | 低 | 任意 |
| BIP-TD-1 | コンテンツ種別の命名規則定義 | 低 | 週次報告再開時 |

---

## ブランチ情報
- **現在のブランチ**: `master`
- **マージ済みspec**: `spec/bug-fix`, `spec/external-css-generation`, `spec/html-module`
- **実装済みspec（master直接）**: `css-module`（28テストファイル、1,463テスト）

## TypeScript 移行ステータス

| フェーズ | モジュール | 状態 | TSファイル | テスト |
|---------|-----------|:----:|-----------|--------|
| Phase 1 | 基盤（Renderable等） | ✅ | 1 | - |
| Phase 2 | HTML | ✅ | 23 | 689 |
| Phase 3 | CSS | ✅ | 30+ | 1,463 |
| Phase 4 | JS | ✅ | 4 | 119 |
| Phase 5 | Publisher | ✅ | 3 | 100 |

**プロジェクト全体テスト**: 56ファイル / 2,371テスト PASS

---
---

# 以下はアーカイブ（参考・参照用）

> Swift版の参照情報、詳細な設計メモを含みます。TypeScript移行により**凍結状態**。

---

## 完了済みタスク履歴

| タスクID | 内容 | 完了日 | コミット |
|---------|------|--------|---------|
| DF-1 | collectCssStyleString() 子再帰修正 | 2026-04-08 | — |
| DF-2 | スコープCSSクラスのHTML自動付与 | 2026-04-08 | cd372e1 |
| DF-3 | Text() HTMLエスケープのデフォルト化 | 2026-04-08 | 309e7fa |
| DF-4 | `<pre>` 内レンダラーインデント抑制 | 2026-04-08 | 20d422c |
| DF-5 | CSS APIショートハンド（→D-3.1 Fluent CSS） | 2026-04-08 | 7f93512 |
| DF-6 | `<!DOCTYPE html>` 出力オプション | — | — |
| DF-7 | `setFlex()` CSSショートハンド追加 | — | — |
| DF-8 | コンポーネント分割パターン（関数ベース） | 2026-04-10 | 76168f2 |
| DX-1 | ファクトリ関数の文字列引数でText()不要化 | 2026-04-10 | 11ddf77 |
| DX-2 | Text.unsafeRaw() 静的メソッド追加 | — | 3dfb56f |
| DX-3 | コンポーネントProps型定義パターン確立 | — | — |
| DX-4 | 複数引数コンポーネントのオブジェクト引数化 | — | — |
| SEC-1 | 属性値サニタイズ（href javascript:検出） | 2026-04-10 | 79be725 |
| SEC-3 | 危険API命名改善（→DX-2と同時完了） | — | 3dfb56f |
| 6.1 | examples/mvp-demo.ts 作成 | — | — |
| 6.2 | 統合テスト追加 | — | — |
| 6.3 | examples/README.md 作成 | — | — |
| 6.4 | package.json スクリプト追加 | — | — |
| 6.5 | CSS変数（:root + var()参照） | — | — |
| 6.6 | radial-gradient 実装 | — | — |
| CSS-1 | class共有スタイル | — | — |
| CSS-2 | グローバルCSS注入 | — | — |
| CSS-3 | 子孫セレクタ | — | — |
| MVP-2.4 | 疑似セレクタ（:hover, :focus） | — | — |
| MVP-2.5 | 複合セレクタ（.btn.primary等） | — | — |
| MVP-3.3 | DOMContentLoadedラッパー | — | — |

## Swift版 Phase 1 ゴール（参考）

> **DraftOle = 型安全なHugo/Jekyll**
> 入力: Markdown / JSON / YAML + DraftOle DSL テンプレート
> 出力: `dist/` に静的HTML/CSS/JSファイル群
> 差別化: **HTML + CSS + JS を一括で型安全に生成**できる唯一のSSG

## Swift版 未完了タスク詳細（凍結）

> 実装する場合はTypeScript版で同等機能をspecとして新規作成してください。

- D-1.2: addChild戻り値変更（`Void` → `Self` でチェーン可能に）
- D-2.1〜D-2.5: Result Builder導入（HTMLBuilder → タグファクトリ → 条件分岐 → ループ）
- D-3.1〜D-3.2: Fluent CSS API（`.fontSize(24).color('#333').padding(16)`）
- D-4.1: イミュータブル設計（v2.0検討）
- Phase 1-A〜E: CLI / ContentLoader / LayoutTemplate / 開発サーバー / DocC
- Phase 2-A〜B: Vapor統合 / HTMX統合
- POST-B〜E: ファイルウォッチャー / UIコンポーネント集 / ドキュメント / データ分離
