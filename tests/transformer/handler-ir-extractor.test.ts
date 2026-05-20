/**
 * Task 4.2: handler-ir-extractor テスト
 *
 * 観測可能な完了基準（5 ケース緑）:
 *   1. 引数なし・式本体: `() => count.set(1)` → paramName: null, isExpressionBody: true
 *   2. 引数あり・式本体: `(e) => state.set(e.target.value)` → paramName: "e", isExpressionBody: true
 *   3. ブロック本体: `(e) => { const v = 1; state.set(v); }` → ブロック本体, localDecls に "v"
 *   4. 引数なし・ブロック本体: `() => { state.set(0); }` → paramName: null, isExpressionBody: false
 *   5. 空本体: `() => {}` → warning diagnostic, isExpressionBody: false
 *
 * 対応 requirements: 2.2, 2.6, 4.6
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { extractHandlerIR } from '../../src/transformer/handler-ir-extractor.ts';
import { createSourceFile, findNode } from './__fixtures__/ast-builders.ts';

// ---- テスト用ユーティリティ --------------------------------------------------

/**
 * ソースコード文字列からアロー関数ノードを取得するヘルパー。
 * ファイル内で最初に現れる ArrowFunction ノードを返す。
 */
function getArrowFunction(sourceCode: string): {
  arrowFn: ts.ArrowFunction;
  sourceFile: ts.SourceFile;
} {
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

  return { arrowFn: found, sourceFile };
}

// ---- テストケース ------------------------------------------------------------

const TEST_TIMEOUT_MS = 10_000;

