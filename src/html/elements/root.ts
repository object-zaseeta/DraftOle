/**
 * Task 4.5: Root ドキュメントルート要素
 *
 * HTML文書のトップレベル要素。Root自身のタグは出力せず、
 * 子要素のレンダリング結果を連結して返す。
 *
 * CSS出力モード（default/inline/external）を管理し、
 * ツリー全体のCSS/JSコンテンツ収集スタブ（Phase 3/4接続点）を提供する。
 *
 * レンダリング:
 *   protoRender() → 子要素の protoRender() を連結（Root自体のタグは出力しない）
 *   render()      → protoRender() → HTMLFormatter.format()
 *
 * Requirements: 3.1, 3.7, 3.8, 3.9, 6.6, 6.1, 6.2, 6.3, 6.4
 */
import { HtmlTag, type HtmlTagOptions } from './html-tag.js';
import { DocumentContext } from '../../document/document-context.js';
import { RuntimeContext } from '../../runtime/runtime-context.js';
import type { GlobalCss } from '../../css/variables/global-css.js';
import { CssConfig } from '../../css/config/css-config.js';

/**
 * Constructor options for Root.
 *
 * Extends {@link HtmlTagOptions} with document-level settings.
 * Note: the `css` property from HtmlTagOptions is omitted and replaced
 * with `css?: readonly GlobalCss[]` for global CSS injection.
 */
export interface RootOptions extends Omit<HtmlTagOptions, 'css'> {
  /** Global CSS rules to inject before scoped styles. */
  css?: readonly GlobalCss[];
  /**
   * Whether to inject a CSS reset before all other styles.
   * @defaultValue false
   */
  reset?: boolean;
  /**
   * CSS 出力設定（minify モード等）。
   *
   * 省略時は `new CssConfig()` の default を使用する（`NODE_ENV` fallback 適用）。
   * Root constructor 時点で評価され、以後不変。
   *
   * @see CssConfig
   */
  cssConfig?: CssConfig;
}

import { FileExporter, type FileExporterOptions } from '../../publisher/file-exporter.js';
import { type ExportContext } from '../../publisher/export-context.js';
import { RUNTIME_PRELUDE } from '../../js/vanilla/internal/runtime-prelude.gen.js';
import { renderCommand } from '../../js/vanilla/commands.js';
import { createDefaultRenderContext, type RenderContext } from './render-context.js';
import type { JQueryMethodType } from '../protocols/jquery-method-type.js';
import type { HTMLTagProtocol } from '../protocols/html-tag-protocol.js';
import { FlushOrchestrator } from '../../js/vanilla/pending-buffer.js';
import type { ScriptScope } from '../../js/vanilla/script-scope.js';
import type { ExprFactory } from '../../js/vanilla/expr-factory.js';
import type { SelectorRef, CollectionRef } from '../../js/vanilla/selector-ref.js';
import type { StateRegistry } from '../../js/vanilla/state/registry.js';
import type { State } from '../../js/vanilla/state/state.js';

/**
 * CSS output mode for the document.
 *
 * - **default**: Default behavior (defined in Phase 3)
 * - **inline**: Inline CSS output (styles in `<style>` tags)
 * - **external**: External CSS output (separate `.css` file)
 */
export type CssOutputMode = 'default' | 'inline' | 'external';

/**
 * Represents the root element of an HTML document.
 *
 * Root is a special element that doesn't render its own tag, but instead
 * concatenates the rendering output of its child elements. It serves as the
 * top-level container for the entire HTML document tree.
 *
 * **Key Features:**
 * - Manages CSS output mode (default/inline/external)
 * - Collects CSS and JavaScript from entire document tree
 * - Provides `renderJs()` for complete JavaScript output with tree-shaking
 *
 * **Rendering Format:**
 * ```html
 * <!-- No root tag is rendered, only children: -->
 * <child1>...</child1>
 * <child2>...</child2>
 * ```
 *
 * @example
 * Basic document structure:
 * ```typescript
 * const doc = new Root();
 * doc.addChild(html(
 *   head(title('My Page')),
 *   body(
 *     h1('Hello World'),
 *     p('Welcome to my page')
 *   )
 * ));
 *
 * console.log(doc.render());
 * ```
 *
 * @example
 * With JavaScript tree-shaking:
 * ```typescript
 * const doc = new Root();
 * const button = div();
 * button.jqm.on('click', () => console.log('Clicked'));
 * doc.addChild(button);
 *
 * // Only includes helper for 'on' method
 * const js = doc.renderJs();
 * ```
 *
 * @remarks
 * **Preconditions:** None (no constructor arguments required)
 *
 * **Postconditions:** `protoRender()` returns concatenated child output (no root tag)
 *
 * **Invariants:** `cssOutputMode` is one of {@link CssOutputMode} values
 */
