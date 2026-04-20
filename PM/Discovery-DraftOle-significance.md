# Discovery Plan: DraftOle 開発継続の意義

**Date**: 2026-04-08
**Product Stage**: 既存プロダクト（開発中・TypeScript移行済み）
**Discovery Question**: DraftOleを開発し続ける意義はあるか？

---

## プロジェクト現状

| 項目 | 内容 |
|------|------|
| プロダクト | TypeScript DSL for HTML/CSS/JS生成 |
| 開発経緯 | Swift版（DraftOle_0.1）→ TypeScript版（DraftOle_0.2）に移行 |
| 移行理由 | SwiftとJSの接続が困難。TSはコンパイル先がJSで自然につながる |
| 開発実績 | 2371テスト全パス、カバレッジ99%（2026-02-11時点） |
| コア移行進捗 | 96%完了（125タスク中120完了）|
| 残タスク | GitHub Actions(1)、CSS拡張3.10-3.12(3)、DX検証サンプル(1) |
| ソース状況 | ✅ src/・.git/ ともにStudioSSD上で確認済み（2026-04-08） |

---

## Phase 1: 初期Discovery対話（5項目）

### 1. 原点の動機
HTML/CSS/JSという複数言語を使い分けるWeb開発の非効率さを解消したかった。
Swiftひとつ（後にTypeScriptひとつ）でWebを作れるようにすることが出発点。

### 2. 自分自身の使用
まだ実用できるほど成熟していないと感じており、自分のプロジェクトへの適用はまだない。
→ これが「意義が見えない」感覚の根本原因の一つ。

### 3. 想定ユーザー
具体的に想定できていない。ターゲットユーザーが未定義の状態。

### 4. 代替手段との比較（初期認識）

| ライブラリ | HTML | CSS | JS |
|-----------|------|-----|----|
| `htm` / `hyperscript` | ✅ | ❌ | ❌ |
| React SSR | ✅ | 部分的 | ❌ |
| **DraftOle** | ✅ | ✅ | ✅ |

### 5. やめる理由（続ける判断軸）
① 学習曲線が急すぎる
② 利用価値をアピールできない
③ 価値がそもそもない＝ユーザーは現状で満足している

### 初期診断

```
価値仮説は正しい（HTML+CSS+JSを統合するニーズは実在する）
　　↓
でも自分で使えていない
　　↓
だから伝えられない → だから意義が見えない
```

---

## Phase 2: ドッグフーディング実験（2026-04-08）

### 実験 #1: DraftOleのLPをDraftOleで作る

**結果: 部分的に成功。** LP構造（Hero/Features/Code Example/Footer）は構築できたが、回避策が複数必要だった。

詳細: `lp/dogfooding-log.md`, 設計書: `docs/superpowers/specs/2026-04-08-draftole-lp-design.md`

### 発見された課題（優先度順）

| 優先度 | ID | 問題 | 影響 |
|--------|-----|------|------|
| **P0** | DF-1 | CSS収集が子要素に再帰しない | スタイルが出力されない |
| **P0** | DF-2 | スコープCSSクラスがHTMLに自動付与されない | CSS出力とHTML出力が断絶 |
| **P1** | DF-3 | Text() がHTMLエスケープしない | コード例が壊れる |
| **P1** | DF-4 | `<pre>` 内にレンダラーインデントが混入 | 整形済みテキストが崩れる |
| **P1** | DF-5 | CSS APIが冗長（5段階ドットチェーン） | DXが悪い |
| **P2** | DF-6 | `<!DOCTYPE html>` 未出力 | HTML5非準拠 |
| **P2** | DF-7 | `setFlex()` ショートハンド未対応 | CSSショートハンドが書けない |
| **P2** | DF-8 | コンポーネントテンプレート/プリセット機能なし | コード重複が増える |

課題は `ai_Docs/myTask.md` にDF-1〜DF-8として登録済み。

---

## Phase 3: 競合分析と市場評価（2026-04-08）

### 3-1. 競合ランドスケープ

| ツール | HTML | CSS | JS | FW不要 | 型安全 | エコシステム |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Vanilla Extract / Panda CSS / StyleX | - | ✓ | - | - | ✓ | 成長中 |
| htm / hyperscript | ✓ | - | - | ✓ | △ | 小 |
| Astro / Next.js | ✓ | ✓ | ✓ | **×** | △ | 大 |
| Stencil (Web Components) | ✓ | ✓ | ✓ | △ | ✓ | 中 |
| **DraftOle** | **✓** | **✓** | **✓** | **✓** | **✓** | なし |

**「フレームワーク不要で、型安全なTS DSLからHTML+CSS+JSを生成する」ツールは他に存在しない。**
ただし、ニッチが空いている理由が「需要がない」からである可能性がある。

