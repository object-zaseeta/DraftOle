/**
 * Barrel for HTML attribute key types, value types, and factory functions.
 *
 * 17 symbols are re-exported from `./_data/*.ts` to preserve historical import path.
 * Consumers (7 files + `src/index.ts`) import from this path without modification.
 *
 * @see ./_data/value-types-and-factories
 * @see ./_data/boolean-keys
 * @see ./_data/key-value-keys
 * @see ./_data/aria-keys
 * @see ./_data/input-and-button-types
 */

// ── Type re-exports ──
export type {
  BooleanAttributeValue,
  KeyValueAttributeValue,
  CustomAttributeValue,
  HtmlAttributeValue,
} from './_data/value-types-and-factories.js';
export type { BooleanAttributeKey } from './_data/boolean-keys.js';
export type { KeyValueAttributeKey } from './_data/key-value-keys.js';
export type { AriaAttributeKey } from './_data/aria-keys.js';
export type {
  InputType,
  ButtonType,
} from './_data/input-and-button-types.js';

// ── Value re-exports (factories + const arrays) ──
export {
  createBooleanValue,
  createKeyValueValue,
  createCustomValue,
} from './_data/value-types-and-factories.js';
export { BOOLEAN_ATTRIBUTE_KEYS } from './_data/boolean-keys.js';
export { KEY_VALUE_ATTRIBUTE_KEYS } from './_data/key-value-keys.js';
export { ARIA_ATTRIBUTE_KEYS } from './_data/aria-keys.js';
export {
  INPUT_TYPES,
  BUTTON_TYPES,
} from './_data/input-and-button-types.js';
