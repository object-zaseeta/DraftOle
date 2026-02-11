import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { FileExporter } from '../../src/publisher/file-exporter.js';
import { ExportableError } from '../../src/publisher/exportable-error.js';

describe('FileExporter', () => {
  const testOutputDir = join(process.cwd(), 'tmp-test-output');

  beforeEach(() => {
    // テスト用ディレクトリをクリーンアップ
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('基本的な3ファイル出力', () => {
    it('HTML、CSS、JSの3ファイルを出力する', () => {
      const exporter = new FileExporter();
      const htmlContent = '<html><head></head><body></body></html>';
      const cssContent = 'body { margin: 0; }';
      const jsContent = 'console.log("test");';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      // 3ファイルが存在することを確認
      expect(existsSync(join(testOutputDir, 'index.html'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'style.css'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'script.js'))).toBe(true);

      // ファイル内容を確認
      const htmlOutput = readFileSync(
        join(testOutputDir, 'index.html'),
        'utf-8',
      );
      const cssOutput = readFileSync(join(testOutputDir, 'style.css'), 'utf-8');
      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');

      expect(cssOutput).toBe(cssContent);
      expect(jsOutput).toBe(jsContent);

      // HTMLに<link>と<script>タグが挿入されていることを確認
      expect(htmlOutput).toContain('<link rel="stylesheet" href="style.css">');
      expect(htmlOutput).toContain('<script defer src="script.js"></script>');
    });

    it('カスタムファイル名を使用できる', () => {
      const exporter = new FileExporter({
        htmlFileName: 'page.html',
        cssFileName: 'main.css',
        jsFileName: 'app.js',
      });

      const htmlContent = '<html><head></head><body></body></html>';
      const cssContent = 'body { margin: 0; }';
      const jsContent = 'console.log("test");';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      expect(existsSync(join(testOutputDir, 'page.html'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'main.css'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'app.js'))).toBe(true);

      const htmlOutput = readFileSync(join(testOutputDir, 'page.html'), 'utf-8');
      expect(htmlOutput).toContain('<link rel="stylesheet" href="main.css">');
      expect(htmlOutput).toContain('<script defer src="app.js"></script>');
    });
  });

  describe('タグ挿入', () => {
    it('<link>タグを</head>直前に挿入する', () => {
      const exporter = new FileExporter();
      const htmlContent = '<html><head><title>Test</title></head><body></body></html>';
      const cssContent = 'body { margin: 0; }';
      const jsContent = '';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      const htmlOutput = readFileSync(
        join(testOutputDir, 'index.html'),
        'utf-8',
      );

      // </head>の直前に挿入されていることを確認
      expect(htmlOutput).toMatch(
        /<link rel="stylesheet" href="style\.css">\s*<\/head>/,
      );
    });

    it('<script>タグを</body>直前に挿入する', () => {
      const exporter = new FileExporter();
      const htmlContent =
        '<html><head></head><body><div>Content</div></body></html>';
      const cssContent = '';
      const jsContent = 'console.log("test");';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      const htmlOutput = readFileSync(
        join(testOutputDir, 'index.html'),
        'utf-8',
      );

      // </body>の直前に挿入されていることを確認
      expect(htmlOutput).toMatch(
        /<script defer src="script\.js"><\/script>\s*<\/body>/,
      );
    });
  });

  describe('空コンテンツのスキップ', () => {
    it('CSS空の場合、CSSファイルとlinkタグをスキップする', () => {
      const exporter = new FileExporter();
      const htmlContent = '<html><head></head><body></body></html>';
      const cssContent = '';
      const jsContent = 'console.log("test");';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      expect(existsSync(join(testOutputDir, 'index.html'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'style.css'))).toBe(false);
      expect(existsSync(join(testOutputDir, 'script.js'))).toBe(true);

      const htmlOutput = readFileSync(
        join(testOutputDir, 'index.html'),
        'utf-8',
      );
      expect(htmlOutput).not.toContain('<link rel="stylesheet"');
      expect(htmlOutput).toContain('<script defer src="script.js"></script>');
    });

    it('JS空の場合、JSファイルとscriptタグをスキップする', () => {
      const exporter = new FileExporter();
      const htmlContent = '<html><head></head><body></body></html>';
      const cssContent = 'body { margin: 0; }';
      const jsContent = '';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      expect(existsSync(join(testOutputDir, 'index.html'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'style.css'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'script.js'))).toBe(false);

      const htmlOutput = readFileSync(
        join(testOutputDir, 'index.html'),
        'utf-8',
      );
      expect(htmlOutput).toContain('<link rel="stylesheet" href="style.css">');
      expect(htmlOutput).not.toContain('<script');
    });

    it('CSS・JS両方空の場合、HTMLのみ出力する', () => {
      const exporter = new FileExporter();
      const htmlContent = '<html><head></head><body></body></html>';
      const cssContent = '';
      const jsContent = '';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      expect(existsSync(join(testOutputDir, 'index.html'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'style.css'))).toBe(false);
      expect(existsSync(join(testOutputDir, 'script.js'))).toBe(false);

      const htmlOutput = readFileSync(
        join(testOutputDir, 'index.html'),
        'utf-8',
      );
      expect(htmlOutput).not.toContain('<link');
      expect(htmlOutput).not.toContain('<script');
    });
  });

  describe('reset.cssバンドル', () => {
    it('includeResetCss: trueの場合、reset.cssをCSS先頭に追加する', () => {
      const exporter = new FileExporter({ includeResetCss: true });
      const htmlContent = '<html><head></head><body></body></html>';
      const cssContent = 'body { margin: 0; }';
      const jsContent = '';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      const cssOutput = readFileSync(join(testOutputDir, 'style.css'), 'utf-8');

      // reset.cssが先頭にあることを確認
      expect(cssOutput).toMatch(/^\/\* Reset CSS \*\//);
      expect(cssOutput).toContain('body { margin: 0; }');
      // reset.cssの後にカスタムCSSが続くことを確認
      const resetIndex = cssOutput.indexOf('/* Reset CSS */');
      const customIndex = cssOutput.indexOf('body { margin: 0; }');
      expect(resetIndex).toBeLessThan(customIndex);
    });

    it('includeResetCss: falseの場合、reset.cssを含めない（デフォルト）', () => {
      const exporter = new FileExporter({ includeResetCss: false });
      const htmlContent = '<html><head></head><body></body></html>';
      const cssContent = 'body { margin: 0; }';
      const jsContent = '';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      const cssOutput = readFileSync(join(testOutputDir, 'style.css'), 'utf-8');

      expect(cssOutput).not.toContain('/* Reset CSS */');
      expect(cssOutput).toBe('body { margin: 0; }');
    });

    it('CSS空 + includeResetCss: trueの場合、reset.cssのみ出力する', () => {
      const exporter = new FileExporter({ includeResetCss: true });
      const htmlContent = '<html><head></head><body></body></html>';
      const cssContent = '';
      const jsContent = '';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      // reset.cssがあるのでCSSファイルは出力される
      expect(existsSync(join(testOutputDir, 'style.css'))).toBe(true);

      const cssOutput = readFileSync(join(testOutputDir, 'style.css'), 'utf-8');
      expect(cssOutput).toMatch(/^\/\* Reset CSS \*\//);

      const htmlOutput = readFileSync(
        join(testOutputDir, 'index.html'),
        'utf-8',
      );
      expect(htmlOutput).toContain('<link rel="stylesheet" href="style.css">');
    });
  });

  describe('ディレクトリ自動作成', () => {
    it('出力先ディレクトリが存在しない場合、再帰的に作成する', () => {
      const exporter = new FileExporter();
      const nestedDir = join(testOutputDir, 'nested', 'deep', 'path');
      const htmlContent = '<html><head></head><body></body></html>';

      expect(existsSync(nestedDir)).toBe(false);

      exporter.export(htmlContent, '', '', nestedDir);

      expect(existsSync(nestedDir)).toBe(true);
      expect(existsSync(join(nestedDir, 'index.html'))).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な出力パス（空文字列）でExportableErrorをスローする', () => {
      const exporter = new FileExporter();
      const htmlContent = '<html><head></head><body></body></html>';

      expect(() => {
        exporter.export(htmlContent, '', '', '');
      }).toThrow(ExportableError);

      try {
        exporter.export(htmlContent, '', '', '');
      } catch (error) {
        expect(error).toBeInstanceOf(ExportableError);
        const exportError = error as ExportableError;
        expect(exportError.code).toBe('invalidPath');
      }
    });

    it('書き込み失敗時にExportableErrorをスローする', () => {
      const exporter = new FileExporter();
      const htmlContent = '<html><head></head><body></body></html>';
      // 書き込み不可能なパス（存在しないドライブ等）
      const invalidPath = '/invalid/path/that/does/not/exist';

      // ディレクトリ作成が失敗する場合
      expect(() => {
        exporter.export(htmlContent, '', '', invalidPath);
      }).toThrow(ExportableError);
    });
  });

  describe('UTF-8エンコーディング', () => {
    it('UTF-8文字を正しく出力する', () => {
      const exporter = new FileExporter();
      const htmlContent = '<html><head></head><body>日本語テスト 🎉</body></html>';
      const cssContent = '/* 日本語コメント */\nbody { color: red; }';
      const jsContent = '// 日本語コメント\nconsole.log("こんにちは");';

      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      const htmlOutput = readFileSync(
        join(testOutputDir, 'index.html'),
        'utf-8',
      );
      const cssOutput = readFileSync(join(testOutputDir, 'style.css'), 'utf-8');
      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');

      expect(htmlOutput).toContain('日本語テスト 🎉');
      expect(cssOutput).toContain('日本語コメント');
      expect(jsOutput).toContain('こんにちは');
    });
  });
});