### 3-2. CSSグローバル問題は解決済みか？

**フレームワーク利用者にはほぼ解決済み:**
- CSS Modules（ビルド時ハッシュ化）
- Tailwind CSS（ユーティリティクラスで命名問題回避）
- Vue scoped / Svelte built-in（フレームワーク組み込み）
- `@scope`（CSSネイティブ、2024年〜主要ブラウザ対応）

**フレームワークなしの層にはまだ課題があるが**、`@scope` と Tailwind の普及で解決が進行中。
DraftOleが「CSSスコーピングを解決する」を差別化軸にするのは厳しい。

### 3-3. Webアプリ開発の観点

**コンポーネントフレームワークがすでに「三位一体」を実現している:**

```
React  = JSX(HTML) + CSS Modules/Tailwind(CSS) + ロジック(JS)
Vue    = <template>(HTML) + <style scoped>(CSS) + <script>(JS)
Svelte = markup(HTML) + <style>(CSS) + <script>(JS)
```

Webアプリに必要だがDraftOleにないもの:
- リアクティブな状態管理
- コンポーネントの再利用
- クライアントサイドルーティング
- エコシステム（UIライブラリ等）

**Webアプリ開発の観点では、DraftOleに居場所はない。**

### 3-4. React/Vueへの不満は存在するか？

**存在する。「フレームワーク疲れ」は実在する:**
- 複雑すぎる（ビルドパイプライン、設定ファイル）
- 重すぎる（バンドルサイズ、ハイドレーション）
- 学習コストが高い（hooks, composition API, server components）
- 単純なことが単純にできない

**しかし、その不満に応えるムーブメントはすでに複数ある:**

| 動き | 思想 | DraftOleとの関係 |
|------|------|-----------------|
| HTMX | サーバーでHTML返せばいい | テンプレートエンジンで十分。DraftOle不要 |
| Alpine.js | HTMLに属性を足すだけ | HTML手書き前提。DraftOle不要 |
| Astro | JSは必要な箇所だけ | すでにSSG成熟。DraftOleより完成度高い |
| 11ty | テンプレートエンジンで十分 | 同上 |
| Vanilla JS回帰 | フレームワーク要らない | DSLを挟む理由もない |

**DraftOleの問題: フレームワーク疲れの不満の本質は「余計なものを学びたくない」なのに、DraftOle独自APIの学習を要求している。**

### 3-5. DraftOleが刺さる可能性のある領域

| 用途 | 競合 | DraftOleの強み |
|------|------|---------------|
| メールテンプレート生成 | MJML, React Email | フレームワーク不要、純粋HTML出力 |
| 静的LP/ドキュメント生成 | Astro, 11ty | より軽量（ただしエコシステムで劣る） |
| コード生成ツールの内部エンジン | — | 型安全なHTML/CSS/JS組み立て |
| 教育用途 | — | HTML/CSS/JSの構造を学ぶDSL |
| バックエンドエンジニアがフロントを書く | — | 型安全に慣れた人向け |

**いずれも市場規模は小さい。**

---

## Phase 4: CSSグローバル問題の歴史的文脈（2026-04-08）

### Web開発の課題の変遷

```
素のHTML/CSS/JS
  ↓ CSSグローバル問題（命名衝突、詳細度地獄、管理不能）
  ↓ JSのスパゲッティ化（jQuery時代）
BEM / SMACSS / OOCSS（命名規則で回避）
  ↓ 手動運用の限界。人間が規則を守り続けるのは無理
React + CSS Modules / styled-components / Vue SFC / Svelte
  ↓ CSSスコーピングを仕組みで解決 ✓
  ↓ 代償として複雑さが爆発（ビルドツール、設定ファイル、200MB+ node_modules）
Tailwind（ユーティリティで回避）
  ↓ HTMLがクラス名で埋まる、可読性の問題
HTMX / Alpine.js（シンプルに戻ろう）
  ↓ でもCSSグローバル問題は未解決のまま
```

### 「CSSスコーピング vs シンプルさ」のトレードオフ

Phase 3の分析では「CSSグローバル問題はフレームワークで解決済み」と結論したが、
これは**問題の片面しか見ていなかった**。

フレームワークはCSSスコーピングを解決したが、同時に巨大な複雑さを持ち込んだ。
「シンプルに戻ろう」とするHTMX/Alpine派はCSSグローバル問題を再び未解決にしてしまう。

**つまり「CSSスコーピング」と「シンプルさ」を両立するツールが存在しない。**

