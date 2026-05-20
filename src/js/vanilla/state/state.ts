/**
 * State<T> / Computed<T> の実装
 *
 * 設計書 `design.md` の「Components and Interfaces: State<T> / Computed<T>」に対応。
 *
 * - `State<T>`: 読み書き可能な観測可能値オブジェクト（ビルド時）
 * - `Computed<T>`: 読み取り専用の派生値オブジェクト（`.set` を持たない）
 * - `createStateExpr`: runtimeId から `__draftole__.state(id).get()` 形式の JsExpr を生成
 *
 * 設計上の決定事項:
 * - `.get()` は JsExpr を返す（ランタイム API 呼び出し式）
 * - `.set(v)` / `.update(body)` は ScriptScope 内で呼ばれることを前提としたコマンド生成 API
 *   （このタスクでは no-op / stub として実装）
 * - `.map(fn)` は Computed<U> を返す（fn はビルド時に呼ばれる）
 * - `.field(key)` は State/Computed の派生を返す（_parent / _fieldKey チェーンを保持）
 * - `.each(fn)` は EachBinding<U> を返す（タスク 2.3 で詳細実装）
 *
 * Requirements: 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.4, 6.3
 */

import type { HtmlTag } from '../../../html/elements/html-tag.js';
import type { JsBoolExpr, JsExpr } from '../types.js';
import { captureEachTemplate } from './each-template.js';
import type { DerivedEntry, StateRegistry } from './registry.js';
import { StateJsAccessorImpl, type StateJsAccessor } from './state-js-accessor.js';

// ────────────────────────────────────────────────────────────
// 構造的マーカー型（D-7）
// ────────────────────────────────────────────────────────────

/**
 * ReadableState<T> を識別するための構造的マーカーシンボル。
 *
 * `declare const` なのでランタイムには存在しない（型レイヤのみ）。
 * transformer の TypeChecker から 1 回の getTypeAtLocation で
 * State / Computed / ScriptStateHandle を判別可能にする（Design D-7）。
 */
export declare const DraftoleStateMarker: unique symbol;

// ────────────────────────────────────────────────────────────
// ユーティリティ型
// ────────────────────────────────────────────────────────────

/** 配列要素型の抽出（design.md の ArrayItem<T>）*/
export type ArrayItem<T> = T extends readonly (infer U)[] ? U : never;

/** each バインディングの戻り値型（design.md の EachBinding<U>）*/
export interface EachBinding<U> {
  readonly _kind: 'each';
  readonly _stateId: string;
  readonly _template: U;
}

// ────────────────────────────────────────────────────────────
// 公開インタフェース
// ────────────────────────────────────────────────────────────

/**
 * 読み取り専用の観測可能値インタフェース。
 * State<T> / Computed<T> 共通。
 *
 * design.md: ReadableState<T>
 */
export interface ReadableState<T> {
  /** 構造的マーカー（Design D-7）: transformer の TypeChecker が State 型を識別するために使用。
   * `declare const DraftoleStateMarker: unique symbol` なのでランタイムには存在しない。 */
  readonly [DraftoleStateMarker]: 'state';

  /**
   * build 時の状態 ID（handler-serialization から参照可、Req 6.3）
   * @deprecated Use state.js.get() / state.js.set() instead
   */
  readonly _runtimeId: string;

  /** JS 文字列アクセサ（Req 1.1, 1.2, 1.5）*/
  readonly js: StateJsAccessor;

  /**
   * ハンドラ内で呼び出すと現在の状態値（T）を返す（state-handler-typing Req 1.1）。
   *
   * 注意: ハンドラ外（モジュールトップレベル等）で呼び出すと、
   *       transformer の whitelist-validator により静的エラーになる。
   *       ビルド時に JS コード片が必要な場合は `state.js.get()` を使う。
   */
  get(): T;

  /** 派生値 Computed<U>（Req 3.1）*/
  map<U>(fn: (t: T) => U): Computed<U>;

  /** オブジェクトフィールドの読み取り専用派生（Computed として返す）*/
  field<K extends keyof T>(key: K): T extends object ? Computed<T[K]> : never;
}

/**
 * 読み書き可能な観測可能値インタフェース。
 *
 * design.md: State<T>
 */
export interface State<T> extends ReadableState<T> {
  /** 書き込み: T の即値 または JsExpr（Req 2.2）*/
  set(value: T): void;
  set(value: JsExpr): void;

