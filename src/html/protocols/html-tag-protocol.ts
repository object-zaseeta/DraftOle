/**
 * HTMLTagProtocol: HTMLタグの共通操作を定義する複合インターフェース
 *
 * Phase 1の Renderable を拡張し、HTMLタグ固有の操作を追加する。
 * CSS/JS機能はスタブとして定義し、Phase 3/4で具象化する。
 *
 * Task 5.1: ChildManageable と AttributeManageable を継承して責務を明確化
 *
 * Requirements: 1.1, 1.7, 4.4
 */
import type { Renderable } from '../../utils/renderable.js';
import type { TagType } from '../tags/tag-type.js';
import type { HtmlAttributeValue } from '../attributes/attribute-keys.js';
import type { ChildManageable } from './child-manageable.js';
import type { AttributeManageable } from './attribute-manageable.js';
import type { RenderContext } from '../elements/render-context.js';

/**
 * HTML属性の構造を定義する型
 *
 * このインターフェースは、HTML属性の最小限の形状を定義します。
 * 具象クラス（HtmlAttribute）は Task 2.1 で実装されます。
 *
 * @remarks
 * HTMLTagProtocol が参照する属性の契約を定義し、
 * 属性のキー、値、およびレンダリング機能を提供します。
 *
 * @example
 * ```typescript
 * class HtmlAttribute implements HtmlAttributeShape {
 *   constructor(
 *     readonly key: string,
 *     readonly attributeValue: HtmlAttributeValue
 *   ) {}
 *
 *   renderAttribute(): string {
 *     return `${this.key}="${this.attributeValue}"`;
 *   }
 * }
 *
 * const attr = new HtmlAttribute('id', 'test-id');
 * console.log(attr.renderAttribute()); // 'id="test-id"'
 * ```
 */
export interface HtmlAttributeShape {
  /**
   * 属性のキー名（例: 'id', 'class', 'href'）
   */
  readonly key: string;

  /**
   * 属性の値（文字列、数値、ブール値など）
   */
  readonly attributeValue: HtmlAttributeValue;

  /**
   * 属性をHTML文字列としてレンダリング
   *
   * @returns HTML形式の属性文字列（例: `id="test"`）
   *
   * @remarks
   * 属性のキーと値を `key="value"` 形式の文字列に変換します。
   * ブール属性（例: hidden, disabled）の場合は、値の有無に応じて処理されます。
   *
   * @example
   * ```typescript
   * const idAttr = new HtmlAttribute('id', 'my-id');
   * console.log(idAttr.renderAttribute()); // 'id="my-id"'
   *
   * const classAttr = new HtmlAttribute('class', 'btn btn-primary');
   * console.log(classAttr.renderAttribute()); // 'class="btn btn-primary"'
   * ```
   */
  renderAttribute(): string;
}

/**
 * HTMLタグの共通操作インターフェース
 *
 * Renderable, ChildManageable, AttributeManageable を継承し、
 * タグ種別とレンダリング機能を追加する。
 *
 * @remarks
 * このインターフェースは、責務の明確化のため以下の3つのインターフェースを継承します:
 * - Renderable: レンダリング基本機能
 * - ChildManageable: 子要素管理
 * - AttributeManageable: 属性管理
 *
 * Preconditions: tagType は有効な TagType 値
 * Postconditions: render()/protoRender() は有効な HTML 文字列を返す
 * Invariants: children の順序は追加順に保持
 */
export interface HTMLTagProtocol extends Renderable, ChildManageable, AttributeManageable {
  /**
   * HTMLタグの種別（例: 'div', 'p', 'span'）
   */
  readonly tagType: TagType;

  /**
   * フォーマット済みHTML文字列を生成
   *
   * @returns インデント・改行を含む整形済みHTML
   *
   * @remarks
   * protoRender() の出力を HTMLFormatter で整形して返します。
   */
  render(): string;

  /**
   * ミニファイ（最小化）されたHTML文字列を生成
   *
   * @returns インデント・改行を含まないHTML
   *
   * @remarks
   * タグ、属性、子要素を連結したHTML文字列を返します。
   * render() メソッドはこの出力を整形して返します。
   */
  protoRender(ctx?: RenderContext): string;
}
