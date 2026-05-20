import { html, head, body, div, p, span, script } from './factories-structure.js';
import { header, footer, nav, main, section, article, aside, figure, figcaption, h1, h2, h3, h4, h5, h6, details, summary, dialog, iframe, noscript, a, title, varTag } from './factories-semantic.js';
import { table, thead, tbody, tfoot, tr, th, td, caption, colgroup, ul, ol, li, dl, dt, dd } from './factories-data.js';
import { form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output } from './factories-form.js';
import { strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp } from './factories-inline.js';
import { video, audio, picture, canvas, svg, br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr, Text } from './factories-media.js';

export const tags = {
  // 基本
  html, head, body, div, p, span, script,
  // セマンティック
  header, footer, nav, main, section, article, aside, figure, figcaption,
  h1, h2, h3, h4, h5, h6,
  details, summary, dialog, iframe, noscript,
  a, title, varTag,
  // テーブル・リスト
  table, thead, tbody, tfoot, tr, th, td, caption, colgroup,
  ul, ol, li, dl, dt, dd,
  // フォーム
  form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output,
  // テキスト装飾
  strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp,
  // メディア・自己終了
  video, audio, picture, canvas, svg,
  br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr,
  Text,
} as const;
