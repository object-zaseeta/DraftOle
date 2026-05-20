/**
 * Task 6.2: Form-related AttributeBuilders
 *
 * 専用属性ビルダー（フォーム系）:
 * - FormAttributeBuilder: action, method, enctype
 * - InputAttributeBuilder: type, placeholder, required, pattern, minLength, maxLength
 * - ButtonAttributeBuilder: buttonType
 *
 * Requirements: 7.3, 7.4, 7.6
 */
import type { InputType, ButtonType } from './attribute-keys.js';
import { HtmlAttribute } from './html-attribute.js';
import { BaseAttributeBuilder } from './attribute-builder-base.js';

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
    return this.addKeyValue('action', action);
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
    return this.addKeyValue('method', method);
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
    return this.addKeyValue('enctype', enctype);
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
    return this.addKeyValue('placeholder', placeholder);
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
    return this.addKeyValue('pattern', pattern);
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
    return this.addKeyValue('minlength', length);
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
    return this.addKeyValue('maxlength', length);
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
