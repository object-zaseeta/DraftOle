import { DraftOleError } from '../../utils/errors.js';


type Code =
  | 'invalidProperty'
  | 'invalidValue'
  | 'layoutConflict'
  | 'duplicateProperty';


export class CssError extends DraftOleError {
  readonly module = 'css';
  readonly property?: string;

  constructor(
    readonly code: Code,
    message: string,
    options?: { property?: string },
  ) {
    super(message);
    this.property = options?.property;
    this.name = 'CssError';

    // V8 スタックトレースの修正（Node.js 環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CssError);
    }
  }
}
