# DraftOle_TS `Root` 責務分離計画

更新日: 2026-05-05

## この文書の目的

この文書は P2-B `Root` 責務分離の設計を固定するための仕様である。

現状の `Root` は、1 クラスの中に次の責務を同居させている。

- document tree の所有
- static render の境界
- global CSS / doctype の document-level 制御
- runtime state / script / selector facade の入口
- JS 収集と tree-shaking
- export のショートカット
- publisher 向け内部状態の提供

このままでも機能上は動くが、`page` と `App` を分けていく段階では責務が広すぎる。次段階の安全な実装変更のため、ここで **何を `Root` に残し、何を外へ出すか** を固定する。

---

## 1. 結論

`Root` は将来的に **document tree の所有者兼最小オーケストレータ** へ縮退させる。

責務の再配置方針は次の通り。

- document 系責務は `src/document/*`
- runtime 系責務は `src/runtime/*`
- export / publish 系責務は `src/publisher/*`
- `Root` 自体は互換維持の façade として残す

設計原則を 1 行で書くとこうなる。

> `Root` は「全部を実装する場所」ではなく、「document / runtime / export を束ねる互換ファサード」に下げる。

---

## 2. 現状の `Root` 棚卸し

`src/html/elements/root.ts` を責務単位で分解すると、現在の `Root` は次の 4 層を持っている。

### 2.1 Document 境界

- `_children` の所有
- `addChild(...)`
- `protoRender(...)`
- `render()`
- `setDoctype(...)`
- `_doctype`
- `_globalCss`
- `addGlobalCss(...)`
- `collectCssStyleString()`
- `RootOptions.reset`

### 2.2 Runtime 境界

- `script`
- `expr`
- `$`
- `$$`
- `getOrCreateRootScope(...)` との連携
- `state(...)`
- `_stateRegistry`
- `renderVanillaScript()`
- `collectJsContent()`
- `collectUsedMethods()`
- `renderJs()`

### 2.3 Export 境界

- `export(...)`
- `FileExporter.exportFromRoot(root, ...)` へのショートカット
- `FileExporter` が `root.render()` / `root.collectCssStyleString()` / `root.renderVanillaScript()` / `root._stateRegistry` へ踏み込む構造

### 2.4 Compatibility / legacy 境界

- `renderJs()` の jQuery helper tree-shaking 経路
- `Root` に runtime API を直接載せる legacy な主導線
- `page` と `App` の両方が内部的に `Root` を再利用する構造

---

## 3. 問題点

### 3.1 `Root` が too many reasons to change になっている

たとえば次の変更が、すべて `root.ts` に波及する。

- static page の出力変更
- runtime prelude の変更
- state registry の変更
- exporter の挙動変更
- selector facade の変更
- reset CSS の変更

これは `page` と `App` の境界を内部構造でも分けたい現段階では不利である。

### 3.2 publisher が `Root` の内部へ踏み込みすぎている

`src/publisher/file-exporter.ts` は現在、次の `Root` 内部構造に依存している。

- `root.render()`
- `root.collectCssStyleString()`
- `root.renderVanillaScript()`
- `root._stateRegistry`

特に `_stateRegistry` への依存は、publisher が runtime の内部状態に直接結びついていることを意味する。ここは `export context` へ切り出すべきである。

### 3.3 `page` と `App` の違いが内部に反映されていない

公開面ではすでに

- `page`: static-first
- `App`: runtime-aware

という判断を入れたが、内部では両者とも `Root` に集約されたままである。

その結果、`page` が使わない runtime 系 API まで `Root` に抱え込んでいる。

### 3.4 `reset` / global CSS の責務が混ざっている

`reset` は document-level policy であり、theme CSS や `ul { list-style: none; }` のような利用者 CSS と性質が違う。

にもかかわらず現状は、両方が `addGlobalCss(...)` 近辺で混ざって見える。これは API 意味として分けておきたい。

---

## 4. 分離後の責務配置

### 4.1 `Root` に残す責務

