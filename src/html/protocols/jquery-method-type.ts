/**
 * jQuery method types supported by DraftOle
 *
 * 依存方向: html/protocols/ が定義を所有し、js/ が実装する。
 */

export type JQueryMethodType =
  | 'css'
  | 'height'
  | 'on'
  | 'text'
  | 'html'
  | 'addClass'
  | 'removeClass'
  | 'toggleClass';

export const JQUERY_METHOD_TYPES: readonly JQueryMethodType[] = [
  'css',
  'height',
  'on',
  'text',
  'html',
  'addClass',
  'removeClass',
  'toggleClass',
] as const;
