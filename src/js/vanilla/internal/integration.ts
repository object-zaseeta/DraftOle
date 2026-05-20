/**
 * `jsTemplate().afterCreate` コールバックへ `VanillaScope` を接続するブリッジ (`attach`)。
 *
 * 設計書 `design.md` の「integration: attach / fromJsName」節に対応する。
 *
 * 責務:
 * - `jsTemplate()` の `afterCreate(refs: Record<string, string>) => string` 契約に
 *   一致するコールバックを生成する（Req 6.1, 6.3）。
 * - `refs` の各 `jsName` を `ref(varName)` 経由で `ElementRef` に変換し、
 *   ユーザ `build` 関数に `VanillaScope` と合わせて渡す。
 * - `attach` の文脈は「`jsTemplate` が生成する単一関数の本体内」であり、
 *   そこで `onDomReady` / `declareFunction` を発行することは意味的に不正。
 *   そのため `_append` を経由したこれら命令の混入を検出し `Error` を投げる。
 * - `jsTemplate()` の公開 API（`JsTemplateResult` / `afterCreate` 契約）を破壊しない（Req 6.3）。
 *
 * Boundary: 本ファイルは `vanilla-script-builder` と `element-ref` / `commands` を
 * 内部的に利用し、`src/js/js-template.ts` へは一切書き換えを行わない。
 */

import { renderCommands, type VanillaCommand } from '../commands.js';
import { ref } from '../element-ref.js';
import type { ElementRef } from '../types.js';
import type { VanillaScope } from '../vanilla-script-builder.js';
import { createVanillaScript } from '../vanilla-script-builder.js';

/**
 * `attach` コンテキストで発行された場合に `Error` を投げるべき命令種別。
 * `onDomReady` / `declareFunction` は `jsTemplate` 生成関数の本体内では無効。
 */
const FORBIDDEN_COMMAND_TYPES: ReadonlySet<VanillaCommand['type']> = new Set([
  'domReady',
  'declareFunction',
]);

/**
 * `jsTemplate()` の `afterCreate` 引数として渡せるコールバックを生成する。
 *
 * 返却関数は `jsTemplate` 側から `refs: Record<string, string>`（`jsName` → JS 変数名）
 * を受け取り、`ref(varName)` に変換した `ElementRef` マップと一時スコープを
 * `build` に渡す。`build` が append した命令列を文字列化して返すため、
 * その文字列は `jsTemplate` 生成関数の `return` 直前に挿入される。
 *
 * 出力は関数定義や `DOMContentLoaded` ラッパを含まない純粋な命令本体である
 * （`afterCreate` は既に関数内部で実行されるため、ラップ不要）。
 *
 * @param build - `scope` と `refs`（`ElementRef` マップ）を受け取る組み立て関数。
 * @returns `jsTemplate` の `afterCreate` シグネチャに一致するコールバック。
 *
 * @throws build が `onDomReady` / `declareFunction` を append した場合、
 *   生成される afterCreate コールバックの実行時に `Error`。
 */
export function attach(
  build: (scope: VanillaScope, refs: Readonly<Record<string, ElementRef>>) => void,
): (rawRefs: Record<string, string>) => string {
  return (rawRefs: Record<string, string>): string => {
    // 命令の蓄積先となるローカルキュー。trap 付き append で監視する。
    const queue: VanillaCommand[] = [];

    // 一時 Builder は `_childScope` / `raw` / `let` / `call` / `return` / `ifThen` の
    // ロジックを再利用するためだけに利用する。最終的な render 文字列は参照せず、
    // 我々の guarded スコープが収集した `queue` を `renderCommands` で直接文字列化する。
    const tmpBuilder = createVanillaScript();
    // `_childScope` を借りるため、ダミースコープを一つ取得する。
    // `declareFunction` / `onDomReady` は直接は使わず、`fn` の 0 引数 body で
    // 内部スコープのハンドラを捕まえる。
    let innerScopeFactory: ((q: VanillaCommand[]) => VanillaScope) | undefined;
    tmpBuilder.fn('__attach_probe__', (s) => {
      // s は子スコープ。s._childScope(queue) で任意キューに繋いだ兄弟スコープを生成できる。
      innerScopeFactory = (q) => s._childScope(q);
    });
    if (innerScopeFactory === undefined) {
      throw new Error('attach(): failed to acquire internal scope factory');
    }

    const rawScope = innerScopeFactory(queue);

    // `_append` をラップし、禁止命令を検出する guarded スコープを生成する。
    const guardedScope: VanillaScope = {
      _append(cmd) {
        if (FORBIDDEN_COMMAND_TYPES.has(cmd.type)) {
          throw new Error(
            `attach(): ${cmd.type === 'domReady' ? 'onDomReady' : 'declareFunction'} ` +
              'is not allowed inside attach(); afterCreate runs within a single generated function body',
          );
        }
        rawScope._append(cmd);
      },
      _childScope(childQueue) {
        // 子スコープも同じガードを適用するため、再帰的に wrap する。
        const rawChild = rawScope._childScope(childQueue);
        return wrapScope(rawChild);
      },
      raw(code) {
        return rawScope.raw(code);
      },
      let(name, value) {
        return rawScope.let(name, value);
      },
      call(name, args) {
        return rawScope.call(name, args);
      },
      return() {
        rawScope.return();
      },
      ifThen(condition, then, orElse) {
        // `ifThen` 内の子スコープもガードしたいので、ラップしたハンドラを渡す。
        rawScope.ifThen(
          condition,
          (child) => then(wrapScope(child)),
          orElse === undefined ? undefined : (child) => orElse(wrapScope(child)),
        );
      },
    };

    // `refs` を `ElementRef` に変換（`ref(jsName)` は `kind: 'var'`、`code === varName`）。
    const elementRefs: Record<string, ElementRef> = {};
    for (const [key, varName] of Object.entries(rawRefs)) {
      elementRefs[key] = ref(varName);
    }

    build(guardedScope, elementRefs);

    // 命令列を文字列化（インデントなし）。関数定義や DOMContentLoaded ラップは付与しない。
    return renderCommands(queue, '');
  };
}

/**
 * 任意の `VanillaScope` を禁止命令ガード付きの `VanillaScope` に包む内部ヘルパ。
 * 子スコープが発行する `_append` / `_childScope` / `ifThen` にも再帰的にガードを適用する。
 */
function wrapScope(inner: VanillaScope): VanillaScope {
  return {
    _append(cmd) {
      if (FORBIDDEN_COMMAND_TYPES.has(cmd.type)) {
        throw new Error(
          `attach(): ${cmd.type === 'domReady' ? 'onDomReady' : 'declareFunction'} ` +
            'is not allowed inside attach(); afterCreate runs within a single generated function body',
        );
      }
      inner._append(cmd);
    },
    _childScope(childQueue) {
      return wrapScope(inner._childScope(childQueue));
    },
    raw(code) {
      return inner.raw(code);
    },
    let(name, value) {
      return inner.let(name, value);
    },
    call(name, args) {
      return inner.call(name, args);
    },
    return() {
      inner.return();
    },
    ifThen(condition, then, orElse) {
      inner.ifThen(
        condition,
        (child) => then(wrapScope(child)),
        orElse === undefined ? undefined : (child) => orElse(wrapScope(child)),
      );
    },
  };
}
