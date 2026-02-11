/**
 * Task 6.1 + 6.2: AttributeBuilder
 *
 * BaseAttributeBuilder: 共通属性（id, title, lang, role, tabindex, hidden, custom, ARIA）の設定と
 * class追加の4パターン（可変長引数、配列、条件付き、辞書Toggle形式）を提供する。
 *
 * 専用属性ビルダー（Task 6.2）:
 * - FormAttributeBuilder: action, method, enctype
 * - InputAttributeBuilder: type, placeholder, required, pattern, minLength, maxLength
 * - ImageAttributeBuilder: src, alt, width, height, loading
 * - LinkAttributeBuilder: href, rel, type, media
 * - ButtonAttributeBuilder: buttonType
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */
import type { AttributeBuilderProtocol } from '../protocols/attribute-builder-protocol.js';
import type { InputType, ButtonType } from './attribute-keys.js';
import { HtmlAttribute } from './html-attribute.js';

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
    this._attributes.push(HtmlAttribute.keyValue('id', id));
    return this;
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
    this._attributes.push(HtmlAttribute.keyValue('title', title));
    return this;
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
    this._attributes.push(HtmlAttribute.keyValue('lang', lang));
    return this;
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
    this._attributes.push(HtmlAttribute.keyValue('role', role));
    return this;
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
    this._attributes.push(HtmlAttribute.keyValue('tabindex', String(index)));
    return this;
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

// ============================================================
// FormAttributeBuilder (Task 6.2, Req 7.3)
// ============================================================

/**
 * Specialized attribute builder for HTML form elements.
 *
 * @remarks
 * Extends {@link BaseAttributeBuilder} with form-specific attributes:
 * - action - Form submission URL
 * - method - HTTP method (GET or POST)
 * - enctype - Form data encoding type
 *
 * All common attributes from the base builder are also available.
 *
 * @example
 * ```typescript
 * const formAttrs = new FormAttributeBuilder()
 *   .setAction('/api/submit')
 *   .setMethod('post')
 *   .setEnctype('multipart/form-data')
 *   .setId('contact-form')
 *   .addClass('form', 'form-vertical')
 *   .build();
 * ```
 *
 * @see {@link BaseAttributeBuilder} for common attribute methods
 */
export class FormAttributeBuilder extends BaseAttributeBuilder {
  /**
   * Sets the action attribute (form submission URL).
   *
   * @param action - The URL where the form data will be sent
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setAction('/api/submit');
   * // Produces: action="/api/submit"
   * ```
   */
  setAction(action: string): this {
    this._attributes.push(HtmlAttribute.keyValue('action', action));
    return this;
  }

  /**
   * Sets the method attribute (HTTP method).
   *
   * @param method - The HTTP method ('get' or 'post')
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setMethod('post');
   * // Produces: method="post"
   * ```
   */
  setMethod(method: 'get' | 'post'): this {
    this._attributes.push(HtmlAttribute.keyValue('method', method));
    return this;
  }

  /**
   * Sets the enctype attribute (encoding type).
   *
   * @param enctype - The encoding type (e.g., 'multipart/form-data', 'application/x-www-form-urlencoded')
   * @returns This builder for method chaining
   *
   * @remarks
   * Common values:
   * - 'application/x-www-form-urlencoded' (default)
   * - 'multipart/form-data' (for file uploads)
   * - 'text/plain'
   *
   * @example
   * ```typescript
   * builder.setEnctype('multipart/form-data');
   * // Produces: enctype="multipart/form-data"
   * ```
   */
  setEnctype(enctype: string): this {
    this._attributes.push(HtmlAttribute.keyValue('enctype', enctype));
    return this;
  }
}

// ============================================================
// InputAttributeBuilder (Task 6.2, Req 7.4)
// ============================================================

