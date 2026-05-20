/**
 * 統合 createTheme 実装本体
 *
 * フラット入力（string か `Record<string, string>` 値）を受け取り、
 * エントリ単位で値型から「トークン」「クラス」を自動判別する。
 * トークンは `:root` ブロック + `var(--name)` プロキシとして、
 * クラスは `SharedStyle` プロキシとして公開し、`theme.css` で全 CSS を結合した
 * 単一の `GlobalCss` を返す。
 *
 * グローバルルール（`*`、HTMLタグセレクタ）は本ファイルでは扱わず、
 * 既存 `sel.*` 名前空間で担当する（責任分担）。
 *
 * @module css/variables/unified-theme
 */

import { sanitizeCssValue } from '../utils/css-sanitizer.js';
import { type GlobalCss, brand } from './global-css.js';
import {
  createStyleNamed,
  type SharedStyle,
  type StyleSelectors,
} from './css-shared-style.js';
import { createStyleTemplate, type StyleTemplate } from './style-template.js';
import type { Theme } from './css-theme.js';

// ────────────────────────────────────────────────────────────────────────────
// Public Types
// ────────────────────────────────────────────────────────────────────────────

/**
 * 統合 `createTheme` のフラット入力型。
 * 各エントリの値は string（トークン）または `Record<string, string>`（クラス）。
 */
export type UnifiedThemeInput = Record<string, string | Record<string, string>>;

/**
 * 統合 `createTheme` の戻り値型。
 *
 * 入力 `T` の各キーは値型に応じて以下のように振り分けられる:
 * - `T[K]` が string → `string`（`var(--K)` 参照）
 * - `T[K]` が `Record<string, string>` → `SharedStyle`
 *
 * 加えて全 CSS を結合した `css: GlobalCss` を持つ。
 */
export type UnifiedTheme<T extends UnifiedThemeInput> = {
  readonly [K in keyof T as T[K] extends string ? K : never]: string;
} & {
  readonly [K in keyof T as T[K] extends Record<string, string> ? K : never]: SharedStyle;
} & {
  readonly css: GlobalCss;
  readonly class: ThemeClassMethod;
};

/**
 * `theme.class` メソッドの呼び出しシグネチャ。
 *
 * - 無名形（properties のみ） → `StyleTemplate`
 * - 無名形 + selectors → `StyleTemplate`
 * - 明示名形（name + properties + selectors?） → `SharedStyle`
 */
export type ThemeClassMethod = {
  (properties: Record<string, string>): StyleTemplate;
  (properties: Record<string, string>, selectors: StyleSelectors): StyleTemplate;
  (name: string, properties: Record<string, string>, selectors?: StyleSelectors): SharedStyle;
};

// ────────────────────────────────────────────────────────────────────────────
// CssKeywordSet
// ────────────────────────────────────────────────────────────────────────────

/**
 * トークン参照解決時に「CSS キーワードはトークン名と一致しても置換しない」
 * ための除外リスト。
 *
 * CSS-wide キーワード + 一般的なプロパティ値キーワード + CSS 名前付きカラー。
 */
export const CSS_KEYWORDS: ReadonlySet<string> = new Set<string>([
  // CSS-wide keywords
  'inherit', 'initial', 'unset', 'revert', 'revert-layer',
  // generic
  'auto', 'none', 'normal', 'currentcolor', 'transparent',
  // display
  'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid',
  'contents', 'flow-root', 'list-item', 'table', 'table-row', 'table-cell',
  // visibility
  'visible', 'hidden', 'collapse',
  // position
  'static', 'relative', 'absolute', 'fixed', 'sticky',
  // font weight / style
  'bold', 'bolder', 'lighter', 'italic', 'oblique',
  // text
  'left', 'right', 'center', 'justify', 'start', 'end',
  // border style
  'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset',
  // cursor
  'pointer', 'default', 'crosshair', 'text', 'wait', 'help', 'move', 'not-allowed', 'grab', 'grabbing',
  // overflow
  'scroll', 'clip',
  // flex / align
  'stretch', 'baseline', 'space-between', 'space-around', 'space-evenly',
  'flex-start', 'flex-end',
  // box-sizing
  'content-box', 'border-box',
  // CSS named colors (subset commonly used)
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque',
  'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue',
  'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan',
  'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey',
  'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred',
  'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey',
  'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey',
  'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro',
  'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey',
  'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink',
  'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey',
  'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon',
  'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
  'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy',
  'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
  'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru',
  'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown',
  'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna',
  'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat',
  'white', 'whitesmoke', 'yellow', 'yellowgreen',
]);

