/**
 * Task 4.4: helper-decl-utils 単体テスト
 *
 * `src/transformer/helper-decl-utils.ts` の 3 関数の分岐を網羅する。
 *
 * - `resolveValueDeclaration`:
 *     - Symbol 不在 (`getSymbolAtLocation` が undefined) → undefined
 *     - 非 Alias Symbol (通常の `const`) → 該当 VariableDeclaration を返す
 *     - Alias Symbol (import 経由) → 解決後の VariableDeclaration を返す
 *     - Alias Symbol だが `getAliasedSymbol` が throw → undefined (catch 経路)
 * - `isModuleLevelVariableDeclaration`:
 *     - モジュールトップレベル直下 const → true
 *     - 関数内ネスト const → false
 * - `isConstDeclaration`:
 *     - const → true
 *     - let → false
 *     - var → false
 *     - destructuring const → true
 *
 * 対応 requirements: 3.4
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  isConstDeclaration,
  isModuleLevelVariableDeclaration,
  resolveValueDeclaration,
} from '../../src/transformer/helper-decl-utils.ts';
import { createTestProgram } from './__fixtures__/ast-builders.ts';

// ---- ヘルパー --------------------------------------------------------------

/**
 * `sourceFile` を再帰走査し、`name` を持つ Identifier 参照を最後に出現する位置で返す。
 * (定義箇所の Identifier ではなく、後段の "使用箇所" を採るため最後を選ぶ)
 */
function findLastIdentifier(
  sourceFile: ts.SourceFile,
  name: string,
): ts.Identifier | undefined {
  let last: ts.Identifier | undefined;
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === name) {
      last = node;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return last;
}

/**
 * `sourceFile` 内で最初に登場する `VariableDeclaration` (name が `varName`) を返す。
 */
function findVariableDeclaration(
  sourceFile: ts.SourceFile,
  varName: string,
): ts.VariableDeclaration | undefined {
  let found: ts.VariableDeclaration | undefined;
  const visit = (node: ts.Node): void => {
    if (found !== undefined) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === varName
    ) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return found;
}

/**
 * destructuring (`const { a } = ...`) の VariableDeclaration を返す。
 * BindingPattern を name に持つ最初のものを取得する。
 */
