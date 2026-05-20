/**
 * factories-utils.ts
 *
 * 宣言的API共通型と内部ユーティリティ関数。
 * タグファクトリファイル間で共有される。
 *
 * Requirements: 5.2, 5.7, 5.8
 */
import { PairType } from '../elements/pair-type.js';
import { SelfClosingType } from '../elements/self-closing-type.js';
import { TextType } from '../elements/text-type.js';
import { HtmlTag } from '../elements/html-tag.js';
import type { HtmlTagOptions } from '../elements/html-tag.js';
import { HtmlAttribute } from '../attributes/html-attribute.js';
import type { HTMLTagProtocol } from '../protocols/html-tag-protocol.js';
import type { BooleanAttributeKey, KeyValueAttributeKey, AriaAttributeKey } from '../attributes/attribute-keys.js';
import type { TagType } from './tag-type.js';
import type { JsParam } from '../../js/js-param.js';
import { isJsParam, encodeJsParam } from '../../js/js-param.js';
import { isHtmlTagOptions } from '../../composition-root.js';
import type { StyleTemplate } from '../../css/variables/style-template.js';
import type { SharedStyle } from '../../css/variables/css-shared-style.js';

// ============================================================
// 宣言的API共通型 (Task 5.2, Req 5.7, 5.8)
// ============================================================

/**
 * Valid child argument types for tag factory functions.
 *
 * Can be either an {@link HTMLTagProtocol} instance or a string (which will be
 * automatically wrapped in a {@link TextType}).
 *
 * @example
 * ```typescript
 * const element = div(
 *   'Plain text',           // string → TextType
 *   p('Paragraph'),         // HTMLTagProtocol
 *   span('Inline text')     // HTMLTagProtocol
 * );
 * ```
 */
export type ChildArg = HTMLTagProtocol | string;

/**
 * Attribute map for declarative attribute specification.
 *
 * **Value Types:**
 * - `string`: Creates a key-value attribute (e.g., `class="value"`, `id="value"`)
 * - `true`: Creates a boolean attribute (e.g., `checked`, `disabled`)
 * - `false`: Omits the attribute entirely
 *
 * **Special Keys:**
 * - `class`: Normalized through `normalizeClassNames`
 * - `data-*`: Creates custom data attributes
 * - Other keys: Standard HTML attributes
 *
 * @example
 * ```typescript
 * const element = div({
 *   class: 'container active',
 *   id: 'main',
 *   'data-value': '123',
 *   hidden: false  // Omitted from output
 * });
 * ```
 *
 * @example
 * Boolean attributes:
 * ```typescript
 * const checkbox = input({
 *   type: 'checkbox',
 *   checked: true,      // Renders as: checked
 *   disabled: false     // Omitted
 * });
 * ```
 */
/**
 * `css` 属性に渡せる値の型。
 *
 * - 単一の `StyleTemplate`（無名 `createStyle({...})` の戻り値）
 * - 単一の `SharedStyle`（名前あり `createStyle("name", {...})` の戻り値）
 * - 上記の配列（順序保持で `class` 属性にマージされる）
 *
 * Requirements: 1.1, 1.4
 */
export type CssAttributeValue =
  | StyleTemplate
  | SharedStyle
  | ReadonlyArray<StyleTemplate | SharedStyle>;

export type AttributeMap = Record<
  string,
  string | boolean | JsParam | CssAttributeValue
>;

// ============================================================
// 内部ユーティリティ (Task 5.2)
// ============================================================

/**
 * Runtime type guard to check if an argument is an {@link AttributeMap}.
 *
 * Considers plain objects (not HtmlTag instances or arrays) as AttributeMap.
 *
 * @param arg - The argument to check
 * @returns `true` if arg is an AttributeMap, `false` otherwise
 *
 * @internal
 */
export function isAttributeMap(arg: unknown): arg is AttributeMap {
  return typeof arg === 'object'
    && arg !== null
    && !(arg instanceof HtmlTag)
    && !Array.isArray(arg);
}

/**
 * Converts an {@link AttributeMap} to an array of {@link HtmlAttribute} instances.
 *
 * **Conversion Rules:**
 * - `class` key: Uses `HtmlAttribute.className()` with normalization
 * - `data-*` keys: Uses `HtmlAttribute.custom()` (strips `data-` prefix)
 * - Boolean `true`: Uses `HtmlAttribute.boolean()` (renders as attribute name only)
 * - Boolean `false`: Omits the attribute
 * - String values: Uses `HtmlAttribute.keyValue()`
 *
 * @param map - The attribute map to convert
 * @returns Array of HtmlAttribute instances
 *
 * @example
 * ```typescript
 * const attrs = parseAttributeMap({
 *   class: 'btn primary',
 *   id: 'submit',
 *   'data-value': '123',
 *   disabled: true,
 *   hidden: false
 * });
 * // Returns: [className('btn primary'), keyValue('id', 'submit'),
 * //           custom('value', '123'), boolean('disabled')]
 * ```
 *
 * @internal
 */
