/**
 * `ElementMethods<Self>` 型と `ElementMixin` の実装。
 *
 * 本モジュールは `unified-element-api` 仕様の Task 3.3 に対応し、
 * `HtmlTag` サブクラスへの DOM 操作メソッドの mixin 差し込みを提供する。
 * Task 4.1 で reactive-state 仕様の状態受容オーバーロードを追加した。
 *
 * 設計方針:
 * - `ElementMethods<Self>` は `.on/.setText/.setValue/.setStyle/.addClass/.toggleClass
 *   /.removeClass/.appendChild` を定義するジェネリックインターフェース。
 * - `applyElementMixin(proto)` は `HtmlTag` の prototype 上に各メソッドを直接差し込む
 *   （module augmentation ではなく composition-root 側で呼び出す）。
 * - 各メソッドは `_scope === undefined` の間は `_pending` バッファに追加し、
 *   `_scope` が設定済みの場合は即時 `_scope._append` を呼び出す（遅延解決モデル）。
 * - 文字列引数は `encodeLiteral`（= JSON.stringify）でリテラル化し、`JsExpr` は `.code` を素通し（Req 4.5）。
 * - `on` ハンドラは `ScriptScope` 型の子スコープを受け取り、本体を即時評価してから
 *   文字列化した `handlerCode` を `addEventListener` 命令に埋め込む。
 * - 状態受容経路: `ReadableState<T>` を受け取った場合は `binding-emitter` 経由で
 *   `bind-*` コマンドを生成し、`appendCmd` で PendingBuffer に積む（Req 4.1–4.7）。
 *
 * 対応 requirement: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1–4.7 (reactive-state)
 * 依存: Task 2.2 (PendingBuffer), Task 3.1 (ScriptScope), Task 3.2 (ExprFactory.encodeLiteral),
 *        Task 3.3 (binding-emitter), Task 2.3 (each-template)
 */

import { renderCommands, type VanillaCommand } from './commands.js';
import type { ElementTarget } from './element-target.js';
import { encodeLiteral } from './expr-factory.js';
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
import type { EachTemplateSnapshot } from './state/each-template.js';
import { createScriptStateHandle } from './state/script-state-handle.js';
import type { EachBinding, ReadableState } from './state/state.js';
import { isReadableState } from './state/type-guards.js';
import type { JsBoolExpr, JsExpr } from './types.ts';
import type { ScopeExpr, VanillaScope } from './vanilla-script-builder.ts';
import type { HtmlTag } from '../../html/elements/html-tag.js';
import type { HtmlAttributeShape } from '../../html/protocols/html-tag-protocol.js';

// ─── TypeScript 型拡張 ────────────────────────────────────────────────────────
// HtmlTag への ElementMethods 合流は、`html-tag.ts` 同一モジュール内の宣言マージで行う
// （`export interface HtmlTag extends ElementMethods<HtmlTag>`）。
// クロスモジュールの `declare module` はバンドル後の相対パス解決に依存するため使わない。

// ─────────────────────────────────────────────────────────────────────────────
// 公開型定義
// ─────────────────────────────────────────────────────────────────────────────

/** `on` ハンドラのコールバック型。ハンドラ内では ScriptScope の制御フロー API を利用できる。 */
export type HandlerCallback = (s: ScriptScope) => void;

/**
 * アロー関数形式のイベントハンドラ型（handler-serialization Task 2.1）。
 *
 * イベント引数を受け取る形式（`(e: Ev) => void`）と
 * ゼロ引数形式（`() => void`）の両方を受け付ける。
 * `Ev` は `HTMLElementEventMap` のイベント型（例: `MouseEvent`, `InputEvent`）。
 */
export type ArrowHandler<Ev extends Event = Event> =
  | (() => void)
  | ((e: Ev) => void);

/**
 * DOM 操作メソッド群を定義するジェネリックインターフェース。
 *
 * `Self` は戻り値型（メソッドチェーンのため）。HtmlTag サブクラスでは `Self = HtmlTag`、
 * `SelectorRef<E>` では `Self = SelectorRef<E>` を渡す。
 * 未定義メソッドはコンパイル時に型エラーとして検出可能（Req 1.4）。
 * 各メソッドは `Self`（= `this`）を返し、CSS チェーンと連結可能（Req 1.5）。
 */
