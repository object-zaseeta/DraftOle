/**
 * factories-data.ts
 *
 * データ構造タグファクトリ関数:
 * テーブル: table, thead, tbody, tfoot, tr, th, td, caption, colgroup
 * リスト: ul, ol, li, dl, dt, dd
 *
 * Requirements: 5.1, 5.2
 */
import { PairType } from '../elements/pair-type.js';
import { makePairTag } from './factories-utils.js';
import type { AttributeMap, ChildArg } from './factories-utils.js';
import type { HtmlTagOptions } from '../elements/html-tag.js';
import { TAG_TYPES } from './tag-type.js';

// ── テーブル ──

/** Creates a `<table>` element. */
export function table(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.table, args); }

/** Creates a `<thead>` element (table header group). */
export function thead(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.thead, args); }

/** Creates a `<tbody>` element (table body group). */
export function tbody(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.tbody, args); }

/** Creates a `<tfoot>` element (table footer group). */
export function tfoot(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.tfoot, args); }

/** Creates a `<tr>` element (table row). */
export function tr(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.tr, args); }

/** Creates a `<th>` element (table header cell). */
export function th(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.th, args); }

/** Creates a `<td>` element (table data cell). */
export function td(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.td, args); }

/** Creates a `<caption>` element (table caption). */
export function caption(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.caption, args); }

/** Creates a `<colgroup>` element (table column group). */
export function colgroup(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.colgroup, args); }

// ── リスト ──

/** Creates a `<ul>` element (unordered list). */
export function ul(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.ul, args); }

/** Creates an `<ol>` element (ordered list). */
export function ol(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.ol, args); }

/** Creates a `<li>` element (list item). */
export function li(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.li, args); }

/** Creates a `<dl>` element (description list). */
export function dl(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.dl, args); }

/** Creates a `<dt>` element (description term). */
export function dt(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.dt, args); }

/** Creates a `<dd>` element (description details). */
export function dd(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.dd, args); }