| アプローチ | CSSスコーピング | シンプルさ |
|-----------|:---:|:---:|
| 素のHTML/CSS | **×** | **✓** |
| BEM等の命名規則 | △（人間依存） | ✓ |
| React + CSS Modules | **✓** | **×** |
| Tailwind | ✓（回避） | △ |
| HTMX + Alpine | **×** | **✓** |
| **DraftOle（P0修正後）** | **✓** | **✓/△** |

> **注（2026-04-20追記）**: DraftOleの「シンプルさ」は**フレームワーク比で✓、素のHTML比で△**。新DSLを学ぶコストは存在する。「素のHTMLと同等にシンプル」ではなく「フレームワークより軽量で、素のHTMLよりスコーピング安全」が正確な位置づけ。

### DraftOleのポジション再定義

前回の分析で「DraftOleの競合は素のHTML」と述べたが不正確だった。
素のHTMLにはCSSグローバル問題がある。だからフレームワークが生まれた。
フレームワークは問題を解決したが複雑さを持ち込んだ。

**DraftOleが唯一占められるポジション:**

> **CSSスコーピングを仕組みで解決しつつ、フレームワークの複雑さを持ち込まない**

売り文句: 「素のHTMLのシンプルさで、Reactのスコーピングを」

- ビルドパイプライン不要
- 設定ファイル不要
- フレームワーク学習不要
- CSSは要素ごとに自動スコープ
- 型安全

**ただしこれはP0（DF-1, DF-2）が修正されて初めて成立する。** 現状はスコープCSSが壊れている。

### Phase 3 分析の修正

| Phase 3 の主張 | Phase 4 の修正 |
|---------------|---------------|
| CSSグローバル問題は解決済み | フレームワークで解決したが複雑さの代償を伴う。両立はされていない |
| DraftOleの競合は素のHTML | 素のHTMLにはCSSグローバル問題がある。DraftOleは両方の課題を同時に解く |
| 市場フィットが弱い | 「スコーピング × シンプルさ」の両立という明確なポジションがある |
| HTMX/Alpine がフレームワーク疲れの回答 | HTMX/Alpine はCSSスコーピングを解決していない |

---

## Phase 5: 動的Webアプリへの拡張可能性（2026-04-08）

### 3つの方向性の評価

| 方向 | 概要 | 実現性 | DraftOleの強み活用 | 推奨 |
|------|------|:---:|:---:|:---:|
| **A) HTMX統合** | DraftOleがサーバー側HTML生成器、HTMXが動的更新 | 高 | ✓ | **最優先** |
| B) Web Components | Shadow DOM内にDraftOle出力。CSSスコーピングがネイティブに解決 | 中 | ✓ | 将来 |
| C) 独自リアクティブ | 仮想DOM・状態管理を自前実装 | 低 | × | **非推奨（Reactの再発明）** |

### A) HTMX統合 — なぜ最も自然か

**HTMX開発者の現在の課題:**

```
HTMX → サーバーでHTMLを生成する必要がある
     → テンプレートエンジン（EJS, Pug, Jinja2等）を使う
     → テンプレートエンジンは型安全でない
     → CSSスコーピングもない
     → 結局CSSは手動管理
```

**DraftOle がここに入ると:**

```
HTMX + DraftOle
  → サーバーでHTMLを型安全に生成 ✓
  → CSSは自動スコープ ✓
  → フレームワーク不要 ✓
  → ビルドステップ不要（サーバー側TS） ✓
```

**思想の一致:** HTMXの「シンプルに戻ろう」とDraftOleの「シンプルさ × スコーピング」は完全に合致する。HTMXに欠けている「型安全なHTML生成」と「CSSスコーピング」をDraftOleが補完する。

### 利用イメージ

```typescript
// サーバー側（Express/Hono + DraftOle）
app.get('/todos', (req, res) => {
  const items = db.getTodos();
  const list = ul(
    ...items.map(item =>
      li({ 'hx-delete': `/todos/${item.id}` }, Text(item.text))
    )
  );
  res.send(list.render()); // HTMLフラグメントを返す
});
```

### テンプレートエンジンとの比較

| 観点 | テンプレートエンジン（EJS等） | DraftOle |
|------|:---:|:---:|
| 型安全 | × | ✓ |
| CSSスコーピング | × | ✓ |
| HTML/CSS/JS統合 | × | ✓ |
| 学習コスト | 低 | 中 |
| HTMX属性サポート | 手動記述 | 型安全に記述可能（将来） |

### ポジションの進化

```
現在:  「静的HTML/CSS/JSを型安全に生成するDSL」
       → ニッチ、用途が限定的

将来:  「HTMX と組み合わせる型安全なサーバーサイドHTML生成器」
       → HTMX エコシステムの一部として成長可能
```

**売り文句の進化:**

```
現在:  「素のHTMLのシンプルさで、Reactのスコーピングを」

将来:  「HTMX + DraftOle = Reactの機能性を、Reactの複雑さなしで」
```

