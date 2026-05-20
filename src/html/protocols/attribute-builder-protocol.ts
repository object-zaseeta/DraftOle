/**
 * AttributeBuilderProtocol: 属性ビルダーの共通インターフェース
 *
 * 要素種別に応じた属性設定を型安全に行うビルダーの契約を定義する。
 * 各メソッドは this を返し、フルエントAPIチェーンを可能にする。
 *
 * Preconditions: なし（空のビルダーも有効）
 * Postconditions: build() は設定済みの属性配列を返す
 *
 * Requirements: 1.6
 */
import type { HtmlAttributeShape } from './html-tag-protocol.js';

/**
 * HTML属性をビルダーパターンで構築するインターフェース
 *
 * このインターフェースは、HTML要素の属性を型安全かつ流暢なAPIで設定するビルダーの契約を定義します。
 * フルエントAPI（メソッドチェーン）をサポートし、複雑な属性設定を読みやすく記述できます。
 *
 * @remarks
 * サポートする属性の種類:
 * - 共通属性: id, title, lang, role, tabindex, hidden
 * - ARIA属性: aria-label, aria-hidden, aria-expanded
 * - カスタム属性: data-*など任意の属性
 * - class属性: 複数クラスの追加、条件付き追加をサポート
 *
 * すべてのメソッドは `this` を返すため、メソッドチェーンが可能です。
 * 最終的に `build()` を呼び出して、設定された属性の配列を取得します。
 *
 * Preconditions: なし（空のビルダーも有効）
 * Postconditions: build() は設定済みの属性配列を返す
 * Invariants: メソッド呼び出し順序は属性の順序に影響しない
 *
 * @example
 * ```typescript
 * const builder = new AttributeBuilder();
 * const attributes = builder
 *   .setId('my-button')
 *   .addClass('btn', 'btn-primary')
 *   .setRole('button')
 *   .setAriaLabel('Submit form')
 *   .setCustomAttribute('data-action', 'submit')
 *   .build();
 * ```
 */
export interface AttributeBuilderProtocol {
  /**
   * id属性を設定
   *
   * @param id - 要素の一意識別子
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setId('my-element');
   * ```
   */
  setId(id: string): this;

  /**
   * title属性を設定（ツールチップテキスト）
   *
   * @param title - 要素のツールチップに表示されるテキスト
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setTitle('Click to submit');
   * ```
   */
  setTitle(title: string): this;

  /**
   * lang属性を設定（要素の言語コード）
   *
   * @param lang - ISO 639-1言語コード（例: 'en', 'ja', 'fr'）
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setLang('ja');
   * ```
   */
  setLang(lang: string): this;

  /**
   * role属性を設定（ARIA役割）
   *
   * @param role - ARIA役割（例: 'button', 'navigation', 'main'）
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setRole('navigation');
   * ```
   */
  setRole(role: string): this;

  /**
   * tabindex属性を設定（タブ順序）
   *
   * @param index - タブインデックス（-1: フォーカス不可、0: 自然順、1+: 明示的順序）
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setTabindex(0); // 自然なタブ順序
   * builder.setTabindex(-1); // タブでフォーカスできないようにする
   * ```
   */
  setTabindex(index: number): this;

  /**
   * hidden属性を設定（要素の表示/非表示）
   *
   * @param hidden - true の場合、要素を非表示にする
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setHidden(true); // 要素を非表示
   * ```
   */
  setHidden(hidden: boolean): this;

  /**
   * カスタム属性を設定（data-*など任意の属性）
   *
   * @param name - 属性名（例: 'data-user-id', 'data-action'）
   * @param value - 属性値
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setCustomAttribute('data-user-id', '12345');
   * builder.setCustomAttribute('data-action', 'submit');
   * ```
   */
  setCustomAttribute(name: string, value: string): this;

  /**
   * aria-label属性を設定（スクリーンリーダー用ラベル）
   *
   * @param label - アクセシビリティラベル
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setAriaLabel('Close dialog');
   * ```
   */
  setAriaLabel(label: string): this;

  /**
   * aria-hidden属性を設定（スクリーンリーダーから隠す）
   *
   * @param hidden - true の場合、スクリーンリーダーから隠す
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setAriaHidden(true); // スクリーンリーダーから隠す
   * ```
   */
  setAriaHidden(hidden: boolean): this;

  /**
   * aria-expanded属性を設定（展開状態を示す）
   *
   * @param expanded - true の場合、要素が展開されていることを示す
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.setAriaExpanded(true); // メニューが展開されている
   * ```
   */
  setAriaExpanded(expanded: boolean): this;

  /**
   * クラス名を1つまたは複数追加
   *
   * @param classNames - 追加するクラス名（可変長引数）
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * builder.addClass('btn');
   * builder.addClass('btn', 'btn-primary', 'btn-lg');
   * ```
   */
  addClass(...classNames: string[]): this;

  /**
   * クラス名の配列を追加
   *
   * @param classNames - 追加するクラス名の配列
   * @returns メソッドチェーンのため、this を返す
   *
   * @example
   * ```typescript
   * const classes = ['btn', 'btn-primary', 'btn-lg'];
   * builder.addClasses(classes);
   * ```
   */
  addClasses(classNames: string[]): this;

  /**
   * 条件付きでクラス名を追加
   *
   * @param className - 追加するクラス名
   * @param condition - true の場合のみクラスを追加
   * @returns メソッドチェーンのため、this を返す
   *
   * @remarks
   * 条件に応じてクラスを動的に追加する場合に便利です。
   *
   * @example
   * ```typescript
   * const isActive = true;
   * const isDisabled = false;
   * builder
   *   .addClassWhen('active', isActive)   // 'active' が追加される
   *   .addClassWhen('disabled', isDisabled); // 追加されない
   * ```
   */
  addClassWhen(className: string, condition: boolean): this;

  /**
   * クラス名と条件のマップから、条件が true のクラスを追加
   *
   * @param classMap - クラス名をキー、条件を値とするオブジェクト
   * @returns メソッドチェーンのため、this を返す
   *
   * @remarks
   * 複数の条件付きクラスを一度に設定する場合に便利です。
   *
   * @example
   * ```typescript
   * builder.addClassesToggle({
   *   'active': isActive,      // isActive が true なら 'active' を追加
   *   'disabled': isDisabled,  // isDisabled が true なら 'disabled' を追加
   *   'selected': isSelected   // isSelected が true なら 'selected' を追加
   * });
   * ```
   */
  addClassesToggle(classMap: Record<string, boolean>): this;

  /**
   * 設定された属性を HtmlAttributeShape の配列として構築
   *
   * @returns 設定された属性の配列
   *
   * @remarks
   * このメソッドを呼び出すことで、ビルダーに設定されたすべての属性を
   * HtmlAttributeShape の配列として取得できます。
   * 通常、これはHTML要素の構築の最終ステップで呼び出されます。
   *
   * @example
   * ```typescript
   * const attributes = builder
   *   .setId('my-button')
   *   .addClass('btn', 'btn-primary')
   *   .setRole('button')
   *   .build();
   *
   * // attributes は HtmlAttributeShape[] 型
   * attributes.forEach(attr => {
   *   console.log(attr.renderAttribute());
   * });
   * ```
   */
  build(): HtmlAttributeShape[];
}