  /** 更新関数: 本仕様では JsExpr 形式のみ（Req 2.3, R-2）*/
  update(body: JsExpr): void;

  /** 書き戻し可能なフィールド派生（State として返す、R-1 決定）*/
  field<K extends keyof T>(key: K): T extends object ? State<T[K]> : never;

  /** 配列要素を State<Item> として受け取る要素ビルダテンプレート（Req 3.5）*/
  each<U extends HtmlTag | readonly HtmlTag[]>(
    fn: (item: State<ArrayItem<T>>) => U,
  ): EachBinding<U>;
}

/**
 * 読み取り専用の派生値インタフェース。
 *
 * design.md: Computed<T>
 * Req 3.2: set を持たない
 */
export type Computed<T> = ReadableState<T>;

// ────────────────────────────────────────────────────────────
// JsExpr ファクトリ
// ────────────────────────────────────────────────────────────

/**
 * runtimeId から `__draftole__.state(id).get()` 形式の JsExpr を生成するファクトリ。
 *
 * Req 2.1: `.get()` は式位置で呼び出すと JsExpr を返す。
 * design.md: ランタイム API シグネチャ `__draftole__.state('id').get()`
 */
export function createStateExpr(runtimeId: string): JsExpr {
  const code = `__draftole__.state('${runtimeId}').get()`;
  return makeJsExpr(code);
}

/**
 * 任意の code 文字列から JsExpr を生成するファクトリ。
 */
export function makeJsExpr(code: string): JsExpr {
  const self: JsExpr = {
    __jsExpr: true as const,
    code,
    eq(other: string | number | JsExpr): JsBoolExpr {
      const otherCode = typeof other === 'object' ? other.code : JSON.stringify(other);
      return makeBoolExpr(`${code} === ${otherCode}`);
    },
    ne(other: string | number | JsExpr): JsBoolExpr {
      const otherCode = typeof other === 'object' ? other.code : JSON.stringify(other);
      return makeBoolExpr(`${code} !== ${otherCode}`);
    },
    or(fallback: string | JsExpr): JsExpr {
      const fbCode = typeof fallback === 'object' ? fallback.code : JSON.stringify(fallback);
      return makeJsExpr(`(${code} || ${fbCode})`);
    },
    trim(): JsExpr {
      return makeJsExpr(`(${code}).trim()`);
    },
    isFalsy(): JsBoolExpr {
      return makeBoolExpr(`!(${code})`);
    },
    isTruthy(): JsBoolExpr {
      return makeBoolExpr(`!!(${code})`);
    },
  };
  return self;
}

/**
 * 真偽値式 JsBoolExpr を生成する内部ファクトリ。
 */
function makeBoolExpr(code: string): JsBoolExpr {
  return {
    ...makeJsExpr(code),
    __jsBool: true as const,
    __jsExpr: true as const,
    // eq/ne/or/trim/isFalsy/isTruthy は makeJsExpr のものを上書きが必要
    // spread では動作しないため明示的に定義
    eq(other: string | number | JsExpr): JsBoolExpr {
      const otherCode = typeof other === 'object' ? other.code : JSON.stringify(other);
      return makeBoolExpr(`${code} === ${otherCode}`);
    },
    ne(other: string | number | JsExpr): JsBoolExpr {
      const otherCode = typeof other === 'object' ? other.code : JSON.stringify(other);
      return makeBoolExpr(`${code} !== ${otherCode}`);
    },
    or(fallback: string | JsExpr): JsExpr {
      const fbCode = typeof fallback === 'object' ? fallback.code : JSON.stringify(fallback);
      return makeJsExpr(`(${code} || ${fbCode})`);
    },
    trim(): JsExpr {
      return makeJsExpr(`(${code}).trim()`);
    },
    isFalsy(): JsBoolExpr {
      return makeBoolExpr(`!(${code})`);
    },
    isTruthy(): JsBoolExpr {
      return makeBoolExpr(`!!(${code})`);
    },
  };
}

// ────────────────────────────────────────────────────────────
// StateImpl（State<T> の実装クラス）
// ────────────────────────────────────────────────────────────

