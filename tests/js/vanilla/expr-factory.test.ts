/**
 * `src/js/vanilla/expr-factory.ts` の振る舞いテスト（Task 3.2）。
 *
 * 対応 requirement: 4.1, 4.2, 4.3, 4.5 (unified-element-api)
 * 対応 design.md セクション: 「ExprFactory」
 *
 * 検証観点:
 *   1. `createExprFactory()` は callable として振る舞い、渡されたコードを
 *      `.code` にそのまま保持する `JsExpr` を返す (Req 4.1)
 *   2. 返された `JsExpr` は既存のチェーンメソッド（`eq` / `ne` / `or` /
 *      `trim` / `isFalsy` / `isTruthy`）を提供する (Req 4.2)
 *   3. `.bool(code)` プロパティは `JsBoolExpr` を返す (Req 4.3)
 *   4. 共通ヘルパ `encodeLiteral` は文字列/数値/JsExpr を安全な JS 式文字列に
 *      エンコードし、文字列は `JSON.stringify` でリテラル化する (Req 4.5)
 */

import { describe, expect, it } from 'vitest';

import type { JsBoolExpr, JsExpr } from '../../../src/js/vanilla/types.ts';
import {
  createExprFactory,
  encodeLiteral,
} from '../../../src/js/vanilla/expr-factory.ts';

describe('ExprFactory (Task 3.2)', () => {
  it('Req 4.1: callable factory preserves raw code in `.code`', () => {
    const root = { expr: createExprFactory() };
    const e = root.expr('a+b');
    expect(e.code).toBe('a+b');
    expect(e.__jsExpr).toBe(true);
  });

  it('Req 4.2: returned JsExpr provides chain methods', () => {
    const expr = createExprFactory();
    const e: JsExpr = expr('x');
    // `eq(number)` は JSON.stringify 経由でリテラル化
    expect(e.eq(1).code).toBe('x === 1');
    // `eq(string)` は JSON.stringify でクォート
    expect(e.eq('y').code).toBe('x === "y"');
    // `ne` / `or` / `trim` / `isFalsy` / `isTruthy` も存在
    expect(e.ne(0).code).toBe('x !== 0');
    expect(e.or('z').code).toBe('(x || "z")');
    expect(e.trim().code).toBe('x.trim()');
    expect(e.isFalsy().code).toBe('!x');
    expect(e.isTruthy().code).toBe('!!x');
  });

  it('Req 4.3: `.bool(code)` returns a JsBoolExpr', () => {
    const root = { expr: createExprFactory() };
    const b: JsBoolExpr = root.expr.bool('flag');
    expect(b.code).toBe('flag');
    expect(b.__jsBool).toBe(true);
    expect(b.__jsExpr).toBe(true);
  });

  it('Req 4.3: `.bool` の戻り値も真偽チェーンとして利用できる', () => {
    const expr = createExprFactory();
    const b = expr.bool('done');
    // JsBoolExpr は JsExpr を継承するため `isFalsy` などが使える
    expect(b.isFalsy().code).toBe('!done');
    expect(b.isFalsy().__jsBool).toBe(true);
  });

  it('Req 4.5: `encodeLiteral` encodes strings via JSON.stringify', () => {
    expect(encodeLiteral('hello')).toBe('"hello"');
    // クォート・バックスラッシュなどもエスケープされる
    expect(encodeLiteral('a"b')).toBe('"a\\"b"');
  });

  it('Req 4.5: `encodeLiteral` encodes numbers via JSON.stringify', () => {
    expect(encodeLiteral(0)).toBe('0');
    expect(encodeLiteral(42)).toBe('42');
  });

  it('Req 4.5: `encodeLiteral` passes through a JsExpr `.code` as-is', () => {
    const expr = createExprFactory();
    const e = expr('user.name');
    expect(encodeLiteral(e)).toBe('user.name');
  });

  it('factory is a plain function object (callable + `.bool` namespace)', () => {
    const f = createExprFactory();
    expect(typeof f).toBe('function');
    expect(typeof f.bool).toBe('function');
  });
});
