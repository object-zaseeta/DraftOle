# DraftOle TypeScript版 - タスク管理

## 📊 プロジェクト進捗（2026-02-11更新）

### ✅ Phase 1-5完了（96%）
- **テスト状況**: 2,371個全てPASS（56テストファイル）
- **実装状況**: HTML/CSS/JS生成の基本機能完成
- **バックアップ**: src.backup.phase1/, tests.backup.phase1/ 作成済み

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
| **P0** | DF修正 | DF-2 | スコープCSSクラスのHTML自動付与 | [ ] |
| **P0** | MVP Demo | 6.1 | examples/mvp-demo.ts 作成 | [ ] |
| **P0** | MVP Demo | 6.2 | 統合テスト追加 | [ ] |
| **P0** | MVP Demo | 6.3 | examples/README.md 作成 | [ ] |
| **P0** | MVP Demo | 6.4 | package.json スクリプト追加 | [ ] |
| **P1** | DF修正 | DF-3 | Text() HTMLエスケープのデフォルト化 | [ ] |
| **P1** | DF修正 | DF-4 | `<pre>` 内レンダラーインデント抑制 | [ ] |
| **P1** | DF修正 | DF-5 | CSS APIショートハンド（5段階→3段階チェーン） | [ ] |
| **P1** | CFA構造改善 | CFA-A.1 | html-tag.ts 具象依存除去 | [ ] |
| **P1** | CFA構造改善 | CFA-A.2 | protocol 依存反転 | [ ] |
| **P1** | CFA構造改善 | CFA-A.3 | Composition Root 導入 | [ ] |
| **P2** | DF修正 | DF-6 | `<!DOCTYPE html>` 出力オプション | [ ] |
| **P2** | DF修正 | DF-7 | `setFlex()` CSSショートハンド追加 | [ ] |
| **P2** | DF修正 | DF-8 | コンポーネントテンプレート/プリセット機能 | [ ] |
| **P2** | 機能拡張 | 6.5 | CSS変数機能の実装 | [ ] |
| **P2** | 機能拡張 | 6.6 | radial-gradient 実装 | [ ] |
| **P2** | 機能拡張 | 6.7 | examples/基本例追加 | [ ] |
| **P2** | CFA分割 | CFA-B.1 | attribute-builder.ts 分割（966行→6ファイル） | [ ] |
| **P2** | CFA分割 | CFA-B.2 | factories.ts 分割（805行→5ファイル） | [ ] |
| **P2** | CFA分割 | CFA-B.3 | attribute-keys.ts 分割 | [ ] |
| **P2** | CFA分割 | CFA-B.4 | index.ts エクスポート分散 | [ ] |
| **P3** | CFA型分散 | CFA-C.1 | errors.ts エラーコード分散 | [ ] |
| **P3** | CFA型分散 | CFA-C.2 | style-keys.ts カテゴリ別分割 | [ ] |
| **P3** | CSS拡張 | MVP-2.3 | CSS変数（Custom Properties）サポート | [ ] |
| **P3** | CSS拡張 | MVP-2.4 | 疑似セレクタサポート | [ ] |
| **P3** | CSS拡張 | MVP-2.5 | 複合セレクタサポート | [ ] |
| **P3** | JS | MVP-3.3 | DOMContentLoadedラッパー | [ ] |
| **P3** | 改善 | 3 | テストフレームワーク統一（Swift Testing） | [ ] |
| **P4** | 宣言的API | D-1.2〜D-4.1 | Result Builder / Fluent CSS / イミュータブル | [ ] |
| **P4** | SSG | 1-A〜1-E | CLI / コンテンツ読込 / テンプレート / 開発サーバー | [ ] |
| **P4** | Webアプリ | 2-A〜2-B | Vapor統合 / HTMX統合 | [ ] |
| **P4** | コンポーネント | POST-C | UIコンポーネント集 / テーマ / ダークモード | [ ] |
| **P4** | ドキュメント | POST-D | サンプル集 / APIリファレンス / チュートリアル | [ ] |
| — | BIP | BIP-1〜4 | BuildInPublicコンテンツ改善 | [ ] |

### 🎯 クリティカルパス

```
P0: DF-1（CSS再帰）+ DF-2（スコープCSS付与）→ Task 6.1〜6.4（MVP Demo）
         ↓
P1: DF-3〜5（DX改善）/ CFA-A.1〜A.3（構造改善）
         ↓
P2: DF-6〜8 / CFA-B.1〜B.4（並列可）/ Task 6.5〜6.7（並列可）
         ↓
P3: CFA-C.1〜C.2 / MVP-2.3〜2.5
         ↓
P4: 宣言的API / SSG / Webアプリ
```