/**
 * Specialized attribute builder for HTML input elements.
 *
 * @remarks
 * Extends {@link BaseAttributeBuilder} with input-specific attributes:
 * - type - Input type (text, email, password, etc.)
 * - placeholder - Placeholder text
 * - required - Required field flag
 * - pattern - Validation pattern (regex)
 * - minlength/maxlength - Length constraints
 *
 * All common attributes from the base builder are also available.
 *
 * @example
 * ```typescript
 * const emailInput = new InputAttributeBuilder()
 *   .setInputType('email')
 *   .setPlaceholder('Enter your email')
 *   .setRequired(true)
 *   .setId('email-field')
 *   .addClass('input', 'input-primary')
 *   .build();
 * ```
 *
 * @example
 * Password input with validation
 * ```typescript
 * const passwordInput = new InputAttributeBuilder()
 *   .setInputType('password')
 *   .setPlaceholder('Enter password')
 *   .setRequired(true)
 *   .setMinLength(8)
 *   .setPattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$')
 *   .build();
 * ```
 *
 * @see {@link BaseAttributeBuilder} for common attribute methods
 * @see {@link InputType} for all valid input types
 */
export class InputAttributeBuilder extends BaseAttributeBuilder {
  /**
   * Sets the type attribute for the input element.
   *
   * @param type - A valid HTML input type
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setInputType('email');    // Produces: type="email"
   * builder.setInputType('password'); // Produces: type="password"
   * builder.setInputType('checkbox'); // Produces: type="checkbox"
   * ```
   *
   * @see {@link InputType} for all valid types
   */
  setInputType(type: InputType): this {
    this._attributes.push(HtmlAttribute.inputType(type));
    return this;
  }

  /**
   * Sets the placeholder attribute.
   *
   * @param placeholder - The placeholder text
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setPlaceholder('Enter your email address');
   * // Produces: placeholder="Enter your email address"
   * ```
   */
  setPlaceholder(placeholder: string): this {
    this._attributes.push(HtmlAttribute.keyValue('placeholder', placeholder));
    return this;
  }

  /**
   * Sets the required boolean attribute.
   *
   * @param required - If true, adds the required attribute
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setRequired(true);  // Produces: required
   * builder.setRequired(false); // No attribute added
   * ```
   */
  setRequired(required: boolean): this {
    if (required) {
      this._attributes.push(HtmlAttribute.boolean('required'));
    }
    return this;
  }

  /**
   * Sets the pattern attribute (validation regex).
   *
   * @param pattern - A regular expression pattern for validation
   * @returns This builder for method chaining
   *
   * @remarks
   * The pattern is matched against the entire input value (implicit ^ and $).
   *
   * @example
   * ```typescript
   * // Require at least one uppercase, one lowercase, one digit
   * builder.setPattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$');
   *
   * // Require specific format
   * builder.setPattern('[0-9]{3}-[0-9]{4}'); // Matches: 123-4567
   * ```
   */
  setPattern(pattern: string): this {
    this._attributes.push(HtmlAttribute.keyValue('pattern', pattern));
    return this;
  }

  /**
   * Sets the minlength attribute.
   *
   * @param length - Minimum number of characters required
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setMinLength(8);
   * // Produces: minlength="8"
   * ```
   */
  setMinLength(length: number): this {
    this._attributes.push(HtmlAttribute.keyValue('minlength', String(length)));
    return this;
  }

  /**
   * Sets the maxlength attribute.
   *
   * @param length - Maximum number of characters allowed
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setMaxLength(100);
   * // Produces: maxlength="100"
   * ```
   */
  setMaxLength(length: number): this {
    this._attributes.push(HtmlAttribute.keyValue('maxlength', String(length)));
    return this;
  }
}

// ============================================================
// ImageAttributeBuilder (Task 6.2, Req 7.5)
// ============================================================

/**
 * Specialized attribute builder for HTML img elements.
 *
 * @remarks
 * Extends {@link BaseAttributeBuilder} with image-specific attributes:
 * - src - Image source URL
 * - alt - Alternative text for accessibility
 * - width/height - Image dimensions
 * - loading - Lazy loading strategy
 *
 * All common attributes from the base builder are also available.
 *
 * @example
 * ```typescript
 * const imgAttrs = new ImageAttributeBuilder()
 *   .setSrc('/images/hero.jpg')
 *   .setAlt('Hero banner image')
 *   .setWidth(800)
 *   .setHeight(600)
 *   .setLoading('lazy')
 *   .addClass('img-responsive')
 *   .build();
 * ```
 *
 * @see {@link BaseAttributeBuilder} for common attribute methods
 */
