/**
 * Task 5.2: publisher 回帰テスト — ExportContext 経由の export 挙動
 *
 * Req 3.2: FileExporter は ExportContext 経由でのみ Root 内部を参照する
 * Req 5.1: prelude 注入が維持される
 * Req 5.2: reset.css バンドルが維持される
 * Req 5.3: HTML への <script> / <link> 挿入が維持される
 *
 * これらのテストは exportContext() を直接呼び出し、
 * Root を経由しない ExportContext パスが正しく機能することを確認する。
 * ExportContext パスが壊れた場合にこのテスト群が失敗することを意図する。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileExporter } from '../../src/publisher/file-exporter.js';
import type { ExportContext } from '../../src/publisher/export-context.js';
import { RESET_CSS } from '../../src/publisher/reset-css.js';

const BASE_TMP = join(tmpdir(), `draftole-export-ctx-regression-${process.pid}`);

let testDir: string;
let counter = 0;

beforeEach(() => {
  counter++;
  testDir = join(BASE_TMP, String(counter));
});

afterEach(() => {
  if (existsSync(BASE_TMP)) {
    rmSync(BASE_TMP, { recursive: true, force: true });
  }
});

// ──────────────────────────────────────────────────────────────────
// Req 5.1: runtimePrelude 注入が ExportContext パスで維持される
// ──────────────────────────────────────────────────────────────────
describe('Req 5.1: prelude 注入 — ExportContext 直接利用', () => {
  it('runtimePrelude が存在する場合、script.js の先頭にプレリュードが出力される', () => {
    const prelude = '/* __draftole__ runtime prelude */\nvar __draftole__ = {};';
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: '',
      userJs: 'console.log("user");',
      runtimePrelude: prelude,
      runtimeInitJs: '__draftole__.initState("s0", 0);',
    };

    new FileExporter().exportContext(ctx, testDir);

    const jsOutput = readFileSync(join(testDir, 'script.js'), 'utf-8');
    expect(jsOutput.startsWith(prelude)).toBe(true);
  });

  it('runtimePrelude + runtimeInitJs + userJs が正しい順序で出力される', () => {
    const prelude = '/* prelude */';
    const initJs = '__draftole__.initState("s0", 42);';
    const userJs = 'console.log("hello");';
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: '',
      userJs,
      runtimePrelude: prelude,
      runtimeInitJs: initJs,
    };

    new FileExporter().exportContext(ctx, testDir);

    const jsOutput = readFileSync(join(testDir, 'script.js'), 'utf-8');
    const preludePos = jsOutput.indexOf(prelude);
    const initPos = jsOutput.indexOf(initJs);
    const userPos = jsOutput.indexOf(userJs);

    // 全要素が出力されている
    expect(preludePos).toBeGreaterThanOrEqual(0);
    expect(initPos).toBeGreaterThanOrEqual(0);
    expect(userPos).toBeGreaterThanOrEqual(0);

    // 順序: prelude → initJs → userJs
    expect(preludePos).toBeLessThan(initPos);
    expect(initPos).toBeLessThan(userPos);
  });

  it('runtimePrelude のみで runtimeInitJs がない場合もプレリュードが先頭に出力される', () => {
    const prelude = '/* prelude only */';
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: '',
      userJs: 'var x = 1;',
      runtimePrelude: prelude,
      // runtimeInitJs は省略
    };

    new FileExporter().exportContext(ctx, testDir);

    const jsOutput = readFileSync(join(testDir, 'script.js'), 'utf-8');
    expect(jsOutput.startsWith(prelude)).toBe(true);
    expect(jsOutput).toContain('var x = 1;');
  });

  it('runtimePrelude が undefined の場合、userJs がそのまま出力される', () => {
    const userJs = 'console.log("no prelude");';
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: '',
      userJs,
      // runtimePrelude は省略 = undefined
    };

    new FileExporter().exportContext(ctx, testDir);

    const jsOutput = readFileSync(join(testDir, 'script.js'), 'utf-8');
    expect(jsOutput).toBe(userJs);
  });

  it('runtimePrelude あり + userJs なし の場合、prelude + initJs のみ出力される', () => {
    const prelude = '/* prelude */';
    const initJs = '__draftole__.initState("s0", 0);';
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: '',
      userJs: '',
      runtimePrelude: prelude,
      runtimeInitJs: initJs,
    };

    new FileExporter().exportContext(ctx, testDir);

    // JS が非空なのでファイルが存在する
    expect(existsSync(join(testDir, 'script.js'))).toBe(true);
    const jsOutput = readFileSync(join(testDir, 'script.js'), 'utf-8');
    expect(jsOutput).toContain(prelude);
    expect(jsOutput).toContain(initJs);
  });
});