export class Root extends HtmlTag {
  /**
   * CSS output mode for this document.
   *
   * @defaultValue 'default'
   */
  cssOutputMode: CssOutputMode = 'default';

  /** Document-level policy: doctype flag, global CSS, reset baseline. */
  private _documentContext: DocumentContext;

  /**
   * Root が保持する単一の JS スクリプトスコープ。
   *
   * 初回アクセス時に遅延生成され、以後は同一インスタンスを返す。
   * 実装は `RuntimeContext.getScope()` への委譲。
   *
   * @example
   * ```typescript
   * const root = new Root();
   * root.script.onDomReady(s => {
   *   s.call('init');
   * });
   * ```
   */
  get script(): ScriptScope {
    return this._runtimeContext.getScope();
  }

  /**
   * JS 式 / 真偽式を生成するファクトリ。
   *
   * 初回アクセス時に遅延生成され、以後は同一インスタンスを返す。
   * 実装は `RuntimeContext.getExprFactory()` への委譲。
   *
   * @example
   * ```typescript
   * const root = new Root();
   * const isActive = root.expr.bool('el.classList.contains("active")');
   * ```
   */
  get expr(): ExprFactory {
    return this._runtimeContext.getExprFactory();
  }

  /**
   * CSS セレクタで単一要素を参照する `SelectorRef` を返す。
   *
   * 実装は `RuntimeContext.querySelector()` への委譲。
   *
   * @param selector - `document.querySelector` に渡すセレクタ文字列
   * @returns `SelectorRef<E>` — セレクタ参照ノード
   *
   * @example
   * ```typescript
   * const root = new Root();
   * root.$('#my-btn').on('click', s => s.call('handleClick'));
   * ```
   */
  $<E extends Element = HTMLElement>(selector: string): SelectorRef<E> {
    return this._runtimeContext.querySelector<E>(selector);
  }

  /**
   * CSS セレクタで複数要素を参照する `CollectionRef` を返す。
   *
   * 実装は `RuntimeContext.querySelectorAll()` への委譲。
   *
   * @param selector - `document.querySelectorAll` に渡すセレクタ文字列
   * @returns `CollectionRef<E>` — コレクション参照ノード
   *
   * @example
   * ```typescript
   * const root = new Root();
   * root.$$('.todo-item').removeAll();
   * ```
   */
  $$<E extends Element = HTMLElement>(selector: string): CollectionRef<E> {
    return this._runtimeContext.querySelectorAll<E>(selector);
  }

  /**
   * Creates a new Root element.
   *
   * @param options - Optional options including css rules and DI overrides (for testing)
   *
   * @example
   * ```typescript
   * import { rule } from '../../css/variables/global-css.js';
   * const root = new Root({ css: [rule('.foo', { color: 'red' })] });
   * ```
   */
  /**
   * RuntimeContext — state registry / JS aggregation の受け皿（task 3.2 委譲）。
   * @internal
   */
  private _runtimeContext: RuntimeContext = new RuntimeContext();

