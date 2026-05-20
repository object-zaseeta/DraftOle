# Kiro Spec 運用規約

このドキュメントは、本リポジトリで採用している Kiro 形式 Spec-Driven Development における spec ディレクトリの命名・配置・ライフサイクル規約をまとめたものである。`.kiro/` 配下は git ignore 対象なので、運用上の取り決めとして本ドキュメントを参照する。

## ディレクトリ構造

```
.kiro/
├── steering/         # 全 spec から参照する project-wide なルール / コンテキスト
│   ├── product.md
│   ├── structure.md
│   ├── tech.md
│   └── workflow.md
├── settings/         # spec 生成テンプレートとレビュー規則
│   ├── rules/
│   └── templates/
└── specs/            # 個別の feature spec
    ├── <feature-name>/             # active な spec
    │   ├── spec.json
    │   ├── requirements.md
    │   ├── design.md
    │   ├── research.md          # 任意 (discovery / gap-analysis 結果)
    │   └── tasks.md
    └── _archived/    # 完了済み spec の保管庫
        └── <feature-name>/         # active と同じファイル構成のまま移動
```

## Spec 命名規約

- `<feature-name>` は **kebab-case** (lowercase, hyphen separator)。
- 目安 2〜4 単語、機能ドメインが分かる短い名前 (例: `handler-transformer-dx`, `each-template-auto-id`)。
- 一意性: `.kiro/specs/<name>/` と `.kiro/specs/_archived/<name>/` のどちらか一方に存在する。両方には同時に存在しない。
- 重複時は `-2`, `-3` 等の接尾辞で衝突回避 (`kiro-spec-init` skill が自動付与する場合あり)。

## ライフサイクル

1. **Initialize** (`/kiro:spec-init`)
   - `.kiro/specs/<name>/` を作成し `spec.json` (phase: `initialized`) と `requirements.md` のスケルトンを生成。
2. **Requirements → Design → Tasks** (`/kiro:spec-requirements`, `/kiro:spec-design`, `/kiro:spec-tasks`)
   - 各フェーズで spec.json の `approvals.*` を更新しつつ、対応する Markdown を順次充足。
3. **Implementation** (`/kiro:spec-impl` または `/kiro-impl`)
   - tasks.md のチェックボックスを implementer/reviewer サイクルで埋めていく。
4. **Archive** (本ドキュメントの主題)
   - spec が全タスク完了し、関連 commit が main に取り込まれた時点で archive 対象。
   - 移動先: `.kiro/specs/<name>/` → `.kiro/specs/_archived/<name>/`
   - 移動はディレクトリ単位で **5 ファイル丸ごと** (`spec.json`, `requirements.md`, `design.md`, `research.md` (存在すれば), `tasks.md`)。
   - **ファイル内容の編集は行わない**。完了時のスナップショットをそのまま保管する。

## Archive 操作手順

`.kiro/` は gitignore 対象のため、archive 移動は **コミットを伴わない** working-tree 操作で完結する。

```sh
# active → archived
mv .kiro/specs/<name> .kiro/specs/_archived/<name>

# active 側にゴミが残っていないことを確認
ls .kiro/specs/<name> 2>&1   # → No such file or directory が期待
ls .kiro/specs/_archived/<name>   # → 5 ファイル揃っていることを確認
```

過去 git 履歴に `.kiro/specs/<name>/` 配下のファイルが残っている場合 (gitignore 化 以前のコミット由来) は、以下のいずれかで衛生化する:

- 該当ファイルが既に `_archived/` 配下に同名で存在: 旧 active パスのファイルを `git rm --cached` で index から除去。`.gitignore` の働きで再追跡は発生しない。
- 該当ファイルが `_archived/` に未移動: working tree でファイルを `_archived/` 配下にコピーしたうえで、旧 active パスを同様に `git rm --cached`。

いずれの場合も **archive 内容そのものに対する追加コミットは行わない**。`.kiro/` の gitignore ポリシーを尊重する。

## アーカイブ済み spec の参照

完了済み spec への参照を残したい場合は以下のいずれかを使う:

- `.internal/ai_Docs/done.md` に当該 spec の commit 列・完了サマリーを記録 (`/update-my-task` skill が自動化)。
- ドキュメント (`docs/`) や別 spec の `research.md` 内で相対パス `../_archived/<name>/<file>.md` を参照。

## 例外的なケース

- **Spec が途中で破棄された場合** (要件不適合・優先度低下等):
  - 完成していない状態のまま archive せず、`.internal/ai_Docs/done.md` に「破棄理由」付きで履歴を残してから `.kiro/specs/<name>/` を削除。
  - 削除より archive を選ぶ場合は spec.json の `phase` フィールドに `discarded` を残す。
- **Followup spec が派生した場合**:
  - 元 spec と follow-up spec は別ディレクトリ。元 spec はライフサイクル通り archive、follow-up は新規 active spec として `/kiro:spec-init` 経由で作成。
  - 派生関係は follow-up 側の `research.md` または requirements.md の `References` セクションに記録する。

## 関連ドキュメント

- `.kiro/steering/workflow.md`: Kiro 開発フロー全体の上位ルール
- `.internal/ai_Docs/myTask.md`: 進行中タスクのトラッカー
- `.internal/ai_Docs/done.md`: 完了 spec のアーカイブログ
