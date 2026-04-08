# DraftOle LP ドッグフーディング記録

実験日: 2026-04-08

---

## Task 1: プロジェクトセットアップ

### 実行結果

- `node --experimental-strip-types lp/lp-builder.ts` で正常実行
- `lp/output/index.html` と `lp/output/style.css` が生成された

### 発見事項

1. **`<!DOCTYPE html>` が出力されない** — `Root.render()` は `<!DOCTYPE html>` 宣言を含まない。HTML5準拠には手動追加か、Rootオプションが必要
2. **JSファイルが未生成** — `renderJs()` が空文字列を返す場合、`script.js` は出力されない（これは正しい挙動と思われる）
3. **`<link>` タグのインデント不整合** — FileExporterが挿入する `<link rel="stylesheet">` のインデントが `<head>` 内の他要素と揃っていない（8スペースではなく4スペース）
4. **APIの使い勝手** — `html()`, `head()`, `body()` などのファクトリ関数 + `addChildren()` の組み合わせは直感的。最小構成で動作確認できた
5. **ESM + TypeScript** — `--experimental-strip-types` で `.ts` ファイルを直接実行可能。ただし実験的機能の警告が出る

---

## Task 2: ヒーローセクション

### 実行結果

- `node --experimental-strip-types lp/lp-builder.ts` で正常実行
- HTML構造は正しく生成された（`<section>`, `<h1>`, `<p>`, `<a href="#">`）
- **CSSスタイルが `style.css` に出力されない**（重大な問題）

### 発見事項

1. **CSS収集が再帰的でない（致命的）** — `Root.collectCssStyleString()` は直接の子要素のみ走査し、`HtmlTag.collectCssStyleString()` は自身の `_css.render()` のみ返す。子孫要素のCSSが収集されないため、`body` 以下に設定したスタイルが全て失われる。これはライブラリの根本的な設計バグ
2. **CSS APIのプロパティ名が直感的でない** — タスク指示では `style.background`, `style.visibility` と記載されていたが、実際のAPI名は `style.backgroundColor`, `style.position`。特に `position` は `CSSVisibility` クラスのインスタンスなのに `position` という名前で、display/overflow/maxWidth なども含む。命名の混乱を招く
3. **CSS APIの冗長性** — `element.css.styleManager.style.font.setFontSize('48px')` は5段階のドットチェーン。ショートハンド（例: `element.style.font.setFontSize('48px')`）が欲しい
4. **属性設定はファクトリパターンが自然** — `a({ href: '#' }, Text('Get Started'))` のファクトリ引数パターンは直感的に動作した。`addHtmlAttribute()` より簡潔
5. **`Text()` ファクトリは明示的で良い** — `h1(Text('...'))` はテキストノードの存在を明示する。ただし `title('...')` のように文字列リテラルを直接受け付けるファクトリとの非一貫性がある（titleはstring引数を受けるが、h1はText()が必要）

6. **スコープCSS: HTMLのclass属性に自動付与されない** — `renderCss()` で `._hash { ... }` 形式のCSSは生成されるが、HTMLレンダリング時にそのclass名がHTML要素のclass属性に自動追加されない。CSSとHTMLが断絶している
7. **スコープCSS: tagPath 未設定で全要素が同一ハッシュ** — ファクトリ関数で生成した要素の `tagPath` はデフォルトで空文字列。全要素が同じハッシュ `._00001505` になり、スタイルが衝突する

### 回避策

ID属性ベースのCSS出力ヘルパー `sid()` + `collectIdCss()` を実装。各要素に手動でIDを振り、`#id { ... }` 形式でCSSを出力。本来はライブラリが担うべき機能。

### 次のステップへの影響

回避策により LP 構築は続行可能。ただし以下はライブラリの根本修正が必要:
- `HtmlTag.collectCssStyleString()` の子再帰
- スコープクラスのHTML自動付与
- ファクトリ関数でのtagPath自動設定

---

## Task 3: 特徴3カラムセクション

### 実行結果

- 3カラムのFeatureセクションを追加。`node --experimental-strip-types lp/lp-builder.ts` で正常実行
- `lp/output/index.html` に `<section id="features">` と3つのカード（`#f1`, `#f2`, `#f3`）が生成された
- `lp/output/style.css` に `#features`, `#features-title`, `#features-row`, `#f1`〜`#f3-desc` のCSSブロックが生成された

### 発見事項

1. **反復パターンが冗長** — 3枚のカードはほぼ同一のスタイル設定（`setFlexGrow('1')`, `setPadding('32px')`, `setBackgroundColor('#1a1a1a')`, `setBorderRadius('12px')`）。ヘルパー関数やループで抽象化すべきだが、DraftOle自体にはコンポーネントテンプレート機能がまだない。これはライブラリの重要な改善ポイント
2. **Flexbox APIの使い勝手** — `setGap('32px')` は直感的に動作した。ただし `setFlex('1')` は存在せず `setFlexGrow('1')` を使う必要があった。CSSショートハンド `flex: 1` に対応する `setFlex()` メソッドがないのは不便。`flex: 1` は `flex-grow: 1; flex-shrink: 1; flex-basis: 0%` の省略形なので、3つ個別に設定するか `setFlexGrow` だけで近似するしかない
3. **`h2` ファクトリの追加インポート** — `h1` はインポート済みだったが `h2` は未インポート。ファクトリ関数は要素ごとに個別インポートが必要。`import * as tags from '...'` のようなバレルエクスポートがあると便利
4. **CSS出力は正常** — `sid()` + `collectIdCss()` の回避策は引き続き機能。要素数が増えても問題なくID単位でCSSが収集された