// ────────────────────────────────────────────────────────────────────────────
// Contextual keyword resolver (property-aware)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Color 系 CSS プロパティ名集合。
 * これらのプロパティでは「カラー値として無効な keyword」を token 解決の阻害要因から
 * 除外する（COLOR_KEYWORDS を使う）。
 */
export const COLOR_PROPERTIES: ReadonlySet<string> = new Set<string>([
  'color',
  'background', 'background-color',
  'border-color',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color',
  'text-decoration-color',
  'caret-color',
  'fill', 'stroke',
]);

/**
 * Color プロパティでは「カラー値として無効」と判定する keyword 集合。
 *
 * `inherit` / `initial` / `unset` / `revert` / `none` / `transparent` / `currentcolor` /
 * named colors は color プロパティでも有効なので含めない。
 */
export const NON_COLOR_KEYWORDS: ReadonlySet<string> = new Set<string>([
  // cursor 専用
  'text', 'pointer', 'default', 'crosshair', 'wait', 'help', 'move',
  'not-allowed', 'grab', 'grabbing',
  // display
  'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid',
  'contents', 'flow-root', 'list-item', 'table', 'table-row', 'table-cell',
  // visibility
  'visible', 'hidden', 'collapse',
  // position
  'static', 'relative', 'absolute', 'fixed', 'sticky',
  // overflow
  'scroll', 'clip',
  // flex / align
  'stretch', 'baseline', 'space-between', 'space-around', 'space-evenly',
  'flex-start', 'flex-end',
  // box-sizing
  'content-box', 'border-box',
  // font-weight / style
  'bold', 'bolder', 'lighter', 'italic', 'oblique',
  // text-align
  'left', 'right', 'center', 'justify', 'start', 'end',
  // border-style
  'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset',
  // generic non-color
  'auto', 'normal',
]);

/**
 * Color プロパティ用 keyword 集合（CSS_KEYWORDS から NON_COLOR_KEYWORDS を除いたもの）。
 */
export const COLOR_KEYWORDS: ReadonlySet<string> = new Set<string>(
  Array.from(CSS_KEYWORDS).filter((k) => !NON_COLOR_KEYWORDS.has(k)),
);

/**
 * CSS プロパティ名から、そのプロパティで「CSS keyword と見なすべき値」の集合を返す関数型。
 *
 * - Color 系プロパティ: `COLOR_KEYWORDS`（cursor 用 `text` 等を除外）
 * - それ以外: `CSS_KEYWORDS`（既存挙動）
 *
 * 戻り値は identity-stable で、同じ propName に対し常に同じ参照を返す。
 */
export type CssKeywordResolver = (propName: string) => ReadonlySet<string>;

/**
 * `propName` を CSS プロパティ名として正規化（lowercase）し、適切な keyword 集合を返す。
 */
export function getKeywordsForProperty(propName: string): ReadonlySet<string> {
  const normalized = propName.toLowerCase();
  if (COLOR_PROPERTIES.has(normalized)) {
    return COLOR_KEYWORDS;
  }
  return CSS_KEYWORDS;
}

/**
 * デフォルト keyword resolver。`getKeywordsForProperty` を直接指す。
 */
export const defaultKeywordResolver: CssKeywordResolver = getKeywordsForProperty;

// ────────────────────────────────────────────────────────────────────────────
// EntryClassifier
// ────────────────────────────────────────────────────────────────────────────

/**
 * エントリ分類結果（discriminated union）。
 * `kind` で `value` の型が narrow される。
 */
export type ClassifiedEntry =
  | { kind: 'token'; key: string; value: string }
  | { kind: 'class'; key: string; value: Record<string, string> };

/**
 * `(key, value)` を `'token'` / `'class'` に分類する純粋関数。
 *
 * - `typeof value === 'string'` → `'token'`
 * - plain object → `'class'`
 */
export function classifyEntry(
  key: string,
  value: string | Record<string, string>,
): ClassifiedEntry {
  if (typeof value === 'string') {
    return { kind: 'token', key, value };
  }
  return { kind: 'class', key, value };
}

// ────────────────────────────────────────────────────────────────────────────
// TokenAccumulator
// ────────────────────────────────────────────────────────────────────────────

/**
 * トークン（string 値エントリ）を集約し、`:root` ブロック・`var()` プロキシ・
 * トークン名集合を提供するビルダ。
 */
export class TokenAccumulator {
  private readonly entries = new Map<string, string>();

  add(name: string, rawValue: string): void {
    const safe = sanitizeCssValue(rawValue);
    if (safe === '') return;
    this.entries.set(name, safe);
  }

