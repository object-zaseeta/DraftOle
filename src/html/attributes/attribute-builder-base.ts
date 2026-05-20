/**
 * Task 6.1: BaseAttributeBuilder
 *
 * BaseAttributeBuilder: 共通属性（id, title, lang, role, tabindex, hidden, custom, ARIA）の設定と
 * class追加の4パターン（可変長引数、配列、条件付き、辞書Toggle形式）を提供する。
 *
 * Requirements: 7.1, 7.2
 */
import type { AriaAttributeKey, KeyValueAttributeKey } from './attribute-keys.js';
import { HtmlAttribute } from './html-attribute.js';
import type { AttributeBuilderProtocol } from '../protocols/attribute-builder-protocol.js';

/**
 * Base attribute builder providing common HTML attributes and fluent API.
 *
 * @remarks
 * This class implements {@link AttributeBuilderProtocol} and provides:
 * - Common attributes (id, title, lang, role, tabindex, hidden)
 * - ARIA attributes (aria-label, aria-hidden, aria-expanded)
 * - Custom data-* attributes
 * - Four class management patterns (variadic, array, conditional, toggle)
 * - Automatic class name normalization and deduplication
 *
 * Class names are accumulated internally and merged into a single normalized
 * class attribute when {@link build} is called.
 *
 * @example
 * Basic usage
 * ```typescript
 * const attrs = new BaseAttributeBuilder()
 *   .setId('main-content')
 *   .addClass('container', 'mx-auto')
 *   .setAriaLabel('Main content area')
 *   .build();
 * ```
 *
 * @example
 * Conditional classes
 * ```typescript
 * const isActive = true;
 * const attrs = new BaseAttributeBuilder()
 *   .addClass('btn')
 *   .addClassWhen('btn-active', isActive)
 *   .addClassesToggle({
 *     'btn-primary': isPrimary,
 *     'btn-disabled': isDisabled
 *   })
 *   .build();
 * ```
 *
 * @example
 * Custom data attributes
 * ```typescript
 * const attrs = new BaseAttributeBuilder()
 *   .setCustomAttribute('theme', 'dark')
 *   .setCustomAttribute('user-id', '12345')
 *   .build();
 * // Produces: data-theme="dark" data-user-id="12345"
 * ```
 */
export class BaseAttributeBuilder implements AttributeBuilderProtocol {
  /** Accumulated attributes (excluding class, which is handled separately) */
  protected _attributes: HtmlAttribute[] = [];

  /** Accumulated class names (deduplicated and normalized on build) */
  protected _classNames: string[] = [];

  // ── Key-Value Helper ──

  /**
   * Adds a key-value HTML attribute.
   *
   * @param key - The attribute name
   * @param value - The attribute value
   * @returns This builder for method chaining
   *
   * @remarks
   * This helper centralizes the keyValue attribute creation pattern.
   * Subclasses may also use this helper for their own key-value attributes.
   */
  protected addKeyValue(key: KeyValueAttributeKey | AriaAttributeKey, value: string | number): this {
    this._attributes.push(HtmlAttribute.keyValue(key, String(value)));
    return this;
  }

  // ── Common Attributes ──

  /**
   * Sets the id attribute.
   *
   * @param id - The element ID
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setId('main-content');
   * // Produces: id="main-content"
   * ```
   */
  setId(id: string): this {
    return this.addKeyValue('id', id);
  }

  /**
   * Sets the title attribute (tooltip text).
   *
   * @param title - The tooltip text
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setTitle('Click to expand');
   * // Produces: title="Click to expand"
   * ```
   */
  setTitle(title: string): this {
    return this.addKeyValue('title', title);
  }

  /**
   * Sets the lang attribute (language code).
   *
   * @param lang - The language code (e.g., 'en', 'ja', 'fr')
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setLang('ja');
   * // Produces: lang="ja"
   * ```
   */
  setLang(lang: string): this {
    return this.addKeyValue('lang', lang);
  }

  /**
   * Sets the role attribute (ARIA role).
   *
   * @param role - The ARIA role (e.g., 'button', 'navigation')
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setRole('navigation');
   * // Produces: role="navigation"
   * ```
   */
  setRole(role: string): this {
    return this.addKeyValue('role', role);
  }

  /**
   * Sets the tabindex attribute.
   *
   * @param index - The tab order index (-1 for programmatically focusable, 0 for natural order)
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setTabindex(0);  // Natural tab order
   * builder.setTabindex(-1); // Programmatically focusable only
   * ```
   */
  setTabindex(index: number): this {
    return this.addKeyValue('tabindex', index);
  }

