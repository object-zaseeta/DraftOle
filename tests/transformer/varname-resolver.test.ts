/**
 * Task 4.5: varname-resolver 単体テスト
 *
 * 3 階層 (Tier 1 / Tier 2 / Tier 3) と sanitize エッジケースを網羅する。
 *
 * - Tier 1: VariableDeclaration の name を採用 (const/let/var、関数内も含む)
 * - Tier 2: PropertyAssignment ('css' carrier) → sibling label / factory role
 * - Tier 3: 親 CallExpression の関数名を採用
 * - sanitize: 非 [a-z0-9-] を `-` 化、24 char 切詰め、空 → undefined
 *
 * 対応 requirements: 1.x, 2.x, 3.x
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  CLASS_CARRIER_PROP_NAMES,
  resolveVarName,
  sanitizeVarName,
} from '../../src/transformer/varname-resolver.ts';
import { createSourceFile, findNode } from './__fixtures__/ast-builders.ts';

// ---- ヘルパー --------------------------------------------------------------

/**
 * テストソースから `theme.class(...)` 呼び出しを 1 件抽出する。
 * resolveVarName は checker を実際には使わないので、最小スタブで十分。
 */
function parseAndFindThemeClass(source: string): {
  sourceFile: ts.SourceFile;
  callExpr: ts.CallExpression;
  checker: ts.TypeChecker;
} {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );

  let found: ts.CallExpression | undefined;
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'theme' &&
      node.expression.name.text === 'class'
    ) {
      if (found === undefined) found = node;
      return;
    }
    node.forEachChild(visit);
  };
  visit(sourceFile);

  if (found === undefined) {
    throw new Error('theme.class(...) 呼び出しが見つからない');
  }
  const checker = {} as ts.TypeChecker;
  return { sourceFile, callExpr: found, checker };
}

function resolve(source: string): string | undefined {
  const { sourceFile, callExpr, checker } = parseAndFindThemeClass(source);
  return resolveVarName(callExpr, sourceFile, checker);
}

// ---- Tier 1 ----------------------------------------------------------------

describe('varname-resolver Tier 1: VariableDeclaration', () => {
  it('module-top const 宣言: const card = theme.class({...}) → "card"', () => {
    expect(resolve(`const card = theme.class({});`)).toBe('card');
  });

  it('module-top let 宣言: let foo = theme.class({...}) → "foo"', () => {
    expect(resolve(`let foo = theme.class({});`)).toBe('foo');
  });

  it('module-top var 宣言: var bar = theme.class({...}) → "bar"', () => {
    expect(resolve(`var bar = theme.class({});`)).toBe('bar');
  });

  it('関数ボディ内: function f() { const baz = theme.class({...}); } → "baz"', () => {
    expect(
      resolve(`function f() { const baz = theme.class({}); return baz; }`),
    ).toBe('baz');
  });

  it('arrow function 内: const f = () => { const inner = theme.class({}); } → "inner"', () => {
    expect(
      resolve(`const f = () => { const inner = theme.class({}); return inner; };`),
    ).toBe('inner');
  });
});

// ---- Tier 2 ----------------------------------------------------------------

describe('varname-resolver Tier 2: class carrier prop fallback', () => {
  it('(a) sibling id プロパティ: el.div({ id: "main-card", css: theme.class({}) }) → "main-card"', () => {
    expect(
      resolve(`el.div({ id: "main-card", css: theme.class({}) });`),
    ).toBe('main-card');
  });

  it("(a) sibling name プロパティ: el.input({ name: \"email\", css: theme.class({}) }) → \"email\"", () => {
    expect(
      resolve(`el.input({ name: "email", css: theme.class({}) });`),
    ).toBe('email');
  });

  it('(a) sibling 優先順 id > name: 両方ある場合 id が勝つ', () => {
    expect(
      resolve(
        `el.div({ name: "fallback-name", id: "winner", css: theme.class({}) });`,
      ),
    ).toBe('winner');
  });

  it("(b) factory role: el.button({ type: \"submit\", css: theme.class({}) }) → \"submit\"", () => {
    expect(
      resolve(`el.button({ type: "submit", css: theme.class({}) });`),
    ).toBe('submit');
  });

  it("(b) factory role: el.input({ type: \"checkbox\", css: theme.class({}) }) → \"checkbox\"", () => {
    expect(
      resolve(`el.input({ type: "checkbox", css: theme.class({}) });`),
    ).toBe('checkbox');
  });

  it('(c) carrier prop だが sibling/role 共に該当無し → undefined (Tier 3 は親が PropertyAssignment のため発火しない)', () => {
    // callExpr.parent は PropertyAssignment。Tier 2 が sibling/role いずれも
    // ヒットせず undefined を返す。Tier 3 は parent が CallExpression のときのみ
    // 発火するため、この形では発火せず最終的に undefined。
    expect(resolve(`const _x = ({ css: theme.class({}) });`)).toBeUndefined();
  });

  it('div (factory role 非対象タグ) では type prop を採用しない → undefined', () => {
    // 親 factory は el.div。factoryRole は button/input のみ対象なので
    // (b) も発火しない。sibling label も無いので Tier 2 全敗。
    // Tier 3 も parent が PropertyAssignment のため発火しない → undefined。
    expect(
      resolve(`el.div({ type: "submit", css: theme.class({}) });`),
    ).toBeUndefined();
  });

  it('carrier prop "css" 以外 (例: foo) では Tier 2 は発火しない', () => {
    // parent は PropertyAssignment だが name が "css" でない。
    // Tier 2 早期 return → Tier 3 も発火せず undefined。
    expect(
      resolve(`el.div({ foo: theme.class({}), id: "ignored" });`),
    ).toBeUndefined();
  });
});

