/**
 * HtmlTag 抽象基底クラス
 *
 * 全タグ共通のレンダリングロジックと属性管理を集約する。
 * HTMLTagProtocol を実装し、サブクラス（Root, PairType, SelfClosingType, TextType）の
 * 共通動作を提供する。
 *
 * レンダリングフロー:
 *   render() → protoRender() → HTMLFormatter.format()
 *
 * Task 0.2: CssManagerInstance をコンポジションで保持。
 *   collectCssStyleString() は this._css.render() に委譲する。
 *
 * Requirements: 6.1, 6.2, 6.7
 */
import type { HTMLTagProtocol, HtmlAttributeShape } from '../protocols/html-tag-protocol.js';
import type { CssManagerType } from '../protocols/css-manager-type.js';
import type { JQueryManagerProtocol } from '../protocols/jquery-manager-protocol.js';
import type { CssManagerInstance } from '../../css/manager/css-manager-instance-type.js';
import { CssManager } from '../../css/manager/css-manager.js';
import type { TagType } from '../tags/tag-type.js';
import { SELF_CLOSING_TAGS } from '../tags/tag-type.js';
import { HTMLFormatter } from '../utils/html-formatter.js';
import type { JQueryMethodType } from '../../js/jquery-method-type.js';
import type { JQueryManagerInstance } from '../../js/jquery-manager.js';
import { JQueryManager } from '../../js/jquery-manager.js';

/**
 * Abstract base class for all HTML elements.
 *
 * This class provides the common rendering logic and attribute/child management
 * for all HTML tag types. It implements {@link HTMLTagProtocol}, {@link CssManagerType},
 * and {@link JQueryManagerProtocol}.
 *
 * **Rendering Flow:**
 * - `render()` → `protoRender()` → `HTMLFormatter.format()`
 *
 * **Composition Pattern:**
 * - CSS management is delegated to {@link CssManagerInstance}
 * - JavaScript/jQuery management is delegated to {@link JQueryManagerInstance}
 *
 * **Subclasses:**
 * - {@link Root} - Document root element
 * - {@link PairType} - Elements with opening and closing tags (e.g., `<div>...</div>`)
 * - {@link SelfClosingType} - Self-closing elements (e.g., `<br>`)
 * - {@link TextType} - Text nodes
 *
 * @example
 * ```typescript
 * // Typically used through factory functions, not instantiated directly
 * const element = div(
 *   p('Hello'),
 *   span('World')
 * );
 * console.log(element.render());
 * ```
 *
 * @remarks
 * **Preconditions:** tagType must be a valid {@link TagType} value
 *
 * **Postconditions:** `render()`/`protoRender()` return valid HTML strings
 *
 * **Invariants:** Children order is preserved in insertion order
 */
export abstract class HtmlTag implements HTMLTagProtocol, CssManagerType, JQueryManagerProtocol {
  /**
   * The HTML tag type (e.g., 'div', 'p', 'span').
   */
  readonly tagType: TagType;

  /**
   * Child elements managed by this tag.
   * @internal
   */
  protected _children: HTMLTagProtocol[] = [];

  /**
   * HTML attributes managed by this tag.
   * @internal
   */
  protected _attributes: HtmlAttributeShape[] = [];

  /**
   * CSS manager instance (composition pattern).
   * @internal
   */
  private _css: CssManagerInstance = new CssManager();

  /**
   * jQuery manager instance (composition pattern).
   * @internal
   */
  private _jqm: JQueryManagerInstance = new JQueryManager();

  /**
   * Creates a new HtmlTag instance.
   *
   * @param tagType - The HTML tag type
   */
  constructor(tagType: TagType) {
    this.tagType = tagType;
  }

  // ── CSS コンポジション ──

  /**
   * Gets the CSS manager for this element.
   *
   * @returns The {@link CssManagerInstance} for managing CSS styles
   *
   * @example
   * ```typescript
   * const element = div();
   * element.css.addRule('.my-class', { color: 'red' });
   * ```
   */
  get css(): CssManagerInstance {
    return this._css;
  }

  // ── JS コンポジション ──

  /**
   * Gets the jQuery manager for this element.
   *
   * @returns The {@link JQueryManagerInstance} for managing JavaScript/jQuery operations
   *
   * @example
   * ```typescript
   * const element = div();
   * element.jqm.on('click', () => console.log('Clicked!'));
   * ```
   */
  get jqm(): JQueryManagerInstance {
    return this._jqm;
  }

  // ── 子要素管理 ──

  /**
   * Gets the child elements of this tag.
   *
   * @returns Read-only array of child elements
   */
  get children(): ReadonlyArray<HTMLTagProtocol> {
    return this._children;
  }

  /**
   * Adds a child element to this tag.
   *
   * @param child - The child element to add
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const container = div();
   * container.addChild(p('Hello'));
   * container.addChild(span('World'));
   * ```
   */
  addChild(child: HTMLTagProtocol): this {
    this._children.push(child);
    return this;
  }

  /**
   * Adds multiple child elements to this tag.
   *
   * @param children - Array of child elements to add
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const container = div();
   * container.addChildren([
   *   p('First paragraph'),
   *   p('Second paragraph')
   * ]);
   * ```
   */
  addChildren(children: ReadonlyArray<HTMLTagProtocol>): this {
    for (const child of children) {
      this._children.push(child);
    }
    return this;
  }

