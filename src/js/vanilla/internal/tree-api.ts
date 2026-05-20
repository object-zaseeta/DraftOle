/**
 * DOM ツリー操作 API (`appendChild` / `remove` / `removeAll`) の実装。
 *
 * 設計書 `design.md` の「tree-api: appendChild / remove / removeAll」節と
 * 要件 5.1, 5.2, 5.3, 6.2 に対応する。
 *
 * - `appendChild(scope, parent, child)` は `appendChild` 命令を発行する。
 *   `child` は `ElementRef` もしくは `JsExpr`（`jsTemplate` 生成関数の呼び出し結果など、
 *   `.code` を備えた値オブジェクト）を受け付ける（Req 5.1, 6.2）。
 * - `remove(scope, el)` は単一要素の `remove` 命令を発行する（Req 5.2）。
 * - `removeAll(scope, list)` は `list.forEach((item) => { item.remove(); })` 相当の
 *   `forEach` 命令を発行する（Req 5.3）。子スコープ内では `remove(childScope, item)` を
 *   通じて同じ `remove` 命令を発行するため、語彙集約（`commands.ts`）の単一責務を維持する。
 * - 出力に `jQuery` / `$` は含めない（Req 1.5, 7.1、`commands.ts` の語彙集約による担保）。
 *
 * 本ファイルは `VanillaScope` インターフェースを API で汚染しないため、
 * スコープを引数に取る自由関数として提供する。内部 append は `VanillaScope._append` 経由で行う。
 */

import { renderCommands, type ElementTarget, type VanillaCommand } from '../commands.js';
import { _makeScopedElementRef } from '../element-ref.js';
import type { ElementListRef, ElementRef, JsExpr } from '../types.ts';
import type { VanillaScope } from '../vanilla-script-builder.ts';

/**
 * `.code` を備えた任意の値オブジェクト（`ElementRef` / `JsExpr` / `ScopeExpr`）。
 * `child` 引数の型制約として使用する。
 */
interface CodeBearing {
  readonly code: string;
}

/**
 * `parent.appendChild(child);` を現在スコープに発行する（Req 5.1, 6.2）。
 *
 * `child` は `ElementRef` または任意の `JsExpr`（関数呼び出し結果など `.code` を備えた式）を
 * 受け付ける。後者により `appendChild(scope, parent, call("createTodoItem", [text]))` のような
 * ファクトリ関数結果の直接追加が可能になる。
 */
export function appendChild(
  scope: VanillaScope,
  parent: ElementRef,
  child: ElementRef | JsExpr | CodeBearing,
): void {
  scope._append({
    type: 'appendChild',
    parent: { kind: 'closure-ref', varName: parent.code },
    child: { kind: 'closure-ref', varName: child.code },
  });
}

/**
 * `el.remove();` を現在スコープに発行する（Req 5.2）。
 */
export function remove(scope: VanillaScope, el: ElementRef): void {
  const elTarget: ElementTarget = { kind: 'closure-ref', varName: el.code };
  scope._append({ type: 'remove', target: elTarget });
}

/**
 * `list.forEach((item) => { item.remove(); });` 相当の命令を現在スコープに発行する（Req 5.3）。
 *
 * 子スコープを開き、`item` 変数を `ElementRef` として束縛したうえで `remove(childScope, item)`
 * を呼び出すことで、`remove` 命令を `forEach` 本体内に 1 件 append する。
 * `listExpr` には `list.code` をそのまま埋め込む（`NodeList` でも `.forEach` が使えるため
 * `Array.from` ラップは不要）。
 */
export function removeAll<E extends Element>(
  scope: VanillaScope,
  list: ElementListRef<E>,
): void {
  const bodyQueue: VanillaCommand[] = [];
  const childScope = scope._childScope(bodyQueue);
  const itemRef = _makeScopedElementRef<E>('var', 'item', childScope);
  remove(childScope, itemRef);
  const bodyCode = renderCommands(bodyQueue, '  ');
  scope._append({
    type: 'forEach',
    listExpr: list.code,
    itemVar: 'item',
    bodyCode,
  });
}
