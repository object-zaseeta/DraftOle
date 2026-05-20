/**
 * Boolean attribute キー定義（26 要素）
 *
 * Swift版 AttributeKeys enum 由来の boolean 属性集合を、type union と
 * ランタイム検証用 const 配列のペアとして提供する。
 */

// ============================================================
// BooleanAttributeKey - 26 keys from Swift AttributeKeys enum
// ============================================================

/**
 * Valid HTML boolean attribute keys.
 *
 * @remarks
 * Boolean attributes are rendered without values (e.g., `disabled`, not `disabled="true"`).
 * This type includes 26 standard HTML boolean attributes.
 *
 * @example
 * ```typescript
 * const key: BooleanAttributeKey = 'disabled';
 * const attr = HtmlAttribute.boolean(key);
 * attr.renderAttribute(); // Returns: 'disabled'
 * ```
 *
 * @see {@link BOOLEAN_ATTRIBUTE_KEYS} for runtime validation array
 */
export type BooleanAttributeKey =
  | 'allowfullscreen'
  | 'async'
  | 'autofocus'
  | 'autoplay'
  | 'checked'
  | 'controls'
  | 'default'
  | 'defer'
  | 'disabled'
  | 'formnovalidate'
  | 'hidden'
  | 'inert'
  | 'ismap'
  | 'itemscope'
  | 'loop'
  | 'multiple'
  | 'muted'
  | 'nomodule'
  | 'novalidate'
  | 'open'
  | 'playsinline'
  | 'readonly'
  | 'required'
  | 'reversed'
  | 'selected'
  | 'truespeed';

/**
 * Array of all valid boolean attribute keys for runtime validation.
 *
 * @remarks
 * Use this for runtime checks, schema validation, or listing available boolean attributes.
 *
 * @example
 * ```typescript
 * function isBooleanAttribute(key: string): key is BooleanAttributeKey {
 *   return BOOLEAN_ATTRIBUTE_KEYS.includes(key as BooleanAttributeKey);
 * }
 * ```
 */
export const BOOLEAN_ATTRIBUTE_KEYS: readonly BooleanAttributeKey[] = [
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
  'truespeed',
] as const;
