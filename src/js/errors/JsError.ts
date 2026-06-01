import { DraftOleError } from '../../utils/errors.js';


type Code = 'invalidSelector' | 'unsupportedMethod';

export class JsError extends DraftOleError {
  readonly module = 'js';
  readonly selector?: string;

  constructor(
    readonly code: Code,
    message: string,
    options?: { selector?: string },
  ) {
    super(message);
    this.selector = options?.selector;
    this.name = 'JsError';

    // V8 スタックトレースの修正（Node.js 環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JsError);
    }
  }
}
