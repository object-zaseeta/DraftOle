/**
 * Task 1.2: HTML属性値のdiscriminated union型、属性キー、InputType、ButtonType
 *
 * Swift版 HtmlAttributeValue / AttributeKeys / InputType / ButtonType に対応する
 * TypeScript型定義とランタイム検証用の定数配列を提供する。
 */

// ============================================================
// HtmlAttributeValue - discriminated union (3 variants)
// ============================================================

/**
 * Represents a boolean HTML attribute (e.g., disabled, checked, hidden).
 *
 * @remarks
 * Boolean attributes render as just the attribute name without a value.
 *
 * @example
 * ```typescript
 * const value: BooleanAttributeValue = { type: 'boolean' };
 * // Renders as: 'disabled' (not 'disabled="true"')
 * ```
 */
export interface BooleanAttributeValue {
  readonly type: 'boolean';
}

/**
 * Represents a key-value HTML attribute (e.g., id="main", class="container").
 *
 * @remarks
 * Key-value attributes render as `key="value"` with the value automatically HTML-escaped.
 *
 * @example
 * ```typescript
 * const value: KeyValueAttributeValue = { type: 'keyValue', value: 'main-content' };
 * // Renders as: 'id="main-content"'
 * ```
 */
export interface KeyValueAttributeValue {
  readonly type: 'keyValue';
  readonly value: string;
}

/**
 * Represents a custom data-* HTML attribute (e.g., data-theme="dark").
 *
 * @remarks
 * Custom attributes render as `data-{name}="{value}"` with the value automatically HTML-escaped.
 *
 * @example
 * ```typescript
 * const value: CustomAttributeValue = { type: 'custom', name: 'theme', value: 'dark' };
 * // Renders as: 'data-theme="dark"'
 * ```
 */
export interface CustomAttributeValue {
  readonly type: 'custom';
  readonly name: string;
  readonly value: string;
}

/**
 * Discriminated union type for all HTML attribute value types.
 *
 * @remarks
 * This type enables type-safe handling of different attribute value types
 * using TypeScript's discriminated union pattern.
 *
 * @example
 * ```typescript
 * function renderValue(attrValue: HtmlAttributeValue): string {
 *   switch (attrValue.type) {
 *     case 'boolean':
 *       return 'attribute-name';
 *     case 'keyValue':
 *       return `attribute-name="${attrValue.value}"`;
 *     case 'custom':
 *       return `data-${attrValue.name}="${attrValue.value}"`;
 *   }
 * }
 * ```
 */
export type HtmlAttributeValue =
  | BooleanAttributeValue
  | KeyValueAttributeValue
  | CustomAttributeValue;

// ── Factory Functions ──

/**
 * Creates a boolean attribute value.
 *
 * @returns A BooleanAttributeValue instance
 *
 * @example
 * ```typescript
 * const disabled = createBooleanValue();
 * // Returns: { type: 'boolean' }
 * ```
 */
export function createBooleanValue(): BooleanAttributeValue {
  return { type: 'boolean' };
}

/**
 * Creates a key-value attribute value.
 *
 * @param value - The attribute value
 * @returns A KeyValueAttributeValue instance
 *
 * @example
 * ```typescript
 * const id = createKeyValueValue('main-content');
 * // Returns: { type: 'keyValue', value: 'main-content' }
 * ```
 */
export function createKeyValueValue(value: string): KeyValueAttributeValue {
  return { type: 'keyValue', value };
}

/**
 * Creates a custom data-* attribute value.
 *
 * @param name - The data attribute name (without 'data-' prefix)
 * @param value - The attribute value
 * @returns A CustomAttributeValue instance
 *
 * @example
 * ```typescript
 * const theme = createCustomValue('theme', 'dark');
 * // Returns: { type: 'custom', name: 'theme', value: 'dark' }
 * ```
 */
export function createCustomValue(name: string, value: string): CustomAttributeValue {
  return { type: 'custom', name, value };
}

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
