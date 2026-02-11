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
  | 'layoutConflict';

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
  abstract readonly code: DraftOleErrorCode;

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
