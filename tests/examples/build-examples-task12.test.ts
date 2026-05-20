/**
 * build-examples-task12.test.ts
 *
 * Task 1.2: エラー処理・`--run` フラグ・`dist/transformer` 未ビルド検出の検証テスト
 *
 * 検証観点:
 *   1. ホワイトリスト違反 fixture を渡すと exit(1) になり、
 *      ファイルパス・行番号・違反識別子が stderr に含まれること (Req 1.3)
 *   2. `dist/transformer/index.js` が存在しない状態では
 *      "Run 'pnpm build:transformer' first" を stderr 出力して exit(1) になること
 *   3. `--run` フラグがある場合、emit 後に node で実行されること
 *
 * 実行コマンド: `node_modules/.bin/vitest run tests/examples/build-examples-task12.test.ts`
 *
 * Requirements: 1.2, 1.3
 * Design: ExampleBuildScript — Error Handling section
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const ROOT_DIR = join(import.meta.dirname, '../..');
const SCRIPT = join(ROOT_DIR, 'scripts/build-examples.ts');
const VIOLATION_FIXTURE = join(
  ROOT_DIR,
  'tests/examples/fixtures/whitelist-violation.fixture.ts',
);
const DIST_TRANSFORMER = join(ROOT_DIR, 'dist/transformer/index.js');
const DIST_TRANSFORMER_BACKUP = join(ROOT_DIR, 'dist/transformer/index.js.bak');

// ---- Helper: run the script and capture result (does NOT throw on non-zero exit) ----

function runScript(
  args: string[],
  env?: Record<string, string>,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(
    'node',
    ['--experimental-strip-types', SCRIPT, ...args],
    {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      timeout: 60_000,
      env: { ...process.env, ...env },
    },
  );
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

// ---- Test suite ----------------------------------------------------------------

describe('Task 1.2 build-examples.ts — エラー処理・--run・未ビルド検出', () => {
  // ---- 1. ホワイトリスト違反 → exit(1) + stderr にファイル・行・識別子 --------

  describe('Req 1.3: ホワイトリスト違反 fixture はコンパイルエラーで exit(1) になる', () => {
    it('whitelist-violation.fixture.ts を渡すと exit(1) になる', () => {
      const result = runScript([VIOLATION_FIXTURE]);

      expect(result.status).toBe(1);
    });

    it('stderr にファイルパスが含まれる', () => {
      const result = runScript([VIOLATION_FIXTURE]);

      // TypeScript diagnostics format includes the file path
      expect(result.stderr).toMatch(/whitelist-violation\.fixture\.ts/);
    });

    it('stderr に行番号が含まれる', () => {
      const result = runScript([VIOLATION_FIXTURE]);

      // TypeScript diagnostics format: file.ts:line:col e.g. "whitelist-violation.fixture.ts:23:17"
      // Strip ANSI color codes before matching (TS adds color escapes between path/line/col)
      const ansiPattern = new RegExp(String.fromCharCode(27) + '\\[\\d+m', 'g');
      const stripped = result.stderr.replace(ansiPattern, '');
      expect(stripped).toMatch(/whitelist-violation\.fixture\.ts:\d+:\d+/);
    });

    it('stderr に違反識別子名が含まれる', () => {
      const result = runScript([VIOLATION_FIXTURE]);

      // TS2304 error mentions the undefined identifier 'nonExistentVar'
      // (whitelist-violation.fixture.ts uses `console.log(nonExistentVar)`)
      const combined = result.stderr + result.stdout;
      expect(combined).toMatch(/nonExistentVar/);
    });
  });

  // ---- 2. dist/transformer 未ビルド → exit(1) + "pnpm build:transformer" メッセージ ----

  describe('dist/transformer 未ビルド検出 → exit(1) + ガイドメッセージ', () => {
    // We temporarily rename dist/transformer/index.js to simulate the "not built" state
    beforeEach(() => {
      if (existsSync(DIST_TRANSFORMER)) {
        renameSync(DIST_TRANSFORMER, DIST_TRANSFORMER_BACKUP);
      }
    });

    afterEach(() => {
      // Restore the file
      if (existsSync(DIST_TRANSFORMER_BACKUP)) {
        renameSync(DIST_TRANSFORMER_BACKUP, DIST_TRANSFORMER);
      }
    });

    it('dist/transformer/index.js が不在のとき exit(1) になる', () => {
      const result = runScript([VIOLATION_FIXTURE]);

      expect(result.status).toBe(1);
    });

    it("dist/transformer/index.js が不在のとき stderr に \"Run 'pnpm build:transformer' first\" が含まれる", () => {
      const result = runScript([VIOLATION_FIXTURE]);

      expect(result.stderr).toContain("Run 'pnpm build:transformer' first");
    });
  });

  // ---- 3. --run フラグ → emit 後に node 実行 -----------------------------------

  describe('--run フラグ: emit 後に node で実行される', () => {
    // Use a minimal fixture with no external imports so the compiled JS can run
    // cleanly from .out/examples/ without module-resolution errors.
    // (shopping-cart.ts uses `import from '../dist/index.js'` which after compilation
    // to .out/examples/ resolves correctly to dist/index.js)
    const RUN_FIXTURE = join(
      ROOT_DIR,
      'tests/examples/fixtures/run-flag.fixture.ts',
    );
    const OUTPUT_JS = join(ROOT_DIR, '.out/examples/run-flag.fixture.js');

    beforeEach(() => {
      // Ensure .out/examples directory exists and remove stale output
      mkdirSync(join(ROOT_DIR, '.out/examples'), { recursive: true });
      if (existsSync(OUTPUT_JS)) {
        rmSync(OUTPUT_JS);
      }
    });

    it('--run なし: .out/examples/run-flag.fixture.js のみ生成し node を起動しない (exit 0)', () => {
      const result = runScript([RUN_FIXTURE]);

      // Should succeed and generate the output file
      expect(result.status).toBe(0);
      expect(existsSync(OUTPUT_JS)).toBe(true);
    });

    it('--run あり: emit 後に node .out/examples/run-flag.fixture.js を実行する (exit 0)', () => {
      // The fixture writes a sentinel file when SENTINEL_PATH env var is set.
      // Verifying the file exists proves node was actually invoked by --run.
      const sentinel = join(tmpdir(), 'draftole-run-test.txt');
      if (existsSync(sentinel)) {
        rmSync(sentinel);
      }

      const result = runScript([RUN_FIXTURE, '--run'], { SENTINEL_PATH: sentinel });

      // The compile + run chain should exit 0
      expect(result.status).toBe(0);
      // Sentinel file must exist — proves node actually executed the compiled fixture
      expect(existsSync(sentinel)).toBe(true);
    });
  });
});