export class ImageAttributeBuilder extends BaseAttributeBuilder {
  /**
   * Sets the src attribute (image source URL).
   *
   * @param src - The URL of the image
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setSrc('/images/logo.png');
   * // Produces: src="/images/logo.png"
   *
   * builder.setSrc('https://example.com/photo.jpg');
   * // Produces: src="https://example.com/photo.jpg"
   * ```
   */
  setSrc(src: string): this {
    this._attributes.push(HtmlAttribute.keyValue('src', src));
    return this;
  }

  /**
   * Sets the alt attribute (alternative text).
   *
   * @param alt - Descriptive text for the image (important for accessibility)
   * @returns This builder for method chaining
   *
   * @remarks
   * The alt attribute is crucial for accessibility. It should:
   * - Describe the image content for screen readers
   * - Be empty ("") for decorative images
   * - Not include "image of" or "picture of"
   *
   * @example
   * ```typescript
   * builder.setAlt('Company logo');
   * // Produces: alt="Company logo"
   *
   * builder.setAlt(''); // Decorative image
   * // Produces: alt=""
   * ```
   */
  setAlt(alt: string): this {
    this._attributes.push(HtmlAttribute.keyValue('alt', alt));
    return this;
  }

  /**
   * Sets the width attribute.
   *
   * @param width - Image width in pixels (number or string)
   * @returns This builder for method chaining
   *
   * @remarks
   * Setting explicit width and height helps prevent layout shift during page load.
   *
   * @example
   * ```typescript
   * builder.setWidth(800);    // Produces: width="800"
   * builder.setWidth('100%'); // Produces: width="100%"
   * ```
   */
  setWidth(width: number | string): this {
    this._attributes.push(HtmlAttribute.keyValue('width', String(width)));
    return this;
  }

  /**
   * Sets the height attribute.
   *
   * @param height - Image height in pixels (number or string)
   * @returns This builder for method chaining
   *
   * @remarks
   * Setting explicit width and height helps prevent layout shift during page load.
   *
   * @example
   * ```typescript
   * builder.setHeight(600);   // Produces: height="600"
   * builder.setHeight('auto'); // Produces: height="auto"
   * ```
   */
  setHeight(height: number | string): this {
    this._attributes.push(HtmlAttribute.keyValue('height', String(height)));
    return this;
  }

  /**
   * Sets the loading attribute (lazy loading strategy).
   *
   * @param loading - Loading strategy ('lazy' or 'eager')
   * @returns This builder for method chaining
   *
   * @remarks
   * - 'lazy' - Defer loading until the image is near the viewport (improves performance)
   * - 'eager' - Load immediately (default browser behavior)
   *
   * @example
   * ```typescript
   * builder.setLoading('lazy');
   * // Produces: loading="lazy"
   * // Good for below-the-fold images
   *
   * builder.setLoading('eager');
   * // Produces: loading="eager"
   * // Good for above-the-fold images
   * ```
   */
  setLoading(loading: 'lazy' | 'eager'): this {
    this._attributes.push(HtmlAttribute.keyValue('loading', loading));
    return this;
  }
}

// ============================================================
// LinkAttributeBuilder (Task 6.2, Req 7.5)
// ============================================================

/**
 * Specialized attribute builder for HTML link and anchor (a) elements.
 *
 * @remarks
 * Extends {@link BaseAttributeBuilder} with link-specific attributes:
 * - href - Link destination URL
 * - rel - Relationship between current document and linked resource
 * - type - MIME type of linked resource
 * - media - Media query for when the link applies
 *
 * All common attributes from the base builder are also available.
 *
 * @example
 * Link element (stylesheet)
 * ```typescript
 * const stylesheetAttrs = new LinkAttributeBuilder()
 *   .setHref('/styles/main.css')
 *   .setRel('stylesheet')
 *   .setType('text/css')
 *   .build();
 * ```
 *
 * @example
 * Anchor element (hyperlink)
 * ```typescript
 * const linkAttrs = new LinkAttributeBuilder()
 *   .setHref('https://example.com')
 *   .setRel('noopener noreferrer')
 *   .setId('external-link')
 *   .addClass('link', 'link-external')
 *   .build();
 * ```
 *
 * @see {@link BaseAttributeBuilder} for common attribute methods
 */
