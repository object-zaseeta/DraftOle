/**
 * `RuntimeContext` — script scope / expr factory / selectors / state registry /
 * JS aggregation の受け皿となる独立クラス。
 *
 * 設計書 `design.md` の「RuntimeContext」節に対応する。
 *
 * 責務:
 * - VanillaScriptBuilder を遅延初期化して保持する（vanilla builder owner）
 * - ScriptScope を公開する（getScope()）
 * - StateRegistry を内部で管理し、state<T>(initial) で State<T> を採番・返却する
 * - renderUserJs() で Vanilla JS 文字列を返す
 * - buildExportRuntimeSnapshot() でエクスポート用スナップショットを生成する
 *
 * 依存方向ルール:
 * - js/vanilla/* からの import は許可
 * - publisher/* または document/* からの import は禁止
 *
 * Requirements: 2.2, 5.2 (root-responsibility-separation)
 * Design: 「RuntimeContext」節
 */

import { createVanillaScript } from '../js/vanilla/vanilla-script-builder.js';
import { createScriptScope } from '../js/vanilla/script-scope.js';
import { createExprFactory } from '../js/vanilla/expr-factory.js';
import { createSelectorRef, createCollectionRef } from '../js/vanilla/selector-ref.js';
import { fromSelector, listFromSelector } from '../js/vanilla/element-ref.js';
import { JQueryHelper } from '../js/jquery-helper.js';
import { StateRegistry } from '../js/vanilla/state/registry.js';
import { StateImpl } from '../js/vanilla/state/state.js';
import { makeJsExpr } from '../js/vanilla/state/state.js';
import type { ScriptScope } from '../js/vanilla/script-scope.js';
import type { ExprFactory } from '../js/vanilla/expr-factory.js';
import type { SelectorRef, CollectionRef } from '../js/vanilla/selector-ref.js';
import type { VanillaScriptBuilder } from '../js/vanilla/vanilla-script-builder.js';
import type { State } from '../js/vanilla/state/state.js';
import type { JsExpr, JsBoolExpr } from '../js/vanilla/types.js';
import type { JQueryMethodType } from '../html/protocols/jquery-method-type.js';

// ─── 公開型 ──────────────────────────────────────────────────────────────────

/**
 * エクスポート用ランタイムスナップショット。
 *
 * - `userJs`: Vanilla JS Builder が生成したユーザー定義スクリプト文字列
 * - `runtimePrelude`: ランタイムプレリュード（task 4.x で追加予定）
 * - `runtimeInitJs`: 状態初期化コード（task 4.x で追加予定）
 */
export interface RuntimeSnapshot {
  userJs: string;
  runtimePrelude?: string;
  runtimeInitJs?: string;
}

// ─── RuntimeContext クラス ────────────────────────────────────────────────────

/**
 * ランタイムグラフの所有者として script scope / expr factory / selectors /
 * state registry / JS aggregation を管理する独立クラス。
 *
 * Root から参照されるが、Root の存在を前提としない（Root 非依存）。
 * publisher/* / document/* には依存しない。
 *
 * @example
 * ```typescript
 * const ctx = new RuntimeContext();
 * const count = ctx.state(0);
 * ctx.getScope().onDomReady(s => {
 *   s.call('init');
 * });
 * const js = ctx.renderUserJs();
 * ```
 */
export class RuntimeContext {
  /** Vanilla JS Builder（遅延初期化）。 */
  private _vanillaBuilder: VanillaScriptBuilder | undefined;

  /** Script Scope（遅延初期化）。 */
  private _scriptScope: ScriptScope | undefined;

  /** State Registry（遅延初期化）。 */
  private _stateRegistry: StateRegistry | undefined;

  /** Expr Factory（遅延初期化）。 */
  private _exprFactory: ExprFactory | undefined;

  // ─── Scope ──────────────────────────────────────────────────────────────

  /**
   * Script Scope を遅延初期化して返す。
   *
   * 初回呼び出し時に VanillaScriptBuilder と ScriptScope を生成してキャッシュする。
   * 以後は同一インスタンスを返す（単一スコープ保証）。
   *
   * @returns キャッシュされた `ScriptScope` インスタンス
   */
  getScope(): ScriptScope {
    if (this._scriptScope !== undefined) {
      return this._scriptScope;
    }
    const builder = createVanillaScript();
    const scope = createScriptScope(builder);
    this._vanillaBuilder = builder;
    this._scriptScope = scope;
    return scope;
  }

  // ─── State ──────────────────────────────────────────────────────────────

