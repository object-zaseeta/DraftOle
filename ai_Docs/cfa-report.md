# CFA診断レポート

## 対象: DraftOle_TS（プロジェクト全体 `src/`）
## 日時: 2026-02-11

---

## サマリー

| CFA原則 | 準拠度 | 主な課題 |
|---------|--------|---------|
| 1. 分割単位 | 🟡 部分準拠 | 巨大ファイル（966行, 805行）が複数存在。1ファイルに複数クラスが混在 |
| 2. 依存方向 | 🟡 部分準拠 | html/ が css/, js/ の具象クラスを直接 import & new している |
| 3. 契約設計 | 🟢 準拠 | ISP適用済み。インターフェースは小さく安定している |
| 4. 統合点   | 🔴 非準拠 | Composition Root が存在しない。具象生成が Feature 内部に散在 |
| 5. マージ容易性 | 🟡 部分準拠 | 全エクスポート集約の index.ts、全タグ集約の factories.ts が衝突点 |

**総合評価**: ライブラリとしての設計品質は高いが、CFA原則（特に依存方向とDI）に対して構造的な課題がある。Swift版からの1:1移植であるため、TypeScript固有のDIパターンが未適用。

---

## 詳細

### 原則1: 分割単位（人が触る単位で分割）

#### 良い点
- 機能単位のディレクトリ構造: `html/`, `css/`, `js/`, `publisher/`, `utils/`
- サブモジュールの適切な分割: `css/style/`, `css/layout/`, `css/manager/`
- protocols が独立ディレクトリとして分離済み
- 76ファイルに分散された実装（平均約150行/ファイル）

#### 違反箇所

- 🔴 `src/html/attributes/attribute-builder.ts` — **966行**、6クラスが1ファイルに混在（BaseAttributeBuilder, FormAttributeBuilder, InputAttributeBuilder, ImageAttributeBuilder, LinkAttributeBuilder, ButtonAttributeBuilder）。異なる要素種別の属性ビルダーが同居しており、特定の要素種別の属性変更が他に波及するリスクがある。
- 🔴 `src/html/tags/factories.ts` — **805行**、56個のタグファクトリ関数が1ファイルに集約。新タグ追加時に必ずこのファイルを変更する必要がある。
- 🟡 `src/html/attributes/attribute-keys.ts` — **613行**、全属性型定義（BooleanAttributeKey, KeyValueAttributeKey, AriaAttributeKey, InputType, ButtonType）が1ファイルに集約。
- 🟡 `src/html/elements/html-tag.ts` — **381行**。抽象基底クラスとして許容範囲だが、CSS/JS の具象生成ロジックを含むため肥大化傾向。
- 🟡 `src/css/layout/position-maker/css-position-maker.ts` — **347行**。単一クラスだが複雑なレイアウト計算ロジックを含む。
- 🟡 `src/publisher/file-exporter.ts` — **329行**。HTML/CSS/JS出力を1クラスで担当。

#### 推奨アクション

| 優先度 | ファイル | アクション |
|--------|---------|-----------|
| 高 | `attribute-builder.ts` | ビルダーごとにファイル分割（`base-attribute-builder.ts`, `form-attribute-builder.ts` 等） |
| 高 | `factories.ts` | カテゴリ別に分割（`structure-tags.ts`, `form-tags.ts`, `text-tags.ts` 等） |
| 中 | `attribute-keys.ts` | 属性種別ごとにファイル分割 |
| 低 | `css-position-maker.ts` | 現状維持可。将来肥大化する場合に分割検討 |

---

### 原則2: 依存方向（変更が内側に入らない）

#### 良い点
- `utils/` は他モジュールに依存しない（`Renderable`, `UnitStyle`, `DraftOleError` 等の安定した型のみ）
- `css/`, `js/` は `html/` に直接依存しない
- `publisher/` は `node:fs` と自身の型のみに依存（他モジュール非依存）
- protocol 層でインターフェースを定義し、依存を抽象化する意図がある

