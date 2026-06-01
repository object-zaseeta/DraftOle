import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExportableError } from './errors/ExportableError.js';
import { RESET_CSS } from './reset-css.js';
import { wrapDOMReady } from './dom-ready.js';


export interface FileExporterOptions {
  readonly htmlFileName?: string;
  readonly cssFileName?: string;
  readonly jsFileName?: string;
  readonly includeResetCss?: boolean;
  readonly wrapDOMReady?: boolean;
}


export class FileExporter {
  private readonly htmlFileName: string;
  private readonly cssFileName: string;
  private readonly jsFileName: string;
  private readonly includeResetCss: boolean;
  private readonly _wrapDOMReady: boolean;

  constructor(options?: FileExporterOptions) {
    this.htmlFileName = options?.htmlFileName ?? 'index.html';
    this.cssFileName = options?.cssFileName ?? 'style.css';
    this.jsFileName = options?.jsFileName ?? 'script.js';
    this.includeResetCss = options?.includeResetCss ?? false;
    this._wrapDOMReady = options?.wrapDOMReady ?? false;
  }

  export(
    htmlContent: string,
    cssContent: string,
    jsContent: string,
    outputPath: string,
  ): void {
    // 出力パスの検証
    if (!outputPath || outputPath.trim().length === 0) {
      throw new ExportableError(
        'invalidPath',
        outputPath,
        'Output path must not be empty',
      );
    }

    // ディレクトリの作成（存在しない場合は再帰的に作成）
    try {
      mkdirSync(outputPath, { recursive: true });
    } catch (error) {
      throw new ExportableError(
        'writeFailed',
        outputPath,
        `Failed to create directory: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // CSS処理
    let finalCssContent = cssContent;
    let hasCss = cssContent.trim().length > 0;

    // reset.cssのバンドル
    if (this.includeResetCss) {
      finalCssContent = hasCss
        ? RESET_CSS + '\n\n' + cssContent
        : RESET_CSS;
      hasCss = true;
    }

    // JS処理
    const finalJsContent = this._wrapDOMReady ? wrapDOMReady(jsContent) : jsContent;
    const hasJs = finalJsContent.trim().length > 0;

    // HTMLにタグを挿入
    let finalHtmlContent = htmlContent;

    // <link>タグの挿入（CSS非空時）
    if (hasCss) {
      const headEndIndex = finalHtmlContent.indexOf('</head>');
      if (headEndIndex !== -1) {
        const linkTag = `<link rel="stylesheet" href="${this.cssFileName}">`;
        finalHtmlContent =
          finalHtmlContent.slice(0, headEndIndex) +
          linkTag +
          '\n' +
          finalHtmlContent.slice(headEndIndex);
      }
    }

    // <script>タグの挿入（JS非空時）
    if (hasJs) {
      const bodyEndIndex = finalHtmlContent.indexOf('</body>');
      if (bodyEndIndex !== -1) {
        const scriptTag = `<script defer src="${this.jsFileName}"></script>`;
        finalHtmlContent =
          finalHtmlContent.slice(0, bodyEndIndex) +
          scriptTag +
          '\n' +
          finalHtmlContent.slice(bodyEndIndex);
      }
    }

    // ファイル書き込み
    try {
      // HTMLファイル出力
      writeFileSync(
        join(outputPath, this.htmlFileName),
        finalHtmlContent,
        'utf-8',
      );

      // CSSファイル出力（非空時のみ）
      if (hasCss) {
        writeFileSync(
          join(outputPath, this.cssFileName),
          finalCssContent,
          'utf-8',
        );
      }

      // JSファイル出力（非空時のみ）
      if (hasJs) {
        writeFileSync(
          join(outputPath, this.jsFileName),
          finalJsContent,
          'utf-8',
        );
      }
    } catch (error) {
      throw new ExportableError(
        'writeFailed',
        outputPath,
        `Failed to write files: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