---

## P0: 最優先 — ドッグフーディング発見課題（DF修正）

> **出典**: `lp/dogfooding-log.md`（2026-04-08 LP構築実験で発見）
> **目標**: DraftOleを回避策なしで実用可能にする

### [x] DF-1: collectCssStyleString() 子再帰修正（2026-04-08完了）
- **対象**: `src/html/elements/html-tag.ts:313-315`
- **現状**: `collectCssStyleString()` は `this._css.render()` のみ返し、子要素に再帰しない。`collectJsContent()` は再帰している
- **改善**: `collectJsContent()` と同様に子要素を再帰走査し、全子孫のCSSを収集する
- **影響**: Root.collectCssStyleString() は既に子を走査するが、孫以降はHtmlTag側の再帰が必要
- **工数**: 1時間

### [ ] DF-2: スコープCSSクラスのHTML自動付与
- **対象**: `src/html/elements/html-tag.ts`（protoRender）, `src/css/manager/css-manager.ts`
- **現状**: `renderCss()` で `._hash { ... }` を生成するが、HTMLレンダリング時にそのクラスが要素のclass属性に付与されない。tagPath未設定で全要素が同一ハッシュになる問題もあり
- **改善**: (a) ファクトリ関数でtagPathを自動設定、(b) protoRender時にスコープクラスをclass属性に自動追加
- **工数**: 3-4時間

---

## P0: 最優先 — MVP Demo作成

> **目標**: DraftOle TS版で動作するデモを作成し、ライブラリの実用性を証明する
> **Gap分析**: GAP_ANALYSIS.md 参照

### [ ] Task 6.1: examples/mvp-demo.ts 作成
- **目的**: ai_Docs/output_samples/mvp_dist/ を再現するDraftOleコード
- **成果物**:
  - `examples/mvp-demo.ts` - DraftOleでTodoアプリを生成
  - `output/mvp_demo/` - index.html, style.css, script.js
- **工数**: 3-5時間
- **アプローチ**:
  - HTML構造をDraftOleで構築
  - CSS変数・gradientは生文字列で対応（短期）
  - JS操作はJQueryManagerで実装
  - FileExporterで3ファイル出力

### [ ] Task 6.2: tests/integration/mvp-output.test.ts 追加
- **目的**: デモ出力の自動テスト
- **成果物**: 統合テスト追加
- **工数**: 2時間

### [ ] Task 6.3: examples/README.md 作成
- **目的**: examples/の使用方法説明
- **成果物**: サンプル実行手順のドキュメント
- **工数**: 30分

### [ ] Task 6.4: package.json スクリプト追加
```json
{
  "scripts": {
    "examples:mvp": "tsx examples/mvp-demo.ts",
    "examples:build": "tsx examples/**/*.ts"
  }
}
```

---

## P1: 高優先度 — ドッグフーディングDX改善

> **出典**: `lp/dogfooding-log.md`（2026-04-08）

### [ ] DF-3: Text() HTMLエスケープのデフォルト化
- **対象**: `src/html/elements/text-type.ts`
- **現状**: `Text()` は `<`, `>`, `&` をエスケープしない。`<pre><code>` 内のHTMLコード例が壊れる
- **改善**: デフォルトでHTMLエスケープ。`escapeHtml` は既にexportされているので利用可能。opt-outオプション（raw text）も必要
- **工数**: 1-2時間

### [ ] DF-4: `<pre>` 内レンダラーインデント抑制
- **対象**: `src/html/utils/html-formatter.ts`
- **現状**: HTMLFormatterが全要素にインデントを追加。`<pre>` 内の整形済みテキストに不要な空白が混入
- **改善**: `<pre>` タグ内の子要素にはインデントを追加しない
- **工数**: 1-2時間

### [ ] DF-5: CSS APIショートハンド（5段階→3段階チェーン）
- **対象**: `src/html/elements/html-tag.ts`, 新規 `src/html/elements/style-proxy.ts`
- **現状**: `element.css.styleManager.style.font.setFontSize('48px')` は5段階のドットチェーン
- **改善**: `element.style.font.setFontSize('48px')` で済むように `style` ゲッターを HtmlTag に追加
- **工数**: 1時間

