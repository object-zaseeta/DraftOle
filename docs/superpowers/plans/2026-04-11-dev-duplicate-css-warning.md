# DEVモード重複CSSプロパティ警告 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `DRAFT_OLE_DEV=true` 環境下で、同一CSSプロパティを2回設定した場合に `DuplicateCssPropertyError` をthrowする

**Architecture:** ガード関数 `guardDuplicateCssProperty()` を1つ作り、全13CSSプロパティクラスの全setterから呼び出す。CSSColor は値オブジェクトなので対象外。環境変数 `process.env.DRAFT_OLE_DEV` で制御。

**Tech Stack:** TypeScript, Vitest

---

## ファイル構成

| 操作 | ファイル | 責務 |
|------|---------|------|
| 新規 | `src/utils/dev-guard.ts` | ガード関数 |
| 変更 | `src/utils/errors.ts` | `DuplicateCssPropertyError` 追加 |
| 新規 | `tests/utils/dev-guard.test.ts` | ガード関数の単体テスト |
| 変更 | `src/css/style/spacing/css-spacing.ts` | setter にガード追加 |
| 変更 | `src/css/style/font/css-font.ts` | setter にガード追加 |
| 変更 | `src/css/style/background/css-background.ts` | setter にガード追加 |
| 変更 | `src/css/style/flex/css-flex.ts` | setter にガード追加 |
| 変更 | `src/css/style/border/css-border.ts` | setter にガード追加 |
| 変更 | `src/css/style/text/css-text.ts` | setter にガード追加 |
| 変更 | `src/css/style/visual/css-visual.ts` | setter にガード追加 |
| 変更 | `src/css/style/grid/css-grid.ts` | setter にガード追加 |
| 変更 | `src/css/style/transform/css-transform.ts` | setter にガード追加 |
| 変更 | `src/css/style/list/css-list.ts` | setter にガード追加 |
| 変更 | `src/css/style/visibility/css-visibility.ts` | setter にガード追加 |
| 変更 | `src/css/style/animation/css-animation.ts` | setter にガード追加 |
| 変更 | `src/css/style/table/css-table.ts` | setter にガード追加 |
| 変更 | `src/index.ts` | `DuplicateCssPropertyError` エクスポート追加 |
| 変更 | `examples/mvp-demo.ts` | `.margin('0')` 重複バグ修正 |

---

### Task 1: DuplicateCssPropertyError をerrors.tsに追加

**Files:**
- Modify: `src/utils/errors.ts:23-26` （CssErrorCode に `'duplicateProperty'` 追加）
- Modify: `src/utils/errors.ts:165` （末尾に DuplicateCssPropertyError クラス追加）

- [ ] **Step 1: CssErrorCode に `duplicateProperty` を追加**

```typescript
// src/utils/errors.ts:23-26
export type CssErrorCode =
  | 'invalidProperty'
  | 'invalidValue'
  | 'layoutConflict'
  | 'duplicateProperty';
```

- [ ] **Step 2: DuplicateCssPropertyError クラスを追加**

`src/utils/errors.ts` 末尾（165行目の後）に追加:

```typescript
/**
 * DEVモードで同一CSSプロパティが2回設定された場合にthrowされるエラー。
 *
 * `DRAFT_OLE_DEV=true` 環境変数が設定されている場合のみ発生する。
 * 本番環境では後から設定した値で上書きされる（CSS仕様通り）。
 */
export class DuplicateCssPropertyError extends DraftOleError {
  readonly code = 'duplicateProperty' as const;
  readonly module = 'css' as const;

  constructor(property: string) {
    super(
      `CSS property "${property}" was set twice on the same element. This is likely a bug.`,
    );
    this.name = 'DuplicateCssPropertyError';
  }
}
```

- [ ] **Step 3: ビルド確認**

Run: `pnpm run build`
Expected: 成功

- [ ] **Step 4: コミット**

```bash
git add src/utils/errors.ts
git commit -m "feat(dev): add DuplicateCssPropertyError class"
```

---

### Task 2: ガード関数とテスト（TDD）

**Files:**
- Create: `tests/utils/dev-guard.test.ts`
- Create: `src/utils/dev-guard.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// tests/utils/dev-guard.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { guardDuplicateCssProperty } from '../../src/utils/dev-guard.js';
import { DuplicateCssPropertyError } from '../../src/utils/errors.js';

describe('guardDuplicateCssProperty', () => {
  const originalEnv = process.env.DRAFT_OLE_DEV;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DRAFT_OLE_DEV;
    } else {
      process.env.DRAFT_OLE_DEV = originalEnv;
    }
  });

  it('DEV=true かつ既存値ありで DuplicateCssPropertyError をthrow', () => {
    process.env.DRAFT_OLE_DEV = 'true';
    expect(() => guardDuplicateCssProperty('0 auto', 'margin')).toThrow(
      DuplicateCssPropertyError,
    );
  });

  it('throwされたエラーのメッセージにプロパティ名が含まれる', () => {
    process.env.DRAFT_OLE_DEV = 'true';
    expect(() => guardDuplicateCssProperty('10px', 'padding')).toThrow(
      'CSS property "padding" was set twice',
    );
  });

  it('DEV=true かつ未設定（undefined）なら何もしない', () => {
    process.env.DRAFT_OLE_DEV = 'true';
    expect(() => guardDuplicateCssProperty(undefined, 'margin')).not.toThrow();
  });

  it('DEV未設定なら既存値があっても何もしない', () => {
    delete process.env.DRAFT_OLE_DEV;
    expect(() => guardDuplicateCssProperty('0 auto', 'margin')).not.toThrow();
  });

  it('DEV=false なら何もしない', () => {
    process.env.DRAFT_OLE_DEV = 'false';
    expect(() => guardDuplicateCssProperty('0 auto', 'margin')).not.toThrow();
  });
});
```

