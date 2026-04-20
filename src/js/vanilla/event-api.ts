/**
 * イベント登録 API (`on` / `onDomReady`) の実装。
 *
 * 設計書 `design.md` の「event-api」節と要件 1.1〜1.5 に対応する。
 *
 * - `on<K extends keyof HTMLElementEventMap>(scope, target, event, handler)` は
 *   現在スコープに `addEventListener` 命令を append する。
 * - ハンドラ本体は子 `VanillaScope` で組み立て、文字列化後に親の `handlerCode` へ埋め込む。
 * - イベント引数名は固定の `"e"`。`EventArgRef<K>` は `HTMLElementEventMap[K]` の
 *   文字列・数値・真偽プロパティを `JsExpr` として型安全に露出する。
 * - `onDomReady(builder, handler)` は Builder の `onDomReady` へ委譲し、
 *   ネスト呼び出し（ハンドラ内での `onDomReady` 呼び出し）は `Error` を投げる。
 *
 * 本ファイルは `VanillaScope` インターフェースを「`on`/`onDomReady` メソッド追加」で
 * 汚染しないため、スコープ（または Builder）を引数に取る自由関数として提供する。
 * 内部 append は `VanillaScope._append` 経由で行う（スコープの内部フック）。
 */

import { renderCommands, type VanillaCommand } from './commands.js';
import { _makeJsExpr } from './element-ref.js';
import type {
  ElementEventName,
  ElementRef,
  EventArgRef,
  JsExpr,
  StringKeysOf,
} from './types.ts';
import type {
  VanillaScope,
  VanillaScript,
  VanillaScriptBuilder,
} from './vanilla-script-builder.ts';

/**
 * `on()` の `target` 引数。`ElementRef` または文字列リテラル `'document'`。
 * `'document'` 指定時は `document.addEventListener(...)` を出力する（Req 1.1, 1.3 の派生）。
 */
export type EventTarget = ElementRef | 'document';

/**
 * 与えられた `target` から JS 式としての埋め込みコードを取り出す。
 * `'document'` は文字列リテラルとしてそのまま JS 式に埋め込まれる。
 */
function resolveTargetCode(target: EventTarget): string {
  return target === 'document' ? 'document' : target.code;
}

/**
 * `EventArgRef<K>` を構築する。
 *
 * 実装上は `HTMLElementEventMap[K]` の具体プロパティ名は実行時に判らないため、
 * Proxy を用いてアクセスされたプロパティ名（string/number/boolean のいずれか、
 * 型制約は呼び出し側で `StringKeysOf<HTMLElementEventMap[K]>` により効いている）を
 * `e.<prop>` の `JsExpr` として返す。
 *
 * `code` フィールドは固定で `'e'`（ハンドラスコープが子スコープで閉じるため衝突しない）。
 */
function makeEventArgRef<K extends ElementEventName>(): EventArgRef<K> {
  const base = {
    __eventArg: true as const,
    code: 'e' as const,
  };
  const handler: ProxyHandler<typeof base> = {
    get(t, prop, receiver) {
      if (prop === '__eventArg' || prop === 'code' || typeof prop !== 'string') {
        return Reflect.get(t, prop, receiver);
      }
      // TS の `StringKeysOf<HTMLElementEventMap[K]>` 制約で呼び出し側を縛っているため、
      // 実行時のプロパティ名は常に文字列/数値/真偽型のイベントプロパティのいずれか。
      return _makeJsExpr(`e.${prop}`);
    },
  };
  // Proxy はキャスト経由で EventArgRef<K> として扱う（型は呼び出し側制約で担保）。
  return new Proxy(base, handler) as unknown as EventArgRef<K>;
}
// 下記の unused import 警告を抑止するためのローカル参照。型推論で使われるだけ。
type _EventArgUsage<K extends ElementEventName> = StringKeysOf<HTMLElementEventMap[K]>;
// 明示的に利用することで TS の型消去後も import が残る
export type _EventArgPropertyKeys<K extends ElementEventName> = _EventArgUsage<K>;

/**
 * イベントハンドラを現在スコープに登録する。
 *
 * @param scope   - 登録先のスコープ（トップレベル / 関数本体 / `onDomReady` / `forEach` 等）。
 * @param target  - 対象要素参照。`'document'` を渡すと `document.addEventListener` を出力する。
 * @param event   - `HTMLElementEventMap` のキー（型レベルで制約、Req 1.2）。
 * @param handler - ハンドラ本体。第 2 引数 `e: EventArgRef<K>` で型付きイベント参照が提供される（Req 1.4）。
 */
export function on<K extends ElementEventName>(
  scope: VanillaScope,
  target: EventTarget,
  event: K,
  handler: (s: VanillaScope, e: EventArgRef<K>) => void,
): void {
  // ハンドラ本体を子スコープで組み立て、文字列化して addEventListener 命令に埋め込む。
  const bodyQueue: VanillaCommand[] = [];
  const childScope = scope._childScope(bodyQueue);
  const eventArg = makeEventArgRef<K>();
  handler(childScope, eventArg);
  const bodyCode = renderCommands(bodyQueue, '  ');
  // イベント引数名は固定の "e"（衝突しない前提）。
  const handlerCode = bodyCode.length === 0 ? '(e) => {}' : `(e) => {\n${bodyCode}\n}`;
  scope._append({
    type: 'addEventListener',
    target: resolveTargetCode(target),
    event,
    handlerCode,
  });
}

/**
 * `DOMContentLoaded` 登録 API。Builder の `onDomReady` に委譲し、
 * ネスト呼び出し（ハンドラ内での `onDomReady`）は `Error` を投げる（設計：Error Handling）。
 *
 * @param builder - `createVanillaScript()` が返した Builder / Script。
 * @param handler - DOMContentLoaded 時に実行されるハンドラ本体。
 */
export function onDomReady(
  builder: VanillaScriptBuilder,
  handler: (s: VanillaScope) => void,
): void {
  if (inDomReady.has(builder)) {
    throw new Error(
      'onDomReady: nested invocation is not allowed; ' +
        'onDomReady cannot be called from within another onDomReady handler.',
    );
  }
  inDomReady.add(builder);
  try {
    builder.onDomReady(handler);
  } finally {
    inDomReady.delete(builder);
  }
}

/**
 * ネスト検出用の WeakSet。`onDomReady` が同期的に Builder の handler を実行する間だけ
 * Builder を保持し、内側で再度 `onDomReady` が呼ばれた場合に例外を投げる。
 */
const inDomReady = new WeakSet<VanillaScript>();

/**
 * 内部：`JsExpr` 型を `types.ts` 側の定義と合わせるためのリファレンス。
 * 型チェック時に `JsExpr` が tree-shaking されないよう明示的に再エクスポートはしないが、
 * `_EventArgPropertyKeys` を通じて型情報を保全する。
 */
export type _EventJsExpr = JsExpr;