---

## P1: 高優先度 — CFA構造改善（依存方向修正 + DI導入）

> **出典**: `ai_Docs/cfa-report.md`（2026-02-11 診断）
> **前提**: P0（MVP Demo）完了後に着手
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

## P2: 中優先度 — 機能拡張 + ファイル分割

### ドッグフーディング由来タスク

#### [ ] DF-6: `<!DOCTYPE html>` 出力オプション
- **対象**: `src/html/elements/root.ts`
- **現状**: Root.render() は DOCTYPE 宣言を出力しない
- **改善**: Root にオプション（例: `doctype: true`）を追加、render() の先頭に `<!DOCTYPE html>\n` を出力
- **工数**: 30分

#### [ ] DF-7: `setFlex()` CSSショートハンド追加
- **対象**: `src/css/style/flex/css-flex.ts`
- **現状**: `flex: 1` を設定するには `setFlexGrow('1')` + `setFlexShrink('1')` + `setFlexBasis('0%')` が必要
- **改善**: `setFlex('1')` で `flex-grow: 1; flex-shrink: 1; flex-basis: 0%` を一括設定
- **工数**: 30分

#### [ ] DF-8: コンポーネントテンプレート/プリセット機能
- **対象**: 新規設計
- **現状**: 同一スタイルのボタンやカードを作る際にコード重複が多い（LP で CTAボタン8行×2箇所）
- **改善**: スタイルプリセット or コンポーネントファクトリの仕組みを検討
- **工数**: 要設計（spec作成推奨）

### 機能拡張タスク

#### [ ] Task 6.5: CSS変数機能の実装
- CssManagerに:rootサポート追加
- 型安全なCSS変数管理
- 工数: 2-3時間
- **推奨**: CFA-A（P1）完了後に着手すると設計品質向上

#### [ ] Task 6.6: radial-gradient実装
- CSSBackground.setRadialGradient()追加
- 複数グラデーション対応
- 工数: 1-2時間

#### [ ] Task 6.7: examples/基本例追加
- basic-html.ts - 基本的なHTML生成
- styled-component.ts - CSS統合例
- interactive-page.ts - JS統合例
- 工数: 3時間

### CFA Phase B: 巨大ファイル分割

> **推奨spec**: `spec/split-large-files`
> **目標**: マージ容易性の向上。1ファイル1責務に近づける

#### [ ] CFA-B.1: attribute-builder.ts 分割
- **対象**: `src/html/attributes/attribute-builder.ts`（966行、6クラス混在）
- **改善**: ビルダーごとにファイル分割
  - `base-attribute-builder.ts`
  - `form-attribute-builder.ts`
  - `input-attribute-builder.ts`
  - `image-attribute-builder.ts`
  - `link-attribute-builder.ts`
  - `button-attribute-builder.ts`
- **工数**: 2-3時間

#### [ ] CFA-B.2: factories.ts 分割
- **対象**: `src/html/tags/factories.ts`（805行、56タグファクトリ関数）
- **改善**: カテゴリ別に分割
  - `structure-tags.ts`（div, section, article, header, footer 等）
  - `form-tags.ts`（form, input, select, textarea 等）
  - `text-tags.ts`（p, span, h1-h6, a 等）
  - `media-tags.ts`（img, video, audio 等）
  - `table-tags.ts`（table, tr, td, th 等）
- **工数**: 2-3時間

#### [ ] CFA-B.3: attribute-keys.ts 分割
- **対象**: `src/html/attributes/attribute-keys.ts`（613行）
- **改善**: 属性種別ごとにファイル分割（BooleanAttributeKey, KeyValueAttributeKey, AriaAttributeKey 等）
- **工数**: 1-2時間

#### [ ] CFA-B.4: index.ts エクスポート分散
- **対象**: `src/index.ts`（218行、全モジュールのエクスポート集約）
- **改善**: モジュール別の re-export ファイルに分割（例: `index-html.ts`, `index-css.ts`）
- **注意**: パブリックAPIのため破壊的変更に注意。サブパスエクスポート（`draft-ole/html`, `draft-ole/css`）の検討
- **工数**: 1-2時間

---

## P3: 低優先度 — 型定義分散 + CSS拡張 + 改善

### CFA Phase C: 型定義の分散

> **着手条件**: P1, P2 完了後。急がない

#### [ ] CFA-C.1: errors.ts のエラーコード分散
- **対象**: `src/utils/errors.ts`（165行、全モジュールのエラーコード型が集約）
- **改善**: エラーコード型をモジュールごとに分散配置
- **工数**: 1時間