export function parseAttributeMap(map: AttributeMap): HtmlAttribute[] {
  const result: HtmlAttribute[] = [];
  for (const [key, value] of Object.entries(map)) {
    // css キーは applyAttributeMap 経由で StyleTemplate に分解されるため、ここでは無視
    // （Requirements 1.1, 1.4：parseAttributeMap の戻り値型は HtmlAttribute[] のまま）
    if (key === 'css') {
      continue;
    }
    // jsName → data-jsname カスタム属性として保存（jsTemplate が検出・利用する）
    if (key === 'jsName') {
      if (typeof value === 'string') {
        result.push(HtmlAttribute.custom('jsname', value));
      }
      continue;
    }
    if (typeof value === 'boolean') {
      if (value) {
        result.push(HtmlAttribute.boolean(key as BooleanAttributeKey));
      }
      // false → omit
    } else if (isJsParam(value)) {
      // JsParam マーカー → sentinel エンコードして keyValue として保存
      // jsTemplate.render() が sentinel をデコードして変数参照に変換する
      const encoded = encodeJsParam(value);
      result.push(HtmlAttribute.keyValue(key as KeyValueAttributeKey | AriaAttributeKey, encoded));
    } else if (key === 'class') {
      // Requirement 1.6: class は文字列専用。styleObject 等の非文字列が
      // 渡された場合はランタイムでも TypeError をスローする
      // （型レベルでも禁止だが、AttributeMap が CssAttributeValue を含むため
      //   バックアップとして実装する）
      if (typeof value !== 'string') {
        throw new TypeError(
          'class attribute must be a string. Pass styleObject via the `css` attribute instead.',
        );
      }
      result.push(HtmlAttribute.className(value));
    } else if (key.startsWith('data-')) {
      if (typeof value !== 'string') {
        throw new TypeError(
          `data-* attribute "${key}" must be a string`,
        );
      }
      result.push(HtmlAttribute.custom(key.slice(5), value));
    } else {
      if (typeof value !== 'string') {
        throw new TypeError(
          `attribute "${key}" must be a string, boolean, or JsParam`,
        );
      }
      result.push(HtmlAttribute.keyValue(key as KeyValueAttributeKey | AriaAttributeKey, value));
    }
  }
  return result;
}

// ============================================================
// css 属性パイプライン (Task 2.2, Req 1.1, 1.4, 1.5, 1.6)
// ============================================================

/**
 * `value` が `StyleTemplate` であるかを判定する型ガード。
 * @internal
 */
function isStyleTemplate(value: unknown): value is StyleTemplate {
  return (
    typeof value === 'object'
    && value !== null
    && (value as { _kind?: unknown })._kind === 'styleTemplate'
  );
}

/**
 * `value` が `SharedStyle`（名前あり createStyle 戻り値）であるかを判定する型ガード。
 * `_template: StyleTemplate` を持つことで識別する。
 * @internal
 */
function isSharedStyle(value: unknown): value is SharedStyle {
  return (
    typeof value === 'object'
    && value !== null
    && isStyleTemplate((value as { _template?: unknown })._template)
  );
}

/**
 * 単一の `css` 値要素から `StyleTemplate` を取り出す。
 *
 * - `StyleTemplate` はそのまま返す
 * - `SharedStyle` は内部 `_template` を取り出す
 * - その他は `TypeError`
 *
 * @internal
 */
function toStyleTemplate(value: unknown): StyleTemplate {
  if (isStyleTemplate(value)) return value;
  if (isSharedStyle(value)) return value._template;
  throw new TypeError(
    'css attribute value must be a StyleTemplate, SharedStyle, or array thereof',
  );
}

/**
 * `AttributeMap` の `css` キーから `StyleTemplate[]` を抽出する純関数。
 *
 * **Behavior:**
 * - `css` キーが存在しない場合は空配列を返す
 * - `StyleTemplate` 単体 → 1 件のリスト
 * - `SharedStyle` 単体 → 内部 `_template` を取り出して 1 件のリスト
 * - 配列 → 順序保持でフラット化（`SharedStyle` は `_template` に置換）
 * - `css` 値が上記のいずれでもなければ `TypeError`
 *
 * **Pure function**：入力 `map` を変更しない。
 *
 * Requirements: 1.1, 1.4
 *
 * @example
 * ```typescript
 * const a = createStyle({ display: 'flex' });   // StyleTemplate
 * const b = createStyle('row', { gap: '8px' }); // SharedStyle
 * extractStyleTemplates({ css: [a, b] });
 * // → [a, b._template]
 * ```
 */
