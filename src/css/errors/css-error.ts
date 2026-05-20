import { type CssErrorCode, ModuleError } from '../../utils/errors.js';

/**
 * CSS モジュール固有のエラークラス
 *
 * ModuleError を継承し、CSS モジュールで発生するエラーを表現する。
 * property プロパティでエラーが発生した CSS プロパティ名を特定できる。
 *
 * @example
 * ```typescript
 * throw new CssError('invalidValue', 'Invalid color value', { property: 'background-color' });
 * ```
 */
export class CssError extends ModuleError<CssErrorCode, { property?: string }> {
  /**
   * エラーが発生したモジュール（常に 'css'）
   */
  readonly module = 'css' as const;

  /**
   * エラーが発生した CSS プロパティ名（オプショナル）
   */
  get property(): string | undefined {
    return this.options?.property;
  }
}
