/**
 * Task 4.5: Root ドキュメントルート要素
 *
 * HTML文書のトップレベル要素。Root自身のタグは出力せず、
 * 子要素のレンダリング結果を連結して返す。
 *
 * CSS出力モード（default/inline/external）を管理し、
 * ツリー全体のCSS/JSコンテンツ収集スタブ（Phase 3/4接続点）を提供する。
 *
 * レンダリング:
 *   protoRender() → 子要素の protoRender() を連結（Root自体のタグは出力しない）
 *   render()      → protoRender() → HTMLFormatter.format()
 *
 * Requirements: 3.1, 3.7, 3.8, 3.9, 6.6, 6.1, 6.2, 6.3, 6.4
 */
import { HtmlTag, type HtmlTagOptions } from './html-tag.js';
import { JQueryHelper } from '../../js/jquery-helper.js';
import type { JQueryMethodType } from '../../js/jquery-method-type.js';

/**
 * CSS output mode for the document.
 *
 * - **default**: Default behavior (defined in Phase 3)
 * - **inline**: Inline CSS output (styles in `<style>` tags)
 * - **external**: External CSS output (separate `.css` file)
 */
export type CssOutputMode = 'default' | 'inline' | 'external';

/**
 * Represents the root element of an HTML document.
 *
 * Root is a special element that doesn't render its own tag, but instead
 * concatenates the rendering output of its child elements. It serves as the
 * top-level container for the entire HTML document tree.
 *
 * **Key Features:**
 * - Manages CSS output mode (default/inline/external)
 * - Collects CSS and JavaScript from entire document tree
 * - Provides `renderJs()` for complete JavaScript output with tree-shaking
 *
 * **Rendering Format:**
 * ```html
 * <!-- No root tag is rendered, only children: -->
 * <child1>...</child1>
 * <child2>...</child2>
 * ```
 *
 * @example
 * Basic document structure:
 * ```typescript
 * const doc = new Root();
 * doc.addChild(html(
 *   head(title('My Page')),
 *   body(
 *     h1('Hello World'),
 *     p('Welcome to my page')
 *   )
 * ));
 *
 * console.log(doc.render());
 * ```
 *
 * @example
 * With JavaScript tree-shaking:
 * ```typescript
 * const doc = new Root();
 * const button = div();
 * button.jqm.on('click', () => console.log('Clicked'));
 * doc.addChild(button);
 *
 * // Only includes helper for 'on' method
 * const js = doc.renderJs();
 * ```
 *
 * @remarks
 * **Preconditions:** None (no constructor arguments required)
 *
 * **Postconditions:** `protoRender()` returns concatenated child output (no root tag)
 *
 * **Invariants:** `cssOutputMode` is one of {@link CssOutputMode} values
 */
export class Root extends HtmlTag {
  /**
   * CSS output mode for this document.
   *
   * @defaultValue 'default'
   */
  cssOutputMode: CssOutputMode = 'default';

  /** Global CSS strings (output before scoped CSS). */
  private _globalCss: string[] = [];

  /** Whether to prepend <!DOCTYPE html> to render output. */
  private _doctype = false;

  /**
   * Creates a new Root element.
   *
   * @param options - Optional DI options for injecting CssManager/JQueryManager (mainly for testing)
   */
  constructor(options?: HtmlTagOptions) {
    super('root', options);
  }

  /**
   * Enables or disables <!DOCTYPE html> output.
   * Default is false (backward compatible).
   */
  setDoctype(enabled = true): this {
    this._doctype = enabled;
    return this;
  }

  /**
   * Adds global CSS to the document (output before scoped CSS).
   *
   * Use for CSS resets, CSS variables (:root), and other global rules
   * that can't be expressed as scoped per-element styles.
   *
   * @param css - Raw CSS string
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const root = new Root();
   * root.addGlobalCss('* { box-sizing: border-box; }');
   * root.addGlobalCss(':root { --bg: #0b1220; }');
   * ```
   */
  addGlobalCss(css: string): this {
    if (css.trim().length > 0) {
      this._globalCss.push(css);
    }
    return this;
  }

  /**
   * Renders the document tree to formatted HTML.
   * Prepends <!DOCTYPE html> if enabled via setDoctype().
   */
  override render(): string {
    const html = super.render();
    return this._doctype ? `<!DOCTYPE html>\n${html}` : html;
  }