export interface ElementMethods<Self> {
  /**
   * 要素にイベントリスナを追加する JS 文を生成する（既存: HandlerCallback 形式）。
   *
   * @param event - `addEventListener` に渡すイベント名（例: `'click'`）
   * @param handler - ハンドラ本体を構築するコールバック。引数 `s` は `ScriptScope`
   */
  on(event: string, handler: HandlerCallback): Self;

  /**
   * 要素にイベントリスナを追加する JS 文を生成する（ArrowHandler: keyof HTMLElementEventMap 形式）。
   *
   * イベント名 `K` が `HTMLElementEventMap` のキーのとき、ハンドラ引数 `e` が
   * `HTMLElementEventMap[K]`（例: `click` → `MouseEvent`）として推論される（Req 1.3）。
   *
   * @param event - `HTMLElementEventMap` のキー（例: `'click'`, `'input'`）
   * @param handler - アロー関数形式のハンドラ。`(e: MouseEvent) => void` または `() => void`
   */
  on<K extends keyof HTMLElementEventMap>(
    event: K,
    handler: ArrowHandler<HTMLElementEventMap[K]>,
  ): Self;

  /**
   * 要素にイベントリスナを追加する JS 文を生成する（ArrowHandler: 任意イベント名フォールバック）。
   *
   * `HTMLElementEventMap` に存在しないカスタムイベント名向けのフォールバック。
   * ハンドラ引数型は `Event` になる。
   *
   * @param event - 任意のイベント名文字列
   * @param handler - アロー関数形式のハンドラ
   */
  on(event: string, handler: ArrowHandler<Event>): Self;

  /**
   * `element.textContent = value` に対応する JS 文を生成する。
   * `ReadableState<string>` を渡すと bind-text コマンドを発行する（Req 4.1）。
   * 即値（string / JsExpr）の場合は setProp textContent を生成する（Req 4.6）。
   */
  setText(value: string | JsExpr | ReadableState<string>): Self;

  /**
   * `setText` の便宜エイリアス（R-3 決定）。
   */
  text(value: string | JsExpr | ReadableState<string>): Self;

  /**
   * `element.value = value` に対応する JS 文を生成する。
   * `ReadableState<string>` を渡すと bind-value コマンドを発行する（Req 4.2）。
   * 即値（string / JsExpr）の場合は setProp value を生成する（Req 4.6）。
   */
  setValue(value: string | JsExpr | ReadableState<string>): Self;

  /**
   * `setValue` の便宜エイリアス（R-3 決定）。
   */
  value(value: string | JsExpr | ReadableState<string>): Self;

  /**
   * `element.style[prop] = value` に対応する JS 文を生成する。
   * `ReadableState<string>` を渡すと bind-style コマンドを発行する（Req 4.4）。
   * 即値（string / JsExpr）の場合は setStyle コマンドを生成する（Req 4.6）。
   */
  setStyle(prop: string, value: string | JsExpr | ReadableState<string>): Self;

  /**
   * `element.classList.add(name)` に対応する JS 文を生成する。
   * `ReadableState<string>` を渡すと bind-class-add コマンドを発行する（Req 4.3）。
   * 即値（string）の場合は classListAdd を生成する（Req 4.6）。
   */
  addClass(name: string | ReadableState<string>): Self;

  /**
   * クラス名全体を状態値で置換する便宜エイリアス（Req 4.5, R-3 決定）。
   * `ReadableState<string>` は bind-class-all コマンドを発行する。
   */
  class(name: string | JsExpr | ReadableState<string>): Self;

  /**
   * `input.checked` を状態値にバインドする（Req 4.x）。
   * `ReadableState<boolean>` を受け取り bind-attr（checked）コマンドを発行する。
   */
  checked(value: ReadableState<boolean>): Self;

  /**
   * `element.classList.toggle(name, force?)` に対応する JS 文を生成する。
   *
   * @param name - トグル対象のクラス名
   * @param force - 省略時は無条件トグル。`JsBoolExpr` を渡すと force 引数として埋め込む
   */
  toggleClass(name: string, force?: JsBoolExpr): Self;

  /**
   * `element.classList.remove(name)` に対応する JS 文を生成する。
   *
   * @param name - 削除するクラス名
   */
  removeClass(name: string): Self;