  /**
   * Sets the hidden boolean attribute.
   *
   * @param hidden - If true, adds the hidden attribute
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setHidden(true);  // Produces: hidden
   * builder.setHidden(false); // No attribute added
   * ```
   */
  setHidden(hidden: boolean): this {
    if (hidden) {
      this._attributes.push(HtmlAttribute.boolean('hidden'));
    }
    return this;
  }

  // ── Custom Attributes ──

  /**
   * Sets a custom data-* attribute.
   *
   * @param name - The data attribute name (without 'data-' prefix)
   * @param value - The attribute value
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setCustomAttribute('theme', 'dark');
   * // Produces: data-theme="dark"
   *
   * builder.setCustomAttribute('user-id', '12345');
   * // Produces: data-user-id="12345"
   * ```
   */
  setCustomAttribute(name: string, value: string): this {
    this._attributes.push(HtmlAttribute.custom(name, value));
    return this;
  }

  // ── ARIA Attributes ──

  /**
   * Sets the aria-label attribute.
   *
   * @param label - The accessible label text
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setAriaLabel('Close dialog');
   * // Produces: aria-label="Close dialog"
   * ```
   */
  setAriaLabel(label: string): this {
    this._attributes.push(HtmlAttribute.ariaLabel(label));
    return this;
  }

  /**
   * Sets the aria-hidden attribute.
   *
   * @param hidden - Whether the element should be hidden from assistive technologies
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setAriaHidden(true);
   * // Produces: aria-hidden="true"
   * ```
   */
  setAriaHidden(hidden: boolean): this {
    this._attributes.push(HtmlAttribute.ariaHidden(hidden));
    return this;
  }

  /**
   * Sets the aria-expanded attribute.
   *
   * @param expanded - Whether the element is currently expanded
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setAriaExpanded(false);
   * // Produces: aria-expanded="false"
   * ```
   */
  setAriaExpanded(expanded: boolean): this {
    this._attributes.push(HtmlAttribute.ariaExpanded(expanded));
    return this;
  }

  // ── Class Management (4 Patterns) ──

  /**
   * Adds one or more class names (variadic pattern).
   *
   * @param classNames - One or more class name strings
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.addClass('btn', 'btn-primary', 'btn-large');
   * // Accumulates: ['btn', 'btn-primary', 'btn-large']
   * ```
   */
  addClass(...classNames: string[]): this {
    this._classNames.push(...classNames);
    return this;
  }

  /**
   * Adds class names from an array (array pattern).
   *
   * @param classNames - Array of class name strings
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * const classes = ['container', 'mx-auto', 'px-4'];
   * builder.addClasses(classes);
   * ```
   */
  addClasses(classNames: string[]): this {
    this._classNames.push(...classNames);
    return this;
  }

  /**
   * Conditionally adds a class name (conditional pattern).
   *
   * @param className - The class name to add
   * @param condition - Only adds the class if this is true
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * const isActive = true;
   * builder.addClassWhen('active', isActive);  // Adds 'active'
   * builder.addClassWhen('disabled', false);   // Doesn't add
   * ```
   */
  addClassWhen(className: string, condition: boolean): this {
    if (condition) {
      this._classNames.push(className);
    }
    return this;
  }

  /**
   * Adds classes from a toggle map (toggle pattern).
   *
   * @param classMap - Object mapping class names to boolean flags
   * @returns This builder for method chaining
   *
   * @remarks
   * Only class names with `true` values are added.
   *
   * @example
   * ```typescript
   * builder.addClassesToggle({
   *   'btn-primary': isPrimary,
   *   'btn-disabled': isDisabled,
   *   'btn-large': isLarge
   * });
   * // Adds only classes where the value is true
   * ```
   */
  addClassesToggle(classMap: Record<string, boolean>): this {
    for (const [name, enabled] of Object.entries(classMap)) {
      if (enabled) {
        this._classNames.push(name);
      }
    }
    return this;
  }

  // ── Build ──

  /**
   * Builds and returns the accumulated attribute array.
   *
   * @returns Array of HtmlAttribute instances
   *
   * @remarks
   * If any class names were added, they are normalized (trimmed, deduplicated)
   * and merged into a single class attribute using {@link normalizeClassNames}.
   *
   * @example
   * ```typescript
   * const attrs = new BaseAttributeBuilder()
   *   .setId('main')
   *   .addClass('btn', 'btn-primary', 'btn')
   *   .build();
   * // Returns: [
   * //   HtmlAttribute { key: 'id', ... },
   * //   HtmlAttribute { key: 'class', value: 'btn btn-primary' }
   * // ]
   * ```
   */
  build(): HtmlAttribute[] {
    const result = [...this._attributes];

    if (this._classNames.length > 0) {
      // HtmlAttribute.className calls normalizeClassNames internally
      // to deduplicate, trim, and remove empty strings
      result.push(HtmlAttribute.className(...this._classNames));
    }

    return result;
  }
}
