# CFA-A 依存方向修正・DI導入 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** html/protocols/ にインターフェース定義を集約し、css/js がそれを実装する形に依存方向を反転。HtmlTag にオプション引数でモック注入を可能にする。

**Architecture:** 3つのインターフェース（CssManagerInstance, JQueryManagerInstance, JQueryMethodType）を html/protocols/ に移動し、元の場所には re-export を残す。protocols 層の逆方向 import を解消。HtmlTag にオプション引数を追加してテスト時のDIを可能にする。

**Tech Stack:** TypeScript, Vitest

---

## ファイル構成

| 操作 | ファイル | 責務 |
|------|---------|------|
| 新規 | `src/html/protocols/css-manager-instance-type.ts` | CssManagerInstance インターフェース定義（移動先） |
| 新規 | `src/html/protocols/jquery-manager-instance-type.ts` | JQueryManagerInstance インターフェース定義（移動先） |
| 新規 | `src/html/protocols/jquery-method-type.ts` | JQueryMethodType 型 + JQUERY_METHOD_TYPES 定数（移動先） |
| 変更 | `src/css/manager/css-manager-instance-type.ts` | re-export のみに変更 |
| 変更 | `src/js/jquery-manager.ts` | interface を外部参照に変更 |
| 変更 | `src/js/jquery-method-type.ts` | re-export のみに変更 |
| 変更 | `src/html/protocols/css-manager-type.ts` | import パスを protocols/ 内に変更 |
| 変更 | `src/html/protocols/jquery-manager-protocol.ts` | import パスを protocols/ 内に変更 |
| 変更 | `src/html/protocols/index.ts` | 新しいインターフェースをエクスポート |
| 変更 | `src/html/elements/html-tag.ts` | オプション引数追加 + import パス変更 |
| 変更 | `src/css/manager/css-manager.ts` | CssManagerInstance の import パス変更 |
| 変更 | `src/css/manager/default-css-manager.ts` | CssManagerInstance の import パス変更 |
| 変更 | `src/js/jquery-helper.ts` | JQueryMethodType の import パス変更 |
| 変更 | `src/index.ts` | JQueryMethodType, JQueryManagerInstance のエクスポート元変更 |

---

### Task 1: CssManagerInstance を html/protocols/ に移動

**Files:**
- Create: `src/html/protocols/css-manager-instance-type.ts`
- Modify: `src/css/manager/css-manager-instance-type.ts`

- [ ] **Step 1: protocols/ に CssManagerInstance を作成**

`src/html/protocols/css-manager-instance-type.ts` を新規作成。元ファイル（`src/css/manager/css-manager-instance-type.ts`）の内容をそのまま移動する。import パスは protocols/ からの相対パスに調整:

```typescript
/**
 * CssManagerInstance インターフェース
 *
 * HtmlTag が保持する CSS マネージャーのコンポジション型。
 * Renderable を拡張し、CSS レンダリング機能を提供する。
 *
 * 依存方向: html/protocols/ が定義を所有し、css/manager/ が実装する。
 */
import type { Renderable } from '../../utils/renderable.js';

import type { LazyLayoutRegister } from '../../css/layout/lazy-layout/registered-item.js';
import type { CssPositionMakerType } from '../../css/layout/position-maker/css-position-maker-type.js';
import type { CssStyleManagerType } from '../../css/style/css-style-manager-type.js';

export interface CssManagerInstance extends Renderable {
  readonly layout: CssPositionMakerType;
  readonly styleManager: CssStyleManagerType;
  tagPath: string;
  updateTagPath(newPath: string): void;
  updateLazyLayoutRegister(register: LazyLayoutRegister | undefined): void;
  renderCss(): string;
}
```

- [ ] **Step 2: 元ファイルを re-export に変更**

`src/css/manager/css-manager-instance-type.ts` を re-export のみに変更:

```typescript
/**
 * 後方互換性のための re-export。
 * 定義は html/protocols/css-manager-instance-type.ts に移動。
 */
export type { CssManagerInstance } from '../../html/protocols/css-manager-instance-type.js';
```

- [ ] **Step 3: ビルド確認**

Run: `pnpm run build`
Expected: 成功（re-export により既存の import パスは全て動作する）

- [ ] **Step 4: テスト確認**

