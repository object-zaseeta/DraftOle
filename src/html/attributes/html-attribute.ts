/**
 * Task 2.1 + 2.2: HtmlAttribute クラス
 *
 * Boolean・KeyValue・カスタムdata-*・ARIA属性の生成とHTML文字列レンダリング
 * class名の重複除去・正規化、属性値のHTMLエスケープ
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 10.3, 10.4
 */
import type { HtmlAttributeShape } from '../protocols/html-tag-protocol.js';
import type {
  HtmlAttributeValue,
  BooleanAttributeKey,
  KeyValueAttributeKey,
  AriaAttributeKey,
  InputType,
  ButtonType,
} from './attribute-keys.js';
import {
  createBooleanValue,
  createKeyValueValue,
  createCustomValue,
} from './attribute-keys.js';

/**
 * Escapes special HTML characters to prevent XSS attacks.
 *
 * Converts the following characters to their HTML entity equivalents:
 * - `&` → `&amp;`
 * - `<` → `&lt;`
 * - `>` → `&gt;`
 * - `"` → `&quot;`
 * - `'` → `&#39;`
 *
 * @param value - The string to escape
 * @returns The escaped string safe for use in HTML attribute values
 *
 * @remarks
 * This function is automatically called by {@link HtmlAttribute.renderAttribute}
 * to prevent Cross-Site Scripting (XSS) attacks when rendering attribute values.
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * escapeHtml("It's a \"test\"");
 * // Returns: 'It&#39;s a &quot;test&quot;'
 * ```
 *
 * @see {@link HtmlAttribute.renderAttribute} for usage in attribute rendering
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalizes and deduplicates CSS class names.
 *
 * Processes an array of class name strings by:
 * 1. Trimming each entry
 * 2. Splitting on whitespace
 * 3. Removing empty strings
 * 4. Removing duplicates while preserving first occurrence order
 *
 * @param names - Array of class name strings (may contain whitespace-separated classes)
 * @returns A single space-separated string of unique class names
 *
 * @remarks
 * This function is automatically called by {@link HtmlAttribute.className} to ensure
 * class attributes are clean and efficient.
 *
 * @example
 * ```typescript
 * normalizeClassNames(['btn', 'btn-primary']);
 * // Returns: 'btn btn-primary'
 *
 * normalizeClassNames(['btn btn-primary', 'btn-large', 'btn']);
 * // Returns: 'btn btn-primary btn-large' (duplicate 'btn' removed)
 *
 * normalizeClassNames(['  container  ', '', 'flex  gap-4']);
 * // Returns: 'container flex gap-4' (trimmed and empty strings removed)
 * ```
 *
 * @see {@link HtmlAttribute.className} for usage with class attributes
 */
export function normalizeClassNames(names: string[]): string {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of names) {
    const parts = entry.trim().split(/\s+/);
    for (const part of parts) {
      if (part !== '' && !seen.has(part)) {
        seen.add(part);
        result.push(part);
      }
    }
  }
  return result.join(' ');
}

/**
 * Type-safe representation of an HTML attribute with automatic escaping.
 *
 * Provides factory methods for creating boolean, key-value, custom data-*, and ARIA attributes.
 * All attribute values are automatically HTML-escaped when rendered to prevent XSS attacks.
 *
 * @remarks
 * This class implements {@link HtmlAttributeShape} and uses a discriminated union type
 * ({@link HtmlAttributeValue}) to represent different attribute types safely.
 *
 * @example
 * ```typescript
 * // Boolean attribute
 * const disabled = HtmlAttribute.boolean('disabled');
 * disabled.renderAttribute(); // Returns: 'disabled'
 *
 * // Key-value attribute
 * const id = HtmlAttribute.keyValue('id', 'main-content');
 * id.renderAttribute(); // Returns: 'id="main-content"'
 *
 * // Class attribute (with normalization)
 * const classes = HtmlAttribute.className('btn', 'btn-primary btn', 'btn-large');
 * classes.renderAttribute(); // Returns: 'class="btn btn-primary btn-large"'
 *
 * // Custom data attribute
 * const theme = HtmlAttribute.custom('theme', 'dark');
 * theme.renderAttribute(); // Returns: 'data-theme="dark"'
 * ```
 *
 * @see {@link HtmlAttributeValue} for the discriminated union type
 * @see {@link escapeHtml} for XSS prevention details
 */