#### 違反箇所

- 🔴 `src/html/elements/html-tag.ts:20` — `CssManager`（具象クラス）を `css/manager/css-manager.js` から直接import
  ```typescript
  import { CssManager } from '../../css/manager/css-manager.js';
  ```
- 🔴 `src/html/elements/html-tag.ts:26` — `JQueryManager`（具象クラス）を `js/jquery-manager.js` から直接import
  ```typescript
  import { JQueryManager } from '../../js/jquery-manager.js';
  ```
- 🔴 `src/html/elements/html-tag.ts:87` — 具象クラスを直接インスタンス化
  ```typescript
  private _css: CssManagerInstance = new CssManager();
  ```
- 🔴 `src/html/elements/html-tag.ts:93` — 具象クラスを直接インスタンス化
  ```typescript
  private _jqm: JQueryManagerInstance = new JQueryManager();
  ```
- 🟡 `src/html/elements/root.ts:17` — `JQueryHelper`（具象クラス）を `js/` から直接import
  ```typescript
  import { JQueryHelper } from '../../js/jquery-helper.js';
  ```
- 🟡 `src/html/protocols/css-manager-type.ts:9` — protocol定義が `css/` の具象型に依存
  ```typescript
  import type { CssManagerInstance } from '../../css/manager/css-manager-instance-type.js';
  ```
- 🟡 `src/html/protocols/jquery-manager-protocol.ts:10-11` — protocol定義が `js/` の型に依存
  ```typescript
  import type { JQueryMethodType } from '../../js/jquery-method-type.js';
  import type { JQueryManagerInstance } from '../../js/jquery-manager.js';
  ```

#### 依存方向の図

```
期待される方向: html/ ← css/, js/ （外側が内側を参照）
実際の方向:     html/ → css/, js/ （内側が外側を参照 ❌）

utils/ (内側・安定)
  ↑ 参照される（正しい方向）
html/ (中間)
  ↓ css/ を直接 new（逆方向 ❌）
  ↓ js/ を直接 new（逆方向 ❌）
css/, js/ (外側・変更頻度高)

publisher/ (独立) — 他モジュールへの依存なし ✅
```

#### 推奨アクション

| 優先度 | 対象 | アクション |
|--------|------|-----------|
| 高 | `html-tag.ts` | CssManager / JQueryManager の具象依存を除去。ファクトリまたはDIで注入 |
| 高 | `html/protocols/` | `CssManagerInstance`, `JQueryManagerInstance` を html/protocols/ 側で定義（または utils/ に移動）し、css/, js/ がそれを実装する形に反転 |
| 中 | `root.ts` | JQueryHelper への直接依存を除去 |

---

### 原則3: 契約設計（インターフェイスの最小化・安定化）

#### 良い点
- **ISP適用済み**: HTMLTagProtocol を ChildManageable(3メンバー) + AttributeManageable(2メンバー) + Renderable(2メンバー) に分割
- **CssManagerInstance**: 6メンバーで適度なサイズ
- **HtmlAttributeShape**: 最小限の3メンバー（key, attributeValue, renderAttribute）
- **JQueryManagerProtocol**: 3メソッド + 1アクセサで適切なサイズ
- **CssManagerType**: 1メソッド + 1アクセサで最小限

#### 軽微な課題

- 🟡 `src/html/protocols/attribute-builder-protocol.ts` — **AttributeBuilderProtocol: 15メソッド**。ビルダーパターンのため許容範囲だが、役割別の分割（基本属性/ARIA属性/クラス管理）も検討可能
- 🟡 `src/utils/errors.ts:69-73` — `DraftOleErrorCode` が全モジュールのエラーコードを union で結合。モジュール追加時に必ず変更が必要

#### インターフェースメンバー数一覧

