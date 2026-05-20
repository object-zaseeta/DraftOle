/**
 * StateJsAccessor — State 値を読み書きする JS 文字列アクセサ
 *
 * 設計書 `design.md` の「Component: StateJsAccessor (NEW)」に対応。
 *
 * - `get()` → `"__draftole__.state('<runtimeId>').get()"`
 * - `set(expr)` → `"__draftole__.state('<runtimeId>').set(<expr>)"`
 * - `update(body)` → `"__draftole__.state('<runtimeId>').set((__v) => { <body> })"`
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

// ────────────────────────────────────────────────────────────
// Interface
// ────────────────────────────────────────────────────────────

export interface StateJsAccessor {
  /** `"__draftole__.state('<runtimeId>').get()"` を返す */
  get(): string;
  /** `"__draftole__.state('<runtimeId>').set(<expr>)"` を返す */
  set(expr: string): string;
  /** `"__draftole__.state('<runtimeId>').set((__v) => { <body> })"` を返す */
  update(body: string): string;
}

// ────────────────────────────────────────────────────────────
// Implementation
// ────────────────────────────────────────────────────────────

export class StateJsAccessorImpl implements StateJsAccessor {
  private readonly _runtimeId: string;

  constructor(runtimeId: string) {
    this._runtimeId = runtimeId;
  }

  get(): string {
    return `__draftole__.state('${this._runtimeId}').get()`;
  }

  set(expr: string): string {
    return `__draftole__.state('${this._runtimeId}').set(${expr})`;
  }

  update(body: string): string {
    return `__draftole__.state('${this._runtimeId}').set((__v) => { ${body} })`;
  }
}
