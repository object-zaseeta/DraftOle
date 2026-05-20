/**
 * CSS中央管理クラス
 *
 * CssStyleManager と CssPositionMaker を統合的に保持し、
 * CSS文字列の統合出力とスコープドCSS出力を提供する。
 *
 * ## 主な機能
 *
 * - **スタイル管理**: {@link CssStyleManager} を通じて13種類のCSSプロパティを管理
 * - **レイアウト管理**: {@link CssPositionMaker} を通じて要素の配置を管理
 * - **スコープドCSS**: タグパスに基づくハッシュクラス名の自動生成
 * - **遅延レイアウト**: {@link LazyLayoutManager} との連携による依存関係の解決
 *
 * ## レンダリング
 *
 * - {@link render}(): スタイルCSS + レイアウトCSS の結合文字列
 * - {@link renderCss}(): スコープドCSS形式（`._{hash}` { ... }）またはインラインスタイル
 *
 * @example
 * ```ts
 * const manager = new CssManager('html>body>div');
 * manager.styleManager.style.font.setFontSize('16px');
 * manager.layout.placeAbsoluteWith(b => b.top(0, 'px').left(0, 'px'));
 *
 * // インラインスタイル出力
 * console.log(manager.render());
 * // → "font-size: 16px;\nleft: 0px;\nposition: absolute;\ntop: 0px;"
 *
 * // スコープドCSS出力
 * console.log(manager.renderCss());
 * // → "._a1b2c3d4 {\nfont-size: 16px;\nleft: 0px;\nposition: absolute;\ntop: 0px;\n}"
 * ```
 *
 * @see {@link CssManagerInstance}
 * @see {@link CssStyleManager}
 * @see {@link CssPositionMaker}
 * @see {@link CssConfig}
 */
import type { CssManagerInstance } from '../../html/protocols/css-manager-instance-type.js';
import type { LazyLayoutRegister } from '../layout/lazy-layout/registered-item.js';
import type { IdentifierResolver } from '../utils/identifier-resolver.js';
import type { StyleTemplate } from '../variables/style-template.js';
import type { StyleSelectors } from '../variables/css-shared-style.js';

import { CssConfig } from '../config/css-config.js';
import { CssPositionMaker } from '../layout/position-maker/css-position-maker.js';
import { CssStyleManager } from './css-style-manager.js';
import { generateScopedClassName } from '../utils/scoped-css-generator.js';
import { sanitizeCssValue } from '../utils/css-sanitizer.js';
import { devWarn } from '../../utils/dev-guard.js';

/**
 * 登録済み StyleTemplate と解決済みクラス名のペア。
 *
 * `registerTemplate` で蓄積され、`renderCss()` の出力時に
 * 実際の CSS ルールへ展開される。
 *
 * @internal
 */
interface RegisteredTemplateEntry {
  readonly className: string;
  readonly tagPath: string;
  readonly template: StyleTemplate;
}

/** 既知の擬似セレクタ（`.css-shared-style.ts` と同じ集合） */
const PSEUDO_SELECTORS_SET = new Set([
  'hover', 'focus', 'active', 'visited', 'disabled',
  'first-child', 'last-child', 'focus-within', 'focus-visible',
]);

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

function renderTemplateBody(properties: Readonly<Record<string, string>>): string {
  return Object.entries(properties)
    .filter(([, v]) => sanitizeCssValue(v) !== '')
    .map(([k, v]) => `  ${toKebabCase(k)}: ${v};`)
    .join('\n');
}

function resolveTemplateSelector(className: string, key: string): string {
  if (PSEUDO_SELECTORS_SET.has(key)) return `.${className}:${key}`;
  if (key.startsWith('&')) return `.${className}${key.slice(1)}`;
  if (key.startsWith(' ')) return `.${className}${key}`;
  return `.${className}:${key}`;
}

function renderRegisteredEntry(entry: RegisteredTemplateEntry): string {
  const { className, template } = entry;
  const parts: string[] = [];
  const propEntries = Object.entries(template.properties);
  if (propEntries.length > 0) {
    parts.push(`.${className} {\n${renderTemplateBody(template.properties)}\n}`);
  }
  const selectors: Readonly<StyleSelectors> | undefined = template.selectors;
  if (selectors) {
    for (const [key, props] of Object.entries(selectors)) {
      if (props && Object.keys(props).length > 0) {
        const selector = resolveTemplateSelector(className, key);
        parts.push(`${selector} {\n${renderTemplateBody(props)}\n}`);
      }
    }
  }
  return parts.join('\n');
}

export class CssManager implements CssManagerInstance {
  /** レイアウト管理インスタンス */
  readonly layout: CssPositionMaker;

  /** スタイル管理インスタンス */
  readonly styleManager: CssStyleManager;

  /** CSS出力設定 */
  readonly config: CssConfig;

  /** タグの階層パス（例: 'html>body>div'） */
  tagPath: string;

