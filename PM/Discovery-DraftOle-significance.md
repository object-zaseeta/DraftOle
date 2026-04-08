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
| **DraftOle（P0修正後）** | **✓** | **✓** |

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

## Phase 6: DraftOleの本質 —「Web版SwiftUI」（2026-04-08）

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

## 総合判断（Phase 6 更新）

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

- ⚠️ **DXがSwiftUIレベルに達していない** — 5段階ドットチェーンは致命的。DF-5をP0に格上げ
- ⚠️ P0課題（スコープCSS）が未修正 — ポジションの根幹が動いていない
- ❌ リアクティビティなし → HTMX統合で補完
- ❌ コンポーネント定義なし → 将来課題
- ❌ エコシステムが存在しない → HTMXエコシステムへの参入が現実的な道

### 結論

**DraftOleは「Web版SwiftUI」というビジョンを持つ。開発を続ける価値がある。**

1. **ビジョン**: Webをネイティブアプリのように、TypeScript 1言語で書く
2. **ポジション**: 1言語完結 × CSSスコーピング × シンプルさ（誰も占めていない）
3. **成長路線**: DX改善 → 静的ページ完成 → HTMX統合 → 動的Webアプリ
4. **前提条件**: P0修正（CSS再帰 + スコープCSS + DXショートハンド）

### 次のアクション（優先度順）

1. **P0: DF-5 DXショートハンド** — `card.style.padding('24px')` レベルのAPIを実現。ビジョンの根幹
2. **P0: DF-1, DF-2 CSS修正** — スコープCSSを動作させる
3. **回避策なしでLP再構築** — SwiftUIライクなDXで書けるか検証
4. **HTMX属性の型定義** — 動的Webアプリへの第一歩
5. **HTMX + DraftOle デモ** — 「Web版SwiftUI」のビジョンを実証

### 続けない場合

2371テスト全パス・カバレッジ99%のTypeScriptライブラリを設計・実装した経験自体が大きな資産。DSL設計、型安全なAPI設計、TDDの実践知見は他のプロジェクトに活きる。
