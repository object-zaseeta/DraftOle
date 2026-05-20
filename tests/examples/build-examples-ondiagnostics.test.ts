/**
 * build-examples-ondiagnostics.test.ts
 *
 * Task 4.1 / 4.2: `scripts/build-examples.ts` の onDiagnostics 経路統合テスト
 *
 * 検証観点:
 *   1. Transformer Error 経路: whitelist-violation fixture で
 *      - exit code 1 (Req 2.1, 2.3)
 *      - stderr に `[draftole-transformer Error]` プレフィックス (Req 1.1, 1.3, 4.1)
 *      - stderr に `whitelist-violation.fixture.ts:` (file:line:col format, Req 1.3)
 *   2. クリーン経路: examples/interactive/app-counter.ts で
 *      - exit code 0 (Req 2.2)
 *      - stderr に `[draftole-transformer ` プレフィックスを含まない (Req 1.2, 4.2)
 *
 * 実行コマンド: `node_modules/.bin/vitest run tests/examples/build-examples-ondiagnostics.test.ts`
 *
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 4.1, 4.2, 4.4
 * Spec: .kiro/specs/build-examples-ondiagnostics/
 */

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = join(import.meta.dirname, '../..');
const SCRIPT = join(ROOT_DIR, 'scripts/build-examples.ts');
const VIOLATION_FIXTURE = join(
  ROOT_DIR,
  'tests/examples/fixtures/whitelist-violation.fixture.ts',
);
const CLEAN_EXAMPLE = join(ROOT_DIR, 'examples/interactive/app-counter.ts');
const WARNING_FIXTURE = join(
  ROOT_DIR,
  'tests/examples/fixtures/transformer-warning.fixture.ts',
);

// ---- Helper: run the script and capture result (does NOT throw on non-zero exit) ----

function runScript(args: string[]): {
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const result = spawnSync(
    'node',
    ['--experimental-strip-types', SCRIPT, ...args],
    {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      timeout: 60_000,
      env: { ...process.env },
    },
  );
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

// ---- Test suite ----------------------------------------------------------------

describe('build-examples.ts onDiagnostics 経路統合テスト', () => {
  // ---- Task 4.1: エラー経路 -------------------------------------------------

  describe('Task 4.1: Transformer Error 経路 (whitelist-violation fixture)', () => {
    it('exit code 1 で終了する (Req 2.1, 2.3)', () => {
      const result = runScript([VIOLATION_FIXTURE]);

      expect(result.status).toBe(1);
    });

    it('stderr に [draftole-transformer Error] プレフィックスを含む (Req 1.1, 1.3, 4.1)', () => {
      const result = runScript([VIOLATION_FIXTURE]);

      expect(result.stderr).toContain('[draftole-transformer Error]');
    });

    it('stderr に whitelist-violation.fixture.ts: (file:line:col) を含む (Req 1.3)', () => {
      const result = runScript([VIOLATION_FIXTURE]);

      expect(result.stderr).toContain('whitelist-violation.fixture.ts:');
    });
  });

  // ---- Task 4.2: クリーン経路 ------------------------------------------------

  describe('Task 4.2: クリーン経路 (examples/interactive/app-counter.ts)', () => {
    it('exit code 0 で終了する (Req 2.2)', () => {
      const result = runScript([CLEAN_EXAMPLE]);

      expect(result.status).toBe(0);
    });

    it('stderr に [draftole-transformer プレフィックスを含まない (Req 1.2, 4.2)', () => {
      const result = runScript([CLEAN_EXAMPLE]);

      expect(result.stderr).not.toContain('[draftole-transformer ');
    });
  });

  // ---- Task 4.3: 警告経路 ----------------------------------------------------

  describe('Task 4.3: Transformer Warning/Suggestion 経路 (transformer-warning fixture)', () => {
    it('exit code 0 で終了する (Req 2.2)', () => {
      const result = runScript([WARNING_FIXTURE]);

      expect(result.status).toBe(0);
    });

    it('stderr に [draftole-transformer Warning] または [draftole-transformer Suggestion] プレフィックスを含む (Req 1.1, 4.3)', () => {
      const result = runScript([WARNING_FIXTURE]);

      expect(result.stderr).toMatch(
        /\[draftole-transformer (Warning|Suggestion)\]/,
      );
    });
  });
});