### 実現までのロードマップ

```
Phase A: 基盤修正（現在）
  P0修正（DF-1, DF-2）
  LP再構築（静的ページの完成度証明）
    ↓
Phase B: サーバー統合
  Express/Hono統合（HTMLフラグメントを返すAPI）
  HTMX属性サポート（hx-get, hx-post, hx-swap等の型定義）
    ↓
Phase C: デモと検証
  HTMX + DraftOle デモアプリ（Todoアプリ等）
  「HTMX開発者向けの型安全HTML生成器」としてポジショニング
    ↓
Phase D: エコシステム参入
  HTMX コミュニティへの発信
  npm パッケージとしての公開
```

---

## Phase 6: DraftOleの本質 —「SwiftUIライクなサーバーサイドHTML DSL」（2026-04-08 / 2026-04-20精密化）

> **2026-04-20訂正**: 当初「Web版SwiftUI」と表現していたが、SwiftUIの本質はリアクティブな状態管理（`@State` / `@Binding` / `@Observable`）であり、宣言的構文はその表面でしかない。DraftOleはリアクティビティをHTMXに委譲する設計のため、正確には **「SwiftUIライクなDXを持つサーバーサイドHTML DSL」**。野心は残しつつ誇張を避ける。以下「Web版SwiftUI」表記はこの精密化された意味で読むこと。


### ネイティブアプリ開発との構造的対比

ネイティブアプリ開発（SwiftUI, Jetpack Compose, Flutter）の特徴:
- **1言語で完結** — UIも、スタイルも、動作も同じ言語で書く
- **HTML/CSS/JSの分離が存在しない**
- 型安全、宣言的、コンポーネントベース

```swift
// SwiftUI — Swift 1言語で全て
VStack(spacing: 16) {
    Text("Hello").font(.title).foregroundColor(.white)
    Button("Click") { count += 1 }
        .padding(16).background(Color.blue).cornerRadius(8)
}
```

```typescript
// DraftOle — TypeScript 1言語で全て
const card = div(
    h2(Text('Hello')),
    button(Text('Click'))
);
card.css.styleManager.style.spacing.setPadding('16px');
card.css.styleManager.style.backgroundColor.setBackgroundColor('#3b82f6');
card.jqm.click('handleClick');
```

### Web開発の現状は「3言語混在」

React/Vue/SvelteですらJSX内にHTMLの構文、CSS-in-JSやTailwindでCSSの概念、JSでロジックと、**本質的に3言語の知識を要求する**。DraftOleはTypeScriptの知識だけで完結する。

| アプローチ | 1言語完結 | Web対応 |
|-----------|:---:|:---:|
| SwiftUI | ✓ | × (iOS/macOSのみ) |
| Jetpack Compose | ✓ | × (Androidのみ) |
| Flutter | ✓ | △ (Web限定的) |
| React + JSX + CSS-in-JS | **×** (3言語混在) | ✓ |
| **DraftOle** | **✓** | **✓** |

**Web向けで「1言語完結」を実現しているのはDraftOleだけ。**

### プロジェクトの本質の再定義

| 以前の理解 | 修正後 |
|-----------|--------|
| HTML/CSS/JS生成ツール | **Webをネイティブアプリのように書くDSL** |
| 競合: テンプレートエンジン、SSG | **競合: React/Vue/Svelte（同じ問題を別の方法で解いている）** |
| ニッチな用途 | **Webの書き方そのものを変える野心** |
| 「型安全なHugo/Jekyll」 | **「Web版SwiftUI」** |

### SwiftUIとのDXギャップ（現状の課題）

「Web版SwiftUI」を名乗るには、SwiftUIに匹敵するDXが必要:

| SwiftUI | DraftOle（現状） | ギャップ |
|---------|-----------------|:---:|
| `.padding(24)` | `.css.styleManager.style.spacing.setPadding('24px')` | **大** |
| `@State var count = 0` | なし（リアクティビティなし） | 大 |
| `struct MyView: View` | なし（コンポーネント定義なし） | 大 |
| 宣言的構文 | 手続き的（`addChild`） | 中 |
| Xcode Preview | なし | 中 |

**DX改善（DF-5: CSSショートハンド）の重要度がP1→P0に上がる。** SwiftUIライクな体験が売りなら、APIの簡潔さは本質であり付加機能ではない。

### 目指すべきDX

```typescript
// 現在
card.css.styleManager.style.spacing.setPadding('24px');
card.css.styleManager.style.backgroundColor.setBackgroundColor('#3b82f6');
card.css.styleManager.style.border.setBorderRadius('8px');

// 目標（SwiftUIライク）
card.style.padding('24px').background('#3b82f6').cornerRadius('8px');
```

