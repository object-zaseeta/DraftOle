/**
 * factories-inline.ts
 *
 * インライン/テキスト装飾タグファクトリ関数:
 * strong, em, b, i, u, s, mark, small, sub, sup, code, pre,
 * blockquote, q, cite, abbr, address, time, kbd, samp
 *
 * Requirements: 5.1, 5.2
 */
import { PairType } from '../elements/pair-type.js';
import { makePairTag } from './factories-utils.js';
import type { AttributeMap, ChildArg } from './factories-utils.js';
import { TAG_TYPES } from './tag-type.js';

// ── テキスト装飾 ──

/** Creates a `<strong>` element (strong importance, serious urgency). */
export function strong(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.strong, args); }

/** Creates an `<em>` element (stress emphasis). */
export function em(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.em, args); }

/** Creates a `<b>` element (bring attention to, stylistically offset). */
export function b(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.b, args); }

/** Creates an `<i>` element (alternative voice or mood). */
export function i(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.i, args); }

/** Creates a `<u>` element (unarticulated annotation). */
export function u(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.u, args); }

/** Creates an `<s>` element (strikethrough, no longer accurate). */
export function s(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.s, args); }

/** Creates a `<mark>` element (highlighted reference). */
export function mark(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.mark, args); }

/** Creates a `<small>` element (side comments, small print). */
export function small(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.small, args); }

/** Creates a `<sub>` element (subscript). */
export function sub(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.sub, args); }

/** Creates a `<sup>` element (superscript). */
export function sup(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.sup, args); }

/** Creates a `<code>` element (fragment of computer code). */
export function code(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.code, args); }

/** Creates a `<pre>` element (preformatted text). */
export function pre(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.pre, args); }

/** Creates a `<blockquote>` element (block quotation). */
export function blockquote(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.blockquote, args); }

/** Creates a `<q>` element (inline quotation). */
export function q(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.q, args); }

/** Creates a `<cite>` element (title of a creative work). */
export function cite(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.cite, args); }

/** Creates an `<abbr>` element (abbreviation or acronym). */
export function abbr(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.abbr, args); }

/** Creates an `<address>` element (contact information). */
export function address(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.address, args); }

/** Creates a `<time>` element (date/time). */
export function time(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.time, args); }

/** Creates a `<kbd>` element (keyboard input). */
export function kbd(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.kbd, args); }

/** Creates a `<samp>` element (sample output). */
export function samp(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.samp, args); }
