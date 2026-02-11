/**
 * Task 5.1 + 5.2: タグファクトリ関数
 *
 * 56個以上のDSLスタイルのタグ生成関数を提供する。
 * ペアタグ → PairType、自己終了タグ → SelfClosingType、テキスト → TextType を返す。
 *
 * Task 5.2 で宣言的API（属性マップ+子要素引数）と文字列自動ラップを追加。
 * - 第1引数がAttributeMapかChildArgかをランタイムで判定
 * - AttributeMapからHtmlAttribute配列への変換
 * - 文字列引数を自動的にTextTypeでラップ
 *
 * JavaScript予約語と衝突するタグ名にはサフィックスを付与（var → varTag）。
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 10.2
 */
import { PairType } from '../elements/pair-type.js';
import { SelfClosingType } from '../elements/self-closing-type.js';
import { TextType } from '../elements/text-type.js';
import { HtmlTag } from '../elements/html-tag.js';
import { HtmlAttribute } from '../attributes/html-attribute.js';
import type { HTMLTagProtocol } from '../protocols/html-tag-protocol.js';
import type { BooleanAttributeKey, KeyValueAttributeKey, AriaAttributeKey } from '../attributes/attribute-keys.js';
import { TAG_TYPES } from './tag-type.js';
import type { TagType } from './tag-type.js';

// ============================================================
// 宣言的API共通型 (Task 5.2, Req 5.7, 5.8)
// ============================================================

/**
 * Valid child argument types for tag factory functions.
 *
 * Can be either an {@link HTMLTagProtocol} instance or a string (which will be
 * automatically wrapped in a {@link TextType}).
 *
 * @example
 * ```typescript
 * const element = div(
 *   'Plain text',           // string → TextType
 *   p('Paragraph'),         // HTMLTagProtocol
 *   span('Inline text')     // HTMLTagProtocol
 * );
 * ```
 */
export type ChildArg = HTMLTagProtocol | string;

/**
 * Attribute map for declarative attribute specification.
 *
 * **Value Types:**
 * - `string`: Creates a key-value attribute (e.g., `class="value"`, `id="value"`)
 * - `true`: Creates a boolean attribute (e.g., `checked`, `disabled`)
 * - `false`: Omits the attribute entirely
 *
 * **Special Keys:**
 * - `class`: Normalized through `normalizeClassNames`
 * - `data-*`: Creates custom data attributes
 * - Other keys: Standard HTML attributes
 *
 * @example
 * ```typescript
 * const element = div({
 *   class: 'container active',
 *   id: 'main',
 *   'data-value': '123',
 *   hidden: false  // Omitted from output
 * });
 * ```
 *
 * @example
 * Boolean attributes:
 * ```typescript
 * const checkbox = input({
 *   type: 'checkbox',
 *   checked: true,      // Renders as: checked
 *   disabled: false     // Omitted
 * });
 * ```
 */
export type AttributeMap = Record<string, string | boolean>;

// ============================================================
// 内部ユーティリティ (Task 5.2)
// ============================================================

/**
 * Runtime type guard to check if an argument is an {@link AttributeMap}.
 *
 * Considers plain objects (not HtmlTag instances or arrays) as AttributeMap.
 *
 * @param arg - The argument to check
 * @returns `true` if arg is an AttributeMap, `false` otherwise
 *
 * @internal
 */
function isAttributeMap(arg: unknown): arg is AttributeMap {
  return typeof arg === 'object'
    && arg !== null
    && !(arg instanceof HtmlTag)
    && !Array.isArray(arg);
}

/**
 * Converts an {@link AttributeMap} to an array of {@link HtmlAttribute} instances.
 *
 * **Conversion Rules:**
 * - `class` key: Uses `HtmlAttribute.className()` with normalization
 * - `data-*` keys: Uses `HtmlAttribute.custom()` (strips `data-` prefix)
 * - Boolean `true`: Uses `HtmlAttribute.boolean()` (renders as attribute name only)
 * - Boolean `false`: Omits the attribute
 * - String values: Uses `HtmlAttribute.keyValue()`
 *
 * @param map - The attribute map to convert
 * @returns Array of HtmlAttribute instances
 *
 * @example
 * ```typescript
 * const attrs = parseAttributeMap({
 *   class: 'btn primary',
 *   id: 'submit',
 *   'data-value': '123',
 *   disabled: true,
 *   hidden: false
 * });
 * // Returns: [className('btn primary'), keyValue('id', 'submit'),
 * //           custom('value', '123'), boolean('disabled')]
 * ```
 *
 * @internal
 */