`Root` に残すのは次の最小責務とする。

- child tree の所有
- `HtmlTag` ルートとしての構造上の境界
- `addChild(...)` の最小オーケストレーション
- document / runtime / export context の façade
- 互換維持の public shortcut

`Root` は最終的に「文書を持つ箱」であり、「runtime 実装本体」や「publisher 実装本体」ではない。

### 4.2 `src/document/document-context.ts` に出す責務

`document-context` は static document 側の状態を持つ。

責務:

- doctype の有無
- global CSS の蓄積
- reset policy
- render context の初期化
- HTML / CSS 収集の document-level 組み立て

ここに移す候補:

- `_doctype`
- `setDoctype(...)`
- `_globalCss`
- `addGlobalCss(...)`
- `collectCssStyleString()`
- `protoRender(...)` での registry reset 起点のうち document 側ロジック

注意:

- child traversal そのものは `Root` / `HtmlTag` 側に残ってよい
- ただし document-level policy は `document-context` が持つ

### 4.3 `src/runtime/runtime-context.ts` に出す責務

`runtime-context` は DraftOle runtime graph の所有者である。

責務:

- `ScriptScope` の生成と保持
- `ExprFactory` の生成と保持
- selector facade (`$`, `$$`)
- `StateRegistry` の保持
- `state(...)` の採番と登録
- Vanilla command の JS 文字列化
- jQuery helper / prelude を含む runtime 出力の組み立て材料

ここに移す候補:

- `_vanillaBuilder`
- `script`
- `expr`
- `$`
- `$$`
- `_stateRegistry`
- `state(...)`
- `renderVanillaScript()`
- `collectJsContent()`
- `collectUsedMethods()`
- `renderJs()`

`Root.addChild(...)` が child の pending command を flush するときは、`runtime-context` が scope を提供する。

### 4.4 `src/publisher/export-context.ts` に出す責務

`export-context` は publisher が必要とする **read-only snapshot** を表す。

責務:

- export 時点の HTML
- export 時点の CSS
- export 時点の user JS
- runtime prelude 要否
- state-init / derive-state コマンド列
- file naming / wrapping に必要な publish metadata

重要なのは、publisher が `Root` の private / package-private に触れずに済む形にすることである。

`FileExporter` は将来的に `Root` ではなく、`ExportContext` 相当を受け取る形へ寄せる。

---

## 5. 目標 dependency 方向

分離後の依存方向は次で固定する。

### 5.1 document は runtime を知らない

`src/document/*` は次に依存してよい。

- `html/*`
- `css/*`
- shared utility

依存してはいけないもの:

- `js/vanilla/*`
- `runtime/*`
- `publisher/*`

### 5.2 runtime は publisher を知らない

`src/runtime/*` は runtime graph と command までを知ればよい。

依存してはいけないもの:

- `publisher/*`
- `node:fs`
- HTML ファイルへの `<script>` タグ挿入ロジック

### 5.3 publisher は `Root` の内部状態へ直接触れない

`src/publisher/*` は最終的に次だけへ依存する。

- `ExportContext`
- publish option
- file system

依存してはいけないもの:

- `Root._stateRegistry`
- `Root` の private field
- runtime registry の実装詳細

### 5.4 `Root` は composition root 的な façade に寄る

`Root` は `document-context` / `runtime-context` / `export-context` の配線点として残る。
ただし、個別責務の実装本体は持たない。

---

## 6. 分離後の API イメージ

これは即時実装ではなく、設計の目印である。

```ts
class Root extends HtmlTag {
  private readonly _document: DocumentContext;
  private readonly _runtime: RuntimeContext;

  addChild(child: HTMLTagProtocol): this;

  render(): string;          // _document 経由
  export(path: string): void; // ExportContext を組み立てて publisher へ渡す

  // compatibility shortcuts
  state<T>(initial: T): State<T>; // _runtime へ委譲
  get script(): ScriptScope;      // _runtime へ委譲
}
```

publisher 側は次のイメージに寄せる。

