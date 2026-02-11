import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExportableError } from './exportable-error.js';
import { RESET_CSS } from './reset-css.js';

/**
 * FileExporterのオプション
 *
 * {@link FileExporter}の動作をカスタマイズするためのオプション定義です。
 *
 * @remarks
 * 全てのプロパティはオプションで、デフォルト値が設定されています。
 *
 * @example カスタムファイル名
 * ```typescript
 * const options: FileExporterOptions = {
 *   htmlFileName: 'page.html',
 *   cssFileName: 'main.css',
 *   jsFileName: 'app.js',
 * };
 * ```
 *
 * @example reset.cssを含める
 * ```typescript
 * const options: FileExporterOptions = {
 *   includeResetCss: true, // Eric Meyer's Reset CSSを自動挿入
 * };
 * ```
 *
 * @public
 */
export interface FileExporterOptions {
  /** HTMLファイル名（デフォルト: 'index.html'） */
  readonly htmlFileName?: string;
  /** CSSファイル名（デフォルト: 'style.css'） */
  readonly cssFileName?: string;
  /** JSファイル名（デフォルト: 'script.js'） */
  readonly jsFileName?: string;
  /** reset.cssを含めるか（デフォルト: false） */
  readonly includeResetCss?: boolean;
}

/**
 * FileExporter
 *
 * HTML、CSS、JavaScriptの3ファイルを統合的に出力するエクスポーターです。
 *
 * @remarks
 * DraftOleで生成されたコンテンツを、実行可能なWebページとして出力します。
 * 以下の機能を提供します:
 *
 * ### 主要機能
 * - **自動リンク挿入**: HTMLに`<link>`と`<script>`タグを自動挿入
 * - **スマートスキップ**: 空のCSS/JSはファイル出力とタグ挿入をスキップ
 * - **reset.cssバンドル**: オプションでEric Meyer's Reset CSSを自動追加
 * - **ディレクトリ自動作成**: 出力先が存在しない場合は再帰的に作成
 * - **エラーハンドリング**: {@link ExportableError}による詳細なエラー報告
 *
 * ### ファイル出力パターン
 *
 * **通常出力** (全ファイル非空時):
 * ```
 * output/
 *   ├── index.html  (with <link> and <script> tags)
 *   ├── style.css
 *   └── script.js
 * ```
 *
 * **CSS/JS空の場合**:
 * ```
 * output/
 *   └── index.html  (タグなし)
 * ```
 *
 * @example 基本的な使用方法
 * ```typescript
 * const exporter = new FileExporter();
 * exporter.export(
 *   '<html><head></head><body>Hello</body></html>',
 *   'body { color: red; }',
 *   'console.log("Hello");',
 *   './output'
 * );
 * // → output/index.html, output/style.css, output/script.js が生成される
 * ```
 *
 * @example カスタムファイル名
 * ```typescript
 * const exporter = new FileExporter({
 *   htmlFileName: 'page.html',
 *   cssFileName: 'main.css',
 *   jsFileName: 'app.js',
 * });
 * exporter.export(html, css, js, './dist');
 * // → dist/page.html, dist/main.css, dist/app.js
 * ```
 *
 * @example reset.cssを含める
 * ```typescript
 * const exporter = new FileExporter({
 *   includeResetCss: true,
 * });
 * exporter.export(html, css, js, './output');
 * // → style.css の先頭にreset.cssが自動追加される
 * ```
 *
 * @example エラーハンドリング
 * ```typescript
 * const exporter = new FileExporter();
 * try {
 *   exporter.export(html, css, js, '');
 * } catch (error) {
 *   if (error instanceof ExportableError) {
 *     console.error(`Error [${error.code}]: ${error.message}`);
 *     console.error(`File path: ${error.filePath}`);
 *   }
 * }
 * ```
 *
 * @example 空のCSS/JSをスキップ
 * ```typescript
 * const exporter = new FileExporter();
 * exporter.export(
 *   '<html><head></head><body>Static page</body></html>',
 *   '', // 空のCSS
 *   '', // 空のJS
 *   './output'
 * );
 * // → output/index.html のみ生成（<link>/<script>タグなし）
 * ```
 *
 * @public
 */
export class FileExporter {
  private readonly htmlFileName: string;
  private readonly cssFileName: string;
  private readonly jsFileName: string;
  private readonly includeResetCss: boolean;

  constructor(options?: FileExporterOptions) {
    this.htmlFileName = options?.htmlFileName ?? 'index.html';
    this.cssFileName = options?.cssFileName ?? 'style.css';
    this.jsFileName = options?.jsFileName ?? 'script.js';
    this.includeResetCss = options?.includeResetCss ?? false;
  }

  /**
   * HTML、CSS、JSを統合出力する
   *
   * DraftOleで生成されたコンテンツを、実行可能なWebページとして出力します。
   *
   * @param htmlContent - HTML内容（完全なHTML文書）
   * @param cssContent - CSS内容（空文字列の場合はスキップ）
   * @param jsContent - JS内容（空文字列の場合はスキップ）
   * @param outputPath - 出力先ディレクトリパス（存在しない場合は自動作成）
   *
   * @throws {@link ExportableError}
   * - `invalidPath`: outputPathが空文字列または無効
   * - `writeFailed`: ディレクトリ作成またはファイル書き込み失敗
   *
   * @remarks
   * ### 処理フロー
   * 1. 出力パスの検証
   * 2. ディレクトリの作成（存在しない場合）
   * 3. CSS処理（reset.css挿入判定）
   * 4. HTMLにタグ挿入（CSS/JS非空時）
   * 5. ファイル書き込み
   *
   * ### タグ挿入位置
   * - `<link>`: `</head>`タグの直前
   * - `<script>`: `</body>`タグの直前
   *
   * ### ファイル出力条件
   * - **HTML**: 常に出力
   * - **CSS**: `cssContent.trim().length > 0` または `includeResetCss === true`
   * - **JS**: `jsContent.trim().length > 0`
   *
   * @example 完全な出力
   * ```typescript
   * const exporter = new FileExporter();
   * exporter.export(
   *   '<!DOCTYPE html><html><head></head><body><h1>Hello</h1></body></html>',
   *   'h1 { color: blue; }',
   *   'console.log("Loaded");',
   *   './output'
   * );
   * ```
   *
   * @example HTMLのみ（静的ページ）
   * ```typescript
   * const exporter = new FileExporter();
   * exporter.export(
   *   '<!DOCTYPE html><html><head></head><body><h1>Static</h1></body></html>',
   *   '', // CSS空
   *   '', // JS空
   *   './output'
   * );
   * // → index.htmlのみ生成、<link>/<script>タグなし
   * ```
   *
   * @example エラーハンドリング
   * ```typescript
   * const exporter = new FileExporter();
   * try {
   *   exporter.export(html, css, js, '/invalid/readonly/path');
   * } catch (error) {
   *   if (error instanceof ExportableError) {
   *     if (error.code === 'writeFailed') {
   *       console.error('Failed to write files:', error.message);
   *       console.error('Path:', error.filePath);
   *     }
   *   }
   * }
   * ```
   *
   * @example ネストされたディレクトリ
   * ```typescript
   * const exporter = new FileExporter();
   * exporter.export(html, css, js, './output/nested/deep/directory');
   * // → ディレクトリが自動的に再帰作成される
   * ```
   *
   * @public
   */
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
    const hasJs = jsContent.trim().length > 0;

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
          jsContent,
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
