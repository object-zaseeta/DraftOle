# DraftOle TypeScript版 - 現在のタスク

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

### 🎯 次のステップ: MVP Demo作成（最優先）

#### 📋 Gap分析済み（GAP_ANALYSIS.md参照）
**Gap 1**: CSS変数（:root）生成 - ⚠️ 中優先度（生CSS対応で暫定OK）
**Gap 2**: radial-gradient - ⚠️ 低-中優先度（生CSS対応で暫定OK）
**Gap 3**: デモコード不在 - 🔴 **最高優先度（今すぐ実装）**
**Gap 4**: ドキュメント不足 - ⚠️ 中優先度

---

## 🚀 即時対応タスク（Gap 3解決）

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

## 📌 中期タスク（Phase 6以降）

### [ ] Task 6.5: CSS変数機能の実装
- CssManagerに:rootサポート追加
- 型安全なCSS変数管理
- 工数: 2-3時間

### [ ] Task 6.6: radial-gradient実装
- CSSBackground.setRadialGradient()追加
- 複数グラデーション対応
- 工数: 1-2時間

### [ ] Task 6.7: examples/基本例追加
- basic-html.ts - 基本的なHTML生成
- styled-component.ts - CSS統合例
- interactive-page.ts - JS統合例
- 工数: 3時間

---

# Swift版に未実装の機能（TS版で先行実装済み）

### js-publisher: FileExporter（3ファイル統合出力機能）
- [ ] **FileExporter** — HTML + CSS + JSの3ファイル統合出力とタグ自動挿入
  - _Note: TypeScript版実装済み（`src/publisher/file-exporter.ts`、2026-02-09）_
  - _Swift版の現状: `OlePublisher.swift` は単純なcontentラッパーのみ_
  - _必要な機能:_
    - HTML/CSS/JSの3ファイルを一括出力
    - HTMLに `<link rel="stylesheet" href="...">` タグを自動挿入
    - HTMLに `<script defer src="...">` タグを自動挿入
    - CSS/JS空時のファイル出力スキップ
    - ファイル名のカスタマイズ（デフォルト: `index.html`, `style.css`, `script.js`）
  - _参考実装: TypeScript版 `src/publisher/file-exporter.ts`_
  - _対応タスク: 既存のmyTask MVP-4.1, MVP-4.2 を参照_

### reset.css の扱いの差異
- [~] **reset.css バンドル方式の違い**
  - _Swift版: `Resources/uaPlus.css` としてファイルをコピーする方式_
  - _TypeScript版: 文字列定数として埋め込む方式（`src/publisher/reset-css.ts`）_
  - _Note: 両方とも有効なアプローチであり、統一は不要（設計判断の違い）_

# Swift版からTS版に移行しなかった項目

### 3.10 CSS拡張（myTask MVP-2.3〜2.5 由来）
- [~] CSS変数（Custom Properties）サポート — `:root { --bg: #0b1220; }` + `var(--name)` 参照
  - _Note: Swift版実装済み（`CssVariableStore`, `CssVariableValue`、2026-02-04）。TS版への移植が必要_
- [~] 疑似セレクタサポート — `:hover`, `:focus`, `:active` 等
  - _Note: Swift版・TS版ともに未実装。新規設計が必要_
- [~] 複合セレクタサポート — `.row.meta`, `.item.done .text` 等
  - _Note: Swift版・TS版ともに未実装。新規設計が必要_

### 3.11 Fluent CSS API（myTask D-3.1〜3.2 由来）
- [~] スタイルメソッドチェーン — `.fontSize(24).color('#333').padding(16)`
  - _Note: Swift版・TS版ともに未実装。新規設計が必要_
- [~] レイアウトショートカット — `.flex({ direction: 'column' })`, `.grid({ columns: '1fr 1fr' })`
  - _Note: Swift版・TS版ともに未実装。新規設計が必要_

### 3.12 確認
- [ ] スコープドCSSが生成できる（3.10〜3.11のFluent API完了後に最終確認）
```typescript
const btn = div().css.backgroundColor('blue').css.padding('10px');
btn.renderCss(); // => '._hash123 { background-color: blue; padding: 10px; }'
```




# 以下は、参考、参照ように残しておく
## DraftOle Swift版 プロジェクト改善TODO

## プロジェクト概要
- **定義**: 型安全なHTML/CSS/JS DSLライブラリ
- **移行状況**: **Swift → TypeScript 移行中**（2026-02〜）
- **Swift版**: 参照実装として残存（`DraftOle0.2/`）— 新規開発は停止
- **TypeScript版**: メイン開発対象（`src/`）— 詳細は [tsTransferTask.md](tsTransferTask.md) 参照
- **構成**: 同一リポジトリ内にSwift版（DraftOle0.2/）とTypeScript版（src/）が共存
- **分析日**: 2026-01-28
- **最終更新**: 2026-02-09（TypeScript css-module コア実装完了）
- **Vision**: `.kiro/steering/vision.md` 参照　（Swift版のアドレス）

---

## 🎯 Phase 1 ゴール：静的サイトジェネレーター（SSG）

### 1) 何ができるツールか（約束する価値）

**DraftOle = 型安全なHugo/Jekyll**

```
$ draftole build

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  content/       │     │  DraftOle       │     │  dist/          │
│  ├─ posts/*.md  │  →  │  Templates      │  →  │  ├─ index.html  │
│  ├─ config.json │     │  (Swift DSL)    │     │  ├─ style.css   │
│  └─ data/*.yaml │     │                 │     │  └─ posts/*.html│
└─────────────────┘     └─────────────────┘     └─────────────────┘
    コンテンツ             型安全テンプレート        静的ファイル
```

- 入力: Markdown / JSON / YAML + Swift（DraftOle DSL テンプレート）
- 出力: `dist/` に静的HTML/CSS/JSファイル群
- デプロイ先: GitHub Pages, Netlify, Vercel
- 差別化: **HTML + CSS + JS を一括で型安全に生成**できる唯一のSSG

### 2) 使えることを証明するデモ（最重要成果物）
`oleSample_02` が **ブラウザで動く完成デモ** を生成する。

- デモ要件（例）:
  - 1ページ完結の小アプリ（Todo / 簡易フォーム + バリデーション / カウンタ/電卓 など）
  - CSSで「見た目が整っている」（余白・フォント・レイアウトが最低限破綻しない）
  - JSで「操作に反応する」（クリック/入力/表示切替のいずれか）
- 実行: `swift run oleSample_02`
- 生成先: `oleSample_02/dist/`（生成先は固定し、READMEに明記）
- 期待: 生成された `index.html` をダブルクリックで開いて動作確認できる（サーバ不要）

### 3) “使える”の判定基準（受入基準）
外部ユーザーが試せる状態を、以下で定義する。

- **Quickstart**: READMEの手順どおりに、10分以内にデモ生成〜ブラウザ表示まで到達できる
- **安定性**: 主要APIがドキュメント化され、サンプルが最新版と同期している
- **品質**:
  - HTML出力が破綻しない（タグ閉じ忘れ/エスケープ/インデントの一貫性）
  - CSS出力に不正値が出ない（例: `nilString` のような値は出力しない）
  - JS出力が構文的に正しい（`;`結合など含め、生成物が実行エラーにならない）
- **再現性**: 同じ入力から同じ出力が得られる（差分管理できる）

### 3.5) 目標となる出力見本（参考）
MVPで生成されるべき `dist/` の出力イメージは、以下に置いた静的ファイルを参照。

- `ai_Docs/output_samples/mvp_dist/index.html`
- `ai_Docs/output_samples/mvp_dist/style.css`
- `ai_Docs/output_samples/mvp_dist/app.js`

### 4) jQuery相当（DraftOleで“やる”範囲）
「jQuery全部」ではなく、デモを成立させる最小セットを“仕様として”固定する。

- Selector: `$()`（class/id/tag/階層の基本）
- Style: `.css(...)`（fontだけでなく spacing / flex / border / color などの主要系も対応）
- Event: `.on(...)` または `.click(...)`（最低1種）
- DOM: `.text()` / `.html()` / `.addClass()` / `.removeClass()` / `.toggle()` などから最低2種

### 5) 非ゴール（最初から狙わない）
- SPAフレームワーク互換（React/Vue等）
- jQuery APIの網羅
- 高度な最適化（minify/bundle/Tree-shaking）
- ブラウザ互換性の細部保証（まずはモダンブラウザ前提）

---

## 進捗サマリー

