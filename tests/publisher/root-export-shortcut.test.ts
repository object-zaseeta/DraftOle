/**
 * Task 7.2: Root.export ショートカットのテスト
 *
 * Req 7.1: root.export(path) が new FileExporter().exportFromRoot(root, path) と同一出力を生成する
 * Req 7.2: FileExporter と同じオプションを受け付け適用する
 * Req 7.3: FileExporter クラスが引き続き利用可能である
 * Req 7.4: エラー時に FileExporter と同じエラー型がスローされる
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Root } from '../../src/html/elements/root.js';
import { FileExporter } from '../../src/publisher/file-exporter.js';
import { ExportableError } from '../../src/publisher/exportable-error.js';
import { html, head, title, body, h1, p } from '../../src/html/index.js';
import { rule } from '../../src/css/variables/global-dsl.js';

// テスト用の一意なベースディレクトリ
const BASE_TMP = join(tmpdir(), `draftole-root-export-test-${process.pid}`);

/** テスト用 Root を生成するヘルパー */
function buildTestRoot(): Root {
  const root = new Root();
  root.addChild(
    html(
      head(title('テストページ')),
      body(
        h1('Hello World'),
        p('本文テキスト'),
      ),
    ),
  );
  return root;
}

describe('Root.export ショートカット (Req 7.1〜7.4)', () => {
  let shortcutDir: string;
  let explicitDir: string;

  beforeEach(() => {
    // 各テストに固有のサブディレクトリを用意
    const id = String(Date.now());
    shortcutDir = join(BASE_TMP, id, 'shortcut');
    explicitDir = join(BASE_TMP, id, 'explicit');
    mkdirSync(shortcutDir, { recursive: true });
    mkdirSync(explicitDir, { recursive: true });
  });

  afterEach(() => {
    // ベースディレクトリごとクリーンアップ
    if (existsSync(BASE_TMP)) {
      rmSync(BASE_TMP, { recursive: true, force: true });
    }
  });

  // ──────────────────────────────────────────────
  // Req 7.1: root.export(path) と FileExporter().exportFromRoot(root, path) が同一出力
  // ──────────────────────────────────────────────
  describe('Req 7.1: FileExporter と同一のファイル出力を生成する', () => {
    it('index.html を出力し、FileExporter 経由の内容と一致する', () => {
      const root1 = buildTestRoot();
      const root2 = buildTestRoot();

      // ショートカット
      root1.export(shortcutDir);

      // 明示的 FileExporter
      new FileExporter().exportFromRoot(root2, explicitDir);

      // 両方 index.html が存在する
      expect(existsSync(join(shortcutDir, 'index.html'))).toBe(true);
      expect(existsSync(join(explicitDir, 'index.html'))).toBe(true);

      // 内容が一致する
      const shortcutHtml = readFileSync(join(shortcutDir, 'index.html'), 'utf-8');
      const explicitHtml = readFileSync(join(explicitDir, 'index.html'), 'utf-8');
      expect(shortcutHtml).toBe(explicitHtml);
    });

    it('CSS コンテンツがあるとき style.css を出力し内容が一致する', () => {
      // CSS を含む Root を直接構築
      const cssRules = [rule('body', { margin: '0' })];
      const root1 = new Root({ css: cssRules });
      root1.addChild(
        html(head(title('テストページ')), body(h1('Hello World'), p('本文テキスト'))),
      );
      const root2 = new Root({ css: cssRules });
      root2.addChild(
        html(head(title('テストページ')), body(h1('Hello World'), p('本文テキスト'))),
      );

      root1.export(shortcutDir);
      new FileExporter().exportFromRoot(root2, explicitDir);

      expect(existsSync(join(shortcutDir, 'style.css'))).toBe(true);
      expect(existsSync(join(explicitDir, 'style.css'))).toBe(true);

      const shortcutCss = readFileSync(join(shortcutDir, 'style.css'), 'utf-8');
      const explicitCss = readFileSync(join(explicitDir, 'style.css'), 'utf-8');
      expect(shortcutCss).toBe(explicitCss);
    });

    it('出力先ディレクトリが存在しない場合でも自動作成してファイルを書き込む', () => {
      const root = buildTestRoot();
      const newDir = join(BASE_TMP, 'auto-create', 'nested');

      expect(existsSync(newDir)).toBe(false);
      root.export(newDir);
      expect(existsSync(join(newDir, 'index.html'))).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // Req 7.2: FileExporter と同じオプションを受け付け適用する
  // ──────────────────────────────────────────────
  describe('Req 7.2: オプションを受け付け適用する', () => {
    it('カスタムファイル名オプションが FileExporter と同一の出力を生成する', () => {
      const opts = { htmlFileName: 'page.html', cssFileName: 'main.css', jsFileName: 'app.js' };

      const cssRules = [rule('body', { color: 'red' })];
      const root1 = new Root({ css: cssRules });
      root1.addChild(
        html(head(title('テストページ')), body(h1('Hello World'), p('本文テキスト'))),
      );
      const root2 = new Root({ css: cssRules });
      root2.addChild(
        html(head(title('テストページ')), body(h1('Hello World'), p('本文テキスト'))),
      );

      root1.export(shortcutDir, opts);
      new FileExporter(opts).exportFromRoot(root2, explicitDir);

      // カスタム名ファイルが存在する
      expect(existsSync(join(shortcutDir, 'page.html'))).toBe(true);
      expect(existsSync(join(shortcutDir, 'main.css'))).toBe(true);

      // 内容が一致する
      const shortcutHtml = readFileSync(join(shortcutDir, 'page.html'), 'utf-8');
      const explicitHtml = readFileSync(join(explicitDir, 'page.html'), 'utf-8');
      expect(shortcutHtml).toBe(explicitHtml);

      const shortcutCss = readFileSync(join(shortcutDir, 'main.css'), 'utf-8');
      const explicitCss = readFileSync(join(explicitDir, 'main.css'), 'utf-8');
      expect(shortcutCss).toBe(explicitCss);

      // HTML 内のリンクがカスタム名を参照している
      expect(shortcutHtml).toContain('<link rel="stylesheet" href="main.css">');
    });

    it('includeResetCss: true オプションが FileExporter と同一の CSS を生成する', () => {
      const opts = { includeResetCss: true };

      const cssRules = [rule('body', { fontSize: '16px' })];
      const root1 = new Root({ css: cssRules });
      root1.addChild(
        html(head(title('テストページ')), body(h1('Hello World'), p('本文テキスト'))),
      );
      const root2 = new Root({ css: cssRules });
      root2.addChild(
        html(head(title('テストページ')), body(h1('Hello World'), p('本文テキスト'))),
      );

      root1.export(shortcutDir, opts);
      new FileExporter(opts).exportFromRoot(root2, explicitDir);

      const shortcutCss = readFileSync(join(shortcutDir, 'style.css'), 'utf-8');
      const explicitCss = readFileSync(join(explicitDir, 'style.css'), 'utf-8');

      // reset.css が先頭に含まれる
      expect(shortcutCss).toMatch(/^\/\* Reset CSS \*\//);
      // ショートカットと明示的呼び出しが一致する
      expect(shortcutCss).toBe(explicitCss);
    });

    it('オプション省略時はデフォルト値（index.html / style.css / script.js）が使われる', () => {
      const root = new Root({ css: [rule('p', { color: 'blue' })] });
      root.addChild(
        html(head(title('テストページ')), body(h1('Hello World'), p('本文テキスト'))),
      );

      root.export(shortcutDir);

      expect(existsSync(join(shortcutDir, 'index.html'))).toBe(true);
      expect(existsSync(join(shortcutDir, 'style.css'))).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // Req 7.3: FileExporter クラスが引き続き利用可能
  // ──────────────────────────────────────────────
  describe('Req 7.3: FileExporter クラスが引き続き利用可能', () => {
    it('FileExporter をインポートして直接インスタンス化できる', () => {
      expect(FileExporter).toBeDefined();
      const exporter = new FileExporter();
      expect(exporter).toBeInstanceOf(FileExporter);
    });

    it('FileExporter.exportFromRoot が呼び出し可能で正常に動作する', () => {
      const root = buildTestRoot();
      const exporter = new FileExporter();

      exporter.exportFromRoot(root, explicitDir);

      expect(existsSync(join(explicitDir, 'index.html'))).toBe(true);
    });

    it('FileExporter.export が呼び出し可能で正常に動作する', () => {
      const exporter = new FileExporter();
      const htmlContent = '<html><head></head><body><p>test</p></body></html>';

      exporter.export(htmlContent, '', '', explicitDir);

      expect(existsSync(join(explicitDir, 'index.html'))).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // Req 7.4: エラー時に FileExporter と同じエラー型がスローされる
  // ──────────────────────────────────────────────
  describe('Req 7.4: エラー時に FileExporter と同じエラー型がスローされる', () => {
    it('空文字列パスで ExportableError をスローする', () => {
      const root = buildTestRoot();

      expect(() => {
        root.export('');
      }).toThrow(ExportableError);
    });

    it('空文字列パスで FileExporter と同じ error.code をスローする', () => {
      const root1 = buildTestRoot();
      const root2 = buildTestRoot();

      let shortcutError: ExportableError | undefined;
      let explicitError: ExportableError | undefined;

      try {
        root1.export('');
      } catch (e) {
        if (e instanceof ExportableError) shortcutError = e;
      }

      try {
        new FileExporter().exportFromRoot(root2, '');
      } catch (e) {
        if (e instanceof ExportableError) explicitError = e;
      }

      expect(shortcutError).toBeDefined();
      expect(explicitError).toBeDefined();
      expect(shortcutError!.code).toBe(explicitError!.code);
      expect(shortcutError!.code).toBe('invalidPath');
    });

    it('書き込み不可パスで ExportableError をスローする', () => {
      const root = buildTestRoot();
      // 実際には存在しない深いパスへの書き込みを試みる
      const invalidPath = '/invalid/path/that/does/not/exist';

      expect(() => {
        root.export(invalidPath);
      }).toThrow(ExportableError);
    });

    it('書き込み不可パスで FileExporter と同じ error.code をスローする', () => {
      const root1 = buildTestRoot();
      const root2 = buildTestRoot();
      const invalidPath = '/invalid/path/that/does/not/exist';

      let shortcutError: ExportableError | undefined;
      let explicitError: ExportableError | undefined;

      try {
        root1.export(invalidPath);
      } catch (e) {
        if (e instanceof ExportableError) shortcutError = e;
      }

      try {
        new FileExporter().exportFromRoot(root2, invalidPath);
      } catch (e) {
        if (e instanceof ExportableError) explicitError = e;
      }

      expect(shortcutError).toBeDefined();
      expect(explicitError).toBeDefined();
      expect(shortcutError!.code).toBe(explicitError!.code);
    });
  });
});
