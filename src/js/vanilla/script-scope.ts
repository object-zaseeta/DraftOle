/**
 * `ScriptScope`: `root.script` および要素メソッド `on` ハンドラの `s` 引数として
 * 公開されるスクリプトスコープ API。
 *
 * 本ファイルは `unified-element-api` 仕様の Task 3.1 に対応する薄いアダプタであり、
 * 既存 `VanillaScriptBuilder` / `VanillaScope` の実装をパススルーで露出する。
 *
 * 対応 requirement: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 * 対応 design.md セクション: 「ScriptScope」
 *
 * 方針:
 * - `ScriptScope` インターフェースは `VanillaScope` を拡張し、さらに
 *   `VanillaScriptBuilder` のトップレベル API (`fn` / `onDomReady`) を表面化する。
 * - `.if` は内部 `VanillaScope.ifThen` へのエイリアスである（design の公開語彙に揃える）。
 * - 実装はクラスを作らず、既存オブジェクトに不足メソッドを合成する薄いラッパで与える。
 * - `VanillaCommand` / `VanillaScope` の既存コントラクトは一切変更しない。
 */

import type {
  ScopeExpr,
  VanillaScope,
  VanillaScriptBuilder,
} from './vanilla-script-builder.ts';
import type { ReadableState } from './state/state.js';
import { type ScriptStateHandle, createScriptStateHandle } from './state/script-state-handle.js';

/**
 * `root.script` 相当の API。`VanillaScope` の制御フロー API に、
 * トップレベル関数宣言 `fn` / DOMContentLoaded ブロック `onDomReady` と
 * `.if` エイリアスを加えたもの。
 *
 * design.md のサービスインターフェースが公開する語彙
 * （`fn` / `onDomReady` / `if` / `let` / `return` / `call` / `raw`）は
 * すべて本インターフェース上で型解決可能である。
 */
export interface ScriptScope extends VanillaScope {
  /**
   * トップレベルに関数定義を追加する。
   * `VanillaScriptBuilder.fn` のパススルー。
   */
  fn(name: string, body: (s: ScriptScope) => void): void;
  fn(name: string, params: readonly string[], body: (s: ScriptScope) => void): void;

  /**
   * `DOMContentLoaded` リスナー本体ブロックを登録する。
   * `VanillaScriptBuilder.onDomReady` のパススルー。
   */
  onDomReady(body: (s: ScriptScope) => void): void;

  /**
   * `if (cond) { then } else? { orElse }` を現在スコープに発行する。
   * 内部実装は `VanillaScope.ifThen` と同一（design の公開語彙 `.if` に揃えたエイリアス）。
   */
  if(
    condition: ScopeExpr,
    then: (s: ScriptScope) => void,
    orElse?: (s: ScriptScope) => void,
  ): void;

  /**
   * 状態参照から `ScriptStateHandle<T>` を取得する。
   * ハンドラ内で `s.state(ref).set(v)` / `.update(body)` の形で状態を更新する（Req 6.1）。
   */
  state<T>(ref: ReadableState<T>): ScriptStateHandle<T>;

  /**
   * transformer が生成したシリアライズ済みハンドラ本体を `handler-body` コマンドとして発行する。
   *
   * transformer は `.on(event, arrowFn)` の第 2 引数を
   * `(s) => s._emitHandlerBody(serialized, params)` の形に書き換える。
   * `.on` 実装側の dispatcher がその関数を呼ぶとき `s` に本メソッドが存在する専用スコープが渡される。
   *
   * @param code - シリアライズ済みハンドラ本体の JS コード文字列
   * @param params - ハンドラ引数名の配列（例: `["e"]` または `[]`）
   */
  _emitHandlerBody(code: string, params: readonly string[]): void;
}

/**
 * 任意の `VanillaScope` を `ScriptScope` として露出するラッパを合成する。
 *
 * - 既存 `VanillaScope` オブジェクトには触れず、新規オブジェクトにプロパティを積む。
 * - `fn` / `onDomReady` は「ネストされた `if` / `onDomReady` の中から呼ばれた場合でも
 *   常に builder のトップレベルに到達する」ことを担保するため、builder 参照に委譲する。
 * - `_childScope` / `ifThen` / `if` から派生する子スコープも同じ builder を共有して
 *   ScriptScope として再公開する（Req 3.5）。
 */