function parseAttributeMap(map: AttributeMap): HtmlAttribute[] {
  const result: HtmlAttribute[] = [];
  for (const [key, value] of Object.entries(map)) {
    if (typeof value === 'boolean') {
      if (value) {
        result.push(HtmlAttribute.boolean(key as BooleanAttributeKey));
      }
      // false → omit
    } else if (key === 'class') {
      result.push(HtmlAttribute.className(value));
    } else if (key.startsWith('data-')) {
      result.push(HtmlAttribute.custom(key.slice(5), value));
    } else {
      result.push(HtmlAttribute.keyValue(key as KeyValueAttributeKey | AriaAttributeKey, value));
    }
  }
  return result;
}

/**
 * Converts a {@link ChildArg} to an {@link HTMLTagProtocol} instance.
 *
 * String arguments are automatically wrapped in {@link TextType}.
 *
 * @param arg - The child argument (string or HTMLTagProtocol)
 * @returns An HTMLTagProtocol instance
 *
 * @example
 * ```typescript
 * toChild('Hello')           // → new TextType('Hello')
 * toChild(p('World'))        // → p('World') (unchanged)
 * ```
 *
 * @internal
 */
function toChild(arg: ChildArg): HTMLTagProtocol {
  if (typeof arg === 'string') {
    return new TextType(arg);
  }
  return arg;
}

/**
 * Common implementation for pair tag factory functions.
 *
 * **Argument Patterns:**
 * - No arguments: Returns empty PairType
 * - `ChildArg...`: Returns PairType with children
 * - `AttributeMap, ChildArg...`: Returns PairType with attributes and children
 *
 * @param tagType - The HTML tag type
 * @param args - Factory function arguments (attributes and/or children)
 * @returns A configured PairType instance
 *
 * @example
 * ```typescript
 * makePairTag('div', [])                           // <div></div>
 * makePairTag('div', ['Hello'])                    // <div>Hello</div>
 * makePairTag('div', [{ class: 'btn' }, 'Click'])  // <div class="btn">Click</div>
 * ```
 *
 * @internal
 */
function makePairTag(tagType: TagType, args: Array<AttributeMap | ChildArg>): PairType {
  const tag = new PairType(tagType);
  if (args.length === 0) return tag;

  let startIndex = 0;
  if (isAttributeMap(args[0])) {
    const attrs = parseAttributeMap(args[0] as AttributeMap);
    for (const attr of attrs) {
      tag.addHtmlAttribute(attr);
    }
    startIndex = 1;
  }

  for (let idx = startIndex; idx < args.length; idx++) {
    tag.addChild(toChild(args[idx] as ChildArg));
  }

  return tag;
}

/**
 * Common implementation for self-closing tag factory functions.
 *
 * **Argument Patterns:**
 * - No arguments: Returns empty SelfClosingType
 * - `AttributeMap`: Returns SelfClosingType with attributes
 *
 * @param tagType - The HTML tag type
 * @param attrs - Optional attribute map
 * @returns A configured SelfClosingType instance
 *
 * @example
 * ```typescript
 * makeSelfClosingTag('br')                              // <br>
 * makeSelfClosingTag('img', { src: 'photo.jpg' })       // <img src="photo.jpg">
 * ```
 *
 * @internal
 */
function makeSelfClosingTag(tagType: TagType, attrs?: AttributeMap): SelfClosingType {
  const tag = new SelfClosingType(tagType);
  if (attrs) {
    const attributes = parseAttributeMap(attrs);
    for (const attr of attributes) {
      tag.addHtmlAttribute(attr);
    }
  }
  return tag;
}

// ============================================================
// ペアタグファクトリ関数
// ============================================================

/**
 * Creates an `<html>` element.
 *
 * The root element of an HTML document.
 *
 * @param args - Optional attributes and child elements
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
export function html(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.html, args); }

/**
 * Creates a `<head>` element.
 *
 * Contains metadata and document-level resources.
 *
 * @param args - Optional attributes and child elements
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
export function head(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.head, args); }

/**
 * Creates a `<body>` element.
 *
 * Contains the visible content of the HTML document.
 *
 * @param args - Optional attributes and child elements
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
export function body(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.body, args); }

/**
 * Creates a `<div>` element.
 *
 * A generic container for flow content.
 *
 * @param args - Optional attributes and child elements
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
export function div(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.div, args); }

/**
 * Creates a `<p>` element.
 *
 * Represents a paragraph of text.
 *
 * @param args - Optional attributes and child elements
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
export function p(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.p, args); }

/**
 * Creates a `<span>` element.
 *
 * A generic inline container for phrasing content.
 *
 * @param args - Optional attributes and child elements
 * @returns A new PairType instance representing a `<span>` element
 *
 * @example
 * ```typescript
 * const highlighted = span({ class: 'highlight' }, 'Important text');
 * ```
 */
