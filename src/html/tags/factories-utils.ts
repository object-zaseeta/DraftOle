/**
 * factories-utils.ts
 *
 * 宣言的API共通型と内部ユーティリティ関数。
 * タグファクトリファイル間で共有される。
 *
 * Requirements: 5.2, 5.7, 5.8
 */
import { PairType } from '../elements/pair-type.js';
import { SelfClosingType } from '../elements/self-closing-type.js';
import { TextType } from '../elements/text-type.js';
import { HtmlTag } from '../elements/html-tag.js';
import { HtmlAttribute } from '../attributes/html-attribute.js';
import type { HTMLTagProtocol } from '../protocols/html-tag-protocol.js';
import type { BooleanAttributeKey, KeyValueAttributeKey, AriaAttributeKey } from '../attributes/attribute-keys.js';
import type { TagType } from './tag-type.js';
import type { JsParam } from '../../js/js-param.js';
import { isJsParam, encodeJsParam } from '../../js/js-param.js';

// ============================================================
// 宣言的API共通型 (Task 5.2, Req 5.7, 5.8)
// ============================================================

/**
 * Valid child argument types for tag factory functions.
 *
 * Can be either an {@link HTMLTagProtocol} instance or a string (which will be
 * automatically wrapped in a {@link TextType}).
 *
 * @example
 * ```typescript
 * const element = div(
 *   'Plain text',           // string → TextType
 *   p('Paragraph'),         // HTMLTagProtocol
 *   span('Inline text')     // HTMLTagProtocol
 * );
 * ```
 */
export type ChildArg = HTMLTagProtocol | string;

/**
 * Attribute map for declarative attribute specification.
 *
 * **Value Types:**
 * - `string`: Creates a key-value attribute (e.g., `class="value"`, `id="value"`)
 * - `true`: Creates a boolean attribute (e.g., `checked`, `disabled`)
 * - `false`: Omits the attribute entirely
 *
 * **Special Keys:**
 * - `class`: Normalized through `normalizeClassNames`
 * - `data-*`: Creates custom data attributes
 * - Other keys: Standard HTML attributes
 *
 * @example
 * ```typescript
 * const element = div({
 *   class: 'container active',
 *   id: 'main',
 *   'data-value': '123',
 *   hidden: false  // Omitted from output
 * });
 * ```
 *
 * @example
 * Boolean attributes:
 * ```typescript
 * const checkbox = input({
 *   type: 'checkbox',
 *   checked: true,      // Renders as: checked
 *   disabled: false     // Omitted
 * });
 * ```
 */
export type AttributeMap = Record<string, string | boolean | JsParam>;

// ============================================================
// 内部ユーティリティ (Task 5.2)
// ============================================================

/**
 * Runtime type guard to check if an argument is an {@link AttributeMap}.
 *
 * Considers plain objects (not HtmlTag instances or arrays) as AttributeMap.
 *
 * @param arg - The argument to check
 * @returns `true` if arg is an AttributeMap, `false` otherwise
 *
 * @internal
 */
export function isAttributeMap(arg: unknown): arg is AttributeMap {
  return typeof arg === 'object'
    && arg !== null
    && !(arg instanceof HtmlTag)
    && !Array.isArray(arg);
}

/**
 * Converts an {@link AttributeMap} to an array of {@link HtmlAttribute} instances.
 *
 * **Conversion Rules:**
 * - `class` key: Uses `HtmlAttribute.className()` with normalization
 * - `data-*` keys: Uses `HtmlAttribute.custom()` (strips `data-` prefix)
 * - Boolean `true`: Uses `HtmlAttribute.boolean()` (renders as attribute name only)
 * - Boolean `false`: Omits the attribute
 * - String values: Uses `HtmlAttribute.keyValue()`
 *
 * @param map - The attribute map to convert
 * @returns Array of HtmlAttribute instances
 *
 * @example
 * ```typescript
 * const attrs = parseAttributeMap({
 *   class: 'btn primary',
 *   id: 'submit',
 *   'data-value': '123',
 *   disabled: true,
 *   hidden: false
 * });
 * // Returns: [className('btn primary'), keyValue('id', 'submit'),
 * //           custom('value', '123'), boolean('disabled')]
 * ```
 *
 * @internal
 */
