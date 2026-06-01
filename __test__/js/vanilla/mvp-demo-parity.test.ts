/**
 * Task 7.2: `mvp-demo` パリティテスト。
 *
 * タスク 6.2 で `examples/mvp-demo.ts` の生 JS テンプレートリテラル `appJs` は
 * Vanilla Builder 呼び出しで完全に置き換えられた。本テストは新ビルダー出力
 * （`output/mvp_demo/script.js`）と、凍結済みレガシー fixture（旧 `appJs`）を
 * 比較し、意味的に等価な JS が生成されることを検証する。
 *
 * バイト完全一致は要求しない。空白・コメントを正規化した上でトークン集合を比較し、
 * 主要シンボル（DOMContentLoaded / querySelector / addEventListener / click /
 * keydown / Enter / classList / toggle / remove / appendChild / createElement）が
 * 双方に存在することを保証する。さらに下記の構造的性質も検証する:
 *   - `document.addEventListener("DOMContentLoaded", ...)` 登録の存在
 *   - ハンドラ骨格の等価性（同じイベント×同じターゲット selector の集合）
 *   - selector-once-per-access パターン（`querySelector("#id")` が登場する）
 *
 * 対応要件: 8.1, 8.2, 8.3, 8.4
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const DEMO_SRC = join(REPO_ROOT, 'examples', 'mvp-demo.ts');
const DEMO_OUT_DIR = join(REPO_ROOT, 'output', 'mvp_demo');
const SCRIPT_JS = join(DEMO_OUT_DIR, 'script.js');
const LEGACY_FIXTURE = join(
  __dirname,
  'fixtures',
  'mvp-demo-appjs-legacy.js',
);

/** コメント・空白を除去し、識別子トークン集合を返す。 */
function tokenize(src: string): Set<string> {
  let s = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
  s = s.replace(/(^|[^:])\/\/.*$/gm, '$1 ');
  s = s.replace(/\s+/g, ' ');
  const tokens = s.match(/[A-Za-z0-9_$]+/g) ?? [];
  return new Set(tokens);
}

/** `querySelector("sel").addEventListener("ev", …)` の (sel, ev) 組を抽出する。 */
function extractEventBindings(src: string): Set<string> {
  const bindings = new Set<string>();
  const re =
    /querySelector\(\s*"([^"]+)"\s*\)\s*\.addEventListener\(\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    bindings.add(`${m[1]}::${m[2]}`);
  }
  return bindings;
}

describe('Task 7.2: mvp-demo parity (legacy raw appJs vs Vanilla Builder output)', () => {
  let builderOut: string;
  let legacySrc: string;

  beforeAll(() => {
    // デモを最新で生成する（node --experimental-strip-types）。
    // execFileSync はシェル経由ではなく引数配列で子プロセスを起動するため安全。
    execFileSync('node', ['--experimental-strip-types', DEMO_SRC], {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
    expect(existsSync(SCRIPT_JS)).toBe(true);
    builderOut = readFileSync(SCRIPT_JS, 'utf-8');
    legacySrc = readFileSync(LEGACY_FIXTURE, 'utf-8');
  });

  it('fixture is the frozen legacy appJs source (sanity check)', () => {
    expect(legacySrc).toContain('document.addEventListener("DOMContentLoaded"');
    expect(legacySrc).toContain('function createTodoItem');
    expect(legacySrc).toContain('function updateCount');
    expect(legacySrc).toContain('function clearDone');
    expect(legacySrc).toContain('function addTodo');
  });

  it('both outputs register DOMContentLoaded handler', () => {
    expect(builderOut).toContain(
      'document.addEventListener("DOMContentLoaded"',
    );
    expect(legacySrc).toContain(
      'document.addEventListener("DOMContentLoaded"',
    );
  });

  it('critical tokens are present in both legacy and builder output', () => {
    const legacyTokens = tokenize(legacySrc);
    const builderTokens = tokenize(builderOut);

    const critical = [
      'querySelector',
      'addEventListener',
      'DOMContentLoaded',
      'click',
      'keydown',
      'Enter',
      'classList',
      'toggle',
      'remove',
      'appendChild',
      'createElement',
    ];

    for (const token of critical) {
      expect(
        legacyTokens.has(token),
        `legacy fixture missing critical token: ${token}`,
      ).toBe(true);
      expect(
        builderTokens.has(token),
        `builder output missing critical token: ${token}`,
      ).toBe(true);
    }
  });

  it('handler skeleton is equivalent: same (selector, event) binding set', () => {
    const legacy = extractEventBindings(legacySrc);
    const builder = extractEventBindings(builderOut);

    const expected = new Set([
      '#add-btn::click',
      '#clear-btn::click',
      '#todo-input::keydown',
    ]);
    for (const b of expected) {
      expect(legacy.has(b), `legacy missing ${b}`).toBe(true);
      expect(builder.has(b), `builder missing ${b}`).toBe(true);
    }
  });

  it('selector-once-per-access pattern is present (direct querySelector calls)', () => {
    expect(builderOut).toMatch(/document\.querySelector\(\s*"#[^"]+"\s*\)/);
    expect(legacySrc).toMatch(/document\.querySelector\(\s*"#[^"]+"\s*\)/);
  });
});
