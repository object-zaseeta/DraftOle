import { DraftOleError, type CssErrorCode } from '../../utils/errors.js';

/**
 * CSS モジュール固有のエラークラス
 *
 * DraftOleError を継承し、CSS モジュールで発生するエラーを表現する。
 * property プロパティでエラーが発生した CSS プロパティ名を特定できる。
 *
 * @example
 * ```typescript
 * throw new CssError('invalidValue', 'Invalid color value', { property: 'background-color' });
 * ```
 */
export class CssError extends DraftOleError {
  /**
   * CSS エラーコード
   */
  readonly code: CssErrorCode;

  /**
   * エラーが発生したモジュール（常に 'css'）
   */
  readonly module = 'css' as const;

  /**
   * エラーが発生した CSS プロパティ名（オプショナル）
   */
  readonly property?: string;

  /**
   * CssError のコンストラクタ
   *
   * @param code - CSS エラーコード
   * @param message - エラーメッセージ
   * @param options - 追加オプション
   * @param options.property - エラーが発生した CSS プロパティ名
   */
  constructor(
    code: CssErrorCode,
    message: string,
    options?: { property?: string },
  ) {
    super(message);
    this.code = code;
    this.property = options?.property;
    this.name = 'CssError';

    // V8 スタックトレースの修正（Node.js 環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CssError);
    }
  }
}