| インターフェース | メンバー数 | 評価 |
|-----------------|-----------|------|
| Renderable | 2 | ✅ 最小限 |
| HtmlAttributeShape | 3 | ✅ 最小限 |
| ChildManageable | 3 | ✅ 適切 |
| AttributeManageable | 2 | ✅ 最小限 |
| HTMLTagProtocol | 4 + 継承 | ✅ 適切（合成による責務分割） |
| CssManagerType | 2 | ✅ 最小限 |
| JQueryManagerProtocol | 4 | ✅ 適切 |
| CssManagerInstance | 6 | ✅ 適切 |
| CssStyleManagerType | 2 | ✅ 最小限 |
| CssPositionMakerType | 多数 | 🟡 やや大きいが責務単一 |
| AttributeBuilderProtocol | 15 | 🟡 やや大きい |

#### 推奨アクション

| 優先度 | 対象 | アクション |
|--------|------|-----------|
| 低 | `errors.ts` | エラーコードをモジュールごとに分離（各モジュールの errors/ に移動） |
| 低 | `AttributeBuilderProtocol` | 必要に応じてAriaBuilderProtocol等に分割 |

---

### 原則4: 統合点（DI/配線は1箇所に寄せる）

#### 違反箇所

- 🔴 **Composition Root が存在しない**: プロジェクト内にDI/配線を集約した場所がない
- 🔴 `src/html/elements/html-tag.ts:87` — `new CssManager()` を直接呼び出し。Feature内部で具象型をインスタンス化
  ```typescript
  private _css: CssManagerInstance = new CssManager();
  ```
- 🔴 `src/html/elements/html-tag.ts:93` — `new JQueryManager()` を直接呼び出し
  ```typescript
  private _jqm: JQueryManagerInstance = new JQueryManager();
  ```
- 🟡 `src/css/manager/css-manager.ts:68-70` — CssManager 内部で CssConfig, CssPositionMaker, CssStyleManager を直接生成
  ```typescript
  this.config = config ?? new CssConfig();
  this.layout = new CssPositionMaker(tagPath);
  this.styleManager = new CssStyleManager();
  ```
- 🟡 `src/css/style/html-style.ts:81-117` — HtmlStyle 内部で13個の具象スタイルクラスを直接生成
  ```typescript
  readonly font: CSSFont = new CSSFont();
  readonly backgroundColor: CSSBackground = new CSSBackground();
  // ... 11個のスタイルクラス
  ```

#### 補足

- `src/index.ts`（218行）は re-export のみで、DI/配線の役割は持っていない
- シングルトンパターンやグローバル状態は検出されなかった（これは良い点）
- テスト時にモック注入ができない設計になっている

#### 推奨アクション

| 優先度 | 対象 | アクション |
|--------|------|-----------|
| 高 | プロジェクト全体 | Composition Root を導入（例: `src/composition-root.ts` または `src/app/` ディレクトリ） |
| 高 | `html-tag.ts` | コンストラクタまたはファクトリ関数で CssManagerInstance / JQueryManagerInstance を注入可能にする |
| 中 | `css-manager.ts` | CssConfig, CssPositionMaker 等をコンストラクタ引数で注入可能にする |
| 低 | `html-style.ts` | 13スタイルクラスの直接生成は許容範囲。将来の拡張時に検討 |

---

### 原則5: マージ容易性（小さな差分を高頻度で）

#### 良い点
- Trunk-based ブランチ戦略を採用
- テストが充実（56ファイル、2,371テスト）
- モジュールごとに `index.ts` で re-export（内部構造の変更が外に波及しにくい）
- シングルトンやグローバル状態がない

#### 高衝突リスクファイル

- 🔴 `src/index.ts`（218行）— **全モジュールのエクスポートが集約**。機能追加・変更のたびに必ず変更が必要。最も高頻度で変更されるファイル
- 🔴 `src/html/tags/factories.ts`（805行）— **56タグファクトリ関数が集約**。新タグ追加時に必ず変更
- 🟡 `src/html/tags/tag-type.ts`（228行）— **全タグタイプ定義が集約**。タグ追加時に必ず変更
- 🟡 `src/css/style/style-keys.ts`（224行）— **146 CSSプロパティキーが集約**。プロパティ追加時に必ず変更
- 🟡 `src/html/attributes/attribute-keys.ts`（613行）— **全属性型定義が集約**。属性追加時に必ず変更
- 🟡 `src/utils/errors.ts`（165行）— **全モジュールのエラーコード型が集約**。新エラーコード追加時に衝突リスク
- 🟡 `src/utils/renderable.ts` — 19ファイルから参照される最も依存される型定義（ただし安定しており変更頻度は低い）

