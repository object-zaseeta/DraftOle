/**
 * HtmlTag 抽象基底クラス
 *
 * 全タグ共通のレンダリングロジックと属性管理を集約する。
 * HTMLTagProtocol を実装し、サブクラス（Root, PairType, SelfClosingType, TextType）の
 * 共通動作を提供する。
 *
 * レンダリングフロー:
 *   render() → protoRender() → HTMLFormatter.format()
 *
 * Task 0.2: CssManagerInstance をコンポジションで保持。
 *   collectCssStyleString() は this._css.render() に委譲する。
 *
 * Requirements: 6.1, 6.2, 6.7
 */
import type { HTMLTagProtocol, HtmlAttributeShape } from '../protocols/html-tag-protocol.js';
import type { CssManagerType } from '../protocols/css-manager-type.js';
import type { JQueryManagerProtocol } from '../protocols/jquery-manager-protocol.js';
import type { CssManagerInstance } from '../protocols/css-manager-instance-type.js';
import { HtmlStyle } from '../../css/style/html-style.js';
import type { FlexOptions } from '../../css/style/flex/css-flex.js';
import type { GridOptions } from '../../css/style/grid/css-grid.js';
import type { FontOptions } from '../../css/style/font/css-font.js';
import type { BorderOptions } from '../../css/style/border/css-border.js';
import type { BackgroundOptions } from '../../css/style/background/css-background.js';
import { PseudoStyleBuilder } from '../../css/style/pseudo/pseudo-style-builder.js';
import type { EdgeSet } from '../../css/constants/edge-set.js';
import type { BreakpointStyles } from '../../css/constants/breakpoints.js';
import { createDefaultRenderContext, type RenderContext } from './render-context.js';
import type { IdentifierResolver } from '../../css/utils/identifier-resolver.js';
import { resolveEachFactories } from './each-factory-resolver.js';
import type { TagType } from '../tags/tag-type.js';
import { SELF_CLOSING_TAGS } from '../tags/tag-type.js';
import { HTMLFormatter } from '../utils/html-formatter.js';
import type { JQueryMethodType } from '../protocols/jquery-method-type.js';
import type { JQueryManagerInstance } from '../protocols/jquery-manager-instance-type.js';
import { resolveHtmlTagDependencies } from '../../composition-root.js';
import type { VanillaCommand } from '../../js/vanilla/commands.js';
import type { VanillaScope } from '../../js/vanilla/vanilla-script-builder.js';
import { applyElementMixin } from '../../js/vanilla/element-methods.js';
import type { ElementMethods } from '../../js/vanilla/element-methods.js';
import type { StyleTemplate } from '../../css/variables/style-template.js';
import { applyFrame } from './_internal/frame-options.js';
import { applyResponsive } from './_internal/breakpoint-applier.js';
import {
  flushPendingStyleTemplates,
  decideScopeClasses,
  rewriteDeferredSelfTargets,
  flushPostEach,
} from './_internal/proto-render-pipeline.js';
import { collectCss } from './_internal/css-collector.js';
import { collectJs } from './_internal/js-collector.js';
import { collectUsedMethods as collectUsedMethodsHelper } from './_internal/used-methods-collector.js';

/**
 * HtmlTag コンストラクタのオプション引数。
 * テスト時に CssManager / JQueryManager をモック注入するために使用。
 */
export interface HtmlTagOptions {
  css?: CssManagerInstance;
  jqm?: JQueryManagerInstance;
}

