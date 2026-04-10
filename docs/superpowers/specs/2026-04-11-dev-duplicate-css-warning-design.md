# DEVモード重複CSSプロパティ警告

**日付**: 2026-04-11
**ステータス**: 承認済み
**カテゴリ**: DSL DX改善

## 背景

DraftOleのfluent CSS APIで同一プロパティを2回呼ぶと、後の値が黙って上書きする。

```typescript
div()
  .margin('0 auto')  // 中央寄せ
  .color(theme.text)
  .margin('0')        // 上書き — 気づきにくい
```

CSSとしてはlast-write-winsで正しいが、DSLとしてはバグの温床。MVP Demoで実際にこの問題が発生した。

## 決定事項

| 項目 | 決定 |
|------|------|
| 有効化方法 | 環境変数 `DRAFT_OLE_DEV=true` |
| 検知時の動作 | `DuplicateCssPropertyError` をthrow |
| メッセージ内容 | プロパティ名のみ（値は含めない） |
| 検知スコープ | 内部setter（CSSSpacing等の全13クラス） |
| 実装パターン | ガード関数で共通化 |

## 設計

### 新規ファイル: `src/utils/dev-guard.ts`

```typescript
import { DuplicateCssPropertyError } from './errors.js';

export function guardDuplicateCssProperty(
  currentValue: unknown,
  propertyName: string,
): void {
  if (process.env.DRAFT_OLE_DEV && currentValue !== undefined) {
    throw new DuplicateCssPropertyError(propertyName);
  }
}
```

- `process.env.DRAFT_OLE_DEV` が未設定なら何もしない（本番ゼロコスト）
- `currentValue !== undefined` で「既に値がある」を判定

### 新規エラー: `DuplicateCssPropertyError`

`src/utils/errors.ts` に追加:

```typescript
export class DuplicateCssPropertyError extends DraftOleError {
  constructor(property: string) {
    super(
      `CSS property "${property}" was set twice on the same element. This is likely a bug.`,
    );
    this.name = 'DuplicateCssPropertyError';
  }
}
```

### 各CSSプロパティクラスの変更パターン

全13クラスの全setter冒頭に1行追加:

```typescript
// 例: css-spacing.ts
setMargin(value: string): this {
  guardDuplicateCssProperty(this._margin, 'margin');  // 追加
  this._margin = value;
  return this;
}
```

### 対象クラス一覧

| クラス | ファイル | 概算setter数 |
|--------|---------|:------:|
| CSSSpacing | spacing/css-spacing.ts | ~10 |
| CSSFont | font/css-font.ts | ~8 |
| CSSBackground | background/css-background.ts | ~6 |
| CSSFlex | flex/css-flex.ts | ~8 |
| CSSBorder | border/css-border.ts | ~10 |
| CSSSize | size/css-size.ts | ~6 |
| CSSDisplay | display/css-display.ts | ~4 |
| CSSPosition | position/css-position.ts | ~6 |
| CSSText | text/css-text.ts | ~6 |
| CSSOverflow | overflow/css-overflow.ts | ~3 |
| CSSShadow | shadow/css-shadow.ts | ~3 |
| CSSOpacity | opacity/css-opacity.ts | ~1 |
| CSSTransform | transform/css-transform.ts | ~3 |

## テスト

### `tests/utils/dev-guard.test.ts`

```typescript
describe('guardDuplicateCssProperty', () => {
  it('DEV=true かつ既存値ありで DuplicateCssPropertyError をthrow');
  it('DEV=true かつ未設定（undefined）なら何もしない');
  it('DEV未設定なら既存値があっても何もしない');
});
```

### 統合テスト（代表1クラスで確認）

```typescript
describe('CSSSpacing DEVモード重複検知', () => {
  it('DEV=true で setMargin を2回呼ぶと throw');
  it('DEV未設定で setMargin を2回呼んでも上書きされるだけ');
});
```

## 変更しないもの

- HtmlTagのfluentメソッド — 変更不要（内部setterで検知される）
- CssConfig — 環境変数のみで制御
- 既存テスト — DEV未設定なので影響なし

## MVP Demoのバグ修正

設計とは別に、既存の `.margin('0')` 上書きバグを修正する:

```typescript
// examples/mvp-demo.ts 174行目
// Before:
).maxWidth('860px').margin('0 auto').padding('36px 18px 60px')
 .fontFamily('...').color(theme.text).margin('0'),  // margin上書き

// After:
).maxWidth('860px').margin('0 auto').padding('36px 18px 60px')
 .fontFamily('...').color(theme.text),  // .margin('0') 削除
```
