# DraftOle

静的ページのための TypeScript 製 View DSL。LP・ドキュメント・記事・レポートを 1 本の型安全な TypeScript プログラムとして記述する。`page first, App later` を方針とする。

> **現在のフェーズ:** DraftOle は *static page first* の View DSL です。`page()` と最小の View プリミティブ（`Page` / `Section` / `VStack` / `HStack` / `Text` ほか）でページを組み、HTML / CSS を生成します。インタラクティブなランタイム（`App`）は今フェーズでは意図的に二次的に位置づけています。詳しくは [docs/positioning.md](docs/positioning.md) を参照してください。

## 特徴

- **page-first な View DSL** — `page()` + `Page` / `Section` / `VStack` / `HStack` / `Text` で静的ページを直接表現
- **modifier 主導のスタイリング** — `.padding()` / `.background()` / `.foregroundStyle()` / `.font()` / `.frame()` / `.cornerRadius()` を View ノード単位で適用
- **型安全な HTML 生成** — TypeScript ソースから出力まで完全に型チェック
- **既定でゼロランタイム** — `page()` は素の HTML / CSS のみを書き出し、`runtime.js` を生成しない
- **プロダクション依存ゼロ**

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

**1. スクリプトを作成**(例: `build-page.ts`):

```typescript
import { page, Page, Section, VStack, Text } from 'draft-ole';

const hero = Section(
  VStack({ spacing: 16 },
    Text('Hello, DraftOle!')
      .font({ size: '2rem', weight: '700' })
      .foregroundStyle('#1a1a2e'),
    Text('静的ページのための View DSL.')
      .font({ size: '1.125rem' })
      .foregroundStyle('#4a4a6a'),
  )
    .padding(48)
    .frame({ maxWidth: 720 }),
)
  .background('#f8f9ff');

const doc = page(
  Page(hero),
  {
    lang: 'ja',
    title: 'Hello, DraftOle',
  },
);

console.log(doc.render());
```

**2. 実行:**

```bash
node --experimental-strip-types build-page.ts
```

これで完全な静的 HTML ドキュメントが標準出力されます。`index.html` / `style.css` をディレクトリに書き出すには `doc.export('./dist')` を使ってください。

より長い動作例は [`examples/page-minimal.ts`](examples/page-minimal.ts)（hero + features 構成）と [`examples/page-landing.ts`](examples/page-landing.ts)（複数セクション LP）を参照してください。

## コアコンセプト

| 概念 | 説明 |
|---|---|
| **`page(view, meta?)`** | 入口。`Page` View にドキュメントメタ情報（lang / title / charset / viewport / description）を付与し、`PageDocument` を返す。 |
| **`Page`, `Section`** | ページ構造の上位 View。`Page` はルート View、`Section` は意味のあるブロック。 |
| **`VStack`, `HStack`** | 縦方向 / 横方向のレイアウト View。`spacing` オプションあり。 |
| **`Text`** | テキスト View。文字コンテンツのリーフプリミティブ。 |
| **modifier** | `.padding()` / `.background()` / `.foregroundStyle()` / `.font({ size, weight, ... })` / `.frame({ maxWidth, ... })` / `.cornerRadius()` — View ノード単位の scoped スタイリング。 |
| **`PageDocument`** | `page()` の戻り値。`.render()` で HTML 文字列を取得、`.export(dir)` で `index.html` / `style.css` を書き出す。 |

## サンプル

[`examples/`](examples/) に整理済みの読み順を用意しています。推奨の読み順:

1. [`examples/page-minimal.ts`](examples/page-minimal.ts) — `page()` の最小例
2. [`examples/page-landing.ts`](examples/page-landing.ts) — View modifier だけで組む複数セクション LP
3. `examples/showcase-card.ts` / `showcase-button.ts` / `showcase-list.ts` — レイアウト / modifier ショーケース
4. [`examples/interactive/mvp-demo.ts`](examples/interactive/mvp-demo.ts) — *advanced / interactive* な発展例（埋め込み JS の Todo アプリ）

完全な読み順は [`examples/README.md`](examples/README.md) に記載しています。

## スクリプト

```bash
pnpm build       # dist/ にコンパイル (ESM + CJS + .d.ts)
pnpm test        # Vitest テスト実行
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm demo:mvp    # MVP デモ実行 → .out/runs/mvp_demo/
```

## 想定ユースケース（現フェーズ）

`page first` は **静的ページ** を想定しています:

- ランディングページ（LP）
- ドキュメントページ
- 記事・長文レポート
- 静的なダッシュボード / ステータスページ

インタラクティブなランタイム（`App`、jQuery 風スクリプト、埋め込み JS）は引き続き利用可能ですが、本フェーズの主導線ではありません。主対象と現在の non-goals は [docs/positioning.md](docs/positioning.md) を参照してください。

## Advanced / 互換目的

旧来の `Root` + `html/body/div` + `FileExporter` API は後方互換および高度な利用のために残されていますが、新規利用の出発点としては推奨されません。新しいコードは `page()` から始めてください。該当パスは `examples/interactive/mvp-demo.ts` および `src/html/` 配下を参照してください。

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