/**
 * `.frame()` 修飾子のオプション型。
 *
 * 各プロパティは省略可能。省略されたプロパティは既存の設定値を変更しない。
 *
 * 変換ルール:
 * - `number` → `{n}px`
 * - `Infinity` (maxWidth / maxHeight のみ) → `'100%'`
 * - `string` → そのまま CSS 値として使用
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export interface FrameOptions {
  width?:     number | string;
  height?:    number | string;
  minWidth?:  number | string;
  maxWidth?:  number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
}

/**
 * Abstract base class for all HTML elements.
 *
 * This class provides the common rendering logic and attribute/child management
 * for all HTML tag types. It implements {@link HTMLTagProtocol}, {@link CssManagerType},
 * and {@link JQueryManagerProtocol}.
 *
 * **Rendering Flow:**
 * - `render()` → `protoRender()` → `HTMLFormatter.format()`
 *
 * **Composition Pattern:**
 * - CSS management is delegated to {@link CssManagerInstance}
 * - JavaScript/jQuery management is delegated to {@link JQueryManagerInstance}
 *
 * **Subclasses:**
 * - {@link Root} - Document root element
 * - {@link PairType} - Elements with opening and closing tags (e.g., `<div>...</div>`)
 * - {@link SelfClosingType} - Self-closing elements (e.g., `<br>`)
 * - {@link TextType} - Text nodes
 *
 * @example
 * ```typescript
 * // Typically used through factory functions, not instantiated directly
 * const element = div(
 *   p('Hello'),
 *   span('World')
 * );
 * console.log(element.render());
 * ```
 *
 * @remarks
 * **Preconditions:** tagType must be a valid {@link TagType} value
 *
 * **Postconditions:** `render()`/`protoRender()` return valid HTML strings
 *
 * **Invariants:** Children order is preserved in insertion order
 */
