/**
 * `src/js/vanilla` モジュールの公開エントリ。
 *
 * 本モジュールは「型安全なバニラ JS コード生成 DSL」の公開 API を一箇所に集約する。
 * 以下のランタイム関数と型のみを外部（`src/index.ts` 経由で `draft-ole` パッケージ）に
 * 露出する。命令レコード型（`VanillaCommand`）、低レベルレンダラ（`renderCommand` /
 * `renderCommands`）、内部ファクトリ（`_makeJsExpr` / `_makeJsBoolExpr` /
 * `_makeScopedElementRef` 等）、および `fromSelector` / `fromExpr` / `listFromSelector`
 * / `listFromExpr` といった内部用の参照生成関数は意図的に非公開とする。
 *
 * 対応: 設計書 `design.md` の「index (公開 API)」節、要件 7.3 および 8.1。
 *
 * 公開ランタイム:
 * - ファクトリ: `createVanillaScript` / `ref` / `attach`
 * - イベント:   `on` / `onDomReady`
 * - クエリ:     `query` / `queryAll` / `forEach` / `filterNot` / `length`
 * - DOM:        `toggleClass` / `addClass` / `removeClass` / `containsClass` /
 *              `setText` / `getText` / `setValue` / `getValue` / `setStyle`
 * - ツリー:     `appendChild` / `remove` / `removeAll`
 *
 * 公開型:
 * - `ElementRef` / `ElementListRef` / `VanillaScript` / `VanillaScope`
 * - `JsExpr` / `JsBoolExpr` / `EventArgRef` / `WritableStyleKey`
 */

// ── ランタイム: ファクトリ ──
export { createVanillaScript } from './vanilla-script-builder.js';
export { ref } from './element-ref.js';
export { attach } from './integration.js';

// ── ランタイム: イベント API ──
export { on, onDomReady } from './event-api.js';

// ── ランタイム: クエリ API ──
export { query, queryAll, forEach, filterNot, length } from './query-api.js';

// ── ランタイム: DOM API ──
export {
  toggleClass,
  addClass,
  removeClass,
  containsClass,
  setText,
  getText,
  setValue,
  getValue,
  setStyle,
} from './dom-api.js';

// ── ランタイム: ツリー API ──
export { appendChild, remove, removeAll } from './tree-api.js';

// ── 公開型 ──
export type {
  ElementRef,
  ElementListRef,
  JsExpr,
  JsBoolExpr,
  EventArgRef,
  WritableStyleKey,
} from './types.js';

export type { VanillaScript, VanillaScope } from './vanilla-script-builder.js';