export class LinkAttributeBuilder extends BaseAttributeBuilder {
  /**
   * Sets the href attribute (link destination).
   *
   * @param href - The URL of the linked resource
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setHref('/about');
   * // Produces: href="/about"
   *
   * builder.setHref('https://example.com');
   * // Produces: href="https://example.com"
   *
   * builder.setHref('#section-2');
   * // Produces: href="#section-2"
   * ```
   */
  setHref(href: string): this {
    this._attributes.push(HtmlAttribute.keyValue('href', href));
    return this;
  }

  /**
   * Sets the rel attribute (relationship).
   *
   * @param rel - The relationship type(s) (space-separated)
   * @returns This builder for method chaining
   *
   * @remarks
   * Common values:
   * - 'stylesheet' - CSS stylesheet
   * - 'icon' - Favicon
   * - 'noopener' - Prevents window.opener access (security)
   * - 'noreferrer' - Prevents referer header
   * - 'nofollow' - Search engine hint
   *
   * @example
   * ```typescript
   * builder.setRel('stylesheet');
   * // Produces: rel="stylesheet"
   *
   * builder.setRel('noopener noreferrer');
   * // Produces: rel="noopener noreferrer"
   * ```
   */
  setRel(rel: string): this {
    this._attributes.push(HtmlAttribute.keyValue('rel', rel));
    return this;
  }

  /**
   * Sets the type attribute (MIME type).
   *
   * @param type - The MIME type of the linked resource
   * @returns This builder for method chaining
   *
   * @example
   * ```typescript
   * builder.setType('text/css');
   * // Produces: type="text/css"
   *
   * builder.setType('application/rss+xml');
   * // Produces: type="application/rss+xml"
   * ```
   */
  setType(type: string): this {
    this._attributes.push(HtmlAttribute.keyValue('type', type));
    return this;
  }

  /**
   * Sets the media attribute (media query).
   *
   * @param media - CSS media query for when the link applies
   * @returns This builder for method chaining
   *
   * @remarks
   * Used primarily with `<link>` elements to conditionally load resources.
   *
   * @example
   * ```typescript
   * builder.setMedia('screen and (min-width: 768px)');
   * // Produces: media="screen and (min-width: 768px)"
   *
   * builder.setMedia('print');
   * // Produces: media="print"
   * ```
   */
  setMedia(media: string): this {
    this._attributes.push(HtmlAttribute.keyValue('media', media));
    return this;
  }
}

// ============================================================
// ButtonAttributeBuilder (Task 6.2, Req 7.6)
// ============================================================

/**
 * Specialized attribute builder for HTML button elements.
 *
 * @remarks
 * Extends {@link BaseAttributeBuilder} with button-specific attributes:
 * - type - Button type (submit, reset, or button)
 *
 * All common attributes from the base builder are also available.
 *
 * @example
 * Submit button
 * ```typescript
 * const submitAttrs = new ButtonAttributeBuilder()
 *   .setButtonType('submit')
 *   .setId('submit-btn')
 *   .addClass('btn', 'btn-primary')
 *   .build();
 * ```
 *
 * @example
 * Custom button with ARIA
 * ```typescript
 * const closeAttrs = new ButtonAttributeBuilder()
 *   .setButtonType('button')
 *   .setAriaLabel('Close dialog')
 *   .addClass('btn-close')
 *   .build();
 * ```
 *
 * @see {@link BaseAttributeBuilder} for common attribute methods
 * @see {@link ButtonType} for all valid button types
 */
export class ButtonAttributeBuilder extends BaseAttributeBuilder {
  /**
   * Sets the type attribute for the button element.
   *
   * @param type - The button type ('submit', 'reset', or 'button')
   * @returns This builder for method chaining
   *
   * @remarks
   * - 'submit' - Submits the form (default if inside a form)
   * - 'reset' - Resets form fields to their initial values
   * - 'button' - No default behavior (use for custom JavaScript)
   *
   * @example
   * ```typescript
   * builder.setButtonType('submit');
   * // Produces: type="submit"
   *
   * builder.setButtonType('button');
   * // Produces: type="button"
   * // Good for buttons that trigger JavaScript, not form submission
   * ```
   *
   * @see {@link ButtonType} for all valid types
   */
  setButtonType(type: ButtonType): this {
    this._attributes.push(HtmlAttribute.buttonType(type));
    return this;
  }
}
