import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Architecture boundary tests for `src/html/elements/_internal/`
 * (html-tag-responsibility-split spec)
 *
 * This file verifies that `_internal/` helpers — extracted from `html-tag.ts`
 * into `src/html/elements/_internal/` — are NOT imported from any module
 * outside of `src/html/elements/`.
 *
 * FORBIDDEN:
 *   src/{view,app,publisher,runtime,document,transformer,css,js,utils}/**
 *     -X-> src/html/elements/_internal/**       (FORBIDDEN)
 *
 * Validation strategy: source-text inspection via readFileSync + import-line
 * grep. The forbidden pattern catches relative imports such as
 *   `from '../html/elements/_internal/frame-options.js'`
 *   `from '../../html/elements/_internal/breakpoint-applier.js'`
 *   `from '../../../html/elements/_internal/proto-render-pipeline.js'`
 *
 * The grep style mirrors `root-boundary.test.ts` and
 * `page-app-composition-boundary.test.ts`.
 *
 * Corresponding requirements: 5.2
 * Corresponding design: §Components and Interfaces →
 *   tests/architecture/html-elements-internal-boundary.test.ts
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = resolve(__dirname, '../../src');

/**
 * Directories whose `*.ts` files must NOT import from
 * `src/html/elements/_internal/`.
 */
const FORBIDDEN_SOURCE_DIRS = [
  'view',
  'app',
  'publisher',
  'runtime',
  'document',
  'transformer',
  'css',
  'js',
  'utils',
] as const;

/**
 * Regex matching `from '<…>html/elements/_internal/<…>'` import paths.
 *
 * Examples that match:
 *   from '../html/elements/_internal/frame-options.js'
 *   from '../../html/elements/_internal/breakpoint-applier.js'
 *   from '../../../html/elements/_internal/host-types.js'
 *
 * Anchored to a relative-path prefix (`./` or `../`) so unrelated occurrences
 * (e.g. comments containing the substring) are not flagged.
 */
const INTERNAL_IMPORT_PATTERN =
  /from\s+['"](?:\.\.?\/)+(?:.*?\/)?html\/elements\/_internal\//;

// ── helpers ──────────────────────────────────────────────────────────────────

/** Recursively collect all `*.ts` files under `dirPath`. */
function collectTsFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  const out: string[] = [];
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** Return all `import … from '…'` source strings found in a file. */
function importLines(filePath: string): string[] {
  if (!existsSync(filePath)) return [];
  const src = readFileSync(filePath, 'utf8');
  return src
    .split('\n')
    .filter(line => /^\s*import\b/.test(line));
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('architecture: html/elements/_internal boundary (html-tag-responsibility-split)', () => {
  // ── 1. _internal/ directory sanity ──────────────────────────────────────────
  describe('_internal/ directory sanity', () => {
    const INTERNAL_DIR = resolve(SRC, 'html/elements/_internal');

    it('src/html/elements/_internal/ ディレクトリが存在する', () => {
      expect(existsSync(INTERNAL_DIR)).toBe(true);
      expect(statSync(INTERNAL_DIR).isDirectory()).toBe(true);
    });
  });

  // ── 2. FORBIDDEN: 各外部 directory から _internal/ への import を検出 ────────
  describe('FORBIDDEN: external directories must not import from html/elements/_internal/', () => {
    for (const dirName of FORBIDDEN_SOURCE_DIRS) {
      const targetDir = resolve(SRC, dirName);

      // 各 directory ごとに独立した it ブロックを生成し、違反箇所を明示する。
      // ディレクトリが存在しない場合は前方互換として trivially pass する。
      it(`src/${dirName}/**/*.ts が html/elements/_internal/ を import しない`, () => {
        const files = collectTsFiles(targetDir);
        const violations: string[] = [];
        for (const file of files) {
          const lines = importLines(file);
          for (const line of lines) {
            if (INTERNAL_IMPORT_PATTERN.test(line)) {
              violations.push(`${relative(SRC, file)}: ${line.trim()}`);
            }
          }
        }
        expect(
          violations,
          `src/${dirName}/** must not import from src/html/elements/_internal/ ` +
            '(html-tag-responsibility-split Req 5.2: _internal は html/elements 外部非公開)',
        ).toEqual([]);
      });
    }
  });

  // ── 3. Aggregate sweep across all FORBIDDEN_SOURCE_DIRS ─────────────────────
  describe('FORBIDDEN (aggregate): no external _internal/ import across all guarded dirs', () => {
    it('src/{view,app,publisher,runtime,document,transformer,css,js,utils}/**/*.ts 全体で _internal/ への import がゼロ件である', () => {
      const violations: string[] = [];
      for (const dirName of FORBIDDEN_SOURCE_DIRS) {
        const targetDir = resolve(SRC, dirName);
        const files = collectTsFiles(targetDir);
        for (const file of files) {
          const lines = importLines(file);
          for (const line of lines) {
            if (INTERNAL_IMPORT_PATTERN.test(line)) {
              violations.push(`${relative(SRC, file)}: ${line.trim()}`);
            }
          }
        }
      }
      expect(
        violations,
        'No external module under guarded directories may import from src/html/elements/_internal/ (Req 5.2)',
      ).toEqual([]);
    });
  });
});
