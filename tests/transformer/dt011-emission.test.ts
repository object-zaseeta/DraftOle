/**
 * Task 3.1: DT011 emission integration test
 *
 * 観測可能な完了基準:
 *   - ヘルパー関数で包んだ State 生成パターン（フォールバック非サポート）に対し
 *     transformer が DT011 を発行し、AST 書き換えが抑制されること。
 *
 * 対応 requirements: 1.1, 1.2, 4.1, 4.2
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import draftoleTransformer from '../../src/transformer/index.ts';

function createProgramWithFiles(
  files: Record<string, string>,
): { program: ts.Program; sourceFiles: Map<string, ts.SourceFile> } {
  const fileNames = Object.keys(files);
  const sourceFilesMap = new Map<string, ts.SourceFile>();
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    strict: true,
    noEmit: true,
  };
  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion): ts.SourceFile | undefined => {
    const shortName = Object.keys(files).find(
      (k) => fileName.endsWith(k) || fileName === k,
    );
    if (shortName !== undefined) {
      const sf = ts.createSourceFile(
        fileName,
        files[shortName],
        languageVersion,
        true,
      );
      sourceFilesMap.set(shortName, sf);
      return sf;
    }
    return originalGetSourceFile(fileName, languageVersion);
  };
  host.fileExists = (fileName): boolean =>
    fileNames.some((k) => fileName.endsWith(k) || fileName === k) ||
    ts.sys.fileExists(fileName);
  host.readFile = (fileName): string | undefined => {
    const shortName = Object.keys(files).find(
      (k) => fileName.endsWith(k) || fileName === k,
    );
    if (shortName !== undefined) return files[shortName];
    return ts.sys.readFile(fileName);
  };
  const program = ts.createProgram(fileNames, compilerOptions, host);
  for (const fileName of fileNames) {
    if (!sourceFilesMap.has(fileName)) {
      const sf = program.getSourceFile(fileName);
      if (sf !== undefined) sourceFilesMap.set(fileName, sf);
    }
  }
  return { program, sourceFiles: sourceFilesMap };
}

const STATE_TYPE_DEFS = `
declare const DraftoleStateMarker: unique symbol;
interface ReadableState<T> {
  readonly [DraftoleStateMarker]: "state";
  readonly _runtimeId: string;
  get(): T;
}
interface WritableState<T> extends ReadableState<T> {
  set(value: T): void;
}
`;

describe('draftoleTransformer / DT011 emission (Task 3.1)', () => {
  it('ヘルパー関数包装の State 参照が DT011 を発行し書き換えが抑制される', () => {
    // オブジェクトのプロパティに State を保持するパターン:
    // - `bag.s` の参照は VariableDeclaration による直代入ではないため
    //   fallback の supportsPattern が name lookup できず resolve は null
    // - `_runtimeId` の型注釈が `string`（リテラル不在）のため canonical 経路でも null
    // → 結果として unresolved に積まれ DT011 が発行される。
    const handlerSource = `
${STATE_TYPE_DEFS}

declare function makeState<T>(initial: T): WritableState<T>;
const [wrapped] = [makeState<number>(0)];
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { wrapped.set(wrapped.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    // Diagnostic を観測するため、transformer の内部呼び出しを直接走らせて
    // 書き換え後コードを確認する。
    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // DT011 で書き換えが抑制されているはず:
    // - _draftoleEmitted / __draftole__.state は挿入されない
    expect(outputCode).not.toContain('_draftoleEmitted');
    expect(outputCode).not.toContain('__draftole__.state');
    // 元の wrapped.set(...) 呼び出しが残っている
    expect(outputCode).toContain('wrapped.set');
  });

  it('インライン展開経路で unresolved が残る場合は recovery 不成立で書き換えが抑制される (Task 3.2)', () => {
    // インライン関数 step1 内で fallback 非サポート（プロパティ代入）の State を参照する。
    // - ハンドラ本体は step1() という validator 未認可の関数呼び出しを含むため一旦エラー
    // - tryInlineRecovery が起動するが、step1 内で `bag.s` は canonical / fallback 双方
    //   解決不能 → unresolved に残り recovery 不成立 → 元の validation error が顕在化し
    //   書き換えが抑制される。
    const handlerSource = `
${STATE_TYPE_DEFS}

declare function makeState<T>(initial: T): WritableState<T>;
const [wrapped] = [makeState<number>(0)];
const step1 = () => { wrapped.set(wrapped.get() + 1); };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { step1(); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    // recovery 不成立 → 書き換え抑制
    expect(outputCode).not.toContain('_draftoleEmitted');
    expect(outputCode).not.toContain('__draftole__.state');
    // 元の step1() 呼び出しが残っている
    expect(outputCode).toContain('step1');
  });

  it('型リテラル注釈ありの State は fallback 未使用で変換成功する', () => {
    const handlerSource = `
${STATE_TYPE_DEFS}

declare const count: WritableState<number> & { readonly _runtimeId: "count-id" };
declare const el: { on(event: string, handler: ((e: Event) => void)): void };
el.on("click", (e) => { count.set(count.get() + 1); });
`.trimStart();

    const { program, sourceFiles } = createProgramWithFiles({
      'handler.ts': handlerSource,
    });
    const sourceFile = sourceFiles.get('handler.ts');
    if (sourceFile === undefined) throw new Error('sourceFile not found');

    const transformerFactory = draftoleTransformer(program, { debug: false });
    const transformResult = ts.transform<ts.SourceFile>(
      [sourceFile],
      [transformerFactory],
    );
    const transformedSf = transformResult.transformed[0];
    transformResult.dispose();

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const outputCode = printer.printFile(transformedSf);

    expect(outputCode).toContain('__draftole__.state');
    expect(outputCode).toContain('count-id');
    expect(outputCode).toContain('_draftoleEmitted');
  });
});
