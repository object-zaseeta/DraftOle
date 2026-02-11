/**
 * HTMLFormatter: minified HTMLを整形済みHTMLに変換するユーティリティ
 *
 * protoRender()が生成したインデントなしHTML文字列を、
 * 4スペースインデント + 改行付きの整形済みHTMLに変換する。
 *
 * Requirements: 6.1
 */

const INDENT_SPACES = 4;

/**
 * HTML文字列をトークンに分解する
 * トークン: 開始タグ / 終了タグ / 自己終了タグ / テキスト
 */
function tokenize(html: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) {
        tokens.push(html.slice(i));
        break;
      }
      tokens.push(html.slice(i, end + 1));
      i = end + 1;
    } else {
      const next = html.indexOf('<', i);
      if (next === -1) {
        tokens.push(html.slice(i));
        break;
      }
      tokens.push(html.slice(i, next));
      i = next;
    }
  }
  return tokens;
}

/** 自己終了タグの名前セット */
const VOID_ELEMENTS = new Set([
  'br', 'hr', 'img', 'input', 'meta', 'link',
  'source', 'track', 'area', 'col', 'base', 'embed', 'wbr',
]);

function getTagName(token: string): string | null {
  const match = token.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
  return match?.[1]?.toLowerCase() ?? null;
}

function isClosingTag(token: string): boolean {
  return token.startsWith('</');
}

function isVoidElement(token: string): boolean {
  const name = getTagName(token);
  return name !== null && VOID_ELEMENTS.has(name);
}

function isOpeningTag(token: string): boolean {
  return token.startsWith('<') && !isClosingTag(token) && !isVoidElement(token);
}

export class HTMLFormatter {
  static format(minifiedHtml: string): string {
    if (minifiedHtml === '') return '';

    const tokens = tokenize(minifiedHtml);
    if (tokens.length <= 1) return minifiedHtml;

    const lines: string[] = [];
    let level = 0;
    let buffer = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === undefined) continue;

      if (isClosingTag(token)) {
        // 終了タグ: バッファにある内容を先に出力し、レベルを下げる
        if (buffer !== '') {
          // バッファ内にテキスト+開始タグがペアで完結する場合はインラインで出力
          lines.push(' '.repeat(INDENT_SPACES * level) + buffer + token);
          buffer = '';
        } else {
          level--;
          lines.push(' '.repeat(INDENT_SPACES * level) + token);
        }
      } else if (isOpeningTag(token)) {
        // 開始タグ: 次のトークンを先読みして、テキスト+終了タグのインライン判定
        const next = tokens[i + 1];
        const nextNext = tokens[i + 2];

        // テキスト + 終了タグ → インライン化 (例: <p>Hello</p>)
        if (next !== undefined && !next.startsWith('<') &&
            nextNext !== undefined && isClosingTag(nextNext)) {
          lines.push(' '.repeat(INDENT_SPACES * level) + token + next + nextNext);
          i += 2;
        }
        // 直後が終了タグ → 空タグのインライン化 (例: <span></span>)
        else if (next !== undefined && isClosingTag(next) && getTagName(token) === getTagName(next)) {
          lines.push(' '.repeat(INDENT_SPACES * level) + token + next);
          i += 1;
        }
        else {
          lines.push(' '.repeat(INDENT_SPACES * level) + token);
          level++;
        }
      } else if (isVoidElement(token)) {
        lines.push(' '.repeat(INDENT_SPACES * level) + token);
      } else {
        // テキストノード
        if (i === 0 && tokens.length === 1) {
          return minifiedHtml;
        }
        lines.push(' '.repeat(INDENT_SPACES * level) + token);
      }
    }

    return lines.join('\n');
  }
}
