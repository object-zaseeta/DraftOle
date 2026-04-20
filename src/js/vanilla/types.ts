/**
 * `src/js/vanilla` モジュール全体で共有される型定義。
 *
 * - `JsExpr` / `JsBoolExpr`: JS 式を表す値オブジェクト型。
 * - `ElementEventName`: `HTMLElementEventMap` のキーに制約されたイベント名。
 * - `EventArgRef<K>`: `on()` ハンドラの第 2 引数として注入される型付きイベント参照。
 * - `StringKeysOf<T>`: 文字列/数値/真偽プロパティのキーのみを抽出する内部ユーティリティ型。
 * - `WritableStyleKey`: `CSSStyleDeclaration` の書き込み可能プロパティキーのみを抽出した型。
 *
 * 本ファイルは設計書 `design.md` の「types」セクションに対応する。
 */

/**
 * JS 式を表す値オブジェクト。`.code` で生文字列を、メソッドで合成式を得る。
 * 具体的なチェーンメソッド（`eq` / `ne` / `or` / `trim` / `isFalsy` / `isTruthy`）は
 * 後続タスクで実装する。
 */
export interface JsExpr {
  readonly __jsExpr: true;
  readonly code: string;
  eq(other: string | number | JsExpr): JsBoolExpr;
  ne(other: string | number | JsExpr): JsBoolExpr;
  or(fallback: string | JsExpr): JsExpr;
  trim(): JsExpr;
  isFalsy(): JsBoolExpr;
  isTruthy(): JsBoolExpr;
}

/**
 * JS 真偽値式を表す値オブジェクト。`JsExpr` のサブタイプ。
 * `ifThen` / `toggleClass(force)` などで型レベルに真偽式のみを許容するための標識。
 */
export interface JsBoolExpr extends JsExpr {
  readonly __jsBool: true;
}

/**
 * `HTMLElementEventMap` のキー。`on(target, event, handler)` の `event` 引数の型。
 */
export type ElementEventName = keyof HTMLElementEventMap;

/**
 * オブジェクト型 `T` のうち、値が文字列・数値・真偽のプロパティキーのみを抽出する内部型。
 * `EventArgRef<K>` で `HTMLElementEventMap[K]` の公開プロパティを `JsExpr` として露出するために用いる。
 */
export type StringKeysOf<T> = {
  [K in keyof T]: T[K] extends string | number | boolean ? K : never;
}[keyof T];

/**
 * `on<K>()` ハンドラに自動注入されるイベント引数参照。
 * 内部 JS 識別子は常に `"e"` 固定（ハンドラごとに新しい子スコープで生成されるため衝突しない）。
 * `HTMLElementEventMap[K]` の文字列・数値・真偽プロパティを `JsExpr` として型安全に露出する。
 */
export type EventArgRef<K extends ElementEventName> = {
  readonly __eventArg: true;
  readonly code: 'e';
} & {
  readonly [P in StringKeysOf<HTMLElementEventMap[K]>]: JsExpr;
};

/**
 * `CSSStyleDeclaration` のうち書き込み可能なスタイルキーのみを抽出する型。
 * `length` / `parentRule` / `cssText` のような特殊プロパティを除外する。
 * `setStyle<K extends WritableStyleKey>()` で型レベルの安全性を提供する。
 */
export type WritableStyleKey = {
  [K in keyof CSSStyleDeclaration]: CSSStyleDeclaration[K] extends string
    ? K extends 'length' | 'parentRule' | 'cssText'
      ? never
      : K
    : never;
}[keyof CSSStyleDeclaration];