  /**
   * 一意な状態 ID を採番し、State<T> を返す。
   *
   * StateRegistry を遅延初期化し、runtimeId "s0" / "s1" / ... の形式で採番する。
   * 同一 RuntimeContext インスタンスから複数回呼ぶと異なる ID が採番される。
   *
   * @param initial - 状態の初期値
   * @returns `State<T>` — 一意な `_runtimeId` を持つ観測可能値オブジェクト
   */
  state<T>(initial: T): State<T> {
    if (this._stateRegistry === undefined) {
      this._stateRegistry = new StateRegistry();
    }
    const registry = this._stateRegistry;
    const id = registry.allocateId();
    const code = JSON.stringify(initial);

    const makeBool = (c: string): JsBoolExpr =>
      ({ __jsExpr: true as const, __jsBool: true as const, code: c }) as JsBoolExpr;

    const initialExpr: JsExpr = {
      __jsExpr: true as const,
      code,
      eq(other: string | number | JsExpr): JsBoolExpr {
        const otherCode = typeof other === 'object' ? other.code : JSON.stringify(other);
        return makeBool(`${code} === ${otherCode}`);
      },
      ne(other: string | number | JsExpr): JsBoolExpr {
        const otherCode = typeof other === 'object' ? other.code : JSON.stringify(other);
        return makeBool(`${code} !== ${otherCode}`);
      },
      or(fallback: string | JsExpr): JsExpr {
        const fbCode = typeof fallback === 'object' ? fallback.code : JSON.stringify(fallback);
        return makeJsExpr(`(${code} || ${fbCode})`);
      },
      trim(): JsExpr {
        return makeJsExpr(`(${code}).trim()`);
      },
      isFalsy(): JsBoolExpr {
        return makeBool(`!(${code})`);
      },
      isTruthy(): JsBoolExpr {
        return makeBool(`!!(${code})`);
      },
    };

    registry.register({ runtimeId: id, initialExpr });
    return new StateImpl<T>(id, registry);
  }

  // ─── StateRegistry アクセス ──────────────────────────────────────────────

  /**
   * StateRegistry への読み取りアクセス。
   *
   * `state()` を一度も呼んでいない場合は `undefined` を返す（遅延初期化と整合）。
   * Root の `_stateRegistry` getter から参照される（task 3.2 委譲）。
   */
  get stateRegistry(): StateRegistry | undefined {
    return this._stateRegistry;
  }

  // ─── JS 出力 ─────────────────────────────────────────────────────────────

  /**
   * Vanilla JS Builder の出力を文字列として返す。
   *
   * `getScope()` 経由で積まれたすべての JS コマンドを `VanillaScriptBuilder.render()`
   * で文字列化して返す。Builder が未初期化の場合（スクリプトが何も追加されていない場合）は
   * 空文字列を返す。
   *
   * @returns ユーザー定義 Vanilla JS 文字列（スクリプトなしなら `""`）
   */
  renderUserJs(): string {
    return this._vanillaBuilder?.render() ?? '';
  }

  // ─── Expr Factory ────────────────────────────────────────────────────────

  /**
   * `ExprFactory` を遅延初期化して返す。
   *
   * 同一 RuntimeContext から複数回呼ばれた場合は同一インスタンスを返す（memoize）。
   * `Root.expr` getter からの委譲先。
   */
  getExprFactory(): ExprFactory {
    if (this._exprFactory === undefined) {
      this._exprFactory = createExprFactory();
    }
    return this._exprFactory;
  }

  // ─── Selector / Collection ───────────────────────────────────────────────

  /**
   * 単一セレクタ用 `SelectorRef` を返す。
   *
   * `Root.$` メソッドからの委譲先。
   * scope は `getScope()` 経由で取得した RuntimeContext の唯一 scope を共有する。
   *
   * @param selector - `document.querySelector` に渡すセレクタ
   * @returns `SelectorRef<E>`
   */
  querySelector<E extends Element = HTMLElement>(selector: string): SelectorRef<E> {
    const scope = this.getScope();
    return createSelectorRef(scope, fromSelector<E>(selector));
  }

  /**
   * 複数セレクタ用 `CollectionRef` を返す。
   *
   * `Root.$$` メソッドからの委譲先。
   *
   * @param selector - `document.querySelectorAll` に渡すセレクタ
   * @returns `CollectionRef<E>`
   */
  querySelectorAll<E extends Element = HTMLElement>(selector: string): CollectionRef<E> {
    const scope = this.getScope();
    return createCollectionRef(scope, listFromSelector<E>(selector));
  }

  // ─── jQuery helper composition ───────────────────────────────────────────

  /**
   * jQuery helper（tree-shaking 済み）+ ユーザー JS を結合した完全な JS 文字列を返す。
   *
   * `Root.renderJs()` の合成ロジックを 1:1 で引き取った。出力は bytewise 等価。
   *
   * 出力分岐:
   * - `usedMethods.size === 0` → `''` を返す（メソッド未使用時はヘルパ不要）
   * - `jsContent.length === 0` → ヘルパのみを返す
   * - それ以外 → `${helper}\n\n${jsContent}` を返す
   *
   * @param usedMethods - ツリー全体で使用されたjQueryメソッド集合
   * @param jsContent - ツリー全体のユーザー JS 文字列
   * @returns helper + content を結合した完全な JS 出力
   */
  renderJs(usedMethods: ReadonlySet<JQueryMethodType>, jsContent: string): string {
    if (usedMethods.size === 0) {
      return '';
    }
    const helper = JQueryHelper.generateHelper(usedMethods);
    if (jsContent.length === 0) {
      return helper;
    }
    return `${helper}\n\n${jsContent}`;
  }

  // ─── スナップショット ─────────────────────────────────────────────────────

  /**
   * エクスポート用ランタイムスナップショットを生成して返す。
   *
   * task 4.x で `runtimePrelude` / `runtimeInitJs` が追加される予定。
   * 現時点では `userJs` のみを含む最小スナップショットを返す。
   *
   * @returns `RuntimeSnapshot` オブジェクト
   */
  buildExportRuntimeSnapshot(): RuntimeSnapshot {
    return {
      userJs: this.renderUserJs(),
    };
  }
}
