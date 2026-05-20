/**
 * factories-inline.ts
 *
 * インライン/テキスト装飾タグファクトリ関数:
 * strong, em, b, i, u, s, mark, small, sub, sup, code, pre,
 * blockquote, q, cite, abbr, address, time, kbd, samp
 *
 * Requirements: 5.1, 5.2, 4.2, 4.4, 6.1, 6.3
 */
import { makePairFactory } from './factories-utils.js';
import { TAG_TYPES } from './tag-type.js';

// ── テキスト装飾 ──

/** Creates a `<strong>` element (strong importance, serious urgency). */
export const strong = makePairFactory(TAG_TYPES.strong);

/** Creates an `<em>` element (stress emphasis). */
export const em = makePairFactory(TAG_TYPES.em);

/** Creates a `<b>` element (bring attention to, stylistically offset). */
export const b = makePairFactory(TAG_TYPES.b);

/** Creates an `<i>` element (alternative voice or mood). */
export const i = makePairFactory(TAG_TYPES.i);

/** Creates a `<u>` element (unarticulated annotation). */
export const u = makePairFactory(TAG_TYPES.u);

/** Creates an `<s>` element (strikethrough, no longer accurate). */
export const s = makePairFactory(TAG_TYPES.s);

/** Creates a `<mark>` element (highlighted reference). */
export const mark = makePairFactory(TAG_TYPES.mark);

/** Creates a `<small>` element (side comments, small print). */
export const small = makePairFactory(TAG_TYPES.small);

/** Creates a `<sub>` element (subscript). */
export const sub = makePairFactory(TAG_TYPES.sub);

/** Creates a `<sup>` element (superscript). */
export const sup = makePairFactory(TAG_TYPES.sup);

/** Creates a `<code>` element (fragment of computer code). */
export const code = makePairFactory(TAG_TYPES.code);

/** Creates a `<pre>` element (preformatted text). */
export const pre = makePairFactory(TAG_TYPES.pre);

/** Creates a `<blockquote>` element (block quotation). */
export const blockquote = makePairFactory(TAG_TYPES.blockquote);

/** Creates a `<q>` element (inline quotation). */
export const q = makePairFactory(TAG_TYPES.q);

/** Creates a `<cite>` element (title of a creative work). */
export const cite = makePairFactory(TAG_TYPES.cite);

/** Creates an `<abbr>` element (abbreviation or acronym). */
export const abbr = makePairFactory(TAG_TYPES.abbr);

/** Creates an `<address>` element (contact information). */
export const address = makePairFactory(TAG_TYPES.address);

/** Creates a `<time>` element (date/time). */
export const time = makePairFactory(TAG_TYPES.time);

/** Creates a `<kbd>` element (keyboard input). */
export const kbd = makePairFactory(TAG_TYPES.kbd);

/** Creates a `<samp>` element (sample output). */
export const samp = makePairFactory(TAG_TYPES.samp);