- [ ] **Step 2: テスト実行して失敗確認**

Run: `pnpm vitest run tests/utils/dev-guard.test.ts`
Expected: FAIL（`src/utils/dev-guard.ts` が存在しない）

- [ ] **Step 3: ガード関数を実装**

```typescript
// src/utils/dev-guard.ts
import { DuplicateCssPropertyError } from './errors.js';

/**
 * DEVモードでCSSプロパティの重複設定を検知するガード関数。
 *
 * `DRAFT_OLE_DEV=true` 環境変数が設定されている場合のみ動作する。
 * currentValue が undefined でない（= 既に値が設定済み）なら
 * DuplicateCssPropertyError をthrowする。
 *
 * @param currentValue - 現在のプロパティ値（undefined = 未設定）
 * @param propertyName - CSSプロパティ名（エラーメッセージ用）
 */
export function guardDuplicateCssProperty(
  currentValue: unknown,
  propertyName: string,
): void {
  if (
    process.env.DRAFT_OLE_DEV === 'true' &&
    currentValue !== undefined
  ) {
    throw new DuplicateCssPropertyError(propertyName);
  }
}
```

- [ ] **Step 4: テスト実行して全パス確認**

Run: `pnpm vitest run tests/utils/dev-guard.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/utils/dev-guard.ts tests/utils/dev-guard.test.ts
git commit -m "feat(dev): add guardDuplicateCssProperty guard function with tests"
```

---

### Task 3: CSSSpacing にガード追加

**Files:**
- Modify: `src/css/style/spacing/css-spacing.ts`
- Modify: `tests/css/style/spacing/css-spacing.test.ts`（統合テスト追加）

- [ ] **Step 1: 統合テストを追加**

`tests/css/style/spacing/css-spacing.test.ts` 末尾に追加:

```typescript
// ── DEVモード重複検知 ──

describe('DEVモード重複検知', () => {
  const originalEnv = process.env.DRAFT_OLE_DEV;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DRAFT_OLE_DEV;
    } else {
      process.env.DRAFT_OLE_DEV = originalEnv;
    }
  });

  it('DEV=true で setMargin を2回呼ぶと throw', () => {
    process.env.DRAFT_OLE_DEV = 'true';
    const sut = makeSUT();
    sut.setMargin('0 auto');
    expect(() => sut.setMargin('0')).toThrow('CSS property "margin" was set twice');
  });

  it('DEV=true で setMarginTop と setMarginTopUnit の混在で throw', () => {
    process.env.DRAFT_OLE_DEV = 'true';
    const sut = makeSUT();
    sut.setMarginTop('10px');
    expect(() => sut.setMarginTopUnit(makeHlUnit(20, 'px'))).toThrow(
      'CSS property "margin-top" was set twice',
    );
  });

  it('DEV未設定で setMargin を2回呼んでも上書きされるだけ', () => {
    delete process.env.DRAFT_OLE_DEV;
    const sut = makeSUT();
    sut.setMargin('0 auto');
    sut.setMargin('0');
    expect(sut.render()).toBe('margin: 0;');
  });
});
```

注意: `afterEach` のインポートが必要。ファイル冒頭の import を確認し、`afterEach` がなければ追加:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
```

- [ ] **Step 2: テスト実行して失敗確認**

Run: `pnpm vitest run tests/css/style/spacing/css-spacing.test.ts`
Expected: FAIL（ガードがまだ追加されていない）

- [ ] **Step 3: css-spacing.ts にガードを追加**

`src/css/style/spacing/css-spacing.ts` の冒頭にインポート追加:

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

全18個のsetterにガードを追加。パターン:

```typescript
// 文字列setter — propertyName は CSSPropertyKey の値（ハイフネーション済み）
setMarginTop(value: string): this {
  guardDuplicateCssProperty(this._marginTop, 'margin-top');
  this._marginTop = value;
  return this;
}

setMarginRight(value: string): this {
  guardDuplicateCssProperty(this._marginRight, 'margin-right');
  this._marginRight = value;
  return this;
}

setMarginBottom(value: string): this {
  guardDuplicateCssProperty(this._marginBottom, 'margin-bottom');
  this._marginBottom = value;
  return this;
}

setMarginLeft(value: string): this {
  guardDuplicateCssProperty(this._marginLeft, 'margin-left');
  this._marginLeft = value;
  return this;
}

setMargin(value: string): this {
  guardDuplicateCssProperty(this._margin, 'margin');
  this._margin = value;
  return this;
}

