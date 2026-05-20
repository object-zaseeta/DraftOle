/**
 * ast-builders smoke test
 *
 * `ast-builders.ts` の 4 ヘルパ (`createSourceFile` / `findNode` /
 * `findAllNodes` / `createTestProgram`) が想定通りに動作することを
 * 最小ケースで確認する。
 *
 * 本テストは fixture 自体の健全性検証用であり、Phase 4 の transformer
 * テスト (タスク 4.1〜4.6) が import して利用する前提インフラを保証する。
 *
 * Spec: `.kiro/specs/global-branch-90-percent/`
 *   - requirements.md: Requirement 3.1〜3.6
 *   - design.md: "TransformerFixtures"
 *   - tasks.md: 1.2
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  createSourceFile,
  createTestProgram,
  findAllNodes,
  findNode,
} from './ast-builders.ts';

describe('ast-builders / createSourceFile', () => {
  it('返却される SourceFile は setParentNodes が有効で、AST walk 時に node.parent が解決できる', () => {
    const source = createSourceFile('test.ts', `const x = 1;`);
    expect(source.fileName).toBe('test.ts');

    // 深い node まで visit して parent が undefined にならないことを確認
    let visited = 0;
    let parentlessLeaf = 0;
    const visit = (node: ts.Node): void => {
      if (node !== source) {
        visited += 1;
        // ts.SourceFile 以外の node では parent が解決されている
        // (setParentNodes: true の効果)
        if ((node.parent as ts.Node | undefined) === undefined) {
          parentlessLeaf += 1;
        }
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(source, visit);

    expect(visited).toBeGreaterThan(0);
    expect(parentlessLeaf).toBe(0);
  });
});

describe('ast-builders / findNode', () => {
  it('`const f = (x: number) => x + 1` から ArrowFunction を 1 件取得する', () => {
    const source = createSourceFile('test.ts', `const f = (x: number) => x + 1;`);
    const arrow = findNode(source, ts.isArrowFunction);
    expect(arrow).toBeDefined();
    if (arrow === undefined) return;
    expect(arrow.parameters).toHaveLength(1);
  });

  it('該当 node が存在しない場合は undefined を返す', () => {
    const source = createSourceFile('test.ts', `const x = 1;`);
    const arrow = findNode(source, ts.isArrowFunction);
    expect(arrow).toBeUndefined();
  });
});

describe('ast-builders / findAllNodes', () => {
  it('`f(1); g(2);` から CallExpression を 2 件取得する', () => {
    const source = createSourceFile('test.ts', `f(1); g(2);`);
    const calls = findAllNodes(source, ts.isCallExpression);
    expect(calls).toHaveLength(2);
  });
});

describe('ast-builders / createTestProgram', () => {
  it('返却された checker で in-memory ファイル内の symbol を解決できる', () => {
    const { program, checker, sources } = createTestProgram([
      {
        name: 'main.ts',
        source: `export const greeting: string = "hello";`,
      },
    ]);

    const sourceFile = sources.get('main.ts');
    expect(sourceFile).toBeDefined();
    if (sourceFile === undefined) return;

    // program に file が登録されている
    expect(program.getSourceFile('main.ts')).toBe(sourceFile);

    // VariableDeclaration を見つけて checker から symbol/type を解決
    const decl = findNode(sourceFile, ts.isVariableDeclaration);
    expect(decl).toBeDefined();
    if (decl === undefined) return;

    const symbol = checker.getSymbolAtLocation(decl.name);
    expect(symbol).toBeDefined();
    expect(symbol?.getName()).toBe('greeting');

    const type = checker.getTypeAtLocation(decl.name);
    expect(checker.typeToString(type)).toBe('string');
  });
});
