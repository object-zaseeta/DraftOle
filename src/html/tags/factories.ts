/**
 * factories.ts — re-export barrel
 *
 * タグファクトリ関数の再エクスポートバレル。
 * 全ての公開APIはここから再エクスポートされる。
 *
 * 内部ユーティリティ (isAttributeMap, parseAttributeMap, toChild,
 * makePairTag, makeSelfClosingTag) はここでは再エクスポートしない。
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 10.2
 */
export type { ChildArg, AttributeMap } from './factories-utils.js';
export { html, head, body, div, p, span, script } from './factories-structure.js';
export { header, footer, nav, main, section, article, aside, figure, figcaption, h1, h2, h3, h4, h5, h6, details, summary, dialog, iframe, noscript, a, title, varTag } from './factories-semantic.js';
export { table, thead, tbody, tfoot, tr, th, td, caption, colgroup, ul, ol, li, dl, dt, dd } from './factories-data.js';
export { form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output } from './factories-form.js';
export { strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp } from './factories-inline.js';
export { video, audio, picture, canvas, svg, br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr, Text } from './factories-media.js';
