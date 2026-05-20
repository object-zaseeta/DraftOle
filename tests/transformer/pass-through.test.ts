/**
 * Task 3.2: draftoleTransformer パススルー骨格テスト
 *
 * 観測可能な完了基準:
 *   - transformer を通した入力ファイルが無変化で出力される（スナップショット 1 件）
 *
 * 対応 requirements: 5.1 (transformer として実装), 5.4 (元ソース不変)
 */

import { describe, it, expect } from 'vitest';
import * as ts from 'typescript';
import draftoleTransformer from '../../src/transformer/index.ts';

const SOURCE_CODE = `
const x = 1;
function greet(name: string): string {
  return "hello " + name;
}
export { greet };
`.trimStart();

describe('draftoleTransformer / パススルー骨格', () => {
  it('transformer を通した TS ソースが変化しない（スナップショット）', () => {
    // ts.transpileModule を使い、transformer を before パイプラインに差し込む
    // program が必要な本格実装に対し、transpileModule は program なしでも動く。
    // Task 3.2 は骨格（pass-through）なので program=undefined を許容する型で呼ぶ。
    const result = ts.transpileModule(SOURCE_CODE, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2019,
        module: ts.ModuleKind.CommonJS,
      },
      transformers: {
        before: [draftoleTransformer(undefined as ts.Program)],
      },
    });

    // 出力に元ソースの識別子がそのまま現れることを確認（意味論的同等性）
    expect(result.outputText).toContain('greet');
    expect(result.outputText).toContain('"hello " + name');

    // スナップショットで無変化を保証（初回実行で .snap ファイルが生成される）
    expect(result.outputText).toMatchSnapshot();
  });

  it('transformer は ts.TransformerFactory<ts.SourceFile> を返す', () => {
    const factory = draftoleTransformer(undefined as ts.Program);
    // TransformerFactory は (context: TransformationContext) => Transformer<T> な関数
    expect(typeof factory).toBe('function');
  });

  it('transformer がオプション引数を受け取っても動作する', () => {
    const factory = draftoleTransformer(undefined as ts.Program, {
      debug: false,
    });
    expect(typeof factory).toBe('function');
  });
});
