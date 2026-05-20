/**
 * `src/js/vanilla/index.ts` の公開 API 表面検証。
 *
 * unified-element-api Req 5.1 による再編後:
 * - ランタイム公開: `createVanillaScript` / `ref` のみ
 * - 型のみ公開: `ScriptScope` / `SelectorRef` / `CollectionRef` / `ExprFactory` / `JsExpr` / `JsBoolExpr`
 * - 旧フラット関数群（`on` / `query` / `addClass` 等）は非公開
 *
 * 対応: unified-element-api 仕様 Task 5.1 / Req 5.1, 5.5
 */

import { describe, expect, it } from 'vitest';

import * as vanillaIndex from '../../../src/js/vanilla/index.ts';
import * as packageEntry from '../../../src/index.ts';

const EXPECTED_RUNTIME_NAMES = [
  'createVanillaScript',
  'ref',
] as const;

/** 旧フラット関数群 + 内部実装名 — いずれも公開エントリから漏れてはならない。 */
const FORBIDDEN_NAMES = [
  // 旧フラット関数群（unified-element-api Req 5.1 により非公開化）
  'attach',
  'on',
  'onDomReady',
  'query',
  'queryAll',
  'forEach',
  'filterNot',
  'length',
  'toggleClass',
  'addClass',
  'removeClass',
  'containsClass',
  'setText',
  'getText',
  'setValue',
  'getValue',
  'setStyle',
  'appendChild',
  'remove',
  'removeAll',
  // 内部実装名
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

describe('src/js/vanilla/index.ts 公開 API 表面（unified-element-api Req 5.1）', () => {
  describe('vanilla module index (src/js/vanilla/index.ts)', () => {
    it.each(EXPECTED_RUNTIME_NAMES)('exports runtime name: %s', (name) => {
      expect(vanillaIndex).toHaveProperty(name);
      expect(typeof (vanillaIndex as Record<string, unknown>)[name]).toBe('function');
    });

    it.each(FORBIDDEN_NAMES)('does NOT export: %s', (name) => {
      expect(vanillaIndex).not.toHaveProperty(name);
    });
  });

  describe('package entry (src/index.ts)', () => {
    it.each(EXPECTED_RUNTIME_NAMES)('re-exports runtime name: %s', (name) => {
      expect(packageEntry).toHaveProperty(name);
      expect(typeof (packageEntry as Record<string, unknown>)[name]).toBe('function');
    });

    it.each(FORBIDDEN_NAMES)('does NOT re-export: %s', (name) => {
      expect(packageEntry).not.toHaveProperty(name);
    });
  });

  describe('smoke: 公開 API が動作する', () => {
    it('createVanillaScript + ref が呼び出し可能で出力を生成する', () => {
      const { createVanillaScript, ref } = vanillaIndex;
      const s = createVanillaScript();
      expect(typeof s.render).toBe('function');
      const r = ref('el');
      expect(r.kind).toBe('var');
      expect(r.code).toBe('el');
    });
  });
});
