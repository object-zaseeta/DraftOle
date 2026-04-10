/**
 * SEC-2: CSS値サニタイズ
 *
 * CSS経由のXSS攻撃（url(javascript:), expression() 等）を検出・ブロックする。
 * SEC-1（属性値サニタイズ）のCSS版。
 *
 * ブロック対象:
 * - url(javascript:...) / url(vbscript:...) — CSS URLインジェクション
 * - expression(...) — IE CSS式（レガシーだが防御）
 *
 * 許可:
 * - url(https://...) / url(image.png) — 通常のURL
 * - url(data:image/...) — インライン画像
 * - linear-gradient(), radial-gradient() — グラデーション
 * - var(), calc(), blur() 等 — 標準CSS関数
 */

/** url() 内の危険スキーム検出 */
const DANGEROUS_URL_SCHEME = /url\s*\(\s*['"]?\s*(javascript|vbscript)\s*:/i;

/** IE CSS式 検出 */
const CSS_EXPRESSION = /expression\s*\(/i;

/**
 * CSS値をサニタイズする。
 * 危険なパターンが含まれる場合は空文字列を返す。
 */
export function sanitizeCssValue(value: string): string {
  if (DANGEROUS_URL_SCHEME.test(value)) return '';
  if (CSS_EXPRESSION.test(value)) return '';
  return value;
}

/**
 * CSSプロパティMapをCSS文字列にレンダリングする（サニタイズ内蔵）。
 *
 * 全13 CSSプロパティクラスの render() で共通使用される。
 * - 危険な値は除外される
 * - プロパティはキー名アルファベット順
 * - フォーマット: `key: value;\nkey: value;`
 */
export function renderCssProperties(properties: Map<string, string>): string {
  if (properties.size === 0) return '';

  const safe = [...properties.entries()]
    .filter(([, value]) => sanitizeCssValue(value) !== '')
    .sort((a, b) => a[0].localeCompare(b[0]));

  if (safe.length === 0) return '';

  return safe
    .map(([key, value]) => `${key}: ${value}`)
    .join(';\n') + ';';
}