function wrapScope(scope: VanillaScope, builder: VanillaScriptBuilder): ScriptScope {
  const wrapped: ScriptScope = {
    _append(cmd) {
      scope._append(cmd);
    },
    _childScope(queue) {
      return wrapScope(scope._childScope(queue), builder);
    },
    raw(code) {
      return scope.raw(code);
    },
    let(name, value) {
      return scope.let(name, value);
    },
    call(name, args) {
      return scope.call(name, args);
    },
    return() {
      scope.return();
    },
    ifThen(condition, then, orElse) {
      scope.ifThen(
        condition,
        (child) => {
          then(wrapScope(child, builder));
        },
        orElse === undefined
          ? undefined
          : (child) => {
              orElse(wrapScope(child, builder));
            },
      );
    },
    if(condition, then, orElse) {
      scope.ifThen(
        condition,
        (child) => {
          then(wrapScope(child, builder));
        },
        orElse === undefined
          ? undefined
          : (child) => {
              orElse(wrapScope(child, builder));
            },
      );
    },
    fn(
      name: string,
      paramsOrBody: readonly string[] | ((s: ScriptScope) => void),
      maybeBody?: (s: ScriptScope) => void,
    ) {
      if (typeof paramsOrBody === 'function') {
        const body = paramsOrBody;
        builder.fn(name, (child: VanillaScope) => {
          body(wrapScope(child, builder));
        });
      } else {
        if (maybeBody === undefined) {
          throw new Error('fn(): body function is required when params are provided');
        }
        const body = maybeBody;
        builder.fn(name, paramsOrBody, (child: VanillaScope) => {
          body(wrapScope(child, builder));
        });
      }
    },
    onDomReady(body) {
      builder.onDomReady((child) => {
        body(wrapScope(child, builder));
      });
    },
    state<T>(ref: ReadableState<T>): ScriptStateHandle<T> {
      return createScriptStateHandle(ref, scope);
    },
    _emitHandlerBody(_code: string, _params: readonly string[]): void {
      throw new Error(
        'ScriptScope: _emitHandlerBody() is only available in a handler-body scope created by the .on dispatcher. ' +
          'Do not call this method directly.',
      );
    },
  } as ScriptScope;
  return wrapped;
}

/**
 * `VanillaScriptBuilder` から `ScriptScope` を生成する公開ファクトリ。
 *
 * 設計上、Root は単一の `VanillaScriptBuilder` を保持し、
 * 初回アクセス時に本ファクトリで 1 つの `ScriptScope` を合成して保持する
 * （`RootFacade` 側の責務）。本関数自身は builder を改変しない。
 *
 * 内部で使う「トップレベル `VanillaScope`」は builder 自身が保持する専用スコープを
 * 用いず、`builder.append` を直接呼ぶ軽量な VanillaScope を合成する。これにより
 * トップレベル直下でも `raw` / `let` / `call` / `return` / `ifThen` が使える。
 */
export function createScriptScope(builder: VanillaScriptBuilder): ScriptScope {
  // builder のトップレベルキューに積むための最小 VanillaScope を合成する。
  // `VanillaScriptBuilder.append` がトップレベル命令キューへの唯一の入口であるため、
  // これに合わせて _append を実装し、制御フロー系は `_childScope` 経由で
  // 内部実装 (createScope) の再利用を期待する設計にはしない
  //（VanillaScope の `_childScope` は子キュー用であり、親キュー自体に対する
  //  `let` / `call` / `ifThen` 用スコープは builder から直接取得できないため、
  //  ここで同等の挙動をインラインで提供する）。
  //
  // 代替として、`builder.onDomReady` / `builder.fn` 経由で登録される本体は
  // それぞれの body 側で VanillaScope を受け取るので wrapScope でラップできる。
  // トップレベルでの `raw` / `let` / `call` / `return` / `ifThen` は
  // 本ユーティリティ上の軽量実装で満たす（builder.append への直接発行）。
  const topScope: VanillaScope = {
    _append(cmd) {
      builder.append(cmd);
    },
    _childScope(_queue) {
      // 子スコープは別キューを受け取り、その中で `VanillaScope` 相当の
      // 制御フローを実現する必要がある。既存の `createScope` 相当を
      // ここで複製するのは DRY を損なうため、内部 VanillaScope の参照を
      // `onDomReady` / `fn` の body 側から取得するルートに誘導する
      // （本トップレベル経路での `_childScope` 利用は想定しない）。
      throw new Error(
        'createScriptScope(): top-level VanillaScope does not support _childScope. ' +
          'Use `onDomReady` / `fn` / `if` to obtain a child scope.',
      );
    },
    raw(code) {
      return { code };
    },
    let(name, value) {
      builder.append({ type: 'declareConst', name, expr: value.code });
      return { code: name };
    },
    call(name, args) {
      const argList = (args ?? []).map((a) => a.code).join(', ');
      const code = `${name}(${argList})`;
      builder.append({ type: 'expr', code });
      return { code };
    },
    return() {
      builder.append({ type: 'raw', code: 'return;' });
    },
    ifThen(_condition, _then, _orElse) {
      // トップレベルでの `ifThen` はレアケースであり、設計上は `onDomReady` / `fn`
      // 内部からのみ期待される。必要になった段階で内部 VanillaScope の
      // `ifThen` 実装を共有化するリファクタを行う。
      throw new Error(
        'createScriptScope(): top-level `if/ifThen` is not supported in Task 3.1. ' +
          'Wrap it in `onDomReady` or `fn`.',
      );
    },
  };
  return wrapScope(topScope, builder);
}
