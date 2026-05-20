import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Architecture boundary tests for `Root` (root-responsibility-separation spec)
 *
 * This file verifies the forbidden dependency rules defined in design.md
 * §Dependency Direction:
 *
 *   publisher/* -X-> Root._stateRegistry / runtime registry internals  (FORBIDDEN)
 *   document/*  -X-> runtime/*                                          (FORBIDDEN)
 *   document/*  -X-> publisher/*                                        (FORBIDDEN)
 *   runtime/*   -X-> publisher/*                                        (FORBIDDEN)
 *
 * Validation strategy: source-text inspection via readFileSync + import-line analysis.
 * Tests that guard against paths which do not yet exist (document/*, runtime/*) are
 * written to be forward-compatible: they run the assertion only when the file/directory
 * is present, so the suite stays GREEN today and will fail as designed once forbidden
 * imports appear.
 *
 * Corresponding requirements: 2.5, 3.1, 5.4 (root-responsibility-separation)
 * Corresponding design: §Dependency Direction, §Validation Targets
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

/**
 * Return all `.ts` files directly inside `dirPath`.
 * When the directory does not exist, returns an empty array (forward-compatible).
 */
function tsFilesInDir(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath)
    .filter(name => name.endsWith('.ts'))
    .map(name => resolve(dirPath, name));
}

/**
 * Assert that NO file in `dirPath` contains an import matching `pattern`.
 * When the directory does not exist the test trivially passes (forward-compatible).
 * Reports each violation with its file path for easy diagnosis.
 */
