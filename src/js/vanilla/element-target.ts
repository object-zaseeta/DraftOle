/**
 * `ElementTarget` 判別共用体の定義。
 *
 * 設計書 `design.md` の「Target 抽象」「ElementTarget union」に対応。
 * バインドコマンドが対象 DOM 要素を指す方法を 2 種類のバリアントで表現する：
 *
 * - `'sel'`: CSS セレクタ文字列で指定（既存挙動・後方互換）。
 *   ランタイムでは `document.querySelector(selector)` で解決される。
 * - `'closure-ref'`: クロージャ内ローカル変数名で指定（each テンプレート等）。
 *   ランタイムではコード生成時の裸の識別子（例: `_e0`）として埋め込まれる。
 * - `'deferred-self'`: 生成時点で対象要素が未確定。ランタイムに `this` として解決される。
 *
 * このモジュールは型のみを export する純粋な型定義ファイルであり、
 * 後続タスク（5.3 `_getTargetCode` リファクタ、5.4 `binding-emitter`
 * 各 emit 関数の引数型統一）から canonical な型として import される。
 *
 * NOTE: `commands.ts` の `ElementTarget`（`'var' | 'sel'`）とは別の union。
 * 5.3 / 5.4 のリファクタで両者を整合させる予定（本タスクでは触らない）。
 *
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */

/**
 * CSS セレクタ文字列で対象要素を指すバリアント。
 *
 * 既存の `{ kind: 'sel', selector }` 構造をそのまま踏襲する（後方互換）。
 */
export type SelectorTarget = {
  readonly kind: 'sel';
  readonly selector: string;
};

/**
 * クロージャ内ローカル変数名で対象要素を指すバリアント。
 *
 * `varName` は factory コード内のローカル変数名（`_e0`, `_e1` 等）。
 * ランタイムには裸の識別子としてそのまま埋め込まれる。
 */
export type ClosureRefTarget = {
  readonly kind: 'closure-ref';
  readonly varName: string;
};

/**
 * 遅延解決バリアント。バインドコマンド生成時点では対象要素が未確定で、
 * ランタイムに `this`（自身の要素）として解決されることを示す。
 *
 * Requirements: 1.1, 1.2, 1.3, 4.1
 */
export type DeferredSelfTarget = {
  readonly kind: 'deferred-self';
};

/**
 * 要素ターゲットの判別共用体。
 *
 * `kind` フィールドによる discriminated union として narrow できる。
 */
export type ElementTarget = SelectorTarget | ClosureRefTarget | DeferredSelfTarget;