  buildRootCss(): GlobalCss | undefined {
    if (this.entries.size === 0) return undefined;
    const lines: string[] = [];
    for (const [k, v] of this.entries) {
      lines.push(`  --${k}: ${v};`);
    }
    return brand(`:root {\n${lines.join('\n')}\n}`);
  }

  buildProxy(): Record<string, string> {
    const proxy: Record<string, string> = {};
    for (const k of this.entries.keys()) {
      proxy[k] = `var(--${k})`;
    }
    return proxy;
  }

  getNameSet(): ReadonlySet<string> {
    return new Set(this.entries.keys());
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TokenRefResolver
// ────────────────────────────────────────────────────────────────────────────

/**
 * プロパティ値文字列がトークン名と完全一致し、かつ CSS キーワードでない場合のみ
 * `var(--name)` に置換する純粋関数。
 *
 * - 値に空白・括弧・カンマを含む場合は元値そのまま
 * - 値が CSS キーワードと一致する場合は元値そのまま（CSS キーワード優先）
 * - トークン名集合に存在しない場合は元値そのまま
 */
export function resolveTokenRefs(
  properties: Record<string, string>,
  tokenNames: ReadonlySet<string>,
  keywordResolver: CssKeywordResolver,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(properties)) {
    out[k] = resolveValue(k, v, tokenNames, keywordResolver);
  }
  return out;
}

function resolveValue(
  propName: string,
  value: string,
  tokenNames: ReadonlySet<string>,
  keywordResolver: CssKeywordResolver,
): string {
  // 複合値は対象外
  if (/[\s(),]/.test(value)) return value;
  // プロパティ別 CSS キーワード優先（color 系では NON_COLOR_KEYWORDS を除外した集合）
  const keywords = keywordResolver(propName);
  if (keywords.has(value)) return value;
  // トークン名一致 → var() に置換
  if (tokenNames.has(value)) return `var(--${value})`;
  return value;
}

// ────────────────────────────────────────────────────────────────────────────
// ClassAccumulator
// ────────────────────────────────────────────────────────────────────────────

/**
 * クラス（object 値エントリ）を集約し、`SharedStyle` プロキシと
 * `GlobalCss[]` ブロック群を挿入順で生成するビルダ。
 *
 * トークン名コンテキストは `setTokenContext` で受け取り、`add` 時に
 * `resolveTokenRefs` で値を解決した上で `createStyleNamed` に委譲する。
 * サニタイズは `createStyleNamed` 内で行うため二重適用しない。
 */
export class ClassAccumulator {
  private readonly entries = new Map<string, SharedStyle>();
  private tokenNames: ReadonlySet<string> = new Set();
  private keywordResolver: CssKeywordResolver = defaultKeywordResolver;

  setTokenContext(tokenNames: ReadonlySet<string>, keywordResolver: CssKeywordResolver): void {
    this.tokenNames = tokenNames;
    this.keywordResolver = keywordResolver;
  }

  add(name: string, properties: Record<string, string>): void {
    const resolved = resolveTokenRefs(properties, this.tokenNames, this.keywordResolver);
    const style = createStyleNamed(name, resolved);
    this.entries.set(name, style);
  }

  buildProxy(): Record<string, SharedStyle> {
    const proxy: Record<string, SharedStyle> = {};
    for (const [k, v] of this.entries) {
      proxy[k] = v;
    }
    return proxy;
  }

