/**
 * `ElementRef` / `ElementListRef` と生成関数 (`ref` / `fromSelector` / `fromExpr`)、
 * および `JsExpr` チェーンヘルパ（`eq` / `ne` / `or` / `trim` / `isFalsy` / `isTruthy`）の実装。
 *
 * 設計書 `design.md` の「element-ref」「types: JsExpr / JsBoolExpr」節に対応。
 * 値オブジェクトとして扱い、メソッドは新しいオブジェクトを返す純関数。
 */

import type { ElementRef, ElementListRef, JsExpr, JsBoolExpr } from './types.ts';

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
function makeElementRef<E extends Element>(kind: ElementRef['kind'], code: string): ElementRef<E> {
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
    cache(_name?: string): ElementRef<E> {
      // cache は後続タスク（vanilla-script-builder）で実装する。
      // 本タスクでは型・シグネチャのみ提供し、呼び出しは未サポートとして throw する。
      throw new Error(
        'ElementRef.cache() is not implemented in Task 2.1; implemented in vanilla-script-builder.',
      );
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
    length: makeJsExpr(`Array.from(${code}).length`),
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
 * 内部ファクトリ `makeJsExpr` の再エクスポート（上位層での JS 式構築に利用）。
 * 公開 API ではなく、`src/js/vanilla/*` 内でのみ使用を想定する。
 */
export { makeJsExpr as _makeJsExpr, makeJsBoolExpr as _makeJsBoolExpr };