// ---- Tier 3 ----------------------------------------------------------------

describe('varname-resolver Tier 3: parent CallExpression', () => {
  it('helper 関数呼び出し: someHelper(theme.class({})) → "someHelper" → sanitize → "somehelper"', () => {
    // sanitizeVarName が lower-case 化するため "someHelper" → "somehelper"
    expect(resolve(`someHelper(theme.class({}));`)).toBe('somehelper');
  });

  it('メソッド呼び出し: obj.method(theme.class({})) → "method"', () => {
    expect(resolve(`obj.method(theme.class({}));`)).toBe('method');
  });

  it('bare 単純呼び出し: foo(theme.class({})) → "foo"', () => {
    expect(resolve(`foo(theme.class({}));`)).toBe('foo');
  });

  it('Tier 3 も該当しない (文として孤立) → undefined', () => {
    // ExpressionStatement 直下の CallExpression。parent は ExpressionStatement。
    expect(resolve(`theme.class({});`)).toBeUndefined();
  });
});

// ---- sanitize エッジケース -------------------------------------------------

describe('sanitizeVarName', () => {
  it('非 [a-z0-9-] を - に置換し連続を畳む: "日本語Card!" → "card"', () => {
    expect(sanitizeVarName('日本語Card!')).toBe('card');
  });

  it('lower-case 化: "FooBar" → "foobar"', () => {
    expect(sanitizeVarName('FooBar')).toBe('foobar');
  });

  it('24 文字切り詰め: 30 a → 24 a', () => {
    expect(sanitizeVarName('a'.repeat(30))).toBe('a'.repeat(24));
  });

  it('24 char 切詰め後の末尾 - を除去: "aaaaaaaaaaaaaaaaaaaaaaa-extra" (23 a + - + extra)', () => {
    // 23 a + '-' + 'extra' = 29 chars. slice(0,24) → 23 a + '-'. trailing - 除去 → 23 a.
    expect(sanitizeVarName('aaaaaaaaaaaaaaaaaaaaaaa-extra')).toBe('a'.repeat(23));
  });

  it('連続 - を畳む: "foo--bar" → "foo-bar"', () => {
    expect(sanitizeVarName('foo--bar')).toBe('foo-bar');
  });

  it('端 - を除去: "-foo-" → "foo"', () => {
    expect(sanitizeVarName('-foo-')).toBe('foo');
  });

  it('空文字列 → 空文字列', () => {
    expect(sanitizeVarName('')).toBe('');
  });

  it('全部 sanitize されて空 → 空文字列', () => {
    expect(sanitizeVarName('___')).toBe('');
  });

  it('resolveVarName: sanitize 結果が空なら undefined を返す', () => {
    // 識別子 `_` は変数名として valid。lower-case 化後 `_` → `-` → trim で空。
    expect(resolve(`const _ = theme.class({});`)).toBeUndefined();
  });
});

// ---- 公開定数 --------------------------------------------------------------

describe('CLASS_CARRIER_PROP_NAMES', () => {
  it('現状は ["css"] のみを class carrier として扱う', () => {
    expect([...CLASS_CARRIER_PROP_NAMES]).toEqual(['css']);
  });
});

