/**
 * DOM クエリ API (`query` / `queryAll` / `forEach` / `filterNot` / `length` / `cache`) の実装。
 *
 * 設計書 `design.md` の「query-api」節と要件 2.1〜2.4 に対応する。
 *
 * - `query(scope, sel)` / `queryAll(scope, sel)` はセレクタを `JSON.stringify` でクォートし、
 *   `kind: "selector"` / `"listSelector"` の参照を返す（`scope` を内部保持し cache 可能にする）。
 * - `forEach(scope, list, body)` は `forEach` 命令を発行し、子スコープに `item` 変数を
 *   束縛した `ElementRef` を渡す。
 * - `filterNot(list, predicate)` / `length(list)` は合成 `JsExpr` を返し、
 *   `Array.from(...).filter(...).length` 形で埋め込まれる。
 * - `ElementRef.cache(name?)` は `element-ref.ts` 側に実装。現在スコープに
 *   `declareConst` を append して `kind: "var"` の新参照を返す。
 *
 * ファイル責務：ユーザ向け関数を export するのみで状態を持たない。
 */

import { renderCommands, type VanillaCommand } from '../commands.js';
import {
  _makeJsExpr,
  _makeScopedElementRef,
  _makeScopedElementListRef,
} from '../element-ref.js';
import type { ElementRef, ElementListRef, JsExpr, JsBoolExpr } from '../types.ts';
import type { VanillaScope } from '../vanilla-script-builder.ts';

/**
 * `document.querySelector(sel)` をインライン展開する `ElementRef` を生成する。
 * セレクタ文字列は `JSON.stringify` でクォート・エスケープされる（Req 2.1）。
 *
 * 返される参照は `scope` に紐付いており、`.cache(name?)` で `const` 畳み込みができる。
 *
 * @throws 空文字セレクタのとき `Error`。
 */
export function query<E extends Element = HTMLElement>(
  scope: VanillaScope,
  selector: string,
): ElementRef<E> {
  if (selector.length === 0) {
    throw new Error('query(): selector must not be empty');
  }
  return _makeScopedElementRef<E>(
    'selector',
    `document.querySelector(${JSON.stringify(selector)})`,
    scope,
  );
}

/**
 * `document.querySelectorAll(sel)` をインライン展開する `ElementListRef` を生成する（Req 2.2）。
 *
 * @throws 空文字セレクタのとき `Error`。
 */
export function queryAll<E extends Element = HTMLElement>(
  _scope: VanillaScope,
  selector: string,
): ElementListRef<E> {
  if (selector.length === 0) {
    throw new Error('queryAll(): selector must not be empty');
  }
  return _makeScopedElementListRef<E>(
    'listSelector',
    `document.querySelectorAll(${JSON.stringify(selector)})`,
  );
}

/**
 * リストを反復する `forEach` 命令を発行する（Req 2.3 副作用系）。
 *
 * 子スコープで `item` 変数名に `ElementRef` を束縛し、`body` に渡す。
 * リスト式が `NodeList` 形式（`querySelectorAll` 結果）でも `Array.from` に
 * 依存せずそのまま `.forEach` を呼べるため、`listExpr` は `list.code` をそのまま使う。
 */
export function forEach<E extends Element>(
  scope: VanillaScope,
  list: ElementListRef<E>,
  body: (innerScope: VanillaScope, item: ElementRef<E>) => void,
): void {
  const bodyQueue: VanillaCommand[] = [];
  const childScope = scope._childScope(bodyQueue);
  const itemRef = _makeScopedElementRef<E>('var', 'item', childScope);
  body(childScope, itemRef);
  const bodyCode = renderCommands(bodyQueue, '  ');
  scope._append({
    type: 'forEach',
    listExpr: list.code,
    itemVar: 'item',
    bodyCode,
  });
}

/**
 * 述語に一致しない要素だけを残す合成 `ElementListRef` を返す（Req 2.3 値系）。
 *
 * 出力形式: `Array.from(<list>).filter((x) => !<predicate(x)>)`。
 * 述語は `ElementRef`（`kind: "var"`、`code === "x"`）を受け取り、`JsBoolExpr` を返す純関数。
 */
export function filterNot<E extends Element>(
  list: ElementListRef<E>,
  predicate: (item: ElementRef<E>) => JsBoolExpr,
): ElementListRef<E> {
  // filter 述語の引数名は "x" 固定（forEach の "item" と名前を変えて衝突を避ける）。
  const itemRef = _itemRefForFilter<E>('x');
  const predCode = predicate(itemRef).code;
  const code = `Array.from(${list.code}).filter((x) => !(${predCode}))`;
  return _makeScopedElementListRef<E>('listExpr', code);
}

/**
 * リストの要素数を `JsExpr` として返す（Req 2.3 値系）。
 *
 * - `kind: "listSelector"`（`NodeList` 形式）: `.length` プロパティを直接参照する
 *   （`NodeList` はネイティブで `length` を持つ）。
 * - `kind: "listExpr"`（`filterNot` の結果など `Array.from(...).filter(...)` 形式）:
 *   既に `Array` なので `.length` を直接参照する。
 *
 * この設計により、`length(filterNot(queryAll(...), pred)).code` は
 * `Array.from(<sel>).filter((x) => !(<pred>)).length` 形になり、重複 `Array.from` を避ける。
 */
export function length(list: ElementListRef): JsExpr {
  return _makeJsExpr(`${list.code}.length`);
}

/**
 * `filterNot` 用の軽量 ElementRef（スコープ非紐付け）。
 * `cache()` を呼ばれても例外になるよう、スコープは渡さない。
 * 純粋に述語内で `x.classList.contains(...)` 等のチェーンを構築するためだけの参照。
 */
function _itemRefForFilter<E extends Element>(name: string): ElementRef<E> {
  // スコープ無し＝ cache() 不可。述語内で cache は意味を持たない（副作用不可）。
  return _makeScopedElementRef<E>('var', name, _NO_SCOPE_SENTINEL);
}

/**
 * 述語評価で scope が必要にならないことをランタイムで担保するための番兵スコープ。
 * 述語が誤って `s.let(...)` 等を呼んだ場合は早期に Error を投げる。
 */
const _NO_SCOPE_SENTINEL: VanillaScope = {
  _append() {
    throw new Error(
      'filterNot predicate must not emit commands; use pure ElementRef chain methods only.',
    );
  },
  _childScope() {
    throw new Error('filterNot predicate must not open child scopes.');
  },
  raw(code) {
    return { code };
  },
  let() {
    throw new Error('filterNot predicate must not declare variables.');
  },
  call() {
    throw new Error('filterNot predicate must not emit call expressions.');
  },
  return() {
    throw new Error('filterNot predicate must not emit return statements.');
  },
  ifThen() {
    throw new Error('filterNot predicate must not emit control flow.');
  },
};
