import type { ScriptScope } from './script-scope.js';

/**
 * トランスフォーマーなし環境でイベントハンドラを定義するユーティリティ。
 *
 * `.on()` に渡すハンドラの定形パターンをライブラリ側で吸収する。
 * トランスフォーマー使用時は不要（自動変換される）。
 *
 * @example
 * button.on('click', emitHandler(`__draftole__.state('${id}').set([])`))
 */
export function emitHandler(
  code: string,
  params: readonly string[] = [],
): ((s: ScriptScope) => void) & { _draftoleEmitted: true } {
  return Object.assign(
    (s: ScriptScope) => {
      s._emitHandlerBody(code, params);
    },
    { _draftoleEmitted: true as const },
  );
}
