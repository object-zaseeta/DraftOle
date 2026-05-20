/**
 * Task 2.6: label-injector AST 構造テスト
 *
 * 目的:
 *   `src/transformer/label-injector.ts` の公開 API の AST 形状と printer 出力を
 *   検証し、branch カバレッジを 90% 以上に引き上げる。
 *
 * 主検証対象（Req 2.1, 2.2）:
 *   - createLabelRequireStatement: `const { __draftole_label__ } = require('<spec>');`
 *     を表す ts.VariableStatement を返すこと
 *
 * 追補（同ファイル内の他公開 API のカバレッジ補完）:
 *   - findDraftOleImport / hasLabelImport / buildLabeledCall / createLabelImportDeclaration
 *
 * 対応 requirements: 2.1, 2.2
 * 対応 design: §LabelInjectorTests
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  buildLabeledCall,
  createLabelImportDeclaration,
  createLabelRequireStatement,
  findDraftOleImport,
  hasLabelImport,
} from '../../src/transformer/label-injector.ts';

// ---- ユーティリティ ---------------------------------------------------------

const printer = ts.createPrinter();
const dummySource = ts.createSourceFile(
  '__label-injector-test__.ts',
  '',
  ts.ScriptTarget.ES2020,
  /* setParentNodes */ false,
  ts.ScriptKind.TS,
);

function printNode(node: ts.Node): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, dummySource);
}