export class HtmlAttribute implements HtmlAttributeShape {
  /** The attribute key (e.g., 'id', 'class', 'disabled') */
  readonly key: string;

  /** The attribute value (discriminated union of boolean, key-value, or custom) */
  readonly attributeValue: HtmlAttributeValue;

  private constructor(key: string, attributeValue: HtmlAttributeValue) {
    this.key = key;
    this.attributeValue = attributeValue;
  }

  // ── Factory Methods ──

  /**
   * Creates a boolean attribute (e.g., disabled, checked, hidden).
   *
   * @param key - A valid boolean attribute key
   * @returns A new HtmlAttribute instance representing a boolean attribute
   *
   * @example
   * ```typescript
   * const disabled = HtmlAttribute.boolean('disabled');
   * disabled.renderAttribute(); // Returns: 'disabled'
   *
   * const checked = HtmlAttribute.boolean('checked');
   * checked.renderAttribute(); // Returns: 'checked'
   * ```
   *
   * @see {@link BooleanAttributeKey} for all valid boolean attribute keys
   */
  static boolean(key: BooleanAttributeKey): HtmlAttribute {
    return new HtmlAttribute(key, createBooleanValue());
  }

  /**
   * Creates a key-value attribute (e.g., id="main", title="tooltip").
   *
   * @param key - A valid key-value or ARIA attribute key
   * @param value - The attribute value (will be HTML-escaped when rendered)
   * @returns A new HtmlAttribute instance representing a key-value attribute
   *
   * @example
   * ```typescript
   * const id = HtmlAttribute.keyValue('id', 'main-content');
   * id.renderAttribute(); // Returns: 'id="main-content"'
   *
   * const href = HtmlAttribute.keyValue('href', '/path?q=<script>');
   * href.renderAttribute(); // Returns: 'href="/path?q=&lt;script&gt;"'
   * ```
   *
   * @see {@link KeyValueAttributeKey} for all valid key-value attribute keys
   * @see {@link AriaAttributeKey} for all valid ARIA attribute keys
   */
  static keyValue(key: KeyValueAttributeKey | AriaAttributeKey, value: string): HtmlAttribute {
    return new HtmlAttribute(key, createKeyValueValue(value));
  }

  /**
   * Creates a class attribute with automatic normalization and deduplication.
   *
   * @param names - One or more class name strings (may contain whitespace-separated classes)
   * @returns A new HtmlAttribute instance representing a normalized class attribute
   *
   * @remarks
   * Class names are automatically:
   * - Trimmed
   * - Split on whitespace
   * - Deduplicated (first occurrence preserved)
   * - Joined with single spaces
   *
   * @example
   * ```typescript
   * const classes = HtmlAttribute.className('btn', 'btn-primary');
   * classes.renderAttribute(); // Returns: 'class="btn btn-primary"'
   *
   * const normalized = HtmlAttribute.className('btn btn-primary', 'btn-large', 'btn');
   * normalized.renderAttribute(); // Returns: 'class="btn btn-primary btn-large"'
   * ```
   *
   * @see {@link normalizeClassNames} for normalization details
   */
  static className(...names: string[]): HtmlAttribute {
    return new HtmlAttribute('class', createKeyValueValue(normalizeClassNames(names)));
  }

  /**
   * Creates a custom data-* attribute.
   *
   * @param name - The data attribute name (without 'data-' prefix)
   * @param value - The attribute value (will be HTML-escaped when rendered)
   * @returns A new HtmlAttribute instance representing a custom data attribute
   *
   * @example
   * ```typescript
   * const theme = HtmlAttribute.custom('theme', 'dark');
   * theme.renderAttribute(); // Returns: 'data-theme="dark"'
   *
   * const userId = HtmlAttribute.custom('user-id', '12345');
   * userId.renderAttribute(); // Returns: 'data-user-id="12345"'
   * ```
   */
  static custom(name: string, value: string): HtmlAttribute {
    return new HtmlAttribute(`data-${name}`, createCustomValue(name, value));
  }

