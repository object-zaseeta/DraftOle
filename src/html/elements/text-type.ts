/**
 * Task 4.4: TextType テキストノード
 *
 * テキスト内容をそのまま返すテキストノードクラス。
 * テキストノードは属性を持たず、子要素も持たない。
 *
 * レンダリング:
 *   protoRender() → content をそのまま返す（エスケープなし）
 *   render()      → protoRender() → HTMLFormatter.format()
 *                   （テキストのみの場合はそのまま返される）
 *
 * Requirements: 3.4, 6.3
 */
import { HtmlTag } from './html-tag.js';
import type { HTMLTagProtocol, HtmlAttributeShape } from '../protocols/html-tag-protocol.js';
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
 * **Important:** Text content is **not escaped**. If you need HTML entity escaping,
 * you must handle it before passing the content to TextType.
 *
 * @example
 * Basic usage:
 * ```typescript
 * // Using the Text factory function
 * const text = Text('Hello World');
 *
 * // Text nodes are also auto-created from strings in tag factories
 * const paragraph = p('This is automatically wrapped in TextType');
 * ```
 *
 * @example
 * Text nodes in complex structures:
 * ```typescript
 * const content = div(
 *   'Plain text',
 *   span('Styled text'),
 *   'More plain text'
 * );
 * // String arguments are automatically converted to TextType
 * ```
 *
 * @example
 * No HTML escaping (be careful with user input):
 * ```typescript
 * const text = Text('<script>alert("XSS")</script>');
 * // This will render as-is, creating a potential XSS vulnerability!
 * // Always escape user input before creating text nodes
 * ```
 *
 * @remarks
 * **Preconditions:** content can be any string (including empty string)
 *
 * **Postconditions:** `protoRender()` returns content as-is (no escaping)
 *
 * **Invariants:** attributes and children are always empty
 */
export class TextType extends HtmlTag {
  /**
   * The text content of this node (after escape processing).
   */
  readonly content: string;

  /**
   * Creates a new TextType node.
   *
   * @param content - The text content
   * @param options - Options. `escape: true` enables HTML escaping (default: false for backward compat)
   *
   * @example
   * ```typescript
   * const text = new TextType('Hello World');
   * console.log(text.render()); // "Hello World"
   *
   * const safe = new TextType('<script>alert("XSS")</script>', { escape: true });
   * console.log(safe.render()); // "&lt;script&gt;..."
   * ```
   */
  constructor(content: string, options?: { escape?: boolean }) {
    super('text');
    this.content = options?.escape ? escapeHtml(content) : content;
  }

  /**
   * Renders the text content as-is.
   *
   * Text nodes don't have tags, so this simply returns the content without
   * any HTML escaping.
   *
   * @returns The raw text content
   *
   * @example
   * ```typescript
   * const text = new TextType('Hello <world>');
   * console.log(text.protoRender()); // "Hello <world>" (not escaped!)
   * ```
   */
  override protoRender(): string {
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
