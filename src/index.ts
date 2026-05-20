// Phase 1: Utils
export type { Renderable, Exportable } from './utils/renderable.js';

// Phase 1: Utils - CSS Unit Types
export type { UnitStyle, RelationShip, HlUnit } from './utils/unit-style.js';
export { hlUnitToCssString } from './utils/unit-style.js';

// Phase 1: Utils - Error Types
export {
  // ── Base Error ──
  DraftOleError,
  // ── CSS Dev Error ──
  DuplicateCssPropertyError,
} from './utils/errors.js';

// Phase 1: Utils - Dev Guard
export { guardDuplicateCssProperty } from './utils/dev-guard.js';

export type {
  // ── Error Codes ──
  DraftOleErrorCode,
  HtmlErrorCode,
  CssErrorCode,
  JsErrorCode,
  ExportableErrorCode,
} from './utils/errors.js';

// 主導線 — first impression（page first, App later）
// Phase 7: View DSL 入口
export { Button, Heading, HStack, Image, Link, PageDocument, Section, Spacer, VStack, page } from './view/index.js';
export { Text as ViewText } from './view/index.js';
export type { ButtonOptions, HeadingLevel, LinkOptions, PageOptions, View } from './view/index.js';
export { AppSlot } from './view/index.js';
export type { AppSlotOptions } from './view/index.js';

// ── App モジュール ──
export { app, AppDocument } from './app/index.js';
// `AppContext` は 1.0.0 で公開面から除去。利用者は `AppDocument`（`app()` 戻り値型）を使うこと。
// 内部実装としては `src/app/app.ts` に保持（`AppDocument implements AppContext` の構造的契約）。
export type { AppOptions, AppView } from './app/index.js';
// State<T>, Computed<T> は Phase 4（js/vanilla）経由で既に公開済み

// Phase 2: HTML Module
// `Root` クラスは 1.0.0 で公開面から除去（公開面非露出を不変条件として固定）。
// 内部実装としては `src/html/elements/root.ts` に保持（`page()` / `app()` の document/runtime/export 束ね基盤）。
// 物理削除は Phase 2 spec として検討。
export {
  // ── Elements ──
  HtmlTag,
  PairType,
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

  // ── Tags Namespace ──
  tags,
  tags as el,
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

// `RootOptions` 型は 1.0.0 で公開面から除去（Root 公開面非露出の一環）。

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

  // ── Variables: Build-time Label Helper ──
  __draftole_label__,
} from './css/index.js';

// Phase 3: CSS Variables & Shared Styles
// `createTheme` / `createStyle` は 1.0.0 で公開面から除去。
// 利用者は `css.theme` / `css.class` を使用すること。内部実装としては `src/css/variables/css-theme.ts` /
// `css/variables/css-shared-style.ts` に保持（kept policy の `css.*` namespace 実装基盤）。
export type { Theme } from './css/variables/css-theme.js';
export type { UnifiedTheme, UnifiedThemeInput } from './css/variables/unified-theme.js';
export type { SharedStyle } from './css/variables/css-shared-style.js';

// Phase 3: CSS Namespace Facade — 単一エントリポイント
export { css } from './css/css.js';

// Phase 3: CSS Style - Fluent API Option Types
export type { FlexOptions } from './css/style/flex/css-flex.js';
export type { GridOptions } from './css/style/grid/css-grid.js';
export type { FontOptions } from './css/style/font/css-font.js';
export type { BorderOptions } from './css/style/border/css-border.js';
export { PseudoStyleBuilder } from './css/style/pseudo/pseudo-style-builder.js';

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
} from './html/protocols/jquery-method-type.js';

export type {
  // ── Method Types ──
  JQueryMethodType,
} from './html/protocols/jquery-method-type.js';

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
} from './publisher/exportable-error.js';

// Note: ExportableErrorCode は utils/errors.ts から既にエクスポート済み
// タスク3.3で ExportableError を DraftOleError 継承に変更する際に、
// publisher/exportable-error.ts から ExportableErrorCode のエクスポートを削除する

// Phase 6: SwiftUI-style Layout Module
export {
  // ── Layout factory functions ──
  hstack,
  vstack,
  zstack,
  spacer,
  divider,
} from './html/layout/index.js';

export type {
  // ── Layout option types ──
  StackOptions,
  ZStackOptions,
  SpacerOptions,
  LayoutChild,
} from './html/layout/index.js';

export {
  // ── Alignment constants ──
  Alignment,
  ZStackAlignment,

  // ── Breakpoints constant ──
  Breakpoints,
} from './css/constants/index.js';

export type {
  // ── Alignment types ──
  AlignmentValue,
  ZStackAlignmentKey,

  // ── Breakpoint types ──
  BreakpointKey,
  BreakpointStyles,

  // ── Edge types ──
  EdgeSet,
} from './css/constants/index.js';

export type {
  // ── Frame options (from HtmlTag) ──
  FrameOptions,
} from './html/elements/html-tag.js';

// Phase 8: Global CSS DSL
// `tag` / `all` / `rule` / `root` / per-tag shortcuts は 1.0.0 で公開面から除去。
// 利用者は `css.class` / `css.raw` / `css.theme`、または `sel.*` namespace を使用すること。
// 内部実装としては `src/css/variables/global-dsl.ts` / `tag-dsl.generated.ts` に保持
// （kept policy の `sel.*` namespace 実装基盤）。
export type { GlobalCss } from './css/variables/global-css.js';
// `media` / `keyframes` は at-rule として `css.media` / `css.keyframes` と並存（kept policy）。
export { media, keyframes } from './css/variables/global-dsl.js';
export { sel } from './css/variables/css-namespace.js';
