/**
 * Task 7.2: リポジトリ衛生テスト #2 — 生 JS テンプレートリテラルの再導入防止。
 *
 * `examples/**\/*.{ts,tsx}` を走査し、各ファイルのテンプレートリテラルが
 * `addEventListener` と `querySelector` を同時に含む場合（または長さが 500 文字
 * を超えて片方のトークンを含む場合）に失敗させる。これはタスク 6.2 で除去した
 * 旧 `appJs` のような生 JS 塊をサンプル側に再混入させないためのガードである。
 *
 * 実装方針:
 *   - 外部ツールや glob ライブラリに依存せず `fs.readdirSync` で再帰する。
 *   - テンプレートリテラルは `` `...` `` をナイーブ抽出する（ネスト・エスケープ
 *     は考慮するが ${} 内の ` はデモ用途上発生しない前提で割り切る）。
 *
 * 対応要件: 8.1, 8.2, 8.3, 8.4
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(__dirname, '..');
const EXAMPLES_DIR = join(REPO_ROOT, 'examples');

const LENGTH_THRESHOLD = 500;

function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, acc);
    } else if (st.isFile()) {
      if (name.endsWith('.ts') || name.endsWith('.tsx')) {
        acc.push(full);
      }
    }
  }
  return acc;
}

/** 与えられたソースからテンプレートリテラルを抽出する（簡易実装）。 */
function extractTemplateLiterals(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    // 行コメント
    if (ch === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    // ブロックコメント
    if (ch === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // 文字列（テンプレ検出を阻害しないためスキップ）
    if (ch === "'" || ch === '"') {
      const quote = ch;
      i++;
      while (i < n && src[i] !== quote) {
        if (src[i] === '\\') i += 2;
        else i++;
      }
      i++;
      continue;
    }
    // テンプレートリテラル
    if (ch === '`') {
      i++;
      const start = i;
      while (i < n && src[i] !== '`') {
        if (src[i] === '\\') {
          i += 2;
          continue;
        }
        // ${…} はネスト走査は省略し、$ と { は単なる文字として扱う。
        // バッククオートが ${} 内部で使われる場合は誤検出しうるが
        // 本リポジトリのサンプル範囲では使わない前提。
        i++;
      }
      out.push(src.slice(start, i));
      i++; // 終端の `
      continue;
    }
    i++;
  }
  return out;
}

describe('Task 7.2: examples must not re-introduce raw JS template literals', () => {
  const files = walk(EXAMPLES_DIR);

  it('discovers at least one example .ts/.tsx file (sanity)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('no template literal contains both addEventListener and querySelector', () => {
    const violations: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf-8');
      const lits = extractTemplateLiterals(src);
      for (const lit of lits) {
        const lower = lit.toLowerCase();
        const hasEvt = lower.includes('addeventlistener');
        const hasQs = lower.includes('queryselector');
        if (hasEvt && hasQs) {
          violations.push(
            `${f}: template literal contains BOTH addEventListener and querySelector (len=${lit.length})`,
          );
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('no long (>500 chars) template literal contains addEventListener or querySelector', () => {
    const violations: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf-8');
      const lits = extractTemplateLiterals(src);
      for (const lit of lits) {
        if (lit.length <= LENGTH_THRESHOLD) continue;
        const lower = lit.toLowerCase();
        if (
          lower.includes('addeventlistener') ||
          lower.includes('queryselector')
        ) {
          violations.push(
            `${f}: long template literal (len=${lit.length}) contains raw JS DOM tokens`,
          );
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