### Phase 1-5 で積み上げた議論との統合

```
Phase 1: 「意義が見えない」
  → 本質を「HTML生成ツール」と捉えていたから見えなかった

Phase 2: ドッグフーディングで詰まった
  → DXがSwiftUIレベルに達していないから

Phase 3: 「市場フィットが弱い」
  → 「ツール」として見ていた。「パラダイム」として見れば位置づけが変わる

Phase 4: 「スコーピング × シンプルさ」
  → SwiftUIが当たり前に持つ特性。正しい方向

Phase 5: HTMX統合
  → リアクティビティの欠如を補う現実的な道

Phase 6: 「Web版SwiftUI」
  → 全ての議論を貫く本質。DraftOleのビジョンそのもの
```

---

## Phase 7: 手続き的API vs 宣言的API（2026-04-08）

### 現状の認識

DraftOleの現在のAPIはSwiftUI的（宣言的）ではなく、**Swift/UIKit的（手続き的）**:

```typescript
// 現在のDraftOle（手続き的 = UIKit的）
const card = div();
const title = h2(Text('Hello'));
title.css.styleManager.style.font.setFontSize('24px');
title.css.styleManager.style.font.setFontWeight('700');
card.addChild(title);
card.css.styleManager.style.spacing.setPadding('24px');
```

```typescript
// 目標のDraftOle（宣言的 = SwiftUI的）
const card = div(
    h2(Text('Hello'))
        .fontSize('24px')
        .fontWeight('700'),
)
.padding('24px');
```

### 宣言的APIが圧倒的に好まれる理由

| 観点 | 手続き的（現在） | 宣言的（目標） |
|------|:---:|:---:|
| 行数（同じUI） | 12行 | 8行 |
| 構造の見通し | UIツリーとスタイルが分離。往復読み | 構造とスタイルが一体。上から下に読める |
| TS開発者の馴染み | △ | ✓（jQuery/D3のチェーンに近い） |
| SwiftUI/Compose開発者 | △ | ✓（ほぼ同じ体験） |

### 設計方針: 両方提供する（レイヤー構造）

SwiftUI自身も内部は手続き的。宣言的APIは手続き的基盤の上に構築されている。

```
Layer 1: 手続き的API（現在のDraftOle）← 基盤として維持。既存テスト不変
Layer 2: 宣言的API（SwiftUI的チェーン）← Layer 1 に委譲するだけ
```

```typescript
// Layer 2 の実装イメージ
class HtmlTag {
    // Layer 1（既存）
    css: CssManagerInstance;
    addChild(child: HtmlTag): this;

    // Layer 2（追加）— Layer 1 に委譲
    padding(v: string): this {
        this.css.styleManager.style.spacing.setPadding(v);
        return this;
    }
    background(v: string): this {
        this.css.styleManager.style.backgroundColor.setBackgroundColor(v);
        return this;
    }
    cornerRadius(v: string): this {
        this.css.styleManager.style.border.setBorderRadius(v);
        return this;
    }
}
```

### myTask.md 既存計画との関係

以下のタスクはすでに計画されていたが P4（将来）に分類されていた:

| タスクID | 内容 | 旧優先度 | 新優先度 |
|---------|------|:---:|:---:|
| D-3.1 | Fluent CSSメソッド（`.fontSize(24).color('#333')`） | P4 | **P0** |
| D-3.2 | レイアウトショートカット（`.flex({ direction: 'column' })`） | P4 | **P0** |
| D-1.2 | addChild戻り値変更（チェーン可能に） | P4 | **P0** |

**「Web版SwiftUI」ビジョンにおいて、宣言的APIはオプションではなく本質。P0に格上げ。**

---

## Phase 7b: 技術的課題の全体像（2026-04-08）

「Web版SwiftUI」をTypeScriptで実現するにあたり、HTMX統合も含めた技術的課題:

### 課題一覧

| # | 課題 | 影響度 | 解決策 | 着手時期 |
|---|------|:---:|--------|:---:|
| 1 | DSL構文（Swift @ViewBuilder 相当なし） | 中 | ファクトリ可変引数で近似（既に対応済み） | 済 |
| 2 | リアクティビティなし | **高** | HTMX統合で委譲。自前実装は非推奨 | Phase B |
| 3 | メソッドチェーンの型推論 | 低 | `this` 戻り値パターン（既存CSSクラスで実績あり） | DF-5 / D-3.1 |
| 4 | HTMX属性の型定義 | 低 | AttributeMap に hx-* 型追加 | Phase B |
| 5 | jQuery と HTMX の競合 | 中 | HTMX モード切替。jQuery出力を抑制 | Phase B |
| 6 | SSR パフォーマンス | 低 | 初期は無視。将来キャッシュ等で対応 | Phase D |