  constructor(options?: RootOptions) {
    const { css, reset = false, cssConfig, ...htmlTagOptions } = options ?? {};
    // css may be readonly GlobalCss[] (new API) or CssManagerInstance (DI injection)
    const isGlobalCssArray = Array.isArray(css);
    const globalCssArray: readonly GlobalCss[] = isGlobalCssArray ? (css as readonly GlobalCss[]) : [];
    const parentOptions = isGlobalCssArray
      ? (htmlTagOptions as HtmlTagOptions)
      : ({ ...htmlTagOptions, css } as unknown as HtmlTagOptions);
    super('root', parentOptions);
    this._documentContext = new DocumentContext({ reset, globalCss: globalCssArray });
    this._cssConfig = cssConfig ?? new CssConfig();
  }

  /**
   * CSS 出力設定（解決済み）。Root constructor 時点で fix される。
   * @internal
   */
  private readonly _cssConfig: CssConfig;

  /**
   * 子要素を追加し、要素のバッファ済み Vanilla JS コマンドを Root の script スコープへフラッシュする。
   *
   * `HtmlTag.addChild` の CSS tagPath 設定処理を維持しつつ、
   * `FlushOrchestrator.flush(el, scope)` を追加実行する（Req 1.6, 1.7）。
   */
  override addChild(child: HTMLTagProtocol): this {
    super.addChild(child);
    if (child instanceof HtmlTag) {
      const scope = this._runtimeContext.getScope();
      FlushOrchestrator.flush(child, scope);
    }
    return this;
  }

  /**
   * Root ツリーに既に追加済みの子要素配下に後から追加された要素のコマンドをフラッシュする。
   * `app()` の `exportTo()` など、Root.addChild 経由でない addChild の後に呼ぶ。
   * @internal
   */
  flushDescendants(child: HTMLTagProtocol): void {
    if (child instanceof HtmlTag) {
      const scope = this._runtimeContext.getScope();
      FlushOrchestrator.flush(child, scope);
    }
  }

  /**
   * StateRegistry への package-private アクセス（FileExporter が参照）。
   *
   * `state()` を一度も呼んでいない場合は `undefined` を返す（遅延初期化と整合）。
   * 実態は `_runtimeContext.stateRegistry` へ委譲する（task 3.2）。
   * @internal
   */
  get _stateRegistry(): StateRegistry | undefined {
    return this._runtimeContext.stateRegistry;
  }

  /**
   * 一意な状態 ID を採番し、State<T> オブジェクトを返す。
   *
   * Req 1.1: root.state<T>(initial) を呼び出すと一意な状態 ID を採番した State<T> を返す。
   * Req 1.3: 同一 Root から複数回呼び出すと異なる状態 ID を採番。
   *
   * `_runtimeContext.state(initial)` へ委譲する（task 3.2）。
   *
   * @param initial - 状態の初期値
   * @returns State<T> — 一意な `_runtimeId` を持つ観測可能値オブジェクト
   */
  state<T>(initial: T): State<T> {
    return this._runtimeContext.state(initial);
  }

  /**
   * Vanilla JS Builder の出力を文字列として返す。
   *
   * 実装は `RuntimeContext.renderUserJs()` への委譲。
   * `script` にアクセスしていない場合（Builder が未初期化）は空文字列を返す。
   */
  renderVanillaScript(): string {
    return this._runtimeContext.renderUserJs();
  }

  /**
   * Enables or disables <!DOCTYPE html> output.
   * Default is false (backward compatible).
   */
  setDoctype(enabled = true): this {
    this._documentContext.setDoctype(enabled);
    return this;
  }

  /**
   * Task 3.2: Root の protoRender override。
   *
   * 受け取った ctx を子要素の `protoRender(ctx)` に必ず伝搬する。
   * ctx 省略時はツリー全体で共有する RenderContext を 1 つだけ生成し、
   * 全子要素に同一インスタンスとして渡す（registry の共有を保証する）。
   *
   * 出力は子要素 protoRender の連結（Root 自身のタグは出力しない）。
   *
   * @remarks
   * Task 3.3: Root はレンダーツリー境界の所有者であり、`protoRender` 開始時に
   * `ctx.registry.reset()` を呼んで前回レンダーで蓄積された id 集合を破棄する。
   * これにより同一 Root インスタンスを複数回 protoRender しても結果が
   * バイト等価になり（Req 3.7 ビルド間安定性）、外部から渡された ctx に既存 id が
   * 登録されていても Root 配下のレンダーには影響しない（Req 3.4 id 重複検出を
   * Root 境界内に閉じる）。
   */
  override protoRender(ctx?: RenderContext): string {
    const renderCtx: RenderContext = ctx ?? createDefaultRenderContext({ cssConfig: this._cssConfig });
    // Root は境界所有者: 入口で必ず registry を初期化し、ツリー全体で単一の
    // クリーンな id 集合を共有させる。
    renderCtx.registry.reset();
    return this._children.map(c => c.protoRender(renderCtx)).join('');
  }

