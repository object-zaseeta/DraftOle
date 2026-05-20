/**
 * draftole-transformer 由来の TypeScript Diagnostic を 1 件 1 行のフラット形式に整形する。
 *
 * 形式:
 *   - file + start 有り: `[draftole-transformer <Category>] <fileName>:<line>:<col> <message>\n`
 *   - それ以外         : `[draftole-transformer <Category>] <message>\n`
 *
 * 行・列は 1-origin、message は `DiagnosticMessageChain` の場合 top-level のみ採用する。
 *
 * 本モジュールは副作用を持たず、文字列の整形のみを行う純関数群。
 * 書き出し先（stderr / 集約配列等）の選択は呼び出し側の責務。
 *
 * Requirements: TXDX-1（transformer 診断の silent drop 解消）
 *
 * @module transformer/format-diagnostics
 */
import ts from 'typescript';

/**
 * 単一の Diagnostic を 1 行のテキストに整形する（改行を含む）。
 */
export function formatTransformerDiagnostic(diag: ts.Diagnostic): string {
  const category = ts.DiagnosticCategory[diag.category];
  const message =
    typeof diag.messageText === 'string'
      ? diag.messageText
      : diag.messageText.messageText;
  if (diag.file !== undefined && diag.start !== undefined) {
    const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
    return `[draftole-transformer ${category}] ${diag.file.fileName}:${line + 1}:${character + 1} ${message}\n`;
  }
  return `[draftole-transformer ${category}] ${message}\n`;
}

/**
 * Diagnostic 配列を整形して与えられた `WritableStream` に書き出す。
 * 空配列の場合は何もしない。
 */
export function writeTransformerDiagnostics(
  diags: readonly ts.Diagnostic[],
  stream: NodeJS.WritableStream,
): void {
  if (diags.length === 0) return;
  for (const d of diags) {
    stream.write(formatTransformerDiagnostic(d));
  }
}