// ──────────────────────────────────────────────────────────────────
// Req 5.2: reset.css バンドルが ExportContext パスで維持される
// ──────────────────────────────────────────────────────────────────
describe('Req 5.2: reset.css バンドル — ExportContext 直接利用', () => {
  it('includeResetCss: true の場合、CSS ファイルの先頭に reset.css が挿入される', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: 'body { color: red; }',
      userJs: '',
    };

    new FileExporter({ includeResetCss: true }).exportContext(ctx, testDir);

    expect(existsSync(join(testDir, 'style.css'))).toBe(true);
    const cssOutput = readFileSync(join(testDir, 'style.css'), 'utf-8');

    // reset.css が先頭にある
    expect(cssOutput.startsWith(RESET_CSS)).toBe(true);
    // ユーザー CSS も含まれる
    expect(cssOutput).toContain('body { color: red; }');

    // reset.css がユーザー CSS より前に来る
    const resetIdx = cssOutput.indexOf(RESET_CSS);
    const userCssIdx = cssOutput.indexOf('body { color: red; }');
    expect(resetIdx).toBeLessThan(userCssIdx);
  });

  it('includeResetCss: false の場合、reset.css が含まれない', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: 'body { color: red; }',
      userJs: '',
    };

    new FileExporter({ includeResetCss: false }).exportContext(ctx, testDir);

    const cssOutput = readFileSync(join(testDir, 'style.css'), 'utf-8');
    expect(cssOutput).toBe('body { color: red; }');
  });

  it('CSS 空 + includeResetCss: true の場合、reset.css のみ CSS ファイルとして出力される', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: '',
      userJs: '',
    };

    new FileExporter({ includeResetCss: true }).exportContext(ctx, testDir);

    // reset.css があるため CSS ファイルが出力される
    expect(existsSync(join(testDir, 'style.css'))).toBe(true);
    const cssOutput = readFileSync(join(testDir, 'style.css'), 'utf-8');
    expect(cssOutput.startsWith(RESET_CSS)).toBe(true);

    // HTML に <link> タグが挿入される
    const htmlOutput = readFileSync(join(testDir, 'index.html'), 'utf-8');
    expect(htmlOutput).toContain('<link rel="stylesheet" href="style.css">');
  });
});

// ──────────────────────────────────────────────────────────────────
// Req 5.3: HTML への <link> / <script> 挿入が ExportContext パスで維持される
// ──────────────────────────────────────────────────────────────────
describe('Req 5.3: <link> / <script> タグ挿入 — ExportContext 直接利用', () => {
  it('CSS が非空の場合、<link rel="stylesheet"> が </head> 直前に挿入される', () => {
    const ctx: ExportContext = {
      html: '<html><head><title>Test</title></head><body></body></html>',
      css: 'body { margin: 0; }',
      userJs: '',
    };

    new FileExporter().exportContext(ctx, testDir);

    const htmlOutput = readFileSync(join(testDir, 'index.html'), 'utf-8');
    expect(htmlOutput).toMatch(/<link rel="stylesheet" href="style\.css">\s*<\/head>/);
  });

  it('JS が非空（prelude あり）の場合、<script defer> が </body> 直前に挿入される', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body><div>Content</div></body></html>',
      css: '',
      userJs: 'console.log("hi");',
      runtimePrelude: '/* prelude */',
      runtimeInitJs: '__draftole__.initState("s0", 0);',
    };

    new FileExporter().exportContext(ctx, testDir);

    const htmlOutput = readFileSync(join(testDir, 'index.html'), 'utf-8');
    expect(htmlOutput).toMatch(/<script defer src="script\.js"><\/script>\s*<\/body>/);
  });

  it('CSS と JS の両方が非空の場合、<link> と <script> の両方が挿入される', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: 'body { font-size: 16px; }',
      userJs: 'console.log("ready");',
    };

    new FileExporter().exportContext(ctx, testDir);

    const htmlOutput = readFileSync(join(testDir, 'index.html'), 'utf-8');
    expect(htmlOutput).toContain('<link rel="stylesheet" href="style.css">');
    expect(htmlOutput).toContain('<script defer src="script.js"></script>');
  });

  it('カスタムファイル名オプションが <link> / <script> の href / src に反映される', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: 'h1 { color: blue; }',
      userJs: 'var y = 2;',
    };

    new FileExporter({
      htmlFileName: 'page.html',
      cssFileName: 'main.css',
      jsFileName: 'app.js',
    }).exportContext(ctx, testDir);

    const htmlOutput = readFileSync(join(testDir, 'page.html'), 'utf-8');
    expect(htmlOutput).toContain('<link rel="stylesheet" href="main.css">');
    expect(htmlOutput).toContain('<script defer src="app.js"></script>');
  });
});