### Phase 1: SSG（静的サイトジェネレーター）
| ステップ                  | 内容                   | 状態                        |
| ------------------------- | ---------------------- | --------------------------- |
| **1-0: コアライブラリ**   | HTML/CSS/JS生成機能    | 🟡 75%完了（HTML✅/CSS✅/JS✅） |
| **1-A: CLI**              | `draftole build/serve` | ⚪ 未着手                    |
| **1-B: コンテンツ読込**   | JSON/YAML/Markdown     | ⚪ 未着手                    |
| **1-C: テンプレート分離** | データとコードの分離   | ⚪ 未着手                    |
| **1-D: 開発サーバー**     | ホットリロード対応     | ⚪ 未着手                    |
| **1-E: ドキュメント**     | サンプル・Quickstart   | ⚪ 未着手                    |

### 詳細
- **完了**: 11/18 タスク → [Done.md](Done.md) 参照
- **発見したバグ**: 3件 → すべて修正済み ✅
- **コアライブラリ（1-0）進捗**: 約75%（HTMLタグ90%, CSS 70%, JS 60%）

---

## 🚀 Phase 1-0: コアライブラリ完成（MVP）

> **目標**: DraftOleでHTML/CSS/JSを生成できるコア機能を完成させる
> **完了条件**: `swift run oleSample_02` で動作するTodoデモを生成できる
> **参考出力**: `ai_Docs/output_samples/mvp_dist/`

### 現状カバレッジ
```
HTML構造:     █████████░  90%（56タグ追加完了）
CSSプロパティ: ███████░░░  70%（外部CSS生成・バグ修正完了）
JavaScript:   ██████░░░░  60%（イベント/DOM操作/ヘルパー生成完了）
エクスポート:  █████░░░░░  50%（CSS外部ファイル出力対応）
────────────────────────────
総合:         ███████▌░░  約75%
```

---

### ✅ Phase 1: HTMLタグの拡充 → [Done.md](Done.md)

> MVP-1.1, MVP-1.2, MVP-1.3 完了（2026-02-01）

---

### 🟡 Phase 2: CSS出力の完成（優先度: 高）

#### ✅ MVP-2.1. HtmlStyle.render()の修正 → [Done.md](Done.md)

> 完了（2026-02-02）: 7プロパティ統合出力、24テストケース

#### ✅ MVP-2.2. 各CSSプロパティクラスにrender()実装 → [Done.md](Done.md)

> 完了（2026-02-02）: 6クラスにrender()実装、38プロパティキー追加、8テストスイート

#### [ ] MVP-2.3. CSS変数（Custom Properties）サポート
- **場所**: 新規ファイル作成が必要
- **output_samplesの例**:
  ```css
  :root {
    --bg: #0b1220;
    --accent: #7c5cff;
    --danger: #ef4444;
    --shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
    --radius: 14px;
  }
  ```
- **対策案**:
  1. `CSSVariables`クラスを新規作成
  2. Root要素で変数を定義
  3. 他のスタイルで`var(--name)`として参照可能に

#### [ ] MVP-2.4. 疑似セレクタサポート
- **場所**: CSS出力ロジック全般
- **output_samplesで使用**:
  - `:hover` - ボタンホバー時
  - `:focus` - input要素フォーカス時
- **対策案**:
  ```swift
  paragraph.css.pseudoClass(.hover) { style in
      style.backgroundColor.color = CSSColor("#fff")
  }
  ```

#### [ ] MVP-2.5. 複合セレクタサポート
- **output_samplesの例**:
  - `.row.meta` - 複数クラス
  - `.item.done .text` - 子孫セレクタ
  - `.btn.primary` - 状態クラス
- **対策**: セレクタ生成ロジックの拡張

#### ✅ MVP-2.6. 外部CSSファイル生成機能 → [Done.md](Done.md)

> 完了（2026-02-05）: CssOutputMode/CssVariableStore/CssFilePublisher実装

---

### ✅ Phase 3: JavaScript出力の完成 → [Done.md](Done.md)

> MVP-3.1, MVP-3.2, MVP-3.4 完了（2026-02-02）

#### [ ] MVP-3.3. DOMContentLoadedラッパー（後回し可）
- **対策**: `defer`属性で代替可能
- **優先度**: 低

#### [ ] MVP-3.5. 外部JSファイル生成機能
- **場所**: `DraftOle0.2/Sources/Publisher/`
- **対策**: `JsPublisher`クラスを新規作成

---

### 🟢 Phase 4: 統合エクスポート（優先度: 低〜中）

#### [ ] MVP-4.1. OlePublisherの3ファイル出力対応
- **場所**: `DraftOle0.2/Sources/Publisher/OlePublisher.swift`
- **現状**: 単一`content`のみ
- **対策**:
  ```swift
  class OlePublisher {
      var htmlContent: String
      var cssContent: String
      var jsContent: String

      func exportAll(to path: URL) {
          export(htmlContent, as: "index.html", to: path)
          export(cssContent, as: "style.css", to: path)
          export(jsContent, as: "app.js", to: path)
          copyResetCSS(to: path)
      }
  }
  ```

#### [ ] MVP-4.2. ファイル参照の自動設定
- **場所**: `DraftOle0.2/Sources/HTML/HtmlTag.swift:72-75`
- **現状**:
  ```swift
  private func cssDescription() -> String {
      "<link rel=\"stylesheet\" href=\"\(CONST.ResetCSS)\">" +
      "<link rel=\"stylesheet\" href=\"\(CONST.DefaultCSS)\">"
  }
  ```
- **対策**: `<script defer src="./app.js"></script>`も自動追加

---

### 🟣 Phase 5: デモ統合・ドキュメント（優先度: MVP完成に必須）

> **ゴール2, 3との整合性確保のため追加**

#### [ ] MVP-5.1. oleSample_02をTodoデモ生成に更新
- **場所**: `oleSample_02/Sources/main.swift`
- **現状**: `DraftOleDemo`構造体で基本デモのみ
- **対策**:
  1. output_samples/mvp_dist/index.html と同等のHTML構造を生成
  2. Todoアプリとして動作するUI構築
  ```swift
  // main.swift
  var demo = TodoAppDemo()
  demo.buildAndExport()
  ```
- **依存タスク**: MVP-1.1〜1.3, MVP-4.1

#### [ ] MVP-5.2. main.swiftでエクスポート処理を実行
- **場所**: `oleSample_02/Sources/main.swift`
- **対策**:
  ```swift
  let publisher = OlePublisher(
      htmlContent: root.render(),
      cssContent: root.collectCssStyleString(),
      jsContent: root.jqm.render()
  )
  let distPath = URL(fileURLWithPath: "dist")
  publisher.exportAll(to: distPath)
  print("Generated: dist/index.html, dist/style.css, dist/app.js")
  ```
- **ゴール対応**: `swift run oleSample_02` で `dist/` に出力
- **依存タスク**: MVP-4.1, MVP-5.1

#### [ ] MVP-5.3. README.mdにQuickstart手順を追記
- **場所**: `README.md`（プロジェクトルート）
- **追記内容**:
  ```markdown
  ## Quickstart（10分以内で試せる）

  1. リポジトリをクローン
     ```bash
     git clone <repo-url>
     cd DraftOle_0.2
     ```
  2. デモを実行
     ```bash
     swift run oleSample_02
     ```
  3. ブラウザで確認
     ```bash
     open oleSample_02/dist/index.html
     ```
  ```
- **ゴール対応**: 受入基準「10分以内にデモ生成〜ブラウザ表示」
- **依存タスク**: MVP-5.2（動作確認後に記述）

#### [ ] MVP-5.4. 主要APIのドキュメント作成
- **場所**: `README.md` または `docs/` ディレクトリ
- **対象API**:
  | クラス/プロトコル          | 説明                     |
  | -------------------------- | ------------------------ |
  | `TagManager`               | HTMLタグ生成のファクトリ |
  | `Root` / `PairTagType`     | HTML要素の構築           |
  | `CssManager` / `HtmlStyle` | CSSスタイル設定          |
  | `JQueryManager`            | JavaScript生成           |
  | `OlePublisher`             | ファイルエクスポート     |
- **ゴール対応**: 受入基準「主要APIがドキュメント化」
- **依存タスク**: Phase 1〜4完了後

---