```ts
interface ExportContext {
  html: string;
  css: string;
  js: string;
  runtimePrelude?: string;
}
```

---

## 7. `ARCH-3` publisher 踏み込み箇所の洗い出し

次が現在の過剰結合点である。

### A. `FileExporter.exportFromRoot(root, outputPath)`

問題:

- publisher が `Root` を直接入力に取っている
- export 用 snapshot の責務と `Root` 収集ロジックが混ざる

方針:

- `Root` から `ExportContext` を取得する段を追加する
- `FileExporter` は `ExportContext` を受け取る層へ寄せる

### B. `root._stateRegistry` 参照

問題:

- publisher が runtime registry の中身と生存戦略を知っている

方針:

- `runtime-context` が `state-init` / `derive-state` 列を publishable data として返す
- publisher は registry 自体を見ない

### C. `root.renderVanillaScript()` 依存

問題:

- publisher が user JS 収集 API を `Root` に要求している

方針:

- JS 文字列は `runtime-context` の責務
- publisher には最終 JS 文字列だけを渡す

---

## 8. `ARCH-4` reset / global CSS 方針

### 8.1 `reset` の意味

`reset` は利用者 CSS ではなく、document-level baseline policy として扱う。

したがって API 意味は次のように固定する。

- `reset`: document baseline
- `addGlobalCss(...)`: 利用者が足す global rule

この 2 つは同じ配列に積まれていても、概念上は別責務である。

### 8.2 `reset` のデフォルト値

現時点では **`reset: false` を維持** する。

理由:

- 既存 snapshot / example への影響が広い
- `margin: 0; padding: 0;` まで含むため、単なる box-sizing 追加より影響が大きい
- static page の見た目既定値を一括変更するには監査が必要

ただし、新規の standalone HTML 例では `reset: true` を積極的に検討してよい。

### 8.3 `mvp-demo.ts` の `"* { box-sizing: border-box; }"` について

理想的には `Root({ reset: true })` へ寄せたい。

ただし今回は **まだ置き換えない**。

理由:

- `reset: true` は box-sizing だけでなく margin / padding まで変更する
- `mvp-demo.ts` は現状 snapshot / 見た目差分の影響範囲確認なしに切り替えるとノイズが大きい
- この段階で必要なのは API 意味の固定であり、視覚差分を伴う実コード変更ではない

したがって現在の判断は次である。

- 方針としては `reset` に寄せる
- ただし actual replacement は layout audit と snapshot 更新を伴う次段階で行う
- その間、`mvp-demo.ts` の明示 CSS は暫定互換として許容する

---

## 9. 実装順

実装は次の順で行う。

1. `docs/root-refactor-plan.md` を正本として固定
2. `tests/architecture/root-boundary.test.ts` を `Root` 用の依存境界テストへ作り替える
3. `src/document/document-context.ts` を追加し、doctype / globalCss / reset policy を受ける
4. `src/runtime/runtime-context.ts` を追加し、state / script / selector / JS 収集を受ける
5. `src/publisher/export-context.ts` を追加し、publisher への受け渡し面を固定する
6. `Root` は façade 化し、既存 public API は委譲で維持する
7. `FileExporter` から `Root` 内部参照を削る

---

## 10. この仕様で固定したこと

1. `Root` は将来的に document tree の所有者兼 façade へ縮退させる
2. document / runtime / export は別モジュールへ分ける
3. publisher は `Root._stateRegistry` のような内部状態へ直接触れない
4. `reset` は document baseline policy であり、`addGlobalCss(...)` と概念上分ける
5. `reset` のデフォルトは今は `false` を維持する
6. `mvp-demo.ts` の box-sizing 明示指定は、理由付きの暫定互換として維持する

この 6 点が揃っていれば、P2 の `Root` 責務分離設計は次段階へ進める。

---

## 関連文書

- `docs/app-boundary.md`
- `docs/app-api-surface.md`
- `docs/interactive-island-decision.md`
- `.internal/ai_Docs/myTask.md`