// ──────────────────────────────────────────────────────────────────
// 空 CSS / JS スキップ — ExportContext パスで維持される
// ──────────────────────────────────────────────────────────────────
describe('空 CSS / JS スキップ — ExportContext 直接利用', () => {
  it('CSS が空の場合、CSS ファイルと <link> タグをスキップする', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: '',
      userJs: 'console.log("test");',
    };

    new FileExporter().exportContext(ctx, testDir);

    expect(existsSync(join(testDir, 'style.css'))).toBe(false);
    const htmlOutput = readFileSync(join(testDir, 'index.html'), 'utf-8');
    expect(htmlOutput).not.toContain('<link rel="stylesheet"');
    expect(htmlOutput).toContain('<script defer src="script.js"></script>');
  });

  it('JS が空（prelude なし）の場合、JS ファイルと <script> タグをスキップする', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: 'body { margin: 0; }',
      userJs: '',
    };

    new FileExporter().exportContext(ctx, testDir);

    expect(existsSync(join(testDir, 'script.js'))).toBe(false);
    const htmlOutput = readFileSync(join(testDir, 'index.html'), 'utf-8');
    expect(htmlOutput).toContain('<link rel="stylesheet" href="style.css">');
    expect(htmlOutput).not.toContain('<script');
  });

  it('CSS・JS 両方が空の場合、HTML のみ出力される', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: '',
      userJs: '',
    };

    new FileExporter().exportContext(ctx, testDir);

    expect(existsSync(join(testDir, 'index.html'))).toBe(true);
    expect(existsSync(join(testDir, 'style.css'))).toBe(false);
    expect(existsSync(join(testDir, 'script.js'))).toBe(false);

    const htmlOutput = readFileSync(join(testDir, 'index.html'), 'utf-8');
    expect(htmlOutput).not.toContain('<link');
    expect(htmlOutput).not.toContain('<script');
  });

  it('runtimePrelude あり・userJs 空でも、JS ファイルが生成される（prelude 自体が非空）', () => {
    // prelude があれば JS コンテンツは非空 → script.js が生成されるべき
    const ctx: ExportContext = {
      html: '<html><head></head><body></body></html>',
      css: '',
      userJs: '',
      runtimePrelude: '/* prelude */',
      runtimeInitJs: '',
    };

    new FileExporter().exportContext(ctx, testDir);

    expect(existsSync(join(testDir, 'script.js'))).toBe(true);
    const htmlOutput = readFileSync(join(testDir, 'index.html'), 'utf-8');
    expect(htmlOutput).toContain('<script defer src="script.js"></script>');
  });
});

// ──────────────────────────────────────────────────────────────────
// exportContext() メソッド自体のインターフェース検証
// ──────────────────────────────────────────────────────────────────
describe('exportContext() メソッド — Root 不使用の直接利用', () => {
  it('ExportContext を直接構築して exportContext() を呼び出せる', () => {
    const ctx: ExportContext = {
      html: '<html><head></head><body><p>Hello</p></body></html>',
      css: 'p { color: green; }',
      userJs: 'console.log("direct");',
    };

    // Root を使わずに直接 exportContext() を呼び出す
    expect(() => {
      new FileExporter().exportContext(ctx, testDir);
    }).not.toThrow();

    expect(existsSync(join(testDir, 'index.html'))).toBe(true);
    expect(existsSync(join(testDir, 'style.css'))).toBe(true);
    expect(existsSync(join(testDir, 'script.js'))).toBe(true);
  });

  it('exportContext() の出力は export() と同等である（prelude なしの場合）', () => {
    const html = '<html><head></head><body></body></html>';
    const css = 'body { margin: 0; }';
    const userJs = 'console.log("equiv");';

    const ctx: ExportContext = { html, css, userJs };

    const dirCtx = join(testDir, 'via-ctx');
    const dirExport = join(testDir, 'via-export');

    new FileExporter().exportContext(ctx, dirCtx);
    new FileExporter().export(html, css, userJs, dirExport);

    const htmlCtx = readFileSync(join(dirCtx, 'index.html'), 'utf-8');
    const htmlExp = readFileSync(join(dirExport, 'index.html'), 'utf-8');
    expect(htmlCtx).toBe(htmlExp);

    const cssCtx = readFileSync(join(dirCtx, 'style.css'), 'utf-8');
    const cssExp = readFileSync(join(dirExport, 'style.css'), 'utf-8');
    expect(cssCtx).toBe(cssExp);

    const jsCtx = readFileSync(join(dirCtx, 'script.js'), 'utf-8');
    const jsExp = readFileSync(join(dirExport, 'script.js'), 'utf-8');
    expect(jsCtx).toBe(jsExp);
  });
});
