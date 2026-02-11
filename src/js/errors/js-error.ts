import { DraftOleError, type JsErrorCode } from '../../utils/errors.js';

/**
 * JS モジュール固有のエラークラス
 *
 * DraftOleError を継承し、JS モジュールで発生するエラーを表現する。
 * selector プロパティでエラーが発生した要素のセレクタを特定できる。
 *
 * @example
 * ```typescript
 * throw new JsError('invalidSelector', 'Invalid CSS selector', { selector: '#invalid-id!' });
 * ```
 */
export class JsError extends DraftOleError {
  /**
   * JS エラーコード
   */
  readonly code: JsErrorCode;

  /**
   * エラーが発生したモジュール（常に 'js'）
   */
  readonly module = 'js' as const;

  /**
   * エラーが発生した要素のセレクタ（オプショナル）
   */
  readonly selector?: string;

  /**
   * JsError のコンストラクタ
   *
   * @param code - JS エラーコード
   * @param message - エラーメッセージ
   * @param options - 追加オプション
   * @param options.selector - エラーが発生した要素のセレクタ
   */
  constructor(
    code: JsErrorCode,
    message: string,
    options?: { selector?: string },
  ) {
    super(message);
    this.code = code;
    this.selector = options?.selector;
    this.name = 'JsError';

    // V8 スタックトレースの修正（Node.js 環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JsError);
    }
  }
}