#### 推奨アクション

| 優先度 | 対象 | アクション |
|--------|------|-----------|
| 高 | `factories.ts` | カテゴリ別に分割（構造系, フォーム系, テキスト系, メディア系 等） |
| 中 | `index.ts` | モジュール別 re-export に分割（例: `index-html.ts`, `index-css.ts` 等）またはバレルファイル戦略の見直し |
| 中 | `errors.ts` | エラーコード型をモジュールごとに分散配置 |
| 低 | `style-keys.ts` | カテゴリ別に分割（現状は const object なので衝突リスクは中程度） |
| 低 | `tag-type.ts` | 現状維持可。タグ追加頻度が低いため |

---

## 改善ロードマップ

| 優先度 | 対象 | アクション | 推奨spec |
|--------|------|-----------|---------|
| 高 | 依存方向の修正 | html-tag.ts から css/js 具象クラスへの依存を除去。DI/ファクトリパターン導入 | `spec/fix-dependency-direction` |
| 高 | Composition Root導入 | CssManager/JQueryManager の生成を1箇所に集約。テスト時のモック注入を可能にする | `spec/composition-root` |
| 高 | attribute-builder.ts 分割 | 966行の巨大ファイルをビルダーごとに6ファイルに分割 | `spec/split-attribute-builders` |
| 高 | factories.ts 分割 | 805行のファクトリ関数をカテゴリ別に分割 | `spec/split-tag-factories` |
| 中 | protocol 依存反転 | html/protocols/ で定義したインターフェースを css/js が実装する形に反転 | `spec/fix-dependency-direction`（上記と統合） |
| 中 | index.ts 分割 | エクスポート集約ポイントの分散 | `spec/refactor-barrel-exports` |
| 中 | errors.ts 分散 | エラーコード型をモジュールごとに配置 | `spec/distribute-error-codes` |
| 低 | attribute-keys.ts 分割 | 属性型定義をカテゴリ別に分割 | — |
| 低 | style-keys.ts 分割 | CSSプロパティキーをカテゴリ別に分割 | — |

---

## 補足: プロジェクト特性を考慮した所見

### Swift版移植プロジェクトとしての評価

本プロジェクトはSwift版DraftOleの1:1移植であり、Phase 1の方針として「機能追加・設計改善を行わない」とされている。そのため、以下の点を考慮する必要がある:

1. **依存方向の違反はSwift版の設計を継承したもの**: Swift の Protocol Extension による依存注入パターンがTypeScriptに直接マッピングされていない
2. **巨大ファイルはSwift版の構造をそのまま移植した結果**: Swift では extension で分散できるが、TypeScript では1ファイルに集約される傾向がある
3. **Composition Root の欠如はライブラリとしては一般的**: アプリケーションと異なり、ライブラリではユーザーが直接具象クラスを生成するパターンも許容される

### 推奨する改善フェーズ

1. **Phase A（高優先度）**: 依存方向の修正 + Composition Root導入 → テスト容易性の向上
2. **Phase B（中優先度）**: 巨大ファイルの分割 → マージ容易性の向上
3. **Phase C（低優先度）**: 型定義の分散 → 将来の拡張性確保

### ライブラリ固有の考慮事項

- ユーザー向けAPIの後方互換性を維持しながらCFA原則を適用する必要がある
- `index.ts` のエクスポート構造はパブリックAPIであり、変更は破壊的になりうる
- Composition Root の導入は内部リファクタリングであり、外部APIに影響を与えずに実施可能
