/**
 * Global CSS DSL — セレクタ系・at-rule 系ファクトリ関数
 *
 * `root` / `all` / `tag` / `rule` / `media` / `keyframes` の 6関数を提供する。
 * 各関数は内部ヘルパを経由して `GlobalCss` branded type を生成する。
 * `brand()` の呼び出しは `selectorRule` / at-rule 各生成箇所に限定し、キャスト漏れを防ぐ。
 *
 * @module global-dsl
 */

import { type GlobalCss, brand, renderProperties, wrapBlock } from './global-css.js';

type Properties = Record<string, string>;

/**
 * 共通セレクタルール生成ヘルパ。
 * セレクタと style object から CSS ブロックを組み立て、`GlobalCss` として返す唯一の経路。
 */
function selectorRule(selector: string, properties: Properties): GlobalCss {
  return brand(wrapBlock(selector, renderProperties(properties)));
}

/**
 * `:root { ... }` ブロックを生成する。
 * CSS カスタムプロパティ（CSS 変数）の定義に用いる。
 *
 * @example
 * root({ '--bg': '#0b1220', '--fg': '#fff' })
 * // → ":root {\n  --bg: #0b1220;\n  --fg: #fff;\n}"
 */
/**
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は `css.theme` の token エントリ、
 * または最終手段として `css.raw` を使うこと。本関数は `sel.root` の実装基盤として内部実装で継続使用される。
 * 詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export function root(properties: Properties): GlobalCss {
  return selectorRule(':root', properties);
}

/**
 * `* { ... }` ブロックを生成する。
 * 全要素へのリセットスタイル等に用いる。
 *
 * @example
 * all({ boxSizing: 'border-box' })
 * // → "* {\n  box-sizing: border-box;\n}"
 */
/**
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は `css.reset` を使うこと
 * （最終手段として `css.raw`）。本関数は `sel.all` の実装基盤として内部実装で継続使用される。
 * 詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export function all(properties: Properties): GlobalCss {
  return selectorRule('*', properties);
}

/**
 * HTML タグセレクタブロックを生成する。
 * `name` は `HTMLElementTagNameMap` のキーに対してリテラル補完が効き、
 * かつ任意の文字列も受け付ける（`string & {}` パターン）。
 *
 * @example
 * tag('ul', { listStyle: 'none', margin: '0' })
 * // → "ul {\n  list-style: none;\n  margin: 0;\n}"
 */
/**
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと（最終手段として `css.raw`）。
 * 本関数は `sel.tag` および per-tag shortcuts（`tag-dsl.generated.ts`）の実装基盤として内部実装で継続使用される。
 * 詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export function tag(
  name: keyof HTMLElementTagNameMap | (string & {}),
  properties: Properties,
): GlobalCss {
  return selectorRule(name, properties);
}

/**
 * 任意セレクタブロックを生成する（脱出ハッチ）。
 * 疑似クラス・疑似要素・複合セレクタなど、専用関数では表現できないセレクタに使用する。
 * セレクタ文字列の構文検証は行わない（ランタイム no-op）。
 *
 * @example
 * rule('.foo:hover', { color: 'red' })
 * // → ".foo:hover {\n  color: red;\n}"
 */
/**
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は `css.raw` または要素単位クラス合成
 * （`css.class`）を使うこと。本関数は `sel.rule` の実装基盤として内部実装で継続使用される。
 * 詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export function rule(selector: string, properties: Properties): GlobalCss {
  return selectorRule(selector, properties);
}

/**
 * `@media (query) { ... }` ブロックを生成する。
 * 各 `GlobalCss` のすべての行に2スペースのインデントを付与し、
 * ルール間は空行（`\n\n`）で区切る。
 *
 * @example
 * media("(min-width: 768px)", [tag("body", { fontSize: "18px" })])
 * // → "@media (min-width: 768px) {\n  body {\n    font-size: 18px;\n  }\n}"
 *
 * @param query - メディアクエリ文字列（括弧付き or なし）
 * @param rules - 内包する GlobalCss ルール配列
 */
export function media(query: string, rules: readonly GlobalCss[]): GlobalCss {
  const indented = rules
    .map((r) =>
      r
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n'),
    )
    .join('\n\n');
  return brand(`@media ${query} {\n${indented}\n}`);
}

/**
 * フレームキーセレクタ型。`from` / `to` または `${number}%` を受け付ける。
 */
type KeyframeSelector = 'from' | 'to' | `${number}%`;

/**
 * `@keyframes name { ... }` ブロックを生成する。
 * 各フレームの宣言を `renderProperties` で整形し、2スペースインデント付きブロックで展開する。
 *
 * @example
 * keyframes("fadeIn", { from: { opacity: "0" }, to: { opacity: "1" } })
 * // → "@keyframes fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}"
 *
 * @param name - アニメーション名
 * @param frames - フレームキーと CSS プロパティのマップ
 */
export function keyframes(
  name: string,
  frames: Partial<Record<KeyframeSelector, Properties>>,
): GlobalCss {
  const blocks = (Object.entries(frames) as [KeyframeSelector, Properties][]).map(
    ([key, props]) => {
      const body = renderProperties(props)
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n');
      return `  ${key} {\n${body}\n  }`;
    },
  );
  return brand(`@keyframes ${name} {\n${blocks.join('\n')}\n}`);
}
