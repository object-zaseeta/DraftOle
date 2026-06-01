import { DraftOleError } from '../../utils/errors.js';


export type Code = 'invalidPath' | 'writeFailed';


export class ExportableError extends DraftOleError {
  readonly module = 'publisher';

  constructor(
    readonly code: Code,
    readonly filePath: string,
    message?: string,
  ) {
    const errorMessage =
      message ??
      `ExportableError [${code}]: Failed to process file at "${filePath}"`;

    super(errorMessage);

    this.name = 'ExportableError';

    // V8スタックトレースの修正（Node.js環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExportableError);
    }
  }
}
