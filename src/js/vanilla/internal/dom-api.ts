/**
 * DOM プロパティ / クラスリスト / スタイル操作 API の実装。
 *
 * 設計書 `design.md` の「dom-api」節と要件 3.1〜3.4, 4.1〜4.4 に対応する。
 *
 * - `toggleClass(scope, el, name, force?)` / `addClass` / `removeClass` は現在スコープに
 *   `classListToggle` / `classListAdd` / `classListRemove` 命令を append する。
 * - `containsClass(el, name)` は `JsBoolExpr` を返す純関数（命令を発行しない）。
 * - `setText(scope, el, value)` / `setValue(scope, el, value)` は `setProp` 命令を発行し、
 *   文字列値は `JSON.stringify` でクォート、`JsExpr` は `.code` を未クォートで埋め込む。
 * - `getText(el)` / `getValue(el)` は `JsExpr` を返す純関数（`ElementRef` の直接プロパティを薄くラップ）。
 * - `setValue` / `getValue` は要素型を `HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement`
 *   に型制約する（Req 4.2）。
 * - `setStyle<K extends WritableStyleKey>(scope, el, key, value)` は `setStyle` 命令を
 *   発行する。`WritableStyleKey` は `CSSStyleDeclaration` の書き込み可能プロパティのみ抽出（Req 4.4）。
 * - 出力に `jQuery` / `$` は含めない（Req 1.5, 7.1、`commands.ts` の語彙集約による担保）。
 *
 * 本ファイルは `VanillaScope` インターフェースを API で汚染しないため、
 * スコープを引数に取る自由関数として提供する。内部 append は `VanillaScope._append` 経由で行う。
 */

import type { ElementTarget } from '../commands.js';
import { _makeJsBoolExpr, _makeJsExpr } from '../element-ref.js';
import type {
  ElementRef,
  InputLikeElement,
  JsBoolExpr,
  JsExpr,
  WritableStyleKey,
} from '../types.ts';
import type { VanillaScope } from '../vanilla-script-builder.ts';

function closureRef(code: string): ElementTarget {
  return { kind: 'closure-ref', varName: code };
}

/**
 * 文字列または `JsExpr` を JS 式文字列にエンコードする。
 * - `string`: `JSON.stringify` でクォート・エスケープ。
 * - `JsExpr`: `.code` をそのまま埋め込む。
 */
function encodeValue(value: string | JsExpr): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  return value.code;
}

/**
 * 要素のクラスリストを切り替える命令を発行する（Req 3.1, 3.2）。
 *
 * @param scope - 命令を発行する現在スコープ。
 * @param el    - 対象要素参照。
 * @param name  - クラス名（`JSON.stringify` でクォートされる）。
 * @param force - 省略可の真偽式。`JsBoolExpr` を渡すと第 2 引数として埋め込まれる。
 */
export function toggleClass(
  scope: VanillaScope,
  el: ElementRef,
  name: string,
  force?: JsBoolExpr,
): void {
  scope._append({
    type: 'classListToggle',
    target: closureRef(el.code),
    name,
    force: force === undefined ? undefined : force.code,
  });
}

/**
 * `element.classList.add(name)` 命令を発行する（Req 3.3）。
 */
export function addClass(scope: VanillaScope, el: ElementRef, name: string): void {
  scope._append({ type: 'classListAdd', target: closureRef(el.code), name });
}

/**
 * `element.classList.remove(name)` 命令を発行する（Req 3.3）。
 */
export function removeClass(scope: VanillaScope, el: ElementRef, name: string): void {
  scope._append({ type: 'classListRemove', target: closureRef(el.code), name });
}

/**
 * `element.classList.contains(name)` を `JsBoolExpr` として返す（Req 3.4）。
 *
 * 命令は発行せず、純関数として式を合成するのみ。`toggleClass` の `force` や
 * `ifThen` の条件として合成できる。`ElementRef.containsClass(name)` と等価。
 */
export function containsClass(el: ElementRef, name: string): JsBoolExpr {
  return _makeJsBoolExpr(`${el.code}.classList.contains(${JSON.stringify(name)})`);
}

/**
 * 要素の `textContent` に値を代入する命令を発行する（Req 4.1）。
 * 文字列値は `JSON.stringify` でクォート、`JsExpr` はそのまま埋め込む。
 */
export function setText(scope: VanillaScope, el: ElementRef, value: string | JsExpr): void {
  scope._append({
    type: 'setProp',
    target: closureRef(el.code),
    prop: 'textContent',
    expr: encodeValue(value),
  });
}

/**
 * 要素の `textContent` 参照を `JsExpr` として返す（Req 4.1）。
 * `ElementRef.textContent` と等価な薄いラッパ。
 */
export function getText(el: ElementRef): JsExpr {
  return _makeJsExpr(`${el.code}.textContent`);
}

/**
 * 入力系要素の `value` に値を代入する命令を発行する（Req 4.2）。
 *
 * 要素型は `HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement` に制約され、
 * `<div>` 等の非入力要素への `.value` 代入は TypeScript の型エラーとなる。
 */
export function setValue(
  scope: VanillaScope,
  el: ElementRef<InputLikeElement>,
  value: string | JsExpr,
): void {
  scope._append({
    type: 'setProp',
    target: closureRef(el.code),
    prop: 'value',
    expr: encodeValue(value),
  });
}

/**
 * 入力系要素の `value` 参照を `JsExpr` として返す（Req 4.2）。
 * 要素型は入力系に制約される（型安全化）。
 */
export function getValue(el: ElementRef<InputLikeElement>): JsExpr {
  return _makeJsExpr(`${el.code}.value`);
}

/**
 * 要素の `style.<key>` に値を代入する命令を発行する（Req 4.3, 4.4）。
 *
 * 型パラメータ `K` は `WritableStyleKey`（`CSSStyleDeclaration` の書き込み可能プロパティ）
 * に制約され、未定義のプロパティ名は TypeScript の型エラーとなる。
 *
 * 文字列値は `JSON.stringify` でクォート、`JsExpr` は `.code` を未クォートで埋め込む。
 */
export function setStyle<K extends WritableStyleKey>(
  scope: VanillaScope,
  el: ElementRef,
  key: K,
  value: string | JsExpr,
): void {
  scope._append({
    type: 'setStyle',
    target: closureRef(el.code),
    key: key as string,
    expr: encodeValue(value),
  });
}
