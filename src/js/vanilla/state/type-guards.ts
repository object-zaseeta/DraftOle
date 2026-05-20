/**
 * 共有型ガードモジュール。
 *
 * 本モジュールは `dry-violation-fixes` 仕様の Requirement 8
 * 「isReadableState 型ガードの統合」に対応する。
 *
 * `element-methods.ts` と `selector-ref.ts` に重複していたローカル型ガード関数を
 * このモジュールに統合し、単一の信頼できる実装を提供する。
 */

import type { ReadableState } from './state.js';

/**
 * `ReadableState<T>` かどうかを判別するタイプガード。
 *
 * `_runtimeId` フィールドの存在で判定する（design.md の判別方法）。
 * `element-methods.ts` の旧 `isReadableState` / `selector-ref.ts` の旧 `isState` を統合。
 *
 * @param v - 判定対象の値
 * @returns `v` が `ReadableState<T>` であれば `true`
 */
export function isReadableState<T>(v: unknown): v is ReadableState<T> {
  return typeof v === 'object' && v !== null && '_runtimeId' in v;
}