export function span(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.span, args); }

/**
 * Creates a `<script>` element.
 *
 * Used to embed or reference executable JavaScript code.
 *
 * @param args - Optional attributes and child elements
 * @returns A new PairType instance representing a `<script>` element
 *
 * @example
 * ```typescript
 * const inlineScript = script('console.log("Hello");');
 * const externalScript = script({ src: 'app.js' });
 * ```
 */
export function script(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.script, args); }

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

// ── テーブル ──

/** Creates a `<table>` element. */
export function table(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.table, args); }

/** Creates a `<thead>` element (table header group). */
export function thead(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.thead, args); }

/** Creates a `<tbody>` element (table body group). */
export function tbody(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.tbody, args); }

/** Creates a `<tfoot>` element (table footer group). */
export function tfoot(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.tfoot, args); }

/** Creates a `<tr>` element (table row). */
export function tr(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.tr, args); }

/** Creates a `<th>` element (table header cell). */
export function th(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.th, args); }

/** Creates a `<td>` element (table data cell). */
export function td(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.td, args); }

/** Creates a `<caption>` element (table caption). */
export function caption(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.caption, args); }

/** Creates a `<colgroup>` element (table column group). */
export function colgroup(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.colgroup, args); }

// ── リスト ──

/** Creates a `<ul>` element (unordered list). */
export function ul(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.ul, args); }

/** Creates an `<ol>` element (ordered list). */
export function ol(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.ol, args); }

/** Creates a `<li>` element (list item). */
export function li(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.li, args); }

/** Creates a `<dl>` element (description list). */
export function dl(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.dl, args); }

/** Creates a `<dt>` element (description term). */
export function dt(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.dt, args); }

/** Creates a `<dd>` element (description details). */
export function dd(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.dd, args); }

// ── フォーム ──

/** Creates a `<form>` element. */
export function form(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.form, args); }

/** Creates a `<label>` element (label for a form control). */
export function label(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.label, args); }

/** Creates a `<button>` element. */
export function button(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.button, args); }

/** Creates a `<select>` element (dropdown list). */
export function select(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.select, args); }

/** Creates an `<option>` element (option in a select list). */
export function option(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.option, args); }

/** Creates an `<optgroup>` element (group of options). */
export function optgroup(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.optgroup, args); }

/** Creates a `<textarea>` element (multi-line text input). */
export function textarea(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.textarea, args); }

/** Creates a `<fieldset>` element (group of form controls). */
export function fieldset(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.fieldset, args); }

/** Creates a `<legend>` element (caption for a fieldset). */
export function legend(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.legend, args); }

/** Creates a `<datalist>` element (predefined options for input). */
export function datalist(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.datalist, args); }

/** Creates an `<output>` element (result of a calculation). */
export function output(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.output, args); }

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

// ── メディア ──

/** Creates a `<video>` element (video player). */
export function video(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.video, args); }

/** Creates an `<audio>` element (audio player). */
export function audio(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.audio, args); }

/** Creates a `<picture>` element (responsive image container). */
export function picture(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.picture, args); }

/** Creates a `<canvas>` element (scriptable graphics). */
export function canvas(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.canvas, args); }

/** Creates an `<svg>` element (scalable vector graphics). */
export function svg(...args: Array<AttributeMap | ChildArg>): PairType { return makePairTag(TAG_TYPES.svg, args); }

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

// ============================================================
// 自己終了タグファクトリ関数（13個）
// ============================================================

/**
 * Creates a `<br>` element (line break).
 *
 * @returns A new SelfClosingType instance representing a `<br>` element
 *
 * @example
 * ```typescript
 * const lineBreak = br();
 * // Renders as: <br>
 * ```
 */
export function br(): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.br); }

/**
 * Creates an `<hr>` element (thematic break / horizontal rule).
 *
 * @returns A new SelfClosingType instance representing an `<hr>` element
 *
 * @example
 * ```typescript
 * const separator = hr();
 * // Renders as: <hr>
 * ```
 */
export function hr(): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.hr); }

/**
 * Creates an `<img>` element (image).
 *
 * @param attrs - Optional attributes (typically includes `src` and `alt`)
 * @returns A new SelfClosingType instance representing an `<img>` element
 *
 * @example
 * ```typescript
 * const image = img({ src: 'photo.jpg', alt: 'My photo' });
 * // Renders as: <img src="photo.jpg" alt="My photo">
 * ```
 */
export function img(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.img, attrs); }

