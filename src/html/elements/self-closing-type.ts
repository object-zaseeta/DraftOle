/**
 * Task 4.3: SelfClosingType 自己終了タグ要素
 *
 * 終了タグを持たない自己終了要素（br, hr, img, input, meta, link 等）を表す。
 * HtmlTag を継承し、addChild/addChildren をオーバーライドして
 * 子要素追加を静かに無視する（no-op）。
 *
 * レンダリングは基底クラスの protoRender() が SELF_CLOSING_TAGS を参照して
 * `<tag attrs>` 形式を生成するため、追加のオーバーライドは不要。
 *
 * Requirements: 3.3, 6.4, 10.1
 */
import { HtmlTag } from './html-tag.js';
import type { HtmlTagOptions } from './html-tag.js';
import type { RenderContext } from './render-context.js';
import type { HTMLTagProtocol } from '../protocols/html-tag-protocol.js';
import type { TagType } from '../tags/tag-type.js';

/**
 * Represents self-closing (void) HTML elements.
 *
 * Self-closing elements don't have closing tags and cannot contain children.
 * Examples include `<br>`, `<hr>`, `<img>`, `<input>`, `<meta>`, `<link>`, etc.
 *
 * **Rendering Format:**
 * ```html
 * <tag attrs>
 * ```
 *
 * **Child Handling:**
 * Attempts to add children are silently ignored (no-op) to maintain API consistency.
 * This design choice prevents runtime errors while maintaining fluent method chaining.
 *
 * @example
 * Basic usage:
 * ```typescript
 * // Using factory functions (recommended)
 * const lineBreak = br();
 * const image = img({ src: 'photo.jpg', alt: 'My photo' });
 * const inputField = input({ type: 'text', placeholder: 'Enter name' });
 * ```
 *
 * @example
 * Child elements are silently ignored:
 * ```typescript
 * const lineBreak = br();
 * lineBreak.addChild(p('This will be ignored'));
 * console.log(lineBreak.render());
 * // Output: <br>
 * // (no error, child is simply not rendered)
 * ```
 *
 * @remarks
 * **Preconditions:** tagType must be in {@link SELF_CLOSING_TAGS}
 *
 * **Postconditions:** `protoRender()` returns `<tag attrs>` format
 *
 * **Invariants:** Children array is always empty (addChild/addChildren are no-ops)
 */
export class SelfClosingType extends HtmlTag {
  /**
   * Creates a new SelfClosingType element.
   *
   * @param tagType - The HTML tag type (must be a self-closing tag like 'br', 'img', etc.)
   *
   * @remarks
   * It's recommended to use factory functions like {@link br}, {@link img}, {@link input}
   * instead of direct instantiation.
   */
  constructor(tagType: TagType, options?: HtmlTagOptions) {
    super(tagType, options);
  }

  /**
   * Silently ignores child element addition (no-op).
   *
   * Self-closing tags cannot have children, so this method does nothing.
   * This design prevents runtime errors while maintaining method chaining compatibility.
   *
   * @param _child - The child element (ignored)
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const element = br()
   *   .addChild(p('Ignored'))  // No error, just ignored
   *   .addHtmlAttribute(HtmlAttribute.className('line-break'));
   * ```
   */
  override addChild(_child: HTMLTagProtocol): this {
    // No-op: self-closing tags cannot have children
    return this;
  }

  /**
   * Silently ignores multiple child elements addition (no-op).
   *
   * Self-closing tags cannot have children, so this method does nothing.
   *
   * @param _children - The child elements (ignored)
   * @returns This instance for method chaining
   */
  override addChildren(_children: ReadonlyArray<HTMLTagProtocol>): this {
    // No-op: self-closing tags cannot have children
    return this;
  }

  /**
   * Task 3.2: SelfClosingType の protoRender override。
   *
   * SelfClosing 要素は子を持たないが、シグネチャを ctx 受理形に widen し、
   * 基底クラス実装に ctx を伝搬する。出力フォーマット（`<tag attrs>`）は
   * 基底クラス挙動を維持する。
   */
  override protoRender(ctx?: RenderContext): string {
    return super.protoRender(ctx);
  }
}