### 📊 タスク依存関係（更新版）

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: HTML                                                   │
│   MVP-1.1 TagType追加                                           │
│       ↓                                                         │
│   MVP-1.2 属性サポート → MVP-1.3 class API                       │
└─────────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: CSS                                                    │
│   MVP-2.2 CSSプロパティrender() → MVP-2.1 HtmlStyle.render()修正 │
│       ↓                              ↓                          │
│   MVP-2.3 CSS変数 ─────────────→ MVP-2.6 CSSファイル生成         │
│       ↓                                                         │
│   MVP-2.4 疑似セレクタ → MVP-2.5 複合セレクタ                     │
└─────────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3: JavaScript                                             │
│   MVP-3.1〜3.4 JS機能 → MVP-3.5 JSファイル生成                   │
└─────────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 4: 統合エクスポート                                        │
│   MVP-4.1 OlePublisher 3ファイル出力 → MVP-4.2 参照自動設定       │
└─────────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 5: デモ統合・ドキュメント（ゴール達成）                      │
│   MVP-5.1 oleSample_02 Todoデモ → MVP-5.2 エクスポート実行        │
│                                       ↓                         │
│                                  MVP-5.3 README Quickstart       │
│                                       ↓                         │
│                                  MVP-5.4 APIドキュメント          │
└─────────────────────────────────────────────────────────────────┘
                    ↓
              🎯 MVP完成
