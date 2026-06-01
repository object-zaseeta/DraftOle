import { ExportableError } from "draft-ole";
import { CssError } from "../css/errors/CssError";
import { HtmlError } from "../html/errors/HtmlError";
import { JsError } from "../js/errors/JsError";


export type Code =
  | HtmlError["code"]
  | CssError["code"]
  | JsError["code"]
  | ExportableError["code"];


export abstract class DraftOleError extends Error {
  abstract readonly code: Code;
  abstract readonly module: 'html' | 'css' | 'js' | 'publisher';

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


export class DuplicateCssPropertyError extends DraftOleError {
  readonly code = 'duplicateProperty';
  readonly module = 'css';

  constructor(property: string) {
    super(
      `CSS property "${property}" was set twice on the same element. This is likely a bug.`,
    );
    this.name = 'DuplicateCssPropertyError';
  }
}
