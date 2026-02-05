# Tasks: Phase 1 - 基盤構築

## タスク一覧

### Task 1: プロジェクト初期化
**状態**: [ ] 未着手

**作業内容**:
1. `npm init -y` を実行
2. package.json を編集:
   - name: "draft-ole"
   - version: "0.1.0"
   - type: "module"
   - description, author, license を設定
3. .gitignore を作成（node_modules, dist, coverage）

**完了条件**:
- package.json が存在する
- .gitignore が存在する

---

### Task 2: TypeScript設定
**状態**: [ ] 未着手

**作業内容**:
1. `npm install -D typescript` を実行
2. tsconfig.json を作成（design.md参照）

**完了条件**:
- `npx tsc --version` が動作する
- tsconfig.json が存在する

---

### Task 3: ビルドツール設定（tsup）
**状態**: [ ] 未着手

**作業内容**:
1. `npm install -D tsup` を実行
2. tsup.config.ts を作成:
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
});
```
3. package.json に "build": "tsup" を追加

**完了条件**:
- `npm run build` が成功する

---

### Task 4: ESLint設定
**状態**: [ ] 未着手

**作業内容**:
1. `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin` を実行
2. .eslintrc.json を作成:
```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```
3. package.json に "lint" script を追加

**完了条件**:
- `npm run lint` が成功する

---

### Task 5: Prettier設定
**状態**: [ ] 未着手

**作業内容**:
1. `npm install -D prettier eslint-config-prettier` を実行
2. .prettierrc を作成:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```
3. .eslintrc.json の extends に "prettier" を追加
4. package.json に "format" script を追加

**完了条件**:
- `npm run format` が成功する
- ESLint と Prettier が競合しない

---

### Task 6: Vitest設定
**状態**: [ ] 未着手

**作業内容**:
1. `npm install -D vitest` を実行
2. vitest.config.ts を作成:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```
3. package.json に "test" scripts を追加

**完了条件**:
- `npm run test` が成功する（テストなしでもOK）

---

### Task 7: ディレクトリ構造作成
**状態**: [ ] 未着手

**作業内容**:
1. src/ ディレクトリを作成
2. src/index.ts を作成（空エクスポート）
3. src/utils/ ディレクトリを作成
4. tests/ ディレクトリを作成
5. tests/utils/ ディレクトリを作成

**完了条件**:
- ディレクトリ構造が存在する
- `npm run build` が成功する

---

### Task 8: Renderable interface実装
**状態**: [ ] 未着手

**作業内容**:
1. src/utils/renderable.ts を作成:
```typescript
export interface Renderable {
  render(): string;
}
```
2. src/index.ts からエクスポート

**完了条件**:
- Renderable がエクスポートされる

---

### Task 9: Exportable interface実装
**状態**: [ ] 未着手

**作業内容**:
1. src/utils/exportable.ts を作成:
```typescript
export interface Exportable {
  export(path: string): Promise<void>;
}
```
2. src/index.ts からエクスポート

**完了条件**:
- Exportable がエクスポートされる

---

### Task 10: UnitStyle実装
**状態**: [ ] 未着手

**作業内容**:
1. Swift版 `CSS/Config/UnitStyle.swift` を参照
2. src/utils/unit-style.ts を作成:
```typescript
export type UnitStyle = 'px' | 'em' | 'rem' | '%' | 'vw' | 'vh' | 'auto';

export function hlUnit(value: number, unit: UnitStyle): string {
  if (unit === 'auto') return 'auto';
  return `${value}${unit}`;
}
```
3. src/index.ts からエクスポート
4. tests/utils/unit-style.test.ts を作成してテスト

**完了条件**:
- hlUnit(10, 'px') が '10px' を返す
- hlUnit(0, 'auto') が 'auto' を返す
- テストがパスする

---

### Task 11: 最終確認
**状態**: [ ] 未着手

**作業内容**:
1. `npm run build` が成功することを確認
2. `npm run test` が成功することを確認
3. `npm run lint` が成功することを確認
4. dist/ に index.js, index.cjs, index.d.ts が生成されることを確認

**完了条件**:
- すべてのコマンドが成功する
- 成果物が正しく生成される

---

## 進捗サマリー

| Task | 状態 |
|------|------|
| Task 1: プロジェクト初期化 | [ ] |
| Task 2: TypeScript設定 | [ ] |
| Task 3: ビルドツール設定 | [ ] |
| Task 4: ESLint設定 | [ ] |
| Task 5: Prettier設定 | [ ] |
| Task 6: Vitest設定 | [ ] |
| Task 7: ディレクトリ構造作成 | [ ] |
| Task 8: Renderable interface | [ ] |
| Task 9: Exportable interface | [ ] |
| Task 10: UnitStyle実装 | [ ] |
| Task 11: 最終確認 | [ ] |