  /**
   * Renders the document tree to formatted HTML.
   * Prepends <!DOCTYPE html> if enabled via setDoctype().
   */
  override render(): string {
    const html = super.render();
    return this._documentContext.doctype ? `<!DOCTYPE html>\n${html}` : html;
  }

  /**
   * Recursively collects CSS styles from the entire document tree.
   *
   * Traverses all child elements and concatenates their CSS output.
   *
   * @returns Concatenated CSS string from all elements
   *
   * @example
   * ```typescript
   * const doc = new Root();
   * const element = div();
   * element.css.addRule('.my-class', { color: 'red' });
   * doc.addChild(element);
   *
   * const css = doc.collectCssStyleString();
   * ```
   */
  override collectCssStyleString(): string {
    // Root の _cssConfig から minify-aware resolver を構築し、子要素の
    // CssManager.renderCss(resolver) 経由で wrapper class 名にも minify を反映する。
    // protoRender 時の RenderContext と同じ resolver を再構築する（state を共有しない純関数なので安全）。
    const resolver = createDefaultRenderContext({ cssConfig: this._cssConfig }).resolver;
    return this._documentContext.collectCss(this._children as HTMLTagProtocol[], resolver);
  }

  /**
   * Recursively collects JavaScript content from the entire document tree.
   *
   * Traverses all child elements and concatenates their JavaScript output.
   *
   * @returns Concatenated JavaScript string from all elements
   *
   * @example
   * ```typescript
   * const doc = new Root();
   * const button = div();
   * button.jqm.on('click', () => console.log('Clicked'));
   * doc.addChild(button);
   *
   * const js = doc.collectJsContent();
   * ```
   */
  override collectJsContent(): string {
    const childJs = this._children
      .filter((child): child is HtmlTag => child instanceof HtmlTag)
      .map(child => child.collectJsContent())
      .filter(js => js.length > 0);
    return childJs.join('');
  }

  /**
   * Recursively collects jQuery method types used in the entire document tree.
   *
   * Aggregates all jQuery methods used by descendant elements for tree-shaking.
   *
   * @returns Set of {@link JQueryMethodType} used in the document
   */
  override collectUsedMethods(): Set<JQueryMethodType> {
    const result = new Set<JQueryMethodType>();
    for (const child of this._children) {
      if (child instanceof HtmlTag) {
        for (const method of child.collectUsedMethods()) {
          result.add(method);
        }
      }
    }
    return result;
  }

  /**
   * Generates complete JavaScript output with tree-shaking.
   *
   * Combines jQuery helper functions (only for used methods) with the actual
   * JavaScript content from the document tree.
   *
   * **Output Format:**
   * - If no methods used: returns empty string
   * - If no content but methods used: returns helper only
   * - Otherwise: returns `helper + "\n\n" + jsContent`
   *
   * @returns Complete JavaScript string ready for embedding
   *
   * @example
   * ```typescript
   * const doc = new Root();
   * const button = div();
   * button.jqm.on('click', () => console.log('Clicked'));
   * button.jqm.addClass('active');
   * doc.addChild(button);
   *
   * const js = doc.renderJs();
   * // Output includes:
   * // - Helper functions for 'on' and 'addClass' only (tree-shaken)
   * // - Actual event handler and addClass call
   * ```
   *
   * @remarks
   * **Preconditions:** None
   *
   * **Postconditions:**
   * - Empty string if no methods used
   * - `helper + "\n\n" + jsContent` format if methods used
   *
   * **Invariants:** Helper and jsContent separator is always `"\n\n"`
   */
  renderJs(): string {
    // helper 合成は `RuntimeContext.renderJs()` に委譲（root-runtime-facade-extraction spec, Req 2.3）。
    // Root 側では tree traversal の起点として `collectUsedMethods()` / `collectJsContent()` を呼び、
    // 合成ロジックは RuntimeContext に集約する。
    return this._runtimeContext.renderJs(this.collectUsedMethods(), this.collectJsContent());
  }