/**
 * Creates an `<input>` element (form input control).
 *
 * @param attrs - Optional attributes (e.g., `type`, `name`, `value`, `placeholder`)
 * @returns A new SelfClosingType instance representing an `<input>` element
 *
 * @example
 * ```typescript
 * const textInput = input({ type: 'text', placeholder: 'Enter name' });
 * const checkbox = input({ type: 'checkbox', checked: true });
 * ```
 */
export function input(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.input, attrs); }

/**
 * Creates a `<meta>` element (metadata).
 *
 * @param attrs - Optional attributes (e.g., `charset`, `name`, `content`)
 * @returns A new SelfClosingType instance representing a `<meta>` element
 *
 * @example
 * ```typescript
 * const charset = meta({ charset: 'utf-8' });
 * const viewport = meta({ name: 'viewport', content: 'width=device-width' });
 * ```
 */
export function meta(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.meta, attrs); }

/**
 * Creates a `<link>` element (external resource link, typically CSS).
 *
 * @param attrs - Optional attributes (e.g., `rel`, `href`, `type`)
 * @returns A new SelfClosingType instance representing a `<link>` element
 *
 * @example
 * ```typescript
 * const stylesheet = link({ rel: 'stylesheet', href: 'styles.css' });
 * const icon = link({ rel: 'icon', href: 'favicon.ico' });
 * ```
 */
export function link(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.link, attrs); }

/**
 * Creates a `<source>` element (media source for `<video>`, `<audio>`, or `<picture>`).
 *
 * @param attrs - Optional attributes (e.g., `src`, `type`, `media`)
 * @returns A new SelfClosingType instance representing a `<source>` element
 *
 * @example
 * ```typescript
 * const videoSource = source({ src: 'video.mp4', type: 'video/mp4' });
 * ```
 */
export function source(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.source, attrs); }

/**
 * Creates a `<track>` element (text track for media elements).
 *
 * @param attrs - Optional attributes (e.g., `kind`, `src`, `srclang`, `label`)
 * @returns A new SelfClosingType instance representing a `<track>` element
 *
 * @example
 * ```typescript
 * const subtitles = track({ kind: 'subtitles', src: 'subs.vtt', srclang: 'en' });
 * ```
 */
export function track(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.track, attrs); }

/**
 * Creates an `<area>` element (clickable area in an image map).
 *
 * @param attrs - Optional attributes (e.g., `shape`, `coords`, `href`, `alt`)
 * @returns A new SelfClosingType instance representing an `<area>` element
 */
export function area(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.area, attrs); }

/**
 * Creates a `<col>` element (table column definition).
 *
 * @param attrs - Optional attributes (e.g., `span`)
 * @returns A new SelfClosingType instance representing a `<col>` element
 */
export function col(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.col, attrs); }

/**
 * Creates a `<base>` element (base URL for relative URLs).
 *
 * @param attrs - Optional attributes (e.g., `href`, `target`)
 * @returns A new SelfClosingType instance representing a `<base>` element
 *
 * @example
 * ```typescript
 * const baseUrl = base({ href: 'https://example.com/' });
 * ```
 */
export function base(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.base, attrs); }

/**
 * Creates an `<embed>` element (embedded external content).
 *
 * @param attrs - Optional attributes (e.g., `src`, `type`, `width`, `height`)
 * @returns A new SelfClosingType instance representing an `<embed>` element
 */
export function embed(attrs?: AttributeMap): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.embed, attrs); }

/**
 * Creates a `<wbr>` element (word break opportunity).
 *
 * @returns A new SelfClosingType instance representing a `<wbr>` element
 *
 * @example
 * ```typescript
 * const longUrl = p('https://very', wbr(), 'long', wbr(), 'url.com');
 * ```
 */
export function wbr(): SelfClosingType { return makeSelfClosingTag(TAG_TYPES.wbr); }

// ============================================================
// テキストファクトリ関数
// ============================================================

/**
 * Creates a text node.
 *
 * Text nodes are usually created automatically when passing strings to tag factories,
 * but this function can be used for explicit text node creation.
 *
 * @param content - The text content (not HTML-escaped)
 * @returns A new TextType instance
 *
 * @example
 * ```typescript
 * // Explicit text node creation
 * const text = Text('Hello World');
 *
 * // Usually, strings are auto-converted:
 * const paragraph = p('This is automatically wrapped in TextType');
 * ```
 *
 * @remarks
 * **Warning:** Text content is **not** HTML-escaped. Ensure user input is sanitized
 * before passing to this function to prevent XSS attacks.
 */
export function Text(content: string): TextType {
  return new TextType(content);
}
