/**
 * Form 系 type 属性値定義（input type 22 種 + button type 3 種）
 *
 * いずれも form 系列の小型データであり、相互依存のないペアとして同居させる。
 * type union とランタイム検証用 const 配列をそれぞれ提供する。
 */

// ============================================================
// InputType - 22 HTML input types
// ============================================================

/**
 * Valid HTML input element type attribute values.
 *
 * @remarks
 * This type includes all 22 standard HTML5 input types.
 * Use with {@link HtmlAttribute.inputType} for type-safe input type attributes.
 *
 * @example
 * ```typescript
 * const emailType: InputType = 'email';
 * const attr = HtmlAttribute.inputType(emailType);
 * attr.renderAttribute(); // Returns: 'type="email"'
 *
 * // In an input builder
 * new InputAttributeBuilder()
 *   .setInputType('password')
 *   .setPlaceholder('Enter password')
 *   .build();
 * ```
 *
 * @see {@link INPUT_TYPES} for runtime validation array
 * @see {@link HtmlAttribute.inputType} for creating input type attributes
 */
export type InputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'color'
  | 'range'
  | 'file'
  | 'checkbox'
  | 'radio'
  | 'hidden'
  | 'submit'
  | 'reset'
  | 'button'
  | 'image';

/**
 * Array of all valid HTML input types for runtime validation.
 *
 * @remarks
 * Use this for runtime checks, schema validation, or listing available input types.
 *
 * @example
 * ```typescript
 * function isValidInputType(type: string): type is InputType {
 *   return INPUT_TYPES.includes(type as InputType);
 * }
 *
 * // Generate form field based on type
 * INPUT_TYPES.forEach(type => {
 *   console.log(`<input type="${type}">`);
 * });
 * ```
 */
export const INPUT_TYPES: readonly InputType[] = [
  'text',
  'password',
  'email',
  'number',
  'tel',
  'url',
  'search',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
  'color',
  'range',
  'file',
  'checkbox',
  'radio',
  'hidden',
  'submit',
  'reset',
  'button',
  'image',
] as const;

// ============================================================
// ButtonType - 3 button types
// ============================================================

/**
 * Valid HTML button element type attribute values.
 *
 * @remarks
 * This type includes the 3 standard HTML button types:
 * - `submit` - Submits the form (default behavior)
 * - `reset` - Resets form fields to their initial values
 * - `button` - No default behavior (for custom JavaScript)
 *
 * @example
 * ```typescript
 * const submitType: ButtonType = 'submit';
 * const attr = HtmlAttribute.buttonType(submitType);
 * attr.renderAttribute(); // Returns: 'type="submit"'
 *
 * // In a button builder
 * new ButtonAttributeBuilder()
 *   .setButtonType('button')
 *   .setId('close-dialog')
 *   .build();
 * ```
 *
 * @see {@link BUTTON_TYPES} for runtime validation array
 * @see {@link HtmlAttribute.buttonType} for creating button type attributes
 */
export type ButtonType = 'submit' | 'reset' | 'button';

/**
 * Array of all valid HTML button types for runtime validation.
 *
 * @remarks
 * Use this for runtime checks, schema validation, or listing available button types.
 *
 * @example
 * ```typescript
 * function isValidButtonType(type: string): type is ButtonType {
 *   return BUTTON_TYPES.includes(type as ButtonType);
 * }
 *
 * // Generate buttons for all types
 * BUTTON_TYPES.forEach(type => {
 *   console.log(`<button type="${type}">Click me</button>`);
 * });
 * ```
 */
export const BUTTON_TYPES: readonly ButtonType[] = [
  'submit',
  'reset',
  'button',
] as const;
