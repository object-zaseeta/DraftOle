# DraftOle

TypeScriptでHTML/CSS/JavaScriptを一括生成するDSL（Domain Specific Language）ライブラリ。

Swift版 [DraftOle](https://github.com/object-zaseeta/DraftOle) からの移植プロジェクトです。

## 特徴

- **型安全なHTML生成** - TypeScriptコードから型安全にHTML構造を構築
- **スコープドCSS** - グローバル汚染しないコンポーネント単位のCSS生成
- **JavaScript連携** - jQueryスタイルのイベント・操作記述
- **ゼロランタイム** - ビルド時にすべてを静的生成
- **依存ゼロ** - プロダクション依存なし

## 使用例

```typescript
import { div, p, span } from 'draft-ole';

// HTML生成
const html = div({ class: 'container' },
  p('Hello, World!'),
  span('DraftOle')
).render();
// => '<div class="container"><p>Hello, World!</p><span>DraftOle</span></div>'

// スコープドCSS
const button = div().css.backgroundColor('blue').css.padding('10px');
button.renderCss();
// => '._hash123 { background-color: blue; padding: 10px; }'
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

## セットアップ

```bash
npm install
npm run build
npm run test
```

## ライセンス

MIT
