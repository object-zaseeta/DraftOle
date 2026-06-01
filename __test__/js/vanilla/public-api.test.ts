/**
 * Task 6.1: `src/js/vanilla/index.ts` の公開 API 表面検証。
 *
 * - 許可リスト上のランタイム名は `src/js/vanilla/index.ts` および
 *   パッケージエントリ `src/index.ts` の両方から import 解決できる必要がある。
 * - 内部名（`VanillaCommand` / `renderCommand` / `_makeJsExpr` 等）は
 *   これらのエントリから export されていてはならない。
 *
 * 対応要件: 7.3 (strict mode TS コンパイルで型エラー/警告なし)、8.1 (公開 API 集約)。
 */

import { describe, expect, it } from 'vitest';

// ランタイム公開 API: Vanilla モジュール index と パッケージエントリの両方を検証する。
import * as vanillaIndex from '../../../src/js/vanilla/index.ts';
import * as packageEntry from '../../../src/index.ts';

const EXPECTED_RUNTIME_NAMES = [
  // ファクトリ
  'createVanillaScript',
  'ref',
  'attach',
  // event-api
  'on',
  'onDomReady',
  // query-api
  'query',
  'queryAll',
  'forEach',
  'filterNot',
  'length',
  // dom-api
  'toggleClass',
  'addClass',
  'removeClass',
  'containsClass',
  'setText',
  'getText',
  'setValue',
  'getValue',
  'setStyle',
  // tree-api
  'appendChild',
  'remove',
  'removeAll',
] as const;

// 内部のみの名前。公開エントリ / パッケージエントリに漏れてはならない。
const FORBIDDEN_INTERNAL_NAMES = [
  'renderCommand',
  'renderCommands',
  '_makeJsExpr',
  '_makeJsBoolExpr',
  '_makeScopedElementRef',
  '_makeScopedElementListRef',
  'fromSelector',
  'fromExpr',
  'listFromSelector',
  'listFromExpr',
] as const;

describe('Task 6.1: src/js/vanilla/index.ts public API surface', () => {
  describe('vanilla module index (src/js/vanilla/index.ts)', () => {
    it.each(EXPECTED_RUNTIME_NAMES)('exports runtime name %s', (name) => {
      expect(vanillaIndex).toHaveProperty(name);
      expect(typeof (vanillaIndex as Record<string, unknown>)[name]).toBe('function');
    });

    it.each(FORBIDDEN_INTERNAL_NAMES)('does NOT export internal name %s', (name) => {
      expect(vanillaIndex).not.toHaveProperty(name);
    });
  });

  describe('package entry (src/index.ts)', () => {
    it.each(EXPECTED_RUNTIME_NAMES)('re-exports runtime name %s', (name) => {
      expect(packageEntry).toHaveProperty(name);
      expect(typeof (packageEntry as Record<string, unknown>)[name]).toBe('function');
    });

    it.each(FORBIDDEN_INTERNAL_NAMES)('does NOT re-export internal name %s', (name) => {
      expect(packageEntry).not.toHaveProperty(name);
    });
  });

  describe('smoke: public API is functional via package entry', () => {
    it('createVanillaScript + ref + attach are callable and produce output', async () => {
      const { createVanillaScript, ref, attach, onDomReady, setText } =
        await import('../../../src/index.ts');

      // createVanillaScript
      const s = createVanillaScript();
      expect(typeof s.render).toBe('function');

      // ref: kind: 'var', code === varName
      const r = ref('el');
      expect(r.kind).toBe('var');
      expect(r.code).toBe('el');

      // onDomReady + setText 経由での render 検証
      onDomReady(s, (scope) => {
        setText(scope, ref('el'), 'hi');
      });
      const out = s.render();
      expect(out).toContain('DOMContentLoaded');
      expect(out).toContain('el.textContent');

      // attach: afterCreate シグネチャに一致するコールバックを返す
      const cb = attach((scope, refs) => {
        setText(scope, refs.name, 'x');
      });
      expect(typeof cb).toBe('function');
      const body = cb({ name: 'nameEl' });
      expect(body).toContain('nameEl.textContent');
    });
  });
});
