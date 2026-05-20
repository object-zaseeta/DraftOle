import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Root } from '../html/elements/root.js';
import { ExportableError } from '../publisher/exportable-error.js';
import { errorToString } from '../utils/errors.js';

/**
 * 静的ページ書き出しのオプション。
 *
 * design.md §6.3 で定義された `StaticExportOptions` インターフェース。
 *
 * - `htmlFileName`: 出力 HTML ファイル名（デフォルト: `'index.html'`）
 * - `cssFileName`: 出力 CSS ファイル名（デフォルト: `'style.css'`）。`inlineCss=false` のときのみ使用
 * - `inlineCss`: CSS を `<style>` タグとして HTML 内に埋め込むか（デフォルト: `true`）
 *
 * @public
 */
export interface StaticExportOptions {
  readonly htmlFileName?: string;
  readonly cssFileName?: string;
  readonly inlineCss?: boolean;
}

/**
 * 静的ページ書き出し専用の Writer。
 *
 * `Root.render()` と `Root.collectCssStyleString()` のみを使用し、
 * runtime prelude / `Root.renderJs()` / `Root.renderVanillaScript()` /
 * `FileExporter` のいずれにも依存しない。JS ファイル（`runtime.js`,
 * `app.js`, `script.js` など）は一切生成しない。
 *
 * design.md §6.4 のサービス契約に対応する。
 *
 * @public
 */
export class StaticPageWriter {
  /**
   * `root` を `outputPath` 配下に静的ファイルとして書き出す。
   *
   * - デフォルト（`inlineCss=true`）では `index.html` のみ出力し、
   *   CSS を `<style>` タグとして `</head>` 直前に埋め込む。
   * - `inlineCss=false` のときは `index.html` と `style.css` を出力し、
   *   `<link rel="stylesheet">` を `</head>` 直前に挿入する。
   * - CSS が空文字列の場合は CSS 関連の出力・挿入を完全にスキップする。
   *
   * @param root - 静的検証済みの {@link Root}
   * @param outputPath - 出力先ディレクトリパス
   * @param options - 書き出しオプション
   *
   * @throws {@link ExportableError}
   * - `invalidPath`: `outputPath` が空文字列
   * - `writeFailed`: ディレクトリ作成またはファイル書き込みに失敗
   */
  write(root: Root, outputPath: string, options?: StaticExportOptions): void {
    if (outputPath.length === 0) {
      throw new ExportableError(
        'invalidPath',
        outputPath,
        'Output path must not be empty',
      );
    }

    const htmlFileName = options?.htmlFileName ?? 'index.html';
    const cssFileName = options?.cssFileName ?? 'style.css';
    const inlineCss = options?.inlineCss ?? true;

    // Root からは render() / collectCssStyleString() のみを呼ぶ。
    // renderJs() / renderVanillaScript() / collectJsContent() / export() には依存しない。
    const htmlContent = root.render();
    const cssContent = root.collectCssStyleString();
    const hasCss = cssContent.trim().length > 0;

    // ディレクトリを作成（存在しない場合は再帰的に）
    try {
      mkdirSync(outputPath, { recursive: true });
    } catch (error) {
      throw new ExportableError(
        'writeFailed',
        outputPath,
        `Failed to create directory: ${errorToString(error)}`,
      );
    }

    // HTML へ CSS を埋め込む / link を挿入する
    let finalHtml = htmlContent;
    if (hasCss) {
      const headEndIndex = finalHtml.indexOf('</head>');
      if (headEndIndex !== -1) {
        const insertion = inlineCss
          ? `<style>\n${cssContent}\n</style>\n`
          : `<link rel="stylesheet" href="${cssFileName}">\n`;
        finalHtml =
          finalHtml.slice(0, headEndIndex) +
          insertion +
          finalHtml.slice(headEndIndex);
      }
    }

    try {
      writeFileSync(join(outputPath, htmlFileName), finalHtml, 'utf-8');
      if (hasCss && !inlineCss) {
        writeFileSync(join(outputPath, cssFileName), cssContent, 'utf-8');
      }
    } catch (error) {
      throw new ExportableError(
        'writeFailed',
        outputPath,
        `Failed to write files: ${errorToString(error)}`,
      );
    }
  }
}
