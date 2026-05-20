/**
 * `src/js/vanilla` モジュールの公開エントリ。
 *
 * unified-element-api 仕様 Task 5.1 による再編:
 * - ランタイム公開: `createVanillaScript` / `ref`（後続スペックが依存）
 * - 型のみ公開: `ScriptScope` / `SelectorRef` / `CollectionRef` / `ExprFactory` /
 *   `JsExpr` / `JsBoolExpr`
 * - 旧フラット関数群（`on` / `query` / `addClass` 等）は `internal/` に隔離し、
 *   公開面から除外する（Req 5.1）
 *
 * 対応: unified-element-api 設計書 §index.ts バレル、Req 5.1, 5.5
 */

// ── ランタイム: ファクトリ ──
export { createVanillaScript } from './vanilla-script-builder.js';
export { ref } from './element-ref.js';
export { emitHandler } from './emit-handler.js';

// ── 公開型 ──
export type { ScriptScope } from './script-scope.js';
export type { SelectorRef, CollectionRef } from './selector-ref.js';
export type { ExprFactory } from './expr-factory.js';
export type { JsExpr, JsBoolExpr } from './types.js';
export type { State, Computed, ReadableState, EachBinding } from './state/state.js';
export type { StateJsAccessor } from './state/state-js-accessor.js';
export type { ScriptStateHandle } from './state/script-state-handle.js';
