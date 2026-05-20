/**
 * Task 4.1: theme-class-detector 単体テスト
 *
 * `detectThemeClassCalls` の判定経路を網羅する:
 *   - TypeChecker primary path: 型情報から UnifiedTheme 互換型を確定できる場合
 *   - HEURISTIC fallback path: 型情報で確定できないが LHS が `theme` 識別子で
 *     ソースに DraftOle 由来 named import が存在する場合
 *   - 例外/falsy path: getSymbolAtLocation 等が undefined / 例外 を返した場合の
 *     defensive 経路
 *   - 引数列 edge case: 0 引数 / spread / 3+ 引数 / StringLiteral 第 1 引数 /
 *     NoSubstitutionTemplateLiteral 第 1 引数 / 1 引数 ObjectLiteral / 2 引数 +
 *     selectors / 2 引数だが第 2 が非 ObjectLiteral
 *   - PropertyAccessExpression でない CallExpression / name.text !== 'class' /
 *     `.class` だが LHS が DraftOle 互換でない場合
 *
 * 対応 requirements: 3.1 (theme-class-detector.ts branch ≥ 90%)
 *
 * Spec: `.kiro/specs/global-branch-90-percent/`
 *   - requirements.md: Requirement 3.1
 *   - design.md: ThemeClassDetectorTests
 *   - tasks.md: 4.1
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  detectThemeClassCalls,
  type ThemeClassDetectorResult,
} from '../../src/transformer/theme-class-detector.ts';
import {
  createSourceFile,
  createTestProgram,
} from './__fixtures__/ast-builders.ts';

// ---------------------------------------------------------------------------
// テストヘルパー
// ---------------------------------------------------------------------------

/**
 * 単一ファイル program を構築し、その checker と sourceFile を返す。
 * test 中の `detectThemeClassCalls(sf, checker)` 呼び出しを短く書くため。
 */
function buildSingle(source: string): {
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
} {
  const tp = createTestProgram([{ name: 'fixture.ts', source }]);
  const sf = tp.sources.get('fixture.ts');
  if (sf === undefined) throw new Error('sourceFile not found');
  return { sourceFile: sf, checker: tp.checker };
}

/**
 * checker を必要としない経路（HEURISTIC fallback / argument shape）の検証用に
 * 軽量な stub checker を返す。
 *
 * - `getSymbolAtLocation` は常に `undefined`
 * - `getTypeAtLocation` は `class` プロパティを持たない型を返す
 *   → typeLooksLikeUnifiedTheme は false → primary path 不採用 → fallback へ
 */
function makeStubChecker(): ts.TypeChecker {
  const emptyType = {
    getProperty: () => undefined,
    getCallSignatures: () => [],
  } as unknown as ts.Type;

  return {
    getSymbolAtLocation: () => undefined,
    getTypeAtLocation: () => emptyType,
    getTypeOfSymbolAtLocation: () => emptyType,
  } as unknown as ts.TypeChecker;
}

/**
 * `detectThemeClassCalls` を素朴な stub checker で起動するための、
 * `createSourceFile` ヘルパベースのショートカット。
 */
function detectWithStub(
  filename: string,
  source: string,
): readonly ThemeClassDetectorResult[] {
  const sf = createSourceFile(filename, source);
  return detectThemeClassCalls(sf, makeStubChecker());
}

// ---------------------------------------------------------------------------
// TypeChecker primary path
// ---------------------------------------------------------------------------

