/**
 * binding-emitter.ts: 要素 × 状態 → `bind-*` コマンド生成
 *
 * 設計書 `design.md` の「binding-emitter（Internal）」セクションに対応。
 *
 * 各エミッタ関数は `ElementTarget` と `ReadableState<T>` を受け取り、
 * 対応する `VanillaCommand` を生成して返す純関数。
 * `bind-text` / `bind-value` / `bind-class-all` / `bind-class-add` /
 * `bind-style` / `bind-checked` / `bind-each` コマンドを生成する。
 *
 * 設計方針:
 * - 副作用なし。コマンドオブジェクトを生成して返すだけ
 * - `stateId` は `value._runtimeId` で埋める
 *   （方針 B により Computed も登録済みランタイム状態であるため、直接使用できる）
 * - `EachBinding` の `_snapshot` から `EachTemplateSnapshot` を取り出す
 *
 * Requirements: 4.1–4.7
 * Design: binding-emitter（Internal）
 * Depends: 3.1 (commands.ts), 2.2 (state.ts), 2.3 (each-template.ts)
 */

import type { VanillaCommand } from '../commands.js';
import type { ElementTarget } from '../element-target.js';
import type { EachTemplateSnapshot } from './each-template.js';
import type { EachBinding, ReadableState } from './state.js';
import { isDerivedTemplateState } from './template-derived-state.js';

// ─────────────────────────────────────────────────────────────────────────────
// 内部型定義
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `EachBinding<U>` に `_snapshot` を付加した型。
 * `captureEachTemplate` の戻り値（`EachBindingWithSnapshot<U>`）と同構造。
 * 循環 import を避けるため、ここで再定義するのではなく型チェックのみに使用する。
 */
type EachBindingWithSnapshot<U> = EachBinding<U> & {
  readonly _snapshot: EachTemplateSnapshot;
};

// ─────────────────────────────────────────────────────────────────────────────
// エミッタ関数群
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `bind-text` コマンドを生成する。
 *
 * 要素の `textContent` を状態値にバインドする購読登録コマンドを返す。
 * Req 4.1: `element.setText(state)` → `bind-text` コマンド
 *
 * @param target - バインド対象の DOM 要素参照
 * @param value - バインドする状態値（`State<string>` または `Computed<string>`）
 * @returns `bind-text` VanillaCommand
 */
export function emitBindText(
  target: ElementTarget,
  value: ReadableState<string>,
): VanillaCommand {
  if (isDerivedTemplateState(value)) {
    return { type: 'bind-text', target, stateId: value._parentTemplateId, transform: value._transform };
  }
  return {
    type: 'bind-text',
    target,
    stateId: value._runtimeId,
  };
}

/**
 * `bind-value` コマンドを生成する。
 *
 * `<input>` / `<textarea>` / `<select>` の `.value` プロパティを状態値にバインドする。
 * Req 4.2: `element.setValue(state)` → `bind-value` コマンド
 *
 * @param target - バインド対象の DOM 要素参照
 * @param value - バインドする状態値（`State<string>` または `Computed<string>`）
 * @returns `bind-value` VanillaCommand
 */
export function emitBindValue(
  target: ElementTarget,
  value: ReadableState<string>,
): VanillaCommand {
  if (isDerivedTemplateState(value)) {
    return { type: 'bind-value', target, stateId: value._parentTemplateId, transform: value._transform };
  }
  return {
    type: 'bind-value',
    target,
    stateId: value._runtimeId,
  };
}

/**
 * `bind-class-all` コマンドを生成する。
 *
 * 要素のクラス属性を状態値で全置換する購読登録コマンドを返す。
 * Req 4.5: `element.class(state)` → `bind-class-all` コマンド（全置換）
 *
 * @param target - バインド対象の DOM 要素参照
 * @param value - バインドする状態値（`State<string>` または `Computed<string>`）
 * @returns `bind-class-all` VanillaCommand
 */
