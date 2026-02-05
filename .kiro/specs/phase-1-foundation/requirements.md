# Requirements: Phase 1 - 基盤構築

## 概要

TypeScriptプロジェクトの初期設定とコアインターフェースの実装。
ビルド・テスト・Lintが動作する状態を構築する。

## 機能要件

### FR-1: プロジェクト初期化
- [ ] npm package として初期化
- [ ] package.json に必要なメタデータを設定
- [ ] .gitignore を作成

### FR-2: TypeScript設定
- [ ] tsconfig.json を作成
- [ ] strict mode を有効化
- [ ] ES2022 をターゲットに設定
- [ ] 型定義ファイル (.d.ts) を出力

### FR-3: 開発ツール設定
- [ ] ESLint + TypeScript parser を設定
- [ ] Prettier を設定
- [ ] ESLint と Prettier の競合を解決

### FR-4: テストフレームワーク
- [ ] Vitest を設定
- [ ] TypeScript テストが動作すること
- [ ] カバレッジレポートを生成可能にする

### FR-5: ビルドツール
- [ ] tsup を設定
- [ ] ESM + CJS 両方を出力
- [ ] 型定義ファイルを出力

### FR-6: ディレクトリ構造
- [ ] src/ 以下に基本構造を作成
- [ ] tests/ ディレクトリを作成

### FR-7: コアインターフェース
- [ ] Renderable interface を実装
- [ ] Exportable interface を実装
- [ ] UnitStyle type と hlUnit() を実装

## 非機能要件

### NFR-1: 依存関係
- 本番依存 (dependencies): 0個
- 開発依存のみ (devDependencies)

### NFR-2: 互換性
- Node.js 18+ をサポート
- ESM と CJS 両方をサポート

## 受け入れ条件

- [ ] `npm run build` が成功する
- [ ] `npm run test` が成功する（空テストでもOK）
- [ ] `npm run lint` が成功する
- [ ] Renderable.render() が文字列を返す