**技術的ブロッカーはない。** 最大の課題（リアクティビティ）はHTMX統合で回避可能。DX課題（メソッドチェーン）はTypeScript既存機能で解決可能。

> **2026-04-20訂正**: 当初「致命的なブロッカーはない」と総括していたが、これは**技術面のみ**の評価。**市場・実行面のリスク**（Hono JSXの先行、Node.js+TS+HTMX層の実規模不明、単独開発者の持続性）は未解消。Phase 9（撤退条件）で扱う。

### Phase 2 の失敗と本Phaseの楽観の乖離（2026-04-20追記）

Phase 2 のドッグフーディングで露呈した課題の一部は、Phase 6/7 のビジョンに直接影響する:

| Phase 2 の課題 | Phase 6/7 への影響 |
|---|---|
| DF-5: CSS APIが冗長（5段階チェーン） | D-3.1 未完では「SwiftUIライクDX」は**空手形** |
| DF-8: コンポーネントテンプレート/プリセット機能なし | SwiftUIの `struct MyView: View` 相当が不在のまま「Web版SwiftUI」を名乗るのは飛躍 |
| DF-1/2: スコープCSS未動作 | 「スコーピング × シンプルさ」ポジション（Phase 4）の**根幹が動いていない** |

Phase 6/7 は Phase 2 の事実を踏まえて修正されているべきだが、実際は **Phase 2 の損失を忘れて楽観に振れていた**。LP再構築（ゲートA: Phase 9）でこれらの課題が本当に解消されたかを検証するまで、ビジョンの成立は未確定とすべき。

---

## 総合判断（Phase 7 更新）

### ビジョン

**DraftOle = Web版SwiftUI**

SwiftUIがiOS開発を「1言語で宣言的に」変えたように、
DraftOleはWeb開発を「TypeScript 1言語で宣言的に」変える。

### DraftOleの技術的差別化

- ✅ **Web向けで唯一の「1言語完結」** — React/VueですらHTML+CSS+JSの3言語知識が必要
- ✅ 「HTML+CSS+JS三位一体」を型安全なTS DSLで実現 — 他にない
- ✅ フレームワーク不要、ゼロランタイム — 独自の立ち位置
- ✅ **CSSスコーピングとシンプルさの両立** — フレームワークもHTMX派も達成していない
- ✅ **HTMX統合による動的Webアプリへの拡張** — リアクティビティの補完

### DraftOleの課題

- ⚠️ **宣言的API（Layer 2）が未実装** — 手続き的APIのみ。SwiftUIを名乗れない
- ⚠️ P0課題（スコープCSS: DF-1, DF-2）が未修正 — ポジションの根幹が動いていない
- ❌ リアクティビティなし → HTMX統合で補完（致命的ブロッカーではない）
- ❌ コンポーネント定義なし → 将来課題
- ❌ エコシステムが存在しない → HTMXエコシステムへの参入が現実的な道

### 結論

**DraftOleは「Web版SwiftUI」というビジョンを持つ。開発を続ける価値がある。**
**致命的な技術的ブロッカーはない。**

1. **ビジョン**: Webをネイティブアプリのように、TypeScript 1言語で書く
2. **ポジション**: 1言語完結 × CSSスコーピング × シンプルさ（誰も占めていない）
3. **設計方針**: 手続き的API（Layer 1）の上に宣言的API（Layer 2）を積む
4. **成長路線**: 宣言的API → CSS修正 → 静的ページ完成 → HTMX統合 → 動的Webアプリ

### 次のアクション（優先度順）

1. **P0: D-3.1 Fluent CSSメソッド** — `.padding('24px').background('#3b82f6')` を実現。ビジョンの核心
2. **P0: D-1.2 addChild戻り値変更** — メソッドチェーンの基盤
3. **P0: DF-1, DF-2 CSS修正** — スコープCSSを動作させる
4. **宣言的APIでLP再構築** — SwiftUIライクなDXで書けるか検証
5. **HTMX属性の型定義 + デモ** — 動的Webアプリへの第一歩

---

## Phase 8: 市場評価（2026-04-08）

### 競合再分析（2026-04-20追記）— Phase 3 の見落とし補正

Phase 3 の競合表は「テンプレートエンジン / SSG / CSSライブラリ」に偏り、**同じ思想の既存プロダクトを見落としていた**。最優先ターゲット（HTMX+TS開発者）に対する真の競合は以下:

