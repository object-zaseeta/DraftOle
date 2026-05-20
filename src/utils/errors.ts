/**
 * Error codes specific to the HTML module.
 *
 * @example
 * ```typescript
 * const errorCode: HtmlErrorCode = 'invalidTag';
 * ```
 */
export type HtmlErrorCode = 'invalidTag' | 'invalidAttribute' | 'nestingLimit';

/**
 * Error codes specific to the CSS module.
 *
 * - `invalidProperty` - The CSS property name is invalid or unsupported
 * - `invalidValue` - The CSS property value is invalid for the given property
 * - `layoutConflict` - Conflicting layout properties detected
 *
 * @example
 * ```typescript
 * const errorCode: CssErrorCode = 'invalidProperty';
 * ```
 */
export type CssErrorCode =
  | 'invalidProperty'
  | 'invalidValue'
  | 'layoutConflict'
  | 'duplicateProperty';

/**
 * Error codes specific to the JavaScript module.
 *
 * - `invalidSelector` - The DOM selector is invalid or malformed
 * - `unsupportedMethod` - The requested method is not supported
 *
 * @example
 * ```typescript
 * const errorCode: JsErrorCode = 'invalidSelector';
 * ```
 */
export type JsErrorCode = 'invalidSelector' | 'unsupportedMethod';

/**
 * Error codes specific to the Publisher module (Exportable operations).
 *
 * Used when ExportableError extends DraftOleError.
 *
 * - `invalidPath` - The file path is invalid or inaccessible
 * - `writeFailed` - The file write operation failed
 *
 * @example
 * ```typescript
 * const errorCode: ExportableErrorCode = 'invalidPath';
 * ```
 */
export type ExportableErrorCode = 'invalidPath' | 'writeFailed';

/**
 * Union type of all error codes across all DraftOle modules.
 *
 * This type combines error codes from HTML, CSS, JS, and Publisher modules
 * to provide a unified type for error handling throughout the library.
 *
 * @example
 * ```typescript
 * function handleError(code: DraftOleErrorCode, message: string) {
 *   // Handle any DraftOle error code
 * }
 * ```
 */
export type DraftOleErrorCode =
  | HtmlErrorCode
  | CssErrorCode
  | JsErrorCode
  | ExportableErrorCode;

/**
 * Abstract base class for all DraftOle errors.
 *
 * This class serves as the foundation for all custom errors in the DraftOle library.
 * Module-specific errors (HtmlError, CssError, JsError, ExportableError) extend this class
 * to provide consistent error handling across the library.
 *
 * The class is abstract and cannot be instantiated directly. Subclasses must implement
 * the `code` and `module` properties to specify the error type and origin.
 *
 * @example
 * ```typescript
 * class HtmlError extends DraftOleError {
 *   readonly code: HtmlErrorCode;
 *   readonly module = 'html' as const;
 *
 *   constructor(code: HtmlErrorCode, message: string) {
 *     super(message);
 *     this.code = code;
 *     this.name = 'HtmlError';
 *   }
 * }
 *
 * // Usage
 * try {
 *   throw new HtmlError('invalidTag', 'Invalid HTML tag: <script>');
 * } catch (error) {
 *   if (error instanceof DraftOleError) {
 *     console.log(`Error in ${error.module} module: ${error.message}`);
 *     console.log(`Error code: ${error.code}`);
 *   }
 * }
 * ```
 */
export abstract class DraftOleError extends Error {
  /**
   * The error code specific to the module where the error occurred.
   *
   * This property must be implemented by subclasses to identify the specific
   * type of error that occurred.
   */
  abstract readonly code: string | number;

  /**
   * The module where the error originated.
   *
   * This property identifies which DraftOle module threw the error,
   * enabling module-specific error handling.
   */
  abstract readonly module: 'html' | 'css' | 'js' | 'publisher';

  /**
   * Creates a new DraftOleError instance.
   *
   * This constructor is protected and can only be called from subclasses.
   * Direct instantiation of DraftOleError is prevented.
   *
   * @param message - Human-readable error message describing what went wrong
   *
   * @throws {Error} When attempting to instantiate DraftOleError directly
   *
   * @example
   * ```typescript
   * // In a subclass
   * class MyCustomError extends DraftOleError {
   *   readonly code = 'myError' as const;
   *   readonly module = 'html' as const;
   *
   *   constructor(message: string) {
   *     super(message); // Calls DraftOleError constructor
   *     this.name = 'MyCustomError';
   *   }
   * }
   * ```
   */
  constructor(message: string) {
    super(message);

    // 抽象クラスの直接インスタンス化を防止
    if (new.target === DraftOleError) {
      throw new Error(
        'DraftOleError is an abstract class and cannot be instantiated directly.',
      );
    }

    // V8 スタックトレースの修正（Node.js 環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}

/**
 * 各モジュール固有エラークラスの共通中間抽象クラス。
 *
 * `CssError`・`HtmlError`・`JsError` の共通コンストラクタロジック
 * （`super(message)` / `this.code` / `this.options` / `Error.captureStackTrace`）を一元管理する。
 *
 * @typeParam TCode - モジュール固有のエラーコード型（`string | number`）
 * @typeParam TOptions - 追加オプション型（`Record<string, unknown>` のサブタイプ）
 *
 * @example
 * ```typescript
 * export class CssError extends ModuleError<CssErrorCode, { property?: string }> {
 *   readonly module = 'css' as const;
 *   get property(): string | undefined { return this.options?.property; }
 *   constructor(code: CssErrorCode, message: string, options?: { property?: string }) {
 *     super(code, message, options);
 *   }
 * }
 * ```
 */
export abstract class ModuleError<
  TCode extends string | number,
  TOptions extends Record<string, unknown> = Record<string, never>,
> extends DraftOleError {
  /**
   * モジュール固有のエラーコード
   */
  readonly code: TCode;

  /**
   * 追加オプション（モジュール固有の補足情報）
   */
  readonly options?: TOptions;

  /**
   * ModuleError のコンストラクタ
   *
   * @param code - モジュール固有のエラーコード
   * @param message - エラーメッセージ
   * @param options - 追加オプション（オプショナル）
   */
  constructor(code: TCode, message: string, options?: TOptions) {
    super(message);
    this.code = code;
    this.options = options;
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * DEVモードで同一CSSプロパティが2回設定された場合にthrowされるエラー。
 *
 * `DRAFT_OLE_DEV=true` 環境変数が設定されている場合のみ発生する。
 * 本番環境では後から設定した値で上書きされる（CSS仕様通り）。
 */
export class DuplicateCssPropertyError extends DraftOleError {
  readonly code = 'duplicateProperty' as const;
  readonly module = 'css' as const;

  constructor(property: string) {
    super(
      `CSS property "${property}" was set twice on the same element. This is likely a bug.`,
    );
    this.name = 'DuplicateCssPropertyError';
  }
}

/**
 * `unknown` 型のエラー値を文字列に変換するユーティリティ関数。
 *
 * `Error` インスタンスの場合は `.message` プロパティを返し、
 * それ以外の値には `String()` を適用して文字列化する。
 *
 * catch ブロックで受け取った `unknown` 型のエラーを
 * 型エラーなく文字列として扱いたい場合に使用する。
 *
 * @param error - 変換対象のエラー値（`unknown` 型）
 * @returns エラーメッセージ文字列
 *
 * @example
 * ```typescript
 * try {
 *   // ...
 * } catch (error) {
 *   const message = errorToString(error);
 *   console.error(message);
 * }
 * ```
 */
export function errorToString(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
