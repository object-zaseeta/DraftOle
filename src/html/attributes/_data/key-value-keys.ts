/**
 * Key-value attribute キー定義（73 要素）
 *
 * Swift版 AttributeKeys enum 由来の key-value 属性集合を、type union と
 * ランタイム検証用 const 配列のペアとして提供する。
 */

// ============================================================
// KeyValueAttributeKey - from Swift AttributeKeys enum
// ============================================================

/**
 * Valid HTML key-value attribute keys.
 *
 * @remarks
 * Key-value attributes are rendered as `key="value"` with automatic HTML escaping.
 * This type includes 73 standard HTML key-value attributes.
 *
 * @example
 * ```typescript
 * const key: KeyValueAttributeKey = 'id';
 * const attr = HtmlAttribute.keyValue(key, 'main-content');
 * attr.renderAttribute(); // Returns: 'id="main-content"'
 * ```
 *
 * @see {@link KEY_VALUE_ATTRIBUTE_KEYS} for runtime validation array
 */
export type KeyValueAttributeKey =
  | 'accept'
  | 'accept-charset'
  | 'accesskey'
  | 'action'
  | 'alt'
  | 'as'
  | 'autocomplete'
  | 'charset'
  | 'cite'
  | 'class'
  | 'cols'
  | 'colspan'
  | 'content'
  | 'contenteditable'
  | 'coords'
  | 'crossorigin'
  | 'data'
  | 'datetime'
  | 'decoding'
  | 'dir'
  | 'download'
  | 'draggable'
  | 'enctype'
  | 'for'
  | 'formaction'
  | 'headers'
  | 'height'
  | 'href'
  | 'hreflang'
  | 'id'
  | 'inputmode'
  | 'integrity'
  | 'label'
  | 'lang'
  | 'list'
  | 'loading'
  | 'max'
  | 'maxlength'
  | 'media'
  | 'method'
  | 'min'
  | 'minlength'
  | 'name'
  | 'pattern'
  | 'placeholder'
  | 'poster'
  | 'preload'
  | 'rel'
  | 'referrerpolicy'
  | 'role'
  | 'rows'
  | 'rowspan'
  | 'sandbox'
  | 'scope'
  | 'shape'
  | 'size'
  | 'sizes'
  | 'slot'
  | 'src'
  | 'srcdoc'
  | 'srclang'
  | 'srcset'
  | 'step'
  | 'style'
  | 'tabindex'
  | 'target'
  | 'title'
  | 'translate'
  | 'type'
  | 'usemap'
  | 'value'
  | 'width'
  | 'wrap';

/**
 * Array of all valid key-value attribute keys for runtime validation.
 *
 * @remarks
 * Use this for runtime checks, schema validation, or listing available key-value attributes.
 *
 * @example
 * ```typescript
 * function isKeyValueAttribute(key: string): key is KeyValueAttributeKey {
 *   return KEY_VALUE_ATTRIBUTE_KEYS.includes(key as KeyValueAttributeKey);
 * }
 * ```
 */
export const KEY_VALUE_ATTRIBUTE_KEYS: readonly KeyValueAttributeKey[] = [
  'accept',
  'accept-charset',
  'accesskey',
  'action',
  'alt',
  'as',
  'autocomplete',
  'charset',
  'cite',
  'class',
  'cols',
  'colspan',
  'content',
  'contenteditable',
  'coords',
  'crossorigin',
  'data',
  'datetime',
  'decoding',
  'dir',
  'download',
  'draggable',
  'enctype',
  'for',
  'formaction',
  'headers',
  'height',
  'href',
  'hreflang',
  'id',
  'inputmode',
  'integrity',
  'label',
  'lang',
  'list',
  'loading',
  'max',
  'maxlength',
  'media',
  'method',
  'min',
  'minlength',
  'name',
  'pattern',
  'placeholder',
  'poster',
  'preload',
  'rel',
  'referrerpolicy',
  'role',
  'rows',
  'rowspan',
  'sandbox',
  'scope',
  'shape',
  'size',
  'sizes',
  'slot',
  'src',
  'srcdoc',
  'srclang',
  'srcset',
  'step',
  'style',
  'tabindex',
  'target',
  'title',
  'translate',
  'type',
  'usemap',
  'value',
  'width',
  'wrap',
] as const;
