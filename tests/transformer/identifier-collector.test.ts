/**
 * Task 4.3: identifier-collector テスト
 *
 * 観測可能な完了基準（4 ケース緑）:
 *   1. 式本体のルート識別子を収集する: `() => count.set(1)` → `count` (unknown)
 *   2. プロパティチェーンのルートのみ収集する: `(e) => state.set(e.target.value)` → `state` (unknown), `e` (event-param)
 *   3. ローカル宣言はローカルとして収集する: `(e) => { const v = 1; state.set(v); }` → `e` (event-param), `state` (unknown), `v` (local)
 *   4. 複数参照はデデュープされる: `() => Math.max(a, a)` → `Math` (unknown), `a` (unknown) の 2 件
 *
 * 対応 requirements: 2.3, 3.4
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { extractHandlerIR } from '../../src/transformer/handler-ir-extractor.ts';
import { collectIdentifiers } from '../../src/transformer/identifier-collector.ts';

// ---- テスト用ユーティリティ --------------------------------------------------

/**
 * ソースコード文字列からアロー関数の HandlerIR を取得するヘルパー。
 */
function getHandlerIR(sourceCode: string) {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    sourceCode,
    ts.ScriptTarget.ES2019,
    /* setParentNodes */ true,
  );

  let found: ts.ArrowFunction | undefined;

  function visit(node: ts.Node): void {
    if (ts.isArrowFunction(node) && found === undefined) {
      found = node;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (found === undefined) {
    throw new Error('No ArrowFunction found in source: ' + sourceCode);
  }

  const result = extractHandlerIR(found, sourceFile);
  if (result.ir === undefined) {
    throw new Error('extractHandlerIR returned undefined ir');
  }
  return { ir: result.ir, sourceFile };
}

// ---- テストケース ------------------------------------------------------------

const TEST_TIMEOUT_MS = 10_000;

describe('identifier-collector / collectIdentifiers', () => {
  /**
   * ケース1: 式本体のルート識別子を収集する
   * `() => count.set(1)` → `count` (unknown)
   */
  it('ケース1: 式本体のルート識別子を収集する', () => {
    const { ir } = getHandlerIR(`
const fn = () => count.set(1);
`.trimStart());

    const refs = collectIdentifiers(ir);

    // `count` が収集される
    const countRef = refs.find(r => r.name === 'count');
    expect(countRef).toBeDefined();
    expect(countRef!.kind).toEqual({ tag: 'unknown' });

    // `.set` チェーン先は収集しない
    const setRef = refs.find(r => r.name === 'set');
    expect(setRef).toBeUndefined();
  }, TEST_TIMEOUT_MS);

  /**
   * ケース2: プロパティチェーンのルートのみ収集する
   * `(e) => state.set(e.target.value)` → `state` (unknown), `e` (event-param)
   */
  it('ケース2: プロパティチェーンのルートのみ収集する', () => {
    const { ir } = getHandlerIR(`
const fn = (e: MouseEvent) => state.set((e.target as HTMLInputElement).value);
`.trimStart());

    const refs = collectIdentifiers(ir);

    // `state` は unknown
    const stateRef = refs.find(r => r.name === 'state');
    expect(stateRef).toBeDefined();
    expect(stateRef!.kind).toEqual({ tag: 'unknown' });

    // `e` は event-param（paramName = "e"）
    const eRef = refs.find(r => r.name === 'e');
    expect(eRef).toBeDefined();
    expect(eRef!.kind).toEqual({ tag: 'event-param' });

    // チェーン先 `target`, `value`, `set` は収集しない
    expect(refs.find(r => r.name === 'target')).toBeUndefined();
    expect(refs.find(r => r.name === 'value')).toBeUndefined();
    expect(refs.find(r => r.name === 'set')).toBeUndefined();
  }, TEST_TIMEOUT_MS);

  /**
   * ケース3: ローカル宣言はローカルとして収集する
   * `(e) => { const v = 1; state.set(v); }` → `e` (event-param), `state` (unknown), `v` (local)
   */
  it('ケース3: ローカル宣言はローカルとして収集する', () => {
    const { ir } = getHandlerIR(`
const fn = (e: Event) => {
  const v = 1;
  state.set(v);
};
`.trimStart());

    const refs = collectIdentifiers(ir);

    // `e` は event-param
    const eRef = refs.find(r => r.name === 'e');
    expect(eRef).toBeDefined();
    expect(eRef!.kind).toEqual({ tag: 'event-param' });

    // `state` は unknown
    const stateRef = refs.find(r => r.name === 'state');
    expect(stateRef).toBeDefined();
    expect(stateRef!.kind).toEqual({ tag: 'unknown' });

    // `v` は local
    const vRef = refs.find(r => r.name === 'v');
    expect(vRef).toBeDefined();
    expect(vRef!.kind).toEqual({ tag: 'local' });
  }, TEST_TIMEOUT_MS);

  /**
   * ケース4: 複数参照はデデュープされる
   * `() => Math.max(a, a)` → `Math` (unknown), `a` (unknown) の 2 件（`a` は重複しない）
   */
  it('ケース4: 同じ識別子の複数参照はデデュープされる', () => {
    const { ir } = getHandlerIR(`
const fn = () => Math.max(a, a);
`.trimStart());

    const refs = collectIdentifiers(ir);

    // `Math` が 1 件のみ
    const mathRefs = refs.filter(r => r.name === 'Math');
    expect(mathRefs).toHaveLength(1);
    expect(mathRefs[0]!.kind).toEqual({ tag: 'unknown' });

    // `a` が 1 件のみ（重複なし）
    const aRefs = refs.filter(r => r.name === 'a');
    expect(aRefs).toHaveLength(1);
    expect(aRefs[0]!.kind).toEqual({ tag: 'unknown' });

    // チェーン先 `max` は収集しない
    expect(refs.find(r => r.name === 'max')).toBeUndefined();
  }, TEST_TIMEOUT_MS);
});
