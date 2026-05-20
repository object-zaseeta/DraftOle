/**
 * TXDX-1: format-diagnostics の単体テスト
 *
 * `formatTransformerDiagnostic` と `writeTransformerDiagnostics` が
 * `[draftole-transformer <Category>] <fileName>:<line>:<col> <message>\n` 形式の
 * 1 行フォーマットを返すことを検証する。
 *
 * Requirements: TXDX-1（silent drop 解消・shared formatter）
 */
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  formatTransformerDiagnostic,
  writeTransformerDiagnostics,
} from '../../src/transformer/format-diagnostics.js';

function makeDiagnostic(
  category: ts.DiagnosticCategory,
  messageText: string,
  options?: {
    file?: ts.SourceFile;
    start?: number;
    length?: number;
  },
): ts.Diagnostic {
  return {
    file: options?.file,
    start: options?.start,
    length: options?.length ?? 0,
    messageText,
    category,
    code: 9999,
  };
}

describe('formatTransformerDiagnostic', () => {
  it('file + start 有り → `[draftole-transformer Error] <file>:<line>:<col> <message>\\n`', () => {
    const file = ts.createSourceFile(
      'foo/bar.ts',
      'const x = 1;\nconst y = 2;\n',
      ts.ScriptTarget.ES2019,
      true,
    );
    const diag = makeDiagnostic(ts.DiagnosticCategory.Error, 'arrow handler rejected', {
      file,
      start: file.getPositionOfLineAndCharacter(1, 6),
    });
    const out = formatTransformerDiagnostic(diag);
    // line/col は 1-origin
    expect(out).toBe('[draftole-transformer Error] foo/bar.ts:2:7 arrow handler rejected\n');
  });

  it('file 無し → `[draftole-transformer Warning] <message>\\n`', () => {
    const diag = makeDiagnostic(ts.DiagnosticCategory.Warning, 'no source location');
    expect(formatTransformerDiagnostic(diag)).toBe(
      '[draftole-transformer Warning] no source location\n',
    );
  });

  it('DiagnosticMessageChain の場合 top-level messageText のみ採用', () => {
    const chain: ts.DiagnosticMessageChain = {
      messageText: 'top message',
      category: ts.DiagnosticCategory.Suggestion,
      code: 1,
      next: [{ messageText: 'nested (ignored)', category: ts.DiagnosticCategory.Suggestion, code: 2 }],
    };
    const diag: ts.Diagnostic = {
      file: undefined,
      start: undefined,
      length: 0,
      messageText: chain,
      category: ts.DiagnosticCategory.Suggestion,
      code: 1,
    };
    expect(formatTransformerDiagnostic(diag)).toBe(
      '[draftole-transformer Suggestion] top message\n',
    );
  });

  it('Category Error/Warning/Suggestion/Message が正しくラベル化される', () => {
    expect(formatTransformerDiagnostic(makeDiagnostic(ts.DiagnosticCategory.Error, 'e'))).toContain('Error');
    expect(formatTransformerDiagnostic(makeDiagnostic(ts.DiagnosticCategory.Warning, 'w'))).toContain('Warning');
    expect(formatTransformerDiagnostic(makeDiagnostic(ts.DiagnosticCategory.Suggestion, 's'))).toContain('Suggestion');
    expect(formatTransformerDiagnostic(makeDiagnostic(ts.DiagnosticCategory.Message, 'm'))).toContain('Message');
  });
});

describe('writeTransformerDiagnostics', () => {
  function makeBufferStream(): {
    stream: NodeJS.WritableStream;
    buffer: string[];
  } {
    const buffer: string[] = [];
    const stream = {
      write(chunk: string | Uint8Array): boolean {
        buffer.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
        return true;
      },
    } as unknown as NodeJS.WritableStream;
    return { stream, buffer };
  }

  it('空配列 → stream に何も書かない', () => {
    const { stream, buffer } = makeBufferStream();
    writeTransformerDiagnostics([], stream);
    expect(buffer).toEqual([]);
  });

  it('複数 diagnostic → 1 件 1 行で連続書き出し', () => {
    const { stream, buffer } = makeBufferStream();
    writeTransformerDiagnostics(
      [
        makeDiagnostic(ts.DiagnosticCategory.Error, 'first'),
        makeDiagnostic(ts.DiagnosticCategory.Warning, 'second'),
      ],
      stream,
    );
    expect(buffer).toEqual([
      '[draftole-transformer Error] first\n',
      '[draftole-transformer Warning] second\n',
    ]);
  });
});