| 見落とされた競合 | 位置づけ | DraftOleとの比較 |
|---|---|---|
| **Hono JSX** | サーバーサイドTS向けJSX。HTMX統合デモ多数。GitHub 10k+ stars | **同じニッチで既に地歩**。Honoエコシステム（Router/Middleware）同梱で初期優位 |
| **Fresh (Deno)** | Island方式、JSXベース。サーバーHTML + 部分水和 | HTMX思想に近い。Denoランタイム前提が採用障壁 |
| **Enhance.dev** | Web Components + SSR。「HTMLファースト」 | 「シンプルさ × スコーピング」を**別アプローチ（Shadow DOM）**で実現 |
| **van.js** | 純粋JSの小さなリアクティブ（1KB） | 「1言語完結」の先行者。リアクティブも持つ |
| **lit-html + TS** | Lit。タグ付きテンプレート | 型安全HTML生成の成熟枠 |

**Phase 8 の「単独占有ポジション」主張は過大**。特に Hono JSX は本文書の最優先ターゲット層で既に実績を積んでいる。

**DraftOleが Hono JSX に対して主張すべき差別化:**
- JSXトランスパイル不要（純関数呼び出し）
- **CSSスコーピングを同じAPIで統合**（Hono JSX はCSS別途）
- Swiftからの思想的連続性（ネイティブ開発者向け訴求）

これらが「学習コスト増を上回る価値」として成立するかが、Phase 9 ゲートB/C の実質的な問い。

### ターゲットセグメント分析

#### A) HTMX + Node.js/TS 開発者 ★最優先

- **規模**: ~5万人（推定、※根拠薄い。下記訂正参照）
- **ペイン**: サーバーHTML生成が型安全でない、CSSスコーピングなし
- **DraftOleの刺さり度**: 高。ただし Hono JSX と直接競合
- **リーチ**: HTMXコミュニティ（GitHub 40k+ stars、npm週間15万DL）

> **2026-04-20訂正**: 「5万人」の根拠が示されていなかった。HTMX npm週間15万DLの主体は Python/Ruby/Go/PHP 層で、**Node.js+TS+HTMX の実層は1万人未満の可能性**。「十分な規模」判断は npm trends / GitHub topic等で再検証が必要。Phase 9 ゲートCで数値実態を測るべき。

#### B) ネイティブアプリ開発者がWebを書く時

- **規模**: ~50万人（iOS/Android開発者のうちWeb必要な層）
- **ペイン**: HTML/CSS/JSの3言語を覚えたくない。SwiftUI/Composeに慣れている
- **DraftOleの刺さり度**: 高。ほぼ同じ書き心地
- **リーチ**: 発見してもらうのが課題

#### C) TSバックエンドエンジニア → フロント

- **規模**: ~200万人（最大の市場）
- **ペイン**: React/Vueの学習コスト、ビルド設定の面倒さ
- **DraftOleの刺さり度**: 高。TSの知識だけでOK、ゼロ設定
- **リーチ**: 「管理画面はReact + shadcn/uiで十分」との競合

#### D) フレームワーク疲れ層

- **規模**: ~100万人
- **ペイン**: node_modules肥大、設定地獄、毎年の技術刷新疲れ
- **DraftOleの刺さり度**: 中。共感は得やすいが「新しいDSLを学ぶ」に抵抗感
- **リーチ**: 思想的な発信が有効

### 潜在ユーザー見積もり

```
重複を除いた潜在ユーザー:     ~100-200万人
うち実際にDraftOleを試す:     ~0.1-1%
初年度現実的ユーザー数:       1,000-20,000人
```

ニッチだが、開発者ツールとしては十分な規模。Vanilla Extract（GitHub 10k stars）、Panda CSS（5k stars）と同程度のニッチで成立している。

### ポジショニングマトリクス

```
                    シンプルさ（低い学習コスト）
                         ↑
                         |
         DraftOle ●      |      ● HTMX + テンプレート
                         |
         素のHTML ●       |
                         |
  ─────────────────────────────────── → CSSスコーピング（型安全）
                         |
         Alpine.js ●     |      ● Tailwind + JSX
                         |
                         |      ● React + CSS Modules
                         |
                 複雑さ（高い学習コスト）
```

**DraftOleは「シンプルさ × スコーピング」の象限を単独で占有。**

### 強み

| 強み | 根拠 |
|------|------|
| 明確な差別化 | 「1言語完結 × スコーピング × ゼロ設定」は他にない |
| 市場タイミング | HTMX成長中、フレームワーク疲れ顕在化 |
| 成長路線 | 静的 → HTMX統合 → 動的Webアプリと段階的に拡張可能 |
| 技術的ブロッカーなし | TypeScript既存機能で宣言的API実現可能 |

### リスク

| リスク | 深刻度 | 対策 |
|--------|:---:|------|
| 「解決策を探していない」層が多い | 高 | HTMXコミュニティなど既存の不満層にリーチ |
| 単独開発者の持続性 | 高 | スコープを絞る。まず静的 + HTMX |
| エコシステムの欠如 | 中 | HTMXエコシステムへの参入 |
| 「Reactでよくない？」 | 高 | ターゲットを「Reactを使わない層」に明確に絞る |

