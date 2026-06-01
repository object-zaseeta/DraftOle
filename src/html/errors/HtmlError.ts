import { DraftOleError } from '../../utils/errors.js';


type Code = 'invalidTag' | 'invalidAttribute' | 'nestingLimit';


export class HtmlError extends DraftOleError {
  readonly module = 'html';
  readonly tagType?: string;

  constructor(
    readonly code: Code,
    message: string,
    options?: { tagType?: string },
  ) {
    super(message);
    this.tagType = options?.tagType;
    this.name = 'HtmlError';

    // V8 スタックトレースの修正（Node.js 環境）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HtmlError);
    }
  }
}