describe('detectThemeClassCalls / TypeChecker primary path', () => {
  /**
   * 型情報から `theme` が `class` メソッドを持つ型と判定でき、かつ
   * その class プロパティが call signature を持つ場合 — primary path で true。
   *
   * 観測: 検出結果 1 件 / overload === 'anonymous'
   */
  it('ローカル宣言された theme: { class(props): {...} } が primary path で検出される', () => {
    const source = `
declare const theme: { class(props: object): { bodyHash: string } };
const card = theme.class({ display: 'flex' });
`.trimStart();

    const { sourceFile, checker } = buildSingle(source);
    const results = detectThemeClassCalls(sourceFile, checker);

    expect(results.length).toBe(1);
    expect(results[0].overload).toBe('anonymous');
    // 検出された node が本当に `theme.class(...)` 呼び出しであることを確認
    const callee = results[0].callExpr.expression;
    expect(ts.isPropertyAccessExpression(callee)).toBe(true);
  });

  /**
   * 2 引数 overload (`theme.class({...}, {...})`) も primary path で検出される。
   */
  it('2 引数形式 theme.class({...}, {...}) も検出される', () => {
    const source = `
declare const theme: { class(props: object, sel: object): { bodyHash: string } };
const card = theme.class({ color: 'red' }, { hover: { color: 'blue' } });
`.trimStart();

    const { sourceFile, checker } = buildSingle(source);
    const results = detectThemeClassCalls(sourceFile, checker);

    expect(results.length).toBe(1);
  });

  /**
   * `class` プロパティを持たない型は primary path 不採用。
   * DraftOle import も存在しないので fallback も不採用 → 検出されない。
   */
  it('class プロパティを持たない型は検出されない (primary 不採用 + import 無し)', () => {
    const source = `
declare const notTheme: { build(props: object): string };
const x = notTheme.build({ a: 1 });
// 同名メソッドだが LHS は theme 識別子でない
const card = notTheme.class({ display: 'flex' });
`.trimStart();

    const { sourceFile, checker } = buildSingle(source);
    const results = detectThemeClassCalls(sourceFile, checker);

    // notTheme.class(...) は LHS 識別子が 'theme' でないため fallback も成立しない
    expect(results.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// HEURISTIC fallback path
// ---------------------------------------------------------------------------

describe('detectThemeClassCalls / HEURISTIC fallback path', () => {
  /**
   * stub checker により primary path は確実に false。
   * `theme` 識別子 + DraftOle 由来 named import (`el`) で fallback が true を返す。
   */
  it('DraftOle import あり + bare theme 識別子 → fallback で検出される', () => {
    const source = `
import { el, theme } from 'draft-ole';
const card = theme.class({ color: 'red' });
`.trimStart();

    const results = detectWithStub('fallback.ts', source);
    expect(results.length).toBe(1);
    expect(results[0].overload).toBe('anonymous');
  });

  /**
   * DraftOle import が無い場合は fallback も成立せず検出されない。
   * primary path も stub のため false。
   */
  it('DraftOle import 無し → fallback も成立せず検出されない', () => {
    const source = `
import { foo } from 'some-other-package';
const card = theme.class({ color: 'red' });
`.trimStart();

    const results = detectWithStub('no-import.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * import 文はあるが `importClause` が無い形 (`import 'side-effect'`) は
   * `hasDraftOleImport` で skip される。
   */
  it('side-effect import のみ → fallback 成立せず', () => {
    const source = `
import './side-effect';
const card = theme.class({ color: 'red' });
`.trimStart();

    const results = detectWithStub('side-effect.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * `import * as ns from '...'` (namedBindings は NamespaceImport) は
   * `ts.isNamedImports` で false → fallback 成立せず。
   */
  it('namespace import のみ → fallback 成立せず (named imports でないため)', () => {
    const source = `
import * as DraftOle from 'draft-ole';
const card = theme.class({ color: 'red' });
`.trimStart();

    const results = detectWithStub('ns-import.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * default import + 関係ない named import → DRAFTOLE_KNOWN_IMPORTS に
   * 1 つもマッチしない → fallback 成立せず。
   */
  it('既知でない named import のみ → fallback 成立せず', () => {
    const source = `
import { somethingUnknown } from 'some-pkg';
const card = theme.class({ color: 'red' });
`.trimStart();

    const results = detectWithStub('unknown-named.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * LHS が `theme` 以外の識別子だと heuristic fallback の前提条件を満たさない。
   */
  it('LHS 識別子が theme でない → fallback 成立せず', () => {
    const source = `
import { el } from 'draft-ole';
const card = stylesheet.class({ color: 'red' });
`.trimStart();

    const results = detectWithStub('non-theme-id.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * LHS が識別子ではなく PropertyAccessExpression (e.g. `obj.theme.class(...)`)
   * → `ts.isIdentifier(lhs)` が false → fallback 成立せず。
   */
  it('LHS が PropertyAccessExpression (theme でなく obj.theme) → fallback 成立せず', () => {
    const source = `
import { el } from 'draft-ole';
declare const obj: { theme: { class(p: object): unknown } };
const card = obj.theme.class({ color: 'red' });
`.trimStart();

    const results = detectWithStub('nested-theme.ts', source);
    // stub checker により primary も false。LHS は PropertyAccessExpression なので fallback も false。
    expect(results.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 例外耐性 / defensive path
// ---------------------------------------------------------------------------

describe('detectThemeClassCalls / defensive path', () => {
  /**
   * `getSymbolAtLocation` が throw する → catch ブロックに到達して fallback へ移行。
   * DraftOle import + theme 識別子があれば fallback で true。
   */
  it('getSymbolAtLocation throw → catch → fallback で検出される', () => {
    const source = `
import { theme } from 'draft-ole';
const card = theme.class({ color: 'red' });
`.trimStart();

    const sf = createSourceFile('throw1.ts', source);
    const throwingChecker = {
      getSymbolAtLocation: () => {
        throw new Error('synthetic symbol error');
      },
      getTypeAtLocation: () => {
        throw new Error('unreachable');
      },
      getTypeOfSymbolAtLocation: () => {
        throw new Error('unreachable');
      },
    } as unknown as ts.TypeChecker;

    const results = detectThemeClassCalls(sf, throwingChecker);
    expect(results.length).toBe(1);
  });

  /**
   * symbol === undefined パス → `getTypeAtLocation` 経由で型推論を試みる。
   * その型は `class` プロパティを持つ — primary path で true になる。
   */
  it('symbol === undefined だが getTypeAtLocation が UnifiedTheme 互換型を返す → primary 採用', () => {
    const source = `const card = theme.class({ color: 'red' });`;

    const sf = createSourceFile('symbol-undef.ts', source);
    const fakeDecl = {} as ts.Declaration;
    const classProp = {
      getDeclarations: () => [fakeDecl],
    } as unknown as ts.Symbol;
    const classType = {
      getCallSignatures: () => [{} as ts.Signature],
    } as unknown as ts.Type;
    const themeType = {
      getProperty: (name: string) => (name === 'class' ? classProp : undefined),
    } as unknown as ts.Type;
    let typeAtLocationCalls = 0;
    const checker = {
      getSymbolAtLocation: () => undefined,
      getTypeAtLocation: () => {
        typeAtLocationCalls += 1;
        return themeType;
      },
      getTypeOfSymbolAtLocation: (sym: ts.Symbol) => {
        // class プロパティの型を返す
        void sym;
        return classType;
      },
    } as unknown as ts.TypeChecker;

    const results = detectThemeClassCalls(sf, checker);
    expect(results.length).toBe(1);
    expect(typeAtLocationCalls).toBeGreaterThan(0);
  });

  /**
   * `typeLooksLikeUnifiedTheme`: `class` プロパティはあるが `getDeclarations()` が
   * undefined → 「宣言取得失敗 → 緩めに OK 扱い」分岐 (line 110-113) を通る。
   */
  it('class プロパティの getDeclarations() が undefined → 緩い OK 判定', () => {
    const source = `const card = theme.class({ color: 'red' });`;

    const sf = createSourceFile('decls-undef.ts', source);
    const classSymbol = {
      getDeclarations: () => undefined,
    } as unknown as ts.Symbol;
    const themeType = {
      getProperty: (name: string) => (name === 'class' ? classSymbol : undefined),
    } as unknown as ts.Type;
    const checker = {
      getSymbolAtLocation: () => ({} as ts.Symbol),
      getTypeAtLocation: () => themeType,
      getTypeOfSymbolAtLocation: () => themeType,
    } as unknown as ts.TypeChecker;

    const results = detectThemeClassCalls(sf, checker);
    expect(results.length).toBe(1);
  });

  /**
   * `typeLooksLikeUnifiedTheme`: `class` プロパティの宣言取得は成功するが、
   * `getTypeOfSymbolAtLocation` 呼び出しが例外を投げる → catch で `true` を返す
   * (line 118-121).
   */
  it('getTypeOfSymbolAtLocation throw (class type 解決中) → catch で OK', () => {
    const source = `const card = theme.class({ color: 'red' });`;

    const sf = createSourceFile('inner-throw.ts', source);
    const fakeDecl = {} as ts.Declaration;
    const classSymbol = {
      getDeclarations: () => [fakeDecl],
    } as unknown as ts.Symbol;
    const themeType = {
      getProperty: (name: string) => (name === 'class' ? classSymbol : undefined),
    } as unknown as ts.Type;

    let callCount = 0;
    const checker = {
      getSymbolAtLocation: () => ({} as ts.Symbol),
      getTypeAtLocation: () => themeType,
      // 最初の呼び出しは theme 型を返し、次の呼び出し (class プロパティの型解決) で throw
      getTypeOfSymbolAtLocation: () => {
        callCount += 1;
        if (callCount === 1) return themeType;
        throw new Error('synthetic class type error');
      },
    } as unknown as ts.TypeChecker;

    const results = detectThemeClassCalls(sf, checker);
    expect(results.length).toBe(1);
  });

  /**
   * `class` プロパティの call signature 0 件 → `typeLooksLikeUnifiedTheme` は false。
   * DraftOle import + theme 識別子があれば fallback に切り替わって検出される。
   */
  it('class プロパティの call signature が 0 件 → primary 不採用 → fallback で検出', () => {
    const source = `
import { theme } from 'draft-ole';
const card = theme.class({ color: 'red' });
`.trimStart();

    const sf = createSourceFile('sig-zero.ts', source);
    const fakeDecl = {} as ts.Declaration;
    const classSymbol = {
      getDeclarations: () => [fakeDecl],
    } as unknown as ts.Symbol;
    const classType = {
      // call signature が無い → primary 判定 false
      getCallSignatures: () => [],
    } as unknown as ts.Type;
    const themeType = {
      getProperty: (name: string) => (name === 'class' ? classSymbol : undefined),
    } as unknown as ts.Type;

    let callCount = 0;
    const checker = {
      getSymbolAtLocation: () => ({} as ts.Symbol),
      getTypeAtLocation: () => themeType,
      getTypeOfSymbolAtLocation: () => {
        callCount += 1;
        // 1 回目: theme 型, 2 回目: class プロパティの型
        return callCount === 1 ? themeType : classType;
      },
    } as unknown as ts.TypeChecker;

    const results = detectThemeClassCalls(sf, checker);
    // primary 不採用だが fallback で採用される (heuristic)
    expect(results.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 引数列のエッジケース (isAnonymousOverloadArgs)
// ---------------------------------------------------------------------------

describe('detectThemeClassCalls / argument shape edge cases', () => {
  /**
   * 0 引数の `theme.class()` は無名 overload 対象外 → 検出されない。
   */
  it('0 引数 theme.class() は除外される', () => {
    const source = `
import { theme } from 'draft-ole';
const x = theme.class();
`.trimStart();

    const results = detectWithStub('zero-args.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * 第 1 引数が StringLiteral (`theme.class('name', {...})`) は named overload
   * → 除外される。
   */
  it('第 1 引数が StringLiteral (named overload) は除外される', () => {
    const source = `
import { theme } from 'draft-ole';
const card = theme.class('myname', { color: 'red' });
`.trimStart();

    const results = detectWithStub('named.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * 第 1 引数が NoSubstitutionTemplateLiteral (`theme.class(\`name\`, {...})`) も
   * named overload とみなして除外する。
   */
  it('第 1 引数が NoSubstitutionTemplateLiteral も除外される', () => {
    const source = `
import { theme } from 'draft-ole';
const card = theme.class(\`mytemplate\`, { color: 'red' });
`.trimStart();

    const results = detectWithStub('tagged.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * spread 引数を含む場合は除外される。
   */
  it('spread 引数を含む theme.class(...args) は除外される', () => {
    const source = `
import { theme } from 'draft-ole';
declare const args: [object];
const card = theme.class(...args);
`.trimStart();

    const results = detectWithStub('spread.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * 3 引数以上は無名 overload とみなさない → 除外される。
   */
  it('3 引数以上は除外される (named overload の sel 付き形を除く)', () => {
    const source = `
import { theme } from 'draft-ole';
const card = theme.class({ color: 'red' }, { hover: {} }, { extra: true });
`.trimStart();

    const results = detectWithStub('three.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * 2 引数だが第 1 が ObjectLiteral でない場合 → 除外。
   */
  it('2 引数で第 1 引数が ObjectLiteral でない (Identifier) → 除外される', () => {
    const source = `
import { theme } from 'draft-ole';
declare const props: object;
const card = theme.class(props, { hover: {} });
`.trimStart();

    const results = detectWithStub('non-obj-1.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * 2 引数で第 1 は ObjectLiteral だが第 2 が ObjectLiteral でない → 除外。
   */
  it('2 引数で第 2 引数が ObjectLiteral でない → 除外される', () => {
    const source = `
import { theme } from 'draft-ole';
declare const sel: object;
const card = theme.class({ color: 'red' }, sel);
`.trimStart();

    const results = detectWithStub('non-obj-2.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * 1 引数 ObjectLiteral は無名 overload として採用される (positive baseline)。
   */
  it('1 引数 ObjectLiteral は採用される (positive baseline)', () => {
    const source = `
import { theme } from 'draft-ole';
const card = theme.class({ color: 'red' });
`.trimStart();

    const results = detectWithStub('one-obj.ts', source);
    expect(results.length).toBe(1);
  });

  /**
   * 2 引数 ObjectLiteral + ObjectLiteral は無名 + selectors として採用される。
   */
  it('2 引数 ObjectLiteral, ObjectLiteral は採用される (positive baseline)', () => {
    const source = `
import { theme } from 'draft-ole';
const card = theme.class({ color: 'red' }, { hover: {} });
`.trimStart();

    const results = detectWithStub('two-obj.ts', source);
    expect(results.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// CallExpression 形状エッジケース
// ---------------------------------------------------------------------------

describe('detectThemeClassCalls / call expression shape edge cases', () => {
  /**
   * CallExpression だが PropertyAccessExpression でない (`fn(...)` 直接呼び出し)
   * → スキップされる。
   */
  it('PropertyAccessExpression でない CallExpression はスキップされる', () => {
    const source = `
import { theme } from 'draft-ole';
declare function clazz(p: object): unknown;
const x = clazz({ color: 'red' });
`.trimStart();

    const results = detectWithStub('non-pae.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * `.name.text` が 'class' でない (`theme.other(...)`) → スキップ。
   */
  it('プロパティ名が class でないメソッド呼び出しはスキップされる', () => {
    const source = `
import { theme } from 'draft-ole';
declare const theme2: { other(p: object): unknown };
const x = theme2.other({ a: 1 });
`.trimStart();

    const results = detectWithStub('other-method.ts', source);
    expect(results.length).toBe(0);
  });

  /**
   * ソース内に複数の `theme.class(...)` がある場合、検出も複数件返る。
   * 検出順は AST 走査順 (深さ優先 / 出現順)。
   */
  it('複数の theme.class(...) を出現順に検出する', () => {
    const source = `
import { theme } from 'draft-ole';
const a = theme.class({ color: 'red' });
const b = theme.class({ color: 'blue' }, { hover: {} });
const c = theme.class({ color: 'green' });
`.trimStart();

    const results = detectWithStub('multi.ts', source);
    expect(results.length).toBe(3);
    expect(results.every((r) => r.overload === 'anonymous')).toBe(true);
  });

  /**
   * `theme.class(...)` 自体は無いソース → 0 件。
   */
  it('該当呼び出しが無いソース → 検出 0 件', () => {
    const source = `
import { theme } from 'draft-ole';
const a = 1 + 2;
console.log(a);
`.trimStart();

    const results = detectWithStub('empty.ts', source);
    expect(results.length).toBe(0);
  });
});
