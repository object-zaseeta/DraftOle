/**
 * factories-structure.ts
 *
 * 構造タグファクトリ関数: html, head, body, div, p, span, script
 *
 * Requirements: 5.1, 5.2, 4.2, 4.4, 6.1, 6.3
 */
import { makePairFactory } from './factories-utils.js';
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
export const html = makePairFactory(TAG_TYPES.html);

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
export const head = makePairFactory(TAG_TYPES.head);

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
export const body = makePairFactory(TAG_TYPES.body);

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
export const div = makePairFactory(TAG_TYPES.div);

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
export const p = makePairFactory(TAG_TYPES.p);

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
export const span = makePairFactory(TAG_TYPES.span);

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
export const script = makePairFactory(TAG_TYPES.script);
