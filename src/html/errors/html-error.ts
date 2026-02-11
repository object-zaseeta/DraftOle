import { DraftOleError, type HtmlErrorCode } from '../../utils/errors.js';

/**
 * HTML モジュール固有のエラークラス
 *
 * DraftOleError を継承し、HTML モジュールで発生するエラーを表現する。
 * tagType プロパティでエラーが発生した HTML タグの種類を特定できる。
 *
 * @example
 * ```typescript
 * throw new HtmlError('invalidTag', 'Unsupported tag type', { tagType: 'unknown-tag' });
 * ```
 */
export class HtmlError extends DraftOleError {
  /**
   * HTML エラーコード
   */
  readonly code: HtmlErrorCode;

  /**
   * エラーが発生したモジュール（常に 'html'）
   */
  readonly module = 'html' as const;

  /**
   * エラーが発生した HTML タグの種類（オプショナル）
   */
  readonly tagType?: string;

  /**
   * HtmlError のコンストラクタ
   *
   * @param code - HTML エラーコード
   * @param message - エラーメッセージ
   * @param options - 追加オプション
   * @param options.tagType - エラーが発生した HTML タグの種類
   */
  constructor(
    code: HtmlErrorCode,
    message: string,
    options?: { tagType?: string },
  ) {
    super(message);
    this.code = code;
    this.tagType = options?.tagType;
    this.name = 'HtmlError';

    // V8 スタックトレースの修正（Node.js 環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HtmlError);
    }
  }
}
