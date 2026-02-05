# Development Workflow

## Task Completion Flow

タスク完了時の標準ワークフロー。コード品質を維持しながら、クリーンなコードベースを保つ。

```
Task完了 → Commit → Lint → Format → Test → Commit（修正あれば）
```

### Step 1: Task完了とCommit

タスクが完了したら、`/buildInPublic:Commit` スキルを使用してコミットする。

```
/buildInPublic:Commit
```

### Step 2: ESLint実行

コード品質チェックを実行する。

```bash
npm run lint
```

**検出対象**:
- 未使用の変数・import
- 型エラー
- コードスタイル違反
- 潜在的なバグパターン

### Step 3: Prettier実行

フォーマットを統一する。

```bash
npm run format
```

### Step 4: Test実行

ユニットテストを実行して問題がないことを確認する。

```bash
npm run test
```

**確認項目**:
- 全テストがパスすること
- カバレッジが低下していないこと

### Step 5: 修正のCommit

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
npm run lint && npm run format
    ↓
npm run test
    ↓
修正あれば → /buildInPublic:Commit
    ↓
次のタスクへ
```

## Common Commands

```bash
# 開発
npm run dev          # 開発サーバー（watch mode）
npm run build        # ビルド

# 品質チェック
npm run lint         # ESLint
npm run lint:fix     # ESLint + 自動修正
npm run format       # Prettier
npm run typecheck    # tsc --noEmit

# テスト
npm run test         # Vitest
npm run test:watch   # Vitest watch mode
npm run test:coverage # カバレッジ付き
```

## Exceptions

以下の場合はLint/Test実行をスキップ可能:

- ドキュメントのみの変更
- 設定ファイルのみの変更
- .kiro/ 内のみの変更

---
_Workflow ensures code quality through systematic checks_