  /**
   * Recursively collects CSS styles from the entire document tree.
   *
   * Traverses all child elements and concatenates their CSS output.
   *
   * @returns Concatenated CSS string from all elements
   *
   * @example
   * ```typescript
   * const doc = new Root();
   * const element = div();
   * element.css.addRule('.my-class', { color: 'red' });
   * doc.addChild(element);
   *
   * const css = doc.collectCssStyleString();
   * ```
   */
  override collectCssStyleString(): string {
    const parts: string[] = [];

    // CSS-2: グローバルCSSを先頭に出力
    if (this._globalCss.length > 0) {
      parts.push(this._globalCss.join('\n\n'));
    }

    // スコープCSSを収集
    const childCss = this._children
      .filter((child): child is HtmlTag => child instanceof HtmlTag)
      .map(child => child.collectCssStyleString())
      .filter(css => css.length > 0);
    if (childCss.length > 0) {
      parts.push(childCss.join(''));
    }

    return parts.join('\n\n');
  }

  /**
   * Recursively collects JavaScript content from the entire document tree.
   *
   * Traverses all child elements and concatenates their JavaScript output.
   *
   * @returns Concatenated JavaScript string from all elements
   *
   * @example
   * ```typescript
   * const doc = new Root();
   * const button = div();
   * button.jqm.on('click', () => console.log('Clicked'));
   * doc.addChild(button);
   *
   * const js = doc.collectJsContent();
   * ```
   */
  override collectJsContent(): string {
    const childJs = this._children
      .filter((child): child is HtmlTag => child instanceof HtmlTag)
      .map(child => child.collectJsContent())
      .filter(js => js.length > 0);
    return childJs.join('');
  }

  /**
   * Recursively collects jQuery method types used in the entire document tree.
   *
   * Aggregates all jQuery methods used by descendant elements for tree-shaking.
   *
   * @returns Set of {@link JQueryMethodType} used in the document
   */
  override collectUsedMethods(): Set<JQueryMethodType> {
    const result = new Set<JQueryMethodType>();
    for (const child of this._children) {
      if (child instanceof HtmlTag) {
        for (const method of child.collectUsedMethods()) {
          result.add(method);
        }
      }
    }
    return result;
  }

  /**
   * Generates complete JavaScript output with tree-shaking.
   *
   * Combines jQuery helper functions (only for used methods) with the actual
   * JavaScript content from the document tree.
   *
   * **Output Format:**
   * - If no methods used: returns empty string
   * - If no content but methods used: returns helper only
   * - Otherwise: returns `helper + "\n\n" + jsContent`
   *
   * @returns Complete JavaScript string ready for embedding
   *
   * @example
   * ```typescript
   * const doc = new Root();
   * const button = div();
   * button.jqm.on('click', () => console.log('Clicked'));
   * button.jqm.addClass('active');
   * doc.addChild(button);
   *
   * const js = doc.renderJs();
   * // Output includes:
   * // - Helper functions for 'on' and 'addClass' only (tree-shaken)
   * // - Actual event handler and addClass call
   * ```
   *
   * @remarks
   * **Preconditions:** None
   *
   * **Postconditions:**
   * - Empty string if no methods used
   * - `helper + "\n\n" + jsContent` format if methods used
   *
   * **Invariants:** Helper and jsContent separator is always `"\n\n"`
   */
  renderJs(): string {
    // ツリー全体で使用されたjQueryメソッドを収集
    const usedMethods = this.collectUsedMethods();

    // メソッドが使用されていない場合は空文字列を返す (Req 6.4)
    if (usedMethods.size === 0) {
      return '';
    }

    // Tree-shaking対応のヘルパー関数を生成 (Req 6.3)
    const helper = JQueryHelper.generateHelper(usedMethods);

    // ツリー全体のJSコンテンツを収集 (Req 6.2)
    const jsContent = this.collectJsContent();

    // jsContentが空の場合はヘルパーのみを返す
    if (jsContent.length === 0) {
      return helper;
    }

    // ヘルパー + "\n\n" + jsContent の形式で出力 (Req 6.3)
    return `${helper}\n\n${jsContent}`;
  }
}