  buildCssBlocks(): GlobalCss[] {
    const blocks: GlobalCss[] = [];
    for (const style of this.entries.values()) {
      if (style.css !== '') blocks.push(brand(style.css));
    }
    return blocks;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// CssCombiner
// ────────────────────────────────────────────────────────────────────────────

/**
 * tokens → classes の決定的順序で結合し、空セクションをスキップして
 * 単一 `GlobalCss` を返す純粋関数。
 */
export function combineCss(parts: {
  tokensCss?: GlobalCss | undefined;
  classesCss: GlobalCss[];
}): GlobalCss {
  const sections: string[] = [];
  if (parts.tokensCss !== undefined && parts.tokensCss !== '') {
    sections.push(parts.tokensCss);
  }
  for (const block of parts.classesCss) {
    if (block !== '') sections.push(block);
  }
  return brand(sections.join('\n\n'));
}

// ────────────────────────────────────────────────────────────────────────────
// ThemeClass helper
// ────────────────────────────────────────────────────────────────────────────

/**
 * selectors 内の各 properties に `resolveTokenRefs` を適用する。
 *
 * `theme.class(props, selectors)` の selectors 経路で token 解決の対称性を保つため、
 * 各 selector ブロックの properties にも token 解決を適用する。
 */
function resolveSelectorsTokens(
  selectors: StyleSelectors,
  tokenNames: ReadonlySet<string>,
  keywordResolver: CssKeywordResolver,
): StyleSelectors {
  const out: StyleSelectors = {};
  for (const [k, props] of Object.entries(selectors)) {
    if (props !== undefined) {
      out[k] = resolveTokenRefs(props, tokenNames, keywordResolver);
    }
  }
  return out;
}

/**
 * `tokenNames` と `cssKeywords` を closure に握り、入力に応じて
 * `StyleTemplate`（無名形）か `SharedStyle`（明示名形）を返す純粋関数を構築する。
 *
 * - 第 1 引数が `string` → 明示名形：`createStyleNamed` を呼ぶ
 * - 第 1 引数が plain object → 無名形：`createStyleTemplate` を呼ぶ
 *
 * sanitize は `createStyleNamed` / `createStyleTemplate` 内に委譲し、二重適用しない。
 */
export function buildThemeClass(
  tokenNames: ReadonlySet<string>,
  keywordResolver: CssKeywordResolver,
): ThemeClassMethod {
  function impl(
    arg1: string | Record<string, string>,
    arg2?: Record<string, string> | StyleSelectors,
    arg3?: StyleSelectors,
  ): SharedStyle | StyleTemplate {
    if (typeof arg1 === 'string') {
      const name = arg1;
      const properties = (arg2 as Record<string, string> | undefined) ?? {};
      const selectors = arg3;
      const resolvedProps = resolveTokenRefs(properties, tokenNames, keywordResolver);
      const resolvedSelectors =
        selectors !== undefined
          ? resolveSelectorsTokens(selectors, tokenNames, keywordResolver)
          : undefined;
      return createStyleNamed(name, resolvedProps, resolvedSelectors);
    }
    const properties = arg1;
    const selectors = arg2 as StyleSelectors | undefined;
    const resolvedProps = resolveTokenRefs(properties, tokenNames, keywordResolver);
    const resolvedSelectors =
      selectors !== undefined
        ? resolveSelectorsTokens(selectors, tokenNames, keywordResolver)
        : undefined;
    return createStyleTemplate({
      properties: resolvedProps,
      ...(resolvedSelectors !== undefined ? { selectors: resolvedSelectors } : {}),
    });
  }
  return impl as ThemeClassMethod;
}

// ────────────────────────────────────────────────────────────────────────────
// Orchestrator: buildUnifiedTheme
// ────────────────────────────────────────────────────────────────────────────

/**
 * 統合 `createTheme` のオーケストレータ。
 *
 * Pass 1: 全エントリを `classifyEntry` で分類し、トークンを `TokenAccumulator` に
 * 先行収集する。クラスエントリは原値のまま保留。
 * Pass 2: 確定したトークン名コンテキストで `ClassAccumulator` がクラスを処理。
 * 最後に `CssCombiner` で tokens → classes 順に結合する。
 *
 * 戻り値は `Object.freeze` で凍結された `UnifiedTheme<T>` 互換オブジェクト。
 */
export function buildUnifiedTheme<T extends UnifiedThemeInput>(input: T): UnifiedTheme<T> {
  const tokenAcc = new TokenAccumulator();
  const classAcc = new ClassAccumulator();

  // Pass 1: classify and accumulate tokens; defer class entries
  const deferredClasses: { key: string; value: Record<string, string> }[] = [];
  for (const [key, value] of Object.entries(input)) {
    const entry = classifyEntry(key, value);
    if (entry.kind === 'token') {
      tokenAcc.add(entry.key, entry.value);
    } else {
      deferredClasses.push({ key: entry.key, value: entry.value });
    }
  }

  // Pass 2: process classes with token context
  classAcc.setTokenContext(tokenAcc.getNameSet(), defaultKeywordResolver);
  for (const { key, value } of deferredClasses) {
    classAcc.add(key, value);
  }

  // Build proxy
  const tokenProxy = tokenAcc.buildProxy();
  const classProxy = classAcc.buildProxy();

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tokenProxy)) result[k] = v;
  for (const [k, v] of Object.entries(classProxy)) result[k] = v;

  const tokensCss = tokenAcc.buildRootCss();
  const classesCss = classAcc.buildCssBlocks();
  const css = combineCss({ tokensCss, classesCss });

  Object.defineProperty(result, 'css', {
    value: css,
    enumerable: false,
    writable: false,
  });

  const themeClass = buildThemeClass(tokenAcc.getNameSet(), defaultKeywordResolver);
  Object.defineProperty(result, 'class', {
    value: themeClass,
    enumerable: false,
    writable: false,
  });

  return Object.freeze(result) as UnifiedTheme<T>;
}

// Re-export `Theme` for convenience (used by the public `createTheme` overload)
export type { Theme };
