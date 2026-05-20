/**
 * CSSプロパティキー定数
 *
 * camelCase形式のJavaScriptプロパティ名からハイフネーション付きCSS標準名への
 * マッピングを提供する。Swift版の CSSPropertyKey enum の rawValue と完全一致する。
 *
 * ## プロパティカテゴリと数
 *
 * | カテゴリ | プロパティ数 | 例 |
 * |---------|-------------|-----|
 * | Font | 7 | font-size, color, line-height |
 * | Background | 5 | background-color, background-image |
 * | Spacing | 10 | margin, padding |
 * | Border | 20 | border-width, border-radius |
 * | Flex | 12 | flex-direction, justify-content |
 * | Grid | 14 | grid-template-columns, grid-gap |
 * | Visual | 6 | box-shadow, opacity, cursor |
 * | Text | 13 | text-align, text-decoration |
 * | Transform | 6 | transform, filter |
 * | Animation | 14 | animation, transition |
 * | Table | 5 | border-collapse, table-layout |
 * | List | 4 | list-style-type |
 * | Visibility | 31 | display, width, height, position |
 *
 * **合計: 148プロパティ**
 *
 * ## 使用例
 *
 * @example
 * ```ts
 * // プロパティキーの使用
 * CSSPropertyKey.fontSize // → "font-size"
 * CSSPropertyKey.backgroundColor // → "background-color"
 * CSSPropertyKey.marginTop // → "margin-top"
 *
 * // プロパティクラスでの使用
 * const properties = new Map<string, string>();
 * properties.set(CSSPropertyKey.fontSize, '16px');
 * properties.set(CSSPropertyKey.color, '#333');
 * ```
 *
 * @see {@link CSSPropertyKeyValue}
 */