  /**
   * `scopedCssEnabled=false` モードで擬似クラススタイルを検出した際に、
   * 当該 manager インスタンスで既に警告を発火したかを示すフラグ。
   * 同一要素からの重複警告を抑止するために用いる。
   */
  private _pseudoWarningEmitted = false;

  /**
   * `registerTemplate` で蓄積された (className, template) エントリ列。
   *
   * **render-phase only**：`registerTemplate` は `HtmlTag.protoRender` 内
   * （tagPath 確定後）でのみ呼ばれる。属性パース時には呼ばれない。
   * 同一 `(tagPath, template.bodyHash)` 重複登録は冪等で、
   * このバッファに同じエントリを 2 度蓄積しない。
   *
   * 出力順は登録順を保持する（`renderCss()` で順序保持）。
   *
   * @internal
   */
  private readonly _registeredTemplates: RegisteredTemplateEntry[] = [];

  /**
   * 同一 `(tagPath, bodyHash)` の冪等性判定用キーセット。
   * @internal
   */
  private readonly _registeredKeys = new Set<string>();

  /**
   * @media ルールの内部ストレージ。
   *
   * キー: ブレークポイント（px 値）
   * 値: プロパティ名 → 値 のマップ
   *
   * 同一ブレークポイントへの `addMediaRule` 呼び出しはプロパティをマージする。
   * レンダリングは Task 4.2 で実装する。
   *
   * @internal
   */
  private readonly _mediaRules = new Map<number, Map<string, string>>();

  /**
   * CssManager を構築する
   *
   * @param tagPath - タグの階層パス（デフォルト: ''）
   * @param config - CSS出力設定（省略時はデフォルト設定）
   */
  constructor(tagPath = '', config?: CssConfig) {
    this.tagPath = tagPath;
    this.config = config ?? new CssConfig();
    this.layout = new CssPositionMaker(tagPath);
    this.styleManager = new CssStyleManager();
  }

  /**
   * タグパスを更新し、レイアウトマネージャーにも伝播する
   *
   * @param newPath - 新しいタグパス
   */
  updateTagPath(newPath: string): void {
    this.tagPath = newPath;
    this.layout.tagPath = newPath;
  }

  /**
   * 遅延レイアウトレジスタを更新する
   *
   * @param register - 遅延レイアウトレジスタ（undefined で解除）
   */
  updateLazyLayoutRegister(register: LazyLayoutRegister | undefined): void {
    this.layout.updateLLRegister(register);
  }

  /**
   * `StyleTemplate` を内部バッファに登録し、解決済みクラス名を返す。
   *
   * **契約（design.md "registerTemplate の Pre/Post 条件" を参照）**：
   *
   * - Pre: `tagPath` は非空。`registerTemplate` は **render フェーズでのみ呼ばれる**
   *   （属性パース時には呼ばれない）。
   * - Post: 戻り値の `className` は
   *   `resolver.resolveClassName(tagPath, template.bodyHash, template.debugVarName)` と同値。
   *   `template.debugVarName` が未設定の場合は従来の bodyHash 経路と同一形式となる。
   *   内部バッファに `(className, template)` を登録順で追加する。
   *   同一 `(tagPath, template.bodyHash)` の重複登録は冪等で、
   *   同じ className を返し、バッファに重複追加しない。
   *
   * `renderCss()` 出力には登録された rule が登録順で含まれる。
   *
   * @param template - 登録対象の StyleTemplate
   * @param resolver - クラス名解決に用いる IdentifierResolver
   * @param tagPath - 要素の構造パス（非空）
   * @returns 解決済みクラス名
   *
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.7
   */
  registerTemplate(
    template: StyleTemplate,
    resolver: IdentifierResolver,
    tagPath: string,
  ): string {
    const className = resolver.resolveClassName(
      tagPath,
      template.bodyHash,
      template.debugVarName,
    );
    const key = `${tagPath} ${template.bodyHash}`;
    if (this._registeredKeys.has(key)) {
      return className;
    }
    this._registeredKeys.add(key);
    this._registeredTemplates.push({ className, tagPath, template });
    return className;
  }

  /**
   * スタイルCSSとレイアウトCSSを結合して返す
   *
   * スコープクラスなしのインラインスタイル形式で出力する。
   *
   * @returns CSS文字列（両方とも空の場合は空文字列）
   */
  render(): string {
    const styleCss = this.styleManager.render();
    const layoutCss = this.layout.render();

    if (styleCss === '' && layoutCss === '') return '';
    if (styleCss === '') return layoutCss;
    if (layoutCss === '') return styleCss;
    return `${styleCss}\n${layoutCss}`;
  }