export function extractStyleTemplates(map: AttributeMap): StyleTemplate[] {
  if (!('css' in map)) return [];
  const value = map.css;
  if (Array.isArray(value)) {
    return value.map(item => toStyleTemplate(item));
  }
  return [toStyleTemplate(value)];
}

/**
 * `applyAttributeMap` が呼び出し対象に要求する最小インターフェース。
 *
 * 構造的型付けを採用することで、Task 2.4 で `HtmlTag` に
 * `addStyleTemplates(tpls)` が追加される前でも本タスク単独で
 * 型チェックとユニットテストが成立する。
 *
 * @internal
 */
export interface AttributeTarget {
  addHtmlAttribute(attribute: HtmlAttribute): unknown;
  addStyleTemplates(templates: StyleTemplate[]): unknown;
}

/**
 * `tag` に `map` 由来の attributes と pendingStyleTemplates を一括適用する。
 *
 * 内部で `parseAttributeMap` と `extractStyleTemplates` を順に呼び出し、
 * 取得した HtmlAttribute を `tag.addHtmlAttribute(attr)` で 1 件ずつ追加した後、
 * StyleTemplate のリストを `tag.addStyleTemplates(templates)` で一括追加する。
 *
 * **Order**：必ず `addHtmlAttribute` を先、`addStyleTemplates` を後に呼び出す。
 *
 * **Validation**：`class` キーに非文字列（styleObject 等）が渡された場合は
 * `parseAttributeMap` 内で `TypeError` をスローする（Requirement 1.6）。
 *
 * Requirements: 1.1, 1.4, 1.5, 1.6
 *
 * @example
 * ```typescript
 * const btn = createStyle({ display: 'flex' });
 * applyAttributeMap(tag, { css: btn, class: 'primary' });
 * // tag has: class="primary" attribute + pendingStyleTemplates: [btn]
 * ```
 */
export function applyAttributeMap(
  tag: AttributeTarget,
  map: AttributeMap,
): void {
  const attrs = parseAttributeMap(map);
  const templates = extractStyleTemplates(map);
  for (const attr of attrs) {
    tag.addHtmlAttribute(attr);
  }
  tag.addStyleTemplates(templates);
}

/**
 * Converts a {@link ChildArg} to an {@link HTMLTagProtocol} instance.
 *
 * String arguments are automatically wrapped in {@link TextType}.
 *
 * @param arg - The child argument (string or HTMLTagProtocol)
 * @returns An HTMLTagProtocol instance
 *
 * @example
 * ```typescript
 * toChild('Hello')           // → new TextType('Hello')
 * toChild(p('World'))        // → p('World') (unchanged)
 * ```
 *
 * @internal
 */
export function toChild(arg: ChildArg): HTMLTagProtocol {
  if (typeof arg === 'string') {
    return new TextType(arg, { escape: true });
  }
  return arg;
}

/**
 * Common implementation for pair tag factory functions.
 *
 * **Argument Patterns:**
 * - No arguments: Returns empty PairType
 * - `ChildArg...`: Returns PairType with children
 * - `AttributeMap, ChildArg...`: Returns PairType with attributes and children
 *
 * @param tagType - The HTML tag type
 * @param args - Factory function arguments (attributes and/or children)
 * @returns A configured PairType instance
 *
 * @example
 * ```typescript
 * makePairTag('div', [])                           // <div></div>
 * makePairTag('div', ['Hello'])                    // <div>Hello</div>
 * makePairTag('div', [{ class: 'btn' }, 'Click'])  // <div class="btn">Click</div>
 * ```
 *
 * @internal
 */
export function makePairTag(
  tagType: TagType,
  args: Array<AttributeMap | ChildArg | HtmlTagOptions>,
  options?: HtmlTagOptions,
): PairType {
  // args 末尾に HtmlTagOptions が含まれている場合は抽出する（呼び出し側の柔軟性のため）。
  // 明示的な第 3 引数 options が優先される。
  const { options: extracted, rest } = extractOptions(args);
  const resolvedOptions = options ?? extracted;

  const tag = new PairType(tagType, resolvedOptions);
  if (rest.length === 0) return tag;

  let startIndex = 0;
  if (isAttributeMap(rest[0])) {
    applyAttributeMap(tag, rest[0] as AttributeMap);
    startIndex = 1;
  }

  for (let idx = startIndex; idx < rest.length; idx++) {
    tag.addChild(toChild(rest[idx] as ChildArg));
  }

  return tag;
}

