/**
 * Task 1.5: ファクトリ関数統合型定義
 *
 * Phase 2（HTMLモジュール）のファクトリ関数で使用する型定義。
 * TagAttributes: HTMLタグの属性マップ
 * TagChild: HTMLタグの子要素（タグまたは文字列）
 */
import type { HTMLTagProtocol } from '../protocols/html-tag-protocol.js';

/** HTMLタグの属性マップ */
export type TagAttributes = Record<string, string>;

/** HTMLタグの子要素（タグまたは文字列） */
export type TagChild = HTMLTagProtocol | string;