  /**
   * `parent.appendChild(child)` に対応する JS 文を生成する。
   * `EachBinding<U>` を渡すと bind-each コマンドを発行する（Req 4.7）。
   * `HtmlTag` を渡すと通常の appendChild コマンドを生成する（Req 1.1）。
   *
   * @param child - 子として追加する `HtmlTag`（`id` 属性必須）または `EachBinding<U>`
   */
  appendChild<U extends HtmlTag | readonly HtmlTag[]>(child: HtmlTag | EachBinding<U>): Self;
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部ヘルパー
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `ElementMixin` が操作する最小インターフェース。
 * `HtmlTag` が持つ `_pending` / `_scope` / `attributes` に対応する。
 */
export interface HasPending {
  _pending: VanillaCommand[];
  _scope: VanillaScope | undefined;
  readonly attributes: ReadonlyArray<HtmlAttributeShape>;
}

/**
 * 要素の `id` 属性から `ElementTarget` を生成する。
 * `binding-emitter` および `renderElementTarget` 経由の selector 系命令で使用する。
 *
 * - `id` 属性が設定されている場合: `{ kind: 'sel', selector: '#${id}' }` を返す（後方互換）。
 * - `id` 属性が設定されていない場合: `{ kind: 'deferred-self' }` を返す（例外を投げない）。
 *   render フェーズで id 自動生成後に target が確定する。
 *
 * Requirements: 1.1, 1.2, 1.3, 2.1
 */
export function _getElementTarget(el: HasPending): ElementTarget {
  for (const attr of el.attributes) {
    if (attr.key === 'id') {
      const av = attr.attributeValue;
      if (av.type === 'keyValue') {
        return { kind: 'sel', selector: `#${av.value}` };
      }
    }
  }
  return { kind: 'deferred-self' };
}

/**
 * `EachBinding<U>` かどうかを判別するタイプガード。
 * `_kind === 'each'` で判定する（design.md の判別方法）。
 */
function isEachBinding(v: unknown): v is EachBinding<unknown> & { readonly _snapshot: EachTemplateSnapshot } {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as EachBinding<unknown>)._kind === 'each' &&
    '_snapshot' in v
  );
}

/**
 * `_scope` の状態に応じてコマンドをバッファまたは即時発行する。
 * - `_scope === undefined`: `_pending` へ push（遅延解決モデル: Unbound 状態）
 * - `_scope !== undefined`: `_scope._append` を直接呼ぶ（Bound 状態）
 */
function appendCmd(el: HasPending, cmd: VanillaCommand): void {
  if (el._scope !== undefined) {
    el._scope._append(cmd);
  } else {
    el._pending.push(cmd);
  }
}

/**
 * `handler.toString()` の先頭に `function` キーワードがあるかを判定する粗いチェック。
 *
 * `function` キーワードがなければアロー関数（または class メソッド等）と見なす。
 * 本体の構文解析はせず、実行時コストを最小化する（design.md D-5）。
 *
 * @returns `true` の場合、アロー関数形式（transformer 未適用の素のアロー）と判定する
 */
export function isArrowShape(fn: (...args: unknown[]) => unknown): boolean {
  return !fn.toString().trimStart().startsWith('function');
}

/**
 * イベントハンドラ本体用の最小 `ScriptScope` を生成する内部ファクトリ。
 *
 * `VanillaScope._childScope` と同等のパターンを inline で実装し、
 * 追加で `ScriptScope` 固有の `.if` / `.fn` / `.onDomReady` を提供する。
 * `fn` と `onDomReady` はハンドラスコープ内では意味をなさないため、
 * 呼ばれた場合はエラーをスローする。
 *
 * この実装は `vanilla-script-builder.ts` 内の `createScope` と同じパターンを用いるが、
 * 内部関数は export されていないため、ここで独立して再実装する。
 *
 * @param queue - コマンドを積むバッファ
 * @param handlerBodyTarget - `_emitHandlerBody` で使う `handler-body` コマンドのターゲット。
 *                            transformer 経由の dispatcher 経路でのみ指定する。
 * @param handlerBodyEvent - `_emitHandlerBody` で使うイベント名。transformer 経路でのみ指定。
 */
