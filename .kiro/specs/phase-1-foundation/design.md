# Design: Phase 1 - 基盤構築

## 依存関係
- なし（最初のspec）

## 変更範囲（Touched Paths）
```
tsProject/
├── package.json          (新規)
├── tsconfig.json         (新規)
├── tsup.config.ts        (新規)
├── vitest.config.ts      (新規)
├── .eslintrc.json        (新規)
├── .prettierrc           (新規)
├── .gitignore            (新規)
├── src/
│   ├── index.ts          (新規)
│   └── utils/
│       ├── renderable.ts (新規)
│       ├── exportable.ts (新規)
│       └── unit-style.ts (新規)
└── tests/
    └── utils/
        └── unit-style.test.ts (新規)
```

## 並行リスク
- 低（他に並行作業なし）

## 技術設計

### package.json
```json
{
  "name": "draft-ole",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src tests",
    "lint:fix": "eslint src tests --fix",
    "format": "prettier --write src tests",
    "typecheck": "tsc --noEmit"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### コアインターフェース

#### Renderable
Swift版: `Utils/Renderable.swift`
```typescript
// src/utils/renderable.ts
export interface Renderable {
  render(): string;
}
```

#### Exportable
Swift版: `Publisher/Exportable.swift`
```typescript
// src/utils/exportable.ts
export interface Exportable {
  export(path: string): Promise<void>;
}
```

#### UnitStyle
Swift版: `CSS/Config/UnitStyle.swift`
```typescript
// src/utils/unit-style.ts
export type UnitStyle = 'px' | 'em' | 'rem' | '%' | 'vw' | 'vh' | 'auto';

export function hlUnit(value: number, unit: UnitStyle): string {
  if (unit === 'auto') return 'auto';
  return `${value}${unit}`;
}
```

## Acceptance Criteria

1. `npm install` が成功する
2. `npm run build` が成功し、dist/ に以下が生成される:
   - index.js (ESM)
   - index.cjs (CJS)
   - index.d.ts (型定義)
3. `npm run test` が成功する
4. `npm run lint` がエラーなしで完了する
5. `Renderable` interface が正しくエクスポートされる

## Rollback
- `git revert <commit-hash>` で戻す
- 初期設定のため、影響範囲は限定的
