# Migration Guide: Legacy Low-Level API → 主導線 (`1.0.0`)

> 対象: `draft-ole` を `0.x.y` から `1.0.0` 以上へ更新する利用者
> 関連 spec: `legacy-low-level-api-removal` / 前段 spec: `legacy-low-level-api-deprecation`
> 関連 docs: [docs/deprecation-policy.md](../deprecation-policy.md) / [docs/positioning.md](../positioning.md)

---

## 1. 概要

`1.0.0` で **legacy low-level API の公開面** が除去されました。`0.2.x` 系で `@deprecated` JSDoc により IDE 上で strikethrough 表示されていたシンボルが、`'draft-ole'` パッケージから import できなくなります。

### 除去対象（公開 named export）

| シンボル | 主導線 / 代替 | After example |
|---------|--------------|---------------|
| `createTheme` | `css.theme` | [after-create-theme.ts](../../examples/migration/after-1-0-0/after-create-theme.ts) |
| `createStyle` | `css.class` | [after-create-style.ts](../../examples/migration/after-1-0-0/after-create-style.ts) |
| `tag` / `all` / `rule` / `root` | `css.raw` / `sel.{tag,all,rule,root}` | [after-tag-all-rule-root.ts](../../examples/migration/after-1-0-0/after-tag-all-rule-root.ts) |
| `AppContext`（型） | `AppDocument`（型） | [after-app-context.ts](../../examples/migration/after-1-0-0/after-app-context.ts) |
| per-tag shortcuts (`tagA` / `tagDiv` / ... 112 個) | `css.class` + View プリミティブ or `sel.tag*` | [after-per-tag-shortcuts.ts](../../examples/migration/after-1-0-0/after-per-tag-shortcuts.ts) |

### 重要: 私有実装としての存続

**元の関数・型は完全には消えていません**。`1.0.0` で除去されたのは **公開 API 面の named export のみ** で、実装本体は `src/css/variables/` / `src/app/app.ts` 配下に **私有実装** として継続使用されます。これは kept policy の以下 API が legacy 実装に依存しているためです:

- `css.theme` / `css.class` / `css.media` / `css.keyframes` — `css.*` namespace は legacy 元実装の薄いエイリアス
- `sel.{root, all, tag, rule, media, keyframes, tagA, ...tagWbr}` — `sel` namespace は legacy 元定義をそのまま expose

**完全な物理削除は将来の Phase 2 spec で別途検討**されます。

---

## 2. 削除シンボルと代替経路

### 2.1 `createTheme` → `css.theme`

`css.theme` は `createTheme` の薄いエイリアスです。入出力は等価です。

**Before**:
```typescript
import { createTheme } from 'draft-ole';
const theme = createTheme({ bg: '#0b1220', accent: '#7c5cff' });
theme.bg     // → 'var(--bg)'
theme.css    // → ':root { --bg: ...; --accent: ...; }'
```

**After**:
```typescript
import { css } from 'draft-ole';
const theme = css.theme({ bg: '#0b1220', accent: '#7c5cff' });
theme.bg     // → 'var(--bg)' （同じ）
theme.css    // → ':root { ... }' （同じ）
```

実コード: [examples/migration/after-1-0-0/after-create-theme.ts](../../examples/migration/after-1-0-0/after-create-theme.ts)

### 2.2 `createStyle` → `css.class`

`css.class` は `createStyle` の薄いエイリアスです（名前あり形・名前なし形ともサポート）。

**Before**:
```typescript
import { createStyle } from 'draft-ole';
const card = createStyle('card', { padding: '20px', background: '#fff' });
const button = createStyle({ padding: '12px 24px', borderRadius: '6px' });
```

**After**:
```typescript
import { css } from 'draft-ole';
const card = css.class('card', { padding: '20px', background: '#fff' });
const button = css.class({ padding: '12px 24px', borderRadius: '6px' });
```

実コード: [examples/migration/after-1-0-0/after-create-style.ts](../../examples/migration/after-1-0-0/after-create-style.ts)

### 2.3 `tag` / `all` / `rule` / `root` → `css.raw` or `sel.*`

2 つの移行経路があります:

#### 経路 A: `css.raw`（生 CSS escape hatch、推奨方針外）

```typescript
import { css } from 'draft-ole';
const reset = css.raw('* { box-sizing: border-box; }');
```

`css.raw` は生 CSS 文字列を `GlobalCss` ブランド型にラップする最終手段です。サニタイズ・検証は行われないため、入力の安全性は呼び出し側責任です。

#### 経路 B: `sel.*` namespace（kept policy）

`sel` namespace は `0.x.y` から継続して提供される kept API です（policy 上 sel namespace 自体は kept、個別関数は内部的に `@internal`）。

**Before**:
```typescript
import { tag, all, rule, root } from 'draft-ole';
const reset = all({ boxSizing: 'border-box' });
const headings = tag('h1', { fontSize: '2rem' });
const focus = rule('.btn:focus', { outline: '2px solid blue' });
const tokens = root({ '--bg': '#000' });
```

**After**:
```typescript
import { sel } from 'draft-ole';
const reset = sel.all({ boxSizing: 'border-box' });
const headings = sel.tag('h1', { fontSize: '2rem' });
const focus = sel.rule('.btn:focus', { outline: '2px solid blue' });
const tokens = sel.root({ '--bg': '#000' });
```

