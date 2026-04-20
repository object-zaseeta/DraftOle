# CFA-A 依存方向修正・DI導入

**日付**: 2026-04-11
**ステータス**: 承認済み
**カテゴリ**: CFA構造改善（依存方向修正 + DI導入）

## 背景

DraftOle の html/ モジュールが css/, js/ の具象クラスを直接 import & new している（逆方向依存）。
これにより：
- テスト時に CssManager / JQueryManager のモック注入ができない
- html/ と css/, js/ が密結合
- CFA原則2（依存方向）、原則4（統合点）に違反

### 現在の依存方向（問題）

```
html/elements/html-tag.ts
  ├─ import { CssManager } from '../../css/manager/css-manager.js'     ❌ 逆方向
  ├─ import { JQueryManager } from '../../js/jquery-manager.js'         ❌ 逆方向
  └─ private _css = new CssManager()                                    ❌ 直接 new

html/protocols/css-manager-type.ts
  └─ import type { CssManagerInstance } from '../../css/manager/...'    ❌ 逆方向

html/protocols/jquery-manager-protocol.ts
  ├─ import type { JQueryMethodType } from '../../js/...'              ❌ 逆方向
  └─ import type { JQueryManagerInstance } from '../../js/...'         ❌ 逆方向
```

## 決定事項

| 項目 | 決定 |
|------|------|
| インターフェース配置 | `html/protocols/` に移動（消費者所有） |
| 依存注入方法 | HtmlTag コンストラクタのオプション引数 |
| デフォルト実装 | HtmlTag 内に具象 import を残す（現実的妥協） |
| Root の JQueryHelper | スコープ外（JS拡張時に対応） |
| Composition Root | 作らない（オプション引数で十分） |

## 設計

### 変更1: インターフェース定義を `html/protocols/` に移動

#### CssManagerInstance

- 移動元: `src/css/manager/css-manager-instance-type.ts`
- 移動先: `src/html/protocols/css-manager-instance-type.ts`
- 元のファイルには re-export を残す（後方互換性）

```typescript
// src/css/manager/css-manager-instance-type.ts（変更後）
export type { CssManagerInstance } from '../../html/protocols/css-manager-instance-type.js';
```

#### JQueryManagerInstance

- 現在: `src/js/jquery-manager.ts` 内で interface 定義 + class 定義が同居
- 変更: interface を `src/html/protocols/jquery-manager-instance-type.ts` に分離・移動
- 元のファイルには re-export を残す

#### JQueryMethodType

- 移動元: `src/js/jquery-method-type.ts`
- 移動先: `src/html/protocols/jquery-method-type.ts`
- 元のファイルには re-export を残す

### 変更2: protocols 層の逆方向依存を除去

#### css-manager-type.ts

```typescript
// Before
import type { CssManagerInstance } from '../../css/manager/css-manager-instance-type.js';

// After
import type { CssManagerInstance } from './css-manager-instance-type.js';
```

#### jquery-manager-protocol.ts

```typescript
// Before
import type { JQueryMethodType } from '../../js/jquery-method-type.js';
import type { JQueryManagerInstance } from '../../js/jquery-manager.js';

// After
import type { JQueryMethodType } from './jquery-method-type.js';
import type { JQueryManagerInstance } from './jquery-manager-instance-type.js';
```

### 変更3: HtmlTag にオプション引数追加

```typescript
// src/html/elements/html-tag.ts

interface HtmlTagOptions {
  css?: CssManagerInstance;
  jqm?: JQueryManagerInstance;
}

export class HtmlTag implements HTMLTagProtocol, CssManagerType, JQueryManagerProtocol {
  private _css: CssManagerInstance;
  private _jqm: JQueryManagerInstance;

  constructor(tagType: TagType, options?: HtmlTagOptions) {
    this._tagType = tagType;
    this._css = options?.css ?? new CssManager();
    this._jqm = options?.jqm ?? new JQueryManager();
  }
}
```

- `import { CssManager }` と `import { JQueryManager }` はデフォルト値のために HtmlTag に残る
- protocols 層からの逆方向依存は解消される

### 変更4: css/js が protocols/ のインターフェースを実装

```typescript
// src/css/manager/css-manager.ts
import type { CssManagerInstance } from '../../html/protocols/css-manager-instance-type.js';
export class CssManager implements CssManagerInstance { ... }

// src/js/jquery-manager.ts
import type { JQueryManagerInstance } from '../../html/protocols/jquery-manager-instance-type.js';
export class JQueryManager implements JQueryManagerInstance { ... }
```

### 変更5: CssManagerInstance に依存する他の css/ ファイル

CssManagerInstance を import している css/ 内のファイルは、新しいパス（`html/protocols/`）を参照するか、re-export 経由で既存パスを維持する。re-export があるため既存コードは壊れない。

## 依存方向（変更後）

```
html/protocols/ (インターフェース定義 — 安定層)
  ├─ CssManagerInstance
  ├─ JQueryManagerInstance
  ├─ JQueryMethodType
  ├─ CssManagerType
  └─ JQueryManagerProtocol
           ↑ implements（正方向 ✅）
css/manager/css-manager.ts
js/jquery-manager.ts

html/elements/html-tag.ts
  ├─ import type { CssManagerInstance } from protocols/  ← 正方向 ✅
  ├─ import { CssManager } from css/                     ← デフォルト値（許容）
  └─ import { JQueryManager } from js/                   ← デフォルト値（許容）
```

## スコープ外

- Root の JQueryHelper 直接依存 → JS拡張（JS-1, JS-2）時に対応
- Composition Root → 不要（HtmlTag のオプション引数がDI機構を兼ねる）
- ファクトリ関数（`div()`, `section()` 等）→ 変更なし
- index.ts の公開API → 変更なし（re-export で後方互換性維持）

## 後方互換性

| 項目 | 対応 |
|------|------|
| `import { CssManagerInstance } from 'css/manager/...'` | re-export で動作継続 |
| `import { JQueryManagerInstance } from 'js/...'` | re-export で動作継続 |
| `import { JQueryMethodType } from 'js/...'` | re-export で動作継続 |
| `div()`, `section()` 等のファクトリ関数 | 変更なし |
| `new HtmlTag('div')` | 引数なしで従来通り動作 |
| `new Root()` | 変更なし |

## テストでの活用

```typescript
// モック注入の例
const mockCss: CssManagerInstance = {
  layout: mockLayout,
  styleManager: mockStyleManager,
  tagPath: '',
  config: new CssConfig(),
  updateTagPath: () => {},
  updateLazyLayoutRegister: () => {},
  render: () => '',
  renderCss: () => '',
};

const tag = new HtmlTag('div', { css: mockCss });
// → CssManager の実装に依存せずテスト可能
```
