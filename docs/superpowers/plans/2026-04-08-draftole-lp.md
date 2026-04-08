# DraftOle LP ドッグフーディング実験 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DraftOle API のみで自身のランディングページを構築し、API の制約を洗い出す

**Architecture:** `lp/lp-builder.ts` 1ファイルで LP 全体を DraftOle API で構築。`dist/` の compiled JS を直接 import し、`FileExporter` で `lp/output/` に 3ファイル出力する。

**Tech Stack:** Node.js (ESM), DraftOle (dist/index.js), FileExporter

---

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `lp/lp-builder.ts` | LP 構築スクリプト（メインソース） |
| `lp/output/index.html` | 生成物: HTML |
| `lp/output/style.css` | 生成物: CSS |
| `lp/output/script.js` | 生成物: JS（ある場合のみ��� |
| `lp/dogfooding-log.md` | 制約・発見の記録 |

---

## Task 1: プロジェクトセットアップ

**Files:**
- Create: `lp/lp-builder.ts`
- Create: `lp/dogfooding-log.md`

- [ ] **Step 1: dogfooding-log.md を作成**

```markdown
# DraftOle LP ドッグフーディング記録

実験日: 2026-04-08

---
```

- [ ] **Step 2: lp-builder.ts の骨格を作成**

最小限のHTMLドキュメントを生成して DraftOle API の動作確認をする。

```typescript
import {
  Root, PairType, TextType,
  html, head, body, title, meta,
  FileExporter,
} from '../dist/index.js';

// ── Document ──
const root = new Root();
const htmlEl = html({ lang: 'ja' });
const headEl = head(
  meta({ charset: 'utf-8' }),
  meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
  title('DraftOle — TypeScript DSL for Web'),
);
const bodyEl = body();

htmlEl.addChildren([headEl, bodyEl]);
root.addChild(htmlEl);

// ── Export ──
const htmlContent = root.render();
const cssContent = root.collectCssStyleString();
const jsContent = root.renderJs();

const exporter = new FileExporter({ includeResetCss: true });
exporter.export(htmlContent, cssContent, jsContent, './lp/output');

console.log('✓ LP generated → lp/output/');
```

- [ ] **Step 3: 実行して動作確認**

Run: `node lp/lp-builder.ts`

Expected: `lp/output/index.html` が生成される。ブラウザで開いて空の HTML ページが表示される。

**注意:** `.ts` ファイルを直接 `node` で実行できない場合、拡張子を `.mjs` に変更するか、`node --experimental-strip-types` を使う。この時点で発生した問題は `dogfooding-log.md` に記録する。

- [ ] **Step 4: dogfooding-log に発見を記録**

実行時に遭遇した問題（DOCTYPE の有無、meta タグの属性渡し方、import パスの問題など）をすべて記録する。

- [ ] **Step 5: コミット**

```bash
git add lp/lp-builder.ts lp/dogfooding-log.md lp/output/
git commit -m "feat(lp): scaffold LP builder with minimal DraftOle document"
```

---

## Task 2: ヒーローセクション

**Files:**
- Modify: `lp/lp-builder.ts`

- [ ] **Step 1: ラッパーとヒーローセクションの要素を追加**

`bodyEl` の後に以下を追加:

```typescript
import {
  Root, PairType, TextType, Text,
  html, head, body, title, meta, link,
  div, h1, h2, p, span, a, section, header, footer, nav, pre, code,
  FileExporter,
} from '../dist/index.js';

// ── Wrapper (1200px centered) ──
const wrapper = div();
wrapper.css.styleManager.style.visibility.setMaxWidth('1200px');
wrapper.css.styleManager.style.spacing.setMargin('0 auto');
wrapper.css.styleManager.style.spacing.setPadding('0 24px');

// ── Hero Section ──
const heroSection = section();
heroSection.css.styleManager.style.spacing.setPadding('120px 0 80px');
heroSection.css.styleManager.style.text.setTextAlign('center');

const heroTitle = h1(Text('HTML, CSS, JS — TypeScript ひとつで。'));
heroTitle.css.styleManager.style.font.setFontSize('48px');
heroTitle.css.styleManager.style.font.setFontWeight('700');
heroTitle.css.styleManager.style.font.setColor('#ffffff');
heroTitle.css.styleManager.style.spacing.setMarginBottom('24px');

const heroSub = p(Text('型安全なDSLでWebページを丸ごと生成'));
heroSub.css.styleManager.style.font.setFontSize('20px');
heroSub.css.styleManager.style.font.setColor('#a0a0a0');
heroSub.css.styleManager.style.spacing.setMarginBottom('40px');

const heroCta = a(Text('Get Started'));
heroCta.attr.set('href', '#');
heroCta.css.styleManager.style.visibility.setDisplay('inline-block');
heroCta.css.styleManager.style.spacing.setPadding('16px 40px');
heroCta.css.styleManager.style.background.setBackgroundColor('#3b82f6');
heroCta.css.styleManager.style.font.setColor('#ffffff');
heroCta.css.styleManager.style.font.setFontSize('18px');
heroCta.css.styleManager.style.font.setFontWeight('600');
heroCta.css.styleManager.style.border.setBorderRadius('8px');
heroCta.css.styleManager.style.text.setTextDecoration('none');

heroSection.addChildren([heroTitle, heroSub, heroCta]);
wrapper.addChild(heroSection);
bodyEl.addChild(wrapper);
```