実コード: [examples/migration/after-1-0-0/after-tag-all-rule-root.ts](../../examples/migration/after-1-0-0/after-tag-all-rule-root.ts)

### 2.4 `AppContext` → `AppDocument`

`AppDocument` は `app()` ファクトリの戻り値型で、`AppContext` の構造的サブタイプです。`state<T>()` メソッドは同じシグネチャです。

**Before**:
```typescript
import { app } from 'draft-ole';
import type { AppContext } from 'draft-ole';
const ctx: AppContext = app();
const counter = ctx.state(0);
```

**After**:
```typescript
import { app, AppDocument } from 'draft-ole';
// 型注釈なし（推奨）
const ctx = app();
const counter = ctx.state(0);

// 明示型注釈する場合: AppDocument を使う
const explicitCtx: AppDocument = app();
```

実コード: [examples/migration/after-1-0-0/after-app-context.ts](../../examples/migration/after-1-0-0/after-app-context.ts)

### 2.5 per-tag shortcuts (`tagA` / `tagDiv` / ... 112 個)

2 つの移行経路があります:

#### 経路 A: `css.class` + View プリミティブ（主導線推奨）

```typescript
import { css } from 'draft-ole';
const linkStyle = css.class({ color: '#0066cc', textDecoration: 'none' });
// View プリミティブの css プロパティで要素にスコープ
```

#### 経路 B: `sel.tagA` / `sel.tagDiv` 等（kept policy、namespace 経由）

```typescript
import { sel } from 'draft-ole';
const divBlock = sel.tagDiv({ padding: '16px' });
const linkBlock = sel.tagA({ color: '#0066cc', textDecoration: 'none' });
```

実コード: [examples/migration/after-1-0-0/after-per-tag-shortcuts.ts](../../examples/migration/after-1-0-0/after-per-tag-shortcuts.ts)

### 2.6 `media` / `keyframes`（at-rule）— **除去対象外**

`media` / `keyframes` at-rule は **policy で kept** であり、`1.0.0` でも `'draft-ole'` から直接 import 可能です。利用者向け推奨経路は `css.media` / `css.keyframes` / `sel.media` / `sel.keyframes` ですが、`import { media, keyframes } from 'draft-ole'` は引き続き動作します。

---

## 3. Escape hatch 最終リスト（1.0.0 公開面）

`1.0.0` で公開面に残る「過渡期 facade / escape hatch」は以下のみ:

| カテゴリ | API | 用途 |
|---------|-----|------|
| 主導線 | `page` / `app` | static-page / interactive app のエントリ |
| 主導線 facade | `css.theme` / `css.class` / `css.raw` / `css.reset` / `css.media` / `css.keyframes` | CSS 関連 API |
| Namespace（kept） | `sel.*` | グローバル CSS DSL の集約 namespace（`sel.root` / `sel.all` / `sel.tag` / `sel.rule` / `sel.media` / `sel.keyframes` / `sel.tagA` 〜 `sel.tagWbr`） |
| At-rule | `media` / `keyframes` | `'draft-ole'` から直接 import 可能（policy kept） |
| View プリミティブ | `Page` / `Section` / `VStack` / `HStack` / `Text` / `Button` / `Heading` 等 | View ツリー構築 |
| 型 | `GlobalCss` / `Theme` / `SharedStyle` / `UnifiedTheme` 等 | 型注釈用 |

### 公開面から除去された facade

- **`Root` クラス** — 公開 entry には元々再エクスポートされていなかったが、`1.0.0` で「公開面に出さない」状態を不変条件として固定。主導線 `page()` / `app()` の内部実装としては存続。物理削除は Phase 2 spec として検討。
- **legacy low-level API の named export** — `tag` / `all` / `rule` / `root` / `createTheme` / `createStyle` / `AppContext` / per-tag shortcuts 112 個（本 migration guide §2 参照）

---

## 4. 移行チェックリスト

利用者は自プロジェクトで以下を確認してください:

- [ ] `import { tag, all, rule, root } from 'draft-ole'` → 該当箇所を `css.raw` または `sel.{tag, all, rule, root}` に置換
- [ ] `import { createTheme } from 'draft-ole'` → `css.theme` に置換
- [ ] `import { createStyle } from 'draft-ole'` → `css.class` に置換
- [ ] `import type { AppContext } from 'draft-ole'` / `'draft-ole/app'` → `import { AppDocument } from 'draft-ole'` に置換（または型注釈を削除）
- [ ] `import { tagA, tagDiv, ... } from 'draft-ole'`（per-tag shortcuts） → `css.class` + View プリミティブ、または `sel.tagA` / `sel.tagDiv` に置換
- [ ] `import { Root } from 'draft-ole'` → 該当 import を削除し、`page()` / `app()` 経由に書き換え
- [ ] `package.json` の `draft-ole` 依存を `^1.0.0` に更新
- [ ] `pnpm typecheck` で残存 import エラーがないことを確認
- [ ] `pnpm test` でアプリケーションテストが緑であることを確認

`media` / `keyframes` は `0.x.y` と同じ呼び出し方で継続使用可能です（推奨経路は `css.media` / `css.keyframes` / `sel.media` / `sel.keyframes`）。
