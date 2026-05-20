/**
 * tag-dsl.generated.ts
 *
 * ⚠️ このファイルは自動生成です。直接編集しないでください。
 * 再生成: node --experimental-strip-types scripts/gen-tag-dsl.ts
 *
 * HTML タグセレクタ用グローバル CSS DSL ショートカット関数。
 * 各関数は `tag(tagName, props)` の薄いラッパーであり、
 * 戻り値は `GlobalCss` branded type です。
 * ルートレベルのグローバル CSS 定義のみに使用してください。
 */

import type { GlobalCss } from './global-css.js';
import { tag } from './global-dsl.js';

type Properties = Record<string, string>;

/**
 * `a { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagA = (properties: Properties): GlobalCss => tag('a', properties);

/**
 * `abbr { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagAbbr = (properties: Properties): GlobalCss => tag('abbr', properties);

/**
 * `address { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagAddress = (properties: Properties): GlobalCss => tag('address', properties);

/**
 * `area { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagArea = (properties: Properties): GlobalCss => tag('area', properties);

/**
 * `article { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagArticle = (properties: Properties): GlobalCss => tag('article', properties);

/**
 * `aside { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagAside = (properties: Properties): GlobalCss => tag('aside', properties);

/**
 * `audio { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagAudio = (properties: Properties): GlobalCss => tag('audio', properties);

/**
 * `b { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagB = (properties: Properties): GlobalCss => tag('b', properties);

/**
 * `base { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagBase = (properties: Properties): GlobalCss => tag('base', properties);

/**
 * `bdi { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagBdi = (properties: Properties): GlobalCss => tag('bdi', properties);

/**
 * `bdo { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagBdo = (properties: Properties): GlobalCss => tag('bdo', properties);

/**
 * `blockquote { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagBlockquote = (properties: Properties): GlobalCss => tag('blockquote', properties);

/**
 * `body { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagBody = (properties: Properties): GlobalCss => tag('body', properties);

/**
 * `br { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagBr = (properties: Properties): GlobalCss => tag('br', properties);

/**
 * `button { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagButton = (properties: Properties): GlobalCss => tag('button', properties);

/**
 * `canvas { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagCanvas = (properties: Properties): GlobalCss => tag('canvas', properties);

/**
 * `caption { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagCaption = (properties: Properties): GlobalCss => tag('caption', properties);

/**
 * `cite { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagCite = (properties: Properties): GlobalCss => tag('cite', properties);

/**
 * `code { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagCode = (properties: Properties): GlobalCss => tag('code', properties);

/**
 * `col { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagCol = (properties: Properties): GlobalCss => tag('col', properties);

/**
 * `colgroup { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagColgroup = (properties: Properties): GlobalCss => tag('colgroup', properties);

/**
 * `data { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagData = (properties: Properties): GlobalCss => tag('data', properties);

/**
 * `datalist { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagDatalist = (properties: Properties): GlobalCss => tag('datalist', properties);

/**
 * `dd { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagDd = (properties: Properties): GlobalCss => tag('dd', properties);

/**
 * `del { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagDel = (properties: Properties): GlobalCss => tag('del', properties);

/**
 * `details { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagDetails = (properties: Properties): GlobalCss => tag('details', properties);

/**
 * `dfn { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagDfn = (properties: Properties): GlobalCss => tag('dfn', properties);

/**
 * `dialog { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagDialog = (properties: Properties): GlobalCss => tag('dialog', properties);

/**
 * `div { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagDiv = (properties: Properties): GlobalCss => tag('div', properties);

/**
 * `dl { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagDl = (properties: Properties): GlobalCss => tag('dl', properties);

/**
 * `dt { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagDt = (properties: Properties): GlobalCss => tag('dt', properties);

/**
 * `em { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagEm = (properties: Properties): GlobalCss => tag('em', properties);

/**
 * `embed { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagEmbed = (properties: Properties): GlobalCss => tag('embed', properties);

/**
 * `fieldset { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagFieldset = (properties: Properties): GlobalCss => tag('fieldset', properties);

/**
 * `figcaption { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagFigcaption = (properties: Properties): GlobalCss => tag('figcaption', properties);

/**
 * `figure { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagFigure = (properties: Properties): GlobalCss => tag('figure', properties);

/**
 * `footer { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagFooter = (properties: Properties): GlobalCss => tag('footer', properties);

/**
 * `form { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagForm = (properties: Properties): GlobalCss => tag('form', properties);

/**
 * `h1 { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagH1 = (properties: Properties): GlobalCss => tag('h1', properties);

/**
 * `h2 { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagH2 = (properties: Properties): GlobalCss => tag('h2', properties);

/**
 * `h3 { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagH3 = (properties: Properties): GlobalCss => tag('h3', properties);

/**
 * `h4 { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagH4 = (properties: Properties): GlobalCss => tag('h4', properties);

/**
 * `h5 { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagH5 = (properties: Properties): GlobalCss => tag('h5', properties);

/**
 * `h6 { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagH6 = (properties: Properties): GlobalCss => tag('h6', properties);

/**
 * `head { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagHead = (properties: Properties): GlobalCss => tag('head', properties);

/**
 * `header { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagHeader = (properties: Properties): GlobalCss => tag('header', properties);

/**
 * `hgroup { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagHgroup = (properties: Properties): GlobalCss => tag('hgroup', properties);

/**
 * `hr { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagHr = (properties: Properties): GlobalCss => tag('hr', properties);

/**
 * `html { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagHtml = (properties: Properties): GlobalCss => tag('html', properties);

/**
 * `i { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagI = (properties: Properties): GlobalCss => tag('i', properties);

/**
 * `iframe { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagIframe = (properties: Properties): GlobalCss => tag('iframe', properties);

/**
 * `img { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagImg = (properties: Properties): GlobalCss => tag('img', properties);

/**
 * `input { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagInput = (properties: Properties): GlobalCss => tag('input', properties);

/**
 * `ins { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagIns = (properties: Properties): GlobalCss => tag('ins', properties);

/**
 * `kbd { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagKbd = (properties: Properties): GlobalCss => tag('kbd', properties);

/**
 * `label { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagLabel = (properties: Properties): GlobalCss => tag('label', properties);

/**
 * `legend { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagLegend = (properties: Properties): GlobalCss => tag('legend', properties);

/**
 * `li { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagLi = (properties: Properties): GlobalCss => tag('li', properties);

/**
 * `link { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagLink = (properties: Properties): GlobalCss => tag('link', properties);

/**
 * `main { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagMain = (properties: Properties): GlobalCss => tag('main', properties);

/**
 * `map { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagMap = (properties: Properties): GlobalCss => tag('map', properties);

/**
 * `mark { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagMark = (properties: Properties): GlobalCss => tag('mark', properties);

/**
 * `menu { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagMenu = (properties: Properties): GlobalCss => tag('menu', properties);

/**
 * `meta { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagMeta = (properties: Properties): GlobalCss => tag('meta', properties);

/**
 * `meter { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagMeter = (properties: Properties): GlobalCss => tag('meter', properties);

/**
 * `nav { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagNav = (properties: Properties): GlobalCss => tag('nav', properties);

/**
 * `noscript { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagNoscript = (properties: Properties): GlobalCss => tag('noscript', properties);

/**
 * `object { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagObject = (properties: Properties): GlobalCss => tag('object', properties);

/**
 * `ol { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagOl = (properties: Properties): GlobalCss => tag('ol', properties);

/**
 * `optgroup { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagOptgroup = (properties: Properties): GlobalCss => tag('optgroup', properties);

/**
 * `option { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagOption = (properties: Properties): GlobalCss => tag('option', properties);

/**
 * `output { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagOutput = (properties: Properties): GlobalCss => tag('output', properties);

/**
 * `p { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagP = (properties: Properties): GlobalCss => tag('p', properties);

/**
 * `picture { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagPicture = (properties: Properties): GlobalCss => tag('picture', properties);

/**
 * `pre { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagPre = (properties: Properties): GlobalCss => tag('pre', properties);

/**
 * `progress { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagProgress = (properties: Properties): GlobalCss => tag('progress', properties);

/**
 * `q { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagQ = (properties: Properties): GlobalCss => tag('q', properties);

/**
 * `rp { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagRp = (properties: Properties): GlobalCss => tag('rp', properties);

/**
 * `rt { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagRt = (properties: Properties): GlobalCss => tag('rt', properties);

/**
 * `ruby { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagRuby = (properties: Properties): GlobalCss => tag('ruby', properties);

/**
 * `s { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagS = (properties: Properties): GlobalCss => tag('s', properties);

/**
 * `samp { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSamp = (properties: Properties): GlobalCss => tag('samp', properties);

/**
 * `script { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagScript = (properties: Properties): GlobalCss => tag('script', properties);

/**
 * `search { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSearch = (properties: Properties): GlobalCss => tag('search', properties);

/**
 * `section { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSection = (properties: Properties): GlobalCss => tag('section', properties);

/**
 * `select { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSelect = (properties: Properties): GlobalCss => tag('select', properties);

/**
 * `slot { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSlot = (properties: Properties): GlobalCss => tag('slot', properties);

/**
 * `small { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSmall = (properties: Properties): GlobalCss => tag('small', properties);

/**
 * `source { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSource = (properties: Properties): GlobalCss => tag('source', properties);

/**
 * `span { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSpan = (properties: Properties): GlobalCss => tag('span', properties);

/**
 * `strong { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagStrong = (properties: Properties): GlobalCss => tag('strong', properties);

/**
 * `style { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagStyle = (properties: Properties): GlobalCss => tag('style', properties);

/**
 * `sub { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSub = (properties: Properties): GlobalCss => tag('sub', properties);

/**
 * `summary { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSummary = (properties: Properties): GlobalCss => tag('summary', properties);

/**
 * `sup { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagSup = (properties: Properties): GlobalCss => tag('sup', properties);

/**
 * `table { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTable = (properties: Properties): GlobalCss => tag('table', properties);

/**
 * `tbody { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTbody = (properties: Properties): GlobalCss => tag('tbody', properties);

/**
 * `td { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTd = (properties: Properties): GlobalCss => tag('td', properties);

/**
 * `template { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTemplate = (properties: Properties): GlobalCss => tag('template', properties);

/**
 * `textarea { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTextarea = (properties: Properties): GlobalCss => tag('textarea', properties);

/**
 * `tfoot { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTfoot = (properties: Properties): GlobalCss => tag('tfoot', properties);

/**
 * `th { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTh = (properties: Properties): GlobalCss => tag('th', properties);

/**
 * `thead { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagThead = (properties: Properties): GlobalCss => tag('thead', properties);

/**
 * `time { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTime = (properties: Properties): GlobalCss => tag('time', properties);

/**
 * `title { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTitle = (properties: Properties): GlobalCss => tag('title', properties);

/**
 * `tr { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTr = (properties: Properties): GlobalCss => tag('tr', properties);

/**
 * `track { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagTrack = (properties: Properties): GlobalCss => tag('track', properties);

/**
 * `u { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagU = (properties: Properties): GlobalCss => tag('u', properties);

/**
 * `ul { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagUl = (properties: Properties): GlobalCss => tag('ul', properties);

/**
 * `var { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagVar = (properties: Properties): GlobalCss => tag('var', properties);

/**
 * `video { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagVideo = (properties: Properties): GlobalCss => tag('video', properties);

/**
 * `wbr { ... }` グローバル CSS ブロックを生成する。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成
 * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として
 * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。
 */
export const tagWbr = (properties: Properties): GlobalCss => tag('wbr', properties);
