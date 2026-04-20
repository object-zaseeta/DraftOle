/**
 * `ElementRef` / `ElementListRef` と生成関数 (`ref` / `fromSelector` / `fromExpr`)、
 * および `JsExpr` チェーンヘルパ（`eq` / `ne` / `or` / `trim` / `isFalsy` / `isTruthy`）の実装。
 *
 * 設計書 `design.md` の「element-ref」「types: JsExpr / JsBoolExpr」節に対応。
 * 値オブジェクトとして扱い、メソッドは新しいオブジェクトを返す純関数。
 */

import type { ElementRef, ElementListRef, JsExpr, JsBoolExpr } from './types.ts';
import type { VanillaScope } from './vanilla-script-builder.ts';

/**
 * `cache()` 呼び出し時に自動生成する識別子名のカウンタ。
 * 同一プロセス内で一意性を保つための単純なサフィックス。
 */
let cacheCounter = 0;

/** 有効な JS 識別子か判定する（予約語チェックは行わない）。 */
function isValidJsIdentifier(name: string): boolean {
  if (name.length === 0) return false;
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

/** 要素型情報から `value` アクセス可否を判定するための内部タグ。実体は文字列マーカ。 */
type HasValueElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * 値（`string` / `number` / `JsExpr`）を安全な JS 式文字列にエンコードする。
 * - `string` / `number` は `JSON.stringify` でクォート・エスケープ
 * - `JsExpr` はそのまま `.code` を埋め込む
 */
function encodeOperand(value: string | number | JsExpr): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return JSON.stringify(value);
  }
  return value.code;
}

/**
 * `JsExpr` 値オブジェクトを生成する内部ファクトリ。
 * チェーンメソッド（`eq` / `ne` / `or` / `trim` / `isFalsy` / `isTruthy`）を純関数として提供する。
 */
function makeJsExpr(code: string): JsExpr {
  const self: JsExpr = {
    __jsExpr: true,
    code,
    eq(other) {
      return makeJsBoolExpr(`${code} === ${encodeOperand(other)}`);
    },
    ne(other) {
      return makeJsBoolExpr(`${code} !== ${encodeOperand(other)}`);
    },
    or(fallback) {
      return makeJsExpr(`(${code} || ${encodeOperand(fallback)})`);
    },
    trim() {
      return makeJsExpr(`${code}.trim()`);
    },
    isFalsy() {
      return makeJsBoolExpr(`!${code}`);
    },
    isTruthy() {
      return makeJsBoolExpr(`!!${code}`);
    },
  };
  return self;
}

/**
 * `JsBoolExpr` 値オブジェクトを生成する内部ファクトリ。
 * `JsExpr` のサブタイプとして `__jsBool` マーカーを持たせる。
 */
function makeJsBoolExpr(code: string): JsBoolExpr {
  const base = makeJsExpr(code);
  return {
    ...base,
    __jsBool: true,
  } as JsBoolExpr;
}

/**
 * `ElementRef` 値オブジェクトを生成する内部ファクトリ。
 * `textContent` / `value` プロパティを `JsExpr` として遅延露出する。
 */
function makeElementRef<E extends Element>(
  kind: ElementRef['kind'],
  code: string,
  scope?: VanillaScope,
): ElementRef<E> {
  const ref = {
    __ref: true as const,
    kind,
    code,
    get textContent(): JsExpr {
      return makeJsExpr(`${code}.textContent`);
    },
    // 型レベルで `value` は E が入力系要素のときのみ利用可能。
    // 実行時はすべての ref で `value` アクセスを試みれば JsExpr を返すが、
    // 型によりコンパイル時点で弾かれる設計（design.md）。
    get value(): E extends HasValueElement ? JsExpr : never {
      return makeJsExpr(`${code}.value`) as E extends HasValueElement ? JsExpr : never;
    },
    /**
     * 現在スコープに `const <name> = <code>;` を append し、新しい `kind: "var"` 参照を返す。
     * 同一セレクタを複数回埋め込む副作用を避けたい場合に明示的に使う（Issue 3）。
     *
     * スコープが紐付いていない参照（`ref()` / `fromSelector()` / `fromExpr()` 由来）に対して
     * 呼ばれた場合は例外を投げる — 宣言場所が曖昧になるため。
     */
    cache(name?: string): ElementRef<E> {
      if (scope === undefined) {
        throw new Error(
          'ElementRef.cache(): this reference is not bound to a scope; ' +
            'use query(scope, sel) / queryAll(scope, sel) to obtain a cacheable reference.',
        );
      }
      const chosen = name ?? `_cached_${++cacheCounter}`;
      if (!isValidJsIdentifier(chosen)) {
        throw new Error(
          `ElementRef.cache(): invalid JS identifier: ${JSON.stringify(chosen)}`,
        );
      }
      scope._append({ type: 'declareConst', name: chosen, expr: code });
      return makeElementRef<E>('var', chosen, scope);
    },
    /** `classList.contains(name)` を真偽式として返す（Req 3.4）。 */
    containsClass(name: string): JsBoolExpr {
      return makeJsBoolExpr(`${code}.classList.contains(${JSON.stringify(name)})`);
    },
  };
  return ref as ElementRef<E>;
}

