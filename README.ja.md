# DraftOle

HTML・CSS・JavaScript を TypeScript だけで**宣言的に**記述できるライブラリ。ひとつのソースから型安全に書き、静的ファイルへコンパイルします。

## 特徴

- **型安全なHTML生成** - TypeScriptコードから型安全にHTML構造を構築
- **スコープドCSS** - グローバル汚染しないコンポーネント単位のCSS生成
- **JavaScript連携** - jQueryスタイルのイベント・操作記述
- **ゼロランタイム** - ビルド時にすべてを静的生成
- **依存ゼロ** - プロダクション依存なし

## スクリーンショット

![MVP Demo の出力](docs/images/mvp-demo.png)

[`examples/mvp-demo.ts`](examples/mvp-demo.ts) から生成 — `pnpm build && pnpm demo:mvp` で再現できます。

## インストール

> ⚠️ まだ npm に公開していません。現時点ではソースから導入してください:

```bash
git clone https://github.com/object-zaseeta/DraftOle.git
cd DraftOle
pnpm install
pnpm build
```

自分のプロジェクトからリンクする場合:

```bash
# 自分のプロジェクト側で
pnpm link --global <DraftOleへのパス>
```

## クイックスタート

**1. スクリプトを作成**(例: `build-site.ts`):

```typescript
import { Root, html, head, body, div, h1, p, createStyle, FileExporter } from 'draft-ole';

// スコープドCSS（クラス名は自動ハッシュ化、グローバル汚染なし）
const card = createStyle('card', {
  padding: '16px',
  borderRadius: '12px',
  background: '#f5f5f5',
});

const root = new Root();
root.addGlobalCss(card.css);
root.addChild(
  html({ lang: 'ja' },
    head(),
    body(
      div({ class: card.className },
        h1('Hello, DraftOle!').color('#333'),
        p('TypeScript から生成された静的サイト').margin('8px 0 0'),
      ),
    ),
  ),
);

new FileExporter().export(
  root.render(),
  root.collectCssStyleString(),
  '',                 // JS（任意）
  './dist',
);
```

**2. 実行:**

```bash
node --experimental-strip-types build-site.ts
```

**3. 出力を確認:**

```
dist/
├── index.html
├── style.css
└── script.js
```

`dist/index.html` をブラウザで開けば完成。

## コアコンセプト

| 概念 | 説明 |
|---|---|
| **`Root`** | ドキュメント全体のコンテナ。グローバル CSS・子要素・最終出力を統括。 |
| **タグファクトリ**(`div`, `h1`, `p`, ...) | HTML 要素を構築。`(attrs?, ...children)` を受け取りチェイン可能な `HtmlTag` を返す。 |
| **fluent スタイル API** | `.color()`, `.margin()`, `.padding()`, `.background()`（shorthand）, `.backgroundColor()` などでノード単位の scoped CSS を適用。 |
| **`createStyle(name, props)`** | 再利用可能な scoped CSS クラスを定義。`.className` で `class` 属性に、`.css` で CSS 出力。 |
| **`createTheme(vars)`** | CSS カスタムプロパティを定義。`theme.foo` で参照、`theme.css` で出力。 |
| **`FileExporter`** | `index.html` / `style.css` / `script.js` をディレクトリに書き出し。 |

## サンプル

[`examples/`](examples/) ディレクトリ参照:

- [`mvp-demo.ts`](examples/mvp-demo.ts) — Todo アプリ一式(テーマ・scoped スタイル・埋込 JS)
- [`react-demo.tsx`](examples/react-demo.tsx) — React 連携パターン

## スクリプト

```bash
pnpm build       # dist/ にコンパイル (ESM + CJS + .d.ts)
pnpm test        # Vitest テスト実行
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm demo:mvp    # MVP デモ実行 → output/mvp_demo/
```

## ユースケース

- SSG（静的サイトジェネレーター）のレイヤーとして
- サーバーサイドHTML生成（Node.js）
- プログラマティックなWebページ構築
- マイクロフロントエンド間の隔離されたコンポーネント

## 技術スタック

| 項目 | 選択 |
|------|------|
| 言語 | TypeScript 5.x (strict mode) |
| ランタイム | Node.js 18+ |
| ビルド | tsup (esbuildベース) |
| テスト | Vitest |
| 出力形式 | ESM + CJS + .d.ts |

## ライセンス

MIT