- [ ] **Step 2: body にダークテーマのベーススタイルを追加**

`bodyEl` の直後に追加:

```typescript
bodyEl.css.styleManager.style.background.setBackgroundColor('#0a0a0a');
bodyEl.css.styleManager.style.font.setColor('#ffffff');
bodyEl.css.styleManager.style.font.setFontFamily("'Inter', 'Noto Sans JP', sans-serif");
bodyEl.css.styleManager.style.spacing.setMargin('0');
bodyEl.css.styleManager.style.spacing.setPadding('0');
```

- [ ] **Step 3: 実行して確��**

Run: `node lp/lp-builder.ts`

Expected: ブラウザでダーク背景のヒーローセクション（キャッチコピー + サブテキスト + 青いボタン）が表示される。

- [ ] **Step 4: dogfooding-log に発見を記録**

CSS API のアクセスパス（`css.styleManager.style.font.setFontSize()`）の冗長さ、属性設定方法、Text ノードの使い方など気づいた点を記録。

- [ ] **Step 5: コミット**

```bash
git add lp/lp-builder.ts lp/output/ lp/dogfooding-log.md
git commit -m "feat(lp): add hero section with dark theme"
```

---

## Task 3: 特徴3カラムセクション

**Files:**
- Modify: `lp/lp-builder.ts`

- [ ] **Step 1: 特徴セクションを追加**

ヒーローセクションの後に追加:

```typescript
// ── Features Section ──
const featuresSection = section();
featuresSection.css.styleManager.style.spacing.setPadding('80px 0');

const featuresTitle = h2(Text('なぜ DraftOle？'));
featuresTitle.css.styleManager.style.font.setFontSize('32px');
featuresTitle.css.styleManager.style.font.setFontWeight('700');
featuresTitle.css.styleManager.style.font.setColor('#ffffff');
featuresTitle.css.styleManager.style.text.setTextAlign('center');
featuresTitle.css.styleManager.style.spacing.setMarginBottom('48px');

const featuresRow = div();
featuresRow.css.styleManager.style.visibility.setDisplay('flex');
featuresRow.css.styleManager.style.flex.setGap('32px');

// Feature 1: 三位一体
const feature1 = div();
feature1.css.styleManager.style.flex.setFlex('1');
feature1.css.styleManager.style.spacing.setPadding('32px');
feature1.css.styleManager.style.background.setBackgroundColor('#1a1a1a');
feature1.css.styleManager.style.border.setBorderRadius('12px');

const f1Title = h2(Text('三位一体'));
f1Title.css.styleManager.style.font.setFontSize('24px');
f1Title.css.styleManager.style.font.setFontWeight('600');
f1Title.css.styleManager.style.font.setColor('#ffffff');
f1Title.css.styleManager.style.spacing.setMarginBottom('12px');

const f1Desc = p(Text('HTML・CSS・JSを1つのTypeScriptファイルで記述。もう3ファイルを行き来する必要はありません。'));
f1Desc.css.styleManager.style.font.setColor('#a0a0a0');
f1Desc.css.styleManager.style.font.setLineHeight('1.6');

feature1.addChildren([f1Title, f1Desc]);

// Feature 2: 型���全
const feature2 = div();
feature2.css.styleManager.style.flex.setFlex('1');
feature2.css.styleManager.style.spacing.setPadding('32px');
feature2.css.styleManager.style.background.setBackgroundColor('#1a1a1a');
feature2.css.styleManager.style.border.setBorderRadius('12px');

const f2Title = h2(Text('��安全'));
f2Title.css.styleManager.style.font.setFontSize('24px');
f2Title.css.styleManager.style.font.setFontWeight('600');
f2Title.css.styleManager.style.font.setColor('#ffffff');
f2Title.css.styleManager.style.spacing.setMarginBottom('12px');

const f2Desc = p(Text('146以上のCSSプロパティすべてに型補完が効きます。タイポや無効な値をコンパイル時にキャッチ。'));
f2Desc.css.styleManager.style.font.setColor('#a0a0a0');
f2Desc.css.styleManager.style.font.setLineHeight('1.6');

feature2.addChildren([f2Title, f2Desc]);

// Feature 3: ゼロランタイム
const feature3 = div();
feature3.css.styleManager.style.flex.setFlex('1');
feature3.css.styleManager.style.spacing.setPadding('32px');
feature3.css.styleManager.style.background.setBackgroundColor('#1a1a1a');
feature3.css.styleManager.style.border.setBorderRadius('12px');

const f3Title = h2(Text('ゼロランタイム'));
f3Title.css.styleManager.style.font.setFontSize('24px');
f3Title.css.styleManager.style.font.setFontWeight('600');
f3Title.css.styleManager.style.font.setColor('#ffffff');
f3Title.css.styleManager.style.spacing.setMarginBottom('12px');

const f3Desc = p(Text('出力は純粋なHTML/CSS/JS。ランタイム依存なし。どこにでもデプロイできます。'));
f3Desc.css.styleManager.style.font.setColor('#a0a0a0');
f3Desc.css.styleManager.style.font.setLineHeight('1.6');

feature3.addChildren([f3Title, f3Desc]);

featuresRow.addChildren([feature1, feature2, feature3]);
featuresSection.addChildren([featuresTitle, featuresRow]);
wrapper.addChild(featuresSection);
```