#### [ ] CFA-C.2: style-keys.ts カテゴリ別分割
- **対象**: `src/css/style/style-keys.ts`（224行、146 CSSプロパティキー）
- **改善**: カテゴリ別に分割（現状はconst objectなので衝突リスクは中程度）
- **工数**: 1時間

### CSS拡張（Swift版移植候補）

> **Note**: デモ動作には不要。output_samplesの完全再現時に実装

#### [ ] MVP-2.3: CSS変数（Custom Properties）サポート
- `:root { --bg: #0b1220; }` + `var(--name)` 参照
- Swift版実装済み（`CssVariableStore`, `CssVariableValue`）。TS版への移植が必要

#### [ ] MVP-2.4: 疑似セレクタサポート
- `:hover`, `:focus`, `:active` 等
- Swift版・TS版ともに未実装。新規設計が必要

#### [ ] MVP-2.5: 複合セレクタサポート
- `.row.meta`, `.item.done .text` 等
- Swift版・TS版ともに未実装。新規設計が必要

#### [ ] MVP-3.3: DOMContentLoadedラッパー
- `defer`属性で代替可能
- 優先度: 低

### その他改善

#### [ ] テストフレームワークの統一（Swift版）
- Swift Testing (新): 16ファイル、54テスト → XCTest (旧): 7ファイル、91テスト
- Swift Testing への統一移行

---

## P4: 将来 — 宣言的API / SSG / Webアプリ

> **着手条件**: P0〜P2 完了後
> **注意**: Swift版タスクはTypeScript移行により凍結状態。参考資料として保持

### 宣言的API改善（Post-MVP）

> **目標**: DraftOleを「SwiftUIライクな宣言的DSL」に進化させる
> **優先度**: MVP完了後、v1.1〜v2.0で段階的に実施

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

> **目標**: v1.0 SSG版リリース

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 1-A | CLI実装（build/serve） | ⚪ 未着手 |
| 1-B | コンテンツ読込（JSON/YAML/Markdown） | ⚪ 未着手 |
| 1-C | テンプレート分離 | ⚪ 未着手 |
| 1-D | 開発サーバー（ホットリロード） | ⚪ 未着手 |
| 1-E | ドキュメント・サンプル | ⚪ 未着手 |

### Webアプリフレームワーク（Phase 2）

> **前提**: Phase 1（SSG）完成後

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 2-A | Vapor統合 | ⚪ 未着手 |
| 2-B | HTMX統合（動的UI対応） | ⚪ 未着手 |

### Post-MVP 実行順序

```
MVP完成（P0完了）
    ↓
CFA構造改善（P1）→ 機能拡張+分割（P2）→ 型分散（P3）
    ↓
Phase B: 開発体験改善
    ↓
Phase E: データとコンテンツの分離
    ↓
Phase 2-B: HTMX統合
    ↓
Phase C: UIコンポーネント
    ↓
Phase D: ドキュメント
    ↓
🎉 v1.0 リリース
```

### マイルストーン

| バージョン | 達成状態 |
|-----------|---------|
| **v0.9** | MVP Demo完成（P0） |
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

> **出典**: `audit_report_20260202_215822.md`
> **優先度**: 投稿時に対応（開発タスクとは独立）

| ID | 内容 | 優先度 | トリガー |
|----|------|:------:|---------|
| BIP-1 | Bluesky投稿用：コードブロック対応 | 中 | Bluesky投稿前 |
| BIP-2 | X/Twitter投稿用：コードブロック対応 | 中 | X投稿前 |
| BIP-3 | DEV.to投稿時：front matter調整 | 低 | DEV.to投稿時 |
| BIP-4 | 開発期間表記の修正 | 低 | 任意 |
| BIP-TD-1 | コンテンツ種別の命名規則定義 | 低 | 週次報告再開時 |

---
---

# 以下はアーカイブ（参考・参照用）

> **注意**: 以下のセクションはSwift版の参照情報、完了済みタスク、詳細な設計メモを含みます。
> TypeScript移行により**凍結状態**。新規開発の参考資料として保持しています。

---

## Swift版に未実装の機能（TS版で先行実装済み）

