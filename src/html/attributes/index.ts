/**
 * HTML属性モジュールのエントリポイント
 */

// Task 1.2: 属性値型、属性キー、InputType、ButtonType
export type {
  HtmlAttributeValue,
  BooleanAttributeValue,
  KeyValueAttributeValue,
  CustomAttributeValue,
  BooleanAttributeKey,
  KeyValueAttributeKey,
  AriaAttributeKey,
  InputType,
  ButtonType,
} from './attribute-keys.js';

export {
  createBooleanValue,
  createKeyValueValue,
  createCustomValue,
  BOOLEAN_ATTRIBUTE_KEYS,
  KEY_VALUE_ATTRIBUTE_KEYS,
  ARIA_ATTRIBUTE_KEYS,
  INPUT_TYPES,
  BUTTON_TYPES,
} from './attribute-keys.js';

// Task 2.1: HtmlAttribute クラス
export { HtmlAttribute } from './html-attribute.js';

// Task 2.2: class名正規化・HTMLエスケープ
export { normalizeClassNames, escapeHtml } from './html-attribute.js';

// Task 6.1: BaseAttributeBuilder
export { BaseAttributeBuilder } from './attribute-builder.js';

// Task 6.2: 専用属性ビルダー (Form, Input, Image, Link, Button)
export {
  FormAttributeBuilder,
  InputAttributeBuilder,
  ImageAttributeBuilder,
  LinkAttributeBuilder,
  ButtonAttributeBuilder,
} from './attribute-builder.js';