- [ ] **Step 2: 実行して確認**

Run: `node lp/lp-builder.ts`

Expected: ヒーロー下に3カラムのカード（ダーク背景、角丸）が横並びで表示される。

- [ ] **Step 3: dogfooding-log に発見を記録**

Flexbox API の使い勝手（`setFlex('1')` は正しいか？）、カード作成の繰り返しパターンなど。

- [ ] **Step 4: コミット**

```bash
git add lp/lp-builder.ts lp/output/ lp/dogfooding-log.md
git commit -m "feat(lp): add 3-column features section"
```

---

## Task 4: コード例セクション（Before / After）

**Files:**
- Modify: `lp/lp-builder.ts`

- [ ] **Step 1: コード例セクションを追加**

特徴セクションの後に追加:

```typescript
// ─��� Code Example Section ──
const codeSection = section();
codeSection.css.styleManager.style.spacing.setPadding('80px 0');

const codeTitle = h2(Text('Before → After'));
codeTitle.css.styleManager.style.font.setFontSize('32px');
codeTitle.css.styleManager.style.font.setFontWeight('700');
codeTitle.css.styleManager.style.font.setColor('#ffffff');
codeTitle.css.styleManager.style.text.setTextAlign('center');
codeTitle.css.styleManager.style.spacing.setMarginBottom('48px');

const codeRow = div();
codeRow.css.styleManager.style.visibility.setDisplay('flex');
codeRow.css.styleManager.style.flex.setGap('24px');

// Before: 従来の3ファイル
const beforeBlock = div();
beforeBlock.css.styleManager.style.flex.setFlex('1');
beforeBlock.css.styleManager.style.background.setBackgroundColor('#1a1a1a');
beforeBlock.css.styleManager.style.border.setBorderRadius('12px');
beforeBlock.css.styleManager.style.spacing.setPadding('24px');
beforeBlock.css.styleManager.style.visual.setOverflow('auto');

const beforeLabel = p(Text('従来の方法（3ファイル）'));
beforeLabel.css.styleManager.style.font.setFontSize('14px');
beforeLabel.css.styleManager.style.font.setColor('#666666');
beforeLabel.css.styleManager.style.spacing.setMarginBottom('16px');

const beforeCode = pre(code(Text(
`<!-- index.html -->
<div class="card">
  <h2>Hello</h2>
  <button id="btn">Click</button>
</div>

/* style.css */
.card {
  padding: 24px;
  background: #1a1a1a;
  border-radius: 12px;
}

// script.js
document.getElementById('btn')
  .addEventListener('click', () => {
    alert('Clicked!');
  });`
)));
beforeCode.css.styleManager.style.font.setFontSize('14px');
beforeCode.css.styleManager.style.font.setColor('#c0c0c0');
beforeCode.css.styleManager.style.font.setFontFamily("'Fira Code', monospace");

beforeBlock.addChildren([beforeLabel, beforeCode]);

// After: DraftOle
const afterBlock = div();
afterBlock.css.styleManager.style.flex.setFlex('1');
afterBlock.css.styleManager.style.background.setBackgroundColor('#0d1b2a');
afterBlock.css.styleManager.style.border.setBorderRadius('12px');
afterBlock.css.styleManager.style.spacing.setPadding('24px');
afterBlock.css.styleManager.style.visual.setOverflow('auto');

const afterLabel = p(Text('DraftOle（1ファイル）'));
afterLabel.css.styleManager.style.font.setFontSize('14px');
afterLabel.css.styleManager.style.font.setColor('#3b82f6');
afterLabel.css.styleManager.style.spacing.setMarginBottom('16px');

const afterCode = pre(code(Text(
`import { div, h2, button } from 'draft-ole';

