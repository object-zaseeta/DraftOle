/**
 * `SelectorRef<E>` / `CollectionRef<E>` の実装。
 *
 * 本モジュールは `unified-element-api` 仕様の Task 3.4 に対応し、
 * `root.$` / `root.$$` の戻り値として公開するセレクタ参照ノードを提供する。
 *
 * 設計方針:
 * - `SelectorRef<E>` は `ElementMethods<SelectorRef<E>>` を実装し、内部で
 *   `VanillaScope` と `ElementRef<E>` を保持して DOM 操作メソッドを提供する。
 * - `CollectionRef<E>` は `VanillaScope` と `ElementListRef<E>` を保持し、
 *   `filterNot` / `length` / `removeAll` / `forEach` を提供する。
 * - 内部実装は `internal/dom-api` / `internal/query-api` / `internal/tree-api` に委譲する。
 * - `on` ハンドラ / `forEach` 本体のスコープは `_makeHandlerScope` を再利用する。
 *
 * 対応 requirement: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 (unified-element-api)
 * 依存: Task 3.3 (ElementMethods, _makeHandlerScope, renderElementTarget, HasPending)
 *       Task 1.2 (internal/query-api, dom-api, tree-api)
 */

import { renderCommands, type ElementTarget, type VanillaCommand } from './commands.js';
import { encodeLiteral } from './expr-factory.js';
import { _makeScopedElementRef } from './element-ref.js';
import {
  _makeHandlerScope,
  _getElementTarget,
  isArrowShape,
  type ElementMethods,
  type HandlerCallback,
  type HasPending,
} from './element-methods.js';
import { containsClass as _containsClass } from './internal/dom-api.js';
import { filterNot as _filterNot } from './internal/query-api.js';
import { removeAll as _removeAll } from './internal/tree-api.js';
import type { ScriptScope } from './script-scope.ts';
import {
  emitBindChecked,
  emitBindClassAdd,
  emitBindClassAll,
  emitBindEach,
  emitBindStyle,
  emitBindText,
  emitBindValue,
} from './state/binding-emitter.js';
import type { EachBinding, ReadableState } from './state/state.js';
import type { EachTemplateSnapshot } from './state/each-template.js';
import { isReadableState } from './state/type-guards.js';
import type { ElementListRef, ElementRef, JsBoolExpr, JsExpr } from './types.ts';
import type { VanillaScope } from './vanilla-script-builder.ts';

// ─────────────────────────────────────────────────────────────────────────────
// 公開型定義
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `root.$<E>(selector)` の戻り値。
 *
 * `ElementMethods<SelectorRef<E>>` を実装し、セレクタ対象要素への
 * DOM 操作メソッドを提供する。加えて `containsClass` / `cache` を追加する。
 *
 * 設計: SelectorRef は常に scope に紐付いており、バッファを持たない
 *（Root への登録が前提のため、即時 scope._append する）。
 */
export interface SelectorRef<E extends Element = HTMLElement> extends ElementMethods<SelectorRef<E>> {
  /** `element.classList.contains(name)` を `JsBoolExpr` として返す（Req 2.4）。 */
  containsClass(name: string): JsBoolExpr;
  /**
   * セレクタ結果をローカル変数にキャッシュし、新しい `SelectorRef` を返す（Req 2.5）。
   * 同一セレクタを複数回埋め込む副作用を避けたい場合に使用する。
   */
  cache(name: string): SelectorRef<E>;
}

/**
 * `root.$$<E>(selector)` の戻り値。
 *
 * `filterNot` / `length` / `removeAll` / `forEach` を提供するコレクション参照。
 */
