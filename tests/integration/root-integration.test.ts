/**
 * Task 4.4: Root統合テスト
 *
 * Root.renderJs()のツリー全体JS収集、HtmlTag + JQueryManager統合、
 * FileExporter + Root.renderJs()のエンドツーエンド出力を検証する。
 *
 * このテストは実装が既に完了している機能の統合動作を検証する。
 *
 * Requirements: 7.4, 7.5
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import { PairType } from '../../src/html/elements/pair-type.js';
import { FileExporter } from '../../src/publisher/file-exporter.js';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

describe('Root統合テスト (Task 4.4)', () => {
  // ── テスト用の一時ディレクトリ ──
  const testOutputDir = join(process.cwd(), 'tests', 'integration', 'test-output');

  afterEach(() => {
    // テスト後にクリーンアップ
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  // ── 1. Root.renderJs() - ツリー全体JS収集 (Req 7.4) ──

  describe('Root.renderJs() - ツリー全体JS収集', () => {
    it('複数階層のネストした要素からJSを収集する', () => {
      // Arrange: 3階層のツリーを構築
      const root = new Root();

      const container = new PairType('div');
      container.jqm.addClass('container');

      const header = new PairType('header');
      header.jqm.css({ backgroundColor: '#333' });

      const h1 = new PairType('h1');
      h1.jqm.text('Welcome');

      const main = new PairType('main');
      main.jqm.height(500);

      const p = new PairType('p');
      p.jqm.html('<strong>Content</strong>');

      // ツリー構造を構築
      header.addChild(h1);
      main.addChild(p);
      container.addChildren([header, main]);
      root.addChild(container);

      // Act: JS統合出力
      const result = root.renderJs();

      // Assert: ヘルパー関数の存在
      expect(result).toContain('function $(selectorOrEl)');

      // Assert: 使用された全メソッドがヘルパーに含まれる
      expect(result).toContain('addClass(className)');
      expect(result).toContain('css(props)');
      expect(result).toContain('text(value)');
      expect(result).toContain('height(value)');
      expect(result).toContain('html(value)');

      // Assert: 各要素のJS文が含まれる
      expect(result).toContain("addClass('container')");
      expect(result).toContain("css({'backgroundColor': '#333'})");
      expect(result).toContain("text('Welcome')");
      expect(result).toContain('height(500)');
      expect(result).toContain("html('<strong>Content</strong>')");
    });

    it('複数の子要素が同じメソッドを使用する場合、ヘルパーは1回のみ生成', () => {
      // Arrange: 複数要素がtext()を使用
      const root = new Root();

      const div1 = new PairType('div');
      div1.jqm.text('First');

      const div2 = new PairType('div');
      div2.jqm.text('Second');

      const div3 = new PairType('div');
      div3.jqm.text('Third');

      root.addChildren([div1, div2, div3]);

      // Act
      const result = root.renderJs();

      // Assert: text()メソッドがヘルパーに含まれる（複数箇所に出現するため存在確認のみ）
      expect(result).toContain('text(value)');

      // Assert: ヘルパー関数が1つのみ生成される（function $の出現回数で確認）
      const helperFunctionMatches = result.match(/function \$\(selectorOrEl\)/g);
      expect(helperFunctionMatches).not.toBeNull();
      expect(helperFunctionMatches?.length).toBe(1);

      // Assert: 各JS文は含まれる
      expect(result).toContain("text('First')");
      expect(result).toContain("text('Second')");
      expect(result).toContain("text('Third')");
    });

    it('深くネストした要素のメソッドも収集する', () => {
      // Arrange: 5階層のツリー
      const root = new Root();
      const level1 = new PairType('div');
      const level2 = new PairType('div');
      const level3 = new PairType('div');
      const level4 = new PairType('div');
      const level5 = new PairType('div');

      level5.jqm.addClass('deepest');
      level4.addChild(level5);
      level3.addChild(level4);
      level2.addChild(level3);
      level1.addChild(level2);
      root.addChild(level1);

      // Act
      const result = root.renderJs();

      // Assert: 最深部のメソッドも収集される
      expect(result).toContain('addClass(className)');
      expect(result).toContain("addClass('deepest')");
    });

    it('JS未使用の要素は空文字列を返す', () => {
      // Arrange: どの要素もJQueryManagerを使用しない
      const root = new Root();
      const div = new PairType('div');
      const p = new PairType('p');
      div.addChild(p);
      root.addChild(div);

      // Act
      const result = root.renderJs();

      // Assert
      expect(result).toBe('');
    });
  });

  // ── 2. HtmlTag + JQueryManager統合（コンポジション動作） (Req 7.4) ──

  describe('HtmlTag + JQueryManager統合（コンポジション動作）', () => {
    it('HtmlTagは内部でJQueryManagerインスタンスを保持する', () => {
      // Arrange
      const div = new PairType('div');

      // Assert: jqmプロパティが存在し、JQueryManagerのインターフェースを持つ
      expect(div.jqm).toBeDefined();
      expect(typeof div.jqm.css).toBe('function');
      expect(typeof div.jqm.text).toBe('function');
      expect(typeof div.jqm.addClass).toBe('function');
      expect(typeof div.jqm.render).toBe('function');
    });

    it('JQueryManagerへの操作が自動的に追跡される', () => {
      // Arrange
      const div = new PairType('div');

      // Act: 複数のメソッドを呼び出し
      div.jqm.css({ color: 'red' });
      div.jqm.addClass('active');
      div.jqm.text('Hello');

      // Assert: usedMethodsに記録される
      expect(div.jqm.usedMethods.has('css')).toBe(true);
      expect(div.jqm.usedMethods.has('addClass')).toBe(true);
      expect(div.jqm.usedMethods.has('text')).toBe(true);
      expect(div.jqm.usedMethods.size).toBe(3);
    });

    it('collectJsContent()でHtmlTagがJQueryManagerに委譲する', () => {
      // Arrange
      const div = new PairType('div');
      div.jqm.text('Content');

      // Act
      const jsContent = div.collectJsContent();

      // Assert: JQueryManagerのrender()結果が返る
      expect(jsContent).toContain("$('.').text('Content')");
    });

    it('collectUsedMethods()でHtmlTagがJQueryManagerに委譲する', () => {
      // Arrange
      const div = new PairType('div');
      div.jqm.addClass('test');
      div.jqm.html('<span>Test</span>');

      // Act
      const usedMethods = div.collectUsedMethods();

      // Assert: JQueryManagerのusedMethodsが返る
      expect(usedMethods.has('addClass')).toBe(true);
      expect(usedMethods.has('html')).toBe(true);
      expect(usedMethods.size).toBe(2);
    });

    it('親要素が子要素のJSを再帰的に収集する', () => {
      // Arrange
      const parent = new PairType('div');
      parent.jqm.css({ width: '100%' });

      const child1 = new PairType('p');
      child1.jqm.text('Paragraph');

      const child2 = new PairType('span');
      child2.jqm.addClass('highlight');

      parent.addChildren([child1, child2]);

      // Act
      const jsContent = parent.collectJsContent();
      const usedMethods = parent.collectUsedMethods();

      // Assert: 親と子のJSが全て含まれる
      expect(jsContent).toContain("css({'width': '100%'})");
      expect(jsContent).toContain("text('Paragraph')");
      expect(jsContent).toContain("addClass('highlight')");

      // Assert: 親と子のメソッドが全て含まれる
      expect(usedMethods.has('css')).toBe(true);
      expect(usedMethods.has('text')).toBe(true);
      expect(usedMethods.has('addClass')).toBe(true);
      expect(usedMethods.size).toBe(3);
    });

    it('複数の子要素とネストした孫要素のJSを収集する', () => {
      // Arrange: 複雑なツリー構造
      const root = new Root();

      const section = new PairType('section');
      section.jqm.height(600);

      const article = new PairType('article');
      article.jqm.css({ padding: '20px' });

      const h2 = new PairType('h2');
      h2.jqm.text('Title');

      const div = new PairType('div');
      div.jqm.addClass('content');

      const p = new PairType('p');
      p.jqm.html('<em>Emphasis</em>');

      // ツリー構築
      div.addChild(p);
      article.addChildren([h2, div]);
      section.addChild(article);
      root.addChild(section);

      // Act
      const jsContent = root.collectJsContent();
      const usedMethods = root.collectUsedMethods();

      // Assert: 全要素のJSが収集される
      expect(jsContent).toContain('height(600)');
      expect(jsContent).toContain("css({'padding': '20px'})");
      expect(jsContent).toContain("text('Title')");
      expect(jsContent).toContain("addClass('content')");
      expect(jsContent).toContain("html('<em>Emphasis</em>')");

      // Assert: 全メソッドが収集される
      expect(usedMethods.size).toBe(5);
    });
  });

  // ── 3. FileExporter + Root.renderJs() エンドツーエンド出力 (Req 7.5) ──

  describe('FileExporter + Root.renderJs() エンドツーエンド出力', () => {
    it('HTML + CSS + JSの3ファイルが正しく出力される', () => {
      // Arrange: Rootツリーを構築
      const root = new Root();
      const html = new PairType('html');
      const head = new PairType('head');
      const body = new PairType('body');

      const div = new PairType('div');
      div.jqm.addClass('app');
      div.jqm.text('Hello World');

      body.addChild(div);
      html.addChildren([head, body]);
      root.addChild(html);

      // CSS/JS生成
      const htmlContent = root.render();
      const cssContent = '.app { color: blue; }'; // 簡易CSS
      const jsContent = root.renderJs();

      // Act: FileExporterで出力
      const exporter = new FileExporter();
      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      // Assert: 3ファイルが存在する
      expect(existsSync(join(testOutputDir, 'index.html'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'style.css'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'script.js'))).toBe(true);
    });

    it('HTMLに<link>と<script defer>タグが挿入される', () => {
      // Arrange
      const root = new Root();
      const html = new PairType('html');
      const head = new PairType('head');
      const body = new PairType('body');

      const h1 = new PairType('h1');
      h1.jqm.text('Title');

      body.addChild(h1);
      html.addChildren([head, body]);
      root.addChild(html);

      const htmlContent = root.render();
      const cssContent = 'body { margin: 0; }';
      const jsContent = root.renderJs();

      // Act
      const exporter = new FileExporter();
      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      // Assert: HTMLファイルの内容を確認
      const outputHtml = readFileSync(join(testOutputDir, 'index.html'), 'utf-8');
      expect(outputHtml).toContain('<link rel="stylesheet" href="style.css">');
      expect(outputHtml).toContain('<script defer src="script.js"></script>');
    });

    it('JSファイルにヘルパー関数とJS文が含まれる', () => {
      // Arrange
      const root = new Root();
      const div = new PairType('div');
      div.jqm.addClass('container');
      div.jqm.css({ width: '100%' });
      root.addChild(div);

      const htmlContent = root.render();
      const cssContent = '';
      const jsContent = root.renderJs();

      // Act
      const exporter = new FileExporter();
      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      // Assert: JSファイルの内容を確認
      const outputJs = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');

      // ヘルパー関数が含まれる
      expect(outputJs).toContain('function $(selectorOrEl)');
      expect(outputJs).toContain('addClass(className)');
      expect(outputJs).toContain('css(props)');

      // JS文が含まれる
      expect(outputJs).toContain("addClass('container')");
      expect(outputJs).toContain("css({'width': '100%'})");
    });

    it('JS未使用の場合、script.jsファイルが出力されない', () => {
      // Arrange: JSを使用しないツリー
      const root = new Root();
      const div = new PairType('div');
      root.addChild(div);

      const htmlContent = root.render();
      const cssContent = 'div { color: red; }';
      const jsContent = root.renderJs(); // 空文字列

      // Act
      const exporter = new FileExporter();
      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      // Assert: JSファイルは作成されない
      expect(existsSync(join(testOutputDir, 'script.js'))).toBe(false);

      // Assert: HTMLに<script>タグが挿入されない
      const outputHtml = readFileSync(join(testOutputDir, 'index.html'), 'utf-8');
      expect(outputHtml).not.toContain('<script');
    });

    it('複雑なツリーのエンドツーエンド出力', () => {
      // Arrange: 実際のWebページに近い構造
      const root = new Root();
      const html = new PairType('html');
      const head = new PairType('head');
      const body = new PairType('body');

      const header = new PairType('header');
      const nav = new PairType('nav');
      nav.jqm.addClass('navbar');
      header.addChild(nav);

      const main = new PairType('main');
      const article = new PairType('article');
      article.jqm.css({ maxWidth: '800px' });

      const h1 = new PairType('h1');
      h1.jqm.text('Article Title');

      const p = new PairType('p');
      p.jqm.html('<strong>Introduction</strong> paragraph.');

      article.addChildren([h1, p]);
      main.addChild(article);

      const footer = new PairType('footer');
      footer.jqm.addClass('footer');

      body.addChildren([header, main, footer]);
      html.addChildren([head, body]);
      root.addChild(html);

      // CSS/JS生成
      const htmlContent = root.render();
      const cssContent = `
        .navbar { background: #333; }
        .footer { background: #f0f0f0; }
      `;
      const jsContent = root.renderJs();

      // Act
      const exporter = new FileExporter();
      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      // Assert: 全ファイルが存在
      expect(existsSync(join(testOutputDir, 'index.html'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'style.css'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'script.js'))).toBe(true);

      // Assert: HTMLの構造とタグ挿入
      const outputHtml = readFileSync(join(testOutputDir, 'index.html'), 'utf-8');
      expect(outputHtml).toContain('<header>');
      expect(outputHtml).toContain('<nav');
      expect(outputHtml).toContain('<main>');
      expect(outputHtml).toContain('<article');
      expect(outputHtml).toContain('<footer');
      expect(outputHtml).toContain('<link rel="stylesheet" href="style.css">');
      expect(outputHtml).toContain('<script defer src="script.js"></script>');

      // Assert: CSSの内容
      const outputCss = readFileSync(join(testOutputDir, 'style.css'), 'utf-8');
      expect(outputCss).toContain('.navbar { background: #333; }');
      expect(outputCss).toContain('.footer { background: #f0f0f0; }');

      // Assert: JSの内容
      const outputJs = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');
      expect(outputJs).toContain('function $(selectorOrEl)');
      expect(outputJs).toContain("addClass('navbar')");
      expect(outputJs).toContain("css({'maxWidth': '800px'})");
      expect(outputJs).toContain("text('Article Title')");
      expect(outputJs).toContain("html('<strong>Introduction</strong> paragraph.')");
      expect(outputJs).toContain("addClass('footer')");
    });

    it('カスタムファイル名で出力できる', () => {
      // Arrange: 正しいHTML構造を構築（<html>, <head>, <body>が必要）
      const root = new Root();
      const html = new PairType('html');
      const head = new PairType('head');
      const body = new PairType('body');

      const div = new PairType('div');
      div.jqm.text('Custom');

      body.addChild(div);
      html.addChildren([head, body]);
      root.addChild(html);

      const htmlContent = root.render();
      const cssContent = 'div { color: green; }';
      const jsContent = root.renderJs();

      // Act: カスタムファイル名
      const exporter = new FileExporter({
        htmlFileName: 'custom.html',
        cssFileName: 'custom.css',
        jsFileName: 'custom.js',
      });
      exporter.export(htmlContent, cssContent, jsContent, testOutputDir);

      // Assert: カスタムファイル名で出力される
      expect(existsSync(join(testOutputDir, 'custom.html'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'custom.css'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'custom.js'))).toBe(true);

      // Assert: HTMLでカスタムファイル名が参照される
      const outputHtml = readFileSync(join(testOutputDir, 'custom.html'), 'utf-8');
      expect(outputHtml).toContain('<link rel="stylesheet" href="custom.css">');
      expect(outputHtml).toContain('<script defer src="custom.js"></script>');
    });
  });
});
