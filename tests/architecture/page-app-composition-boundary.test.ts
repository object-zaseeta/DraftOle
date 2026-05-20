import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Architecture boundary tests for page/app composition boundary
 * (page-app-composition-boundary spec)
 *
 * This file verifies that `src/view/app-slot.ts` does NOT depend on `app/` modules.
 * AppSlot is a StaticView primitive in the `view/` layer and must remain decoupled
 * from the runtime `app/` layer.
 *
 * FORBIDDEN:
 *   src/view/app-slot.ts  -X->  app/*  (FORBIDDEN)
 *
 * Validation strategy: source-text inspection via readFileSync + import-line analysis.
 * These are "forward-compatible" tests: they assert that forbidden imports do NOT exist,
 * and will fail as designed if such imports are accidentally introduced.
 *
 * Corresponding spec: page-app-composition-boundary
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = resolve(__dirname, '../../src');

// ── helpers ──────────────────────────────────────────────────────────────────

/** Return all `import … from '…'` source strings found in a file. */
function importLines(filePath: string): string[] {
  if (!existsSync(filePath)) return [];
  const src = readFileSync(filePath, 'utf8');
  return src
    .split('\n')
    .filter(line => /^\s*import\b/.test(line));
}

/**
 * Assert that none of the import lines in `filePath` match `pattern`.
 * When `filePath` does not exist the test trivially passes (file not yet created).
 */
function assertNoForbiddenImport(filePath: string, pattern: RegExp, description: string): void {
  const lines = importLines(filePath);
  const violations = lines.filter(line => pattern.test(line));
  expect(violations, description).toEqual([]);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('architecture: page/app composition boundary (page-app-composition-boundary)', () => {

  const APP_SLOT_TS = resolve(SRC, 'view/app-slot.ts');

  // ── 1. app-slot.ts source structure sanity ───────────────────────────────────
  describe('AppSlot source structure', () => {
    it('src/view/app-slot.ts が存在する', () => {
      expect(existsSync(APP_SLOT_TS)).toBe(true);
    });

    it('AppSlot が export されている', () => {
      const src = readFileSync(APP_SLOT_TS, 'utf8');
      expect(src).toMatch(/export\s+(function|class|const)\s+AppSlot\b/);
    });
  });

  // ── 2. FORBIDDEN: app-slot.ts -> app/* (relative ../../app) ──────────────────
  describe("FORBIDDEN: src/view/app-slot.ts must not import from '../../app'", () => {
    it("src/view/app-slot.ts が from '../../app で始まる import を持たない (前方互換)", () => {
      assertNoForbiddenImport(
        APP_SLOT_TS,
        /from\s+['"]\.\.\/\.\.\/app/,
        "app-slot.ts must not import from '../../app (would break view/app boundary)",
      );
    });
  });

  // ── 3. FORBIDDEN: app-slot.ts -> app/* (relative ../app) ─────────────────────
  describe("FORBIDDEN: src/view/app-slot.ts must not import from '../app'", () => {
    it("src/view/app-slot.ts が from '../app で始まる import を持たない (前方互換)", () => {
      assertNoForbiddenImport(
        APP_SLOT_TS,
        /from\s+['"]\.\.\/app/,
        "app-slot.ts must not import from '../app (would break view/app boundary)",
      );
    });
  });

  // ── 4. src/view/index.ts の AppSlot re-export が app/ を経由しない ─────────────
  describe('src/view/index.ts AppSlot re-export must not route through app/', () => {
    const VIEW_INDEX_TS = resolve(SRC, 'view/index.ts');

    it('src/view/index.ts の AppSlot export が app/ モジュールを経由していない', () => {
      if (!existsSync(VIEW_INDEX_TS)) return;
      const src = readFileSync(VIEW_INDEX_TS, 'utf8');

      // Find lines that re-export AppSlot
      const appSlotExportLines = src
        .split('\n')
        .filter(line => /AppSlot/.test(line));

      // None of those lines should reference app/ in their from path
      const violations = appSlotExportLines.filter(line => /from\s+['"].*\/app[/'"]/.test(line));
      expect(
        violations,
        'view/index.ts must re-export AppSlot directly from app-slot, not via app/',
      ).toEqual([]);

      // Additionally verify that AppSlot IS re-exported from app-slot.js (direct path)
      const hasDirectReExport = appSlotExportLines.some(line => /app-slot/.test(line));
      expect(
        hasDirectReExport,
        'view/index.ts should re-export AppSlot from app-slot (not from app/)',
      ).toBe(true);
    });
  });
});