setPaddingTop(value: string): this {
  guardDuplicateCssProperty(this._paddingTop, 'padding-top');
  this._paddingTop = value;
  return this;
}

setPaddingRight(value: string): this {
  guardDuplicateCssProperty(this._paddingRight, 'padding-right');
  this._paddingRight = value;
  return this;
}

setPaddingBottom(value: string): this {
  guardDuplicateCssProperty(this._paddingBottom, 'padding-bottom');
  this._paddingBottom = value;
  return this;
}

setPaddingLeft(value: string): this {
  guardDuplicateCssProperty(this._paddingLeft, 'padding-left');
  this._paddingLeft = value;
  return this;
}

setPadding(value: string): this {
  guardDuplicateCssProperty(this._padding, 'padding');
  this._padding = value;
  return this;
}

// HlUnit setter — 同じ変数に書き込むのでガード必要
setMarginTopUnit(hlUnit: HlUnit): this {
  guardDuplicateCssProperty(this._marginTop, 'margin-top');
  this._marginTop = hlUnitToCssString(hlUnit);
  return this;
}

setMarginRightUnit(hlUnit: HlUnit): this {
  guardDuplicateCssProperty(this._marginRight, 'margin-right');
  this._marginRight = hlUnitToCssString(hlUnit);
  return this;
}

setMarginBottomUnit(hlUnit: HlUnit): this {
  guardDuplicateCssProperty(this._marginBottom, 'margin-bottom');
  this._marginBottom = hlUnitToCssString(hlUnit);
  return this;
}

setMarginLeftUnit(hlUnit: HlUnit): this {
  guardDuplicateCssProperty(this._marginLeft, 'margin-left');
  this._marginLeft = hlUnitToCssString(hlUnit);
  return this;
}

setPaddingTopUnit(hlUnit: HlUnit): this {
  guardDuplicateCssProperty(this._paddingTop, 'padding-top');
  this._paddingTop = hlUnitToCssString(hlUnit);
  return this;
}

setPaddingRightUnit(hlUnit: HlUnit): this {
  guardDuplicateCssProperty(this._paddingRight, 'padding-right');
  this._paddingRight = hlUnitToCssString(hlUnit);
  return this;
}

setPaddingBottomUnit(hlUnit: HlUnit): this {
  guardDuplicateCssProperty(this._paddingBottom, 'padding-bottom');
  this._paddingBottom = hlUnitToCssString(hlUnit);
  return this;
}

setPaddingLeftUnit(hlUnit: HlUnit): this {
  guardDuplicateCssProperty(this._paddingLeft, 'padding-left');
  this._paddingLeft = hlUnitToCssString(hlUnit);
  return this;
}
```

- [ ] **Step 4: テスト実行して全パス確認**

Run: `pnpm vitest run tests/css/style/spacing/css-spacing.test.ts`
Expected: 全テスト PASS（既存 + 新規3テスト）

- [ ] **Step 5: コミット**

```bash
git add src/css/style/spacing/css-spacing.ts tests/css/style/spacing/css-spacing.test.ts
git commit -m "feat(dev): add duplicate guard to CSSSpacing setters"
```

---

### Task 4: CSSFont にガード追加

**Files:**
- Modify: `src/css/style/font/css-font.ts`

- [ ] **Step 1: インポート追加**

`src/css/style/font/css-font.ts` 冒頭にインポート追加:

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全8 setterにガード追加**

```typescript
setFontFamily(value: string): this {
  guardDuplicateCssProperty(this._fontFamily, 'font-family');
  this._fontFamily = value;
  return this;
}

setFontSize(value: string): this {
  guardDuplicateCssProperty(this._fontSize, 'font-size');
  this._fontSize = value;
  return this;
}

setFontWeight(value: string): this {
  guardDuplicateCssProperty(this._fontWeight, 'font-weight');
  this._fontWeight = value;
  return this;
}

setFontStyle(value: string): this {
  guardDuplicateCssProperty(this._fontStyle, 'font-style');
  this._fontStyle = value;
  return this;
}

setColor(value: string): this {
  guardDuplicateCssProperty(this._color, 'color');
  this._color = value;
  return this;
}

setLineHeight(value: string): this {
  guardDuplicateCssProperty(this._lineHeight, 'line-height');
  this._lineHeight = value;
  return this;
}

setLetterSpacing(value: string): this {
  guardDuplicateCssProperty(this._letterSpacing, 'letter-spacing');
  this._letterSpacing = value;
  return this;
}

