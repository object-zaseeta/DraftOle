/**
 * DocumentContext: document-level policy の受け皿
 *
 * doctype フラグ、グローバル CSS リスト、reset baseline policy を保持する。
 * Root 非依存の独立したクラスとして定義し、Root はこれに委譲する（task 5.2）。
 *
 * Dependency rule:
 *   - html/*, css/*, utils/* からのインポートは許可
 *   - runtime/*, publisher/* からのインポートは禁止
 *
 * Conceptual separation (task 6.1):
 *   - `_resetCss`: document baseline policy — set once at construction from `reset` option.
 *     Represents a foundational invariant of the document, not a user-supplied rule.
 *   - `_globalCss`: consumer-supplied global rules — populated via constructor `globalCss` option.
 *     These are additional rules provided by the library consumer, layered on top of the baseline.
 *   Both contribute CSS output, but they belong to different responsibilities and must remain
 *   structurally separate so that the distinction is visible in code, not just in documentation.
 *
 * Requirements: 1.2, 1.3, 2.1, 4.1, 4.2, 4.3, 5.2
 */
import type { HTMLTagProtocol } from '../html/protocols/html-tag-protocol.js';
import { HtmlTag } from '../html/elements/html-tag.js';
import type { GlobalCss } from '../css/variables/global-css.js';
import type { IdentifierResolver } from '../css/utils/identifier-resolver.js';

const DEFAULT_CSS_RESET =
  '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }';

/**
 * Constructor options for DocumentContext.
 */
export interface DocumentContextOptions {
  /**
   * Whether to inject a CSS reset before all other styles.
   * @defaultValue false
   */
  reset?: boolean;
  /**
   * Global CSS to inject before scoped styles.
   * Must be provided as `GlobalCss` values constructed via the DSL (e.g. `root()`, `rule()`, `tag()`).
   */
  globalCss?: readonly GlobalCss[];
}

/**
 * Holds document-level policy: doctype flag, global CSS list, and reset baseline.
 *
 * This class is intentionally independent of `Root` so that document policy
 * can be tested and reused without the full rendering pipeline.
 *
 * @example
 * ```typescript
 * import { root, rule } from '../css/variables/global-dsl.js';
 * const docCtx = new DocumentContext({
 *   reset: true,
 *   globalCss: [root({ '--bg': '#0b1220' }), rule('body', { margin: '0' })],
 * });
 * const css = docCtx.collectCss(rootChildren);
 * ```
 */
export class DocumentContext {
  /** Whether to prepend <!DOCTYPE html> to render output. */
  private _doctype = false;

  /**
   * Document baseline policy (req 4.1).
   * Set once at construction from the `reset` option; never modified after that.
   * `null` means no reset was requested.
   */
  private _resetCss: string | null = null;

  /**
   * Consumer-supplied global rules (req 1.2, 4.2).
   * Populated at construction from the `globalCss` option; kept separate from the baseline policy.
   */
  private _globalCss: string[] = [];

  constructor(options?: DocumentContextOptions) {
    const { reset = false, globalCss } = options ?? {};
    if (reset) {
      // Store reset as its own baseline slot, not mixed into consumer rules.
      this._resetCss = DEFAULT_CSS_RESET;
    }
    if (globalCss !== undefined) {
      this._globalCss.push(...(globalCss as unknown as string[]));
    }
  }

  /**
   * Enables or disables <!DOCTYPE html> output.
   * Default is false (backward compatible).
   *
   * @param enabled - Whether to enable DOCTYPE output
   * @returns This instance for method chaining
   */
  setDoctype(enabled = true): this {
    this._doctype = enabled;
    return this;
  }

  /**
   * Returns the current doctype flag value.
   */
  get doctype(): boolean {
    return this._doctype;
  }

  /**
   * Collects all CSS for the document: global CSS first, then child element CSS.
   *
   * Mirrors `Root.collectCssStyleString()` logic so that Root can delegate to this.
   *
   * @param children - Root-level child elements to collect scoped CSS from
   * @returns Concatenated CSS string
   */
  collectCss(children: HTMLTagProtocol[], resolver?: IdentifierResolver): string {
    const parts: string[] = [];

    // baseline policy (reset) を最初に出力
    if (this._resetCss !== null) {
      parts.push(this._resetCss);
    }

    // consumer-supplied global rules をその後に出力
    if (this._globalCss.length > 0) {
      parts.push(this._globalCss.join('\n\n'));
    }

    // 子要素のスコープ CSS を収集
    const childCss = children
      .filter((child): child is HtmlTag => child instanceof HtmlTag)
      .map(child => child.collectCssStyleString(resolver))
      .filter(css => css.length > 0);
    if (childCss.length > 0) {
      parts.push(childCss.join(''));
    }

    return parts.join('\n\n');
  }
}