/**
 * State<T> の実装クラス。
 *
 * package-private なフィールド:
 * - `_runtimeId`: ランタイム状態 ID（handler-serialization から参照可、Req 6.3）
 * - `_registry`: StateRegistry への参照（map/field で派生 ID を採番するため）
 * - `_parent?`: field 派生の親 StateInstance
 * - `_fieldKey?`: field 派生のキー
 */
export class StateImpl<T> implements State<T> {
  /** 構造的マーカー（Design D-7）: transformer が State 型を識別するために使用。
   * `declare` なのでランタイムには存在しない（型レイヤのみ）。 */
  declare readonly [DraftoleStateMarker]: 'state';

  /** @deprecated Use state.js.get() / state.js.set() instead */
  readonly _runtimeId: string;
  readonly _registry: StateRegistry;
  readonly _parent?: StateImpl<unknown>;
  readonly _fieldKey?: string | number;
  readonly js: StateJsAccessor;

  constructor(
    runtimeId: string,
    registry: StateRegistry,
    parent?: StateImpl<unknown>,
    fieldKey?: string | number,
  ) {
    this._runtimeId = runtimeId;
    this._registry = registry;
    this._parent = parent;
    this._fieldKey = fieldKey;
    this.js = new StateJsAccessorImpl(runtimeId);
  }

  /**
   * 宣言型は `T`（runtime 意味論、state-handler-typing Req 1.1/1.2）。
   *
   * 実装はビルド時に JsExpr を返すが、`.on()` ハンドラ内では transformer が
   * AST を `__draftole__.state(id).get()` に書き換えるため、ランタイムでは `T` 値が返る。
   * ハンドラ外での誤呼び出しは whitelist-validator が静的エラー化するため、
   * 型レベルの "嘘" は安全（design.md: StateImpl Implementation Notes）。
   *
   * 内部の意図的キャストはここ 1 箇所に集約する。
   */
  get(): T {
    return createStateExpr(this._runtimeId) as unknown as T;
  }

  /**
   * 派生値 Computed<U> を返す。
   * fn はビルド時に一度呼ばれ、変換を表現する JS 式を生成する。
   * Req 3.1
   */
  map<U>(fn: (t: T) => U): Computed<U> {
    const derivedId = this._registry.allocateId();
    // 方針 B: Computed をランタイム状態として登録し、親→派生のサブスクリプションを記録する。
    // transformBody は _v を入力変数とした変換式（ランタイムのサブスクリプション本体に使用）。
    const transformBody = buildTransformCode(fn, '_v');
    this._registry.register({ runtimeId: derivedId, initialExpr: makeJsExpr('null') });
    const derived: DerivedEntry = { derivedId, sourceId: this._runtimeId, transformBody: makeJsExpr(transformBody) };
    this._registry.registerDerived(derived);
    // ComputedImpl.get() は登録済みランタイム状態の参照式を返す。
    return new ComputedImpl<U>(derivedId, this._registry, createStateExpr(derivedId), this, undefined, fn as unknown as (t: unknown) => unknown);
  }

  /**
   * 書き戻し可能なフィールド派生 State<T[K]> を返す。
   * R-1 決定: .set(v) 時は親 State に対して {...prev, [key]: v} の再構築を発行。
   * Req 3.4
   */
  field<K extends keyof T>(key: K): T extends object ? State<T[K]> : never {
    const derivedId = this._registry.allocateId();
    const parentCode = createStateExpr(this._runtimeId).code;
    const fieldCode = `(${parentCode})?.${String(key)}`;
    const parent = this as unknown as StateImpl<unknown>;
    // field の get() は専用実装が必要なので FieldStateImpl で上書き
    return new FieldStateImpl<T, K>(derivedId, this._registry, parent, key, fieldCode) as unknown as T extends object ? State<T[K]> : never;
  }

  /**
   * 書き込み操作のスタブ実装。
   * ScriptScope 内で .set() が呼ばれた際に state-set コマンドを生成する経路は
   * ScriptStateHandle（タスク 2.4）で実装。
   * このタスクではビルド時オブジェクトとして存在確認のみ（no-op）。
   * Req 2.2
   */
  set(_value: T | JsExpr): void {
    // ビルド時オブジェクトの set は ScriptScope 経由での呼び出しを前提とする。
    // ScriptStateHandle が state-set コマンドを発行する（タスク 2.4 で実装）。
    // 直接呼び出し時は no-op。
  }

