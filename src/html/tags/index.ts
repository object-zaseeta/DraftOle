export {
  TAG_TYPES,
  SELF_CLOSING_TAGS,
  getTagStructure,
  type TagType,
  type TagStructure,
} from './tag-type.js';

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
  // 型
  type AttributeMap,
  type ChildArg,
} from './factories.js';

export { tags } from './tags-namespace.js';