function createSourceFromCode(code: string): ts.SourceFile {
  return ts.createSourceFile(
    'sample.ts',
    code,
    ts.ScriptTarget.ES2020,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
}

// ---- createLabelRequireStatement -------------------------------------------

describe('createLabelRequireStatement（Req 2.1, 2.2）', () => {
  it('returns a ts.VariableStatement', () => {
    const node = createLabelRequireStatement('draft-ole');
    expect(ts.isVariableStatement(node)).toBe(true);
  });

  it('declaration name is an ObjectBindingPattern containing __draftole_label__', () => {
    const node = createLabelRequireStatement('draft-ole');
    const declList = node.declarationList;
    expect(declList.declarations.length).toBe(1);

    const decl = declList.declarations[0]!;
    const nameNode = decl.name;
    expect(ts.isObjectBindingPattern(nameNode)).toBe(true);

    const bindingPattern = nameNode as ts.ObjectBindingPattern;
    expect(bindingPattern.elements.length).toBe(1);

    const element = bindingPattern.elements[0]!;
    // BindingElement.name は Identifier または BindingPattern
    expect(ts.isIdentifier(element.name)).toBe(true);
    expect((element.name as ts.Identifier).text).toBe('__draftole_label__');
    // propertyName が undefined であること（rename されていない素の binding）
    expect(element.propertyName).toBeUndefined();
    // dotDotDot / initializer が undefined
    expect(element.dotDotDotToken).toBeUndefined();
    expect(element.initializer).toBeUndefined();
  });

  it('initializer is a CallExpression to require(<specifier>)', () => {
    const node = createLabelRequireStatement('draft-ole');
    const decl = node.declarationList.declarations[0]!;
    const init = decl.initializer;
    expect(init).toBeDefined();
    expect(ts.isCallExpression(init!)).toBe(true);

    const call = init as ts.CallExpression;
    expect(ts.isIdentifier(call.expression)).toBe(true);
    expect((call.expression as ts.Identifier).text).toBe('require');
    expect(call.typeArguments).toBeUndefined();

    expect(call.arguments.length).toBe(1);
    const arg = call.arguments[0]!;
    expect(ts.isStringLiteral(arg)).toBe(true);
    expect((arg as ts.StringLiteral).text).toBe('draft-ole');
  });

  it('declaration list has ts.NodeFlags.Const set', () => {
    const node = createLabelRequireStatement('draft-ole');
    // NodeFlags.Const ビットが立っていることを確認
    expect((node.declarationList.flags & ts.NodeFlags.Const) !== 0).toBe(true);
    // 変数宣言修飾子（export 等）は付与されない
    expect(node.modifiers).toBeUndefined();
  });

  it('printer output contains __draftole_label__, require, and the specifier', () => {
    const node = createLabelRequireStatement('draft-ole');
    const text = printNode(node);
    expect(text).toContain('__draftole_label__');
    expect(text).toContain('require');
    expect(text).toContain('"draft-ole"');
    // 全体形（空白は printer 依存だがおおむね固定）
    expect(text).toMatch(/const \{ __draftole_label__ \} = require\("draft-ole"\);?/);
  });

  // 異なる moduleSpecifier 文字列 ― 受理されること
  it.each([
    ['draft-ole'],
    ['./local'],
    ['@scoped/pkg'],
    ['../../dist/index.js'],
    // edge case: 空文字でも factory は受理する（呼び出し側の責任）
    [''],
  ])('accepts moduleSpecifier %p and serializes string literal correctly', (specifier) => {
    const node = createLabelRequireStatement(specifier);
    const decl = node.declarationList.declarations[0]!;
    const init = decl.initializer as ts.CallExpression;
    const arg = init.arguments[0] as ts.StringLiteral;
    expect(arg.text).toBe(specifier);

    const text = printNode(node);
    expect(text).toContain('__draftole_label__');
    expect(text).toContain('require');
    // 文字列リテラルとして埋め込まれていること
    expect(text).toContain(`"${specifier}"`);
  });
});

// ---- findDraftOleImport -----------------------------------------------------

describe('findDraftOleImport', () => {
  it('returns the import site when a known DraftOle named import exists', () => {
    const code = `import { el, theme } from 'draft-ole';\nconst x = 1;\n`;
    const sf = createSourceFromCode(code);
    const site = findDraftOleImport(sf);

    expect(site).toBeDefined();
    expect(site!.moduleSpecifier).toBe('draft-ole');
    expect(ts.isImportDeclaration(site!.importDecl)).toBe(true);
  });

  it('returns the first matching import when multiple imports exist', () => {
    const code = [
      `import fs from 'node:fs';`,
      `import { unrelated } from 'other-pkg';`,
      `import { bindEach } from '../../dist/index.js';`,
      `import { el } from 'draft-ole';`,
    ].join('\n');
    const sf = createSourceFromCode(code);
    const site = findDraftOleImport(sf);
    expect(site).toBeDefined();
    // 先頭で最初に一致した（bindEach を含む）import が採用される
    expect(site!.moduleSpecifier).toBe('../../dist/index.js');
  });

  it('returns undefined when no DraftOle import is present', () => {
    const code = `import fs from 'node:fs';\nimport { unrelated } from 'other-pkg';\n`;
    const sf = createSourceFromCode(code);
    expect(findDraftOleImport(sf)).toBeUndefined();
  });

  it('skips import declarations without an importClause (side-effect imports)', () => {
    const code = `import 'side-effect-only';\nimport { el } from 'draft-ole';\n`;
    const sf = createSourceFromCode(code);
    const site = findDraftOleImport(sf);
    expect(site).toBeDefined();
    expect(site!.moduleSpecifier).toBe('draft-ole');
  });

  it('skips namespace imports (import * as ns)', () => {
    const code = `import * as DO from 'draft-ole';\n`;
    const sf = createSourceFromCode(code);
    // NamespaceImport は NamedImports ではないため拾われない
    expect(findDraftOleImport(sf)).toBeUndefined();
  });

  it('skips default-only imports without named bindings', () => {
    const code = `import DefaultThing from 'draft-ole';\n`;
    const sf = createSourceFromCode(code);
    expect(findDraftOleImport(sf)).toBeUndefined();
  });

  it('skips named imports that do not include any known identifier', () => {
    const code = `import { somethingElse } from 'draft-ole';\n`;
    const sf = createSourceFromCode(code);
    expect(findDraftOleImport(sf)).toBeUndefined();
  });
});

// ---- hasLabelImport ---------------------------------------------------------

describe('hasLabelImport', () => {
  it('returns true when __draftole_label__ is in named imports', () => {
    const code = `import { __draftole_label__, el } from 'draft-ole';\n`;
    const sf = createSourceFromCode(code);
    expect(hasLabelImport(sf)).toBe(true);
  });

  it('returns false when __draftole_label__ is absent from named imports', () => {
    const code = `import { el, theme } from 'draft-ole';\n`;
    const sf = createSourceFromCode(code);
    expect(hasLabelImport(sf)).toBe(false);
  });

  it('returns false when there are no imports at all', () => {
    const code = `const x = 1;\n`;
    const sf = createSourceFromCode(code);
    expect(hasLabelImport(sf)).toBe(false);
  });

  it('returns false for namespace import containing __draftole_label__ as member access', () => {
    // NamespaceImport は本関数ではスキップ対象
    const code = `import * as DO from 'draft-ole';\nconst x = DO.__draftole_label__;\n`;
    const sf = createSourceFromCode(code);
    expect(hasLabelImport(sf)).toBe(false);
  });

  it('returns false for side-effect imports', () => {
    const code = `import 'draft-ole';\n`;
    const sf = createSourceFromCode(code);
    expect(hasLabelImport(sf)).toBe(false);
  });
});

// ---- buildLabeledCall -------------------------------------------------------

describe('buildLabeledCall', () => {
  it('wraps a CallExpression as __draftole_label__(<call>, "<varName>")', () => {
    const inner = ts.factory.createCallExpression(
      ts.factory.createIdentifier('el'),
      undefined,
      [ts.factory.createStringLiteral('div')],
    );
    const labeled = buildLabeledCall(inner, 'myVar');

    expect(ts.isCallExpression(labeled)).toBe(true);
    expect(ts.isIdentifier(labeled.expression)).toBe(true);
    expect((labeled.expression as ts.Identifier).text).toBe('__draftole_label__');
    expect(labeled.typeArguments).toBeUndefined();
    expect(labeled.arguments.length).toBe(2);

    // 第1引数: 元の CallExpression がそのまま入る
    expect(labeled.arguments[0]).toBe(inner);

    // 第2引数: varName の StringLiteral
    const second = labeled.arguments[1]!;
    expect(ts.isStringLiteral(second)).toBe(true);
    expect((second as ts.StringLiteral).text).toBe('myVar');

    const text = printNode(labeled);
    expect(text).toContain('__draftole_label__(');
    expect(text).toContain('el("div")');
    expect(text).toContain('"myVar"');
  });

  it('handles empty varName', () => {
    const inner = ts.factory.createCallExpression(
      ts.factory.createIdentifier('el'),
      undefined,
      [],
    );
    const labeled = buildLabeledCall(inner, '');
    const second = labeled.arguments[1] as ts.StringLiteral;
    expect(ts.isStringLiteral(second)).toBe(true);
    expect(second.text).toBe('');
  });
});

// ---- createLabelImportDeclaration -------------------------------------------

describe('createLabelImportDeclaration', () => {
  it('returns an ImportDeclaration importing __draftole_label__ from the given module', () => {
    const decl = createLabelImportDeclaration('draft-ole');

    expect(ts.isImportDeclaration(decl)).toBe(true);
    expect(decl.modifiers).toBeUndefined();

    const moduleSpec = decl.moduleSpecifier;
    expect(ts.isStringLiteral(moduleSpec)).toBe(true);
    expect((moduleSpec as ts.StringLiteral).text).toBe('draft-ole');

    const importClause = decl.importClause;
    expect(importClause).toBeDefined();
    expect(importClause!.isTypeOnly).toBe(false);
    expect(importClause!.name).toBeUndefined();

    const namedBindings = importClause!.namedBindings;
    expect(namedBindings).toBeDefined();
    expect(ts.isNamedImports(namedBindings!)).toBe(true);

    const named = namedBindings as ts.NamedImports;
    expect(named.elements.length).toBe(1);

    const spec = named.elements[0]!;
    expect(spec.isTypeOnly).toBe(false);
    expect(spec.propertyName).toBeUndefined();
    expect(spec.name.text).toBe('__draftole_label__');

    const text = printNode(decl);
    expect(text).toContain('__draftole_label__');
    expect(text).toContain('"draft-ole"');
    expect(text).toMatch(/import \{ __draftole_label__ \} from "draft-ole";?/);
  });

  it.each([['./local'], ['@scoped/pkg'], ['../../dist/index.js'], ['']])(
    'serializes module specifier %p as string literal',
    (specifier) => {
      const decl = createLabelImportDeclaration(specifier);
      expect((decl.moduleSpecifier as ts.StringLiteral).text).toBe(specifier);
      const text = printNode(decl);
      expect(text).toContain(`"${specifier}"`);
      expect(text).toContain('__draftole_label__');
    },
  );
});