  /**
   * 更新操作のスタブ実装。
   * Req 2.3, R-2: 本仕様では JsExpr 形式のみ受け付ける。
   */
  update(_body: JsExpr): void {
    // ビルド時オブジェクトの update は ScriptScope 経由での呼び出しを前提とする。
    // ScriptStateHandle が state-update コマンドを発行する（タスク 2.4 で実装）。
    // 直接呼び出し時は no-op。
  }

  /**
   * 配列要素テンプレートバインディング。
   * EachBinding<U> を返す（タスク 2.3 で詳細実装）。
   * Req 3.5
   */
  each<U extends HtmlTag | readonly HtmlTag[]>(
    fn: (item: State<ArrayItem<T>>) => U,
  ): EachBinding<U> {
    return captureEachTemplate(this as unknown as StateImpl<ArrayItem<T>[]>, fn as (item: StateImpl<ArrayItem<ArrayItem<T>[]>>) => U);
  }
}

// ────────────────────────────────────────────────────────────
// FieldStateImpl（field 派生 State の get() を上書き）
// ────────────────────────────────────────────────────────────

/**
 * field() 派生専用の State 実装。
 * get() がフィールドアクセス式を返す点のみ StateImpl と異なる。
 */
class FieldStateImpl<T, K extends keyof T> extends StateImpl<T[K]> {
  private readonly _fieldCode: string;

  constructor(
    runtimeId: string,
    registry: StateRegistry,
    parent: StateImpl<unknown>,
    fieldKey: K,
    fieldCode: string,
  ) {
    super(runtimeId, registry, parent, fieldKey as string | number);
    this._fieldCode = fieldCode;
  }

  override get(): T[K] {
    // 宣言型は T[K]（state-handler-typing Req 1.1/1.2）。
    // ハンドラ内では transformer が `(parent)?.key` 形式の JS に書き換える。
    // 実装上はビルド時 JsExpr を返すが、whitelist-validator により
    // ハンドラ外での呼び出しは静的エラー化されるため安全。
    return makeJsExpr(this._fieldCode) as unknown as T[K];
  }
}

// ────────────────────────────────────────────────────────────
// ComputedImpl（Computed<T> の実装クラス）
// ────────────────────────────────────────────────────────────

/**
 * Computed<T> の実装クラス。
 *
 * 読み取り専用（.set を持たない）。
 * .map() / .field() チェーンを許容する。
 *
 * Req 3.1, 3.2, 3.7
 */
export class ComputedImpl<T> implements Computed<T> {
  /** 構造的マーカー（Design D-7）: transformer が State 型を識別するために使用。
   * `declare` なのでランタイムには存在しない（型レイヤのみ）。 */
  declare readonly [DraftoleStateMarker]: 'state';

  /** @deprecated Use state.js.get() / state.js.set() instead */
  readonly _runtimeId: string;
  readonly _registry: StateRegistry;
  /** 派生元の JsExpr（get() が返す値）*/
  private readonly _expr: JsExpr;
  /** field 派生の親 */
  readonly _parent?: StateImpl<unknown> | ComputedImpl<unknown>;
  /** field 派生のキー */
  readonly _fieldKey?: string | number;
  /** map 変換関数（デバッグ・後続スペック用）*/
  readonly _mapFn?: (t: unknown) => unknown;
  /** JS 文字列アクセサ（Req 1.1, 1.2, 1.5）*/
  readonly js: StateJsAccessor;

  constructor(
    runtimeId: string,
    registry: StateRegistry,
    expr: JsExpr,
    parent: StateImpl<unknown> | ComputedImpl<unknown> | undefined,
    fieldKey: string | number | undefined,
    mapFn: ((t: unknown) => unknown) | undefined,
  ) {
    this._runtimeId = runtimeId;
    this._registry = registry;
    this._expr = expr;
    this._parent = parent;
    this._fieldKey = fieldKey;
    this._mapFn = mapFn ?? undefined;
    this.js = new StateJsAccessorImpl(runtimeId);
  }

  /**
   * 宣言型は `T`（runtime 意味論、state-handler-typing Req 1.3）。
   *
   * 実装は構築時に渡された JsExpr を返すが、ハンドラ内では transformer が
   * `__draftole__.state(id).get()` に書き換える。
   * ハンドラ外での誤呼び出しは whitelist-validator が静的エラー化する。
   */
  get(): T {
    return this._expr as unknown as T;
  }