const card = div(
  h2(Text('Hello')),
  button(Text('Click'))
);

card.css.styleManager.style.spacing
  .setPadding('24px');
card.css.styleManager.style.background
  .setBackgroundColor('#1a1a1a');
card.css.styleManager.style.border
  .setBorderRadius('12px');

card.jqm.click('handleClick');`
)));
afterCode.css.styleManager.style.font.setFontSize('14px');
afterCode.css.styleManager.style.font.setColor('#7dd3fc');
afterCode.css.styleManager.style.font.setFontFamily("'Fira Code', monospace");

afterBlock.addChildren([afterLabel, afterCode]);

codeRow.addChildren([beforeBlock, afterBlock]);
codeSection.addChildren([codeTitle, codeRow]);
wrapper.addChild(codeSection);
```

- [ ] **Step 2: 実行して確認**

Run: `node lp/lp-builder.ts`

Expected: 2カラムでBefore/Afterのコード比較が表示。左はグレー系、右はブルー系の背景。

- [ ] **Step 3: dogfooding-log に発見を記録**

`<pre><code>` 内のテキスト表示（改行・インデント・HTMLエスケープ）の挙動を重点的に記録���

- [ ] **Step 4: コミット**

```bash
git add lp/lp-builder.ts lp/output/ lp/dogfooding-log.md
git commit -m "feat(lp): add before/after code comparison section"
```

---

## Task 5: フッターCTAセクション

**Files:**
- Modify: `lp/lp-builder.ts`

- [ ] **Step 1: フッターセクションを追加**

コードセクションの後に追加:

```typescript
// ── Footer CTA Section ──
const footerSection = footer();
footerSection.css.styleManager.style.spacing.setPadding('80px 0 40px');
footerSection.css.styleManager.style.text.setTextAlign('center');

const footerMsg = p(Text('TypeScript ひとつで、Webを作ろう。'));
footerMsg.css.styleManager.style.font.setFontSize('24px');
footerMsg.css.styleManager.style.font.setColor('#ffffff');
footerMsg.css.styleManager.style.spacing.setMarginBottom('32px');

const footerCta = a(Text('Get Started'));
footerCta.attr.set('href', '#');
footerCta.css.styleManager.style.visibility.setDisplay('inline-block');
footerCta.css.styleManager.style.spacing.setPadding('16px 40px');
footerCta.css.styleManager.style.background.setBackgroundColor('#3b82f6');
footerCta.css.styleManager.style.font.setColor('#ffffff');
footerCta.css.styleManager.style.font.setFontSize('18px');
footerCta.css.styleManager.style.font.setFontWeight('600');
footerCta.css.styleManager.style.border.setBorderRadius('8px');
footerCta.css.styleManager.style.text.setTextDecoration('none');

const copyright = p(Text('© 2026 DraftOle'));
copyright.css.styleManager.style.font.setFontSize('14px');
copyright.css.styleManager.style.font.setColor('#666666');
copyright.css.styleManager.style.spacing.setMarginTop('48px');

footerSection.addChildren([footerMsg, footerCta, copyright]);
wrapper.addChild(footerSection);
```

- [ ] **Step 2: 実行して確認**

Run: `node lp/lp-builder.ts`

Expected: ページ下部にCTAメッセージ、青いボタン、コピーライトが表示。LP全体が完成。

- [ ] **Step 3: dogfooding-log に発見を記録**

LP全体を通して感じた API の使い勝手、繰り返しパターン、不足機能をすべて記録。

- [ ] **Step 4: コミット**

```bash
git add lp/lp-builder.ts lp/output/ lp/dogfooding-log.md
git commit -m "feat(lp): add footer CTA section — LP complete"
```

---

## Task 6: ドッグフーディング総括

**Files:**
- Modify: `lp/dogfooding-log.md`

- [ ] **Step 1: dogfooding-log を総括セクションで締める**

全タスクで記録した発見を見返し、以下を追記:

```markdown
---

## 総括

### 最も影響の大きい制約（次の開発優先度）

1. （Task 1-5 で発見した最重要項目）
2. ...
3. ...

### API の良かった点

- ...

### 結論

LPを作れたか: Yes / No（部分的）
次のアクション: ...
```

- [ ] **Step 2: Discovery ドキュメントを更新**

`PM/Discovery-DraftOle-significance.md` の「次のアクション」セクションに実験 #1 の結果を反映。

- [ ] **Step 3: コミット**

```bash
git add lp/dogfooding-log.md PM/Discovery-DraftOle-significance.md
git commit -m "docs(lp): summarize dogfooding findings"
```