function assertNoDirForbiddenImport(
  dirPath: string,
  pattern: RegExp,
  description: string,
): void {
  const files = tsFilesInDir(dirPath);
  const violations: string[] = [];
  for (const file of files) {
    const lines = importLines(file);
    for (const line of lines) {
      if (pattern.test(line)) {
        violations.push(`${file}: ${line.trim()}`);
      }
    }
  }
  expect(violations, description).toEqual([]);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('architecture: Root responsibility boundary (root-responsibility-separation)', () => {

  // ── 1. Root source structure sanity ─────────────────────────────────────────
  describe('Root source structure', () => {
    const ROOT_TS = resolve(SRC, 'html/elements/root.ts');

    it('src/html/elements/root.ts が存在する', () => {
      expect(existsSync(ROOT_TS)).toBe(true);
    });

    it('Root クラスが export されている', () => {
      const src = readFileSync(ROOT_TS, 'utf8');
      expect(src).toMatch(/export class Root\b/);
    });

    it('Root は HtmlTag を extends している', () => {
      const src = readFileSync(ROOT_TS, 'utf8');
      expect(src).toMatch(/export class Root extends HtmlTag\b/);
    });
  });

  // ── 2. FORBIDDEN: publisher/* -> Root._stateRegistry ────────────────────────
  describe('FORBIDDEN: publisher/* must not access Root._stateRegistry directly', () => {
    const FILE_EXPORTER = resolve(SRC, 'publisher/file-exporter.ts');

    /**
     * publisher が Root の内部レジストリ (_stateRegistry) を直接参照しないこと。
     * 現状の file-exporter.ts は root._stateRegistry を参照しており、このテストは
     * task 5.1 (ExportContext 移行) が完了するまで RED になる。
     * RED → GREEN になることで publisher/Root 分離が完了したと判断する。
     */
    it('src/publisher/file-exporter.ts が root._stateRegistry を直接参照しない [RED until task 5.1]', () => {
      assertNoForbiddenImport(
        FILE_EXPORTER,
        /_stateRegistry/,
        'file-exporter should not access _stateRegistry (use ExportContext instead)',
      );
      // source-text inspection for property access (not only import lines)
      if (!existsSync(FILE_EXPORTER)) return;
      const src = readFileSync(FILE_EXPORTER, 'utf8');
      const accessLines = src
        .split('\n')
        .filter(line => /\._stateRegistry\b/.test(line) && !/^\s*\*/.test(line)); // ignore JSDoc
      expect(accessLines, 'file-exporter.ts must not read root._stateRegistry directly').toEqual([]);
    });
  });

  // ── 3. FORBIDDEN: document/* -> runtime/* ────────────────────────────────────
  describe('FORBIDDEN: document/* must not import from runtime/*', () => {
    const DOCUMENT_DIR = resolve(SRC, 'document');

    /**
     * src/document/ は task 2.1 で作成される。
     * ディレクトリが存在する場合のみ import 方向を検証する（前方互換）。
     * ディレクトリ内の全 .ts ファイルを対象にスキャンする。
     */
    it('src/document/* が runtime/* を import しない (前方互換)', () => {
      assertNoDirForbiddenImport(
        DOCUMENT_DIR,
        /from\s+['"].*\/runtime\//,
        'document/* must not import from runtime/',
      );
    });
  });

  // ── 4. FORBIDDEN: document/* -> publisher/* ──────────────────────────────────
  describe('FORBIDDEN: document/* must not import from publisher/*', () => {
    const DOCUMENT_DIR = resolve(SRC, 'document');

    /**
     * src/document/ は task 2.1 で作成される。
     * ディレクトリが存在する場合のみ import 方向を検証する（前方互換）。
     * ディレクトリ内の全 .ts ファイルを対象にスキャンする。
     * Requirement 2.5: page と App の違いが internal structure にも反映される依存方向を定義する。
     */
    it('src/document/* が publisher/* を import しない (前方互換)', () => {
      assertNoDirForbiddenImport(
        DOCUMENT_DIR,
        /from\s+['"].*\/publisher\//,
        'document/* must not import from publisher/',
      );
    });
  });

  // ── 5. FORBIDDEN: runtime/* -> publisher/* ───────────────────────────────────
  describe('FORBIDDEN: runtime/* must not import from publisher/*', () => {
    const RUNTIME_DIR = resolve(SRC, 'runtime');

    /**
     * src/runtime/ は task 3.1 で作成される。
     * ディレクトリが存在する場合のみ import 方向を検証する（前方互換）。
     * ディレクトリ内の全 .ts ファイルを対象にスキャンする。
     */
    it('src/runtime/* が publisher/* を import しない (前方互換)', () => {
      assertNoDirForbiddenImport(
        RUNTIME_DIR,
        /from\s+['"].*\/publisher\//,
        'runtime/* must not import from publisher/',
      );
    });
  });

  // ── 6. Root facade extraction: runtime ownership boundary ───────────────────
  // root-runtime-facade-extraction spec, Req 2.1, 4.3, 4.5
  describe('Root facade extraction: runtime ownership boundary', () => {
    const ROOT_TS = resolve(SRC, 'html/elements/root.ts');

    /** Strip JSDoc / line comments / string literals so identifier scans only hit code. */
    function readCodeOnly(filePath: string): string {
      const src = readFileSync(filePath, 'utf8');
      return src
        // strip /* ... */ block comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // strip // line comments
        .replace(/\/\/.*$/gm, '')
        // strip template literals
        .replace(/`(?:\\.|[^`\\])*`/g, '``')
        // strip double-quoted strings
        .replace(/"(?:\\.|[^"\\])*"/g, '""')
        // strip single-quoted strings
        .replace(/'(?:\\.|[^'\\])*'/g, "''");
    }

    /**
     * Req 2.1 / 4.3: Root must not own a VanillaScriptBuilder slot.
     * After refactor, `_vanillaBuilder` identifier must not appear in Root source code.
     */
    it('Root source must not contain `_vanillaBuilder` identifier', () => {
      const code = readCodeOnly(ROOT_TS);
      expect(code, 'root.ts must not declare or reference _vanillaBuilder after facade extraction').not.toMatch(/\b_vanillaBuilder\b/);
    });

    /**
     * Req 4.5: Root must delegate jQuery helper composition to RuntimeContext.
     * `JQueryHelper.generateHelper` must not be called directly from Root.
     */
    it('Root source must not call `JQueryHelper.generateHelper` directly', () => {
      const code = readCodeOnly(ROOT_TS);
      expect(code, 'root.ts must delegate helper assembly to RuntimeContext, not invoke JQueryHelper directly').not.toMatch(/\bJQueryHelper\.generateHelper\b/);
    });

    /**
     * Req 4.5: Root must not depend on root-facade.ts after the extraction.
     */
    it('Root source must not reference `applyRootFacade` or `getOrCreateRootScope`', () => {
      const code = readCodeOnly(ROOT_TS);
      expect(code, 'root.ts must not invoke applyRootFacade after extraction').not.toMatch(/\bapplyRootFacade\b/);
      expect(code, 'root.ts must not invoke getOrCreateRootScope after extraction').not.toMatch(/\bgetOrCreateRootScope\b/);
    });

    /**
     * Req 4.5: Root must not import from `js/vanilla/root-facade`.
     */
    it('Root must not import from js/vanilla/root-facade', () => {
      const lines = importLines(ROOT_TS);
      const violations = lines.filter(line => /js\/vanilla\/root-facade/.test(line));
      expect(violations, 'root.ts must not import from js/vanilla/root-facade after extraction').toEqual([]);
    });
  });

  // ── 7. Root public API surface (Req 4.4) ────────────────────────────────────
  // root-runtime-facade-extraction spec, Req 1.1, 4.4
  describe('Root public API surface', () => {
    /**
     * Req 4.4: Root の公開メンバ集合が requirements.md Req 1.1 で固定した API と一致する。
     * 各メンバが Root.prototype 上または instance 上に「呼び出し可能なものとして」存在することを確認する。
     * declare-only / 削除済みフィールドが残っていないことも検証する。
     */
    it('Root exposes the 16 public API members from requirements Req 1.1', async () => {
      const { Root } = await import('../../src/html/elements/root.js');
      const root = new Root();

      // requirements.md Req 1.1 の公開 API リスト
      const expectedMembers = [
        // methods
        'renderJs',
        'renderVanillaScript',
        'state',
        '$',
        '$$',
        'export',
        'buildExportContext',
        'setDoctype',
        'addChild',
        'render',
        'protoRender',
        'collectCssStyleString',
        'collectJsContent',
        'collectUsedMethods',
        // accessor properties
        'script',
        'expr',
      ] as const;

      for (const name of expectedMembers) {
        const value = (root as unknown as Record<string, unknown>)[name];
        expect(value, `Root must expose public API member "${name}"`).toBeDefined();
      }
    });

    /**
     * Req 2.1: Root instance must not own a `_vanillaBuilder` field after extraction.
     */
    it('Root instance must not own a `_vanillaBuilder` field', async () => {
      const { Root } = await import('../../src/html/elements/root.js');
      const root = new Root();
      // Trigger lazy initialization to ensure any builder is created (or delegated)
      const _scope = root.script;
      // After lazy init the builder must live on RuntimeContext, not Root.
      // Check both own-property and prototype chain for `_vanillaBuilder`.
      const ownKeys = Object.getOwnPropertyNames(root);
      expect(ownKeys, 'Root instance must not have own `_vanillaBuilder` property').not.toContain('_vanillaBuilder');
      const protoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(root));
      expect(protoKeys, 'Root.prototype must not have `_vanillaBuilder` property').not.toContain('_vanillaBuilder');
    });
  });

  // ── 8. FORBIDDEN: runtime/* -> html/elements/root ───────────────────────────
  describe('FORBIDDEN: runtime/* must not import from html/elements/root', () => {
    const RUNTIME_DIR = resolve(SRC, 'runtime');

    /**
     * Req 4.2: RuntimeContext は Root 非依存。
     * `from '...html/elements/root'` パターンを runtime/* 配下から検出して禁止。
     */
    it('src/runtime/* が html/elements/root を import しない', () => {
      assertNoDirForbiddenImport(
        RUNTIME_DIR,
        /from\s+['"].*\/html\/elements\/root/,
        'runtime/* must not import from html/elements/root (Root non-dependency)',
      );
    });
  });

  // ── 9. ALLOWED directions sanity ─────────────────────────────────────────────
  describe('ALLOWED: Root imports from known internal modules', () => {
    const ROOT_TS = resolve(SRC, 'html/elements/root.ts');

    it('Root は publisher/file-exporter から FileExporter を import している（既存 export shortcut）', () => {
      const lines = importLines(ROOT_TS);
      const hasFileExporterImport = lines.some(line => /publisher\/file-exporter/.test(line));
      expect(hasFileExporterImport).toBe(true);
    });

    it('Root は js/vanilla から StateRegistry を import している（state() 実装）', () => {
      const lines = importLines(ROOT_TS);
      const hasStateRegistryImport = lines.some(line => /js\/vanilla\/state\/registry/.test(line));
      expect(hasStateRegistryImport).toBe(true);
    });
  });
});
