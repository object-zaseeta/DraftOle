# Product Overview

TypeScriptでHTML/CSS/JavaScriptを一括生成するDSL（Domain Specific Language）ライブラリ

## Core Capabilities

- **HTMLタグ生成**: TypeScriptコードから型安全にHTML構造を構築
- **スコープドCSS**: グローバル汚染しないコンポーネント単位のCSS生成
- **JavaScript連携**: jQueryスタイルのイベント・操作記述
- **ゼロランタイム**: ビルド時にすべてを静的生成

## Target Use Cases

- SSG（静的サイトジェネレーター）のレイヤーとして
- サーバーサイドHTML生成（Node.js）
- プログラマティックなWebページ構築
- マイクロフロントエンド間の隔離されたコンポーネント

## Value Proposition

- **型安全**: コンパイル時にHTML構造エラーを検出
- **単一言語**: HTML・CSS・JSをTypeScript一つで記述
- **真のスコープ隔離**: Tailwindと違い、原理的にグローバル汚染が起きない
- **ゼロランタイム**: styled-componentsと違い、実行時オーバーヘッドなし

## Origin

Swift版DraftOleからの移植プロジェクト。
Swift版: `/Users/shimizukazuyuki/BitTorrentSync/ActiveProject/Draft_Project/DraftOleProject/TestProject/DraftOle_0.2/`

---
_Focus on patterns and purpose, not exhaustive feature lists_
