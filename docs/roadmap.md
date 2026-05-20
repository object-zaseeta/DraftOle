# DraftOle_TS ロードマップ: JS 記述体験の刷新

最終更新: 2026-04-21

## 背景

DraftOle_TS は TypeScript で HTML / CSS / JavaScript を一括宣言的生成する DSL である。CSS 側は要素ビルダのチェーンメソッド（`.margin()` / `.color()` 等）として統合され、書き味が良い。一方 JS 側（JS Vanilla Builder）は 20 以上のフラット関数 import に依存し、`s` / `s2` / `s3` のスコープ引き回しや `asJsExpr` ローカルヘルパの再実装が必要で、書き味が CSS・React と大きく乖離している。

`examples/interactive/mvp-demo.ts` の現状約 350 行は、同機能を React で書くと 50 行程度で済む。このギャップは単なる命名や import 数の問題ではなく、**状態と DOM のバインディングをユーザが手で書いていること**が本質である。

本ロードマップは、この本質的な書き味問題を 3 段階で解決する計画を記録する。

## 最終像（ユーザコードのゴール）

### 例 1: カウンタボタン

```ts
import { Root, button } from 'draftole';

const root = new Root();
const count = root.state(0);

const btn = button({ id: 'btn' })
  .text(count.map(c => c >= 5 ? String(c) : 'Push'))
  .on('click', () => count.set(count.get() + 1));

root.addChild(btn);
```

**要件**:
- 要素ビルダは `.text(...)` / `.on(...)` などをチェーン可能（`this` を返す）
- 要素を変数に束ねて後から `root.addChild(btn)` できる（要素がバインディングを内部バッファし、addChild 時に script へフラッシュする遅延解決モデル）
- `count.map(c => ...)` の関数本体は TS アロー関数として自然に書け、ビルド時にシリアライズされてランタイム JS に埋め込まれる
- 状態 API（`.get` / `.set` / `.map` / `.update` / `.field` / `.each`）以外のクロージャ捕捉は静的エラーとする

### 例 2: Todo アプリ（現行 `examples/interactive/mvp-demo.ts` と同機能）

```ts
import {
  Root, html, head, body, title, meta,
  div, h1, p, section, header, footer,
  label, input, button, ul, li, span, small,
  createTheme, createStyle, FileExporter,
} from 'draftole';

const root = new Root();
const theme = root.createTheme({ /* ...省略... */ });

type Todo = { text: string; done: boolean };
const todos = root.state<Todo[]>([]);
const draft = root.state('');
const activeCount = todos.map(ts => ts.filter(t => !t.done).length);

root.addChild(
  html({ lang: 'ja' },
    head(meta({ charset: 'utf-8' }), title('DraftOle Demo')),
    body(
      div({ id: 'app' },
        section(
          input({ type: 'text' }).value(draft).on('input', e => draft.set(e.target.value)),
          button('追加').on('click', () => {
            if (!draft.get().trim()) return;
            todos.set([...todos.get(), { text: draft.get(), done: false }]);
            draft.set('');
          }),
        ),
        section(
          span(activeCount.map(n => `${n} items`)),
          button('完了をクリア').on('click', () =>
            todos.set(todos.get().filter(t => !t.done))
          ),
        ),
        ul(
          todos.each(todo =>
            li(
              span(todo.field('text')),
              span(todo.field('done').map(d => d ? 'done' : 'active')),
              button('toggle').on('click', () =>
                todo.update(t => ({ ...t, done: !t.done }))
              ),
            ).class(todo.field('done').map(d => d ? 'item done' : 'item'))
          )
        ),
      )
    )
  )
);

new FileExporter().export(root, './output/todo');
```

- 現行 mvp-demo の **約 350 行 → 約 50 行** を目標とする。
- 残る import は HTML 要素 / Root / FileExporter / テーマ・スタイルのみ。JS 系 named import は全滅。

### ランタイム方針の変化

従来の「ゼロランタイム（生成後 JS に DraftOle のコードは一切含まれない）」から、**「ミニマルランタイム（状態購読エンジン数百行を `script.js` に同梱）」** へ後退を許容する。書き味と引き換えに、React 同等の開発体験を得る方針。

## 3 スペック構成

| # | スペック | 目的 | Effort | 依存 |
|---|---|---|---|---|
| 1 | `unified-element-api` | 要素メソッド化・`root.$` / `root.$$`・`root.script`・`root.expr` ファサード。遅延解決モデルの導入 | M (3–7d) | なし |
| 2 | `reactive-state` | `root.state` / `.get` / `.set` / `.map` / `.update` / `.field` / `.each` と要素メソッドへの状態受け入れ。購読ランタイム同梱 | L (1–2w) | (1) |
| 3 | `handler-serialization` | `.on(event, fn)` ハンドラ本体の TS アロー関数 → 出力 JS への安全なシリアライズ。state API 外のクロージャ捕捉を静的エラー化 | M–L | (1)(2) |

### 各段階での `examples/interactive/mvp-demo.ts` の検証姿

- **(1) 完了時点**: import は HTML / CSS / `Root` / `FileExporter` に加え `createVanillaScript` / `ref` 程度。要素メソッド・`root.$` 経由で書かれ、フラット関数 import は消える。状態管理は従来通り手書き JS 文字列。
- **(2) 完了時点**: `root.state` と `.text(state.map(...))` が使える。状態更新は `.set()` を含む命令コードを文字列で書く混在状態。
- **(3) 完了時点**: `.on('click', () => count.set(...))` が TS アロー関数で書ける。最終像と一致。

## 本ロードマップ外で扱う項目

- Swift 版 DraftOle への逆移植（Swift 版にはこの系列の機能は存在しない）
- HTML 要素ファクトリや CSS DSL の仕様変更（本ロードマップは JS 側の記述体験のみを対象）
- サーバーサイドレンダリング（SSR）・ハイドレーション戦略
- 状態管理の永続化（localStorage / URL 同期等）

## 現在のステータス

- **Phase 1 原則との関係**: 本ロードマップはいずれも Swift 版 DraftOle に存在しない TypeScript 独自の API 改善であり、`CLAUDE.md` 記載の「Phase 1 の 1:1 移植原則」の範囲外として扱う。
- **仕様完成（2026-04-22、`/kiro-spec-batch` で一括生成・auto-approve）**:
  - `.kiro/specs/unified-element-api/`（requirements / design / tasks 全て approved、実装待ち）
  - `.kiro/specs/reactive-state/`（requirements / design / tasks 全て approved、実装待ち）
  - `.kiro/specs/handler-serialization/`（requirements / design / tasks 全て approved、実装待ち）
- **Cross-spec review**: 完了（IMPORTANT 2 件 + MINOR 4 件を修正のうえ再レビューで全項目 PASS）
- **次ステップ**: Wave 1 から順に `/kiro-impl unified-element-api` → `reactive-state` → `handler-serialization` を実行
