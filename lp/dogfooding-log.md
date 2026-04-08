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

---

## Task 4: コード例セクション

### 実行結果

- Before/After のコード比較セクションを追加。`node --experimental-strip-types lp/lp-builder.ts` で正常実行
- `lp/output/index.html` に `<section id="code-example">` と2つの `<div>` ブロック（`#before`, `#after`）が生成された
- `lp/output/style.css` に `#code-example`, `#code-title`, `#code-row`, `#before`, `#after` 等のCSSブロックが生成された

### 発見事項

1. **HTMLエスケープが行われない（致命的）** — `Text()` ファクトリはテキスト内の `<`, `>` をHTMLエンティティ（`&lt;`, `&gt;`）にエスケープしない。Before ブロックの `<div class="card">` や `<h2>Hello</h2>` がそのままHTMLとして解釈され、実際のDOM要素として描画される。`<!-- index.html -->` もHTMLコメントとして消える。コード例を表示するには、ライブラリ側にエスケープ機能が必要、または手動で `&lt;` `&gt;` を記述する回避策が必要
2. **`<pre><code>` のマルチラインテキスト** — テンプレートリテラル（バッククォート）で渡した複数行テキストは `Text()` で正しく保持される。ただしレンダラーが各行にHTMLインデントを追加するため、`<pre>` 内の整形済みテキストに不要な空白が入る。`<pre>` 要素は空白をそのまま表示するため、レンダラーのインデントが視覚的なズレを生む
3. **After ブロックは問題なし** — HTMLタグを含まないTypeScriptコードはエスケープ不要のため、正しく表示される。`Text()` + テンプレートリテラルの組み合わせはHTML要素を含まないコードには適している
4. **`pre`, `code` ファクトリの入れ子** — `pre(code(Text(...)))` のネストは直感的に動作した。ファクトリ関数の可変引数パターンが子要素の自動追加に対応している
5. **CSS APIは安定** — `style.visual.setOverflow('auto')` や `style.font.setFontFamily()` は前回同様に正常動作。プロパティ名の命名は一度覚えれば一貫性がある

---

## Task 5: フッターCTAセクション

### 実行結果

- `<footer id="footer">` セクションを追加。`node --experimental-strip-types lp/lp-builder.ts` で正常実行
- `lp/output/index.html` に `<footer id="footer">` とメッセージ（`#footer-msg`）、CTAボタン（`#footer-cta`）、コピーライト（`#copyright`）が生成された
- `lp/output/style.css` に `#footer`, `#footer-msg`, `#footer-cta`, `#copyright` のCSSブロックが生成された

### 発見事項

1. **CTAボタンのコード重複（設計課題）** — ヒーローセクションの `heroCta` とフッターの `footerCta` はほぼ同一のスタイル設定（`inline-block`, `padding: 16px 40px`, `background: #3b82f6`, `color: #fff`, `font-size: 18px`, `font-weight: 600`, `border-radius: 8px`, `text-decoration: none`）。8行のスタイル設定が完全にコピペされている。DraftOleにスタイルプリセットやコンポーネントテンプレート機能があれば `const ctaStyle = createPreset(...)` のように共通化できる。現状はヘルパー関数で回避可能だが、ライブラリレベルのサポートが望ましい
2. **LP全体の構造が完成** — Hero → Features → Code Example → Footer の4セクション構成。全セクションが正常にHTML/CSS出力され、`sid()` + `collectIdCss()` の回避策で一貫したスタイリングが実現できた
3. **`footer()` ファクトリは問題なし** — セマンティックHTML要素 `<footer>` が正しく生成された。`section()` と同様のパターンで使える
4. **ファイルサイズの成長** — `lp-builder.ts` は約280行に成長。セクション追加ごとに50〜70行のボイラープレートが増える。コンポーネント抽象化なしでは大規模ページの構築は現実的でない。Task 3 の発見事項と合わせ、コンポーネントテンプレート機能の必要性が再確認された
5. **全体を通じたAPI安定性** — 5タスクを通じて `css.styleManager.style.*` APIは一貫して動作。プロパティ名の命名に慣れれば、予測可能な挙動。ただし冗長性（5段階ドットチェーン）は最後まで気になるポイント

---

## 総括

### 最も影響の大きい制約（次の開発��先度）

| 優先度 | 問題 | 影響 | ����タスク |
|--------|------|------|-----------|
| **P0** | CSS収集が子要素に再帰しない | スタイルが出力されない。回避策なしでは使えない | Task 2 |
| **P0** | スコープCSSクラスがHTMLに自動付与されない | CSS出力とHTML出力が断絶している | Task 2 |
| **P1** | HTMLエスケープされない | `<pre><code>` でコード例を表示できない | Task 4 |
| **P1** | `<pre>` 内にレンダラーのインデントが混入 | 整形���みテキストが崩れる | Task 4 |
| **P1** | CSS APIが冗長（5段階ドットチェーン） | DX が悪い。`element.style.font.setFontSize()` で十分 | Task 2 |
| **P2** | `<!DOCTYPE html>` が出力されない | HTML5非準拠 | Task 1 |
| **P2** | `setFlex('1')` がない | CSSショートハンド非対応。`setFlexGrow` ���代用 | Task 3 |
| **P2** | コンポーネントテンプレート/プリセット機能がない | 反復パターンのコピペが増える | Task 3, 5 |
| **P3** | FileExporter挿入タグのインデント不整合 | 見た目の問題のみ | Task 1 |
| **P3** | CSS プロパティ名の命名が非直感的 | `style.position` が display/maxWidth を含む | Task 2 |

### API の良かった点

1. **ファクトリ関数 + addChildren()** — 直感的なツリー構築。HTMLの構造がTypeScriptで表現できる
2. **属性のファクトリ引数パターン** — `a({ href: '#' }, Text('...'))` は簡潔で自然
3. **FileExporter** — 3ファイル出力が1メソッドで���了。reset.css バンドルも便利
4. **CSS プロパティの網羅性** — 146+ プロパティが型安全に使える。一度命名���覚えれば一貫性がある
5. **Tree-shaking JS** — 使用メソッドのみヘルパー出力。無駄がない

### 結論

**LPを作れたか**: 部分的にYes。HTML構造とCSSスタイルは（回避策あり）正常に出力。ただしコード��セクションのHTML��スケープ問題は未解決。

**最大のブロッカー**: CSS収集の非再帰（P0）。これが解決されればライブラリ単体で実用可能になる。

**次のアクション**:
1. `HtmlTag.collectCssStyleString()` を子再帰に修正（P0）
2. スコープCSSクラスのHTML自動付与を実装（P0）
3. `Text()` / `escapeHtml()` のデフォルトエスケープを実装（P1）
4. CSS APIのショートハンド（`element.style.font.setFontSize()`）を追加（P1）