Run: `pnpm vitest run`
Expected: 全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add src/html/protocols/css-manager-instance-type.ts src/css/manager/css-manager-instance-type.ts
git commit -m "refactor(cfa-a): move CssManagerInstance interface to html/protocols"
```

---

### Task 2: JQueryMethodType を html/protocols/ に移動

**Files:**
- Create: `src/html/protocols/jquery-method-type.ts`
- Modify: `src/js/jquery-method-type.ts`

- [ ] **Step 1: protocols/ に JQueryMethodType を作成**

`src/html/protocols/jquery-method-type.ts` を新規作成。元ファイル（`src/js/jquery-method-type.ts`）の型定義と定数をそのまま移動:

```typescript
/**
 * jQuery method types supported by DraftOle
 *
 * 依存方向: html/protocols/ が定義を所有し、js/ が実装する。
 */

export type JQueryMethodType =
  | 'css'
  | 'height'
  | 'on'
  | 'text'
  | 'html'
  | 'addClass'
  | 'removeClass'
  | 'toggleClass';

export const JQUERY_METHOD_TYPES: readonly JQueryMethodType[] = [
  'css',
  'height',
  'on',
  'text',
  'html',
  'addClass',
  'removeClass',
  'toggleClass',
] as const;
```

- [ ] **Step 2: 元ファイルを re-export に変更**

`src/js/jquery-method-type.ts` を re-export のみに変更:

```typescript
/**
 * 後方互換性のための re-export。
 * 定義は html/protocols/jquery-method-type.ts に移動。
 */
export type { JQueryMethodType } from '../html/protocols/jquery-method-type.js';
export { JQUERY_METHOD_TYPES } from '../html/protocols/jquery-method-type.js';
```

- [ ] **Step 3: ビルド + テスト確認**

Run: `pnpm run build && pnpm vitest run`
Expected: ビルド成功、全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/html/protocols/jquery-method-type.ts src/js/jquery-method-type.ts
git commit -m "refactor(cfa-a): move JQueryMethodType to html/protocols"
```

---

### Task 3: JQueryManagerInstance を html/protocols/ に移動

**Files:**
- Create: `src/html/protocols/jquery-manager-instance-type.ts`
- Modify: `src/js/jquery-manager.ts`

- [ ] **Step 1: protocols/ に JQueryManagerInstance を作成**

`src/html/protocols/jquery-manager-instance-type.ts` を新規作成。`src/js/jquery-manager.ts` 内の `JQueryManagerInstance` interface をそのまま移動:

```typescript
/**
 * JQueryManagerInstance インターフェース
 *
 * HtmlTag が保持する jQuery マネージャーのコンポジション型。
 * Renderable を拡張し、jQuery風DOM操作コードの蓄積・出力を提供する。
 *
 * 依存方向: html/protocols/ が定義を所有し、js/ が実装する。
 */
import type { Renderable } from '../../utils/renderable.js';
import type { JQueryMethodType } from './jquery-method-type.js';

export interface JQueryManagerInstance extends Renderable {
  readonly path: string;
  readonly usedMethods: ReadonlySet<JQueryMethodType>;

  css(properties: Record<string, string>): string;
  height(value: number, unit?: string): string;
  on(eventType: string, handler: string): string;
  click(handler: string): string;
  keydown(handler: string): string;
  keyup(handler: string): string;
  text(value: string, isVariable?: boolean): string;
  html(value: string): string;
  addClass(className: string): string;
  removeClass(className: string): string;
  toggleClass(className: string, force?: boolean): string;
  needsHelper(): boolean;

  updatePath(newPath: string): void;
  render(): string;
}
```

- [ ] **Step 2: jquery-manager.ts の interface を re-export に変更**

`src/js/jquery-manager.ts` の `JQueryManagerInstance` interface 定義（行 24-43）を削除し、re-export に変更。ファイル冒頭:

```typescript
import type { Renderable } from '../utils/renderable.js';
import type { JQueryMethodType } from './jquery-method-type.js';

/**
 * 後方互換性のための re-export。
 * 定義は html/protocols/jquery-manager-instance-type.ts に移動。
 */
export type { JQueryManagerInstance } from '../html/protocols/jquery-manager-instance-type.js';
```

残りの `JQueryManager` class 定義はそのまま。class が `implements JQueryManagerInstance` している場合は、新しい import パスから型を取得するよう変更:

