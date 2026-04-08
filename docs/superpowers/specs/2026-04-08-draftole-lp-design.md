# DraftOle LP 設計書 — ドッグフーディング実験 #1

**Date**: 2026-04-08
**Status**: 承認済み

---

## 目的

DraftOle自身のランディングページをDraftOle APIで構築する。
開発者に「使ってみたい」と思わせるマーケティングLPを作りながら、
API の制約・不便さを洗い出し、次の開発優先度を決定する。

## ファイル構成

```
lp/
  lp-builder.ts    ← LP構築スクリプト（DraftOle APIで記述）
  output/          ← FileExporterの出力先
    index.html
    style.css
    script.js
  dogfooding-log.md ← 制約・発見の記録（最重要成果物）
```

## 実行方法

```bash
npx tsx lp/lp-builder.ts
```

`lp/output/` に index.html, style.css, script.js を生成。

## LP構成

| # | セクション | 内容 |
|---|-----------|------|
| 1 | ヒーロー | キャッチコピー + サブテキスト + CTAボタン |
| 2 | 特徴3つ | Flexbox横並び3カラム |
| 3 | コード例 | Before/After 比較（2カラム） |
| 4 | フッターCTA | メッセージ + ボタン再掲 + コピーライト |

## セクション詳細

### 1. ヒーロー

- **キャッチ**: 「HTML, CSS, JS — TypeScript ひとつで。」
- **サブテキスト**: 型安全なDSLでWebページを丸ごと生成
- **CTAボタン**: 「Get Started」（ダミー、`#`リンク）
- **レイアウト**: 中央揃え、上下余白大きめ、背景ダーク

### 2. 特徴3カラム

Flexbox横並び、gap付き。

| カラム | タイトル | 説明 |
|--------|---------|------|
| 1 | 三位一体 | HTML・CSS・JSを1つのTypeScriptファイルで記述 |
| 2 | 型安全 | 146+ CSSプロパティすべてに型補完が効く |
| 3 | ゼロランタイム | 出力は純粋なHTML/CSS/JS。依存なし |

### 3. コード例（Before / After）

Flexbox 2カラム比較:

- **左（Before）**: 従来のHTML+CSS+JSの3ファイルを擬似コードブロックで表示
- **右（After）**: DraftOleで同じことを1ファイルで書いたコード

背景色を変えてコードブロック風に。`TextType`で`<pre><code>`内にコードテキストを配置。

### 4. フッターCTA

- シンプルな1行メッセージ + ボタン再掲
- コピーライト表示

## スタイル方針

- **幅**: 1200px固定、中央寄せ
- **テーマ**: ダーク（開発者向け、コード例が映える）
- **CSS**: DraftOleのCSS APIのみ使用（手書きCSS追記なし）

## 実装方式

- シングルファイル方式（`lp-builder.ts` 1ファイル）
- 必要になった時点で関数抽出する程度。事前の抽象化は行わない

## DraftOle API使用パターン

```typescript
const root = new Root();
const htmlEl = html();
const headEl = head();
const bodyEl = body();

bodyEl.css.font.color = '#ffffff';
bodyEl.css.background.backgroundColor = '#0a0a0a';

root.addChild(htmlEl);
htmlEl.addChild(headEl);
htmlEl.addChild(bodyEl);

const exporter = new FileExporter(root, 'lp/output');
exporter.export();
```

## 既知の制約と対処

| 制約 | 対処 |
|------|------|
| DOCTYPE未出力 | 挙動を確認、必要なら手動追記。制約として記録 |
| @media未対応 | 固定幅で回避。制約として記録 |
| コードブロック内テキスト | TextTypeのエスケープ挙動を確認 |
| CSS変数未対応 | 直値で記述 |

## ドッグフーディング記録フォーマット

`lp/dogfooding-log.md` に以下の形式で記録:

```markdown
## 発見 #N: {タイトル}
- 状況: 何をしようとしたか
- 問題: 何が起きたか / できなかったか
- 回避策: どう対処したか
- 優先度: 高/中/低
```

## 成功基準

1. DraftOleのAPIだけでLPのHTML・CSS・JSを生成できた
2. 完成したLPをブラウザで開いて人に見せられる
3. dogfooding-log.md に具体的な発見が記録されている
