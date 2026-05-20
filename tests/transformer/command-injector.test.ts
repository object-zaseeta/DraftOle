/**
 * Task 6.2: command-injector テスト
 *
 * 観測可能な完了基準:
 *   書き換え前後の AST 構造スナップショットが一致
 *
 * テスト方針:
 *   1. Feature Flag を false にした状態でテストを書く（RED）
 *   2. Feature Flag を true にして実装（GREEN）
 *   3. Feature Flag を除去してテストが通ることを確認
 *
 * 対応 requirements: 1.5, 4.1
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { injectCommand } from '../../src/transformer/command-injector.ts';
import type { SerializedHandler } from '../../src/transformer/handler-serializer.ts';

// ---- テスト用ユーティリティ -------------------------------------------------

/**
 * ts.Printer を使ってノードを文字列化するヘルパー。
 * SourceFile を指定することで元のノードも正しく出力できる。
 */
function printNode(node: ts.Node, sourceFile: ts.SourceFile): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

/**
 * `.on(event, originalArrow)` の CallExpression AST を作成するヘルパー。
 * 実際の変換前の状態を模擬する。
 */
function createOnCallExpression(
  eventName: string,
  arrowCode: string,
): {
  callExpr: ts.CallExpression;
  arrowFn: ts.ArrowFunction;
  sourceFile: ts.SourceFile;
} {
  const source = `element.on("${eventName}", ${arrowCode});`;
  const sourceFile = ts.createSourceFile(
    'test.ts',
    source,
    ts.ScriptTarget.ES2019,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );

  // ExpressionStatement > CallExpression を取得
  const stmt = sourceFile.statements[0] as ts.ExpressionStatement;
  const callExpr = stmt.expression as ts.CallExpression;
  const arrowFn = callExpr.arguments[1] as ts.ArrowFunction;

  return { callExpr, arrowFn, sourceFile };
}

// ---- テストケース ------------------------------------------------------------

describe('command-injector / injectCommand', () => {
  /**
   * ケース1: 基本書き換え
   * `.on("click", (e) => count.set(1))` の第2引数を
   * `Object.assign((s) => s._emitHandlerBody("__draftole__.state(\"count-id\").set(1)", ["e"]), { _draftoleEmitted: true })`
   * に書き換えた CallExpression を返す
   */
  it('ケース1: アロー関数ハンドラを _emitHandlerBody 呼び出しに書き換える', () => {
    const { callExpr, sourceFile } = createOnCallExpression('click', '(e) => count.set(1)');

    const serialized: SerializedHandler = {
      code: '__draftole__.state("count-id").set(1)',
      params: ['e'],
    };

    const result = injectCommand(callExpr, serialized);
    const output = printNode(result, sourceFile);

    // 第2引数が Object.assign(...) 形式に書き換えられていることを確認
    expect(output).toMatchInlineSnapshot(
      `"element.on("click", Object.assign(s => s._emitHandlerBody("__draftole__.state(\\"count-id\\").set(1)", ["e"]), { _draftoleEmitted: true }))"`,
    );
  });

  /**
   * ケース2: 引数なしアロー関数
   * `.on("click", () => count.set(1))` → params: []
   */
  it('ケース2: 引数なしアロー関数を書き換える', () => {
    const { callExpr, sourceFile } = createOnCallExpression('click', '() => count.set(1)');

    const serialized: SerializedHandler = {
      code: '__draftole__.state("count-id").set(1)',
      params: [],
    };

    const result = injectCommand(callExpr, serialized);
    const output = printNode(result, sourceFile);

    // params が空配列になっていることを確認
    expect(output).toMatchInlineSnapshot(
      `"element.on("click", Object.assign(s => s._emitHandlerBody("__draftole__.state(\\"count-id\\").set(1)", []), { _draftoleEmitted: true }))"`,
    );
  });

  /**
   * ケース3: 複数行コードのシリアライズ結果
   * ブロック本体ハンドラのシリアライズ結果を書き換える
   */
  it('ケース3: 複数行コードのシリアライズ結果を書き換える', () => {
    const { callExpr, sourceFile } = createOnCallExpression('submit', '(e) => { e.preventDefault(); count.set(1); }');

    const serialized: SerializedHandler = {
      code: 'e.preventDefault();\n__draftole__.state("count-id").set(1);',
      params: ['e'],
    };

    const result = injectCommand(callExpr, serialized);
    const output = printNode(result, sourceFile);

    // コードが正しく文字列リテラルとして埋め込まれていることを確認
    expect(output).toContain('_emitHandlerBody(');
    expect(output).toContain('_draftoleEmitted: true');
    expect(output).toContain('"e"');
  });

  /**
   * ケース4: 書き換え後の AST が元の CallExpression を保持する
   * - 第1引数（イベント名）は変更されない
   * - 第2引数のみ書き換えられる
   */
  it('ケース4: 第1引数（イベント名）は変更されない', () => {
    const { callExpr, sourceFile } = createOnCallExpression('keydown', '(e) => name.set(e.key)');

    const serialized: SerializedHandler = {
      code: '__draftole__.state("name-id").set(e.key)',
      params: ['e'],
    };

    const result = injectCommand(callExpr, serialized);
    const output = printNode(result, sourceFile);

    // イベント名が維持されている
    expect(output).toContain('"keydown"');
    // 元のアロー関数は除去されている
    expect(output).not.toContain('name.set(e.key)');
    // 書き換え後のコードが _emitHandlerBody の引数として含まれる
    // （文字列内のダブルクォートはエスケープされる）
    expect(output).toContain('_emitHandlerBody(');
    expect(output).toContain('name-id');
  });

  /**
   * ケース5: _draftoleEmitted マーカーが Object.assign で付与される
   */
  it('ケース5: _draftoleEmitted マーカーが付与される', () => {
    const { callExpr, sourceFile } = createOnCallExpression('click', '() => {}');

    const serialized: SerializedHandler = {
      code: '',
      params: [],
    };

    const result = injectCommand(callExpr, serialized);
    const output = printNode(result, sourceFile);

    expect(output).toContain('_draftoleEmitted: true');
    expect(output).toContain('Object.assign(');
  });
});
