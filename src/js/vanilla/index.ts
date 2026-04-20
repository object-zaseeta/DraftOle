/**
 * `src/js/vanilla` モジュールの公開エントリ。
 * 共有型と、後続タスクで追加される公開 API（`createVanillaScript` / `ref` / `attach` 等）を
 * ここから再エクスポートする。
 */

// Phase 1: 共有型
export type {
  JsExpr,
  JsBoolExpr,
  ElementEventName,
  EventArgRef,
  StringKeysOf,
  WritableStyleKey,
} from './types.js';
