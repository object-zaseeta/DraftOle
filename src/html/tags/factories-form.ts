/**
 * factories-form.ts
 *
 * フォームタグファクトリ関数:
 * form, label, button, select, option, optgroup, textarea,
 * fieldset, legend, datalist, output
 *
 * Requirements: 5.1, 5.2
 */
import { PairType } from '../elements/pair-type.js';
import { makePairTag } from './factories-utils.js';
import type { AttributeMap, ChildArg } from './factories-utils.js';
import type { HtmlTagOptions } from '../elements/html-tag.js';
import { TAG_TYPES } from './tag-type.js';

// ── フォーム ──

/** Creates a `<form>` element. */
export function form(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.form, args); }

/** Creates a `<label>` element (label for a form control). */
export function label(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.label, args); }

/** Creates a `<button>` element. */
export function button(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.button, args); }

/** Creates a `<select>` element (dropdown list). */
export function select(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.select, args); }

/** Creates an `<option>` element (option in a select list). */
export function option(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.option, args); }

/** Creates an `<optgroup>` element (group of options). */
export function optgroup(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.optgroup, args); }

/** Creates a `<textarea>` element (multi-line text input). */
export function textarea(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.textarea, args); }

/** Creates a `<fieldset>` element (group of form controls). */
export function fieldset(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.fieldset, args); }

/** Creates a `<legend>` element (caption for a fieldset). */
export function legend(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.legend, args); }

/** Creates a `<datalist>` element (predefined options for input). */
export function datalist(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.datalist, args); }

/** Creates an `<output>` element (result of a calculation). */
export function output(...args: Array<AttributeMap | ChildArg | HtmlTagOptions>): PairType { return makePairTag(TAG_TYPES.output, args); }
