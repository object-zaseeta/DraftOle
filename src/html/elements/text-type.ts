/**
 * Task 4.4: TextType テキストノード
 *
 * テキスト内容を返すテキストノードクラス。
 * テキストノードは属性を持たず、子要素も持たない。
 *
 * レンダリング:
 *   protoRender() → content を返す（デフォルトはエスケープ済み）
 *   render()      → protoRender() → HTMLFormatter.format()
 *                   （テキストのみの場合はそのまま返される）
 *
 * Requirements: 3.4, 6.3
 */
import { HtmlTag } from './html-tag.js';
import type { HTMLTagProtocol, HtmlAttributeShape } from '../protocols/html-tag-protocol.js';
import type { RenderContext } from './render-context.js';
import { escapeHtml } from '../attributes/html-attribute.js';

/**
 * Represents a text node in the HTML document tree.
 *
 * Text nodes contain plain text content without any HTML tags. They cannot
 * have attributes or child elements.
 *
 * **Rendering Format:**
 * ```
 * content
 * ```
 * (No HTML tags, just the raw text content)
 *
 * **Important:** Text content is HTML-escaped by default to prevent XSS.
 * Use `TextType.raw(content)` for intentional unescaped HTML output.
 *
 * @example
 * Basic usage:
 * ```typescript
 * // Using the Text factory function (escaped by default)
 * const text = Text('Hello <World>'); // renders: Hello &lt;World&gt;
 *
 * // Text nodes are also auto-created from strings in tag factories
 * const paragraph = p('This is automatically wrapped in TextType');
 * ```
 *
 * @example
 * Intentional raw HTML (trusted content only):
 * ```typescript
 * const raw = TextType.raw('<strong>trusted</strong>');
 * // WARNING: Never pass user input to TextType.raw()
 * ```
 *
 * @remarks
 * **Preconditions:** content can be any string (including empty string)
 *
 * **Postconditions:** `protoRender()` returns HTML-escaped content by default
 *
 * **Invariants:** attributes and children are always empty
 */
export class TextType extends HtmlTag {
  /**
   * The text content of this node (after escape processing).
   */
  readonly content: string;

  /**
   * Creates a new TextType node. Content is HTML-escaped by default.
   *
   * @param content - The text content
   * @param options - Options. `escape: false` disables HTML escaping (default: true)
   *
   * @example
   * ```typescript
   * const text = new TextType('Hello <World>');
   * console.log(text.render()); // "Hello &lt;World&gt;"
   *
   * const raw = new TextType('<strong>trusted</strong>', { escape: false });
   * console.log(raw.render()); // "<strong>trusted</strong>"
   * ```
   */
  constructor(content: string, options?: { escape?: boolean }) {
    super('text');
    this.content = options?.escape !== false ? escapeHtml(content) : content;
  }

  /**
   * Creates an unescaped TextType node for intentional raw HTML output.
   *
   * **WARNING:** Never pass user input to this method — XSS risk.
   *
   * @param content - Raw HTML/text content (NOT escaped)
   * @returns A new TextType instance without HTML escaping
   *
   * @example
   * ```typescript
   * const raw = TextType.raw('<em>trusted</em>');
   * console.log(raw.render()); // "<em>trusted</em>"
   * ```
   */
  static raw(content: string): TextType {
    return new TextType(content, { escape: false });
  }

  /**
   * Renders the text content (HTML-escaped by default).
   *
   * Text nodes don't have tags, so this simply returns the content.
   *
   * @returns The text content (escaped unless constructed with `escape: false`)
   *
   * @example
   * ```typescript
   * const text = new TextType('Hello <world>');
   * console.log(text.protoRender()); // "Hello &lt;world&gt;"
   * ```
   */
  override protoRender(_ctx?: RenderContext): string {
    // Task 3.2: ctx を受理（TextType は子要素を持たないため伝搬先なし）。
    // 出力は content をそのまま返す（既存挙動を維持）。
    return this.content;
  }

  /**
   * Silently ignores attribute addition (no-op).
   *
   * Text nodes cannot have attributes, so this method does nothing.
   *
   * @param _attribute - The attribute (ignored)
   * @returns This instance for method chaining
   */
  override addHtmlAttribute(_attribute: HtmlAttributeShape): this {
    // No-op: テキストノードは属性を持てない
    return this;
  }

  /**
   * Silently ignores child element addition (no-op).
   *
   * Text nodes cannot have children, so this method does nothing.
   *
   * @param _child - The child element (ignored)
   * @returns This instance for method chaining
   */
  override addChild(_child: HTMLTagProtocol): this {
    // No-op: テキストノードは子要素を持てない
    return this;
  }

  /**
   * Silently ignores multiple child elements addition (no-op).
   *
   * Text nodes cannot have children, so this method does nothing.
   *
   * @param _children - The child elements (ignored)
   * @returns This instance for method chaining
   */
  override addChildren(_children: ReadonlyArray<HTMLTagProtocol>): this {
    // No-op: テキストノードは子要素を持てない
    return this;
  }
}