setColorValue(color: CSSColor): this {
  guardDuplicateCssProperty(this._color, 'color');
  this._color = color.toString();
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/font/css-font.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/font/css-font.ts
git commit -m "feat(dev): add duplicate guard to CSSFont setters"
```

---

### Task 5: CSSBackground にガード追加

**Files:**
- Modify: `src/css/style/background/css-background.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全8 setter にガード追加**

```typescript
setBackgroundColor(value: string): this {
  guardDuplicateCssProperty(this._backgroundColor, 'background-color');
  this._backgroundColor = value;
  return this;
}

setBackgroundImage(value: string): this {
  guardDuplicateCssProperty(this._backgroundImage, 'background-image');
  this._backgroundImage = value;
  return this;
}

setBackgroundSize(value: string): this {
  guardDuplicateCssProperty(this._backgroundSize, 'background-size');
  this._backgroundSize = value;
  return this;
}

setBackgroundPosition(value: string): this {
  guardDuplicateCssProperty(this._backgroundPosition, 'background-position');
  this._backgroundPosition = value;
  return this;
}

setBackgroundRepeat(value: string): this {
  guardDuplicateCssProperty(this._backgroundRepeat, 'background-repeat');
  this._backgroundRepeat = value;
  return this;
}

setBackgroundColorValue(color: CSSColor): this {
  guardDuplicateCssProperty(this._backgroundColor, 'background-color');
  this._backgroundColor = color.toString();
  return this;
}

setLinearGradient(direction: string, ...stops: string[]): this {
  guardDuplicateCssProperty(this._backgroundImage, 'background-image');
  this._backgroundImage = `linear-gradient(${direction}, ${stops.join(', ')})`;
  return this;
}

setRadialGradient(shape: string, ...stops: string[]): this {
  guardDuplicateCssProperty(this._backgroundImage, 'background-image');
  this._backgroundImage = `radial-gradient(${shape}, ${stops.join(', ')})`;
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/background/css-background.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/background/css-background.ts
git commit -m "feat(dev): add duplicate guard to CSSBackground setters"
```

---

### Task 6: CSSFlex にガード追加

**Files:**
- Modify: `src/css/style/flex/css-flex.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 個別setter 11個にガード追加**

```typescript
setFlexDirection(value: string): this {
  guardDuplicateCssProperty(this._flexDirection, 'flex-direction');
  this._flexDirection = value;
  return this;
}

setJustifyContent(value: string): this {
  guardDuplicateCssProperty(this._justifyContent, 'justify-content');
  this._justifyContent = value;
  return this;
}

setAlignItems(value: string): this {
  guardDuplicateCssProperty(this._alignItems, 'align-items');
  this._alignItems = value;
  return this;
}

setAlignContent(value: string): this {
  guardDuplicateCssProperty(this._alignContent, 'align-content');
  this._alignContent = value;
  return this;
}

setFlexWrap(value: string): this {
  guardDuplicateCssProperty(this._flexWrap, 'flex-wrap');
  this._flexWrap = value;
  return this;
}

setGap(value: string): this {
  guardDuplicateCssProperty(this._gap, 'gap');
  this._gap = value;
  return this;
}

setFlexGrow(value: string): this {
  guardDuplicateCssProperty(this._flexGrow, 'flex-grow');
  this._flexGrow = value;
  return this;
}

setFlexShrink(value: string): this {
  guardDuplicateCssProperty(this._flexShrink, 'flex-shrink');
  this._flexShrink = value;
  return this;
}

setFlexBasis(value: string): this {
  guardDuplicateCssProperty(this._flexBasis, 'flex-basis');
  this._flexBasis = value;
  return this;
}

setAlignSelf(value: string): this {
  guardDuplicateCssProperty(this._alignSelf, 'align-self');
  this._alignSelf = value;
  return this;
}

setOrder(value: string): this {
  guardDuplicateCssProperty(this._order, 'order');
  this._order = value;
  return this;
}
```

- [ ] **Step 3: setFlex() ショートハンドにガード追加**

`setFlex()` は `_display` に `'flex'` を設定するショートハンド。`_display` のみガード対象:

```typescript
setFlex(options?: FlexOptions): this {
  guardDuplicateCssProperty(this._display, 'display');
  this._display = 'flex';
  if (options?.direction) {
    guardDuplicateCssProperty(this._flexDirection, 'flex-direction');
    this._flexDirection = options.direction;
  }
  if (options?.justify) {
    guardDuplicateCssProperty(this._justifyContent, 'justify-content');
    this._justifyContent = options.justify;
  }
  if (options?.align) {
    guardDuplicateCssProperty(this._alignItems, 'align-items');
    this._alignItems = options.align;
  }
  if (options?.wrap) {
    guardDuplicateCssProperty(this._flexWrap, 'flex-wrap');
    this._flexWrap = options.wrap;
  }
  if (options?.gap) {
    guardDuplicateCssProperty(this._gap, 'gap');
    this._gap = options.gap;
  }
  return this;
}
```

- [ ] **Step 4: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/flex/css-flex.test.ts`
Expected: 全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add src/css/style/flex/css-flex.ts
git commit -m "feat(dev): add duplicate guard to CSSFlex setters"
```

---

### Task 7: CSSBorder にガード追加

**Files:**
- Modify: `src/css/style/border/css-border.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全25 setterにガード追加**

各setterの冒頭に `guardDuplicateCssProperty` を追加。パターンは全て同一:

```typescript
setBorderWidth(value: string): this {
  guardDuplicateCssProperty(this._borderWidth, 'border-width');
  this._borderWidth = value;
  return this;
}

setBorderStyle(value: string): this {
  guardDuplicateCssProperty(this._borderStyle, 'border-style');
  this._borderStyle = value;
  return this;
}

setBorderColor(value: string): this {
  guardDuplicateCssProperty(this._borderColor, 'border-color');
  this._borderColor = value;
  return this;
}

setBorderRadius(value: string): this {
  guardDuplicateCssProperty(this._borderRadius, 'border-radius');
  this._borderRadius = value;
  return this;
}

setBorderTopWidth(value: string): this {
  guardDuplicateCssProperty(this._borderTopWidth, 'border-top-width');
  this._borderTopWidth = value;
  return this;
}

setBorderRightWidth(value: string): this {
  guardDuplicateCssProperty(this._borderRightWidth, 'border-right-width');
  this._borderRightWidth = value;
  return this;
}

setBorderBottomWidth(value: string): this {
  guardDuplicateCssProperty(this._borderBottomWidth, 'border-bottom-width');
  this._borderBottomWidth = value;
  return this;
}

setBorderLeftWidth(value: string): this {
  guardDuplicateCssProperty(this._borderLeftWidth, 'border-left-width');
  this._borderLeftWidth = value;
  return this;
}

setBorderTopStyle(value: string): this {
  guardDuplicateCssProperty(this._borderTopStyle, 'border-top-style');
  this._borderTopStyle = value;
  return this;
}

setBorderRightStyle(value: string): this {
  guardDuplicateCssProperty(this._borderRightStyle, 'border-right-style');
  this._borderRightStyle = value;
  return this;
}

setBorderBottomStyle(value: string): this {
  guardDuplicateCssProperty(this._borderBottomStyle, 'border-bottom-style');
  this._borderBottomStyle = value;
  return this;
}

setBorderLeftStyle(value: string): this {
  guardDuplicateCssProperty(this._borderLeftStyle, 'border-left-style');
  this._borderLeftStyle = value;
  return this;
}

setBorderTopColor(value: string): this {
  guardDuplicateCssProperty(this._borderTopColor, 'border-top-color');
  this._borderTopColor = value;
  return this;
}

setBorderRightColor(value: string): this {
  guardDuplicateCssProperty(this._borderRightColor, 'border-right-color');
  this._borderRightColor = value;
  return this;
}

setBorderBottomColor(value: string): this {
  guardDuplicateCssProperty(this._borderBottomColor, 'border-bottom-color');
  this._borderBottomColor = value;
  return this;
}

setBorderLeftColor(value: string): this {
  guardDuplicateCssProperty(this._borderLeftColor, 'border-left-color');
  this._borderLeftColor = value;
  return this;
}

setBorderTopLeftRadius(value: string): this {
  guardDuplicateCssProperty(this._borderTopLeftRadius, 'border-top-left-radius');
  this._borderTopLeftRadius = value;
  return this;
}

setBorderTopRightRadius(value: string): this {
  guardDuplicateCssProperty(this._borderTopRightRadius, 'border-top-right-radius');
  this._borderTopRightRadius = value;
  return this;
}

setBorderBottomRightRadius(value: string): this {
  guardDuplicateCssProperty(this._borderBottomRightRadius, 'border-bottom-right-radius');
  this._borderBottomRightRadius = value;
  return this;
}

setBorderBottomLeftRadius(value: string): this {
  guardDuplicateCssProperty(this._borderBottomLeftRadius, 'border-bottom-left-radius');
  this._borderBottomLeftRadius = value;
  return this;
}

setBorderColorValue(color: CSSColor): this {
  guardDuplicateCssProperty(this._borderColor, 'border-color');
  this._borderColor = color.toString();
  return this;
}

setBorderTopColorValue(color: CSSColor): this {
  guardDuplicateCssProperty(this._borderTopColor, 'border-top-color');
  this._borderTopColor = color.toString();
  return this;
}

setBorderRightColorValue(color: CSSColor): this {
  guardDuplicateCssProperty(this._borderRightColor, 'border-right-color');
  this._borderRightColor = color.toString();
  return this;
}

setBorderBottomColorValue(color: CSSColor): this {
  guardDuplicateCssProperty(this._borderBottomColor, 'border-bottom-color');
  this._borderBottomColor = color.toString();
  return this;
}

setBorderLeftColorValue(color: CSSColor): this {
  guardDuplicateCssProperty(this._borderLeftColor, 'border-left-color');
  this._borderLeftColor = color.toString();
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/border/css-border.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/border/css-border.ts
git commit -m "feat(dev): add duplicate guard to CSSBorder setters"
```

---

### Task 8: CSSText にガード追加

**Files:**
- Modify: `src/css/style/text/css-text.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全13 setterにガード追加**

```typescript
setTextAlign(value: string): this {
  guardDuplicateCssProperty(this._textAlign, 'text-align');
  this._textAlign = value;
  return this;
}

setTextDecoration(value: string): this {
  guardDuplicateCssProperty(this._textDecoration, 'text-decoration');
  this._textDecoration = value;
  return this;
}

setTextTransform(value: string): this {
  guardDuplicateCssProperty(this._textTransform, 'text-transform');
  this._textTransform = value;
  return this;
}

setTextIndent(value: string): this {
  guardDuplicateCssProperty(this._textIndent, 'text-indent');
  this._textIndent = value;
  return this;
}

setWordSpacing(value: string): this {
  guardDuplicateCssProperty(this._wordSpacing, 'word-spacing');
  this._wordSpacing = value;
  return this;
}

setWhiteSpace(value: string): this {
  guardDuplicateCssProperty(this._whiteSpace, 'white-space');
  this._whiteSpace = value;
  return this;
}

setTextOverflow(value: string): this {
  guardDuplicateCssProperty(this._textOverflow, 'text-overflow');
  this._textOverflow = value;
  return this;
}

setTextDecorationColor(value: string): this {
  guardDuplicateCssProperty(this._textDecorationColor, 'text-decoration-color');
  this._textDecorationColor = value;
  return this;
}

setTextDecorationStyle(value: string): this {
  guardDuplicateCssProperty(this._textDecorationStyle, 'text-decoration-style');
  this._textDecorationStyle = value;
  return this;
}

setTextDecorationLine(value: string): this {
  guardDuplicateCssProperty(this._textDecorationLine, 'text-decoration-line');
  this._textDecorationLine = value;
  return this;
}

setWordBreak(value: string): this {
  guardDuplicateCssProperty(this._wordBreak, 'word-break');
  this._wordBreak = value;
  return this;
}

setOverflowWrap(value: string): this {
  guardDuplicateCssProperty(this._overflowWrap, 'overflow-wrap');
  this._overflowWrap = value;
  return this;
}

setTextShadow(value: string): this {
  guardDuplicateCssProperty(this._textShadow, 'text-shadow');
  this._textShadow = value;
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/text/css-text.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/text/css-text.ts
git commit -m "feat(dev): add duplicate guard to CSSText setters"
```

---

### Task 9: CSSVisual にガード追加

**Files:**
- Modify: `src/css/style/visual/css-visual.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全6 setterにガード追加**

```typescript
setBoxShadow(value: string): this {
  guardDuplicateCssProperty(this._boxShadow, 'box-shadow');
  this._boxShadow = value;
  return this;
}

setOpacity(value: string): this {
  guardDuplicateCssProperty(this._opacity, 'opacity');
  this._opacity = value;
  return this;
}

setCursor(value: string): this {
  guardDuplicateCssProperty(this._cursor, 'cursor');
  this._cursor = value;
  return this;
}

setOverflow(value: string): this {
  guardDuplicateCssProperty(this._overflow, 'overflow');
  this._overflow = value;
  return this;
}

setOverflowX(value: string): this {
  guardDuplicateCssProperty(this._overflowX, 'overflow-x');
  this._overflowX = value;
  return this;
}

setOverflowY(value: string): this {
  guardDuplicateCssProperty(this._overflowY, 'overflow-y');
  this._overflowY = value;
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/visual/css-visual.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/visual/css-visual.ts
git commit -m "feat(dev): add duplicate guard to CSSVisual setters"
```

---

### Task 10: CSSGrid にガード追加

**Files:**
- Modify: `src/css/style/grid/css-grid.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全14 setterにガード追加**

```typescript
setGridTemplateColumns(value: string): this {
  guardDuplicateCssProperty(this._gridTemplateColumns, 'grid-template-columns');
  this._gridTemplateColumns = value;
  return this;
}

setGridTemplateRows(value: string): this {
  guardDuplicateCssProperty(this._gridTemplateRows, 'grid-template-rows');
  this._gridTemplateRows = value;
  return this;
}

setGridGap(value: string): this {
  guardDuplicateCssProperty(this._gridGap, 'grid-gap');
  this._gridGap = value;
  return this;
}

setGridColumn(value: string): this {
  guardDuplicateCssProperty(this._gridColumn, 'grid-column');
  this._gridColumn = value;
  return this;
}

setGridRow(value: string): this {
  guardDuplicateCssProperty(this._gridRow, 'grid-row');
  this._gridRow = value;
  return this;
}

setGridColumnStart(value: string): this {
  guardDuplicateCssProperty(this._gridColumnStart, 'grid-column-start');
  this._gridColumnStart = value;
  return this;
}

setGridColumnEnd(value: string): this {
  guardDuplicateCssProperty(this._gridColumnEnd, 'grid-column-end');
  this._gridColumnEnd = value;
  return this;
}

setGridRowStart(value: string): this {
  guardDuplicateCssProperty(this._gridRowStart, 'grid-row-start');
  this._gridRowStart = value;
  return this;
}

setGridRowEnd(value: string): this {
  guardDuplicateCssProperty(this._gridRowEnd, 'grid-row-end');
  this._gridRowEnd = value;
  return this;
}

setGridTemplateAreas(value: string): this {
  guardDuplicateCssProperty(this._gridTemplateAreas, 'grid-template-areas');
  this._gridTemplateAreas = value;
  return this;
}

setGridArea(value: string): this {
  guardDuplicateCssProperty(this._gridArea, 'grid-area');
  this._gridArea = value;
  return this;
}

setGridAutoFlow(value: string): this {
  guardDuplicateCssProperty(this._gridAutoFlow, 'grid-auto-flow');
  this._gridAutoFlow = value;
  return this;
}

setGridAutoColumns(value: string): this {
  guardDuplicateCssProperty(this._gridAutoColumns, 'grid-auto-columns');
  this._gridAutoColumns = value;
  return this;
}

setGridAutoRows(value: string): this {
  guardDuplicateCssProperty(this._gridAutoRows, 'grid-auto-rows');
  this._gridAutoRows = value;
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/grid/css-grid.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/grid/css-grid.ts
git commit -m "feat(dev): add duplicate guard to CSSGrid setters"
```

---

### Task 11: CSSTransform にガード追加

**Files:**
- Modify: `src/css/style/transform/css-transform.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全6 setterにガード追加**

```typescript
setTransform(value: string): this {
  guardDuplicateCssProperty(this._transform, 'transform');
  this._transform = value;
  return this;
}

setTransformOrigin(value: string): this {
  guardDuplicateCssProperty(this._transformOrigin, 'transform-origin');
  this._transformOrigin = value;
  return this;
}

setFilter(value: string): this {
  guardDuplicateCssProperty(this._filter, 'filter');
  this._filter = value;
  return this;
}

setBackdropFilter(value: string): this {
  guardDuplicateCssProperty(this._backdropFilter, 'backdrop-filter');
  this._backdropFilter = value;
  return this;
}

setPerspective(value: string): this {
  guardDuplicateCssProperty(this._perspective, 'perspective');
  this._perspective = value;
  return this;
}

setPerspectiveOrigin(value: string): this {
  guardDuplicateCssProperty(this._perspectiveOrigin, 'perspective-origin');
  this._perspectiveOrigin = value;
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/transform/css-transform.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/transform/css-transform.ts
git commit -m "feat(dev): add duplicate guard to CSSTransform setters"
```

---

### Task 12: CSSList にガード追加

**Files:**
- Modify: `src/css/style/list/css-list.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全4 setterにガード追加**

```typescript
setListStyleType(value: string): this {
  guardDuplicateCssProperty(this._listStyleType, 'list-style-type');
  this._listStyleType = value;
  return this;
}

setListStylePosition(value: string): this {
  guardDuplicateCssProperty(this._listStylePosition, 'list-style-position');
  this._listStylePosition = value;
  return this;
}

setListStyleImage(value: string): this {
  guardDuplicateCssProperty(this._listStyleImage, 'list-style-image');
  this._listStyleImage = value;
  return this;
}

setListStyle(value: string): this {
  guardDuplicateCssProperty(this._listStyle, 'list-style');
  this._listStyle = value;
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/list/css-list.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/list/css-list.ts
git commit -m "feat(dev): add duplicate guard to CSSList setters"
```

---

### Task 13: CSSVisibility にガード追加

**Files:**
- Modify: `src/css/style/visibility/css-visibility.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全14 setterにガード追加**

```typescript
setDisplay(value: string): this {
  guardDuplicateCssProperty(this._display, 'display');
  this._display = value;
  return this;
}

setWidth(value: string): this {
  guardDuplicateCssProperty(this._width, 'width');
  this._width = value;
  return this;
}

setHeight(value: string): this {
  guardDuplicateCssProperty(this._height, 'height');
  this._height = value;
  return this;
}

setMinWidth(value: string): this {
  guardDuplicateCssProperty(this._minWidth, 'min-width');
  this._minWidth = value;
  return this;
}

setMaxWidth(value: string): this {
  guardDuplicateCssProperty(this._maxWidth, 'max-width');
  this._maxWidth = value;
  return this;
}

setMinHeight(value: string): this {
  guardDuplicateCssProperty(this._minHeight, 'min-height');
  this._minHeight = value;
  return this;
}

setMaxHeight(value: string): this {
  guardDuplicateCssProperty(this._maxHeight, 'max-height');
  this._maxHeight = value;
  return this;
}

setVisibility(value: string): this {
  guardDuplicateCssProperty(this._visibility, 'visibility');
  this._visibility = value;
  return this;
}

setZIndex(value: string): this {
  guardDuplicateCssProperty(this._zIndex, 'z-index');
  this._zIndex = value;
  return this;
}

setOverflow(value: string): this {
  guardDuplicateCssProperty(this._overflow, 'overflow');
  this._overflow = value;
  return this;
}

setOverflowX(value: string): this {
  guardDuplicateCssProperty(this._overflowX, 'overflow-x');
  this._overflowX = value;
  return this;
}

setOverflowY(value: string): this {
  guardDuplicateCssProperty(this._overflowY, 'overflow-y');
  this._overflowY = value;
  return this;
}

setFloat(value: string): this {
  guardDuplicateCssProperty(this._cssFloat, 'float');
  this._cssFloat = value;
  return this;
}

setClear(value: string): this {
  guardDuplicateCssProperty(this._clear, 'clear');
  this._clear = value;
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/visibility/css-visibility.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/visibility/css-visibility.ts
git commit -m "feat(dev): add duplicate guard to CSSVisibility setters"
```

---

### Task 14: CSSAnimation にガード追加

**Files:**
- Modify: `src/css/style/animation/css-animation.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全14 setterにガード追加**

```typescript
setAnimationName(value: string): this {
  guardDuplicateCssProperty(this._animationName, 'animation-name');
  this._animationName = value;
  return this;
}

setAnimationDuration(value: string): this {
  guardDuplicateCssProperty(this._animationDuration, 'animation-duration');
  this._animationDuration = value;
  return this;
}

setAnimationTimingFunction(value: string): this {
  guardDuplicateCssProperty(this._animationTimingFunction, 'animation-timing-function');
  this._animationTimingFunction = value;
  return this;
}

setAnimationDelay(value: string): this {
  guardDuplicateCssProperty(this._animationDelay, 'animation-delay');
  this._animationDelay = value;
  return this;
}

setAnimationIterationCount(value: string): this {
  guardDuplicateCssProperty(this._animationIterationCount, 'animation-iteration-count');
  this._animationIterationCount = value;
  return this;
}

setAnimationDirection(value: string): this {
  guardDuplicateCssProperty(this._animationDirection, 'animation-direction');
  this._animationDirection = value;
  return this;
}

setAnimationFillMode(value: string): this {
  guardDuplicateCssProperty(this._animationFillMode, 'animation-fill-mode');
  this._animationFillMode = value;
  return this;
}

setAnimationPlayState(value: string): this {
  guardDuplicateCssProperty(this._animationPlayState, 'animation-play-state');
  this._animationPlayState = value;
  return this;
}

setAnimation(value: string): this {
  guardDuplicateCssProperty(this._animation, 'animation');
  this._animation = value;
  return this;
}

setTransitionProperty(value: string): this {
  guardDuplicateCssProperty(this._transitionProperty, 'transition-property');
  this._transitionProperty = value;
  return this;
}

setTransitionDuration(value: string): this {
  guardDuplicateCssProperty(this._transitionDuration, 'transition-duration');
  this._transitionDuration = value;
  return this;
}

setTransitionTimingFunction(value: string): this {
  guardDuplicateCssProperty(this._transitionTimingFunction, 'transition-timing-function');
  this._transitionTimingFunction = value;
  return this;
}

setTransitionDelay(value: string): this {
  guardDuplicateCssProperty(this._transitionDelay, 'transition-delay');
  this._transitionDelay = value;
  return this;
}

setTransition(value: string): this {
  guardDuplicateCssProperty(this._transition, 'transition');
  this._transition = value;
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/animation/css-animation.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/animation/css-animation.ts
git commit -m "feat(dev): add duplicate guard to CSSAnimation setters"
```

---

### Task 15: CSSTable にガード追加

**Files:**
- Modify: `src/css/style/table/css-table.ts`

- [ ] **Step 1: インポート追加**

```typescript
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
```

- [ ] **Step 2: 全5 setterにガード追加**

```typescript
setBorderCollapse(value: string): this {
  guardDuplicateCssProperty(this._borderCollapse, 'border-collapse');
  this._borderCollapse = value;
  return this;
}

setBorderSpacing(value: string): this {
  guardDuplicateCssProperty(this._borderSpacing, 'border-spacing');
  this._borderSpacing = value;
  return this;
}

setTableLayout(value: string): this {
  guardDuplicateCssProperty(this._tableLayout, 'table-layout');
  this._tableLayout = value;
  return this;
}

setCaptionSide(value: string): this {
  guardDuplicateCssProperty(this._captionSide, 'caption-side');
  this._captionSide = value;
  return this;
}

setEmptyCells(value: string): this {
  guardDuplicateCssProperty(this._emptyCells, 'empty-cells');
  this._emptyCells = value;
  return this;
}
```

- [ ] **Step 3: 既存テスト実行**

Run: `pnpm vitest run tests/css/style/table/css-table.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: コミット**

```bash
git add src/css/style/table/css-table.ts
git commit -m "feat(dev): add duplicate guard to CSSTable setters"
```

---

### Task 16: エクスポート追加 + MVP Demoバグ修正 + 全テスト

**Files:**
- Modify: `src/index.ts:9-12`（DuplicateCssPropertyError エクスポート追加）
- Modify: `src/index.ts`（guardDuplicateCssProperty エクスポート追加）
- Modify: `examples/mvp-demo.ts:174`（.margin('0') 削除）

- [ ] **Step 1: index.ts にエクスポート追加**

`src/index.ts` の errors エクスポートブロックを変更:

```typescript
export {
  // ── Base Error ──
  DraftOleError,
  // ── CSS Dev Error ──
  DuplicateCssPropertyError,
} from './utils/errors.js';
```

ガード関数もエクスポート追加（ユーザーがカスタムCSSクラスを作った場合に使えるように）:

```typescript
// Phase 1: Utils - Dev Guard
export { guardDuplicateCssProperty } from './utils/dev-guard.js';
```

- [ ] **Step 2: MVP Demo の重複 margin を修正**

`examples/mvp-demo.ts` 174行目の `.margin('0')` を削除:

変更前:
```typescript
    ).maxWidth('860px').margin('0 auto').padding('36px 18px 60px')
     .fontFamily("ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'")
     .color(theme.text).margin('0'),
```

変更後:
```typescript
    ).maxWidth('860px').margin('0 auto').padding('36px 18px 60px')
     .fontFamily("ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'")
     .color(theme.text),
```

- [ ] **Step 3: ビルド確認**

Run: `pnpm run build`
Expected: 成功

- [ ] **Step 4: 全テスト実行**

Run: `pnpm vitest run`
Expected: 全2371+ テスト PASS

- [ ] **Step 5: コミット**

```bash
git add src/index.ts examples/mvp-demo.ts
git commit -m "feat(dev): export DuplicateCssPropertyError + fix mvp-demo margin bug"
```
