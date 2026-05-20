/**
 * テンプレートコンテキスト専用の State 実装
 *
 * - `DerivedTemplateState<T>`: 親テンプレート state の ID と変換関数（JsExpr）を保持する
 *   読み取り専用 State プロキシ。
 * - `isDerivedTemplateState<T>`: DerivedTemplateState かどうかを判別する型ガード。
 *
 * 設計書 `design.md` の「State DSL Layer: DerivedTemplateState」に対応。
 *
 * Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.4, 3.1, 3.2, 3.3, 5.1
 */

import type { JsExpr } from '../types.js';
import type { StateRegistry } from './registry.js';
import type { ReadableState, State, Computed } from './state.js';
import { DraftoleStateMarker, makeJsExpr, buildTransformCode } from './state.js';
import { StateJsAccessorImpl, type StateJsAccessor } from './state-js-accessor.js';

// ────────────────────────────────────────────────────────────
// DerivedTemplateState<T>
// ────────────────────────────────────────────────────────────

/**
 * 親テンプレート state の ID と変換関数（JsExpr）を保持する読み取り専用 State プロキシ。
 *
 * - `_runtimeId` は `_parentTemplateId` と同値（`rewriteCommandTarget` の startsWith チェックを
 *   既存のまま通すために親 ID を保持する）。
 * - `.map()` / `.field()` は多段チェーンがスコープ外のため即時 `Error` をスロー。
 * - `.get()` / `.subscribe()` はテンプレート捕捉フェーズ外での誤用を防ぐため即時 `Error` をスロー。
 *
 * design.md: DerivedTemplateState
 */
export class DerivedTemplateState<T> implements ReadableState<T> {
  /** 構造的マーカー（Design D-7）: transformer が State 型を識別するために使用。
   * `declare` なのでランタイムには存在しない（型レイヤのみ）。 */
  declare readonly [DraftoleStateMarker]: 'state';

  /**
   * 親の _runtimeId と同値（例: "s0.itemTemplate"）。
   * rewriteCommandTarget の startsWith チェックを既存のまま通すために親 ID を保持する。
   * Invariant: `_runtimeId === _parentTemplateId`
   */
  readonly _runtimeId: string;

  /** 親テンプレート state の _runtimeId */
  readonly _parentTemplateId: string;

  /** 変換関数の JS 式 */
  readonly _transform: JsExpr;

  /** JS 文字列アクセサ（Req 1.1, 1.2, 1.5）*/
  readonly js: StateJsAccessor;

  constructor(parentTemplateId: string, transform: JsExpr) {
    this._parentTemplateId = parentTemplateId;
    this._runtimeId = parentTemplateId;
    this._transform = transform;
    this.js = new StateJsAccessorImpl(parentTemplateId);
  }

  /**
   * 多段チェーンはスコープ外のため即時エラーをスロー。
   * Req 3.1, 3.2, 3.3
   */
  map<U>(_fn: (v: T) => U): Computed<U> {
    throw new Error(
      'DerivedTemplateState: chained .map() is not supported; use single-level derivation only',
    );
  }

  /**
   * 多段チェーンはスコープ外のため即時エラーをスロー。
   * Req 2.4, 3.3
   */
  field<K extends keyof T>(_key: K): T extends object ? Computed<T[K]> : never {
    throw new Error(
      'DerivedTemplateState: chained .map() is not supported; use single-level derivation only',
    );
  }

  /**
   * テンプレート捕捉フェーズ外での誤用を防ぐため即時エラーをスロー。
   */
  get(): never {
    throw new Error('DerivedTemplateState: .get() cannot be called in template context');
  }

  /**
   * テンプレート捕捉フェーズ外での誤用を防ぐため即時エラーをスロー。
   */
  subscribe(_fn: (v: T) => void): never {
    throw new Error('DerivedTemplateState: .subscribe() cannot be called in template context');
  }
}

// ────────────────────────────────────────────────────────────
// isDerivedTemplateState 型ガード
// ────────────────────────────────────────────────────────────

/**
 * 型ガード: 値が DerivedTemplateState かどうかを判別する。
 *
 * `_parentTemplateId` プロパティが `undefined` 以外であれば `DerivedTemplateState` とみなす。
 * `any` 型を使用せず `unknown` キャスト経由で実装する。
 *
 * Req 1.1, 5.1
 */
export function isDerivedTemplateState<T>(v: unknown): v is DerivedTemplateState<T> {
  if (v === null || v === undefined || typeof v !== 'object') {
    return false;
  }
  return (v as DerivedTemplateState<T>)._parentTemplateId !== undefined;
}

// ────────────────────────────────────────────────────────────
// TemplateStateImpl<T>
// ────────────────────────────────────────────────────────────

