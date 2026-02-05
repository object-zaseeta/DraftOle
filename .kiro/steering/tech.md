# Technology Stack

## Architecture

Interface-oriented design with composite pattern for HTML tree structure.
Swift版のProtocol-oriented designをTypeScriptのInterface/Classに移植。

## Core Technologies

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18+
- **Build**: tsup (esbuildベース)
- **Package Manager**: npm

## Key Libraries

- **Production**: なし（依存ゼロを目指す）
- **Development**: tsup, vitest, eslint, prettier, typedoc

## Development Standards

### Type Safety
- strict mode 必須
- any 禁止（eslint rule）
- 明示的な型定義

### Code Quality
- 各タグは HTMLTagProtocol インターフェースに準拠
- CssManager/JQueryManagerによる責務分離

### Testing
- Vitest（Jest互換、高速）
- Swift版から重要テストを移植
- カバレッジ80%以上目標

## Development Environment

### Required Tools
- Node.js 18+ (LTS)
- npm 9+

### Common Commands
```bash
# Install: npm install
# Build: npm run build
# Test: npm run test
# Lint: npm run lint
# Format: npm run format
```

## Key Technical Decisions

| 決定事項 | 選択 | 理由 |
|---------|------|------|
| タグ構造 | Interface + Class | Swift Protocol階層の直接的なマッピング |
| ビルド | tsup | esbuildベースで高速、設定シンプル |
| テスト | Vitest | TypeScript native、Jest互換 |
| 出力 | ESM + CJS | 幅広い互換性 |

## Output Format

- ESM (ES Modules) - メイン
- CJS (CommonJS) - レガシー互換
- 型定義 (.d.ts) - TypeScript利用者向け

---
_Document standards and patterns, not every dependency_
