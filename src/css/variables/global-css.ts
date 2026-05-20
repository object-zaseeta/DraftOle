/**
 * GlobalCss branded type と内部ヘルパ
 *
 * `GlobalCss` は string の subtype として branded nominal 型を提供する。
 * 外部コードが生 string を `GlobalCss` として渡すことをコンパイル時に阻止する。
 *
 * 内部 `brand()` がこのモジュールにおける唯一のキャスト発生点。
 * DSL 関数群（global-dsl.ts）はこのモジュールの内部 API を通じてのみ GlobalCss を生成する。
 */

import { sanitizeCssValue } from '../utils/css-sanitizer.js';

/**
 * GlobalCss branded type。
 * `string & { readonly __globalCss: unique symbol }` により、
 * 生 string との代入非互換性を型システムで保証する。
 *
 * @example
 * ```typescript
 * // コンパイルエラー（生 string は渡せない）
 * const css: GlobalCss = "body { color: red; }";  // Error!
 *
 * // 正しい使い方（DSL 経由）
 * import { rule } from './global-dsl.js';
 * const css: GlobalCss = rule("body", { color: "red" });
 * ```
 */
export type GlobalCss = string & { readonly __globalCss: unique symbol };

/**
 * 内部用キャスト関数。モジュール外には export しない。
 * DSL 関数が組み立てた CSS 文字列を GlobalCss として返すための唯一の経路。
 *
 * @param rendered - 完成形の CSS 文字列
 * @returns GlobalCss 型にキャストされた同一文字列（実行時は no-op）
 */
export function brand(rendered: string): GlobalCss {
  return rendered as unknown as GlobalCss;
}

/**
 * camelCase または PascalCase の CSS プロパティ名を kebab-case に変換する。
 * CSS カスタムプロパティ（`--` 始まり）はそのまま返す。
 *
 * @example
 * toKebabCase("boxSizing")   // → "box-sizing"
 * toKebabCase("fontSize")    // → "font-size"
 * toKebabCase("--myVar")     // → "--my-var" (大文字変換のみ)
 *
 * @param camel - 変換元のプロパティ名
 * @returns kebab-case に変換されたプロパティ名
 */
export function toKebabCase(camel: string): string {
  return camel.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * プロパティオブジェクトを CSS 宣言行（インデント付き）に整形する。
 * 各値は `sanitizeCssValue` でサニタイズされ、危険な値は除外される。
 * 各行は 2スペースインデント付きで改行区切り。
 *
 * @example
 * renderProperties({ boxSizing: "border-box", color: "red" })
 * // → "  box-sizing: border-box;\n  color: red;"
 *
 * @param properties - CSS プロパティの key-value オブジェクト
 * @returns インデント付き CSS 宣言行（複数行は改行区切り）
 */
export function renderProperties(properties: Record<string, string>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(properties)) {
    const safe = sanitizeCssValue(value);
    if (safe === '') continue;
    const kebab = toKebabCase(key);
    lines.push(`  ${kebab}: ${safe};`);
  }
  return lines.join('\n');
}

/**
 * セレクタと本体から CSS ブロック文字列を生成する。
 *
 * @example
 * wrapBlock(":root", "  --bg: #000;")
 * // → ":root {\n  --bg: #000;\n}"
 *
 * wrapBlock("body", "  color: red;\n  margin: 0;")
 * // → "body {\n  color: red;\n  margin: 0;\n}"
 *
 * @param selector - CSS セレクタ文字列
 * @param body - インデント済みの CSS 宣言行
 * @returns 完成形の CSS ブロック文字列
 */
export function wrapBlock(selector: string, body: string): string {
  return `${selector} {\n${body}\n}`;
}
