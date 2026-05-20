# class-name-minify: scoped CSS クラス名の minify モード

## 概要

scoped CSS クラス名を、production ビルド時に **hash のみのコンパクト形式 `_<8hex>`** へ切り替える機構。
バンドルサイズと転送量を最適化するために使用する。

| モード | フォーマット | 例 |
|--------|-------------|---|
| OFF（既定） | `_<tag-path-prefix>__<bodyHash>` | `_html-body-div__a1b2c3d4` |
| OFF + varName | `_<tag-path>_<varName>__<bodyHash>` | `_html-body-div_card__a1b2c3d4` |
| ON | `_<8hex>` | `_a1b2c3d4` |

`djb2` ハッシュアルゴリズムはモード切替に関わらず不変。

## 利用方法

### `app()` factory 経由（推奨）

`app()` factory に `cssConfig` を渡すと、render pipeline 全体に minify モードが伝搬する。

```ts
import { app, CssConfig, div } from 'draft-ole';

const doc = app({
  cssConfig: new CssConfig({ minifyClassNames: true }),
});

doc.exportTo(div('hello'), './dist');
// → dist/style.css の class 名は `_<8hex>` 形式
// → dist/index.html の class 属性も同形式
```

### NODE_ENV による自動切替（fallback）

`cssConfig` を省略した場合、`process.env.NODE_ENV === 'production'` で自動的に minify モードが ON になる。

```ts
process.env.NODE_ENV = 'production'; // ← app() 呼び出し前に設定すること
const doc = app(); // 自動で minify ON
```

> ⚠️ **NODE_ENV 固定化に注意**: `app()` を呼び出した時点で `process.env.NODE_ENV` が読み取られ、以後 `minifyClassNames` は不変。テストや動的環境では `NODE_ENV` を `app()` 呼び出し**前**に設定すること。

### config 単独での利用（低レベル API）

```ts
import { CssConfig } from 'draft-ole';

const cfg = new CssConfig({ minifyClassNames: true });
// cfg.minifyClassNames === true
```

`createIdentifierResolver` と組み合わせる場合:

```ts
import { CssConfig, createIdentifierResolver } from 'draft-ole';

const cfg = new CssConfig({ minifyClassNames: true });
const resolver = createIdentifierResolver({ minify: cfg.minifyClassNames });

resolver.resolveClassName('html>body>div'); // → "_a1b2c3d4"
```

### NODE_ENV による自動切替（CssConfig 単独）

`minifyClassNames` を省略した場合、`process.env.NODE_ENV === 'production'` で自動的に ON になる。

```ts
process.env.NODE_ENV = 'production';
const cfg = new CssConfig();
// cfg.minifyClassNames === true
```

### NODE_ENV による自動切替（fallback）

`minifyClassNames` を省略した場合、`process.env.NODE_ENV === 'production'` で自動的に ON になる。

```ts
process.env.NODE_ENV = 'production';
const cfg = new CssConfig();
// cfg.minifyClassNames === true
```

```ts
process.env.NODE_ENV = 'development';
const cfg = new CssConfig();
// cfg.minifyClassNames === false
```

## 優先順位

1. **明示的な `config.minifyClassNames`**（最優先）
2. **`process.env.NODE_ENV === 'production'` fallback**
3. **デフォルト OFF**（`NODE_ENV` 未定義 / 非 production の場合）

例: `minifyClassNames: false` を明示すると、`NODE_ENV='production'` でも OFF のまま:

```ts
process.env.NODE_ENV = 'production';
const cfg = new CssConfig({ minifyClassNames: false });
// cfg.minifyClassNames === false  ← 明示値が NODE_ENV を override
```

## 設計メモ

- `process.env.NODE_ENV` は `CssConfig` コンストラクタ内で 1 度だけ参照される。
  以後は `cfg.minifyClassNames` が不変な解決済み値として保持される。
- `resolveMinifyMode(option, nodeEnv)` 純関数（`src/css/config/resolve-minify-mode.ts`）が
  優先順位ロジックの単一情報源。
- minify ON 時、`generateScopedClassName` / `generateScopedClassNameWithVarName` /
  `generateScopedClassNameWithVarNameAndHash` / `resolveClassName` の全経路で
  `_<8hex>` 形式へ縮退する。
- `resolveId` は minify モードの影響を受けず、常に `_id_<8hex>` プレフィックスを保つ
  （名前空間分離契約）。

## 関連 spec

- 上流: `.kiro/specs/debuggable-class-name/`
- 並行: `.kiro/specs/class-name-varname-extraction/`
- 本 spec: `.kiro/specs/class-name-minify/`
