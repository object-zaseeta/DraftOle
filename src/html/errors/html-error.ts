import { type HtmlErrorCode, ModuleError } from '../../utils/errors.js';

/**
 * HTML モジュール固有のエラークラス
 *
 * ModuleError を継承し、HTML モジュールで発生するエラーを表現する。
 * tagType プロパティでエラーが発生した HTML タグの種類を特定できる。
 *
 * @example
 * ```typescript
 * throw new HtmlError('invalidTag', 'Unsupported tag type', { tagType: 'unknown-tag' });
 * ```
 */
export class HtmlError extends ModuleError<HtmlErrorCode, { tagType?: string }> {
  /**
   * エラーが発生したモジュール（常に 'html'）
   */
  readonly module = 'html' as const;

  /**
   * エラーが発生した HTML タグの種類（オプショナル）
   */
  get tagType(): string | undefined {
    return this.options?.tagType;
  }
}