### 総合評価

| 評価軸 | 判定 |
|--------|------|
| 差別化 | **◎** 明確。他にないポジション |
| 市場タイミング | **○** HTMX成長、FW疲れの追い風 |
| 市場規模 | **△** ニッチ。ただしdev toolsとしては十分 |
| 実現可能性 | **○** 致命的ブロッカーなし |
| 競合リスク | **○** React/Vueとは直接競合しない |
| 持続性リスク | **△** 単独開発者。スコープ管理が重要 |

### 市場戦略

**最優先ターゲット: HTMX + Node.js/TS 開発者。**
この層は小さいが、ペインが明確で、DraftOleの全特性が刺さる。
ここで実績を作り、他セグメント（B, C, D）に広げる。

---

## Phase 9: 撤退条件とゲート設計（2026-04-20追加）

文書全体は「続ける判断軸」（Phase 1）を持つが、**続けた後の判断ゲート**が欠けていた。単独開発で無限に続けないため、以下のゲートを設置する。

### ゲートA: ビジョン検証ゲート（宣言的API + LP再構築後）

**測定**: Discovery文書Phase 2で詰まったLP構築を、D-3.1/D-3.2/D-1.2 完了後に再挑戦。

**合格条件**:
- 自分自身が「気持ちよく書ける」と感じる
- Phase 2 で必要だった回避策（DF-1〜DF-8系の再発）が不要
- SwiftUIとの DX ギャップ（Phase 6）が「受容可能」レベルに縮小

**不合格時のアクション**:
- ビジョン「SwiftUIライクHTML DSL」を撤回
- ニッチ用途特化（メールHTML / レポート生成）にピボット
- または **アーカイブ化**（Phase 1の「やめる理由」に戻る）

### ゲートB: 市場反応ゲート（HTMXデモ公開後3ヶ月）

**測定**: npm公開 + HTMXコミュニティ発信 + Todoデモ後3ヶ月。

**合格条件（いずれか）**:
- GitHub 100 stars 以上
- npm週間DL 100 以上
- HTMXコミュニティから言及を3件以上獲得

**不合格時のアクション**:
- 発信方法の見直し（BuildInPublic継続 / 技術記事強化）
- または Hono JSX 等への吸収合併の模索（OSSとして共存）

### ゲートC: 持続性ゲート（初年度実ユーザー数）

**測定**: 初年度の実ユーザー数（npm DL / GitHub discussion / issue）。

**合格条件**: Phase 8推定の10%以上（100人以上）

**不合格時のアクション**:
- 開発を「趣味・学習」モードに切り替え（商用化ビジョン撤回）
- または アーカイブ化して他プロジェクトに注力

### ゲート設計の意図

市場面のリスク（Phase 7b訂正）を無視して開発を続けるのは、単独開発者にとって最大の損失源。**撤退条件を事前に決めておく**ことで、サンクコスト効果に引きずられず合理的な判断を維持できる。

---

## 最終結論

**DraftOleは「Web版SwiftUI」として市場で戦える。**

### 全Phaseの議論を通じた到達点

```
Phase 1: 「意義が見えない」
Phase 2: ドッグフーディングで課題発見
Phase 3: 「市場フィットが弱い」
Phase 4: 「スコーピング × シンプルさ」のポジション発見
Phase 5: HTMX統合で動的Webアプリへ拡張可能
Phase 6: 本質は「Web版SwiftUI」— 1言語完結
Phase 7: 宣言的APIでSwiftUI的DXを実現可能（技術的ブロッカーなし）
Phase 8: 市場で戦える。最優先ターゲットはHTMX開発者
Phase 9: 撤退条件（ゲートA/B/C）を事前設計し、サンクコスト回避（2026-04-20追加）
```

### ビジョン

> **DraftOle = Web版SwiftUI**
> TypeScript 1言語で、Webをネイティブアプリのように書く。
> CSSスコーピングとシンプルさを両立する、唯一のポジション。

### ロードマップ

```
今ここ → 宣言的API(D-3.1) + CSS修正(DF-1,2)
           ↓
         LP再構築（SwiftUIライクDXの検証）
           ↓
         HTMX統合 + デモアプリ
           ↓
         npm公開 + HTMXコミュニティ発信
           ↓
         ユーザーフィードバック → 改善サイクル
```

### 続けない場合

2371テスト全パス・カバレッジ99%のTypeScriptライブラリを設計・実装した経験自体が大きな資産。DSL設計、型安全なAPI設計、TDDの実践知見は他のプロジェクトに活きる。
