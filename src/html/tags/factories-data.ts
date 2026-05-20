/**
 * factories-data.ts
 *
 * データ構造タグファクトリ関数:
 * テーブル: table, thead, tbody, tfoot, tr, th, td, caption, colgroup
 * リスト: ul, ol, li, dl, dt, dd
 *
 * Requirements: 5.1, 5.2
 */
import { makePairFactory } from './factories-utils.js';
import { TAG_TYPES } from './tag-type.js';

// ── テーブル ──

/** Creates a `<table>` element. */
export const table = makePairFactory(TAG_TYPES.table);

/** Creates a `<thead>` element (table header group). */
export const thead = makePairFactory(TAG_TYPES.thead);

/** Creates a `<tbody>` element (table body group). */
export const tbody = makePairFactory(TAG_TYPES.tbody);

/** Creates a `<tfoot>` element (table footer group). */
export const tfoot = makePairFactory(TAG_TYPES.tfoot);

/** Creates a `<tr>` element (table row). */
export const tr = makePairFactory(TAG_TYPES.tr);

/** Creates a `<th>` element (table header cell). */
export const th = makePairFactory(TAG_TYPES.th);

/** Creates a `<td>` element (table data cell). */
export const td = makePairFactory(TAG_TYPES.td);

/** Creates a `<caption>` element (table caption). */
export const caption = makePairFactory(TAG_TYPES.caption);

/** Creates a `<colgroup>` element (table column group). */
export const colgroup = makePairFactory(TAG_TYPES.colgroup);

// ── リスト ──

/** Creates a `<ul>` element (unordered list). */
export const ul = makePairFactory(TAG_TYPES.ul);

/** Creates an `<ol>` element (ordered list). */
export const ol = makePairFactory(TAG_TYPES.ol);

/** Creates a `<li>` element (list item). */
export const li = makePairFactory(TAG_TYPES.li);

/** Creates a `<dl>` element (description list). */
export const dl = makePairFactory(TAG_TYPES.dl);

/** Creates a `<dt>` element (description term). */
export const dt = makePairFactory(TAG_TYPES.dt);

/** Creates a `<dd>` element (description details). */
export const dd = makePairFactory(TAG_TYPES.dd);
