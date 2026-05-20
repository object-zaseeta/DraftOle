/**
 * TagGenerateProtocol: タグ生成を定義するインターフェース
 *
 * Requirements: 1.3
 */
import type { HTMLTagProtocol } from './html-tag-protocol.js';
import type { TagType } from '../tags/tag-type.js';

/**
 * HTMLタグを動的に生成するファクトリインターフェース
 *
 * このインターフェースは、タグ種別（TagType）を指定してHTMLタグインスタンスを生成する
 * ファクトリパターンの契約を定義します。
 *
 * @remarks
 * - タグ種別に応じて、PairType（開始/終了タグのペア）またはSelfClosingType（自己閉鎖タグ）が生成されます
 * - 生成されたタグは HTMLTagProtocol を実装しており、メソッドチェーンによる構築が可能です
 *
 * Preconditions: tagType は有効な TagType 値である必要があります
 * Postconditions: 生成されたタグは HTMLTagProtocol を満たします
 *
 * @example
 * ```typescript
 * class TagFactory implements TagGenerateProtocol {
 *   generateTag(tagType: TagType): HTMLTagProtocol {
 *     if (tagType === 'img' || tagType === 'br') {
 *       return new SelfClosingType(tagType);
 *     }
 *     return new PairType(tagType);
 *   }
 * }
 *
 * const factory = new TagFactory();
 * const div = factory.generateTag('div');
 * const img = factory.generateTag('img');
 * ```
 */
export interface TagGenerateProtocol {
  /**
   * 指定されたタグ種別のHTMLタグインスタンスを生成
   *
   * @param tagType - 生成するタグの種別（例: 'div', 'p', 'img'など）
   * @returns 生成されたHTMLTagProtocolを実装するインスタンス
   *
   * @remarks
   * タグ種別に応じて適切な実装クラス（PairType または SelfClosingType）のインスタンスを返します。
   * 生成されたタグは空の状態（子要素なし、属性なし）で返されます。
   *
   * @example
   * ```typescript
   * const div = generator.generateTag('div');
   * div.addChild(new TextType('Hello'));
   * console.log(div.render()); // <div>Hello</div>
   * ```
   */
  generateTag(tagType: TagType): HTMLTagProtocol;
}