  /**
   * 派生値 Computed<U> を返す（多段チェーン許容）。
   * Req 3.7
   */
  map<U>(fn: (t: T) => U): Computed<U> {
    const derivedId = this._registry.allocateId();
    // 方針 B: このComputedの登録済みランタイム状態（this._runtimeId）を直接の購読元とする。
    const transformBody = buildTransformCode(fn, '_v');
    this._registry.register({ runtimeId: derivedId, initialExpr: makeJsExpr('null') });
    const derived: DerivedEntry = { derivedId, sourceId: this._runtimeId, transformBody: makeJsExpr(transformBody) };
    this._registry.registerDerived(derived);
    return new ComputedImpl<U>(
      derivedId,
      this._registry,
      createStateExpr(derivedId),
      this as unknown as ComputedImpl<unknown>,
      undefined,
      fn as unknown as (t: unknown) => unknown,
    );
  }

  /**
   * オブジェクトフィールドの読み取り専用派生 Computed<T[K]>。
   * Computed の field() は書き戻し不可（ReadableState.field()）。
   * Req 3.4（Computed 版は読み取り専用）
   */
  field<K extends keyof T>(key: K): T extends object ? Computed<T[K]> : never {
    const derivedId = this._registry.allocateId();
    const parentCode = this._expr.code;
    const fieldCode = `(${parentCode})?.${String(key)}`;
    const derivedExpr = makeJsExpr(fieldCode);
    const result = new ComputedImpl<T[K]>(
      derivedId,
      this._registry,
      derivedExpr,
      this as unknown as ComputedImpl<unknown>,
      key as string | number,
      undefined,
    );
    return result as unknown as T extends object ? Computed<T[K]> : never;
  }
}

// ────────────────────────────────────────────────────────────
// 内部ユーティリティ
// ────────────────────────────────────────────────────────────

/**
 * map(fn) の変換関数を JS 式文字列に変換する。
 *
 * ビルド時に fn を一度呼び出し、その戻り値から JS コードを推論する。
 * 本仕様では「ランタイム API が呼ばれる式としての表現」のみを生成する。
 *
 * 注: 実際のランタイムでは fn をクロージャとして保持し、
 * 状態更新時に再評価する。ここでは簡潔な式表現のみ。
 */
export function buildTransformCode<T, U>(fn: (t: T) => U, sourceCode: string): string {
  // fn.toString() からアロー関数本体を抽出して inline 化する試み
  // 完全なシリアライズは handler-serialization スペックの責務だが、
  // シンプルなアロー関数（`n => n + 1` 等）については簡易対応する。
  //
  // 返り値は常に自己完結した関数文字列 `function(sourceCode) { return ...; }` とする。
  // 呼び出し側は式コンテキストへの埋め込みを意識せず `.code` をそのまま渡せる。
  try {
    const fnStr = fn.toString().trim();
    // アロー関数パターン: `(param) => expr` または `param => expr`
    const arrowMatch = fnStr.match(/^(?:\(([^)]*)\)|(\w+))\s*=>\s*(.+)$/s);
    if (arrowMatch) {
      // 防御的 fallback: 正規表現 /^(?:\(([^)]*)\)|(\w+))\s*=>\s*(.+)$/s が
      // group 1 または 2 を必ず捕獲し、(.+) が group 3 を必ず捕獲するため、
      // 以下 2 行の ?? fallback (`'_t'` / `''`) は到達不能。
      /* v8 ignore start */
      const param = (arrowMatch[1] ?? arrowMatch[2] ?? '_t').trim();
      const body = (arrowMatch[3] ?? '').trim();
      /* v8 ignore stop */
      if (param && body && !body.startsWith('{')) {
        // シンプルな式本体のみインライン化（ブロック本体は除外）
        // パラメータ名を sourceCode に置換
        const inlined = body.replace(new RegExp(`\\b${escapeRegExp(param)}\\b`, 'g'), `(${sourceCode})`);
        return `function(${sourceCode}) { return (${inlined}); }`;
      }
    }
  } catch {
    // fn.toString() が使えない環境では fallback
  }
  // Fallback: identity（変換なし）
  return `function(${sourceCode}) { return (${sourceCode}); }`;
}

/**
 * 正規表現用の文字列エスケープ。
 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
