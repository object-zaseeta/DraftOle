/**
 * factories-form.ts
 *
 * フォームタグファクトリ関数:
 * form, label, button, select, option, optgroup, textarea,
 * fieldset, legend, datalist, output
 *
 * Requirements: 5.1, 5.2
 */
import { makePairFactory } from './factories-utils.js';
import { TAG_TYPES } from './tag-type.js';

// ── フォーム ──

/** Creates a `<form>` element. */
export const form = makePairFactory(TAG_TYPES.form);

/** Creates a `<label>` element (label for a form control). */
export const label = makePairFactory(TAG_TYPES.label);

/** Creates a `<button>` element. */
export const button = makePairFactory(TAG_TYPES.button);

/** Creates a `<select>` element (dropdown list). */
export const select = makePairFactory(TAG_TYPES.select);

/** Creates an `<option>` element (option in a select list). */
export const option = makePairFactory(TAG_TYPES.option);

/** Creates an `<optgroup>` element (group of options). */
export const optgroup = makePairFactory(TAG_TYPES.optgroup);

/** Creates a `<textarea>` element (multi-line text input). */
export const textarea = makePairFactory(TAG_TYPES.textarea);

/** Creates a `<fieldset>` element (group of form controls). */
export const fieldset = makePairFactory(TAG_TYPES.fieldset);

/** Creates a `<legend>` element (caption for a fieldset). */
export const legend = makePairFactory(TAG_TYPES.legend);

/** Creates a `<datalist>` element (predefined options for input). */
export const datalist = makePairFactory(TAG_TYPES.datalist);

/** Creates an `<output>` element (result of a calculation). */
export const output = makePairFactory(TAG_TYPES.output);
