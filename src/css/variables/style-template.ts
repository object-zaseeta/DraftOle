/**
 * StyleTemplate 型と bodyHash ユーティリティ
 *
 * `createStyle({...})`（無名形）および `createStyle("name", {...})`（名前あり形）
 * の戻り値の中間表現として使用する不変データ構造。
 *
 * `bodyHash` は `(properties, selectors)` の JSON 正規化（キーソート）文字列に対し
 * 既存の djb2 ハッシュを適用した値であり、tagPath と組み合わせることで
 * 同一構造パスでも別 styleTemplate なら別クラス名を導出する衝突回避に使用する。
 *
 * Requirements: 1.1, 1.2, 2.1, 2.4
 *
 * @module css/variables/style-template
 */
import { djb2Hash } from '../utils/scoped-css-generator.js';
import type { StyleSelectors } from './css-shared-style.js';

/**
 * StyleTemplate オブジェクト。
 *
 * 名前あり/なしの両 `createStyle` 戻り値を統一する中間表現。
 * 生成後は freeze され、外部からの変更は受け付けない。
 *
 * - `hasExplicitName === true` ⇔ `name !== undefined`
 * - `bodyHash` は `(properties, selectors)` の決定的ハッシュ
 */
export interface StyleTemplate {
  readonly _kind: 'styleTemplate';
  readonly hasExplicitName: boolean;
  readonly name?: string;
  readonly properties: Readonly<Record<string, string>>;
  readonly selectors?: Readonly<StyleSelectors>;
  readonly bodyHash: string;
  readonly debugVarName?: string;
}

/**
 * `createStyleTemplate` の入力。
 *
 * - `name` を指定すると `hasExplicitName=true` となる
 * - `selectors` は省略可能
 */
export interface CreateStyleTemplateInput {
  /** 明示クラス名（省略時は無名形） */
  readonly name?: string;
  /** CSSプロパティ（camelCase または kebab-case） */
  readonly properties: Record<string, string>;
  /** 疑似/複合/子孫セレクタ群 */
  readonly selectors?: StyleSelectors;
}

/**
 * オブジェクトを「キーソートされたJSON文字列」に正規化する。
 *
 * - 入力が plain object のとき、キー昇順で再構築する（再帰）
 * - 配列・プリミティブ・null はそのまま `JSON.stringify` で出力
 *
 * これにより、キー順序の差を無視した安定なハッシュ入力を作る。
 *
 * @internal
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(v => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const entries = keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${entries.join(',')}}`;
}

/**
 * `(properties, selectors)` から決定的な `bodyHash` を計算する。
 *
 * `properties` と `selectors` を `{ properties, selectors }` の単一オブジェクトに
 * まとめてキーソート JSON 化し、その文字列に djb2 ハッシュを適用する。
 *
 * `selectors` が省略された場合は `null` として正規化される（undefined と null の
 * 区別を持たないことで「未指定 vs 空オブジェクト」の差は出るが、未指定同士は同値）。
 *
 * @internal
 */
function computeBodyHash(
  properties: Record<string, string>,
  selectors: StyleSelectors | undefined,
): string {
  const normalized = stableStringify({
    properties,
    selectors: selectors ?? null,
  });
  return djb2Hash(normalized);
}

/**
 * `properties` を浅くスナップショットし freeze した不変オブジェクトを返す。
 * @internal
 */
function freezeProperties(
  properties: Record<string, string>,
): Readonly<Record<string, string>> {
  const snapshot: Record<string, string> = {};
  for (const key of Object.keys(properties)) {
    const value = properties[key];
    if (value !== undefined) {
      snapshot[key] = value;
    }
  }
  return Object.freeze(snapshot);
}

/**
 * `selectors` を再帰的にスナップショットし freeze した不変オブジェクトを返す。
 * @internal
 */
function freezeSelectors(
  selectors: StyleSelectors,
): Readonly<StyleSelectors> {
  const snapshot: StyleSelectors = {};
  for (const key of Object.keys(selectors)) {
    const inner = selectors[key];
    if (inner !== undefined) {
      snapshot[key] = freezeProperties(inner) as Record<string, string>;
    }
  }
  return Object.freeze(snapshot);
}

/**
 * 不変な `StyleTemplate` オブジェクトを生成するファクトリ関数。
 *
 * - `name` 指定時は `hasExplicitName=true` の名前あり形
 * - `name` 省略時は `hasExplicitName=false` の無名形
 * - `bodyHash` は `(properties, selectors)` から決定的に算出される
 * - 戻り値および内部の `properties` / `selectors` は freeze される
 *
 * @example
 * ```ts
 * const tpl = createStyleTemplate({ properties: { display: 'flex' } });
 * tpl.hasExplicitName; // false
 * tpl.bodyHash;        // 例: 'a1b2c3d4'
 * ```
 */
export function createStyleTemplate(
  input: CreateStyleTemplateInput,
): StyleTemplate {
  const { name, properties, selectors } = input;
  const frozenProperties = freezeProperties(properties);
  const frozenSelectors =
    selectors !== undefined ? freezeSelectors(selectors) : undefined;
  const bodyHash = computeBodyHash(properties, selectors);

  const template: StyleTemplate = {
    _kind: 'styleTemplate',
    hasExplicitName: name !== undefined,
    ...(name !== undefined ? { name } : {}),
    properties: frozenProperties,
    ...(frozenSelectors !== undefined ? { selectors: frozenSelectors } : {}),
    bodyHash,
  };

  return Object.freeze(template);
}
