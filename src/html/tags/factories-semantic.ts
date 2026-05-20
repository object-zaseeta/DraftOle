/**
 * factories-semantic.ts
 *
 * セマンティック・見出し・インタラクティブ・その他タグファクトリ関数:
 * header, footer, nav, main, section, article, aside, figure, figcaption,
 * h1-h6, details, summary, dialog, iframe, noscript, a, title, varTag
 *
 * Requirements: 5.1, 5.2
 */
import { makePairFactory } from './factories-utils.js';
import { TAG_TYPES } from './tag-type.js';

// ── セマンティック ──

/** Creates a `<header>` element (introductory content or navigation aids). */
export const header = makePairFactory(TAG_TYPES.header);

/** Creates a `<footer>` element (footer for nearest sectioning content or root). */
export const footer = makePairFactory(TAG_TYPES.footer);

/** Creates a `<nav>` element (section with navigation links). */
export const nav = makePairFactory(TAG_TYPES.nav);

/** Creates a `<main>` element (dominant content of the document body). */
export const main = makePairFactory(TAG_TYPES.main);

/** Creates a `<section>` element (generic section of a document). */
export const section = makePairFactory(TAG_TYPES.section);

/** Creates an `<article>` element (self-contained composition). */
export const article = makePairFactory(TAG_TYPES.article);

/** Creates an `<aside>` element (content tangentially related to main content). */
export const aside = makePairFactory(TAG_TYPES.aside);

/** Creates a `<figure>` element (self-contained content with optional caption). */
export const figure = makePairFactory(TAG_TYPES.figure);

/** Creates a `<figcaption>` element (caption or legend for a figure). */
export const figcaption = makePairFactory(TAG_TYPES.figcaption);

// ── 見出し ──

/** Creates an `<h1>` element (level 1 heading). */
export const h1 = makePairFactory(TAG_TYPES.h1);

/** Creates an `<h2>` element (level 2 heading). */
export const h2 = makePairFactory(TAG_TYPES.h2);

/** Creates an `<h3>` element (level 3 heading). */
export const h3 = makePairFactory(TAG_TYPES.h3);

/** Creates an `<h4>` element (level 4 heading). */
export const h4 = makePairFactory(TAG_TYPES.h4);

/** Creates an `<h5>` element (level 5 heading). */
export const h5 = makePairFactory(TAG_TYPES.h5);

/** Creates an `<h6>` element (level 6 heading). */
export const h6 = makePairFactory(TAG_TYPES.h6);

// ── インタラクティブ ──

/** Creates a `<details>` element (disclosure widget). */
export const details = makePairFactory(TAG_TYPES.details);

/** Creates a `<summary>` element (summary for details element). */
export const summary = makePairFactory(TAG_TYPES.summary);

/** Creates a `<dialog>` element (dialog box or modal). */
export const dialog = makePairFactory(TAG_TYPES.dialog);

/** Creates an `<iframe>` element (nested browsing context). */
export const iframe = makePairFactory(TAG_TYPES.iframe);

/** Creates a `<noscript>` element (fallback for scripts disabled). */
export const noscript = makePairFactory(TAG_TYPES.noscript);

// ── その他 ──

/** Creates an `<a>` element (hyperlink). */
export const a = makePairFactory(TAG_TYPES.a);

/** Creates a `<title>` element (document title). */
export const title = makePairFactory(TAG_TYPES.title);

/**
 * Creates a `<var>` element (variable in mathematical or programming context).
 *
 * **Note:** Named `varTag` instead of `var` to avoid collision with JavaScript's `var` keyword.
 */
export const varTag = makePairFactory(TAG_TYPES.var);