export function _makeHandlerScope(
  queue: VanillaCommand[],
  handlerBodyTarget?: ElementTarget,
  handlerBodyEvent?: string,
): ScriptScope {
  function make(q: VanillaCommand[]): ScriptScope {
    function buildIf(
      condition: ScopeExpr,
      then: (s: ScriptScope) => void,
      orElse: ((s: ScriptScope) => void) | undefined,
    ): void {
      const thenQ: VanillaCommand[] = [];
      then(make(thenQ));
      const thenCode = renderCommands(thenQ, '  ');
      if (orElse !== undefined) {
        const elseQ: VanillaCommand[] = [];
        orElse(make(elseQ));
        q.push({ type: 'if', condition: condition.code, thenCode, elseCode: renderCommands(elseQ, '  ') });
      } else {
        q.push({ type: 'if', condition: condition.code, thenCode });
      }
    }

    const scope: ScriptScope = {
      _append(cmd) {
        q.push(cmd);
      },
      _childScope(innerQ) {
        return make(innerQ);
      },
      raw(code): ScopeExpr {
        return { code };
      },
      let(name, value): ScopeExpr {
        q.push({ type: 'declareConst', name, expr: value.code });
        return { code: name };
      },
      call(name, args): ScopeExpr {
        const argList = (args ?? []).map((a) => a.code).join(', ');
        const code = `${name}(${argList})`;
        q.push({ type: 'expr', code });
        return { code };
      },
      return() {
        q.push({ type: 'raw', code: 'return;' });
      },
      ifThen(condition, then, orElse) {
        buildIf(condition, (s) => then(s), orElse === undefined ? undefined : (s) => orElse(s));
      },
      if(condition, then, orElse) {
        buildIf(condition, then, orElse);
      },
      fn() {
        throw new Error(
          'ElementMixin: fn() is not supported in event handler scope. ' +
            'Use root.script.fn() to define top-level functions.',
        );
      },
      onDomReady() {
        throw new Error(
          'ElementMixin: onDomReady() is not supported in event handler scope. ' +
            'Use root.script.onDomReady() to register DOMContentLoaded handlers.',
        );
      },
      state<T>(ref: ReadableState<T>) {
        return createScriptStateHandle(ref, scope);
      },
      _emitHandlerBody(code: string, params: readonly string[]) {
        if (handlerBodyTarget === undefined || handlerBodyEvent === undefined) {
          throw new Error(
            'ElementMixin: _emitHandlerBody() called on a scope not configured for handler-body emission. ' +
              'This method is only available in the transformer-emitted handler scope.',
          );
        }
        q.push({ type: 'handler-body', target: handlerBodyTarget, event: handlerBodyEvent, code, params });
      },
    };
    return scope;
  }
  return make(queue);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mixin 適用関数
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `HtmlTag` の prototype に `ElementMethods` の各メソッドを差し込む。
 *
 * `composition-root.ts` から一度だけ呼ばれることを想定する。
 * 二重適用は無害だが不要。
 *
 * 実装上の注意: `proto` のキャストは `HtmlTag` が抽象クラスであり、
 * TypeScript 上は具象サブクラスのプロトタイプを渡すことができないため
 * `unknown` を介したキャストを使用する。
 */
export function applyElementMixin(proto: HtmlTag): void {
  const p = proto as unknown as Record<string, unknown>;

  p['on'] = function on(this: HasPending, event: string, handler: HandlerCallback): typeof this {
    // dispatcher: transformer 経由（_draftoleEmitted マーカー）
    if ((handler as unknown as { _draftoleEmitted?: boolean })._draftoleEmitted === true) {
      const elementTarget = _getElementTarget(this);
      const bodyQueue: VanillaCommand[] = [];
      const childScope = _makeHandlerScope(bodyQueue, elementTarget, event);
      handler(childScope);
      // _emitHandlerBody が handler-body コマンドを bodyQueue に積んでいるのでそのまま転送
      for (const cmd of bodyQueue) {
        appendCmd(this, cmd);
      }
      return this;
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
    appendCmd(this, { type: 'addEventListener', target: _getElementTarget(this), event, handlerCode });
    return this;
  };

  p['setText'] = function setText(this: HasPending, value: string | JsExpr | ReadableState<string>): typeof this {
    if (isReadableState<string>(value)) {
      appendCmd(this, emitBindText(_getElementTarget(this), value));
    } else {
      appendCmd(this, { type: 'setProp', target: _getElementTarget(this), prop: 'textContent', expr: encodeLiteral(value) });
    }
    return this;
  };

  p['text'] = function text(this: HasPending, value: string | JsExpr | ReadableState<string>): typeof this {
    return (p['setText'] as (this: HasPending, v: string | JsExpr | ReadableState<string>) => typeof this).call(this, value);
  };

  p['setValue'] = function setValue(this: HasPending, value: string | JsExpr | ReadableState<string>): typeof this {
    if (isReadableState<string>(value)) {
      appendCmd(this, emitBindValue(_getElementTarget(this), value));
    } else {
      appendCmd(this, { type: 'setProp', target: _getElementTarget(this), prop: 'value', expr: encodeLiteral(value) });
    }
    return this;
  };

  p['value'] = function value(this: HasPending, v: string | JsExpr | ReadableState<string>): typeof this {
    return (p['setValue'] as (this: HasPending, v: string | JsExpr | ReadableState<string>) => typeof this).call(this, v);
  };

  p['setStyle'] = function setStyle(
    this: HasPending,
    prop: string,
    value: string | JsExpr | ReadableState<string>,
  ): typeof this {
    if (isReadableState<string>(value)) {
      appendCmd(this, emitBindStyle(_getElementTarget(this), prop, value));
    } else {
      appendCmd(this, {
        type: 'setStyle',
        target: _getElementTarget(this),
        key: prop,
        expr: encodeLiteral(value),
      });
    }
    return this;
  };

  // NOTE: `HtmlTag` に既存の getter `style` がある（`this._css.styleManager.style` を返す）。
  // `style` という名前でメソッドを登録すると既存 getter が隠蔽されて互換性が壊れるため、
  // `style` エイリアスは登録しない。`setStyle` オーバーロードで同等の機能を提供する。
  // design.md の R-3 決定では便宜エイリアスとして挙げられているが、
  // 本プロジェクトの HtmlTag.style getter との競合を優先して未実装とする。

  p['addClass'] = function addClass(this: HasPending, name: string | ReadableState<string>): typeof this {
    if (isReadableState<string>(name)) {
      appendCmd(this, emitBindClassAdd(_getElementTarget(this), name));
    } else {
      appendCmd(this, { type: 'classListAdd', target: _getElementTarget(this), name });
    }
    return this;
  };

  p['class'] = function cls(this: HasPending, name: string | JsExpr | ReadableState<string>): typeof this {
    if (isReadableState<string>(name)) {
      appendCmd(this, emitBindClassAll(_getElementTarget(this), name));
    } else {
      // 即値経路: classListAdd として扱う（文字列のみ; JsExpr は name.code を使用）
      const nameStr = typeof name === 'string' ? name : name.code;
      appendCmd(this, { type: 'classListAdd', target: _getElementTarget(this), name: nameStr });
    }
    return this;
  };

  p['checked'] = function checked(this: HasPending, value: ReadableState<boolean>): typeof this {
    appendCmd(this, emitBindChecked(_getElementTarget(this), value));
    return this;
  };

  p['toggleClass'] = function toggleClass(
    this: HasPending,
    name: string,
    force?: JsBoolExpr,
  ): typeof this {
    appendCmd(this, {
      type: 'classListToggle',
      target: _getElementTarget(this),
      name,
      force: force?.code,
    });
    return this;
  };

  p['removeClass'] = function removeClass(this: HasPending, name: string): typeof this {
    appendCmd(this, { type: 'classListRemove', target: _getElementTarget(this), name });
    return this;
  };

  p['appendChild'] = function appendChild(
    this: HasPending,
    child: HasPending | (EachBinding<unknown> & { readonly _snapshot: EachTemplateSnapshot }),
  ): typeof this {
    if (isEachBinding(child)) {
      appendCmd(this, emitBindEach(_getElementTarget(this), child));
    } else {
      const parentTarget = _getElementTarget(this);
      const childTarget = _getElementTarget(child as HasPending);
      appendCmd(this, { type: 'appendChild', parent: parentTarget, child: childTarget });
      // each テンプレート factory コード生成時に子要素ツリーを再現するため、
      // appendChild 経路で渡された子 HtmlTag を記録する（addChild とは別の経路）。
      const selfTag = this as unknown as { _appendedChildren?: HtmlTag[] };
      if (Array.isArray(selfTag._appendedChildren)) {
        selfTag._appendedChildren.push(child as unknown as HtmlTag);
      }
    }
    return this;
  };
}