  /**
   * Creates an aria-label attribute.
   *
   * @param label - The accessible label text
   * @returns A new HtmlAttribute instance for aria-label
   *
   * @example
   * ```typescript
   * const label = HtmlAttribute.ariaLabel('Close dialog');
   * label.renderAttribute(); // Returns: 'aria-label="Close dialog"'
   * ```
   */
  static ariaLabel(label: string): HtmlAttribute {
    return HtmlAttribute.keyValue('aria-label', label);
  }

  /**
   * Creates an aria-hidden attribute.
   *
   * @param hidden - Whether the element should be hidden from assistive technologies
   * @returns A new HtmlAttribute instance for aria-hidden
   *
   * @example
   * ```typescript
   * const hidden = HtmlAttribute.ariaHidden(true);
   * hidden.renderAttribute(); // Returns: 'aria-hidden="true"'
   * ```
   */
  static ariaHidden(hidden: boolean): HtmlAttribute {
    return HtmlAttribute.keyValue('aria-hidden', String(hidden));
  }

  /**
   * Creates an aria-expanded attribute.
   *
   * @param expanded - Whether the element is currently expanded
   * @returns A new HtmlAttribute instance for aria-expanded
   *
   * @example
   * ```typescript
   * const expanded = HtmlAttribute.ariaExpanded(false);
   * expanded.renderAttribute(); // Returns: 'aria-expanded="false"'
   * ```
   */
  static ariaExpanded(expanded: boolean): HtmlAttribute {
    return HtmlAttribute.keyValue('aria-expanded', String(expanded));
  }

  /**
   * Creates a type attribute for input elements.
   *
   * @param type - A valid HTML input type
   * @returns A new HtmlAttribute instance for input type
   *
   * @example
   * ```typescript
   * const emailInput = HtmlAttribute.inputType('email');
   * emailInput.renderAttribute(); // Returns: 'type="email"'
   *
   * const checkbox = HtmlAttribute.inputType('checkbox');
   * checkbox.renderAttribute(); // Returns: 'type="checkbox"'
   * ```
   *
   * @see {@link InputType} for all valid input types
   */
  static inputType(type: InputType): HtmlAttribute {
    return new HtmlAttribute('type', createKeyValueValue(type));
  }

  /**
   * Creates a type attribute for button elements.
   *
   * @param type - A valid HTML button type ('submit', 'reset', or 'button')
   * @returns A new HtmlAttribute instance for button type
   *
   * @example
   * ```typescript
   * const submit = HtmlAttribute.buttonType('submit');
   * submit.renderAttribute(); // Returns: 'type="submit"'
   *
   * const reset = HtmlAttribute.buttonType('reset');
   * reset.renderAttribute(); // Returns: 'type="reset"'
   * ```
   *
   * @see {@link ButtonType} for all valid button types
   */
  static buttonType(type: ButtonType): HtmlAttribute {
    return new HtmlAttribute('type', createKeyValueValue(type));
  }

  // ── Rendering ──

  /**
   * Renders the attribute as an HTML string.
   *
   * @returns The rendered attribute string
   *
   * @remarks
   * - Boolean attributes render as just the key (e.g., 'disabled')
   * - Key-value attributes render as key="value" with escaped values
   * - Custom attributes render as data-name="value" with escaped values
   *
   * All attribute values are automatically HTML-escaped to prevent XSS attacks.
   *
   * @example
   * ```typescript
   * HtmlAttribute.boolean('disabled').renderAttribute();
   * // Returns: 'disabled'
   *
   * HtmlAttribute.keyValue('id', 'main').renderAttribute();
   * // Returns: 'id="main"'
   *
   * HtmlAttribute.custom('theme', 'dark').renderAttribute();
   * // Returns: 'data-theme="dark"'
   * ```
   *
   * @see {@link escapeHtml} for HTML escaping details
   */
  renderAttribute(): string {
    switch (this.attributeValue.type) {
      case 'boolean':
        return this.key;
      case 'keyValue':
        return `${this.key}="${escapeHtml(this.attributeValue.value)}"`;
      case 'custom':
        return `data-${this.attributeValue.name}="${escapeHtml(this.attributeValue.value)}"`;
    }
  }
}