export function emitBindClassAll(
  target: ElementTarget,
  value: ReadableState<string>,
): VanillaCommand {
  if (isDerivedTemplateState(value)) {
    return { type: 'bind-class-all', target, stateId: value._parentTemplateId, transform: value._transform };
  }
  return {
    type: 'bind-class-all',
    target,
    stateId: value._runtimeId,
  };
}

/**
 * `bind-class-add` コマンドを生成する。
 *
 * クラス名更新時に「旧クラス削除 → 新クラス付与」の差分操作を行う購読登録コマンドを返す。
 * Req 4.3: `element.addClass(computed)` → `bind-class-add` コマンド（差分操作）
 *
 * @param target - バインド対象の DOM 要素参照
 * @param value - バインドする状態値（`State<string>` または `Computed<string>`）
 * @returns `bind-class-add` VanillaCommand
 */
export function emitBindClassAdd(
  target: ElementTarget,
  value: ReadableState<string>,
): VanillaCommand {
  if (isDerivedTemplateState(value)) {
    return { type: 'bind-class-add', target, stateId: value._parentTemplateId, transform: value._transform };
  }
  return {
    type: 'bind-class-add',
    target,
    stateId: value._runtimeId,
  };
}

/**
 * `bind-style` コマンドを生成する。
 *
 * 要素の `style[prop]` を状態値で更新する購読登録コマンドを返す。
 * Req 4.4: `element.setStyle(prop, state)` → `bind-style` コマンド
 *
 * @param target - バインド対象の DOM 要素参照
 * @param prop - CSS プロパティ名（例: `'color'`, `'fontSize'`）
 * @param value - バインドする状態値（`State<string>` または `Computed<string>`）
 * @returns `bind-style` VanillaCommand
 */
export function emitBindStyle(
  target: ElementTarget,
  prop: string,
  value: ReadableState<string>,
): VanillaCommand {
  if (isDerivedTemplateState(value)) {
    return { type: 'bind-style', target, prop, stateId: value._parentTemplateId, transform: value._transform };
  }
  return {
    type: 'bind-style',
    target,
    prop,
    stateId: value._runtimeId,
  };
}

/**
 * `bind-checked` コマンドを生成する。
 *
 * `<input type="checkbox">` / `<input type="radio">` の `checked` プロパティを
 * 状態値にバインドする。`bind-checked` 専用コマンドを使用する。
 *
 * DerivedTemplateState の場合は `_parentTemplateId` を `stateId` として使用し、
 * `transform` を付加する（Req 2.2, 2.3, 5.1）。
 *
 * Req 4.x: `element.checked(state)` → `bind-checked` バインディング
 *
 * @param target - バインド対象の DOM 要素参照
 * @param value - バインドする状態値（`State<boolean>` または `Computed<boolean>`）
 * @returns `bind-checked` VanillaCommand
 */
export function emitBindChecked(
  target: ElementTarget,
  value: ReadableState<boolean>,
): VanillaCommand {
  if (isDerivedTemplateState(value)) {
    return { type: 'bind-checked', target, stateId: value._parentTemplateId, transform: value._transform };
  }
  return {
    type: 'bind-checked',
    target,
    stateId: value._runtimeId,
  };
}

/**
 * `bind-each` コマンドを生成する。
 *
 * 配列状態の各要素を子要素として動的に描画する購読登録コマンドを返す。
 * Req 4.7: `appendChild(binding: EachBinding)` → `bind-each` コマンド
 *
 * `EachBinding` は `_snapshot` を持つ `EachBindingWithSnapshot<U>` であること。
 * `_snapshot` から `EachTemplateSnapshot` を取り出してコマンドに埋め込む。
 *
 * @param target - 親要素の DOM 要素参照
 * @param binding - `EachBinding<U>` + `_snapshot` を持つバインディング
 * @returns `bind-each` VanillaCommand
 */
export function emitBindEach<U>(
  target: ElementTarget,
  binding: EachBindingWithSnapshot<U>,
): VanillaCommand {
  return {
    type: 'bind-each',
    target,
    stateId: binding._stateId,
    template: binding._snapshot,
  };
}
