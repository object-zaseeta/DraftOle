/**
 * HTML Protocols モジュール
 *
 * このモジュールは、HTMLタグの操作、属性管理、CSS/JavaScript統合に関する
 * すべてのプロトコル（インターフェース）を提供します。
 *
 * @remarks
 * プロトコルは以下のカテゴリに分類されます:
 *
 * **コア機能:**
 * - {@link HTMLTagProtocol} - HTMLタグの基本操作
 * - {@link HtmlAttributeShape} - HTML属性の構造
 *
 * **責務分離:**
 * - {@link ChildManageable} - 子要素管理
 * - {@link AttributeManageable} - 属性管理
 *
 * **マネージャー:**
 * - {@link HtmlAttributeManagerProtocol} - 属性マネージャー
 * - {@link CssManagerType} - CSS管理
 * - {@link JQueryManagerProtocol} - jQuery管理
 *
 * **ビルダー/ファクトリ:**
 * - {@link AttributeBuilderProtocol} - 属性ビルダー
 * - {@link TagGenerateProtocol} - タグファクトリ
 *
 * @module html/protocols
 *
 * Task 1.3: HTMLタグ操作・属性管理・タグ生成・CSS/JSスタブのインターフェース
 */

// Req 1.1, 1.7: HTMLタグ共通操作（Renderable拡張）
export type { HTMLTagProtocol, HtmlAttributeShape } from './html-tag-protocol.js';

// Task 5.1, Req 4.4: 責務インターフェース
export type { ChildManageable } from './child-manageable.js';
export type { AttributeManageable } from './attribute-manageable.js';

// Req 1.2: 属性管理
export type { HtmlAttributeManagerProtocol } from './html-attribute-manager-protocol.js';

// Req 1.3: タグ生成
export type { TagGenerateProtocol } from './tag-generate-protocol.js';

// Req 1.4: CSS管理スタブ
export type { CssManagerType } from './css-manager-type.js';

// Req 1.5: jQuery管理スタブ
export type { JQueryManagerProtocol } from './jquery-manager-protocol.js';

// Req 1.6: 属性ビルダー
export type { AttributeBuilderProtocol } from './attribute-builder-protocol.js';

// CFA-A: インターフェース定義（依存方向修正）
export type { CssManagerInstance } from './css-manager-instance-type.js';
export type { JQueryManagerInstance } from './jquery-manager-instance-type.js';
export type { JQueryMethodType } from './jquery-method-type.js';
export { JQUERY_METHOD_TYPES } from './jquery-method-type.js';
