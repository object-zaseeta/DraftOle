// ---------------------------------------------------------------------------
// TagType: 97種類のHTMLタグ種別定義と構造判定
// ---------------------------------------------------------------------------

/**
 * Tag structure classification.
 *
 * - **pair**: Elements with opening and closing tags (e.g., `<div>...</div>`)
 * - **selfClosing**: Self-closing (void) elements (e.g., `<br>`)
 */
export type TagStructure = 'pair' | 'selfClosing';

/**
 * Constant object defining all 97 HTML tag types.
 *
 * This object uses HTML standard tag names as keys (unlike Swift version which used
 * enum aliases like `paragraph="p"`, `bold="b"`). As a result, TypeScript version
 * has 97 unique entries vs Swift's 66 cases (including aliases).
 *
 * **Categories:**
 * - **Basic (10):** html, head, body, div, p, span, script, root, text, doctype
 * - **Semantic (9):** header, footer, nav, main, section, article, aside, figure, figcaption
 * - **Table (9):** table, thead, tbody, tfoot, tr, th, td, caption, colgroup
 * - **List (6):** ul, ol, li, dl, dt, dd
 * - **Form (11):** form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output
 * - **Text Decoration (20):** strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp
 * - **Heading (6):** h1, h2, h3, h4, h5, h6
 * - **Media (5):** video, audio, picture, canvas, svg
 * - **Interactive (5):** details, summary, dialog, iframe, noscript
 * - **Self-Closing (13):** br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr
 * - **Other (3):** a, title, var
 *
 * **Total:** 10 + 9 + 9 + 6 + 11 + 20 + 6 + 5 + 5 + 13 + 3 = 97
 *
 * @example
 * ```typescript
 * import { TAG_TYPES } from './tag-type.js';
 *
 * console.log(TAG_TYPES.div);    // 'div'
 * console.log(TAG_TYPES.p);      // 'p'
 * console.log(TAG_TYPES.br);     // 'br'
 * ```
 */
export const TAG_TYPES = {
  // 基本
  html: 'html',
  head: 'head',
  body: 'body',
  div: 'div',
  p: 'p',
  span: 'span',
  script: 'script',
  root: 'root',
  text: 'text',
  doctype: 'doctype',

  // セマンティック
  header: 'header',
  footer: 'footer',
  nav: 'nav',
  main: 'main',
  section: 'section',
  article: 'article',
  aside: 'aside',
  figure: 'figure',
  figcaption: 'figcaption',

  // テーブル
  table: 'table',
  thead: 'thead',
  tbody: 'tbody',
  tfoot: 'tfoot',
  tr: 'tr',
  th: 'th',
  td: 'td',
  caption: 'caption',
  colgroup: 'colgroup',

  // リスト
  ul: 'ul',
  ol: 'ol',
  li: 'li',
  dl: 'dl',
  dt: 'dt',
  dd: 'dd',

  // フォーム
  form: 'form',
  label: 'label',
  button: 'button',
  select: 'select',
  option: 'option',
  optgroup: 'optgroup',
  textarea: 'textarea',
  fieldset: 'fieldset',
  legend: 'legend',
  datalist: 'datalist',
  output: 'output',

  // テキスト装飾
  strong: 'strong',
  em: 'em',
  b: 'b',
  i: 'i',
  u: 'u',
  s: 's',
  mark: 'mark',
  small: 'small',
  sub: 'sub',
  sup: 'sup',
  code: 'code',
  pre: 'pre',
  blockquote: 'blockquote',
  q: 'q',
  cite: 'cite',
  abbr: 'abbr',
  address: 'address',
  time: 'time',
  kbd: 'kbd',
  samp: 'samp',

  // 見出し
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',

  // メディア
  video: 'video',
  audio: 'audio',
  picture: 'picture',
  canvas: 'canvas',
  svg: 'svg',

  // インタラクティブ
  details: 'details',
  summary: 'summary',
  dialog: 'dialog',
  iframe: 'iframe',
  noscript: 'noscript',

  // 自己終了（HTML void elements）
  br: 'br',
  hr: 'hr',
  img: 'img',
  input: 'input',
  meta: 'meta',
  link: 'link',
  source: 'source',
  track: 'track',
  area: 'area',
  col: 'col',
  base: 'base',
  embed: 'embed',
  wbr: 'wbr',

  // その他
  a: 'a',
  title: 'title',
  var: 'var',
} as const;

/**
 * Union type of all HTML tag types.
 *
 * Derived from the values of {@link TAG_TYPES} as a string literal union.
 *
 * @example
 * ```typescript
 * const tagName: TagType = 'div';  // Valid
 * const invalid: TagType = 'foo';  // Type error
 * ```
 */
export type TagType = typeof TAG_TYPES[keyof typeof TAG_TYPES];

/**
 * Set of all 13 standard HTML void (self-closing) elements.
 *
 * **Included Tags:**
 * br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr
 *
 * **Note:** `doctype` is not included (handled as a special case).
 *
 * @example
 * ```typescript
 * import { SELF_CLOSING_TAGS } from './tag-type.js';
 *
 * console.log(SELF_CLOSING_TAGS.has('br'));    // true
 * console.log(SELF_CLOSING_TAGS.has('div'));   // false
 * ```
 */
export const SELF_CLOSING_TAGS: ReadonlySet<TagType> = new Set<TagType>([
  'br',
  'hr',
  'img',
  'input',
  'meta',
  'link',
  'source',
  'track',
  'area',
  'col',
  'base',
  'embed',
  'wbr',
]);

/**
 * Determines the structure type of a given HTML tag.
 *
 * @param tag - The tag type to check
 * @returns 'selfClosing' if the tag is a void element, 'pair' otherwise
 *
 * @example
 * ```typescript
 * import { getTagStructure, TAG_TYPES } from './tag-type.js';
 *
 * console.log(getTagStructure(TAG_TYPES.br));   // 'selfClosing'
 * console.log(getTagStructure(TAG_TYPES.div));  // 'pair'
 * console.log(getTagStructure(TAG_TYPES.img));  // 'selfClosing'
 * console.log(getTagStructure(TAG_TYPES.p));    // 'pair'
 * ```
 */
export function getTagStructure(tag: TagType): TagStructure {
  return SELF_CLOSING_TAGS.has(tag) ? 'selfClosing' : 'pair';
}
