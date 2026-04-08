# Development Workflow

## Task Completion Flow

タスク完了時の標準ワークフロー。コード品質を維持しながら、クリーンなコードベースを保つ。

```
Task完了 → Commit → Lint → Test → Commit（修正あれば）
```

### Step 1: Task完了とCommit

タスクが完了したら、`/buildInPublic:Commit` スキルを使用してコミットする。

```
/buildInPublic:Commit
```

### Step 2: ESLint実行

コード品質チェックを実行する。

```bash
pnpm lint
```

**検出対象**:
- 未使用の変数・import
- 型エラー
- コードスタイル違反
- 潜在的なバグパターン

### Step 3: Test実行

ユニットテストを実行して問題がないことを確認する。

```bash
pnpm test
```

**確認項目**:
- 全テストがパスすること
- カバレッジが低下していないこと

### Step 4: 修正のCommit

修正があれば、`/buildInPublic:Commit` で別コミットとして記録する。

```
/buildInPublic:Commit
```

## Why This Workflow?

| 理由 | 説明 |
|------|------|
| 型安全維持 | ESLintでTypeScriptの型エラーを検出 |
| スタイル一貫性 | Prettierでフォーマットを統一 |
| 差分の明確化 | 機能/lint修正を別コミットに分離 |

## Integration with Spec-Driven Development

```
/kiro:spec-impl でタスク実行
    ↓
タスク完了 → /buildInPublic:Commit
    ↓
pnpm lint
    ↓
pnpm test
    ↓
修正あれば → /buildInPublic:Commit
    ↓
次のタスクへ
```

## Common Commands

```bash
# ビルド
pnpm build        # ビルド（tsup）

# 品質チェック
pnpm lint         # ESLint
pnpm typecheck    # TypeScript型チェック

# テスト
pnpm test         # Vitest（単体実行）
pnpm test:watch   # Vitest watch mode
```

**Note**: `lint:fix`, `format`, `test:coverage` 等は必要に応じて package.json に追加可能。

## Exceptions

以下の場合はLint/Test実行をスキップ可能:

- ドキュメントのみの変更
- 設定ファイルのみの変更
- .kiro/ 内のみの変更

## tasks.md フォーマット規則

各タスクは以下の形式で記述する：

```markdown
- [ ] {番号}. {タスク名}
  - {詳細説明（複数行可）}
  - _Requirements: {対応する要件ID（カンマ区切り）}_
```

**例**:
```markdown
- [ ] 1. プロジェクト初期化
  - npm package として初期化
  - package.json に必要なメタデータを設定
  - .gitignore を作成
  - _Requirements: FR-1_

- [x] 2. TypeScript設定とビルド確認
  - tsconfig.json を作成（strict mode有効化）
  - `npm run build` の成功を確認
  - _Requirements: FR-2, FR-5_
```

**ルール**:
- 各タスクは `- [ ]` で開始（完了時は `- [x]`）
- タスク番号は連番
- 詳細説明は字下げしてリスト形式
- 最終行に `_Requirements: ID1, ID2, ..._` を必ず記載
- 要件IDは requirements.md の該当セクション（FR-1, NFR-1 等）を参照

---
_Workflow ensures code quality through systematic checks_
