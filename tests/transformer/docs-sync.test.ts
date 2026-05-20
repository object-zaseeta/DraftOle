/**
 * Task 7.1: docs/api/handler-serialization.md 同期テスト
 *
 * 観測可能な完了基準:
 *   - docs/api/handler-serialization.md が存在すること
 *   - BUILTIN_GLOBALS の全エントリ名が docs 内に記述されていること
 *   - DT001〜DT010 のエラーコードが docs 内に記述されていること
 *
 * 対応 requirements: 5.5
 * 対応 design: D-6（真実の源泉は 1 つ原則）
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUILTIN_GLOBALS } from '../../src/transformer/whitelist-registry.ts';
import { DIAGNOSTIC_TABLE, type DiagnosticCode } from '../../src/transformer/diagnostic-reporter.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOC_PATH = join(__dirname, '../../docs/api/handler-serialization.md');

function readDoc(): string {
  try {
    return readFileSync(DOC_PATH, 'utf-8');
  } catch {
    throw new Error(`docs/api/handler-serialization.md が存在しません: ${DOC_PATH}`);
  }
}

describe('docs/api/handler-serialization.md 同期テスト', () => {
  it('ドキュメントファイルが存在すること', () => {
    expect(() => readDoc()).not.toThrow();
  });

  it('BUILTIN_GLOBALS の全エントリ名がドキュメントに記載されていること', () => {
    const doc = readDoc();
    for (const entry of BUILTIN_GLOBALS) {
      expect(doc, `BUILTIN_GLOBALS エントリ '${entry.name}' がドキュメントに存在すること`).toContain(entry.name);
    }
  });

  it('DT001〜DT010 の全エラーコードがドキュメントに記載されていること', () => {
    const doc = readDoc();
    const codes = Object.keys(DIAGNOSTIC_TABLE) as DiagnosticCode[];
    for (const code of codes) {
      expect(doc, `エラーコード '${code}' がドキュメントに存在すること`).toContain(code);
    }
  });

  it('導入手順セクションが含まれていること（ts-patch）', () => {
    const doc = readDoc();
    expect(doc).toContain('ts-patch');
  });

  it('導入手順セクションが含まれていること（esbuild）', () => {
    const doc = readDoc();
    expect(doc).toContain('esbuild');
  });

  it('導入手順セクションが含まれていること（vite）', () => {
    const doc = readDoc();
    expect(doc).toContain('vite');
  });
});
