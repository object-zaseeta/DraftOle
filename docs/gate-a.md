# Gate A 評価記録: page-dogfooding-spec

## 概要

`page` + View DSL を主語とした LP（ランディングページ）を実装し、新 API が「静的ページを気持ちよく書ける」ものかを検証した。本ドキュメントは Gate A の合否判定とエビデンスを記録する。

---

## 判定: ✅ 合格 (PASS)

`page()` + View DSL のみで 4 セクション LP を実装し、出力 HTML/CSS の品質をスナップショットおよび a11y 構造テストで確認できた。

---

## 実装成果物

| ファイル | 役割 |
|---|---|
| `examples/page-landing.ts` | `page()` + View DSL による 4 セクション LP ソース |
| `.internal/lp/page-lp-builder.ts` | ファイル出力用ビルドスクリプト |
| `tests/examples/page-landing.snapshot.test.ts` | HTML 出力スナップショットテスト |
| `tests/examples/page-landing-a11y.test.ts` | セマンティクス・a11y 構造確認テスト |

### LP 構成（hero / feature / CTA / footer）

`html()/body()/div()` のロウ HTML ファクトリは一切使用せず、`page()`, `Page()`, `Section`, `VStack`, `HStack`, `Text` のみで構成。`featureCard(title, desc)` ヘルパーで 3 つのフィーチャーカードを抽象化。modifier チェーンとして `.font()`, `.padding()`, `.foregroundStyle()`, `.background()`, `.frame()`, `.cornerRadius()` を活用。

---

## テスト結果

### スナップショットテスト

```
tests/examples/page-landing.snapshot.test.ts (4 tests) — 全 PASS
  ✓ HTML が生成される
  ✓ CSS が <head> に インライン されている
  ✓ <main> および <section> が存在する
  ✓ スナップショットと一致する
```

### a11y 構造テスト

```
tests/examples/page-landing-a11y.test.ts (5 tests) — 全 PASS
  ✓ <html lang="ja"> が存在する
  ✓ <main> および <title> が存在する
  ✓ <section> が 4 つ以上存在する
  ✓ <style> タグ内に CSS ルールが存在する (P0 再発防止)
  ✓ <head> 内 <style> 内容の長さが 0 より大きい (旧バグ再発なし)
```

### LP ビルド出力

`node --import tsx .internal/lp/page-lp-builder.ts` を実行し、`.internal/lp/page-output/index.html` および `.internal/lp/page-output/style.css` が生成された。

---

## 要件達成状況

| 要件 ID | 概要 | 達成 | エビデンス |
|---|---|---|---|
| 1.1 | hero/feature/CTA/footer の 4 セクション | ✅ | a11y テスト `<section>` 4 つ以上確認 |
| 1.2 | `page` + View 語彙で記述 | ✅ | `examples/page-landing.ts` でロウ HTML ファクトリ未使用 |
| 2.1 | ページ構成として読める | ✅ | `Page(heroSection, featureSection, ctaSection, footerSection)` のフラット構造 |
| 2.2 | spacing/typography/color を modifier で指定 | ✅ | 6 種類の modifier チェーンを各セクションで活用 |
| 3.1 | P0〜P1 課題の再発防止 | ✅ | a11y テストで `<style>` 非空・CSS ルール存在を確認 |
| 4.1 | 完全な HTML ドキュメント | ✅ | `<!DOCTYPE html>` 〜 `</html>` まで生成 |
| 4.2 | スコープ CSS が全セクションをカバー | ✅ | snapshot にて `_xxxxxxxx` クラスベース CSS を確認 |
| 4.3 | 意味的構造を保持 | ✅ | `<main>`, `<section>`, `lang="ja"` を a11y テストで確認 |
| 5.1 | スナップショット/文字列テストの提供 | ✅ | snapshot + a11y 計 9 テスト |
| 5.2 | Gate A 結果ドキュメント | ✅ | 本ファイル |

---

## 残課題・気づき

### Node ランタイムでの直接実行制約

- `node --experimental-strip-types examples/page-landing.ts` は、`../src/view/index.js` の `.js → .ts` 自動解決が Node v22.12.0 では動作しないため失敗する。これは既存の `examples/page-minimal.ts` も同様で、本 spec が新規に持ち込んだ問題ではない。
- 暫定回避策として `node --import tsx examples/page-landing.ts` または vitest（Vite リゾルバ経由）で実行すれば正常に HTML が出力される。
- 恒久的には Node 23+ への引き上げ、もしくは tsx を標準ランナーとして README に明記する選択肢がある。

### 観察された強み

- `Section(content).background('#xxx').padding(...)` のような modifier 連鎖でセクション単位のスタイリングが直感的に書ける。
- `featureCard()` のような小さなファクトリ関数で繰り返し UI を抽象化でき、ページソースの可読性が高い。
- `<style>` が `<head>` 内にインラインされ、スコープクラスで衝突を回避する仕組みが透過的に動作している。

### 観察された弱み・将来の検討事項

- `Section` がオプション引数（デフォルト padding 等）を受け取らないため、共通レイアウトを毎回 modifier で記述する必要がある。
- `padding('horizontal' as const, 24)` の `as const` 注釈はオーバーロード解決の都合で必要だが、API 利用側の冗長さに繋がっている。
- 現状はインタラクティブ要素を含まないため、JS イベントハンドラ統合の体験は未検証。

---

## 結論

`page` + View DSL は、静的 LP の組み立てに対して目的の体験（ページ構成として読める／modifier 連鎖でスタイル宣言できる／旧 P0 バグが再発しない）を提供できた。Gate A は **合格**。次フェーズでは上記弱みの解消と、より大規模な LP（`<pre><code>` を含むコード掲載セクション等）へのドッグフーディング拡張を検討する。