```

### 📋 実装順序（推奨）

| 順序  | タスクID          | 内容                   | 状態             |
| :---: | ----------------- | ---------------------- | ---------------- |
|   1   | MVP-1.1           | TagType追加            | ✅ 完了           |
|   2   | MVP-1.2           | 属性サポート           | ✅ 完了           |
|   3   | MVP-1.3           | class API              | ✅ 完了           |
|   4   | MVP-2.2           | CSSプロパティrender()  | ✅ 完了           |
|   5   | MVP-2.1           | HtmlStyle.render()修正 | ✅ 完了           |
|   6   | MVP-2.6           | CSSファイル生成        | ✅ 完了           |
|   7   | MVP-3.1           | イベントハンドラ       | ✅ 完了           |
|   8   | MVP-3.2           | DOM操作メソッド        | ✅ 完了           |
|   9   | MVP-3.4           | $()ヘルパー生成        | ✅ 完了           |
|  10   | MVP-3.5           | JSファイル生成         | 外部JS対応       |
|  11   | MVP-4.1           | 3ファイル出力          | 統合エクスポート |
|  12   | MVP-4.2           | 参照自動設定           | HTML内リンク     |
|  13   | MVP-5.1           | Todoデモ構築           | 実証デモ         |
|  14   | MVP-5.2           | エクスポート実行       | 動作確認         |
|  15   | MVP-5.3           | README更新             | ユーザー向け     |
|  16   | MVP-5.4           | APIドキュメント        | 完成度向上       |
|   —   | MVP-2.3〜2.5, 3.3 | CSS変数/疑似セレクタ等 | **後回し可**     |

> **注**: MVP-2.3（CSS変数）、MVP-2.4（疑似セレクタ）、MVP-2.5（複合セレクタ）、MVP-3.3（DOMContentLoaded）は
> output_samplesの完全再現には必要だが、「動くデモ」の最小構成では後回し可能

### 🔄 並列実行可能タスク（Wave計画）

**Phase 2とPhase 3は互いに独立** → JS基盤完了済み、CSS基盤に集中

| Wave       | タスク（並列実行可）                                          | 完了後に解放 | 状態                 |
| ---------- | ------------------------------------------------------------- | ------------ | -------------------- |
| **Wave 1** | ~~MVP-3.1, MVP-3.2, MVP-3.4~~ / ~~MVP-2.2~~, MVP-2.3, MVP-2.4 | Wave 2       | ✅ JS完了/CSS基盤完了 |
| **Wave 2** | ~~MVP-2.1~~, MVP-2.5, MVP-3.5                                 | Wave 3       | ✅ MVP-2.1完了        |
| **Wave 3** | ~~MVP-2.6~~, MVP-4.1                                          | Wave 4       | 🟡 MVP-2.6完了        |
| **Wave 4** | MVP-4.2, MVP-5.1                                              | Wave 5       | ⚪ 未着手             |
| **Wave 5** | MVP-5.2 → MVP-5.3 → MVP-5.4                                   | 完了         | ⚪ 未着手             |

**Wave 1 現状**:
- 🎨 **CSS基盤**: ~~MVP-2.2（render実装）~~, MVP-2.3（CSS変数）, MVP-2.4（疑似セレクタ） → **✅ render完了/変数は後回し**
- ⚡ **JS基盤**: ~~MVP-3.1（イベント）, MVP-3.2（DOM操作）, MVP-3.4（$ヘルパー）~~ → **✅ 完了**

### 📌 推奨実行プラン（最短ルート）

> **目標**: 「動くデモ」を最速で達成するための実行計画
> **戦略**: 後回し可能タスク（MVP-2.3〜2.5, 3.3）を除外し、クリティカルパスに集中

#### Step 1: CSS出力基盤（並列実行）
| タスク      | 内容                  | 対象ファイル                 | 備考                        |
| ----------- | --------------------- | ---------------------------- | --------------------------- |
| **MVP-2.2** | CSSプロパティrender() | `Sources/CSS/Style/*/`       | Flex, Grid, Border等6クラス |
| **MVP-3.1** | イベントハンドラ      | `Sources/JS/JsManager.swift` | `.on()`, `.click()`         |
| **MVP-3.2** | DOM操作メソッド       | `Sources/JS/JsManager.swift` | `.text()`, `.addClass()`    |
| **MVP-3.4** | $()ヘルパー生成       | `Sources/JS/`                | jQueryライクランタイム      |

#### Step 2: 統合レイヤー（Step 1完了後）
| タスク      | 内容                   | 依存              |
| ----------- | ---------------------- | ----------------- |
| **MVP-2.1** | HtmlStyle.render()修正 | MVP-2.2           |
| **MVP-3.5** | JSファイル生成         | MVP-3.1, 3.2, 3.4 |

#### Step 3: エクスポート機能（Step 2完了後）
| タスク      | 内容            | 依存         |
| ----------- | --------------- | ------------ |
| **MVP-2.6** | CSSファイル生成 | MVP-2.1      |
| **MVP-4.1** | 3ファイル出力   | MVP-2.6, 3.5 |
| **MVP-4.2** | 参照自動設定    | MVP-4.1      |

#### Step 4: デモ完成（Step 3完了後）
| タスク      | 内容              | 依存    |
| ----------- | ----------------- | ------- |
| **MVP-5.1** | Todoデモ構築      | MVP-4.1 |
| **MVP-5.2** | エクスポート実行  | MVP-5.1 |
| **MVP-5.3** | README Quickstart | MVP-5.2 |
| **MVP-5.4** | APIドキュメント   | MVP-5.3 |

#### 🎯 クリティカルパス
```
✅MVP-2.2 → ✅MVP-2.1 → ✅MVP-2.6 ─┐
                                 ├→ MVP-4.1 → MVP-4.2 → MVP-5.1 → MVP-5.2 → MVP-5.3 → MVP-5.4
✅MVP-3.1 ─┐                     │
✅MVP-3.2 ─┼→ MVP-3.5 ───────────┘
✅MVP-3.4 ─┘

現在地: MVP-3.5（JSファイル生成）またはMVP-4.1（3ファイル出力）が次のボトルネック
```

#### ⏭️ 後回しタスク（デモ動作後に実装）
| タスク  | 内容             | 理由                       |
| ------- | ---------------- | -------------------------- |
| MVP-2.3 | CSS変数          | インラインスタイルで代替可 |
| MVP-2.4 | 疑似セレクタ     | JSで動的対応可             |
| MVP-2.5 | 複合セレクタ     | 単純セレクタで対応可       |
| MVP-3.3 | DOMContentLoaded | `defer`属性で代替可        |

---

## 🎨 宣言的API改善（Post-MVP）

> **目標**: DraftOleを「SwiftUIライクな宣言的DSL」に進化させる
> **背景**: 現状は命令的要素が強く、順序依存のバグ（Bug 3）も発生している
> **優先度**: MVP完了後、v1.1〜v2.0で段階的に実施

### 現状 vs 目標

```swift
// 現状（命令的）
let container = div()
container.addChild(p().text("Hello"))
container.css.styleManager.style.font.setFontSize(24, unit: .px)

// 目標（宣言的）
div {
    p { "Hello" }
        .fontSize(24, .px)
}
```

### 📌 Phase D-1: 順序非依存化（前提条件）

> **重要**: Result Builder導入の前に、Bug 3を修正して順序非依存を実現する必要がある

#### ✅ D-1.1. Bug 3 の根本修正（CSS消失問題） → [Done.md](Done.md)

> 完了（2026-02-05）: css再作成時にスタイル設定を引き継ぐように修正（spec/bug-fix）

#### [ ] D-1.2. addChild戻り値の変更（チェーン可能に）
- **場所**: `DraftOle0.2/Sources/HTML/Elements/PairType.swift`
- **現状**: `addChild()` は `Void` を返す
- **改善**:
  ```swift
  // Before
  func addChild(_ child: HTMLTagProtocol)

  // After（Self返却でチェーン可能）
  @discardableResult
  func addChild(_ child: HTMLTagProtocol) -> Self
  ```
- **効果**:
  ```swift
  div()
      .addChild(p().text("Hello"))
      .addChild(span().text("World"))
  ```

---

### 📌 Phase D-2: Result Builder導入

> **目標**: SwiftUIライクなネスト構文を実現

#### [ ] D-2.1. HTMLBuilder の設計・実装
- **場所**: 新規 `DraftOle0.2/Sources/HTML/Builder/HTMLBuilder.swift`
- **実装内容**:
  ```swift
  @resultBuilder
  public struct HTMLBuilder {
      public static func buildBlock(_ components: HTMLTagProtocol...) -> [HTMLTagProtocol] {
          components
      }

      public static func buildOptional(_ component: HTMLTagProtocol?) -> HTMLTagProtocol? {
          component
      }

      public static func buildEither(first component: HTMLTagProtocol) -> HTMLTagProtocol {
          component
      }

      public static func buildEither(second component: HTMLTagProtocol) -> HTMLTagProtocol {
          component
      }

      public static func buildArray(_ components: [HTMLTagProtocol]) -> [HTMLTagProtocol] {
          components
      }
  }
  ```
- **テスト**: 基本的なビルダー動作確認

#### [ ] D-2.2. タグファクトリの拡張（クロージャ対応）
- **場所**: `DraftOle0.2/Sources/HTML/Elements/TagFactories.swift`
- **実装内容**:
  ```swift
  // 既存（引数なし）
  public func div() -> PairTagType

  // 追加（Result Builder対応）
  public func div(@HTMLBuilder content: () -> [HTMLTagProtocol]) -> PairTagType {
      let element = div()
      for child in content() {
          element.addChild(child)
      }
      return element
  }

  // 属性付き
  public func div(
      class className: String? = nil,
      id: String? = nil,
      @HTMLBuilder content: () -> [HTMLTagProtocol]
  ) -> PairTagType
  ```
- **対象タグ**: div, p, span, section, article, header, footer, nav, main, ul, ol, li, form, button 等（主要20タグ）

#### [ ] D-2.3. テキストノードの暗黙変換
- **場所**: `HTMLBuilder.swift`
- **実装内容**:
  ```swift
  extension String: HTMLTagProtocol {
      // Stringを直接HTMLタグとして扱えるように
  }

  // または専用のExpressibleByStringLiteral
  extension HTMLBuilder {
      public static func buildExpression(_ text: String) -> HTMLTagProtocol {
          TextType(text)
      }
  }
  ```
- **効果**:
  ```swift
  p { "Hello World" }  // 文字列が直接使える
  ```

#### [ ] D-2.4. 条件分岐サポート
- **場所**: `HTMLBuilder.swift`
- **実装内容**: `if-else`, `switch` 対応
- **効果**:
  ```swift
  div {
      if isLoggedIn {
          p { "Welcome back!" }
      } else {
          a(href: "/login") { "Login" }
      }
  }
  ```

#### [ ] D-2.5. ループサポート
- **場所**: `HTMLBuilder.swift`
- **実装内容**: `for-in` 対応
- **効果**:
  ```swift
  ul {
      for item in items {
          li { item.name }
      }
  }
  ```

---

### 📌 Phase D-3: Fluent CSS API

> **目標**: CSSスタイルをメソッドチェーンで宣言的に設定

#### [ ] D-3.1. スタイルメソッドの追加
- **場所**: `HTMLTagProtocol` extension
- **実装内容**:
  ```swift
  extension HTMLTagProtocol {
      func fontSize(_ value: Double, _ unit: UnitStyle) -> Self {
          css.styleManager.style.font.setFontSize(value, unit: unit)
          return self
      }

      func color(_ color: CSSColor) -> Self {
          css.styleManager.style.font.color = color
          return self
      }

      func padding(_ value: Double, _ unit: UnitStyle) -> Self {
          // ...
          return self
      }

      func margin(_ value: Double, _ unit: UnitStyle) -> Self {
          // ...
          return self
      }

      func backgroundColor(_ color: CSSColor) -> Self {
          // ...
          return self
      }
  }
  ```
- **効果**:
  ```swift
  p { "Hello" }
      .fontSize(24, .px)
      .color(.hex("#333"))
      .padding(16, .px)
  ```

#### [ ] D-3.2. レイアウトショートカット
- **実装内容**:
  ```swift
  func flex(direction: FlexDirection = .row, justify: JustifyContent = .start, align: AlignItems = .stretch) -> Self
  func grid(columns: String, gap: Double) -> Self
  ```
- **効果**:
  ```swift
  div {
      // children
  }
  .flex(direction: .column, justify: .center, align: .center)
  ```

---

### 📌 Phase D-4: イミュータブル設計（検討）

> **優先度**: 低（大規模リファクタリングが必要）
> **検討時期**: v2.0以降

#### [ ] D-4.1. イミュータブルタグ構造の設計
- **現状**: `PairTagType` は `class`（参照型、可変）
- **検討案**: `struct`（値型、不変）への移行
- **課題**:
  - 既存APIとの互換性
  - パフォーマンスへの影響
  - 循環参照の解消
- **判断基準**: Result Builder導入後に再評価

---

### 📋 実装順序（推奨）

| 順序  | タスクID | 内容                     | 依存     |
| :---: | -------- | ------------------------ | -------- |
|   1   | D-1.1    | Bug 3修正（CSS消失）     | なし     |
|   2   | D-1.2    | addChild戻り値変更       | D-1.1    |
|   3   | D-2.1    | HTMLBuilder実装          | D-1.1    |
|   4   | D-2.2    | タグファクトリ拡張       | D-2.1    |
|   5   | D-2.3    | テキストノード変換       | D-2.1    |
|   6   | D-3.1    | Fluent CSSメソッド       | D-1.2    |
|   7   | D-2.4    | 条件分岐サポート         | D-2.2    |
|   8   | D-2.5    | ループサポート           | D-2.2    |
|   9   | D-3.2    | レイアウトショートカット | D-3.1    |
|  10   | D-4.1    | イミュータブル設計       | 全完了後 |

### 🎯 マイルストーン

| バージョン | 達成状態                           |
| ---------- | ---------------------------------- |
| **v1.0**   | MVP完成（現状API）                 |
| **v1.1**   | D-1完了: 順序非依存化、チェーンAPI |
| **v1.2**   | D-2完了: Result Builder導入        |
| **v1.3**   | D-3完了: Fluent CSS API            |
| **v2.0**   | D-4検討: イミュータブル設計        |

---

## 問題点と改善タスク

### 🟡 優先度：中

#### ✅ 1. サンプルプロジェクト(oleSample_02)の充実化 → [Done.md](Done.md)

> 完了（2026-01-31）: HTML/CSS/JS連携、テスト10件追加

#### [ ] 2. HTMLTagProtocolの責務分離
- **場所**: `DraftOle0.2/Sources/HTML/HtmlTag.swift`
- **現状**: 6つのプロトコルを継承（単一責任原則違反）
  ```swift
  public protocol HTMLTagProtocol:
      HTMLTagRenderable,           // レンダリング
      HtmlAttributeManagerProtocol, // 属性管理
      TagPathAttributeProtocol,    // パス管理
      LayoutContextProtocol,       // レイアウト
      CssManagerProtocol,          // CSS
      JqueryManagerProtocol        // JavaScript
  ```
- **対策**: Composition over Inheritanceの検討

#### [ ] 3. テストフレームワークの統一
- **現状**:
  - Swift Testing (新): 16ファイル、54テスト
  - XCTest (旧): 7ファイル、91テスト
- **対策**: Swift Testing への統一移行

---

### 🟢 優先度：低

#### ✅ 4. typoの修正
- **場所**: `DraftOle0.2/Sources/Utils/Renderable.swift`
- **修正日**: 2026-02-05
- **内容**: `Rendarable` → `Renderable` に修正済み（spec/bug-fix）

#### [ ] 5. デバッグprint文の削除
- **場所**:
  - `DraftOle0.2/Sources/HTML/Elements/Root.swift:50`
  - `DraftOle0.2/Sources/CSS/Layout/LazyLayout/LazyLayoutManager.swift`
- **対策**: `KSLogger`への統一、または削除

#### [ ] 6. テスト用publicメソッドの整理
- **場所**: `DraftOle0.2/Sources/HTML/Elements/Root.swift:210-217`
- **現状**: `_testable_`プレフィックスのメソッドがPublic APIに存在
- **対策**: `@testable import`活用へ移行

#### [ ] 7. 相対パス依存の検討
- **場所**: `oleSample_02/Package.swift`
- **現状**: `path: "../DraftOle0.2"` で相対パス依存
- **影響**: CI/他環境で問題になる可能性
- **対策**: Package公開時はGit URL依存への移行を検討

---

### 🤖 AIフレンドリー性改善（優先度: 中〜低）

> **背景**: DraftOleは型安全性によりAIの弱点（タイポ、存在しないAPIの幻覚）を補完できるが、さらに改善の余地がある

#### [ ] 8. DocCコメントの充実
- **場所**: 全パブリックAPI
- **現状**: `/// ` コメントが不足しているメソッド多数
- **効果**: AIがコンテキストとして読み取り、正確なコード生成が可能に
- **優先ファイル**:
  | ファイル              | 理由                             |
  | --------------------- | -------------------------------- |
  | `TagFactories.swift`  | 63ファクトリ関数のドキュメント化 |
  | `JQueryManager.swift` | JS生成APIの使用例追加            |
  | `CssManager.swift`    | CSSスタイル設定パターン          |
  | `HtmlAttribute.swift` | 属性設定の使用例                 |

#### [ ] 9. よくあるパターン集の追加
- **場所**: `.kiro/steering/` に新規ファイル `patterns.md`
- **内容**:
  ```markdown
  ## よくあるパターン

  ### 基本的なページ構造
  ### フォーム作成
  ### リスト生成
  ### イベントハンドリング
  ### スタイル適用
  ```
- **効果**: AIが参照してDraftOle特有のパターンを学習

#### [ ] 10. エラーメッセージの改善
- **場所**: Protocol準拠エラー、CssManager等
- **現状**: Swiftのデフォルトエラーメッセージで修正方針が不明確
- **対策案**:
  - カスタムエラー型の導入
  - `@available(*, deprecated, message:)` の活用
  - fatalErrorに詳細メッセージ追加
- **効果**: AIがエラーから修正方針を立てやすくなる

#### ✅ 11. typo修正（Rendarable → Renderable）
- **場所**: `DraftOle0.2/Sources/Utils/Renderable.swift`
- **修正日**: 2026-02-05
- **内容**: `Rendarable` → `Renderable` に修正済み（spec/bug-fix）

---

## 🐛 発見したバグ

### ✅ Bug 1. `root_css_render` テストの失敗
- **発見日**: 2026-01-31
- **修正日**: 2026-02-05
- **場所**: `DraftOle0.2/Tests/DraftOleTests/CSS/Layout/CssLayoutTest.swift:373-399`
- **症状**:
  ```
  期待値: "    relation: absolute;\n    top: 100%;"
  実際値: "    top: nilString;\n    top: 100%;\n\nhello"
  ```
- **問題点**:
  1. `relation: absolute;` が出力されていない → `position: absolute;` に修正
  2. `top: nilString;` という不正な値が出力される → 修正済み
  3. `hello` という余計な文字列が含まれる → 削除済み
- **関連コード**:
  - `DraftOle0.2/Sources/CSS/CssManager/CssM+Rendable.swift`
  - `DraftOle0.2/Sources/CSS/Layout/CssPositionMaker/CPM+Render.swift`
- **ステータス**: ✅ 修正済み（spec/bug-fix）
- **優先度**: 完了

### Bug 2. `oleSample_02` の `OleCalculator` 未定義
- **発見日**: 2026-01-31
- **場所**: `oleSample_02/Sources/main.swift:11`
- **症状**: `error: cannot find 'OleCalculator' in scope`
- **対策案**:
  1. DraftOle に `OleCalculator` クラスを追加
  2. または `main.swift` を実際のHTML/CSS生成デモに書き換え
- **ステータス**: ✅ 修正済み（Task 1で対応）
- **優先度**: 中

### ✅ Bug 3. `addChild()` でCSS設定が消失する
- **発見日**: 2026-01-31
- **修正日**: 2026-02-05
- **場所**: `DraftOle0.2/Sources/HTML/Elements/PairType.swift:62-64`
- **症状**:
  - 要素にCSSを設定した直後は`css.styleManager.style.render()`で正しく出力される
  - しかし`collectCssStyleString()`で収集すると空文字列が返される
- **修正内容**:
  - CssManager再作成時に既存のスタイル設定を引き継ぐように修正
  - PairType/SelfClosingType/TextType すべてで対応
- **修正ファイル**:
  - `DraftOle0.2/Sources/HTML/Elements/PairType.swift`
  - `DraftOle0.2/Sources/HTML/Elements/SelfClosingType.swift`
  - `DraftOle0.2/Sources/HTML/Elements/TextType.swift`
- **ステータス**: ✅ 修正済み（spec/bug-fix）
- **優先度**: 完了

---

## 関連ファイル一覧

### コア実装
- `DraftOle0.2/Sources/CSS/CssManager/CssManager.swift` - CSS管理の中心
- `DraftOle0.2/Sources/HTML/HtmlTag.swift` - HTMLタグプロトコル定義
- `DraftOle0.2/Sources/HTML/Elements/Root.swift` - ルート要素実装

### サンプル・テスト
- `oleSample_02/Sources/main.swift` - サンプル実装
- `oleSample_02/Package.swift` - サンプルパッケージ定義

---

## 将来フェーズ

詳細は `.kiro/specs/circular-dependency-risk/` を参照。

| 要件ID   | 内容                                       | 延期理由                 |
| -------- | ------------------------------------------ | ------------------------ |
| 1.3      | 依存関係グラフ生成時に循環参照ノードを明示 | 静的解析ツール導入が必要 |
| 3.1, 3.2 | HTMLTagProtocol責務分離                    | 大規模リファクタリング   |
| 4.1-4.5  | モジュール分割                             | Swift Package分割が必要  |

### JQueryManager改善検討

| 項目              | 内容                                                                    | 優先度 |
| ----------------- | ----------------------------------------------------------------------- | ------ |
| eventType型安全性 | `on(eventType: String, ...)` を `EventType` enum に変更し、タイポを防止 | 低     |

**背景**: 現在の`on(eventType:handler:)`メソッドは`String`型でイベント名を受け取るため、タイポを検出できない。主要イベントはショートカットメソッド（`click()`, `keydown()`, `keyup()`）でカバーしているため現時点では問題ないが、将来的に`EventType` enumの導入を検討する。

**検討時期**: MVP完了後、APIの安定化フェーズで再評価

---

---

## 🔧 Phase 1-A〜E: SSG完成タスク（コアライブラリ完成後）

> **目標**: v1.0 SSG版リリース
> **詳細**: `.kiro/steering/vision.md` セクション9参照

### 📌 Phase 1-A: CLI実装

#### [ ] 1-A.1. ArgumentParserパッケージ追加
- **場所**: `DraftOle0.2/Package.swift`
- **実装**: [swift-argument-parser](https://github.com/apple/swift-argument-parser) 依存追加

#### [ ] 1-A.2. buildコマンド実装
- **場所**: 新規 `DraftOle0.2/Sources/CLI/BuildCommand.swift`
- **実装内容**:
  ```bash
  $ draftole build
  # content/ → テンプレート適用 → dist/ 出力
  ```

#### [ ] 1-A.3. serveコマンド実装
- **場所**: 新規 `DraftOle0.2/Sources/CLI/ServeCommand.swift`
- **実装内容**:
  ```bash
  $ draftole serve
  # → http://localhost:3000 でdist/を配信
  ```

---

### 📌 Phase 1-B: コンテンツ読込

#### [ ] 1-B.1. ContentLoaderプロトコル設計
- **場所**: 新規 `DraftOle0.2/Sources/Content/ContentLoader.swift`
- **詳細**: Post-MVP Phase E のタスク POST-E.1〜E.5 を参照

#### [ ] 1-B.2. JSONLoader実装
#### [ ] 1-B.3. YAMLLoader実装（Yams依存）
#### [ ] 1-B.4. MarkdownLoader実装（swift-markdown依存）
#### [ ] 1-B.5. Frontmatter解析

---

### 📌 Phase 1-C: テンプレート分離

#### [ ] 1-C.1. HTMLComponentプロトコル
- **詳細**: Post-MVP Phase E のタスク POST-E.6 を参照

#### [ ] 1-C.2. LayoutTemplate実装
- **詳細**: Post-MVP Phase E のタスク POST-E.7 を参照

---

### 📌 Phase 1-D: 開発サーバー

#### [ ] 1-D.1. ファイルウォッチャー実装
- **詳細**: Post-MVP Phase B のタスク POST-B.1 を参照

#### [ ] 1-D.2. ローカルサーバー（SwiftNIO）
- **詳細**: Post-MVP Phase B のタスク POST-B.2 を参照

#### [ ] 1-D.3. ブラウザ自動リロード
- **詳細**: Post-MVP Phase B のタスク POST-B.3 を参照

---

### 📌 Phase 1-E: ドキュメント・サンプル

#### [ ] 1-E.1. README Quickstart
- **詳細**: MVP-5.3 完了後に整備

#### [ ] 1-E.2. サンプルサイト（静的ブログ）
- **詳細**: Post-MVP Phase D のタスク POST-D.1 を参照

#### [ ] 1-E.3. APIリファレンス（DocC）
- **詳細**: Post-MVP Phase D のタスク POST-D.2 を参照

---

## 🚀 Phase 2: Webアプリフレームワーク（v2.0目標）

> **前提**: Phase 1（SSG）完成後に着手
> **詳細**: `.kiro/steering/vision.md` セクション9参照

### 📌 Phase 2-A: Vapor統合

#### [ ] 2-A.1. Vapor用Response拡張
#### [ ] 2-A.2. DraftOle + Vapor統合サンプル

---

### 📌 Phase 2-B: HTMX統合（動的UI対応）

> **方針**: ユーザーがJSを書かずに動的UIを実現
> **前提**: 動的機能にはSwiftサーバー（Vapor/Hummingbird）が必要

#### [ ] 2-B.1. HTMX属性サポート
- **場所**: `DraftOle0.2/Sources/HTML/HtmlAttribute/`
- **実装内容**:
  ```swift
  // 使用イメージ
  button()
      .htmx(.get, "/api/todos")
      .htmx(.target, "#todo-list")
      .htmx(.swap, .innerHTML)
      .text("読み込む")
  ```
- **追加する属性**:
  | 属性                                          | 用途                               |
  | --------------------------------------------- | ---------------------------------- |
  | `hx-get` / `hx-post` / `hx-put` / `hx-delete` | HTTPリクエスト                     |
  | `hx-target`                                   | 更新対象要素                       |
  | `hx-swap`                                     | 更新方法（innerHTML, outerHTML等） |
  | `hx-trigger`                                  | トリガーイベント                   |
  | `hx-indicator`                                | ローディング表示                   |
  | `hx-confirm`                                  | 確認ダイアログ                     |
- **仕様ドキュメント**: `.kiro/specs/htmx-integration/`（要作成）

#### [ ] 2-B.2. HTMX型安全API
- **場所**: 新規ファイル `DraftOle0.2/Sources/HTMX/`
- **実装内容**:
  ```swift
  // HtmxSwapType enum
  enum HtmxSwapType: String {
      case innerHTML, outerHTML, beforebegin, afterbegin
      case beforeend, afterend, delete, none
  }

  // HtmxTrigger enum
  enum HtmxTrigger: String {
      case click, change, submit, load
      case revealed, intersect
  }
  ```

#### [ ] 2-B.3. HTMXスクリプト自動挿入
- **場所**: `DraftOle0.2/Sources/HTML/Elements/Root.swift`
- **実装内容**:
  ```swift
  // Root生成時にHTMXを使用していれば自動挿入
  <script src="https://unpkg.com/htmx.org@2.0.0"></script>
  ```
- **オプション**: ローカルファイル参照も選択可能に

#### [ ] 2-B.4. Vapor連携サンプル
- **場所**: `examples/htmx-vapor-todo/`
- **内容**:
  - DraftOle（フロント生成）+ Vapor（バックエンド）
  - Todoアプリのフルスタック実装
  - README with Quickstart

#### MVP Phase 3との関係

HTMX採用により、以下のタスクは**優先度が下がる**:

| タスク                   | HTMX採用後の状態         |
| ------------------------ | ------------------------ |
| MVP-3.1 イベントハンドラ | ⚪ 後回し可（HTMXで代替） |
| MVP-3.2 DOM操作メソッド  | ⚪ 後回し可（HTMXで代替） |
| MVP-3.3 DOMContentLoaded | ⚪ 不要（HTMX側で処理）   |
| MVP-3.4 $()ヘルパー      | ⚪ 不要（HTMX採用時）     |
| MVP-3.5 JSファイル生成   | ⚪ 最小限でOK             |

**注意**: MVP完成には現行の最小JS機能が必要。HTMX統合はPost-MVPで実施。

---

### 🟢 Phase B: 開発体験改善 → **Phase 1-D に統合**

> **注意**: このセクションのタスクは Phase 1-D（開発サーバー）に統合されました。
> 詳細な実装手順として参照してください。

#### [ ] POST-B.1. ファイルウォッチャー実装
- **場所**: 新規ファイル `DraftOle0.2/Sources/CLI/WatchCommand.swift`
- **実装内容**:
  ```swift
  // 使用イメージ
  // $ swift run --watch

  struct WatchCommand {
      func start() {
          let watcher = FileWatcher(paths: ["Sources/"])
          watcher.onChange = {
              self.rebuild()
              self.notifyBrowser()
          }
          watcher.start()
      }
  }
  ```
- **技術選択**:
  - macOS: `DispatchSource.makeFileSystemObjectSource` または FSEvents
  - Linux: inotify wrapper

#### [ ] POST-B.2. 簡易ローカルサーバー
- **場所**: 新規ファイル `DraftOle0.2/Sources/CLI/ServeCommand.swift`
- **実装内容**:
  ```bash
  # 使用イメージ
  swift run serve
  # → http://localhost:3000 でdist/を配信
  ```
- **技術選択**:
  - SwiftNIO（軽量HTTPサーバー）
  - または Foundation の URLSession ベース

#### [ ] POST-B.3. ブラウザ自動リロード
- **場所**: `Sources/CLI/`
- **実装内容**:
  - WebSocket接続でブラウザに変更通知
  - またはLiveReload互換プロトコル
  - 生成HTMLに自動でリロードスクリプト挿入

#### [ ] POST-B.4. CLIコマンド整備
- **実装内容**:
  ```bash
  swift run draftole new myproject    # プロジェクト作成
  swift run draftole build            # ビルド
  swift run draftole serve            # サーバー起動
  swift run draftole watch            # ウォッチモード
  ```

---

### 🟡 Phase C: UIコンポーネント集 → **Phase 2-C に統合**

> **注意**: このセクションのタスクは Phase 2-C（UIコンポーネント）に移動しました。

#### [ ] POST-C.1. 基本コンポーネント（10個）
- **場所**: 新規パッケージ `DraftOleUI/`
- **コンポーネント一覧**:
  | カテゴリ   | コンポーネント | 説明               |
  | ---------- | -------------- | ------------------ |
  | レイアウト | `Container`    | 中央寄せコンテナ   |
  | レイアウト | `Grid`         | グリッドレイアウト |
  | レイアウト | `Stack`        | VStack/HStack      |
  | レイアウト | `Card`         | カード型コンテナ   |
  | フォーム   | `TextField`    | テキスト入力       |
  | フォーム   | `Button`       | スタイル済みボタン |
  | フォーム   | `Select`       | セレクトボックス   |
  | フォーム   | `Checkbox`     | チェックボックス   |
  | 表示       | `Alert`        | 通知メッセージ     |
  | 表示       | `Badge`        | バッジ/ラベル      |
- **使用イメージ**:
  ```swift
  import DraftOleUI

  let card = Card(
      title: "記事タイトル",
      body: "本文...",
      footer: Button("続きを読む", style: .primary)
  )
  ```

#### [ ] POST-C.2. テーマシステム
- **場所**: `DraftOleUI/Sources/Theme/`
- **実装内容**:
  ```swift
  let theme = Theme(
      colors: .init(
          primary: "#7c5cff",
          danger: "#ef4444",
          background: "#0b1220"
      ),
      spacing: .init(sm: 8, md: 16, lg: 24),
      radius: 14
  )

  root.applyTheme(theme)
  ```
- **出力**: CSS変数として生成
  ```css
  :root {
      --color-primary: #7c5cff;
      --spacing-md: 16px;
  }
  ```

#### [ ] POST-C.3. ダークモード対応
- **実装内容**:
  ```swift
  theme.darkMode = Theme.Dark(
      background: "#1a1a2e",
      text: "#ffffff"
  )
  ```
- **出力**: `@media (prefers-color-scheme: dark)` 生成

---

### 🟣 Phase D: ドキュメント・サンプル → **Phase 1-E に統合**

> **注意**: このセクションのタスクは Phase 1-E（ドキュメント・サンプル）に移動しました。

#### [ ] POST-D.1. 実用サンプル集
- **場所**: `examples/`
- **サンプル一覧**:
  | サンプル           | 説明                 | 難易度 |
  | ------------------ | -------------------- | ------ |
  | `landing-page/`    | マーケティングLP     | 初級   |
  | `portfolio/`       | ポートフォリオサイト | 初級   |
  | `documentation/`   | 技術ドキュメント     | 中級   |
  | `admin-dashboard/` | 管理画面（静的）     | 中級   |
  | `htmx-todo/`       | HTMXでTodoアプリ     | 上級   |

#### [ ] POST-D.2. APIリファレンス
- **場所**: `docs/` または DocC
- **内容**:
  - 全パブリックAPIのドキュメント
  - 使用例付き
  - DocC形式でXcode統合

#### [ ] POST-D.3. チュートリアル
- **場所**: `docs/tutorials/`
- **内容**:
  1. Getting Started（10分で最初のページ）
  2. スタイリング入門
  3. HTMX連携
  4. Vapor統合

#### [ ] POST-D.4. 宣伝コンテンツ
- **内容**:
  | 媒体          | コンテンツ         |
  | ------------- | ------------------ |
  | README        | 魅力的なQuickstart |
  | Qiita/Zenn    | 紹介記事           |
  | X/Bluesky     | 発信用スニペット   |
  | GitHub Topics | 適切なタグ設定     |

---

### 🟠 Phase E: データとコンテンツの分離 → **Phase 1-B, 1-C に統合**

> **注意**: このセクションのタスクは Phase 1-B（コンテンツ読込）と Phase 1-C（テンプレート分離）に移動しました。
> 詳細な実装手順として参照してください。

> **目的**: データをコードから分離し、DraftOleを「型安全なテンプレートエンジン」として確立
> **思想**: Hugo/Jekyllのテンプレート部分をDraftOleで置き換える

#### 設計思想

```
┌─────────────────────────────────────────────────────────────────┐
│  従来のHugo/Jekyll                                              │
│  ┌─────────────┐     ┌─────────────┐                           │
│  │  Markdown   │  +  │ Go template │  →  HTML                  │
│  │  (データ)   │     │  / Liquid   │      ↑                    │
│  └─────────────┘     └─────────────┘      │                    │
│                                      型安全でない              │
│                                      タイポ→ランタイムエラー   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  DraftOle（型安全なHugo）                                        │
│  ┌─────────────┐     ┌─────────────┐                           │
│  │  Markdown   │  +  │  DraftOle   │  →  HTML                  │
│  │  / JSON     │     │  (Swift)    │      ↑                    │
│  │  / DB       │     │             │      │                    │
│  └─────────────┘     └─────────────┘      │                    │
│                                      型安全！                  │
│                                      タイポ→コンパイルエラー   │
└─────────────────────────────────────────────────────────────────┘
```

#### ユースケース

| ユースケース       | データソース           | テンプレート     | 出力     |
| ------------------ | ---------------------- | ---------------- | -------- |
| **静的ブログ**     | Markdown + Frontmatter | DraftOle         | 静的HTML |
| **Webアプリ**      | DB（MySQL/SQLite）     | DraftOle + Vapor | 動的HTML |
| **設定駆動サイト** | JSON / YAML            | DraftOle         | 静的HTML |

---

#### [ ] POST-E.1. ContentLoaderプロトコル設計
- **場所**: 新規ファイル `DraftOle0.2/Sources/Content/ContentLoader.swift`
- **実装内容**:
  ```swift
  protocol ContentLoader {
      associatedtype Content: Decodable
      func load(from path: String) throws -> [Content]
  }

  // 具体実装
  struct JSONLoader<T: Decodable>: ContentLoader { ... }
  struct YAMLLoader<T: Decodable>: ContentLoader { ... }
  struct MarkdownLoader<T: Decodable>: ContentLoader { ... }
  ```

#### [ ] POST-E.2. JSONデータソースサポート
- **場所**: `DraftOle0.2/Sources/Content/JSONLoader.swift`
- **実装内容**:
  ```swift
  // 使用イメージ
  struct BlogPost: Codable {
      let title: String
      let date: Date
      let tags: [String]
      let content: String
  }

  let posts: [BlogPost] = JSONLoader().load(from: "content/posts.json")
  ```
- **利点**: Swiftの`Codable`で型安全にデコード

#### [ ] POST-E.3. YAMLデータソースサポート
- **場所**: `DraftOle0.2/Sources/Content/YAMLLoader.swift`
- **依存ライブラリ**: [Yams](https://github.com/jpsim/Yams)
- **用途**: 設定ファイル、Frontmatter解析

#### [ ] POST-E.4. Markdownパーサー統合
- **場所**: `DraftOle0.2/Sources/Content/MarkdownLoader.swift`
- **依存ライブラリ**: [swift-markdown](https://github.com/apple/swift-markdown)
- **実装内容**:
  ```swift
  struct MarkdownContent: Codable {
      let frontmatter: [String: Any]  // YAML部分
      let htmlContent: String          // Markdown→HTML変換済み
  }

  let posts = MarkdownLoader<BlogPost>().load(from: "content/posts/")
  ```

#### [ ] POST-E.5. Frontmatter解析
- **場所**: `DraftOle0.2/Sources/Content/FrontmatterParser.swift`
- **対応フォーマット**: YAML（`---`で囲まれた部分）
- **実装内容**:
  ```markdown
  ---
  title: SwiftでWeb開発
  date: 2026-02-02
  tags: [swift, web]
  ---

  # 本文
  ```
  ↓
  ```swift
  struct Post: Codable {
      let title: String      // "SwiftでWeb開発"
      let date: Date         // 2026-02-02
      let tags: [String]     // ["swift", "web"]
      var htmlContent: String // "<h1>本文</h1>"
  }
  ```

#### [ ] POST-E.6. HTMLComponentプロトコル（テンプレート基盤）
- **場所**: `DraftOle0.2/Sources/Template/HTMLComponent.swift`
- **実装内容**:
  ```swift
  protocol HTMLComponent {
      func render() -> HTMLTagProtocol
  }

  // 使用例
  struct PostTemplate: HTMLComponent {
      let post: Post

      func render() -> HTMLTagProtocol {
          article()
              .addChild(h1().text(post.title))
              .addChild(time().text(post.date.formatted()))
              .addChild(div().html(post.htmlContent))
      }
  }
  ```

#### [ ] POST-E.7. LayoutTemplate（レイアウト共通化）
- **場所**: `DraftOle0.2/Sources/Template/LayoutTemplate.swift`
- **実装内容**:
  ```swift
  struct LayoutTemplate: HTMLComponent {
      let title: String
      let content: HTMLTagProtocol

      func render() -> HTMLTagProtocol {
          Root()
              .setTitle(title)
              .addChild(
                  body()
                      .addChild(HeaderPartial())
                      .addChild(main().addChild(content))
                      .addChild(FooterPartial())
              )
      }
  }
  ```

#### [ ] POST-E.8. 一括ビルドコマンド
- **場所**: `DraftOle0.2/Sources/CLI/BuildCommand.swift`
- **実装内容**:
  ```bash
  swift run draftole build
  # 1. content/ からMarkdown/JSONを読み込み
  # 2. テンプレートでレンダリング
  # 3. dist/ にHTML出力
  ```

#### [ ] POST-E.9. Fluent（Vapor ORM）連携サンプル
- **場所**: `examples/vapor-blog/`
- **内容**:
  ```swift
  // Vaporルート
  app.get("posts", ":id") { req async throws -> Response in
      let post = try await Post.find(req.parameters.get("id"), on: req.db)!

      let html = LayoutTemplate(
          title: post.title,
          content: PostTemplate(post: post).render()
      ).render()

      return Response(html: html.render())
  }
  ```

#### [ ] POST-E.10. SQLite直接連携
- **場所**: `DraftOle0.2/Sources/Content/SQLiteLoader.swift`
- **依存ライブラリ**: [SQLite.swift](https://github.com/stephencelis/SQLite.swift)
- **用途**: サーバーレス/組み込み用途

---

#### ディレクトリ構造例（静的ブログ）

```
my-blog/
├── content/                    # データ（Markdown/JSON）
│   ├── posts/
│   │   ├── first-post.md
│   │   └── second-post.md
│   └── config.json
├── Sources/                    # テンプレート（DraftOle/Swift）
│   ├── Templates/
│   │   ├── PostTemplate.swift
│   │   ├── ListTemplate.swift
│   │   └── LayoutTemplate.swift
│   ├── Partials/
│   │   ├── HeaderPartial.swift
│   │   └── FooterPartial.swift
│   └── main.swift
├── Package.swift
└── dist/                       # 出力先
    ├── index.html
    └── posts/
        ├── first-post/index.html
        └── second-post/index.html
```

---

#### Hugo vs DraftOle 比較

| 観点             | Hugo         | DraftOle        |
| ---------------- | ------------ | --------------- |
| コンテンツ       | Markdown ✅   | Markdown ✅      |
| テンプレート     | Go template  | Swift（型安全） |
| タイポ検出       | ❌ ランタイム | ✅ コンパイル時  |
| IDE補完          | ❌            | ✅               |
| リファクタリング | ❌ 手動       | ✅ IDE支援       |
| ビルド速度       | 超高速       | 要検証          |
| DB連携           | ❌            | ✅ Vapor/Fluent  |

---

### 📅 Post-MVP 実行順序

```
MVP完成
    ↓
Phase B: 開発体験改善（最重要）
├─ POST-B.1 ウォッチャー
├─ POST-B.2 ローカルサーバー
└─ POST-B.3 自動リロード
    ↓
Phase E: データとコンテンツの分離（型安全なHugo）
├─ POST-E.1 ContentLoaderプロトコル
├─ POST-E.2 JSONデータソース
├─ POST-E.4 Markdownパーサー
├─ POST-E.6 HTMLComponentプロトコル
└─ POST-E.7 LayoutTemplate
    ↓
Phase A: HTMX統合
├─ 2-B.1 属性サポート
├─ 2-B.2 型安全API
└─ 2-B.3 スクリプト挿入
    ↓
Phase C: UIコンポーネント
├─ POST-C.1 基本10コンポーネント
└─ POST-C.2 テーマシステム
    ↓
Phase D: ドキュメント
├─ POST-D.1 サンプル集
├─ POST-D.2 APIリファレンス
└─ POST-D.3 チュートリアル
    ↓
🎉 v1.0 リリース
```

#### Phase E の位置づけ

Phase E を Phase B の直後に配置した理由:
- **開発体験（Phase B）** がないと、Phase E の開発自体が辛い
- **データ分離（Phase E）** は HTMX（Phase A）より先に必要
  - HTMX はサーバーからHTMLフラグメントを返す → テンプレートが必要
  - テンプレートにはデータを流し込む仕組みが必要
- Phase E があれば、**実用的なサンプル（Phase D）** が作りやすくなる

---

---

## 📝 BuildInPublicコンテンツ改善タスク

> **出典**: `audit_report_20260202_215822.md`
> **対象ファイル**: `content/2026-02-02/*.md`（6プラットフォーム向けコンテンツ）

### 🟡 即時対応推奨（投稿前に実施）

#### [ ] BIP-1. Bluesky投稿用：コードブロック対応
- **対象ファイル**: `content/2026-02-02/bluesky-2026-02-02.md`
- **問題**: Blueskyはマークダウンのコードブロック（\`\`\`swift）を整形表示しない
- **現状**: SnapKit風DSLのコードスニペットが含まれている
- **対策案**:
  | 案  | 方法                             | メリット                     | デメリット     |
  | --- | -------------------------------- | ---------------------------- | -------------- |
  | A   | コードを画像化して添付           | 視覚的に見やすい             | 画像作成の手間 |
  | B   | GitHub Gist URLを共有            | 実際に動くコードを見せられる | クリック必要   |
  | C   | コードを削除し「詳細はブログへ」 | シンプル                     | 訴求力が下がる |
- **優先度**: 中
- **トリガー**: Blueskyへの投稿前

#### [ ] BIP-2. X/Twitter投稿用：コードブロック対応
- **対象ファイル**: `content/2026-02-02/x-twitter-2026-02-02.md`
- **問題**: X/Twitterはマークダウンのコードブロックを整形表示しない
- **現状**: SnapKit風DSLのコードスニペットが含まれている
- **対策案**: BIP-1と同様（画像/Gist/削除）
- **優先度**: 中
- **トリガー**: X/Twitterへの投稿前

#### [ ] BIP-3. DEV.to投稿時：front matter調整
- **対象ファイル**: `content/2026-02-02/devto-2026-02-02.md`
- **問題**: front matter（`---`で囲まれた部分）がmarkdownブロック内に記述されている
- **現状**:
  ```markdown
  ---
  title: Building a Type-Safe HTML/CSS/JS Generator in Swift
  published: true
  tags: swift, html, css, webdev
  ---
  ```
- **対策**: 投稿時にfront matterをmarkdown本文の先頭（ブロック外）に配置
- **優先度**: 低
- **トリガー**: DEV.toへの投稿時

### 🟢 対応任意（軽微な不整合）

#### [ ] BIP-4. 開発期間表記の修正
- **対象ファイル**: 全コンテンツファイル（master, bluesky, devto, qiita, reddit, x-twitter, indiehackers）
- **問題**: 期間「2025-05-14 ~ 2026-02-02」は約8.5ヶ月だが「9ヶ月」と表記
- **現状**: 全ファイルで「9 months」「9ヶ月」と表記
- **対策案**:
  - 案A: 現状維持（「約9ヶ月」は許容範囲）
  - 案B: 「8ヶ月半」または「約9ヶ月」に修正
- **優先度**: 低
- **判断**: 軽微な不正確さのため、対応は任意

### 📋 技術的負債（将来対応）

#### [ ] BIP-TD-1. コンテンツ種別の命名規則定義
- **対象**: `content/` ディレクトリ全体
- **問題**: ファイル名が日付形式（`2026-02-02`）だが、内容は週次報告と9ヶ月総括が混在
- **影響**: コンテンツ量が増えると管理コスト増
- **対策案**:
  | 案  | 方法                                            | メリット     | デメリット             |
  | --- | ----------------------------------------------- | ------------ | ---------------------- |
  | A   | 現状維持                                        | 変更不要     | 将来混乱の可能性       |
  | B   | `content/summary/`など種別ディレクトリ分離      | 明確な分類   | 既存ファイル移動が必要 |
  | C   | ファイル名に種別追加（`summary-2026-02-02.md`） | 既存構造維持 | 命名規則の複雑化       |
- **トリガー**: 週次報告を再開するとき
- **文書化場所**: CLAUDE.mdまたはcontent/README.md

---

## ブランチ情報
- **現在のブランチ**: `master`
- **最新コミット**: `cde9976` - spec(css-module): Task 2.1〜9.4 完了
- **マージ済みspec**:
  - `spec/bug-fix`: Bug 1/3修正、typo修正
  - `spec/external-css-generation`: 外部CSS生成機能
  - `spec/html-module`: TypeScript HTMLモジュール実装（15テストファイル、689テスト）
- **実装済みspec（master直接）**:
  - `css-module`: CSSモジュールコア実装（28テストファイル、1,463テスト、validate:impl GO）
- **Vision更新日**: 2026-02-02（SSGポジショニング確定）

---

## 🔄 TypeScript 移行ステータス

> **詳細タスクは [tsTransferTask.md](tsTransferTask.md) を参照**

| フェーズ    | モジュール                     | 状態                   | TSファイル | テスト                 |
| ----------- | ------------------------------ | ---------------------- | ---------- | ---------------------- |
| **Phase 1** | 基盤（Renderable等）           | ✅ 完了                 | 1          | -                      |
| **Phase 2** | HTML（Tags, Attrs, Rendering） | ✅ 完了・マージ済       | 23         | 15ファイル/689テスト   |
| **Phase 3** | CSS（Styles, Layout）          | ✅ コア完了（3.1〜3.9） | 30+        | 28ファイル/1,463テスト |
| **Phase 4** | JS（jQuery DSL）               | 📋 未着手               | 0          | 0                      |
| **Phase 5** | Publisher（File Export）       | 📋 未着手               | 0          | 0                      |

**注意**: 以下のSwift版タスク（MVP-2.3〜5.4, Phase D, Phase 1-A〜2-B等）は、TypeScript移行により**凍結状態**。
TypeScript版で同等機能を実装する際に参考資料として使用する。

**プロジェクト全体テスト**: 46ファイル / 2,152テスト PASS（2026-02-09時点）

