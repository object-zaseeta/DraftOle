# Project Structure

## Directory Layout

```
tsProject/
├── .kiro/
│   ├── steering/          # プロジェクト全体のルール
│   │   ├── product.md
│   │   ├── tech.md
│   │   ├── structure.md
│   │   └── workflow.md
│   └── specs/             # 機能仕様
│       └── {feature}/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── docs/
│   ├── migration-plan.md  # 移行計画
│   └── tasks.md           # 移行タスクリスト
├── src/
│   ├── index.ts           # エントリポイント
│   ├── html/
│   │   ├── protocols/     # インターフェース定義
│   │   ├── elements/      # タグ実装（Root, PairType等）
│   │   ├── attributes/    # 属性管理
│   │   └── tags/          # タグファクトリ関数
│   ├── css/
│   │   ├── manager/       # CssManager, CssStyleManager
│   │   ├── config/        # CSS設定
│   │   ├── layout/        # レイアウト計算
│   │   ├── style/         # スタイルプロパティ
│   │   │   ├── flex/
│   │   │   ├── grid/
│   │   │   ├── font/
│   │   │   ├── color/
│   │   │   ├── border/
│   │   │   ├── background/
│   │   │   ├── animation/
│   │   │   ├── transform/
│   │   │   └── ...
│   │   └── spacing/       # margin, padding
│   ├── js/
│   │   └── jquery-manager.ts
│   ├── publisher/
│   │   └── file-exporter.ts
│   └── utils/
│       ├── renderable.ts
│       ├── exportable.ts
│       ├── unit-style.ts
│       └── string-ext.ts
├── tests/
│   ├── html/
│   ├── css/
│   ├── js/
│   └── publisher/
├── examples/              # 使用例
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .eslintrc.json
├── .prettierrc
├── CLAUDE.md
└── README.md
```

## Swift → TypeScript マッピング

| Swift (Sources/) | TypeScript (src/) |
|------------------|-------------------|
| HTML/ | html/ |
| CSS/ | css/ |
| JS/ | js/ |
| Publisher/ | publisher/ |
| Utils/ | utils/ |

## Key Files

### Entry Point
- `src/index.ts` - 全パブリックAPIをエクスポート

### Core Interfaces
- `src/utils/renderable.ts` - Renderable interface
- `src/html/protocols/html-tag-protocol.ts` - HTMLTagProtocol interface

### Tag Factory
- `src/html/tags/index.ts` - div(), p(), span() 等のファクトリ関数

---
_Map modules to their purpose, not every file_