export interface CollectionRef<E extends Element = HTMLElement> {
  /**
   * 述語に一致しない要素だけを残す新しい `CollectionRef` を返す（Req 2.3）。
   * 式の合成のみを行い、scope にコマンドを追加しない。
   */
  filterNot(predicate: (ref: SelectorRef<E>) => JsBoolExpr): CollectionRef<E>;
  /** コレクション内の要素数を `JsExpr` として返す（Req 2.3）。 */
  readonly length: JsExpr;
  /** コレクション内の全要素を削除する命令を scope に追加する（Req 2.3）。 */
  removeAll(): void;
  /**
   * コレクションを反復する `forEach` 命令を scope に追加する（Req 2.3）。
   * コールバックは `SelectorRef<E>` と `ScriptScope` を受け取る。
   */
  forEach(body: (ref: SelectorRef<E>, s: ScriptScope) => void): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectorRef ファクトリ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `SelectorRef<E>` を生成する内部ファクトリ。
 *
 * `root.$<E>(selector)` から呼ばれる。scope は Root の VanillaScope。
 */
export function createSelectorRef<E extends Element = HTMLElement>(
  scope: VanillaScope,
  ref: ElementRef<E>,
): SelectorRef<E> {
  // `ref.code` は既に完全な JS 式（`document.querySelector(...)` または変数名）なので
  // `{ kind: 'closure-ref', varName: ref.code }` として binding-emitter に渡す。
  // closure-ref バリアントは renderElementTarget で裸の識別子としてそのまま埋め込まれる。
  const elTarget: ElementTarget = { kind: 'closure-ref', varName: ref.code };

  /** `EachBinding<U>` + `_snapshot` を持つかどうかを判別するタイプガード */
  function isEachBindingWithSnapshot(
    v: unknown,
  ): v is EachBinding<unknown> & { readonly _snapshot: EachTemplateSnapshot } {
    return (
      typeof v === 'object' &&
      v !== null &&
      (v as EachBinding<unknown>)._kind === 'each' &&
      '_snapshot' in v
    );
  }

  // `on` の実装シグネチャ（task 2.2 で 3分岐 dispatcher を追加）。
  // インターフェース上は 3 つのオーバーロードを持つが、実装シグネチャは単一。
  // 型アサーションで SelectorRef<E>.on の型をオーバーライドし、型不整合エラーを回避する。
  function onImpl(event: string, handler: HandlerCallback): SelectorRef<E> {
    // dispatcher: transformer 経由（_draftoleEmitted マーカー）
    if ((handler as unknown as { _draftoleEmitted?: boolean })._draftoleEmitted === true) {
      const bodyQueue: VanillaCommand[] = [];
      const childScope = _makeHandlerScope(bodyQueue, elTarget, event);
      handler(childScope);
      for (const cmd of bodyQueue) {
        scope._append(cmd);
      }
      return self;
    }

    // dispatcher: 未変換アロー関数 safety net
    if (isArrowShape(handler as unknown as (...args: unknown[]) => unknown)) {
      throw new Error(
        'DraftOle: arrow-function handler requires the draftole TypeScript transformer; see docs/api/handler-serialization.md',
      );
    }

    // dispatcher: 従来の HandlerCallback 経路
    const bodyQueue: VanillaCommand[] = [];
    const childScope = _makeHandlerScope(bodyQueue);
    handler(childScope);
    const bodyCode = renderCommands(bodyQueue, '  ');
    const handlerCode = bodyCode.length === 0 ? '(e) => {}' : `(e) => {\n${bodyCode}\n}`;
    scope._append({ type: 'addEventListener', target: elTarget, event, handlerCode });
    return self;
  }

  const self: SelectorRef<E> = {
    on: onImpl as SelectorRef<E>['on'],

    setText(value: string | JsExpr | ReadableState<string>) {
      if (isReadableState<string>(value)) {
        scope._append(emitBindText(elTarget, value));
      } else {
        scope._append({ type: 'setProp', target: elTarget, prop: 'textContent', expr: encodeLiteral(value) });
      }
      return self;
    },

    text(value: string | JsExpr | ReadableState<string>) {
      return self.setText(value);
    },

    setValue(value: string | JsExpr | ReadableState<string>) {
      if (isReadableState<string>(value)) {
        scope._append(emitBindValue(elTarget, value));
      } else {
        scope._append({ type: 'setProp', target: elTarget, prop: 'value', expr: encodeLiteral(value) });
      }
      return self;
    },

    value(v: string | JsExpr | ReadableState<string>) {
      return self.setValue(v);
    },

    setStyle(prop: string, value: string | JsExpr | ReadableState<string>) {
      if (isReadableState<string>(value)) {
        scope._append(emitBindStyle(elTarget, prop, value));
      } else {
        scope._append({ type: 'setStyle', target: elTarget, key: prop, expr: encodeLiteral(value) });
      }
      return self;
    },

    addClass(name: string | ReadableState<string>) {
      if (isReadableState<string>(name)) {
        scope._append(emitBindClassAdd(elTarget, name));
      } else {
        scope._append({ type: 'classListAdd', target: elTarget, name });
      }
      return self;
    },

    class(name: string | JsExpr | ReadableState<string>) {
      if (isReadableState<string>(name)) {
        scope._append(emitBindClassAll(elTarget, name));
      } else {
        const nameStr = typeof name === 'string' ? name : name.code;
        scope._append({ type: 'classListAdd', target: elTarget, name: nameStr });
      }
      return self;
    },

    checked(value: ReadableState<boolean>) {
      scope._append(emitBindChecked(elTarget, value));
      return self;
    },

    toggleClass(name, force) {
      scope._append({ type: 'classListToggle', target: elTarget, name, force: force?.code });
      return self;
    },

    removeClass(name) {
      scope._append({ type: 'classListRemove', target: elTarget, name });
      return self;
    },

    appendChild(child: unknown) {
      if (isEachBindingWithSnapshot(child)) {
        scope._append(emitBindEach(elTarget, child));
      } else {
        const childTarget = _getElementTarget(child as unknown as HasPending);
        scope._append({
          type: 'appendChild',
          parent: elTarget,
          child: childTarget,
        });
      }
      return self;
    },

    containsClass(name) {
      return _containsClass(ref as ElementRef, name);
    },

    cache(name) {
      const cachedRef = ref.cache(name);
      return createSelectorRef(scope, cachedRef);
    },
  };
  return self;
}

// ─────────────────────────────────────────────────────────────────────────────
// CollectionRef ファクトリ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `CollectionRef<E>` を生成する内部ファクトリ。
 *
 * `root.$$<E>(selector)` から呼ばれる。scope は Root の VanillaScope。
 */
export function createCollectionRef<E extends Element = HTMLElement>(
  scope: VanillaScope,
  listRef: ElementListRef<E>,
): CollectionRef<E> {
  return {
    filterNot(predicate) {
      const filtered = _filterNot<E>(listRef, (item) =>
        predicate(createSelectorRef<E>(_NO_SCOPE_SENTINEL, item)),
      );
      return createCollectionRef(scope, filtered);
    },

    get length() {
      return listRef.length;
    },

    removeAll() {
      _removeAll(scope, listRef);
    },

    forEach(body) {
      const bodyQueue: VanillaCommand[] = [];
      const childScope = _makeHandlerScope(bodyQueue);
      const itemRef = _makeScopedElementRef<E>('var', 'item', childScope);
      const itemSelectorRef = createSelectorRef(childScope, itemRef);
      body(itemSelectorRef, childScope);
      const bodyCode = renderCommands(bodyQueue, '  ');
      scope._append({ type: 'forEach', listExpr: listRef.code, itemVar: 'item', bodyCode });
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部: フィルタ述語用の番兵スコープ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `filterNot` 述語評価で副作用操作が呼ばれた場合に早期 Error を投げる番兵スコープ。
 * 述語は純粋な式合成のみを想定しており、scope への命令 append は禁止する。
 */
const _NO_SCOPE_SENTINEL: VanillaScope = {
  _append() {
    throw new Error('filterNot predicate must not emit commands; use pure SelectorRef chain methods only.');
  },
  // 防御的 fallback: 以下 _childScope メソッドは SelectorRef の全 mutator が
  // scope._append() 経由でのみ命令を発行するため、filterNot 述語経由でも
  // 到達不能。将来の内部リファクタで誤って到達経路が生まれた場合に備えた
  // 静的ガードとして保持する。
  /* v8 ignore start */
  _childScope() {
    throw new Error('filterNot predicate must not open child scopes.');
  },
  /* v8 ignore stop */
  raw(code) {
    return { code };
  },
  // 防御的 fallback: 以下 4 メソッド (let / call / return / ifThen) は
  // SelectorRef の全 mutator が scope._append() 経由でのみ命令を発行するため、
  // filterNot 述語経由でも到達不能。将来の内部リファクタで誤って到達経路が
  // 生まれた場合に備えた静的ガードとして保持する。
  /* v8 ignore start */
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
  /* v8 ignore stop */
};
