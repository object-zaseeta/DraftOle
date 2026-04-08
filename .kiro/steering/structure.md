# Project Structure

## Directory Layout

```
DraftOle_TS/
├── .kiro/
│   ├── steering/          # プロジェクト全体のルール（現在のファイル）
│   │   ├── product.md
│   │   ├── tech.md
│   │   ├── structure.md
│   │   └── workflow.md
│   └── specs/             # 機能仕様（Spec駆動開発）
│       └── phase-1-foundation/  # Phase 1完了
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── src/
│   ├── index.ts           # エントリポイント（全モジュールをエクスポート）
│   ├── html/              # ✅ Phase 2完了（HTMLタグ生成）
│   │   ├── protocols/     # インターフェース定義（6ファイル）
│   │   ├── elements/      # タグ実装（Root, PairType, SelfClosingType, TextType）
│   │   ├── attributes/    # 属性管理（29属性キー）
│   │   ├── tags/          # タグファクトリ関数（56タグ）
│   │   ├── types/         # 型定義（TagFactoryTypes, ProtocolGuard）
│   │   ├── utils/         # HTMLフォーマッター
│   │   └── errors/        # HTML固有エラー
│   ├── css/               # ✅ Phase 3完了（スタイル生成）
│   │   ├── manager/       # CssManager, CssStyleManager
│   │   ├── layout/        # レイアウト計算、ポジショニング
│   │   ├── style/         # 13カテゴリのスタイルプロパティ
│   │   ├── config/        # CSS設定
│   │   ├── utils/         # CSS utilities
│   │   └── errors/        # CSS固有エラー
│   ├── js/                # ✅ Phase 4完了（jQuery風操作）
│   │   ├── jquery-manager.ts  # イベント、DOM操作
│   │   ├── jquery-helper.ts   # $()ヘルパー生成
│   │   └── errors/        # JS固有エラー
│   ├── publisher/         # ✅ Phase 4完了（ファイル出力）
│   │   ├── file-exporter.ts   # HTML/CSS/JS出力
│   │   ├── reset-css.ts       # reset.cssバンドル
│   │   └── exportable-error.ts
│   └── utils/             # ✅ Phase 1完了（共通ユーティリティ）
│       ├── renderable.ts       # Renderable interface
│       ├── errors.ts           # DraftOleError基底クラス
│       └── unit-style.ts       # UnitStyle型とヘルパー関数
├── tests/
│   ├── html/              # ✅ 15テストファイル（689テスト）
│   ├── css/               # ✅ 28テストファイル（1,463テスト）
│   ├── js/                # ✅ 3テストファイル
│   ├── publisher/         # ✅ 3テストファイル
│   ├── integration/       # ✅ 統合テスト
│   └── utils/             # ✅ 2テストファイル
├── dist/                  # ビルド出力（tsup）
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── eslint.config.js       # ESLint Flat Config
├── .prettierrc
├── CLAUDE.md              # AI開発ライフサイクル指示
└── README.md
```

## Implementation Status

**✅ Phase 1-5 完了（96%）** - DraftOle_0.2 から移行完了（2026-02-11）

### Phase 1: 基礎インターフェースとユーティリティ（✅ 100%）
- ✅ Core interfaces (Renderable, Exportable, OleTestable)
- ✅ CSS unit system (UnitStyle, hlUnit)
- ✅ String utilities (characterDiff)
- ✅ Error handling (DraftOleError基底クラス)
- ✅ Build & test setup

### Phase 2: HTML モジュール（✅ 100%）
- ✅ html/protocols/ - HTMLTagProtocol等のインターフェース定義（6ファイル）
- ✅ html/elements/ - タグ実装（Root, PairType, SelfClosingType, TextType）
- ✅ html/tags/ - 56タグファクトリ関数（div, p, span, img等）
- ✅ html/attributes/ - 属性管理（AttributeBuilder, HtmlAttribute, 29属性キー）

### Phase 3: CSS モジュール（✅ 92%、コア完了）
- ✅ css/manager/ - CssManager, CssStyleManager, DefaultCssManager
- ✅ css/layout/ - レイアウト計算、CssPositionMaker、LazyLayoutManager
- ✅ css/style/ - 13カテゴリのスタイルプロパティ
  - ✅ Flexbox (flex-direction, justify-content, align-items等)
  - ✅ Grid (grid-template-columns, grid-gap等)
  - ✅ Font (font-family, font-size, font-weight等)
  - ✅ Color (color, CSS色名167色サポート)
  - ✅ Background, Border, Animation, Transform, Text
  - ✅ Visual, Table, List, Visibility, Spacing
- ✅ スコープドCSS - クラス名ハッシュ生成（djb2）、renderCss()

### Phase 4: JS/Publisher モジュール（✅ 100%）
- ✅ js/ - JQueryManager（イベント、DOM操作、クラス操作）
- ✅ js/ - JQueryHelper（Tree-shaking対応の$()ヘルパー生成）
- ✅ publisher/ - FileExporter（HTML/CSS/JS 3ファイル出力）
- ✅ publisher/ - reset.css バンドル、外部ファイル参照自動設定

### Phase 5: テスト・ドキュメント（✅ 96%）
- ✅ 56テストファイル、**2,371テスト PASS**
- ✅ カバレッジ測定環境（v8プロバイダー、80%閾値）
- ✅ TSDoc コメント充実（約1,500行）

**実装ファイル**: **76個の .ts ファイル**
**テスト**: **56ファイル、2,371テスト PASS**
**ビルド**: ESM + CJS + .d.ts 正常生成

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
- `src/index.ts` - 全モジュール（utils, html, css, js, publisher）のPublic APIをエクスポート

### Module Entrypoints
- `src/html/index.ts` - HTMLタグ生成・属性・プロトコル
- `src/css/index.ts` - CSS管理・スタイル・レイアウト
- `src/js/jquery-manager.ts` - jQuery風イベント・DOM操作
- `src/publisher/file-exporter.ts` - HTML/CSS/JSファイル出力
- `src/utils/` - 共通インターフェース・エラー・ユーティリティ

---
_Map modules to their purpose, not every file_
