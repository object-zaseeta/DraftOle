/**
 * `ScriptStateHandle<T>` の実装。
 *
 * 設計書 `design.md` の「ScriptScope.state / ScriptStateHandle<T>」に対応。
 * ScriptScope 内でハンドラが `s.state(ref).set(v)` / `.update(body)` / `.get()` / `.field(k)`
 * を呼び出すための軽量ファサード。
 *
 * - `.set(value)` → `state-set` コマンドを `VanillaScope._append` に積む
 * - `.update(body)` → `state-update` コマンドを `VanillaScope._append` に積む
 * - `.get()` → `State.get()` と等価な JsExpr を返す（_append しない）
 * - `.field(key)` → フィールドに対応する派生 ScriptStateHandle を返す
 *
 * R-4 決定: 実体は `{ ref: ReadableState<T>, scope: VanillaScope }` のみ。
 *
 * Requirements: 6.1, 6.2, 6.3
 */

import type { JsExpr } from '../types.js';
import type { VanillaScope } from '../vanilla-script-builder.js';
import type { ReadableState } from './state.js';
import { createStateExpr } from './state.js';

/**
 * ハンドラ内から状態を更新するための軽量ハンドルインタフェース。
 *
 * design.md: ScriptStateHandle<T>
 */
export interface ScriptStateHandle<T> {
  /** 参照のみ（State.get と等価）。_append しない */
  get(): JsExpr;

  /** `state-set` コマンドを scope に _append する（Req 6.2）*/
  set(value: T | JsExpr): void;

  /** `state-update` コマンドを scope に _append する（Req 6.2）*/
  update(body: JsExpr): void;

  /** フィールドに対応する派生 ScriptStateHandle を返す（Req 6.1）*/
  field<K extends keyof T>(key: K): ScriptStateHandle<T[K]>;
}

/**
 * 任意の JsExpr か生値かを判定するタイプガード。
 * `__jsExpr: true` を持つオブジェクトを JsExpr とみなす。
 */
function isJsExpr(value: unknown): value is JsExpr {
  return typeof value === 'object' && value !== null && (value as Record<string, unknown>).__jsExpr === true;
}

/**
 * 生値（T）を JS リテラル式文字列に変換する内部ユーティリティ。
 * - 文字列・数値・真偽値・null・配列・オブジェクトは JSON.stringify で安全にエンコード。
 */
function encodeValue(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * ScriptStateHandle<T> の実装クラス。
 *
 * R-4 決定: 実体は `{ runtimeId: string, scope: VanillaScope }` のみ。
 */
class ScriptStateHandleImpl<T> implements ScriptStateHandle<T> {
  private readonly _runtimeId: string;
  private readonly _scope: VanillaScope;

  constructor(runtimeId: string, scope: VanillaScope) {
    this._runtimeId = runtimeId;
    this._scope = scope;
  }

  /**
   * `__draftole__.state(id).get()` 形式の JsExpr を返す。
   * _append しない（式位置専用）。
   * Req 6.1
   */
  get(): JsExpr {
    return createStateExpr(this._runtimeId);
  }

  /**
   * `state-set` コマンドを _append する。
   * value が JsExpr の場合はそのまま、T の即値の場合は JSON エンコードする。
   * Req 6.2
   */
  set(value: T | JsExpr): void {
    const valueExpr: JsExpr = isJsExpr(value)
      ? value
      : {
          __jsExpr: true as const,
          code: encodeValue(value),
          eq: (other) => {
            void other;
            throw new Error('eq not supported on encoded literal');
          },
          ne: (other) => {
            void other;
            throw new Error('ne not supported on encoded literal');
          },
          or: (fallback) => {
            void fallback;
            throw new Error('or not supported on encoded literal');
          },
          trim: () => {
            throw new Error('trim not supported on encoded literal');
          },
          isFalsy: () => {
            throw new Error('isFalsy not supported on encoded literal');
          },
          isTruthy: () => {
            throw new Error('isTruthy not supported on encoded literal');
          },
        };

    this._scope._append({
      type: 'state-set',
      id: this._runtimeId,
      value: valueExpr,
    });
  }

  /**
   * `state-update` コマンドを _append する。
   * Req 6.2
   */
  update(body: JsExpr): void {
    this._scope._append({
      type: 'state-update',
      id: this._runtimeId,
      body,
    });
  }

  /**
   * フィールドに対応する派生 ScriptStateHandle を返す。
   * フィールドの runtimeId は `{parentId}.{key}` 形式とする（ランタイムの慣習に準じる）。
   * Req 6.1
   */
  field<K extends keyof T>(key: K): ScriptStateHandle<T[K]> {
    const derivedId = `${this._runtimeId}.${String(key)}`;
    return new ScriptStateHandleImpl<T[K]>(derivedId, this._scope);
  }
}

/**
 * ReadableState<T> から ScriptStateHandle<T> を生成するファクトリ。
 *
 * ScriptScope の `.state<T>(ref)` メソッドから呼ばれる。
 *
 * @param ref - `_runtimeId` を持つ ReadableState（State / Computed）
 * @param scope - コマンドを _append する VanillaScope
 */
export function createScriptStateHandle<T>(
  ref: ReadableState<T>,
  scope: VanillaScope,
): ScriptStateHandle<T> {
  return new ScriptStateHandleImpl<T>(ref._runtimeId, scope);
}