/**
 * each テンプレートビルダ関数の引数として渡す、テンプレートコンテキスト専用 State 実装。
 *
 * - `_runtimeId = "{arrayStateId}.itemTemplate"` を保持する（`allocateId()` を呼ばない）。
 * - `.map(fn)` は `buildTransformCode(fn, '_v')` で transform を JS 式に変換し、
 *   `DerivedTemplateState<U>` を返す（Req 1.1, 1.5）。
 * - `.field(key)` は `(v) => v[key]` 相当の transform を持つ `DerivedTemplateState<T[K]>` を返す
 *   （Req 2.1, 2.4）。
 * - `.get()` / `.subscribe()` はテンプレート捕捉フェーズ外での誤用を防ぐため即時 `Error` をスロー。
 * - `State<T>` を実装するが `.set()` / `.update()` も同様にエラーをスロー（テンプレートは read-only）。
 *
 * design.md: TemplateStateImpl
 * Requirements: 1.1, 1.5, 2.1, 2.4, 3.1, 3.2, 3.3
 */
export class TemplateStateImpl<T> implements State<T> {
  /** 構造的マーカー（Design D-7）: transformer が State 型を識別するために使用。
   * `declare` なのでランタイムには存在しない（型レイヤのみ）。 */
  declare readonly [DraftoleStateMarker]: 'state';

  /** "{arrayStateId}.itemTemplate"（`allocateId()` を呼ばない） */
  readonly _runtimeId: string;

  /** 保持するのみ（allocateId は不要）*/
  readonly _registry: StateRegistry;

  /** JS 文字列アクセサ（Req 1.1, 1.2, 1.5）*/
  readonly js: StateJsAccessor;

  constructor(arrayStateId: string, registry: StateRegistry) {
    this._runtimeId = `${arrayStateId}.itemTemplate`;
    this._registry = registry;
    this.js = new StateJsAccessorImpl(this._runtimeId);
  }

  /**
   * `buildTransformCode(fn, '_v')` で transform 式を生成し、
   * `DerivedTemplateState<U>` を返す（Req 1.1, 1.5）。
   */
  map<U>(fn: (v: T) => U): DerivedTemplateState<U> {
    const transformCode = buildTransformCode(fn, '_v');
    const transformExpr = makeJsExpr(transformCode);
    return new DerivedTemplateState<U>(this._runtimeId, transformExpr);
  }

  /**
   * `(v) => v[key]` 相当の transform を持つ `DerivedTemplateState<T[K]>` を返す。
   * `.map(v => v[key])` のシュガー（Req 2.1, 2.4）。
   */
  field<K extends keyof T>(key: K): T extends object ? State<T[K]> : never {
    // buildTransformCode は fn.toString() でアロー式を抽出するため、変数 key のリテラル値を
    // 取り込めない。フィールドアクセスは直接 makeJsExpr で生成する。
    const transformExpr = makeJsExpr(`function(_v) { return ((_v).${String(key)}); }`);
    return new DerivedTemplateState<T[K]>(this._runtimeId, transformExpr) as unknown as T extends object ? State<T[K]> : never;
  }

  /**
   * テンプレート捕捉フェーズ外での誤用を防ぐため即時エラーをスロー。
   */
  get(): never {
    throw new Error('TemplateStateImpl: .get() cannot be called in template context');
  }

  /**
   * テンプレート捕捉フェーズ外での誤用を防ぐため即時エラーをスロー。
   */
  subscribe(_fn: (v: T) => void): never {
    throw new Error('TemplateStateImpl: .subscribe() cannot be called in template context');
  }

  /**
   * テンプレートコンテキストは read-only。誤用を防ぐため即時エラーをスロー。
   */
  set(_value: T | import('../types.js').JsExpr): void {
    throw new Error('TemplateStateImpl: .set() cannot be called in template context');
  }

  /**
   * テンプレートコンテキストは read-only。誤用を防ぐため即時エラーをスロー。
   */
  update(_body: import('../types.js').JsExpr): void {
    throw new Error('TemplateStateImpl: .update() cannot be called in template context');
  }

  /**
   * each() はテンプレートコンテキストでは使用しない。誤用を防ぐため即時エラーをスロー。
   */
  each(_fn: (item: State<import('./state.js').ArrayItem<T>>) => never): never {
    throw new Error('TemplateStateImpl: .each() cannot be called in template context');
  }
}

// ────────────────────────────────────────────────────────────
// createTemplateState ファクトリ
// ────────────────────────────────────────────────────────────

/**
 * TemplateStateImpl を生成するファクトリ関数。
 * `captureEachTemplate` から呼ばれる（Task 4.1 で切り替え）。
 *
 * - Preconditions: `arrayStateId` は既に登録済みの配列 state ID
 * - Postconditions: `_runtimeId === arrayStateId + ".itemTemplate"`
 *
 * Requirements: 1.1, 1.5
 */
export function createTemplateState<T>(
  arrayStateId: string,
  registry: StateRegistry,
): TemplateStateImpl<T> {
  return new TemplateStateImpl<T>(arrayStateId, registry);
}