/**
 * Common implementation for self-closing tag factory functions.
 *
 * **Argument Patterns:**
 * - No arguments: Returns empty SelfClosingType
 * - `AttributeMap`: Returns SelfClosingType with attributes
 *
 * @param tagType - The HTML tag type
 * @param attrs - Optional attribute map
 * @returns A configured SelfClosingType instance
 *
 * @example
 * ```typescript
 * makeSelfClosingTag('br')                              // <br>
 * makeSelfClosingTag('img', { src: 'photo.jpg' })       // <img src="photo.jpg">
 * ```
 *
 * @internal
 */
export function makeSelfClosingTag(
  tagType: TagType,
  args?: AttributeMap | Array<AttributeMap | ChildArg | HtmlTagOptions>,
  options?: HtmlTagOptions,
): SelfClosingType {
  // args は以下のいずれかを許容:
  //   - undefined              → 属性なし
  //   - AttributeMap           → 旧 API: 単一の属性マップ
  //   - Array<...>             → 新 API: 可変長引数化した配列（末尾に HtmlTagOptions を含み得る）
  let attrs: AttributeMap | undefined;
  let resolvedOptions: HtmlTagOptions | undefined = options;

  if (Array.isArray(args)) {
    const { options: extracted, rest } = extractOptions(args);
    resolvedOptions = options ?? extracted;
    if (rest.length > 0 && isAttributeMap(rest[0])) {
      attrs = rest[0] as AttributeMap;
    }
  } else if (args !== undefined) {
    attrs = args;
  }

  const tag = new SelfClosingType(tagType, resolvedOptions);
  if (attrs) {
    applyAttributeMap(tag, attrs);
  }
  return tag;
}

// ============================================================
// ファクトリジェネレータ (Task 4.1, Req 4)
// ============================================================

/**
 * Creates a factory function for pair (opening+closing) tag elements.
 *
 * @param tagType - The HTML tag type
 * @returns A factory function that creates PairType instances
 *
 * @example
 * ```typescript
 * export const div = makePairFactory(TAG_TYPES.div);
 * div({ class: 'container' }, 'Hello') // <div class="container">Hello</div>
 * ```
 */
export function makePairFactory(
  tagType: TagType,
): (...args: Array<AttributeMap | ChildArg | HtmlTagOptions>) => PairType {
  return (...args) => makePairTag(tagType, args);
}

/**
 * Creates a factory function for self-closing (void) tag elements.
 *
 * @param tagType - The HTML tag type
 * @returns A factory function that creates SelfClosingType instances
 *
 * @example
 * ```typescript
 * export const img = makeSelfClosingFactory(TAG_TYPES.img);
 * img({ src: 'photo.jpg', alt: 'My photo' }) // <img src="photo.jpg" alt="My photo">
 * ```
 */
export function makeSelfClosingFactory(
  tagType: TagType,
): (attrs?: AttributeMap, options?: HtmlTagOptions) => SelfClosingType {
  return (attrs, options) => makeSelfClosingTag(tagType, attrs, options);
}

/**
 * 配列末尾の要素が `HtmlTagOptions`（`isHtmlTagOptions` を満たす）であれば pop し、
 * 残りの要素と共に返す。該当しない場合は options は undefined。
 *
 * `isAttributeMap` との曖昧さは `isHtmlTagOptions` が `'css' in v || 'jqm' in v` を
 * 要求するため回避される（空オブジェクト `{}` は AttributeMap として扱われる）。
 *
 * @internal
 */
export function extractOptions<T>(
  args: ReadonlyArray<T | HtmlTagOptions>,
): { options: HtmlTagOptions | undefined; rest: T[] } {
  if (args.length === 0) {
    return { options: undefined, rest: [] };
  }
  const last = args[args.length - 1];
  // HtmlTag インスタンスは `css` / `jqm` ゲッタを持ち構造的には
  // `isHtmlTagOptions` を満たしてしまうが、子要素として扱うべきなので除外する。
  // 配列・非オブジェクトも options としては扱わない。
  if (
    last !== null
    && typeof last === 'object'
    && !(last instanceof HtmlTag)
    && !Array.isArray(last)
    && isHtmlTagOptions(last)
  ) {
    return {
      options: last,
      rest: args.slice(0, -1) as T[],
    };
  }
  return { options: undefined, rest: args.slice() as T[] };
}