export function parseAttributeMap(map: AttributeMap): HtmlAttribute[] {
  const result: HtmlAttribute[] = [];
  for (const [key, value] of Object.entries(map)) {
    // jsName → data-jsname カスタム属性として保存（jsTemplate が検出・利用する）
    if (key === 'jsName') {
      if (typeof value === 'string') {
        result.push(HtmlAttribute.custom('jsname', value));
      }
      continue;
    }
    if (typeof value === 'boolean') {
      if (value) {
        result.push(HtmlAttribute.boolean(key as BooleanAttributeKey));
      }
      // false → omit
    } else if (isJsParam(value)) {
      // JsParam マーカー → sentinel エンコードして keyValue として保存
      // jsTemplate.render() が sentinel をデコードして変数参照に変換する
      const encoded = encodeJsParam(value);
      result.push(HtmlAttribute.keyValue(key as KeyValueAttributeKey | AriaAttributeKey, encoded));
    } else if (key === 'class') {
      result.push(HtmlAttribute.className(value));
    } else if (key.startsWith('data-')) {
      result.push(HtmlAttribute.custom(key.slice(5), value));
    } else {
      result.push(HtmlAttribute.keyValue(key as KeyValueAttributeKey | AriaAttributeKey, value));
    }
  }
  return result;
}

/**
 * Converts a {@link ChildArg} to an {@link HTMLTagProtocol} instance.
 *
 * String arguments are automatically wrapped in {@link TextType}.
 *
 * @param arg - The child argument (string or HTMLTagProtocol)
 * @returns An HTMLTagProtocol instance
 *
 * @example
 * ```typescript
 * toChild('Hello')           // → new TextType('Hello')
 * toChild(p('World'))        // → p('World') (unchanged)
 * ```
 *
 * @internal
 */
export function toChild(arg: ChildArg): HTMLTagProtocol {
  if (typeof arg === 'string') {
    return new TextType(arg, { escape: true });
  }
  return arg;
}

/**
 * Common implementation for pair tag factory functions.
 *
 * **Argument Patterns:**
 * - No arguments: Returns empty PairType
 * - `ChildArg...`: Returns PairType with children
 * - `AttributeMap, ChildArg...`: Returns PairType with attributes and children
 *
 * @param tagType - The HTML tag type
 * @param args - Factory function arguments (attributes and/or children)
 * @returns A configured PairType instance
 *
 * @example
 * ```typescript
 * makePairTag('div', [])                           // <div></div>
 * makePairTag('div', ['Hello'])                    // <div>Hello</div>
 * makePairTag('div', [{ class: 'btn' }, 'Click'])  // <div class="btn">Click</div>
 * ```
 *
 * @internal
 */
export function makePairTag(tagType: TagType, args: Array<AttributeMap | ChildArg>): PairType {
  const tag = new PairType(tagType);
  if (args.length === 0) return tag;

  let startIndex = 0;
  if (isAttributeMap(args[0])) {
    const attrs = parseAttributeMap(args[0] as AttributeMap);
    for (const attr of attrs) {
      tag.addHtmlAttribute(attr);
    }
    startIndex = 1;
  }

  for (let idx = startIndex; idx < args.length; idx++) {
    tag.addChild(toChild(args[idx] as ChildArg));
  }

  return tag;
}

/**
 * Common implementation for self-closing tag factory functions.
 *
 * **Argument Patterns:**
 * - No arguments: Returns empty SelfClosingType
 * - `AttributeMap`: Returns SelfClosingType with attributes
 *
 * @param tagType - The HTML tag type
 * @param attrs - Optional attribute map
 * @returns A configured SelfClosingType instance
 *
 * @example
 * ```typescript
 * makeSelfClosingTag('br')                              // <br>
 * makeSelfClosingTag('img', { src: 'photo.jpg' })       // <img src="photo.jpg">
 * ```
 *
 * @internal
 */
export function makeSelfClosingTag(tagType: TagType, attrs?: AttributeMap): SelfClosingType {
  const tag = new SelfClosingType(tagType);
  if (attrs) {
    const attributes = parseAttributeMap(attrs);
    for (const attr of attributes) {
      tag.addHtmlAttribute(attr);
    }
  }
  return tag;
}
