/**
 * HTMLモジュールのエントリポイント
 *
 * Task 7.1: すべての公開APIを一元的にエクスポートする
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

// ── Protocols ──
export type {
  HTMLTagProtocol,
  HtmlAttributeShape,
  ChildManageable,
  AttributeManageable,
} from './protocols/index.js';

export type {
  HtmlAttributeManagerProtocol,
} from './protocols/index.js';

export type {
  TagGenerateProtocol,
} from './protocols/index.js';

export type {
  CssManagerType,
} from './protocols/index.js';

export type {
  JQueryManagerProtocol,
} from './protocols/index.js';

export type {
  AttributeBuilderProtocol,
} from './protocols/index.js';

// ── Elements ──
export {
  HtmlTag,
  PairType,
  Root,
  SelfClosingType,
  TextType,
} from './elements/index.js';

export type { CssOutputMode } from './elements/index.js';

// ── Attributes ──
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
} from './attributes/index.js';

export {
  createBooleanValue,
  createKeyValueValue,
  createCustomValue,
  BOOLEAN_ATTRIBUTE_KEYS,
  KEY_VALUE_ATTRIBUTE_KEYS,
  ARIA_ATTRIBUTE_KEYS,
  INPUT_TYPES,
  BUTTON_TYPES,
} from './attributes/index.js';

export { HtmlAttribute } from './attributes/index.js';
export { normalizeClassNames, escapeHtml } from './attributes/index.js';
export {
  BaseAttributeBuilder,
  FormAttributeBuilder,
  InputAttributeBuilder,
  ImageAttributeBuilder,
  LinkAttributeBuilder,
  ButtonAttributeBuilder,
} from './attributes/index.js';

// ── Tags ──
export {
  TAG_TYPES,
  SELF_CLOSING_TAGS,
  getTagStructure,
} from './tags/index.js';

export type {
  TagType,
  TagStructure,
} from './tags/index.js';

export type {
  AttributeMap,
  ChildArg,
} from './tags/index.js';

// タグファクトリ関数（Req 9.1）
export {
  // 基本
  html, head, body, div, p, span, script,
  // セマンティック
  header, footer, nav, main, section, article, aside, figure, figcaption,
  // テーブル
  table, thead, tbody, tfoot, tr, th, td, caption, colgroup,
  // リスト
  ul, ol, li, dl, dt, dd,
  // フォーム
  form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output,
  // テキスト装飾
  strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp,
  // 見出し
  h1, h2, h3, h4, h5, h6,
  // メディア
  video, audio, picture, canvas, svg,
  // インタラクティブ
  details, summary, dialog, iframe, noscript,
  // 自己終了
  br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr,
  // その他
  a, title, varTag,
  // テキスト
  Text,
} from './tags/index.js';

// ── Tags Namespace ──
export { tags } from './tags/index.js';

// ── Utils ──
export { HTMLFormatter } from './utils/index.js';
