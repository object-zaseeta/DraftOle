# Page Semantics 仕様

`page()` から出力される HTML が semantic / a11y / SEO の最低ラインを満たすための View → semantic HTML 変換契約を定義する。  
本書は `src/view/primitives.ts` の View プリミティブと出力 HTML の対応に関する単一の真実源（specification mirror）として位置付ける。

---

## 1. 概要

DraftOle_TS の `page` 入口は View DSL（Pascal Case）を主語として組み上げるが、内部では `src/html/tags/` の HTML ファクトリへ委譲され完全な HTML 文書を出力する。  
本契約は次の 3 点を保証する:

- `page()` の出力は常に `<!doctype html>` を伴う完全な HTML 文書である
- View プリミティブは適切な semantic HTML 要素にマップされる（`<div>` クリッカブル等の anti-pattern を既定にしない）
- a11y / SEO のための最低限のメタ情報を `PageOptions` から受け取る入口を提供する

---

## 2. View → semantic HTML マッピング表

| View プリミティブ | 出力 HTML | 委譲先ファクトリ | 備考 |
|---|---|---|---|
| `Page(...children)` | `<main>` | `main()` | ページ本文の主要エリア |
| `Section(...children)` | `<section>` | `section()` | sectioning content |
| `Text(content)` | `<p>` | `p()` | 段落。見出しには使わない |
| `Image(src, alt)` | `<img>` | `img()` | `alt` は API レベルで必須 |
| `Heading(level, content)` | `<h1>`〜`<h6>` | `h1()`〜`h6()` | `level: 1\|2\|3\|4\|5\|6` のみ |
| `Link(options, ...children)` | `<a>` | `a()` | `options.href` 必須 |
| `Button(options, ...children)` | `<button>` | `button()` | `options.type` 既定 `'button'` |
| `VStack(options?, ...)` | `<div>` | `vstack()` | レイアウト用コンテナ |
| `HStack(options?, ...)` | `<div>` | `hstack()` | レイアウト用コンテナ |
| `Spacer(options?)` | `<div>` | `spacer()` | スペーシング |

---

## 3. 見出し階層ルール

### 3.1 基本ルール

- 見出しは `Heading(level, content)` を使う。`level` は `1 | 2 | 3 | 4 | 5 | 6` のみ許容（型でガード）
- ページには通常 `Heading(1, ...)` を 1 つ含める（HTML5 仕様準拠）
- 見出しレベルは数字のスキップを避ける（`h1` → `h3` のジャンプ非推奨）
- 自動算出は提供しない。利用者は明示的に `level` を渡す

### 3.2 例

```typescript
page(
  Page(
    Section(
      Heading(1, 'ページタイトル'),
      Text('リード文'),
      Section(
        Heading(2, 'サブセクション'),
        Text('本文'),
      ),
    ),
  ),
);
```

### 3.3 fallback

`Heading` で表現できないケース（ARIA `role="heading" aria-level="..."` 等）は HTML DSL の escape hatch で対応する（後述）。

---

## 4. a11y 最低保証

| 項目 | 契約 |
|---|---|
| `Image.alt` | API シグネチャ `Image(src, alt)` で必須化。装飾画像は `alt: ''` を明示する（HTML 仕様準拠） |
| `Link.target='_blank'` | `rel` 未指定の場合、`rel="noopener noreferrer"` を既定で付与する |
| `Link.rel` 明示時 | 明示指定された `rel` を優先する（既定で上書きしない） |
| `Button.type` 既定 | `'button'`。フォーム外での誤 submit を防ぐ |
| `PageOptions.lang` | 強く推奨。指定時 `<html lang="...">` が出力される。未指定時 `lang` 属性なし |

---

## 5. SEO 最低保証

| `PageOptions` フィールド | 出力 | 役割 |
|---|---|---|
| `title` | `<title>` | ページタイトル（未指定時 空 `<title></title>`） |
| `description` | `<meta name="description" content="...">` | 検索結果スニペット（未指定時 出力されない） |
| `lang` | `<html lang="...">` | 言語識別。SEO / a11y 両方に効く |
| `viewport` | `<meta name="viewport" content="...">` | レスポンシブ対応 |
| `charset` | `<meta charset="...">` | 既定 `'UTF-8'` |

`page()` の出力は `<!doctype html>` で始まる完全な HTML 文書である（`Root.render()` が保証）。

---

## 6. escape hatch ガイド

View プリミティブで表現しきれない場合は `src/html/tags/` の小文字 HTML DSL（`a`, `button`, `h1`〜`h6`, `nav`, `header`, `footer`, `aside`, `article`, `div`, `span` など）を直接使う。

### 6.1 escape hatch を使うべきケース

- ARIA 属性（`aria-label`, `aria-describedby`, `role` など）を付与したい
- `data-*` 属性を付けたい
- `<nav>`, `<header>`, `<footer>`, `<aside>`, `<article>` などランドマーク要素を使いたい（View プリミティブ未提供）
- `<form>` / `<input>` / `<select>` などフォーム要素を使いたい
- View プリミティブのマッピングと異なる semantic 要素を意図的に選びたい

### 6.2 混在ルール

View プリミティブと HTML DSL は同一ページ内で混在可能（両者とも `HtmlTag` を返す）。

```typescript
import { Page, Section, Heading, page } from 'draft-ole';
import { h2, nav, a } from 'draft-ole';

page(
  Page(
    nav(a({ href: '/' }, 'home')),
    Section(
      Heading(1, 'タイトル'),
      h2('サブ見出し（HTML DSL 直叙）'),
    ),
  ),
);
```

### 6.3 判断ガイド

- 既定の semantic マッピングで意図が表現できる → View プリミティブ
- 特殊属性 / ランドマーク / フォームが必要 → HTML DSL escape hatch
- 同一要素の挙動を変えたい場合は HTML DSL を優先（View プリミティブはオプション拡張で対応しない）

---

## 7. 非対象

本仕様の初期スコープでは以下を扱わない:

- 自動見出しレベル算出（`Section` ネスト深さからの推定）
- フル a11y フレームワーク（ARIA ロール一覧、フォーカス管理、ライブリージョン等）
- 構造化データ（JSON-LD）/ OGP / Twitter Card の生成
- `<nav>` / `<header>` / `<footer>` などランドマーク要素の View プリミティブ化（HTML DSL で代替）
- `Heading` 順序の lint 検証（将来拡張として検討）