### js-publisher: FileExporter（3ファイル統合出力機能）
- [ ] **FileExporter** — HTML + CSS + JSの3ファイル統合出力とタグ自動挿入
  - _Note: TypeScript版実装済み（`src/publisher/file-exporter.ts`、2026-02-09）_
  - _Swift版の現状: `OlePublisher.swift` は単純なcontentラッパーのみ_

### reset.css の扱いの差異
- [~] **reset.css バンドル方式の違い**
  - _Swift版: `Resources/uaPlus.css` としてファイルをコピーする方式_
  - _TypeScript版: 文字列定数として埋め込む方式（`src/publisher/reset-css.ts`）_
  - _Note: 両方とも有効なアプローチであり、統一は不要（設計判断の違い）_

## Swift版からTS版に移行しなかった項目

### 3.10 CSS拡張（myTask MVP-2.3〜2.5 由来）
- [~] CSS変数（Custom Properties）サポート — → P3: MVP-2.3 に記載
- [~] 疑似セレクタサポート — → P3: MVP-2.4 に記載
- [~] 複合セレクタサポート — → P3: MVP-2.5 に記載

### 3.11 Fluent CSS API（myTask D-3.1〜3.2 由来）
- [~] スタイルメソッドチェーン — → P4: 宣言的API に記載
- [~] レイアウトショートカット — → P4: 宣言的API に記載

### 3.12 確認
- [ ] スコープドCSSが生成できる（3.10〜3.11のFluent API完了後に最終確認）

---

## 完了済みPhase詳細

### ✅ Phase 1: HTMLタグの拡充
> MVP-1.1, MVP-1.2, MVP-1.3 完了（2026-02-01）

### ✅ Phase 2: CSS出力（コア）
> MVP-2.1 完了（2026-02-02）、MVP-2.2 完了（2026-02-02）、MVP-2.6 完了（2026-02-05）

### ✅ Phase 3: JavaScript出力（コア）
> MVP-3.1, MVP-3.2, MVP-3.4 完了（2026-02-02）

### ✅ Bug修正
> Bug 1（root_css_render）✅、Bug 2（OleCalculator未定義）✅、Bug 3（addChild CSS消失）✅

### 完了済みタスク一覧

| 順序 | タスクID | 内容 | 完了日 |
|:---:|---------|------|--------|
| 1 | MVP-1.1 | TagType追加 | 2026-02-01 |
| 2 | MVP-1.2 | 属性サポート | 2026-02-01 |
| 3 | MVP-1.3 | class API | 2026-02-01 |
| 4 | MVP-2.2 | CSSプロパティrender() | 2026-02-02 |
| 5 | MVP-2.1 | HtmlStyle.render()修正 | 2026-02-02 |
| 6 | MVP-2.6 | CSSファイル生成 | 2026-02-05 |
| 7 | MVP-3.1 | イベントハンドラ | 2026-02-02 |
| 8 | MVP-3.2 | DOM操作メソッド | 2026-02-02 |
| 9 | MVP-3.4 | $()ヘルパー生成 | 2026-02-02 |
| — | D-1.1 | Bug 3修正（CSS消失） | 2026-02-05 |
| — | typo | Rendarable → Renderable | 2026-02-05 |

---

## Swift版 Phase 1 ゴール（参考）

> **DraftOle = 型安全なHugo/Jekyll**
> 入力: Markdown / JSON / YAML + DraftOle DSL テンプレート
> 出力: `dist/` に静的HTML/CSS/JSファイル群
> 差別化: **HTML + CSS + JS を一括で型安全に生成**できる唯一のSSG

### "使える"の判定基準（受入基準）
- **Quickstart**: 10分以内にデモ生成〜ブラウザ表示まで到達
- **品質**: HTML/CSS/JS出力が破綻しない
- **再現性**: 同じ入力から同じ出力が得られる

### jQuery相当の範囲
- Selector: `$()`（class/id/tag/階層の基本）
- Style: `.css(...)`（spacing / flex / border / color 等）
- Event: `.on(...)` / `.click(...)`
- DOM: `.text()` / `.html()` / `.addClass()` / `.removeClass()` / `.toggle()`

### 非ゴール
- SPAフレームワーク互換
- jQuery APIの網羅
- 高度な最適化
- ブラウザ互換性の細部保証

---

## Swift版 未完了タスク詳細（凍結）

> **注意**: 以下はSwift版のタスク詳細です。TypeScript移行後は参考資料として保持。
> 実装する場合はTypeScript版で同等機能をspecとして新規作成してください。

### Phase 4: 統合エクスポート（Swift版）