// applyElementMixin で実体メソッドを動的に注入する mixin パターン。型側は同一モジュール末尾の `interface HtmlTag extends ElementMethods<HtmlTag>` で表現する。
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export abstract class HtmlTag implements HTMLTagProtocol, CssManagerType, JQueryManagerProtocol {
  /**
   * The HTML tag type (e.g., 'div', 'p', 'span').
   */
  readonly tagType: TagType;

  /**
   * Child elements managed by this tag.
   * @internal
   */
  protected _children: HTMLTagProtocol[] = [];

  /**
   * HTML attributes managed by this tag.
   * @internal
   */
  protected _attributes: HtmlAttributeShape[] = [];

  /**
   * CSS manager instance (composition pattern).
   * @internal
   */
  private _css: CssManagerInstance;

  /**
   * jQuery manager instance (composition pattern).
   * @internal
   */
  private _jqm: JQueryManagerInstance;

  /**
   * 遅延解決モデル用の未フラッシュ DOM 操作コマンドバッファ。
   *
   * `Root.addChild(this)` 以前に要素ビルダメソッド（`on` / `setText` 等）から
   * 積まれた {@link VanillaCommand} を保持する。`FlushOrchestrator.flush()` が
   * 呼ばれた時点で `_scope._append` に転送し、本配列は空になる。
   *
   * Requirements: 1.6, 1.7, 1.8 (unified-element-api)
   * Design: 遅延解決モデル / PendingBuffer
   *
   * @internal
   */
  _pending: VanillaCommand[] = [];

  /**
   * each-modifier-css-extraction: bind-each コマンドの永続スナップショット。
   *
   * `_pending` 内 bind-each は protoRender 後に `_scope` へ転送されて `_pending`
   * から消えるため、CSS 収集 phase（`collectCssStyleString`）に到達した時点では
   * 参照不能になる。本配列は bind-each コマンドの参照を append-only で保持し、
   * 後段の CSS 収集が templateRoot を辿れるようにする。
   *
   * @internal
   */
  _eachTemplateSnapshots: VanillaCommand[] = [];

  /**
   * element-methods.ts の `appendChild` で追加された子 `HtmlTag` 群。
   *
   * `addChild` を経由しない `.appendChild(child)` 呼び出しは `_children` に
   * 追加されないが、each テンプレート factory コード生成時には子要素ツリーが
   * 必要になる。本配列はその目的（factory コード生成）専用の追跡バッファ。
   *
   * @internal
   */
  _appendedChildren: HtmlTag[] = [];

  /**
   * `css` 属性経由で受理した {@link StyleTemplate} 群の未フラッシュバッファ。
   *
   * `applyAttributeMap` 経路（あるいは `addStyleTemplates`）で push 順に保持され、
   * **この時点では `CssManager` には流さない**。tagPath が確定する render 時
   * （Task 3.4）に初めて `_css.registerTemplate(tpl, ...)` へ転送される。
   *
   * Requirements: 1.1, 1.4
   * Design: 遅延解決モデル / `_pendingStyleTemplates`
   *
   * @internal
   */
  _pendingStyleTemplates: StyleTemplate[] = [];

  // ── ElementMixin（unified-element-api）──
  // 実装は applyElementMixin(HtmlTag.prototype) で差し込まれる。
  // 型は同一ファイル内の `interface HtmlTag extends ElementMethods<HtmlTag>` 宣言マージで
  // 伝播させる（バンドル後の dist/index.d.ts にも保持される）。

  /**
   * フラッシュ済み要素が保持する {@link VanillaScope} 参照。
   *
   * `undefined` の間は未登録（バッファ経路）、`VanillaScope` 値が入った後は
   * 以降の要素ビルダメソッド呼び出しが即時 `_append` される。
   *
   * Requirements: 1.6, 1.7 (unified-element-api)
   * Design: 遅延解決モデル / FlushOrchestrator
   *
   * @internal
   */
  _scope: VanillaScope | undefined = undefined;

  /**
   * Creates a new HtmlTag instance.
   *
   * @param tagType - The HTML tag type
   * @param options - Optional DI options for injecting CssManager/JQueryManager (mainly for testing)
   */
  constructor(tagType: TagType, options?: HtmlTagOptions) {
    this.tagType = tagType;
    const resolved = resolveHtmlTagDependencies(options);
    this._css = resolved.css;
    this._jqm = resolved.jqm;
  }

  // ── CSS コンポジション ──

  /**
   * Gets the CSS manager for this element.
   *
   * @returns The {@link CssManagerInstance} for managing CSS styles
   *
   * @example
   * ```typescript
   * const element = div();
   * element.css.addRule('.my-class', { color: 'red' });
   * ```
   */
  get css(): CssManagerInstance {
    return this._css;
  }

  /**
   * Shortcut to HtmlStyle (3-level chain: element.style.font.setFontSize()).
   * Equivalent to element.css.styleManager.style.
   */
  get style(): HtmlStyle {
    return this._css.styleManager.style as HtmlStyle;
  }

  // ── Fluent CSS メソッド (D-3.1) ──
  // SwiftUIライクな1段階チェーン: element.padding('24px').background('#fff')

  padding(v: string): this;
  padding(v: number): this;
  padding(edge: EdgeSet, v: number): this;
  padding(vOrEdge: string | number, v?: number): this {
    if (typeof vOrEdge === 'number') {
      // 全方向 {n}px
      this.style.spacing.setPadding(`${vOrEdge}px`);
    } else if (typeof vOrEdge === 'string' && v !== undefined) {
      // エッジセット指定
      const px = `${v}px`;
      switch (vOrEdge as EdgeSet) {
        case 'horizontal':
          this.style.spacing.setPaddingLeft(px);
          this.style.spacing.setPaddingRight(px);
          break;
        case 'vertical':
          this.style.spacing.setPaddingTop(px);
          this.style.spacing.setPaddingBottom(px);
          break;
        case 'top':
          this.style.spacing.setPaddingTop(px);
          break;
        case 'right':
          this.style.spacing.setPaddingRight(px);
          break;
        case 'bottom':
          this.style.spacing.setPaddingBottom(px);
          break;
        case 'left':
          this.style.spacing.setPaddingLeft(px);
          break;
      }
    } else {
      // 既存: padding(string) 後方互換
      this.style.spacing.setPadding(vOrEdge as string);
    }
    return this;
  }
  paddingTop(v: string): this { this.style.spacing.setPaddingTop(v); return this; }
  paddingRight(v: string): this { this.style.spacing.setPaddingRight(v); return this; }
  paddingBottom(v: string): this { this.style.spacing.setPaddingBottom(v); return this; }
  paddingLeft(v: string): this { this.style.spacing.setPaddingLeft(v); return this; }
  margin(v: string): this { this.style.spacing.setMargin(v); return this; }
  marginTop(v: string): this { this.style.spacing.setMarginTop(v); return this; }
  marginRight(v: string): this { this.style.spacing.setMarginRight(v); return this; }
  marginBottom(v: string): this { this.style.spacing.setMarginBottom(v); return this; }
  marginLeft(v: string): this { this.style.spacing.setMarginLeft(v); return this; }
  background(v: string | BackgroundOptions): this { this.style.backgroundColor.setBackground(v); return this; }
  backgroundColor(v: string): this { this.style.backgroundColor.setBackgroundColor(v); return this; }
  color(v: string): this { this.style.font.setColor(v); return this; }
  foregroundStyle(v: string): this { this.style.font.setColor(v); return this; }
  fontSize(v: string): this { this.style.font.setFontSize(v); return this; }
  fontWeight(v: string): this { this.style.font.setFontWeight(v); return this; }
  fontFamily(v: string): this { this.style.font.setFontFamily(v); return this; }
  lineHeight(v: string): this { this.style.font.setLineHeight(v); return this; }
  cornerRadius(v: string): this { this.style.border.setBorderRadius(v); return this; }
  display(v: string): this { this.style.position.setDisplay(v); return this; }
  width(v: string): this { this.style.position.setWidth(v); return this; }
  height(v: string): this { this.style.position.setHeight(v); return this; }
  minWidth(v: string): this { this.style.position.setMinWidth(v); return this; }
  minHeight(v: string): this { this.style.position.setMinHeight(v); return this; }
  maxWidth(v: string): this { this.style.position.setMaxWidth(v); return this; }
  maxHeight(v: string): this { this.style.position.setMaxHeight(v); return this; }
  textAlign(v: string): this { this.style.text.setTextAlign(v); return this; }
  textDecoration(v: string): this { this.style.text.setTextDecoration(v); return this; }
  overflow(v: string): this { this.style.visual.setOverflow(v); return this; }
  opacity(v: string): this { this.style.visual.setOpacity(v); return this; }
  boxShadow(v: string): this { this.style.visual.setBoxShadow(v); return this; }
  gap(v: string): this { this.style.flex.setGap(v); return this; }
  flexGrow(v: string): this { this.style.flex.setFlexGrow(v); return this; }
  flex(v: string): this;
  flex(options?: FlexOptions): this;
  flex(v?: string | FlexOptions): this {
    if (typeof v === 'string') { this.style.flex.setFlexValue(v); } else { this.style.flex.setFlex(v); }
    return this;
  }
  grid(options?: GridOptions): this { this.style.grid.setGrid(options); return this; }
  font(options?: FontOptions): this { this.style.font.setFont(options); return this; }
  border(options?: BorderOptions): this { this.style.border.setBorder(options); return this; }
  hover(configure: (s: PseudoStyleBuilder) => void): this {
    const b = new PseudoStyleBuilder(); configure(b); this.style.pseudo.setHover(b); return this;
  }
  focus(configure: (s: PseudoStyleBuilder) => void): this {
    const b = new PseudoStyleBuilder(); configure(b); this.style.pseudo.setFocus(b); return this;
  }
  active(configure: (s: PseudoStyleBuilder) => void): this {
    const b = new PseudoStyleBuilder(); configure(b); this.style.pseudo.setActive(b); return this;
  }

  /**
   * ブレークポイントごとのスタイルをメディアクエリとして登録する。
   *
   * - 名前付きキー（'sm' / 'md' / 'lg' / 'xl'）は `Breakpoints` 定数で数値に解決する
   * - 数値キーはそのままブレークポイント（px 値）として使用する
   * - 各ブレークポイントの CSS プロパティを `this._css.addMediaRule(bp, props)` に渡す
   * - `renderCss()` 出力の末尾に `@media (min-width: {bp}px) { .{scopedClass} { ... } }` ブロックが追加される
   *
   * @example
   * ```typescript
   * div()
   *   .responsive({ md: { padding: '16px' }, xl: { fontSize: '18px' } })
   * ```
   *
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
   */
  responsive(options: BreakpointStyles): this {
    applyResponsive(this, options);
    return this;
  }

  /**
   * 条件付き修飾子。`condition` が `true` のとき `modifier(this)` を呼び出し、
   * `false` のときは modifier を呼び出さず `this` をそのまま返す。
   *
   * modifier が `null` / `undefined` を返した場合は元の要素（`this`）を返す。
   *
   * @example
   * ```typescript
   * div()
   *   .if(isActive, el => el.background('#f00'))
   *   .padding('16px')
   * ```
   *
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
   */
  if<T extends HtmlTag>(
    this: T,
    condition: boolean,
    modifier: (el: T) => T | null | undefined,
  ): T {
    if (!condition) return this;
    return modifier(this) ?? this;
  }

  /**
   * 幅・高さ・最小/最大サイズを1つのメソッド呼び出しで設定する。
   *
   * - `number` → `{n}px` に変換する
   * - `Infinity` → `'100%'` に変換する（maxWidth / maxHeight のみ）
   * - `string` → そのまま CSS 値として使用する
   * - 省略されたプロパティは既存の設定値を変更しない
   *
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
   *
   * @param options - 設定するフレームオプション
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * div().frame({ width: 700, maxWidth: Infinity })
   * // → width:700px; max-width:100%
   * ```
   */
  frame(options: FrameOptions): this {
    applyFrame(this, options);
    return this;
  }

  // ── JS コンポジション ──

  /**
   * Gets the jQuery manager for this element.
   *
   * @returns The {@link JQueryManagerInstance} for managing JavaScript/jQuery operations
   *
   * @example
   * ```typescript
   * const element = div();
   * element.jqm.on('click', () => console.log('Clicked!'));
   * ```
   */
  get jqm(): JQueryManagerInstance {
    return this._jqm;
  }

  // ── 子要素管理 ──

  /**
   * Gets the child elements of this tag.
   *
   * @returns Read-only array of child elements
   */
  get children(): ReadonlyArray<HTMLTagProtocol> {
    return this._children;
  }

  /**
   * Adds a child element to this tag.
   *
   * @param child - The child element to add
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const container = div();
   * container.addChild(p('Hello'));
   * container.addChild(span('World'));
   * ```
   */
  addChild(child: HTMLTagProtocol): this {
    this._children.push(child);
    // DF-2: 子要素の tagPath を自動設定（スコープCSS用）
    if (child instanceof HtmlTag) {
      const index = this._children.length - 1;
      const parentPath = this._css.tagPath || this.tagType;
      const childPath = `${parentPath}>${child.tagType}[${index}]`;
      child._css.updateTagPath(childPath);
      // 孫にも再帰的に伝播
      child._propagateTagPaths();
    }
    return this;
  }

  /** @internal */
  _propagateTagPaths(): void {
    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];
      if (child instanceof HtmlTag) {
        const parentPath = this._css.tagPath || this.tagType;
        const childPath = `${parentPath}>${child.tagType}[${i}]`;
        child._css.updateTagPath(childPath);
        child._propagateTagPaths();
      }
    }
  }

  /**
   * Adds multiple child elements to this tag.
   *
   * @param children - Array of child elements to add
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const container = div();
   * container.addChildren([
   *   p('First paragraph'),
   *   p('Second paragraph')
   * ]);
   * ```
   */
  addChildren(children: ReadonlyArray<HTMLTagProtocol>): this {
    for (const child of children) {
      this.addChild(child);
    }
    return this;
  }

  // ── 属性管理 ──

  /**
   * Gets the HTML attributes of this tag.
   *
   * @returns Read-only array of HTML attributes
   */
  get attributes(): ReadonlyArray<HtmlAttributeShape> {
    return this._attributes;
  }

  /**
   * Adds an HTML attribute to this tag.
   *
   * @param attribute - The attribute to add
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * const element = div();
   * element.addHtmlAttribute(HtmlAttribute.className('container'));
   * element.addHtmlAttribute(HtmlAttribute.keyValue('id', 'main'));
   * ```
   */
  addHtmlAttribute(attribute: HtmlAttributeShape): this {
    this._attributes.push(attribute);
    return this;
  }

  /**
   * `css` 属性由来の {@link StyleTemplate} 群を `_pendingStyleTemplates` に
   * push 順を保持して追加する。
   *
   * **重要**：本メソッドは保持のみを行い、`CssManager` への登録は行わない。
   * tagPath が確定する render フェーズ（Task 3.4）で `_css.registerTemplate`
   * へ転送される。
   *
   * Requirements: 1.1, 1.4
   *
   * @param tpls - 追加する StyleTemplate の配列（順序保持）
   * @returns This instance for method chaining
   */
  addStyleTemplates(tpls: StyleTemplate[]): this {
    for (const tpl of tpls) {
      this._pendingStyleTemplates.push(tpl);
    }
    return this;
  }

  /**
   * Renders all attributes as an HTML string.
   *
   * @returns A space-prefixed string of attributes, or empty string if no attributes
   *
   * @example
   * ```typescript
   * // Returns: ' class="btn" id="submit"'
   * const element = div({ class: 'btn', id: 'submit' });
   * console.log(element.renderAttributes());
   * ```
   */
  renderAttributes(): string {
    if (this._attributes.length === 0) return '';
    return ' ' + this._attributes.map(a => a.renderAttribute()).join(' ');
  }

  // ── レンダリング ──

  /**
   * Renders the element as a minified HTML string (without formatting).
   *
   * This method generates the raw HTML output based on the tag type:
   * - **root**: Concatenates child elements (no tag wrapper)
   * - **text**: Returns content as-is (overridden in {@link TextType})
   * - **selfClosing**: Returns `<tag attrs>` format
   * - **pair**: Returns `<tag attrs>children</tag>` format
   *
   * @returns Minified HTML string
   *
   * @remarks
   * This method is typically called internally by {@link render}.
   * Use {@link render} for formatted output.
   */
  protoRender(ctx?: RenderContext): string {
    // Task 3.1: ctx 省略時はデフォルト RenderContext を内部生成して旧挙動互換とする。
    // Task 3.2: 子要素 protoRender(ctx) に必ず ctx を伝搬する（Task 3.4 で resolver 利用に置き換える）
    const renderCtx: RenderContext = ctx ?? createDefaultRenderContext();

    const tagName = this.tagType;

    // root: 子要素の protoRender(ctx) を連結（Root自身のタグは出力しない）
    if (tagName === 'root') {
      return this._children.map(c => c.protoRender(renderCtx)).join('');
    }

    // text: サブクラス（TextType）で override する
    // デフォルトでは空文字列を返す
    if (tagName === 'text') {
      return '';
    }

    // Task 3.3: protoRender 補助 4 段の helper 委譲。
    //
    // 呼び出し順序は design.md "System Flows" の固定順序に従う:
    //   1. _pendingStyleTemplates → CssManager.registerTemplate 転送
    //   2. scope-class 自動付与（id 未指定 + bindings / hasCss を判定し _attributes へ class を追記）
    //   3. deferred-self ターゲットを id/class セレクタに in-place 書き換え + _scope 転送
    //   4. each-factory の factoryCode を render-phase で確定（resolveEachFactories）
    //   5. bind-each (factoryCode 確定済み) を _eachTemplateSnapshots に snapshot し _scope へ転送
    //
    // Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 3.1, 3.3, 3.4, 3.5, 6.3, 6.4
    const templateClassNames = flushPendingStyleTemplates(this, renderCtx);
    const result = decideScopeClasses(this, renderCtx, templateClassNames);
    void result;
    rewriteDeferredSelfTargets(this, renderCtx);
    resolveEachFactories(this, renderCtx);
    flushPostEach(this);

    const attrs = this.renderAttributes();

    // selfClosing: <tag attrs>
    if (SELF_CLOSING_TAGS.has(tagName)) {
      return `<${tagName}${attrs}>`;
    }

    // pair: <tag attrs>children</tag>
    // Task 3.2: 子要素 protoRender に ctx を必ず伝搬する
    const childrenHtml = this._children.map(c => c.protoRender(renderCtx)).join('');
    return `<${tagName}${attrs}>${childrenHtml}</${tagName}>`;
  }

  /**
   * Renders the element as a formatted HTML string.
   *
   * This method applies HTML formatting (indentation, line breaks) to the
   * minified output from {@link protoRender}.
   *
   * @returns Formatted HTML string
   *
   * @example
   * ```typescript
   * const element = div(
   *   p('Hello'),
   *   p('World')
   * );
   * console.log(element.render());
   * // Output:
   * // <div>
   * //   <p>Hello</p>
   * //   <p>World</p>
   * // </div>
   * ```
   */
  render(): string {
    const minified = this.protoRender();
    return HTMLFormatter.format(minified);
  }

  // ── CSS/JS (コンポジションパターン委譲) ──

  /**
   * Recursively collects CSS style strings from this element and its descendants.
   *
   * 実装は `_internal/css-collector.ts` の {@link collectCss} 純関数に委譲する。
   *
   * @param resolver - optional minify-aware identifier resolver
   * @returns Concatenated CSS string from this element and all descendants
   */
  collectCssStyleString(resolver?: IdentifierResolver): string {
    return collectCss(this, resolver);
  }

  /**
   * Recursively collects JavaScript content from this element and its descendants.
   *
   * 実装は `_internal/js-collector.ts` の {@link collectJs} 純関数に委譲する。
   *
   * @returns Concatenated JavaScript string (separated by `;\n`)
   *
   * @example
   * ```typescript
   * const element = div();
   * element.jqm.on('click', () => console.log('Clicked'));
   * const js = element.collectJsContent();
   * ```
   */
  collectJsContent(): string {
    return collectJs(this);
  }

  /**
   * Recursively collects jQuery method types used by this element and its descendants.
   *
   * This is used for tree-shaking to include only the necessary jQuery helper functions.
   *
   * 実装は `_internal/used-methods-collector.ts` の {@link collectUsedMethodsHelper}
   * （helper export 名 `collectUsedMethods` を本メソッドとの衝突回避のため alias 化）
   * 純関数に委譲する。
   *
   * @returns Set of {@link JQueryMethodType} used in the element tree
   *
   * @example
   * ```typescript
   * const element = div();
   * element.jqm.on('click', handler);
   * const methods = element.collectUsedMethods();
   * // methods includes: Set(['on'])
   * ```
   */
  collectUsedMethods(): Set<JQueryMethodType> {
    return collectUsedMethodsHelper(this);
  }
}

// ElementMixin（on / setText / setValue / setStyle / addClass / toggleClass /
// removeClass / appendChild / text / value / class / checked）を HtmlTag.prototype
// に差し込む（Req 1.1, 1.5）。
// element-methods.ts は html-tag.js を type-only で参照するため循環値依存なし。
applyElementMixin(HtmlTag.prototype as HtmlTag);

// 同一モジュール内の宣言マージ：HtmlTag.prototype に差し込まれる ElementMethods 全メソッドを
// HtmlTag インターフェースに合流させる。サブクラス（PairType / SelfClosingType / TextType）は
// `extends HtmlTag` 経由で自動的にこれらのメソッドを継承する。
// バンドル後の dist/index.d.ts でも `class HtmlTag` と隣接した interface 宣言として保持され、
// クロスモジュール declare module による augmentation とは異なりパス解決に依存しない。
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging
export interface HtmlTag extends ElementMethods<HtmlTag> {}
