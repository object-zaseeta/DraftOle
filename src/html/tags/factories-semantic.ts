/**
 * factories-semantic.ts
 *
 * セマンティック・見出し・インタラクティブ・その他タグファクトリ関数:
 * header, footer, nav, main, section, article, aside, figure, figcaption,
 * h1-h6, details, summary, dialog, iframe, noscript, a, title, varTag
 *
 * Requirements: 5.1, 5.2
 */
import { PairType } from '../elements/pair-type.js';
import { makePairTag } from './factories-utils.js';
import type { AttributeMap, ChildArg } from './factories-utils.js';
import { TAG_TYPES } from './tag-type.js';

// ── セマンティック ──

/** Creates a `<header>` element (introductory content or navigation aids). */
export function header(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.header, args); }

/** Creates a `<footer>` element (footer for nearest sectioning content or root). */
export function footer(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.footer, args); }

/** Creates a `<nav>` element (section with navigation links). */
export function nav(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.nav, args); }

/** Creates a `<main>` element (dominant content of the document body). */
export function main(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.main, args); }

/** Creates a `<section>` element (generic section of a document). */
export function section(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.section, args); }

/** Creates an `<article>` element (self-contained composition). */
export function article(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.article, args); }

/** Creates an `<aside>` element (content tangentially related to main content). */
export function aside(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.aside, args); }

/** Creates a `<figure>` element (self-contained content with optional caption). */
export function figure(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.figure, args); }

/** Creates a `<figcaption>` element (caption or legend for a figure). */
export function figcaption(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.figcaption, args); }

// ── 見出し ──

/** Creates an `<h1>` element (level 1 heading). */
export function h1(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.h1, args); }

/** Creates an `<h2>` element (level 2 heading). */
export function h2(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.h2, args); }

/** Creates an `<h3>` element (level 3 heading). */
export function h3(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.h3, args); }

/** Creates an `<h4>` element (level 4 heading). */
export function h4(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.h4, args); }

/** Creates an `<h5>` element (level 5 heading). */
export function h5(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.h5, args); }

/** Creates an `<h6>` element (level 6 heading). */
export function h6(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.h6, args); }

// ── インタラクティブ ──

/** Creates a `<details>` element (disclosure widget). */
export function details(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.details, args); }

/** Creates a `<summary>` element (summary for details element). */
export function summary(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.summary, args); }

/** Creates a `<dialog>` element (dialog box or modal). */
export function dialog(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.dialog, args); }

/** Creates an `<iframe>` element (nested browsing context). */
export function iframe(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.iframe, args); }

/** Creates a `<noscript>` element (fallback for scripts disabled). */
export function noscript(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.noscript, args); }

// ── その他 ──

/** Creates an `<a>` element (hyperlink). */
export function a(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.a, args); }

/** Creates a `<title>` element (document title). */
export function title(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.title, args); }

/**
 * Creates a `<var>` element (variable in mathematical or programming context).
 *
 * **Note:** Named `varTag` instead of `var` to avoid collision with JavaScript's `var` keyword.
 */
export function varTag(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.var, args); }