```typescript
import type { JQueryManagerInstance } from '../html/protocols/jquery-manager-instance-type.js';

export class JQueryManager implements JQueryManagerInstance {
  // ... 既存の実装はそのまま
}
```

- [ ] **Step 3: ビルド + テスト確認**

Run: `pnpm run build && pnpm vitest run`
Expected: ビルド成功、全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/html/protocols/jquery-manager-instance-type.ts src/js/jquery-manager.ts
git commit -m "refactor(cfa-a): move JQueryManagerInstance interface to html/protocols"
```

---

### Task 4: protocols 層の逆方向 import を解消

**Files:**
- Modify: `src/html/protocols/css-manager-type.ts:9`
- Modify: `src/html/protocols/jquery-manager-protocol.ts:10-11`
- Modify: `src/html/protocols/index.ts`

- [ ] **Step 1: css-manager-type.ts の import パスを変更**

`src/html/protocols/css-manager-type.ts` 行 9:

```typescript
// Before
import type { CssManagerInstance } from '../../css/manager/css-manager-instance-type.js';

// After
import type { CssManagerInstance } from './css-manager-instance-type.js';
```

- [ ] **Step 2: jquery-manager-protocol.ts の import パスを変更**

`src/html/protocols/jquery-manager-protocol.ts` 行 10-11:

```typescript
// Before
import type { JQueryMethodType } from '../../js/jquery-method-type.js';
import type { JQueryManagerInstance } from '../../js/jquery-manager.js';

// After
import type { JQueryMethodType } from './jquery-method-type.js';
import type { JQueryManagerInstance } from './jquery-manager-instance-type.js';
```

- [ ] **Step 3: protocols/index.ts にインターフェースエクスポートを追加**

`src/html/protocols/index.ts` 末尾に追加:

```typescript
// CFA-A: インターフェース定義（依存方向修正）
export type { CssManagerInstance } from './css-manager-instance-type.js';
export type { JQueryManagerInstance } from './jquery-manager-instance-type.js';
export type { JQueryMethodType } from './jquery-method-type.js';
export { JQUERY_METHOD_TYPES } from './jquery-method-type.js';
```

- [ ] **Step 4: ビルド + テスト確認**

Run: `pnpm run build && pnpm vitest run`
Expected: ビルド成功、全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add src/html/protocols/css-manager-type.ts src/html/protocols/jquery-manager-protocol.ts src/html/protocols/index.ts
git commit -m "refactor(cfa-a): remove reverse imports from protocols layer"
```

---

### Task 5: css/manager/ の import パスを新しい定義元に変更

**Files:**
- Modify: `src/css/manager/css-manager.ts:39`
- Modify: `src/css/manager/default-css-manager.ts:27`

- [ ] **Step 1: css-manager.ts の import を変更**

`src/css/manager/css-manager.ts` 行 39:

```typescript
// Before
import type { CssManagerInstance } from './css-manager-instance-type.js';

// After
import type { CssManagerInstance } from '../../html/protocols/css-manager-instance-type.js';
```

- [ ] **Step 2: default-css-manager.ts の import を変更**

`src/css/manager/default-css-manager.ts` 行 27:

```typescript
// Before
import type { CssManagerInstance } from './css-manager-instance-type.js';

// After
import type { CssManagerInstance } from '../../html/protocols/css-manager-instance-type.js';
```

- [ ] **Step 3: ビルド + テスト確認**

Run: `pnpm run build && pnpm vitest run`
Expected: ビルド成功、全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/manager/css-manager.ts src/css/manager/default-css-manager.ts
git commit -m "refactor(cfa-a): css/manager imports CssManagerInstance from protocols"
```

---

### Task 6: js/ の import パスを新しい定義元に変更

**Files:**
- Modify: `src/js/jquery-helper.ts:1`

- [ ] **Step 1: jquery-helper.ts の import を変更**

`src/js/jquery-helper.ts` 行 1:

```typescript
// Before
import type { JQueryMethodType } from './jquery-method-type.js';