// ---------------------------------------------------------------------------
// Task 4.3 追加カバレッジ: ast-builders 経由で未到達分岐を網羅する
//
// 既存 27 テストでは到達していない以下の分岐を対象とする:
//   - Tier 1: 非 Identifier の VariableDeclaration 名 (ArrayBindingPattern / ObjectBindingPattern)
//   - Tier 2 getPropertyName: StringLiteral / ComputedPropertyName
//   - Tier 2 getStringLiteralValue: NoSubstitutionTemplateLiteral / 非リテラル
//   - Tier 2 scanSiblingLabelProps: 非 PropertyAssignment member (shorthand)
//   - Tier 2 scanSiblingLabelProps: 空文字列を弾く分岐
//   - Tier 2 tryFactoryRoleLabel: objLit が第 1 引数でないケース
//   - Tier 2 tryFactoryRoleLabel: type member が PropertyAssignment でない
//   - Tier 2 tryFactoryRoleLabel: type 値が空文字 / 非リテラル
//   - extractTagName: Identifier / PropertyAccess 以外（ElementAccess / Parenthesized 等）
//   - Tier 3: 親 CallExpression の callee 位置にいる場合 (`theme.class({})()`)
//
// ast-builders.ts の `createSourceFile` / `findNode` を再利用し、各テストで
// theme.class(...) CallExpression を 1 件抽出する。
// ---------------------------------------------------------------------------

function resolveViaAstBuilders(source: string): string | undefined {
  const sourceFile = createSourceFile('vr-extra.ts', source);
  const call = findNode<ts.CallExpression>(
    sourceFile,
    (node): node is ts.CallExpression =>
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'theme' &&
      node.expression.name.text === 'class',
  );
  if (call === undefined) throw new Error('theme.class(...) が見つからない');
  const checker = {} as ts.TypeChecker;
  return resolveVarName(call, sourceFile, checker);
}

describe('varname-resolver Tier 1: 非 Identifier name の分岐', () => {
  it('Array destructuring `const [card] = theme.class({})` → Tier 1 失敗、Tier 3 も発火せず undefined', () => {
    // parent は VariableDeclaration かつ initializer === callExpr だが、
    // name は ArrayBindingPattern なので ts.isIdentifier(parent.name) で false。
    // Tier 2 (PropertyAssignment) も Tier 3 (CallExpression) も親が異なるため
    // 発火せず最終的に undefined。
    expect(resolveViaAstBuilders(`const [card] = theme.class({});`)).toBeUndefined();
  });

  it('Object destructuring `const { x } = theme.class({})` も同様に undefined', () => {
    expect(
      resolveViaAstBuilders(`const { x } = theme.class({});`),
    ).toBeUndefined();
  });
});

describe('varname-resolver Tier 2: getPropertyName エッジケース', () => {
  it('Computed property name `[ "css" ]: theme.class(...)` は getPropertyName が undefined → Tier 2 早期脱出', () => {
    // 親は PropertyAssignment だが name は ComputedPropertyName。
    // getPropertyName が undefined を返し、CLASS_CARRIER_PROP_NAMES 判定前に
    // 早期 return。Tier 3 も親が PropertyAssignment のため発火せず undefined。
    expect(
      resolveViaAstBuilders(`el.div({ ["css"]: theme.class({}) });`),
    ).toBeUndefined();
  });

  it('String literal プロパティ名 `"css": theme.class(...)` も class carrier として扱う', () => {
    // getPropertyName の StringLiteral 分岐 + sibling label fallthrough テスト。
    expect(
      resolveViaAstBuilders(`el.div({ id: "named-id", "css": theme.class({}) });`),
    ).toBe('named-id');
  });
});

