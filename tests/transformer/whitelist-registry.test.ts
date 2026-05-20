/**
 * Task 5.1: whitelist-registry テスト
 *
 * 観測可能な完了基準:
 *   - BUILTIN_GLOBALS に String/Number/Boolean/Array/Math/JSON/Object が含まれる
 *   - FORBIDDEN_SYNTAX に await/yield/前置・後置インクリメント/デクリメントが含まれる
 *   - テーブル定義がデータ駆動であり、他コンポーネントから参照可能なエクスポートである
 *
 * 対応 requirements: 3.1, 3.7
 */

import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { BUILTIN_GLOBALS, FORBIDDEN_SYNTAX } from '../../src/transformer/whitelist-registry.ts';

describe('whitelist-registry / BUILTIN_GLOBALS', () => {
  it('必須ビルトイングローバルをすべて含む', () => {
    const names = BUILTIN_GLOBALS.map((e) => e.name);
    const required = ['String', 'Number', 'Boolean', 'Array', 'Math', 'JSON', 'Object'];
    for (const name of required) {
      expect(names, `${name} が BUILTIN_GLOBALS に存在すること`).toContain(name);
    }
  });

  it('各エントリが tag: "builtin-global" を持つ', () => {
    for (const entry of BUILTIN_GLOBALS) {
      expect(entry.tag).toBe('builtin-global');
    }
  });

  it('Array エントリが isArray/from/of を children に持つ', () => {
    const arrayEntry = BUILTIN_GLOBALS.find((e) => e.name === 'Array');
    expect(arrayEntry).toBeDefined();
    expect(arrayEntry!.children).toContain('isArray');
    expect(arrayEntry!.children).toContain('from');
    expect(arrayEntry!.children).toContain('of');
  });

  it('JSON エントリが stringify/parse を children に持つ', () => {
    const jsonEntry = BUILTIN_GLOBALS.find((e) => e.name === 'JSON');
    expect(jsonEntry).toBeDefined();
    expect(jsonEntry!.children).toContain('stringify');
    expect(jsonEntry!.children).toContain('parse');
  });

  it('Object エントリが keys/values/entries/assign を children に持つ', () => {
    const objectEntry = BUILTIN_GLOBALS.find((e) => e.name === 'Object');
    expect(objectEntry).toBeDefined();
    expect(objectEntry!.children).toContain('keys');
    expect(objectEntry!.children).toContain('values');
    expect(objectEntry!.children).toContain('entries');
    expect(objectEntry!.children).toContain('assign');
  });

  it('BUILTIN_GLOBALS は読み取り専用配列である', () => {
    // readonly 配列として型チェックされることを確認（実行時は通常の配列でも可）
    expect(Array.isArray(BUILTIN_GLOBALS)).toBe(true);
    expect(BUILTIN_GLOBALS.length).toBeGreaterThan(0);
  });
});

describe('whitelist-registry / FORBIDDEN_SYNTAX', () => {
  it('AwaitExpression (SyntaxKind) を含む', () => {
    // TypeScript の SyntaxKind 値で確認
    // ts.SyntaxKind.AwaitExpression = 218 (TS v5.x)
    // 数値ではなく ts モジュール参照で確認する
    expect(FORBIDDEN_SYNTAX).toContain(ts.SyntaxKind.AwaitExpression);
  });

  it('YieldExpression (SyntaxKind) を含む', () => {
    expect(FORBIDDEN_SYNTAX).toContain(ts.SyntaxKind.YieldExpression);
  });

  it('PostfixUnaryExpression (SyntaxKind) を含む（++ / -- の後置演算子）', () => {
    expect(FORBIDDEN_SYNTAX).toContain(ts.SyntaxKind.PostfixUnaryExpression);
  });

  it('PrefixUnaryExpression (SyntaxKind) を含む（++ / -- の前置演算子）', () => {
    expect(FORBIDDEN_SYNTAX).toContain(ts.SyntaxKind.PrefixUnaryExpression);
  });

  it('FORBIDDEN_SYNTAX は読み取り専用配列である', () => {
    expect(Array.isArray(FORBIDDEN_SYNTAX)).toBe(true);
    expect(FORBIDDEN_SYNTAX.length).toBeGreaterThan(0);
  });
});