export const CSSPropertyKey = {
  // ── Font関連 (7) ──
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  fontStyle: 'font-style',
  color: 'color',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',

  // ── Background関連 (6) ──
  background: 'background',
  backgroundColor: 'background-color',
  backgroundImage: 'background-image',
  backgroundSize: 'background-size',
  backgroundPosition: 'background-position',
  backgroundRepeat: 'background-repeat',

  // ── Spacing関連 (10) ──
  marginTop: 'margin-top',
  marginRight: 'margin-right',
  marginBottom: 'margin-bottom',
  marginLeft: 'margin-left',
  margin: 'margin',
  paddingTop: 'padding-top',
  paddingRight: 'padding-right',
  paddingBottom: 'padding-bottom',
  paddingLeft: 'padding-left',
  padding: 'padding',

  // ── Border関連 (20) ──
  borderWidth: 'border-width',
  borderStyle: 'border-style',
  borderColor: 'border-color',
  borderRadius: 'border-radius',
  borderTopWidth: 'border-top-width',
  borderTopStyle: 'border-top-style',
  borderTopColor: 'border-top-color',
  borderRightWidth: 'border-right-width',
  borderRightStyle: 'border-right-style',
  borderRightColor: 'border-right-color',
  borderBottomWidth: 'border-bottom-width',
  borderBottomStyle: 'border-bottom-style',
  borderBottomColor: 'border-bottom-color',
  borderLeftWidth: 'border-left-width',
  borderLeftStyle: 'border-left-style',
  borderLeftColor: 'border-left-color',
  borderTopLeftRadius: 'border-top-left-radius',
  borderTopRightRadius: 'border-top-right-radius',
  borderBottomRightRadius: 'border-bottom-right-radius',
  borderBottomLeftRadius: 'border-bottom-left-radius',

  // ── Flex関連 (12) ──
  flex: 'flex',
  flexDirection: 'flex-direction',
  justifyContent: 'justify-content',
  alignItems: 'align-items',
  gap: 'gap',
  flexWrap: 'flex-wrap',
  flexGrow: 'flex-grow',
  flexShrink: 'flex-shrink',
  flexBasis: 'flex-basis',
  alignSelf: 'align-self',
  order: 'order',
  alignContent: 'align-content',

  // ── Grid関連 (14) ──
  gridTemplateColumns: 'grid-template-columns',
  gridTemplateRows: 'grid-template-rows',
  gridGap: 'grid-gap',
  gridColumn: 'grid-column',
  gridRow: 'grid-row',
  gridColumnStart: 'grid-column-start',
  gridColumnEnd: 'grid-column-end',
  gridRowStart: 'grid-row-start',
  gridRowEnd: 'grid-row-end',
  gridTemplateAreas: 'grid-template-areas',
  gridArea: 'grid-area',
  gridAutoFlow: 'grid-auto-flow',
  gridAutoColumns: 'grid-auto-columns',
  gridAutoRows: 'grid-auto-rows',

  // ── Visual関連 (6) ──
  boxShadow: 'box-shadow',
  opacity: 'opacity',
  cursor: 'cursor',
  overflow: 'overflow',
  overflowX: 'overflow-x',
  overflowY: 'overflow-y',

  // ── Text関連 (13) ──
  textAlign: 'text-align',
  textDecoration: 'text-decoration',
  textTransform: 'text-transform',
  textIndent: 'text-indent',
  wordSpacing: 'word-spacing',
  whiteSpace: 'white-space',
  textOverflow: 'text-overflow',
  textDecorationColor: 'text-decoration-color',
  textDecorationStyle: 'text-decoration-style',
  textDecorationLine: 'text-decoration-line',
  wordBreak: 'word-break',
  overflowWrap: 'overflow-wrap',
  textShadow: 'text-shadow',

  // ── Transform関連 (6) ──
  transform: 'transform',
  transformOrigin: 'transform-origin',
  filter: 'filter',
  backdropFilter: 'backdrop-filter',
  perspective: 'perspective',
  perspectiveOrigin: 'perspective-origin',

  // ── Animation関連 (14) ──
  animationName: 'animation-name',
  animationDuration: 'animation-duration',
  animationTimingFunction: 'animation-timing-function',
  animationDelay: 'animation-delay',
  animationIterationCount: 'animation-iteration-count',
  animationDirection: 'animation-direction',
  animationFillMode: 'animation-fill-mode',
  animationPlayState: 'animation-play-state',
  animation: 'animation',
  transitionProperty: 'transition-property',
  transitionDuration: 'transition-duration',
  transitionTimingFunction: 'transition-timing-function',
  transitionDelay: 'transition-delay',
  transition: 'transition',

  // ── Table関連 (5) ──
  borderCollapse: 'border-collapse',
  borderSpacing: 'border-spacing',
  tableLayout: 'table-layout',
  captionSide: 'caption-side',
  emptyCells: 'empty-cells',

  // ── List関連 (4) ──
  listStyleType: 'list-style-type',
  listStylePosition: 'list-style-position',
  listStyleImage: 'list-style-image',
  listStyle: 'list-style',

  // ── Visibility関連 (31) ──
  display: 'display',
  visibility: 'visibility',
  zIndex: 'z-index',
  cssFloat: 'float',
  clear: 'clear',
  position: 'position',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  width: 'width',
  height: 'height',
  minWidth: 'min-width',
  maxWidth: 'max-width',
  minHeight: 'min-height',
  maxHeight: 'max-height',
  objectFit: 'object-fit',
  objectPosition: 'object-position',
  verticalAlign: 'vertical-align',
  content: 'content',
  pointerEvents: 'pointer-events',
  userSelect: 'user-select',
  resize: 'resize',
  outline: 'outline',
  outlineColor: 'outline-color',
  outlineStyle: 'outline-style',
  outlineWidth: 'outline-width',
  outlineOffset: 'outline-offset',
  boxSizing: 'box-sizing',
  clip: 'clip',
  clipPath: 'clip-path',
} as const;

/**
 * CSSPropertyKey の値の型（ハイフネーションCSS標準名のユニオン型）
 *
 * 例: 'font-size' | 'background-color' | 'margin-top' | ...
 */
export type CSSPropertyKeyValue = typeof CSSPropertyKey[keyof typeof CSSPropertyKey];
