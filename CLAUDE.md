# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### プロジェクト概要
Swift版DraftOleをTypeScriptに移植するプロジェクト。
Web開発者向けの型安全なHTML/CSS生成ライブラリを目指す。

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`
- Migration Plan: `docs/migration-plan.md`
- Tasks: `docs/tasks.md`

### Swift版参照
移植元: `/Users/shimizukazuyuki/BitTorrentSync/ActiveProject/Draft_Project/DraftOleProject/TestProject/DraftOle_0.2/`

## Development Guidelines

- Think in English, generate responses in Japanese
- All Markdown content written to project files MUST be written in Japanese

## Minimal Workflow

- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro:spec-impl {feature} [tasks]`
- Progress check: `/kiro:spec-status {feature}`

## Development Rules

- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro:spec-status`

## Git Operations

- コミット時は必ず `/buildInPublic:Commit` を使用すること
- ブランチ命名: `spec/{feature-name}`
- コミットメッセージ: `spec({feature}): {message}`

## Migration-Specific Rules

### 1:1移植の原則
Phase 1では機能追加・設計改善を行わない。Swift版と同等の機能を忠実に移植する。

### Swift → TypeScript 変換
- Protocol → Interface
- Extension → Utility function or Module augmentation
- enum → Union type or TypeScript enum
- guard/if let → Type narrowing

### 参照すべきファイル
移植時は必ずSwift版の対応ファイルを参照すること:
```
Swift: DraftOle0.2/Sources/{module}/{file}.swift
  ↓
TypeScript: src/{module}/{file}.ts
```

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`, `workflow.md`