  /**
   * スコープドCSSまたはインラインスタイルとして出力する
   *
   * {@link CssConfig.scopedCssEnabled} が true の場合、
   * タグパスから生成したハッシュクラス名で CSS をラップする。
   *
   * `resolver` が指定された場合、wrapper class 名は `resolver.resolveClassName(tagPath)`
   * から取得する（minify モード等が反映される）。省略時は従来通り
   * `generateScopedClassName(tagPath)` を直接呼ぶ（既存挙動とバイト等価）。
   *
   * 設計: minify 状態の単一情報源は `IdentifierResolver`。`this.config.minifyClassNames`
   * は本メソッドからは参照しない（css-config-pipeline-wiring spec）。
   *
   * @param resolver - クラス名解決に用いる IdentifierResolver（省略可）
   * @returns スコープドCSS文字列またはインラインスタイル
   *
   * @example
   * ```ts
   * // scopedCssEnabled = true の場合
   * // "._a1b2c3d4 {\nfont-size: 16px;\n}"
   *
   * // scopedCssEnabled = false の場合
   * // "font-size: 16px;"
   * ```
   */
  renderCss(resolver?: IdentifierResolver): string {
    const cssBody = this.render();
    const pseudoStyle = this.styleManager.style.pseudo;
    const hasPseudo = pseudoStyle.hasAny();
    const hasRegistered = this._registeredTemplates.length > 0;

    if (!this.config.scopedCssEnabled) {
      // 擬似クラスはスコープドCSS前提のため、無効モードでは警告を発火して無視する。
      // 警告は manager インスタンスごとに 1 回のみ発火させる。
      if (hasPseudo && !this._pseudoWarningEmitted) {
        this._pseudoWarningEmitted = true;
        devWarn(
          `[DraftOle] pseudo-class styles require scopedCssEnabled=true, ignored on element <${this.tagPath}>`,
        );
      }
      if (cssBody === '' && !hasRegistered) return '';
      // 登録済み StyleTemplate は scopedCss 前提だが、無効モードでも
      // クラス名ベースの rule として出力する（クラス名は呼び出し側で resolver から既に得ている）。
      const registered = this._renderRegisteredBlocks();
      if (cssBody === '') return registered.join('\n');
      if (registered.length === 0) return cssBody;
      return [cssBody, ...registered].join('\n');
    }

    // scopedCssEnabled=true 分岐
    const hasMediaRules = this._mediaRules.size > 0;
    if (cssBody === '' && !hasPseudo && !hasRegistered && !hasMediaRules) return '';

    const className = resolver !== undefined
      ? resolver.resolveClassName(this.tagPath)
      : generateScopedClassName(this.tagPath);
    const blocks: string[] = [];
    if (cssBody !== '') {
      blocks.push(`.${className} {\n${cssBody}\n}`);
    }
    if (hasPseudo) {
      blocks.push(...pseudoStyle.renderForScope(className));
    }
    blocks.push(...this._renderRegisteredBlocks());
    blocks.push(...this._renderMediaBlocks(className));
    return blocks.join('\n');
  }

  /**
   * @media ルールを内部マップに追加する。
   *
   * 同一ブレークポイントに対して複数回呼び出した場合、プロパティはマージされる。
   * 同一プロパティ名が既に存在する場合は上書きされる。
   *
   * @param breakpointPx - ブレークポイント（px 値）
   * @param props - 追加するCSSプロパティのマップ
   *
   * Requirements: 9.1, 9.4
   */
  addMediaRule(breakpointPx: number, props: Record<string, string>): void {
    let bpMap = this._mediaRules.get(breakpointPx);
    if (bpMap === undefined) {
      bpMap = new Map<string, string>();
      this._mediaRules.set(breakpointPx, bpMap);
    }
    for (const [key, value] of Object.entries(props)) {
      bpMap.set(key, value);
    }
  }

  /**
   * `_mediaRules` を `@media (min-width: {bp}px) { .{className} { ... } }` ブロックの配列に展開する。
   *
   * ブレークポイントの昇順でブロックを生成する。
   * プロパティ名は kebab-case に変換する。
   *
   * @param className - スコープドクラス名（`_` プレフィックス付きハッシュ）
   * @internal
   */
  private _renderMediaBlocks(className: string): string[] {
    if (this._mediaRules.size === 0) return [];
    const blocks: string[] = [];
    const sortedBreakpoints = [...this._mediaRules.keys()].sort((a, b) => a - b);
    for (const bp of sortedBreakpoints) {
      const props = this._mediaRules.get(bp);
      if (props === undefined || props.size === 0) continue;
      const propLines = [...props.entries()]
        .map(([k, v]) => `    ${toKebabCase(k)}: ${v};`)
        .join('\n');
      blocks.push(`@media (min-width: ${bp}px) {\n  .${className} {\n${propLines}\n  }\n}`);
    }
    return blocks;
  }

  /**
   * 登録済みテンプレートを登録順に CSS ブロック文字列の配列に展開する。
   * @internal
   */
  private _renderRegisteredBlocks(): string[] {
    const blocks: string[] = [];
    for (const entry of this._registeredTemplates) {
      const rendered = renderRegisteredEntry(entry);
      if (rendered !== '') blocks.push(rendered);
    }
    return blocks;
  }
}
