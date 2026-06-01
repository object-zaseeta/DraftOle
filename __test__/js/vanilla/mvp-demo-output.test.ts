/**
 * Task 6.2: `examples/mvp-demo.ts` を Vanilla Builder で書き換えた結果、
 * ビルド出力 `output/mvp_demo/script.js` が期待シンボルを含むことを検証するスモークテスト。
 *
 * - ライブラリ関数のユニットテストではなく、デモ実行による連携検証。
 * - 完全なパリティ検証（原本 `appJs` との意味的一致）はタスク 7.2 の
 *   `mvp-demo-parity.test.ts` が担当する。本テストはタスク 6.2 スコープに閉じる。
 *
 * 対応要件: 8.1 / 8.2 / 8.4
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const DEMO_SRC = join(REPO_ROOT, 'examples', 'mvp-demo.ts');
const DEMO_OUT_DIR = join(REPO_ROOT, 'output', 'mvp_demo');
const SCRIPT_JS = join(DEMO_OUT_DIR, 'script.js');

describe('Task 6.2: mvp-demo.ts Vanilla Builder 置換後の生成 JS スモーク', () => {
  let scriptContent: string;

  beforeAll(() => {
    // demo を実行（node --experimental-strip-types）して最新の script.js を生成する。
    execFileSync('node', ['--experimental-strip-types', DEMO_SRC], {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
    expect(existsSync(SCRIPT_JS)).toBe(true);
    scriptContent = readFileSync(SCRIPT_JS, 'utf-8');
  });

  it('generates output/mvp_demo/script.js', () => {
    expect(scriptContent.length).toBeGreaterThan(0);
  });

  it('defines all 4 functions (createTodoItem / updateCount / clearDone / addTodo)', () => {
    expect(scriptContent).toMatch(/function createTodoItem\s*\(\s*text\s*\)/);
    expect(scriptContent).toMatch(/function updateCount\s*\(\s*\)/);
    expect(scriptContent).toMatch(/function clearDone\s*\(\s*\)/);
    expect(scriptContent).toMatch(/function addTodo\s*\(\s*\)/);
  });

  it('wraps DOMContentLoaded registrations (script.onDomReady 出力)', () => {
    expect(scriptContent).toContain(
      'document.addEventListener("DOMContentLoaded"',
    );
  });

  it('wires #add-btn / #clear-btn click handlers and #todo-input keydown', () => {
    expect(scriptContent).toContain('document.querySelector("#add-btn")');
    expect(scriptContent).toContain('document.querySelector("#clear-btn")');
    expect(scriptContent).toContain('document.querySelector("#todo-input")');
    expect(scriptContent).toMatch(/\.addEventListener\("click"/);
    expect(scriptContent).toMatch(/\.addEventListener\("keydown"/);
    // Enter キー投入の条件分岐
    expect(scriptContent).toContain('e.key === "Enter"');
  });

  it('uses queryAll + filter + length for updateCount', () => {
    expect(scriptContent).toContain('#todo-list .item');
    expect(scriptContent).toMatch(/\.filter\(\(x\)\s*=>\s*!\(x\.classList\.contains\("done"\)\)\)/);
    expect(scriptContent).toContain('.length + " items"');
  });

  it('does not contain jQuery / $ identifiers (Req 1.5, 7.1)', () => {
    // 単語境界付きで検査し、`$` を含む selector 文字列リテラル等は誤検出しない（デモには存在しない）。
    expect(scriptContent).not.toMatch(/\bjQuery\b/);
    expect(scriptContent).not.toMatch(/\$\s*\(/); // `$(...)` 形式は出力されない
  });
});