describe('handler-ir-extractor / extractHandlerIR', () => {
  /**
   * ケース1: 引数なし・式本体
   * `() => count.set(1)` → paramName: null, isExpressionBody: true
   */
  it('ケース1: 引数なし・式本体アローを正しく抽出する', () => {
    const { arrowFn, sourceFile } = getArrowFunction(`
const fn = () => count.set(1);
`.trimStart());

    const result = extractHandlerIR(arrowFn, sourceFile);

    expect(result.ir).toBeDefined();
    expect(result.ir!.paramName).toBeNull();
    expect(result.ir!.paramTypeText).toBeNull();
    expect(result.ir!.isExpressionBody).toBe(true);
    expect(result.ir!.node).toBe(arrowFn);
    // 引数なしなのでローカル宣言は空
    expect(result.ir!.localDecls.size).toBe(0);
    // 警告なし
    expect(result.warning).toBeUndefined();
  }, TEST_TIMEOUT_MS);

  /**
   * ケース2: 引数あり・式本体
   * `(e) => state.set(e)` → paramName: "e", isExpressionBody: true
   */
  it('ケース2: 引数あり・式本体アローを正しく抽出する', () => {
    const { arrowFn, sourceFile } = getArrowFunction(`
const fn = (e: MouseEvent) => state.set(e);
`.trimStart());

    const result = extractHandlerIR(arrowFn, sourceFile);

    expect(result.ir).toBeDefined();
    expect(result.ir!.paramName).toBe('e');
    // 型テキストが取れる（MouseEvent または型情報が含まれる）
    expect(result.ir!.paramTypeText).toBeTruthy();
    expect(result.ir!.isExpressionBody).toBe(true);
    // パラメータは localDecls に含まれる
    expect(result.ir!.localDecls.has('e')).toBe(true);
    // 警告なし
    expect(result.warning).toBeUndefined();
  }, TEST_TIMEOUT_MS);

  /**
   * ケース3: 引数あり・ブロック本体（const ローカル宣言あり）
   * `(e) => { const v = 1; state.set(v); }` → ブロック本体, localDecls に "v", "e"
   */
  it('ケース3: ブロック本体・ローカル宣言を正しく収集する', () => {
    const { arrowFn, sourceFile } = getArrowFunction(`
const fn = (e: Event) => {
  const v = 1;
  let w = 2;
  state.set(v + w);
};
`.trimStart());

    const result = extractHandlerIR(arrowFn, sourceFile);

    expect(result.ir).toBeDefined();
    expect(result.ir!.paramName).toBe('e');
    expect(result.ir!.isExpressionBody).toBe(false);
    // const/let で宣言された変数と引数が localDecls に含まれる
    expect(result.ir!.localDecls.has('e')).toBe(true);
    expect(result.ir!.localDecls.has('v')).toBe(true);
    expect(result.ir!.localDecls.has('w')).toBe(true);
    // 警告なし
    expect(result.warning).toBeUndefined();
  }, TEST_TIMEOUT_MS);

  /**
   * ケース4: 引数なし・ブロック本体
   * `() => { state.set(0); }` → paramName: null, isExpressionBody: false
   */
  it('ケース4: 引数なし・ブロック本体アローを正しく抽出する', () => {
    const { arrowFn, sourceFile } = getArrowFunction(`
const fn = () => {
  state.set(0);
};
`.trimStart());

    const result = extractHandlerIR(arrowFn, sourceFile);

    expect(result.ir).toBeDefined();
    expect(result.ir!.paramName).toBeNull();
    expect(result.ir!.paramTypeText).toBeNull();
    expect(result.ir!.isExpressionBody).toBe(false);
    expect(result.ir!.localDecls.size).toBe(0);
    // 警告なし
    expect(result.warning).toBeUndefined();
  }, TEST_TIMEOUT_MS);

  /**
   * ケース5: 空本体
   * `() => {}` → warning を発しつつ継続（ir は返す）
   */
  it('ケース5: 空本体は warning を発しつつ継続する', () => {
    const { arrowFn, sourceFile } = getArrowFunction(`
const fn = () => {};
`.trimStart());

    const result = extractHandlerIR(arrowFn, sourceFile);

    // ir は返される（エラーにはしない）
    expect(result.ir).toBeDefined();
    expect(result.ir!.paramName).toBeNull();
    expect(result.ir!.isExpressionBody).toBe(false);
    // warning が発せられる
    expect(result.warning).toBeDefined();
    expect(result.warning!.category).toBe(ts.DiagnosticCategory.Warning);
    // 警告メッセージに意味のある内容が含まれる
    expect(typeof result.warning!.messageText).toBe('string');
    expect(result.warning!.messageText as string).toContain('empty');
  }, TEST_TIMEOUT_MS);

  // ---- 追加テスト群: branch カバレッジ補強 ------------------------------------
  //
  // 既存 5 テストは Identifier param / 式本体 / ブロック本体 / 空本体 を
  // カバーしているが、`collectLocalDeclsFromBlock` の以下の分岐が未到達:
  //   - if ブロックの `elseStatement` あり
  //   - for / for-in / for-of 内の VariableStatement
  //   - while / do-while 内の VariableStatement
  //   - try / catch / finally 内の VariableStatement
  // また、引数の以下の分岐も未到達:
  //   - 第1引数が非 Identifier（destructuring パターン）
  //   - 第1引数が型注釈なし

  describe('parameter 解析の追加分岐', () => {
    /**
     * Destructuring パターン `({a, b}) => ...` は `firstParam.name` が
     * Identifier でない経路。paramName / paramTypeText は更新されず、
     * localDecls にも追加されない（後続 phase で扱う前提）。
     */
    it('destructuring パターンの第1引数は paramName を null のままにする', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        'const fn = ({ a, b }: { a: number; b: number }) => state.set(a + b);',
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir).toBeDefined();
      // Identifier ではないので paramName は更新されない
      expect(result.ir!.paramName).toBeNull();
      // 型注釈は存在するので paramTypeText は埋まる
      expect(result.ir!.paramTypeText).toBeTruthy();
      // 引数名が取れないので localDecls は空
      expect(result.ir!.localDecls.size).toBe(0);
      expect(result.warning).toBeUndefined();
    }, TEST_TIMEOUT_MS);

    /**
     * 型注釈なしの Identifier param: `paramTypeText` は null のまま。
     */
    it('型注釈なしの Identifier 引数では paramTypeText が null になる', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        'const fn = (x) => state.set(x);',
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir).toBeDefined();
      expect(result.ir!.paramName).toBe('x');
      expect(result.ir!.paramTypeText).toBeNull();
      expect(result.ir!.localDecls.has('x')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * 型注釈ありの Identifier param: 既存ケース 2 でカバー済みだが、
     * 型テキスト内容を検証して branch を補強する。
     */
    it('型注釈ありの Identifier 引数では paramTypeText に型テキストが入る', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        'const fn = (x: number) => state.set(x);',
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.paramName).toBe('x');
      expect(result.ir!.paramTypeText).toBe('number');
    }, TEST_TIMEOUT_MS);
  });

  describe('collectLocalDeclsFromBlock の制御構文網羅', () => {
    /**
     * if 文の elseStatement に const 宣言を入れて、
     * `stmt.elseStatement !== undefined` の true 経路を踏ませる。
     */
    it('if/else ブロック内の const/let 宣言を localDecls に追加する', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  if (cond) {
    const a = 1;
  } else {
    const b = 2;
    let c = 3;
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('a')).toBe(true);
      expect(result.ir!.localDecls.has('b')).toBe(true);
      expect(result.ir!.localDecls.has('c')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * elseStatement なしの if は false 経路を確実に踏む。
     */
    it('else なしの if ブロックでも then 内の宣言を収集する', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  if (cond) {
    const x = 1;
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('x')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * 通常の for 文: `ts.isForStatement` 経路。
     */
    it('for ループのブロック内の宣言を収集する', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  for (let i = 0; i < 10; i++) {
    const inner = i;
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('inner')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * for-in 文: `ts.isForInStatement` 経路。
     */
    it('for-in ループのブロック内の宣言を収集する', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  for (const key in obj) {
    const v = obj[key];
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('v')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * for-of 文: `ts.isForOfStatement` 経路。
     */
    it('for-of ループのブロック内の宣言を収集する', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  for (const item of items) {
    const doubled = item * 2;
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('doubled')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * while 文: `ts.isWhileStatement` 経路。
     */
    it('while ループのブロック内の宣言を収集する', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  while (running) {
    const tick = 1;
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('tick')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * do-while 文: `ts.isDoStatement` 経路。
     */
    it('do-while ループのブロック内の宣言を収集する', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  do {
    const doVar = 1;
  } while (cond);
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('doVar')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * try / catch / finally すべてに宣言を入れ、
     * - tryBlock 経路 (常に踏む)
     * - catchClause !== undefined 経路 (true)
     * - finallyBlock !== undefined 経路 (true)
     * の3経路を踏ませる。
     */
    it('try/catch/finally 各ブロック内の宣言を収集する', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  try {
    const tryVar = 1;
  } catch (err) {
    const catchVar = 2;
  } finally {
    const finallyVar = 3;
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('tryVar')).toBe(true);
      expect(result.ir!.localDecls.has('catchVar')).toBe(true);
      expect(result.ir!.localDecls.has('finallyVar')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * try のみ（catch/finally なし）: catchClause/finallyBlock の
     * `undefined` 経路 (false) を踏む。
     *
     * 注: TypeScript の構文上 try には catch または finally の
     * いずれかが必須なので、ここでは try { } finally { } で
     * catchClause === undefined の経路を踏ませる。
     */
    it('catch 句なしの try/finally でも宣言を収集する（catchClause undefined 経路）', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  try {
    const onlyTry = 1;
  } finally {
    const onlyFin = 2;
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('onlyTry')).toBe(true);
      expect(result.ir!.localDecls.has('onlyFin')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * finally なしの try/catch: finallyBlock === undefined 経路 (false)。
     */
    it('finally なしの try/catch でも宣言を収集する（finallyBlock undefined 経路）', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  try {
    const t1 = 1;
  } catch (e) {
    const c1 = 2;
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('t1')).toBe(true);
      expect(result.ir!.localDecls.has('c1')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * ネストされた裸のブロック `{ ... }` の中の宣言: `ts.isBlock` 経路。
     */
    it('ネストされた裸のブロック内の宣言を収集する', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  {
    const nested = 1;
  }
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      expect(result.ir!.localDecls.has('nested')).toBe(true);
    }, TEST_TIMEOUT_MS);

    /**
     * VariableStatement で `const [a, b] = arr;` のように destructuring
     * パターンを宣言した場合、`decl.name` は Identifier ではないので
     * 集合には追加されない（false 経路）。
     */
    it('destructuring VariableStatement は localDecls に含まれない', () => {
      const sourceFile = createSourceFile(
        'test.ts',
        `const fn = () => {
  const [a, b] = arr;
  const plain = 0;
};`,
      );
      const arrowFn = findNode(sourceFile, ts.isArrowFunction);
      expect(arrowFn).toBeDefined();

      const result = extractHandlerIR(arrowFn!, sourceFile);

      // destructuring された a, b は Identifier ではないので追加されない
      expect(result.ir!.localDecls.has('a')).toBe(false);
      expect(result.ir!.localDecls.has('b')).toBe(false);
      // 並行して書いた通常の const は追加される
      expect(result.ir!.localDecls.has('plain')).toBe(true);
    }, TEST_TIMEOUT_MS);
  });
});
