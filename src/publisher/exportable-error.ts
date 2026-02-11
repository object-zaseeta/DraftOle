import { DraftOleError, type ExportableErrorCode } from '../utils/errors.js';

/**
 * ファイルエクスポート時のエラー
 *
 * {@link FileExporter}でのファイル書き込み失敗時にスローされる専用エラークラスです。
 *
 * @remarks
 * {@link DraftOleError}を継承し、DraftOleのエラー型階層に統合されています（タスク3.3）。
 * エラーコードとファイルパスを保持し、デバッグを容易にします。
 *
 * ### エラーコード
 * - `invalidPath`: 出力パスが空または無効
 * - `writeFailed`: ファイル書き込みまたはディレクトリ作成失敗
 *
 * ### プロパティ
 * - `code`: {@link ExportableErrorCode} - エラーの種類を識別
 * - `module`: 常に `'publisher'` - エラーが発生したモジュール
 * - `filePath`: エラーが発生したファイルパス
 * - `message`: エラーメッセージ（カスタマイズ可能）
 *
 * @example 基本的なスロー
 * ```typescript
 * throw new ExportableError('writeFailed', '/output/file.html', 'Disk full');
 * ```
 *
 * @example エラーコードによるハンドリング
 * ```typescript
 * try {
 *   exporter.export(html, css, js, '');
 * } catch (error) {
 *   if (error instanceof ExportableError) {
 *     switch (error.code) {
 *       case 'invalidPath':
 *         console.error('Please provide a valid output path');
 *         break;
 *       case 'writeFailed':
 *         console.error('Failed to write files:', error.message);
 *         console.error('Target path:', error.filePath);
 *         break;
 *     }
 *   }
 * }
 * ```
 *
 * @example デフォルトメッセージ
 * ```typescript
 * // カスタムメッセージを省略した場合
 * throw new ExportableError('invalidPath', '/output');
 * // → message: 'ExportableError [invalidPath]: Failed to process file at "/output"'
 * ```
 *
 * @example DraftOleErrorとしてキャッチ
 * ```typescript
 * try {
 *   exporter.export(html, css, js, outputPath);
 * } catch (error) {
 *   if (error instanceof DraftOleError) {
 *     console.error(`Module: ${error.module}`);
 *     console.error(`Error: ${error.message}`);
 *
 *     // ExportableErrorの場合のみ追加情報を表示
 *     if (error instanceof ExportableError) {
 *       console.error(`Code: ${error.code}`);
 *       console.error(`File: ${error.filePath}`);
 *     }
 *   }
 * }
 * ```
 *
 * @example ログ記録
 * ```typescript
 * function logExportError(error: ExportableError): void {
 *   const logEntry = {
 *     timestamp: new Date().toISOString(),
 *     module: error.module,
 *     code: error.code,
 *     filePath: error.filePath,
 *     message: error.message,
 *     stack: error.stack,
 *   };
 *   console.error(JSON.stringify(logEntry, null, 2));
 * }
 * ```
 *
 * @public
 */
export class ExportableError extends DraftOleError {
  /**
   * Publisher エラーコード
   */
  readonly code: ExportableErrorCode;

  /**
   * エラーが発生したモジュール（常に 'publisher'）
   */
  readonly module = 'publisher' as const;

  /**
   * エラーが発生したファイルパス
   */
  readonly filePath: string;

  /**
   * ExportableError のコンストラクタ
   *
   * @param code - エラーコード
   * @param filePath - エラーが発生したファイルパス
   * @param message - カスタムエラーメッセージ（オプション）
   */
  constructor(
    code: ExportableErrorCode,
    filePath: string,
    message?: string,
  ) {
    // カスタムメッセージがない場合はデフォルトメッセージを生成
    const errorMessage =
      message ??
      `ExportableError [${code}]: Failed to process file at "${filePath}"`;

    super(errorMessage);

    this.name = 'ExportableError';
    this.code = code;
    this.filePath = filePath;

    // V8スタックトレースの修正（Node.js環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExportableError);
    }
  }
}