  // ── 属性管理 ──

  /**
   * Gets the HTML attributes of this tag.
   *
   * @returns Read-only array of HTML attributes
   */
  get attributes(): ReadonlyArray<HtmlAttributeShape> {
    return this._attributes;
  }

  /**
   * Adds an HTML attribute to this tag.
   *
   * @param attribute - The attribute to add
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const element = div();
   * element.addHtmlAttribute(HtmlAttribute.className('container'));
   * element.addHtmlAttribute(HtmlAttribute.keyValue('id', 'main'));
   * ```
   */
  addHtmlAttribute(attribute: HtmlAttributeShape): this {
    this._attributes.push(attribute);
    return this;
  }

  /**
   * Renders all attributes as an HTML string.
   *
   * @returns A space-prefixed string of attributes, or empty string if no attributes
   *
   * @example
   * ```typescript
   * // Returns: ' class="btn" id="submit"'
   * const element = div({ class: 'btn', id: 'submit' });
   * console.log(element.renderAttributes());
   * ```
   */
  renderAttributes(): string {
    if (this._attributes.length === 0) return '';
    return ' ' + this._attributes.map(a => a.renderAttribute()).join(' ');
  }

  // ── レンダリング ──

  /**
   * Renders the element as a minified HTML string (without formatting).
   *
   * This method generates the raw HTML output based on the tag type:
   * - **root**: Concatenates child elements (no tag wrapper)
   * - **text**: Returns content as-is (overridden in {@link TextType})
   * - **selfClosing**: Returns `<tag attrs>` format
   * - **pair**: Returns `<tag attrs>children</tag>` format
   *
   * @returns Minified HTML string
   *
   * @remarks
   * This method is typically called internally by {@link render}.
   * Use {@link render} for formatted output.
   */
  protoRender(): string {
    const tagName = this.tagType;
    const attrs = this.renderAttributes();

    // root: 子要素の protoRender() を連結（Root自身のタグは出力しない）
    if (tagName === 'root') {
      return this._children.map(c => c.protoRender()).join('');
    }

    // text: サブクラス（TextType）で override する
    // デフォルトでは空文字列を返す
    if (tagName === 'text') {
      return '';
    }

    // selfClosing: <tag attrs>
    if (SELF_CLOSING_TAGS.has(tagName)) {
      return `<${tagName}${attrs}>`;
    }

    // pair: <tag attrs>children</tag>
    const childrenHtml = this._children.map(c => c.protoRender()).join('');
    return `<${tagName}${attrs}>${childrenHtml}</${tagName}>`;
  }

  /**
   * Renders the element as a formatted HTML string.
   *
   * This method applies HTML formatting (indentation, line breaks) to the
   * minified output from {@link protoRender}.
   *
   * @returns Formatted HTML string
   *
   * @example
   * ```typescript
   * const element = div(
   *   p('Hello'),
   *   p('World')
   * );
   * console.log(element.render());
   * // Output:
   * // <div>
   * //   <p>Hello</p>
   * //   <p>World</p>
   * // </div>
   * ```
   */
  render(): string {
    const minified = this.protoRender();
    return HTMLFormatter.format(minified);
  }

  // ── CSS/JS (コンポジションパターン委譲) ──

  /**
   * Collects CSS style strings from this element.
   *
   * Delegates to the internal {@link CssManagerInstance}.
   *
   * @returns CSS style string
   */
  collectCssStyleString(): string {
    return this._css.render();
  }

  /**
   * Recursively collects JavaScript content from this element and its descendants.
   *
   * @returns Concatenated JavaScript string (separated by `;\n`)
   *
   * @example
   * ```typescript
   * const element = div();
   * element.jqm.on('click', () => console.log('Clicked'));
   * const js = element.collectJsContent();
   * ```
   */
  collectJsContent(): string {
    const contents: string[] = [];

    // 自身のJQueryManager のJS文を収集
    const ownJs = this._jqm.render();
    if (ownJs.length > 0) {
      contents.push(ownJs);
    }

    // 子要素のJSを再帰的に収集
    for (const child of this._children) {
      if ('collectJsContent' in child && typeof child.collectJsContent === 'function') {
        const childJs = child.collectJsContent();
        if (childJs.length > 0) {
          contents.push(childJs);
        }
      }
    }

    return contents.join(';\n');
  }

  /**
   * Recursively collects jQuery method types used by this element and its descendants.
   *
   * This is used for tree-shaking to include only the necessary jQuery helper functions.
   *
   * @returns Set of {@link JQueryMethodType} used in the element tree
   *
   * @example
   * ```typescript
   * const element = div();
   * element.jqm.on('click', handler);
   * const methods = element.collectUsedMethods();
   * // methods includes: Set(['on'])
   * ```
   */
  collectUsedMethods(): Set<JQueryMethodType> {
    // 自身のJQueryManagerで使用されたメソッドから開始
    const result = new Set<JQueryMethodType>(this._jqm.usedMethods);

    // 子要素のメソッドを再帰的に収集
    for (const child of this._children) {
      if ('collectUsedMethods' in child && typeof child.collectUsedMethods === 'function') {
        for (const method of child.collectUsedMethods()) {
          result.add(method);
        }
      }
    }

    return result;
  }
}