  /**
   * Publisher 用の export snapshot を組み立てて返す。
   *
   * runtime registry の内部構造をここで吸収し、FileExporter には漏らさない。
   * FileExporter は `ExportContext` 経由でのみ必要情報を受け取る（Req 3.1, 3.2）。
   *
   * - `html`: `this.render()` の出力
   * - `css`: `this.collectCssStyleString()` の出力
   * - `userJs`: `this.renderVanillaScript()` の出力
   * - `runtimePrelude`: 状態あり時のみ `RUNTIME_PRELUDE` を設定
   * - `runtimeInitJs`: 状態あり時のみ state-init + derive コマンド列を設定
   *
   * @returns ExportContext — publisher が必要とする read-only snapshot
   */
  buildExportContext(): ExportContext {
    const html = this.render();
    const css = this.collectCssStyleString();
    const userJs = this.renderVanillaScript();

    const registry = this._stateRegistry;
    if (registry === undefined || registry.isEmpty()) {
      return { html, css, userJs };
    }

    const initCommands = registry.listInitCommands();
    const initLines = initCommands
      .map((cmd) => renderCommand({ type: cmd.type, id: cmd.id, initial: cmd.initial }))
      .join('\n');
    const deriveLines = registry.listDeriveCommands()
      .map((cmd) => renderCommand(cmd))
      .join('\n');
    const runtimeInitJs = deriveLines.length > 0
      ? `${initLines}\n${deriveLines}`
      : initLines;

    return { html, css, userJs, runtimePrelude: RUNTIME_PRELUDE, runtimeInitJs };
  }

  /**
   * ドキュメントツリーを HTML / CSS / JS ファイルとして出力する。
   *
   * `new FileExporter(options).exportFromRoot(this, outputPath)` と等価なショートカットメソッド。
   * `FileExporter` はそのまま残し、高度な制御（カスタムファイル名・reset.css・DOMContentLoaded ラップ等）
   * が必要な場合の entry point として引き続き利用できる。
   *
   * @param outputPath - 出力先ディレクトリパス（存在しない場合は自動作成）
   * @param options - {@link FileExporterOptions} オプション（省略可）
   *
   * @throws {@link ExportableError}
   * - `invalidPath`: outputPath が空文字列または無効
   * - `writeFailed`: ディレクトリ作成またはファイル書き込み失敗
   *
   * @example 基本的な使用方法
   * ```typescript
   * const root = new Root();
   * root.addChild(html(head(title('My Page')), body(h1('Hello'))));
   * root.export('./output/demo');
   * // 上記は以下と等価:
   * // new FileExporter().exportFromRoot(root, './output/demo');
   * ```
   *
   * @example カスタムオプション付き
   * ```typescript
   * const root = new Root();
   * root.export('./output/demo', { htmlFileName: 'page.html', includeResetCss: true });
   * // 上記は以下と等価:
   * // new FileExporter({ htmlFileName: 'page.html', includeResetCss: true }).exportFromRoot(root, './output/demo');
   * ```
   *
   * @remarks
   * **Preconditions:** `outputPath` は出力先ディレクトリパス
   *
   * **Postconditions:** `FileExporter.exportFromRoot` と同一の副作用（HTML/CSS/JS ファイル出力）
   *
   * **Error:** `FileExporter` から伝播するエラーはそのまま再スローされる
   */
  export(outputPath: string, options?: FileExporterOptions): void {
    new FileExporter(options).exportFromRoot(this, outputPath);
  }
}