describe('varname-resolver Tier 2: scanSiblingLabelProps エッジケース', () => {
  it('Shorthand のみで sibling 採用される label がない場合は (b) factory role に進む', () => {
    // `id` shorthand + `type: "submit"` + button factory。
    // scanSiblingLabelProps: id shorthand を skip → 一致無し → undefined。
    // tryFactoryRoleLabel: button タグ + type="submit" → "submit"。
    expect(
      resolveViaAstBuilders(
        `const id = 1; el.button({ id, type: "submit", css: theme.class({}) });`,
      ),
    ).toBe('submit');
  });

  it('空文字 id は採用しない (value.length > 0 分岐 false)', () => {
    // id: "" は length === 0 で弾かれ、次の優先 name を探す。name も無いので
    // sibling fallback 不発 → factory role (input + type="email") → "email"。
    expect(
      resolveViaAstBuilders(
        `el.input({ id: "", type: "email", css: theme.class({}) });`,
      ),
    ).toBe('email');
  });

  it('id の値が非リテラル (数値) の場合は getStringLiteralValue が undefined → スキップ', () => {
    // id: 42 → getStringLiteralValue が NumericLiteral にマッチせず undefined。
    // 次の name もないので sibling 不発 → factory role (button + type) → "submit"。
    expect(
      resolveViaAstBuilders(
        `el.button({ id: 42, type: "submit", css: theme.class({}) });`,
      ),
    ).toBe('submit');
  });

  it('id 値が NoSubstitutionTemplateLiteral でも採用される', () => {
    // getStringLiteralValue の NoSubstitutionTemplateLiteral 分岐 (line 137) を踏む。
    expect(
      resolveViaAstBuilders(
        // eslint-disable-next-line no-template-curly-in-string
        'el.div({ id: `tpl-id`, css: theme.class({}) });',
      ),
    ).toBe('tpl-id');
  });
});

describe('varname-resolver Tier 2: tryFactoryRoleLabel エッジケース', () => {
  it('ObjectLiteral が factory の第 2 引数の場合は role 抽出しない (line 166 分岐)', () => {
    // factory("foo", { css: theme.class({}) }) — parent.arguments[0] !== objLit
    // のため early-return。Tier 2 全敗 → Tier 3 は parent が PropertyAssignment の
    // ため発火せず undefined。
    expect(
      resolveViaAstBuilders(`factory("foo", { css: theme.class({}) });`),
    ).toBeUndefined();
  });

  it('button factory で type プロパティが shorthand なら skip して undefined', () => {
    // tryFactoryRoleLabel の !ts.isPropertyAssignment(member) continue 分岐。
    // type が shorthand、他に sibling / 別の type も無い → undefined。
    expect(
      resolveViaAstBuilders(
        `const type = "x"; el.button({ type, css: theme.class({}) });`,
      ),
    ).toBeUndefined();
  });

  it('button factory で type 値が空文字なら採用しない (length > 0 分岐 false)', () => {
    // type: "" は length === 0 で弾かれ、他に候補なし → undefined。
    expect(
      resolveViaAstBuilders(`el.button({ type: "", css: theme.class({}) });`),
    ).toBeUndefined();
  });

  it('button factory で type 値が非リテラル数値なら採用しない', () => {
    // type: 42 → getStringLiteralValue が undefined → skip → undefined。
    expect(
      resolveViaAstBuilders(`el.button({ type: 42, css: theme.class({}) });`),
    ).toBeUndefined();
  });
});

describe('varname-resolver extractTagName: Identifier/PropertyAccess 以外の分岐', () => {
  it('ElementAccessExpression 呼び出し `arr[0](theme.class({}))` → Tier 3 undefined (line 185)', () => {
    // parent.expression は ElementAccessExpression。Identifier でも
    // PropertyAccessExpression でもないので extractTagName が undefined → Tier 3 不発。
    expect(
      resolveViaAstBuilders(`arr[0](theme.class({}));`),
    ).toBeUndefined();
  });

  it('ParenthesizedExpression 呼び出し `(fn)(theme.class({}))` も同様に undefined', () => {
    // parent.expression は ParenthesizedExpression → extractTagName undefined。
    expect(
      resolveViaAstBuilders(`(fn)(theme.class({}));`),
    ).toBeUndefined();
  });

  it('factory role 経路でも tag が ElementAccess なら抽出失敗 → Tier 2 (b) undefined', () => {
    // objLit の親 CallExpression の expression が ElementAccessExpression。
    // extractTagName が undefined を返し tryFactoryRoleLabel は early-return。
    // sibling label も無いので Tier 2 全敗 → undefined。
    expect(
      resolveViaAstBuilders(
        `factories["button"]({ type: "submit", css: theme.class({}) });`,
      ),
    ).toBeUndefined();
  });
});

describe('varname-resolver Tier 3: callee 位置 (parent.expression === callExpr)', () => {
  it('`theme.class({})()` — theme.class は親 CallExpression の callee → Tier 3 早期 return', () => {
    // 外側 CallExpression を見つけたら、その expression が theme.class CallExpression。
    // resolveVarName に渡されるのは内側の theme.class。parent は外側 CallExpression、
    // parent.expression === callExpr のため Tier 3 は undefined を返す。
    // Tier 1 / Tier 2 も親が異なり発火しないので最終的に undefined。
    expect(resolveViaAstBuilders(`theme.class({})();`)).toBeUndefined();
  });
});
