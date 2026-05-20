/**
 * `examples/interactive/mvp-demo.ts` の import 数検査テスト（Task 6.3）。
 *
 * `examples/interactive/mvp-demo.ts` を AST として解析し、
 * 旧 JS 操作系 named import（on / query / addClass 等 18 シンボル）が
 * ゼロであることをアサートする。
 *
 * これにより unified-element-api Task 5.1 の制約（Req 5.1, 5.2）が
 * デモファイルで遵守されているかを将来の退行時に検出できる。
 *
 * 解析手法: 正規表現による named import 抽出
 *   - `import { ... } from "..."` ブロックを抽出してシンボル一覧化
 *   - 外部ライブラリ以外（dist/index.js）からの import のみ対象
 *
 * Requirements: 5.1, 5.2 (unified-element-api)
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// ── 禁止シンボル一覧 ─────────────────────────────────────────────────────────

/**
 * unified-element-api Task 5.1 で internal/ に隔離された旧フラット関数群。
 * これらが examples/interactive/mvp-demo.ts から import されていないことを検査する。
 */
const BANNED_IMPORTS = [
  'addClass',
  'appendChild',
  'containsClass',
  'filterNot',
  'length',
  'on',
  'onDomReady',
  'query',
  'queryAll',
  'removeAll',
  'setStyle',
  'setText',
  'setValue',
  'toggleClass',
  // ローカルヘルパ（型も含む）
  'asJsExpr',
  'asJsBoolExpr',
] as const;

// ── ファイル読み込み ──────────────────────────────────────────────────────────

const DEMO_FILE = join(import.meta.dirname, '../../examples/interactive/mvp-demo.ts');
const demoSource = readFileSync(DEMO_FILE, 'utf-8');

// ── named import 抽出 ──────────────────────────────────────────────────────────

/**
 * ソースコードから named import のシンボル集合を抽出する。
 * `import { A, B, type C } from "..."` 形式を対象とし、
 * `type` キーワードも含めてシンボル名だけを収集する。
 */
function extractNamedImports(source: string): Set<string> {
  const symbols = new Set<string>();

  // 複数行にまたがる import { ... } from "..." をキャプチャ
  const importBlockRe = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["'][^"']+["']/gs;
  for (const match of source.matchAll(importBlockRe)) {
    const block = match[1];
    // シンボルをカンマ分割して取得（エイリアスは "as" より前、type キーワードを除く）
    for (const raw of block.split(',')) {
      const token = raw
        .trim()
        .replace(/^type\s+/, '')   // type import
        .split(/\s+as\s+/)[0]     // alias
        .trim();
      if (token) symbols.add(token);
    }
  }
  return symbols;
}

const importedSymbols = extractNamedImports(demoSource);

// ── テスト ───────────────────────────────────────────────────────────────────

describe('mvp-demo.ts: JS 操作系 named import ゼロ検査（Req 5.1, 5.2）', () => {
  for (const sym of BANNED_IMPORTS) {
    it(`"${sym}" が import されていない`, () => {
      expect(importedSymbols.has(sym)).toBe(false);
    });
  }
});

describe('mvp-demo.ts: 必須 import の存在確認', () => {
  // app() 高レベル API への移行後、Root / FileExporter は app() / doc.exportTo()
  // に置き換わり、HTML 要素ファクトリは el namespace 経由でアクセスする。
  const REQUIRED_IMPORTS = ['app', 'el', 'hstack', 'vstack'] as const;

  for (const sym of REQUIRED_IMPORTS) {
    it(`"${sym}" が import されている`, () => {
      expect(importedSymbols.has(sym)).toBe(true);
    });
  }

  it('CSS ユーティリティが import されている（css ネームスペース）', () => {
    // css-namespace-facade 移行後は単一 `css` ネームスペースから利用する。
    expect(importedSymbols.has('css')).toBe(true);
  });
});
