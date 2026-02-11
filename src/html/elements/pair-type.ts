/**
 * Task 4.2: PairType ペアタグ要素
 *
 * 開始タグと終了タグを持つペア要素（div, p, span等）を表現する。
 * HtmlTag 基底クラスを継承し、<tag attrs>children</tag> 形式でレンダリングする。
 *
 * PairType は HtmlTag の全動作をそのまま継承する最も標準的なタグ種別であり、
 * addChild()/addChildren() で子要素を追加順に保持し、
 * protoRender() で <tag attrs>children</tag> を出力する。
 *
 * Requirements: 3.2, 3.5, 3.6, 6.5, 6.8
 */
import { HtmlTag } from './html-tag.js';
import type { TagType } from '../tags/tag-type.js';

/**
 * Represents HTML elements with opening and closing tags.
 *
 * PairType is the most common HTML element type, used for elements like
 * `<div>`, `<p>`, `<span>`, etc. These elements have both an opening tag
 * and a closing tag, and can contain child elements.
 *
 * **Rendering Format:**
 * ```html
 * <tag attrs>children</tag>
 * ```
 *
 * @example
 * ```typescript
 * // Using factory functions (recommended)
 * const element = div(
 *   p('Hello'),
 *   span('World')
 * );
 *
 * // Direct instantiation (less common)
 * const custom = new PairType('div');
 * custom.addChild(new TextType('Content'));
 * ```
 *
 * @example
 * With attributes:
 * ```typescript
 * const element = div(
 *   { class: 'container', id: 'main' },
 *   p('Content')
 * );
 * console.log(element.render());
 * // <div class="container" id="main">
 * //   <p>Content</p>
 * // </div>
 * ```
 *
 * @remarks
 * **Preconditions:** tagType must be a valid pair tag (not self-closing)
 *
 * **Postconditions:** `protoRender()` returns `<tag attrs>children</tag>` format
 *
 * **Invariants:** Children order is preserved in insertion order
 */
export class PairType extends HtmlTag {
  /**
   * Creates a new PairType element.
   *
   * @param tagType - The HTML tag type (e.g., 'div', 'p', 'span')
   *
   * @remarks
   * It's recommended to use factory functions like {@link div}, {@link p}, {@link span}
   * instead of direct instantiation.
   */
  constructor(tagType: TagType) {
    super(tagType);
  }
}
