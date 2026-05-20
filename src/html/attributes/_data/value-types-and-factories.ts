/**
 * HTML属性値のdiscriminated union型と factory 関数
 *
 * Swift版 HtmlAttributeValue に対応する TypeScript 型定義と、
 * 各 variant の安全な生成を支援する factory 関数群を提供する。
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