#### [ ] MVP-4.1. OlePublisherの3ファイル出力対応
- TS版: `src/publisher/file-exporter.ts` で実装済み

#### [ ] MVP-4.2. ファイル参照の自動設定
- TS版: FileExporterに含まれる

### Phase 5: デモ統合・ドキュメント（Swift版）

#### [ ] MVP-5.1〜5.4
- TS版: Task 6.1〜6.4（P0）として再定義済み

### 宣言的API詳細（Phase D）

#### [ ] D-1.2. addChild戻り値の変更（チェーン可能に）
- `addChild()` を `Void` → `Self` 返却に変更
- 効果: `.addChild(p()).addChild(span())` のチェーンが可能

#### [ ] D-2.1〜D-2.5: Result Builder導入
- HTMLBuilder実装 → タグファクトリ拡張 → テキストノード変換 → 条件分岐 → ループサポート
- SwiftUIライクなネスト構文: `div { p { "Hello" } }`

#### [ ] D-3.1〜D-3.2: Fluent CSS API
- スタイルメソッドチェーン: `.fontSize(24).color('#333').padding(16)`
- レイアウトショートカット: `.flex({ direction: 'column' })`

#### [ ] D-4.1: イミュータブル設計（v2.0検討）
- `class` → `struct` への移行検討

### SSG完成タスク詳細（Phase 1-A〜E）

#### Phase 1-A: CLI実装
- 1-A.1: ArgumentParserパッケージ追加
- 1-A.2: buildコマンド実装
- 1-A.3: serveコマンド実装

#### Phase 1-B: コンテンツ読込
- 1-B.1〜1-B.5: ContentLoader / JSONLoader / YAMLLoader / MarkdownLoader / Frontmatter

#### Phase 1-C: テンプレート分離
- 1-C.1: HTMLComponentプロトコル
- 1-C.2: LayoutTemplate実装

#### Phase 1-D: 開発サーバー
- 1-D.1: ファイルウォッチャー
- 1-D.2: ローカルサーバー（SwiftNIO）
- 1-D.3: ブラウザ自動リロード

#### Phase 1-E: ドキュメント・サンプル
- 1-E.1: README Quickstart
- 1-E.2: サンプルサイト
- 1-E.3: APIリファレンス（DocC）

### Webアプリフレームワーク詳細（Phase 2）

#### Phase 2-A: Vapor統合
- 2-A.1: Vapor用Response拡張
- 2-A.2: DraftOle + Vapor統合サンプル

#### Phase 2-B: HTMX統合
- 2-B.1: HTMX属性サポート
- 2-B.2: HTMX型安全API
- 2-B.3: HTMXスクリプト自動挿入
- 2-B.4: Vapor連携サンプル

### Post-MVP詳細

#### Phase B: 開発体験改善
- POST-B.1: ファイルウォッチャー
- POST-B.2: 簡易ローカルサーバー
- POST-B.3: ブラウザ自動リロード
- POST-B.4: CLIコマンド整備

#### Phase C: UIコンポーネント集
- POST-C.1: 基本コンポーネント（Container, Grid, Stack, Card, TextField, Button, Select, Checkbox, Alert, Badge）
- POST-C.2: テーマシステム
- POST-C.3: ダークモード対応

#### Phase D: ドキュメント・サンプル
- POST-D.1: 実用サンプル集
- POST-D.2: APIリファレンス
- POST-D.3: チュートリアル
- POST-D.4: 宣伝コンテンツ

#### Phase E: データとコンテンツの分離
- POST-E.1〜E.10: ContentLoader → JSON/YAML/Markdown → HTMLComponent → LayoutTemplate → ビルドコマンド

---

## 問題点と改善タスク（Swift版・凍結）

### 優先度：低
- [ ] 5. デバッグprint文の削除（Swift版 Root.swift, LazyLayoutManager）
- [ ] 6. テスト用publicメソッドの整理（`_testable_` プレフィックス）
- [ ] 7. 相対パス依存の検討（oleSample_02/Package.swift）
- [ ] 8. DocCコメントの充実
- [ ] 9. よくあるパターン集の追加
- [ ] 10. エラーメッセージの改善

### 将来フェーズ
- 1.3: 依存関係グラフ生成時に循環参照ノードを明示
- 3.1, 3.2: HTMLTagProtocol責務分離 → CFA-A に統合
- 4.1-4.5: モジュール分割
- JQueryManager eventType型安全性: `String` → `EventType` enum

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