// After
import type { JQueryMethodType } from '../html/protocols/jquery-method-type.js';
```

- [ ] **Step 2: ビルド + テスト確認**

Run: `pnpm run build && pnpm vitest run`
Expected: ビルド成功、全テスト PASS

- [ ] **Step 3: コミット**

```bash
git add src/js/jquery-helper.ts
git commit -m "refactor(cfa-a): js/jquery-helper imports JQueryMethodType from protocols"
```

---

### Task 7: HtmlTag にオプション引数を追加（TDD）

**Files:**
- Modify: `src/html/elements/html-tag.ts:19,28-30,91,97,104-106`
- Create: `tests/html/html-tag-di.test.ts`

- [ ] **Step 1: DIテストを作成**

`tests/html/html-tag-di.test.ts` を新規作成:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { PairType } from '../../src/html/elements/pair-type.js';
import type { CssManagerInstance } from '../../src/html/protocols/css-manager-instance-type.js';
import type { JQueryManagerInstance } from '../../src/html/protocols/jquery-manager-instance-type.js';

describe('HtmlTag DI（依存性注入）', () => {
  it('オプション引数なしでデフォルトの CssManager/JQueryManager が使用される', () => {
    const tag = new PairType('div');
    expect(tag.css).toBeDefined();
    expect(tag.css.render()).toBe('');
    expect(tag.jqm).toBeDefined();
    expect(tag.jqm.render()).toBe('');
  });

  it('CssManagerInstance をオプション引数で注入できる', () => {
    const mockCss: CssManagerInstance = {
      layout: {} as CssManagerInstance['layout'],
      styleManager: {} as CssManagerInstance['styleManager'],
      tagPath: 'mock',
      config: {} as unknown,
      updateTagPath: vi.fn(),
      updateLazyLayoutRegister: vi.fn(),
      render: () => 'mock-css-render',
      renderCss: () => 'mock-css',
    } as unknown as CssManagerInstance;

    const tag = new PairType('div', { css: mockCss });
    expect(tag.css).toBe(mockCss);
    expect(tag.css.render()).toBe('mock-css-render');
  });

  it('JQueryManagerInstance をオプション引数で注入できる', () => {
    const mockJqm: JQueryManagerInstance = {
      path: 'mock',
      usedMethods: new Set(),
      css: vi.fn(() => ''),
      height: vi.fn(() => ''),
      on: vi.fn(() => ''),
      click: vi.fn(() => ''),
      keydown: vi.fn(() => ''),
      keyup: vi.fn(() => ''),
      text: vi.fn(() => ''),
      html: vi.fn(() => ''),
      addClass: vi.fn(() => ''),
      removeClass: vi.fn(() => ''),
      toggleClass: vi.fn(() => ''),
      needsHelper: () => false,
      updatePath: vi.fn(),
      render: () => 'mock-js-render',
    };

    const tag = new PairType('div', { jqm: mockJqm });
    expect(tag.jqm).toBe(mockJqm);
    expect(tag.jqm.render()).toBe('mock-js-render');
  });

  it('css と jqm を同時に注入できる', () => {
    const mockCss = {
      layout: {} as CssManagerInstance['layout'],
      styleManager: {} as CssManagerInstance['styleManager'],
      tagPath: '',
      config: {} as unknown,
      updateTagPath: vi.fn(),
      updateLazyLayoutRegister: vi.fn(),
      render: () => 'injected-css',
      renderCss: () => '',
    } as unknown as CssManagerInstance;

    const mockJqm = {
      path: '',
      usedMethods: new Set(),
      css: vi.fn(() => ''),
      height: vi.fn(() => ''),
      on: vi.fn(() => ''),
      click: vi.fn(() => ''),
      keydown: vi.fn(() => ''),
      keyup: vi.fn(() => ''),
      text: vi.fn(() => ''),
      html: vi.fn(() => ''),
      addClass: vi.fn(() => ''),
      removeClass: vi.fn(() => ''),
      toggleClass: vi.fn(() => ''),
      needsHelper: () => false,
      updatePath: vi.fn(),
      render: () => 'injected-js',
    } as JQueryManagerInstance;

    const tag = new PairType('div', { css: mockCss, jqm: mockJqm });
    expect(tag.css.render()).toBe('injected-css');
    expect(tag.jqm.render()).toBe('injected-js');
  });
});
```

- [ ] **Step 2: テスト実行して失敗確認**

Run: `pnpm vitest run tests/html/html-tag-di.test.ts`
Expected: FAIL（PairType のコンストラクタがオプション引数を受け取らない）

- [ ] **Step 3: HtmlTag の import パスを変更**