function findDestructuringDeclaration(
  sourceFile: ts.SourceFile,
): ts.VariableDeclaration | undefined {
  let found: ts.VariableDeclaration | undefined;
  const visit = (node: ts.Node): void => {
    if (found !== undefined) return;
    if (
      ts.isVariableDeclaration(node) &&
      (ts.isObjectBindingPattern(node.name) || ts.isArrayBindingPattern(node.name))
    ) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return found;
}

// ===========================================================================
// resolveValueDeclaration
// ===========================================================================

describe('helper-decl-utils / resolveValueDeclaration', () => {
  it('Symbol 不在 (未宣言識別子) なら undefined を返す', () => {
    // 未定義識別子参照を含むソース。
    // `(undeclaredSymbol)` のような bare 参照は parser で SyntaxError になることがあるため、
    // 「現実的に存在しない」プロパティアクセスの式を使い、checker が symbol を解決できない
    // 位置を作る。例: `({} as any).whateverNoneSym`
    const { checker, sources } = createTestProgram([
      {
        name: '/virtual/unknown.ts',
        source: `const x = ({} as any).whateverNoneSym;\n`,
      },
    ]);
    const sf = sources.get('/virtual/unknown.ts')!;
    const ident = findLastIdentifier(sf, 'whateverNoneSym');
    expect(ident).toBeDefined();

    // PropertyAccess の name 位置の Identifier は checker.getSymbolAtLocation で
    // undefined が返ることが多い (any 経由なので解決不能)。
    const decl = resolveValueDeclaration(ident!, checker);
    expect(decl).toBeUndefined();
  });

  it('非 Alias の Symbol (通常 const) は VariableDeclaration を返す', () => {
    const { checker, sources } = createTestProgram([
      {
        name: '/virtual/local.ts',
        source: `const greeting = 'hi';\nconst ref = greeting;\n`,
      },
    ]);
    const sf = sources.get('/virtual/local.ts')!;
    // 後段の参照箇所 (`const ref = greeting;` の `greeting`) を取得
    const ident = findLastIdentifier(sf, 'greeting');
    expect(ident).toBeDefined();

    const decl = resolveValueDeclaration(ident!, checker);
    expect(decl).toBeDefined();
    expect(ts.isVariableDeclaration(decl!)).toBe(true);
    expect((decl as ts.VariableDeclaration).name.getText()).toBe('greeting');
  });

  it('import alias Symbol を `getAliasedSymbol` で解決し、元の宣言を返す', () => {
    // 同一ファイル内で「Alias フラグの立つ Symbol」を生成するため
    // TypeScript の `import = ` namespace alias を使う。これは
    // module resolution に依存せず、同一ファイル内の namespace member
    // への alias なので確実に valueDeclaration を保持する。
    //
    // 結果: `aliased` Identifier の Symbol は Alias フラグ + namespace 内
    // の `actual` const 宣言を valueDeclaration として返す。
    const source = `
namespace N {
  export const actual = 42;
}
import aliased = N.actual;
const use = aliased;
`.trimStart();

    const { checker, sources } = createTestProgram([
      { name: '/virtual/alias.ts', source },
    ]);
    const sf = sources.get('/virtual/alias.ts')!;

    // `const use = aliased;` の `aliased` (最後の参照) を採る
    const ident = findLastIdentifier(sf, 'aliased');
    expect(ident).toBeDefined();

    // import alias 由来の symbol である (Alias フラグ経路を踏むことの保証)
    const sym = checker.getSymbolAtLocation(ident!);
    expect(sym).toBeDefined();
    expect((sym!.flags & ts.SymbolFlags.Alias) !== 0).toBe(true);

    const decl = resolveValueDeclaration(ident!, checker);
    expect(decl).toBeDefined();
    expect(ts.isVariableDeclaration(decl!)).toBe(true);
    // 解決先は namespace N 内の `export const actual = 42` の VariableDeclaration
    expect((decl as ts.VariableDeclaration).name.getText()).toBe('actual');
  });

  it('Alias Symbol だが `getAliasedSymbol` が throw した場合は catch して undefined を返す', () => {
    // 実 checker で例外を起こすのは困難なため、Alias フラグ付き Symbol を返しつつ
    // getAliasedSymbol が throw する checker wrapper を構築する。
    const { checker, sources } = createTestProgram([
      {
        name: '/virtual/lib.ts',
        source: `export const value = 1;\n`,
      },
      {
        name: '/virtual/main.ts',
        source: `import { value } from './lib';\nconst use = value;\n`,
      },
    ]);
    const mainSf = sources.get('/virtual/main.ts')!;
    const ident = findLastIdentifier(mainSf, 'value');
    expect(ident).toBeDefined();

    // wrapper: getSymbolAtLocation は本物を使い、Alias の場合のみ getAliasedSymbol を
    // throw に差し替える。
    const wrapped: ts.TypeChecker = new Proxy(checker, {
      get(target, prop, receiver) {
        if (prop === 'getAliasedSymbol') {
          return (): ts.Symbol => {
            throw new Error('synthetic getAliasedSymbol failure');
          };
        }
        const v = Reflect.get(target, prop, receiver);
        return typeof v === 'function' ? v.bind(target) : v;
      },
    });

    const decl = resolveValueDeclaration(ident!, wrapped);
    expect(decl).toBeUndefined();
  });
});

// ===========================================================================
// isModuleLevelVariableDeclaration
// ===========================================================================

describe('helper-decl-utils / isModuleLevelVariableDeclaration', () => {
  it('モジュールトップレベル直下の const は true を返す', () => {
    const { sources } = createTestProgram([
      {
        name: '/virtual/top.ts',
        source: `const topLevel = 1;\n`,
      },
    ]);
    const sf = sources.get('/virtual/top.ts')!;
    const decl = findVariableDeclaration(sf, 'topLevel');
    expect(decl).toBeDefined();

    expect(isModuleLevelVariableDeclaration(decl!, sf)).toBe(true);
  });

  it('関数内ネスト const は false を返す', () => {
    const { sources } = createTestProgram([
      {
        name: '/virtual/nested.ts',
        source: `function outer() {\n  const inner = 1;\n  return inner;\n}\n`,
      },
    ]);
    const sf = sources.get('/virtual/nested.ts')!;
    const decl = findVariableDeclaration(sf, 'inner');
    expect(decl).toBeDefined();

    expect(isModuleLevelVariableDeclaration(decl!, sf)).toBe(false);
  });

  it('親 (VariableDeclarationList) を持たない合成 VariableDeclaration は false を返す', () => {
    // ts.factory で合成した VariableDeclaration は parent が未設定なので
    // `decl.parent === undefined` ガード分岐を踏む。
    const synthetic = ts.factory.createVariableDeclaration(
      ts.factory.createIdentifier('orphan'),
      undefined,
      undefined,
      ts.factory.createNumericLiteral(1),
    );
    // 念のため: parent 未設定であることを確認
    expect(synthetic.parent).toBeUndefined();

    const { sources } = createTestProgram([
      { name: '/virtual/dummy.ts', source: `const x = 1;\n` },
    ]);
    const sf = sources.get('/virtual/dummy.ts')!;
    expect(isModuleLevelVariableDeclaration(synthetic, sf)).toBe(false);
  });

  it('VariableStatement の親が SourceFile 以外 (block 内宣言相当) は false を返す', () => {
    // 既に「関数内 const → false」を別 it で確認済みだが、
    // 別 SourceFile を渡したケース (stmt.parent !== sourceFile 経路) も
    // 明示的に検証する。
    const { sources } = createTestProgram([
      { name: '/virtual/a.ts', source: `const a = 1;\n` },
      { name: '/virtual/b.ts', source: `const b = 1;\n` },
    ]);
    const sfA = sources.get('/virtual/a.ts')!;
    const sfB = sources.get('/virtual/b.ts')!;
    const declA = findVariableDeclaration(sfA, 'a');
    expect(declA).toBeDefined();

    // declA の真の sourceFile は sfA だが、sfB と比較した場合 false になる。
    expect(isModuleLevelVariableDeclaration(declA!, sfB)).toBe(false);
    expect(isModuleLevelVariableDeclaration(declA!, sfA)).toBe(true);
  });

  it('export 修飾付きトップレベル const も true を返す', () => {
    const { sources } = createTestProgram([
      {
        name: '/virtual/exp.ts',
        source: `export const exported = 1;\n`,
      },
    ]);
    const sf = sources.get('/virtual/exp.ts')!;
    const decl = findVariableDeclaration(sf, 'exported');
    expect(decl).toBeDefined();

    expect(isModuleLevelVariableDeclaration(decl!, sf)).toBe(true);
  });
});

// ===========================================================================
// isConstDeclaration
// ===========================================================================

describe('helper-decl-utils / isConstDeclaration', () => {
  it('const 宣言は true を返す', () => {
    const { sources } = createTestProgram([
      {
        name: '/virtual/c.ts',
        source: `const a = 1;\n`,
      },
    ]);
    const sf = sources.get('/virtual/c.ts')!;
    const decl = findVariableDeclaration(sf, 'a');
    expect(decl).toBeDefined();

    expect(isConstDeclaration(decl!)).toBe(true);
  });

  it('let 宣言は false を返す', () => {
    const { sources } = createTestProgram([
      {
        name: '/virtual/l.ts',
        source: `let b = 1;\n`,
      },
    ]);
    const sf = sources.get('/virtual/l.ts')!;
    const decl = findVariableDeclaration(sf, 'b');
    expect(decl).toBeDefined();

    expect(isConstDeclaration(decl!)).toBe(false);
  });

  it('var 宣言は false を返す', () => {
    const { sources } = createTestProgram([
      {
        name: '/virtual/v.ts',
        source: `var c = 1;\n`,
      },
    ]);
    const sf = sources.get('/virtual/v.ts')!;
    const decl = findVariableDeclaration(sf, 'c');
    expect(decl).toBeDefined();

    expect(isConstDeclaration(decl!)).toBe(false);
  });

  it('destructuring const も true を返す (`const { a } = obj` 形式)', () => {
    const { sources } = createTestProgram([
      {
        name: '/virtual/d.ts',
        source: `const obj = { a: 1 };\nconst { a } = obj;\n`,
      },
    ]);
    const sf = sources.get('/virtual/d.ts')!;
    const decl = findDestructuringDeclaration(sf);
    expect(decl).toBeDefined();

    expect(isConstDeclaration(decl!)).toBe(true);
    expect(isModuleLevelVariableDeclaration(decl!, sf)).toBe(true);
  });

  it('export const も const 判定で true を返す', () => {
    const { sources } = createTestProgram([
      {
        name: '/virtual/ec.ts',
        source: `export const ec = 1;\n`,
      },
    ]);
    const sf = sources.get('/virtual/ec.ts')!;
    const decl = findVariableDeclaration(sf, 'ec');
    expect(decl).toBeDefined();

    expect(isConstDeclaration(decl!)).toBe(true);
  });

  it('export let は const 判定で false を返す', () => {
    const { sources } = createTestProgram([
      {
        name: '/virtual/el.ts',
        source: `export let el = 1;\n`,
      },
    ]);
    const sf = sources.get('/virtual/el.ts')!;
    const decl = findVariableDeclaration(sf, 'el');
    expect(decl).toBeDefined();

    expect(isConstDeclaration(decl!)).toBe(false);
  });

  it('親 (VariableDeclarationList) を持たない合成 VariableDeclaration は false を返す', () => {
    // ts.factory で合成した VariableDeclaration は parent が未設定なので
    // `decl.parent === undefined` ガード分岐 (false 返却) を踏む。
    const synthetic = ts.factory.createVariableDeclaration(
      ts.factory.createIdentifier('orphan'),
      undefined,
      undefined,
      ts.factory.createNumericLiteral(1),
    );
    expect(synthetic.parent).toBeUndefined();
    expect(isConstDeclaration(synthetic)).toBe(false);
  });
});
