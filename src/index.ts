export type { Renderable, Exportable } from './utils/renderable.js';


export type { UnitStyle, RelationShip, HlUnit } from './utils/unit-style.js';
export { hlUnitToCssString } from './utils/unit-style.js';


export {
  // ── Base Error ──
  DraftOleError,
  // ── CSS Dev Error ──
  DuplicateCssPropertyError,
} from './utils/errors.js';


export { guardDuplicateCssProperty } from './utils/dev-guard.js';


export {
  // ── Elements ──
  HtmlTag,
  PairType,
  Root,
  SelfClosingType,
  TextType,

  // ── Attributes ──
  HtmlAttribute,
  normalizeClassNames,
  escapeHtml,
  createBooleanValue,
  createKeyValueValue,
  createCustomValue,
  BOOLEAN_ATTRIBUTE_KEYS,
  KEY_VALUE_ATTRIBUTE_KEYS,
  ARIA_ATTRIBUTE_KEYS,
  INPUT_TYPES,
  BUTTON_TYPES,
  BaseAttributeBuilder,
  FormAttributeBuilder,
  InputAttributeBuilder,
  ImageAttributeBuilder,
  LinkAttributeBuilder,
  ButtonAttributeBuilder,

  // ── Tags ──
  TAG_TYPES,
  SELF_CLOSING_TAGS,
  getTagStructure,

  // タグファクトリ関数
  html, head, body, div, p, span, script,
  header, footer, nav, main, section, article, aside, figure, figcaption,
  table, thead, tbody, tfoot, tr, th, td, caption, colgroup,
  ul, ol, li, dl, dt, dd,
  form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output,
  strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp,
  h1, h2, h3, h4, h5, h6,
  video, audio, picture, canvas, svg,
  details, summary, dialog, iframe, noscript,
  br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr,
  a, title, varTag,
  Text,

  // ── Utils ──
  HTMLFormatter,
} from './html/index.js';

export type {
  // ── Protocols ──
  HTMLTagProtocol,
  HtmlAttributeShape,
  ChildManageable,
  AttributeManageable,
  HtmlAttributeManagerProtocol,
  TagGenerateProtocol,
  CssManagerType,
  JQueryManagerProtocol,
  AttributeBuilderProtocol,

  // ── Types ──
  TagType,
  TagStructure,
  AttributeMap,
  ChildArg,
  CssOutputMode,
  HtmlAttributeValue,
  BooleanAttributeValue,
  KeyValueAttributeValue,
  CustomAttributeValue,
  BooleanAttributeKey,
  KeyValueAttributeKey,
  AriaAttributeKey,
  InputType,
  ButtonType,
} from './html/index.js';

export type {
  HtmlTagOptions,
} from './html/elements/html-tag.js';

// Phase 3: CSS Module
export {
  // ── Manager ──
  CssManager,
  CssStyleManager,
  DefaultCssManager,

  // ── Style: 統合コンテナ ──
  HtmlStyle,

  // ── Style: 13プロパティクラス ──
  CSSFont,
  CSSBackground,
  CSSSpacing,
  CSSBorder,
  CSSFlex,
  CSSGrid,
  CSSVisual,
  CSSText,
  CSSTransform,
  CSSAnimation,
  CSSTable,
  CSSList,
  CSSVisibility,

  // ── Style: プロパティキー ──
  CSSPropertyKey,

  // ── Style: Color ──
  CSSColor,
  CSSColorName,

  // ── Layout: Position Maker ──
  CssPositionMaker,

  // ── Layout: Lazy Layout ──
  LazyLayoutManager,

  // ── Config ──
  CssConfig,

  // ── Utils ──
  generateScopedClassName,
  djb2Hash,
} from './css/index.js';

// Phase 3: CSS Variables & Shared Styles
export { createTheme } from './css/variables/css-theme.js';
export type { Theme } from './css/variables/css-theme.js';
export { createStyle } from './css/variables/css-shared-style.js';
export type { SharedStyle } from './css/variables/css-shared-style.js';

export type {
  // ── Manager ──
  CssManagerInstance,

  // ── Style: Types ──
  CssStyleManagerType,
  HtmlStyleType,

  // ── Layout: Position Maker ──
  CssPositionMakerType,

  // ── Layout: Lazy Layout ──
  LayoutRegisteredItem,
  LazyLayoutRegister,

  // ── Layout: Types ──
  CssPlaceDescription,
  CssLayoutBuilder,
  Positioning,

  // ── Config ──
  CssConfigOutputMode,
  CssConfigOptions,
} from './css/index.js';

// Phase 4: JS Module
export {
  // ── Manager ──
  JQueryManager,
} from './js/jquery-manager.js';

export type {
  // ── Manager ──
  JQueryManagerInstance,
} from './js/jquery-manager.js';

export {
  // ── Helper ──
  JQueryHelper,
} from './js/jquery-helper.js';

export {
  // ── Method Types ──
  JQUERY_METHOD_TYPES,
} from './js/jquery-method-type.js';

export type {
  // ── Method Types ──
  JQueryMethodType,
} from './js/jquery-method-type.js';

// Phase 4: JS Template
export {
  jsTemplate,
  param,
  isJsParam,
} from './js/js-template.js';

export type {
  JsParam,
  JsTemplateResult,
} from './js/js-template.js';

// Phase 4: JS Vanilla Builder（`src/js/vanilla/`）
export * from './js/vanilla/index.js';

// Phase 5: Publisher Module
export {
  // ── Exporter ──
  FileExporter,
} from './publisher/file-exporter.js';

export {
  wrapDOMReady,
} from './publisher/dom-ready.js';

export type {
  // ── Exporter ──
  FileExporterOptions,
} from './publisher/file-exporter.js';

export {
  // ── Error ──
  ExportableError,
} from './publisher/errors/ExportableError.js';

// Note: ExportableErrorCode は utils/errors.ts から既にエクスポート済み
// タスク3.3で ExportableError を DraftOleError 継承に変更する際に、
// publisher/exportable-error.ts から ExportableErrorCode のエクスポートを削除する
