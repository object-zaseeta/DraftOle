/**
 * gen-tag-dsl.ts
 *
 * HTMLElementTagNameMap の全タグに対して tagXxx(props) ショートカット関数を生成する。
 * 生成先: src/css/variables/tag-dsl.generated.ts
 *
 * 実行: node --experimental-strip-types scripts/gen-tag-dsl.ts
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// TypeScript の lib.dom.d.ts から抽出した HTMLElementTagNameMap の全キー
const HTML_TAGS = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd',
  'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'menu', 'meta', 'meter',
  'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'picture', 'pre', 'progress',
  'q',
  'rp', 'rt', 'ruby',
  's', 'samp', 'script', 'search', 'section', 'select', 'slot', 'small',
  'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead',
  'time', 'title', 'tr', 'track',
  'u', 'ul',
  'var', 'video',
  'wbr',
] as const satisfies readonly (keyof HTMLElementTagNameMap)[];

function toCamelCase(tag: string): string {
  // 全て小文字タグ名なのでそのまま先頭大文字化
  return tag[0].toUpperCase() + tag.slice(1);
}

const lines: string[] = [
  '/**',
  ' * tag-dsl.generated.ts',
  ' *',
  ' * ⚠️ このファイルは自動生成です。直接編集しないでください。',
  ' * 再生成: node --experimental-strip-types scripts/gen-tag-dsl.ts',
  ' *',
  ' * HTML タグセレクタ用グローバル CSS DSL ショートカット関数。',
  ' * 各関数は `tag(tagName, props)` の薄いラッパーであり、',
  ' * 戻り値は `GlobalCss` branded type です。',
  ' * ルートレベルのグローバル CSS 定義のみに使用してください。',
  ' */',
  '',
  "import type { GlobalCss } from './global-css.js';",
  "import { tag } from './global-dsl.js';",
  '',
  "type Properties = Record<string, string>;",
  '',
];

for (const tagName of HTML_TAGS) {
  const fnName = `tag${toCamelCase(tagName)}`;
  lines.push(
    '/**',
    ` * \`${tagName} { ... }\` グローバル CSS ブロックを生成する。`,
    ' *',
    ' * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は要素単位クラス合成',
    ' * （`css.class` + `el.<tag>({ css: ... })`）を使うこと。本関数は `sel.tag<TagName>` の実装基盤として',
    ' * 内部実装で継続使用される。詳細は [docs/deprecation-policy.md](../../../docs/deprecation-policy.md) 参照。',
    ' */',
    `export const ${fnName} = (properties: Properties): GlobalCss => tag('${tagName}', properties);`,
    '',
  );
}

const output = lines.join('\n');
const outPath = join(import.meta.dirname, '../src/css/variables/tag-dsl.generated.ts');
writeFileSync(outPath, output, 'utf-8');
console.log(`Generated: ${outPath} (${HTML_TAGS.length} tags)`);
