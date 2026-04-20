/**
 * factories-structure.ts
 *
 * 構造タグファクトリ関数: html, head, body, div, p, span, script
 *
 * Requirements: 5.1, 5.2, 4.2, 4.4, 6.1, 6.3
 */
import { PairType } from '../elements/pair-type.js';
import { makePairTag } from './factories-utils.js';
import type { AttributeMap, ChildArg } from './factories-utils.js';
import type { HtmlTagOptions } from '../elements/html-tag.js';
import { TAG_TYPES } from './tag-type.js';

/**
 * Creates an `<html>` element.
 *
 * The root element of an HTML document.
 *
 * @param args - Optional attributes, child elements, and a trailing `HtmlTagOptions`
 * @returns A new PairType instance representing an `<html>` element
 *
 * @example
 * ```typescript
 * const document = html(
 *   head(title('My Page')),
 *   body(h1('Welcome'))
 * );
 * ```
 */
export function html(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.html, args); }

/**
 * Creates a `<head>` element.
 *
 * Contains metadata and document-level resources.
 *
 * @param args - Optional attributes, child elements, and a trailing `HtmlTagOptions`
 * @returns A new PairType instance representing a `<head>` element
 *
 * @example
 * ```typescript
 * const pageHead = head(
 *   title('My Page'),
 *   meta({ charset: 'utf-8' })
 * );
 * ```
 */
export function head(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.head, args); }

/**
 * Creates a `<body>` element.
 *
 * Contains the visible content of the HTML document.
 *
 * @param args - Optional attributes, child elements, and a trailing `HtmlTagOptions`
 * @returns A new PairType instance representing a `<body>` element
 *
 * @example
 * ```typescript
 * const pageBody = body(
 *   { class: 'main-layout' },
 *   header(h1('Welcome')),
 *   main(p('Content'))
 * );
 * ```
 */
export function body(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.body, args); }

/**
 * Creates a `<div>` element.
 *
 * A generic container for flow content.
 *
 * @param args - Optional attributes, child elements, and a trailing `HtmlTagOptions`
 * @returns A new PairType instance representing a `<div>` element
 *
 * @example
 * ```typescript
 * const container = div(
 *   { class: 'container' },
 *   p('First paragraph'),
 *   p('Second paragraph')
 * );
 * ```
 */
export function div(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.div, args); }

/**
 * Creates a `<p>` element.
 *
 * Represents a paragraph of text.
 *
 * @param args - Optional attributes, child elements, and a trailing `HtmlTagOptions`
 * @returns A new PairType instance representing a `<p>` element
 *
 * @example
 * ```typescript
 * const paragraph = p('This is a paragraph.');
 * const styledParagraph = p(
 *   { class: 'intro' },
 *   'This is an introduction.'
 * );
 * ```
 */
export function p(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.p, args); }

/**
 * Creates a `<span>` element.
 *
 * A generic inline container for phrasing content.
 *
 * @param args - Optional attributes, child elements, and a trailing `HtmlTagOptions`
 * @returns A new PairType instance representing a `<span>` element
 *
 * @example
 * ```typescript
 * const highlighted = span({ class: 'highlight' }, 'Important text');
 * ```
 */
export function span(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.span, args); }

/**
 * Creates a `<script>` element.
 *
 * Used to embed or reference executable JavaScript code.
 *
 * @param args - Optional attributes, child elements, and a trailing `HtmlTagOptions`
 * @returns A new PairType instance representing a `<script>` element
 *
 * @example
 * ```typescript
 * const inlineScript = script('console.log("Hello");');
 * const externalScript = script({ src: 'app.js' });
 * ```
 */
export function script(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.script, args); }