/**
 * `jsName` 由来の変数名（または既に存在する JS 識別子）を指す `ElementRef` を生成する。
 *
 * @param varName - JS 識別子として有効な名前（空文字・無効識別子は `Error`）。
 * @returns `kind: 'var'`、`code === varName` の新しい `ElementRef`。
 * @throws 空文字・無効 JS 識別子のとき `Error`。
 */
export function ref<E extends Element = HTMLElement>(varName: string): ElementRef<E> {
  if (!isValidJsIdentifier(varName)) {
    throw new Error(`ref(): invalid JS identifier: ${JSON.stringify(varName)}`);
  }
  return makeElementRef<E>('var', varName);
}

/**
 * CSS セレクタをインライン展開する `ElementRef` を生成する（`document.querySelector(sel)` 形式）。
 *
 * @param selector - 空文字禁止。セレクタ文字列は `JSON.stringify` でクォートされる。
 * @returns `kind: 'selector'` の新しい `ElementRef`。
 * @throws 空文字の場合 `Error`。
 */
export function fromSelector<E extends Element = HTMLElement>(selector: string): ElementRef<E> {
  if (selector.length === 0) {
    throw new Error('fromSelector(): selector must not be empty');
  }
  return makeElementRef<E>('selector', `document.querySelector(${JSON.stringify(selector)})`);
}

/**
 * 任意の JS 式文字列を内包する `ElementRef` を生成する（内部用のエスケープハッチ）。
 *
 * @param code - JS 式として有効な文字列（空文字禁止）。
 * @returns `kind: 'expr'` の新しい `ElementRef`。
 * @throws 空文字の場合 `Error`。
 */
export function fromExpr<E extends Element = HTMLElement>(code: string): ElementRef<E> {
  if (code.length === 0) {
    throw new Error('fromExpr(): code must not be empty');
  }
  return makeElementRef<E>('expr', code);
}

/**
 * `ElementListRef` 値オブジェクトを生成する内部ファクトリ。
 * `queryAll` 等で利用するが、本タスクでは基本形（`length` のみ）を提供する。
 */
function makeElementListRef<E extends Element>(
  kind: ElementListRef['kind'],
  code: string,
): ElementListRef<E> {
  return {
    __listRef: true,
    kind,
    code,
    // `kind: "listSelector"` の場合は `NodeList.length`、`kind: "listExpr"`（`filterNot` 等の
    // 合成結果、`Array.from(...).filter(...)` 形式）の場合は `Array.length` を直接参照する。
    // どちらも `.length` プロパティがネイティブに存在するため、追加の `Array.from` ラップは不要。
    length: makeJsExpr(`${code}.length`),
  } as ElementListRef<E>;
}

/**
 * CSS セレクタ由来の `ElementListRef` を生成する（`document.querySelectorAll(sel)` 形式）。
 * 後続の `query-api` から利用する想定だが、要素参照層が所有する純粋な生成関数として提供する。
 */
export function listFromSelector<E extends Element = HTMLElement>(
  selector: string,
): ElementListRef<E> {
  if (selector.length === 0) {
    throw new Error('listFromSelector(): selector must not be empty');
  }
  return makeElementListRef<E>(
    'listSelector',
    `document.querySelectorAll(${JSON.stringify(selector)})`,
  );
}

/**
 * 任意の JS 式由来の `ElementListRef` を生成する（内部用）。
 */
export function listFromExpr<E extends Element = HTMLElement>(code: string): ElementListRef<E> {
  if (code.length === 0) {
    throw new Error('listFromExpr(): code must not be empty');
  }
  return makeElementListRef<E>('listExpr', code);
}

/**
 * スコープに紐付いた `ElementRef` を生成する内部ファクトリ。
 * `query(scope, sel)` がセレクタ参照を cache 可能にするために使用する。
 */
export function _makeScopedElementRef<E extends Element = HTMLElement>(
  kind: ElementRef['kind'],
  code: string,
  scope: VanillaScope,
): ElementRef<E> {
  return makeElementRef<E>(kind, code, scope);
}

/**
 * スコープに紐付いた `ElementListRef` を生成する内部ファクトリ。
 * `queryAll(scope, sel)` 由来の参照は将来的な cache/forEach 化に備えて
 * 同じ経路を共有する（本 Phase では単純な参照と等価）。
 */
export function _makeScopedElementListRef<E extends Element = HTMLElement>(
  kind: ElementListRef['kind'],
  code: string,
): ElementListRef<E> {
  return makeElementListRef<E>(kind, code);
}

/**
 * 内部ファクトリ `makeJsExpr` の再エクスポート（上位層での JS 式構築に利用）。
 * 公開 API ではなく、`src/js/vanilla/*` 内でのみ使用を想定する。
 */
export { makeJsExpr as _makeJsExpr, makeJsBoolExpr as _makeJsBoolExpr };
