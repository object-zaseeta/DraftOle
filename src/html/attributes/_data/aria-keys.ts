/**
 * ARIA attribute キー定義（7 要素）
 *
 * Accessible Rich Internet Applications 仕様に基づく ARIA 属性集合を、
 * type union とランタイム検証用 const 配列のペアとして提供する。
 */

// ============================================================
// AriaAttributeKey - 7 ARIA attributes
// ============================================================

/**
 * Valid ARIA (Accessible Rich Internet Applications) attribute keys.
 *
 * @remarks
 * ARIA attributes enhance accessibility for assistive technologies.
 * This type includes 7 commonly used ARIA attributes.
 *
 * @example
 * ```typescript
 * const key: AriaAttributeKey = 'aria-label';
 * const attr = HtmlAttribute.keyValue(key, 'Close dialog');
 * attr.renderAttribute(); // Returns: 'aria-label="Close dialog"'
 * ```
 *
 * @see {@link ARIA_ATTRIBUTE_KEYS} for runtime validation array
 * @see {@link https://www.w3.org/WAI/ARIA/apg/} for ARIA best practices
 */
export type AriaAttributeKey =
  | 'aria-label'
  | 'aria-hidden'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-live'
  | 'aria-describedby'
  | 'aria-role';

/**
 * Array of all valid ARIA attribute keys for runtime validation.
 *
 * @remarks
 * Use this for runtime checks, schema validation, or listing available ARIA attributes.
 *
 * @example
 * ```typescript
 * function isAriaAttribute(key: string): key is AriaAttributeKey {
 *   return ARIA_ATTRIBUTE_KEYS.includes(key as AriaAttributeKey);
 * }
 * ```
 */
export const ARIA_ATTRIBUTE_KEYS: readonly AriaAttributeKey[] = [
  'aria-label',
  'aria-hidden',
  'aria-expanded',
  'aria-controls',
  'aria-live',
  'aria-describedby',
  'aria-role',
] as const;
