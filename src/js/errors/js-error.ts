import { type JsErrorCode, ModuleError } from '../../utils/errors.js';

/**
 * JS モジュール固有のエラークラス
 *
 * ModuleError を継承し、JS モジュールで発生するエラーを表現する。
 * selector プロパティでエラーが発生した要素のセレクタを特定できる。
 *
 * @example
 * ```typescript
 * throw new JsError('invalidSelector', 'Invalid CSS selector', { selector: '#invalid-id!' });
 * ```
 */
export class JsError extends ModuleError<JsErrorCode, { selector?: string }> {
  /**
   * エラーが発生したモジュール（常に 'js'）
   */
  readonly module = 'js' as const;

  /**
   * エラーが発生した要素のセレクタ（オプショナル）
   */
  get selector(): string | undefined {
    return this.options?.selector;
  }
}