`src/html/elements/html-tag.ts` の import セクションを変更:

```typescript
// Before (行 19, 28-30)
import type { CssManagerInstance } from '../../css/manager/css-manager-instance-type.js';
// ...
import type { JQueryMethodType } from '../../js/jquery-method-type.js';
import type { JQueryManagerInstance } from '../../js/jquery-manager.js';
import { JQueryManager } from '../../js/jquery-manager.js';

// After
import type { CssManagerInstance } from '../protocols/css-manager-instance-type.js';
// ...
import type { JQueryMethodType } from '../protocols/jquery-method-type.js';
import type { JQueryManagerInstance } from '../protocols/jquery-manager-instance-type.js';
import { JQueryManager } from '../../js/jquery-manager.js';
```

- [ ] **Step 4: HtmlTagOptions インターフェースとコンストラクタを変更**

`src/html/elements/html-tag.ts` のクラス定義の直前（行 68 付近）に追加:

```typescript
/**
 * HtmlTag コンストラクタのオプション引数。
 * テスト時に CssManager / JQueryManager をモック注入するために使用。
 */
export interface HtmlTagOptions {
  css?: CssManagerInstance;
  jqm?: JQueryManagerInstance;
}
```

フィールド宣言を変更（行 91, 97）:

```typescript
// Before
private _css: CssManagerInstance = new CssManager();
// ...
private _jqm: JQueryManagerInstance = new JQueryManager();

// After
private _css: CssManagerInstance;
// ...
private _jqm: JQueryManagerInstance;
```

コンストラクタを変更（行 104-106）:

```typescript
// Before
constructor(tagType: TagType) {
  this.tagType = tagType;
}

// After
constructor(tagType: TagType, options?: HtmlTagOptions) {
  this.tagType = tagType;
  this._css = options?.css ?? new CssManager();
  this._jqm = options?.jqm ?? new JQueryManager();
}
```

- [ ] **Step 5: サブクラスのコンストラクタを更新**

PairType, SelfClosingType, TextType のコンストラクタが `super(tagType)` を呼んでいる場合、第2引数 `options` を渡せるようにする。各サブクラスのコンストラクタシグネチャを確認し、必要に応じて `options?: HtmlTagOptions` を追加して `super(tagType, options)` を呼ぶ。

`src/html/elements/pair-type.ts`:
```typescript
// Before
constructor(tagType: TagType) {
  super(tagType);
}

// After
constructor(tagType: TagType, options?: HtmlTagOptions) {
  super(tagType, options);
}
```

`src/html/elements/self-closing-type.ts`:
```typescript
constructor(tagType: TagType, options?: HtmlTagOptions) {
  super(tagType, options);
}
```

`src/html/elements/text-type.ts` — TextType は CSS/JS を使わないため、変更不要（super(tagType) のまま）。

各サブクラスで `HtmlTagOptions` を import する:
```typescript
import type { HtmlTagOptions } from './html-tag.js';
```

- [ ] **Step 6: テスト実行して全パス確認**

Run: `pnpm vitest run tests/html/html-tag-di.test.ts`
Expected: 4 tests PASS

- [ ] **Step 7: 全テスト + ビルド確認**

Run: `pnpm run build && pnpm vitest run`
Expected: ビルド成功、全テスト PASS

- [ ] **Step 8: コミット**

```bash
git add src/html/elements/html-tag.ts src/html/elements/pair-type.ts src/html/elements/self-closing-type.ts tests/html/html-tag-di.test.ts
git commit -m "feat(cfa-a): add DI support to HtmlTag via optional constructor args"
```

---

### Task 8: index.ts のエクスポート元を整理

**Files:**
- Modify: `src/index.ts:191-209`

- [ ] **Step 1: HtmlTagOptions をエクスポート**

`src/index.ts` の HTML エクスポートセクション（行 30 付近）に追加:

```typescript
export type {
  // ── DI ──
  HtmlTagOptions,
} from './html/elements/html-tag.js';
```

- [ ] **Step 2: ビルド + テスト確認**

Run: `pnpm run build && pnpm vitest run`
Expected: ビルド成功、全テスト PASS

- [ ] **Step 3: コミット**

```bash
git add src/index.ts
git commit -m "refactor(cfa-a): export HtmlTagOptions from index.ts"
```
