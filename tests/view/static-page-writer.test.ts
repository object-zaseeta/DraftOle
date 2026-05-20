import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Root } from '../../src/html/elements/root.js';
import { body, head, html, title } from '../../src/html/tags/index.js';
import { VStack } from '../../src/view/primitives.js';
import { ExportableError } from '../../src/publisher/exportable-error.js';
import { StaticPageWriter } from '../../src/view/static-page-writer.js';

function buildRoot(): Root {
  const root = new Root();
  root.setDoctype(true);
  const view = VStack().padding(24).background('#f5f5f5');
  const headEl = head(title('Static'));
  const bodyEl = body(view);
  root.addChild(html(headEl, bodyEl));
  return root;
}

describe('StaticPageWriter', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'static-page-writer-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('write() でディレクトリに index.html のみを生成する（inline CSS デフォルト）', () => {
    const root = buildRoot();
    const writer = new StaticPageWriter();
    const outDir = join(tmpDir, 'out');
    writer.write(root, outDir);

    const entries = readdirSync(outDir);
    expect(entries).toEqual(['index.html']);
  });

  it('生成されたディレクトリ内のいかなるファイルにも __draftole__ が含まれない', () => {
    const root = buildRoot();
    const writer = new StaticPageWriter();
    const outDir = join(tmpDir, 'out');
    writer.write(root, outDir);

    const entries = readdirSync(outDir);
    for (const name of entries) {
      const content = readFileSync(join(outDir, name), 'utf-8');
      expect(content).not.toContain('__draftole__');
    }
  });

  it('inline CSS デフォルトで <style> タグに CSS が埋め込まれる', () => {
    const root = buildRoot();
    const writer = new StaticPageWriter();
    const outDir = join(tmpDir, 'out');
    writer.write(root, outDir);

    const htmlContent = readFileSync(join(outDir, 'index.html'), 'utf-8');
    expect(htmlContent).toContain('<style>');
    expect(htmlContent).toContain('padding: 24px');
  });

  it('CSS が空の場合は <style> タグを埋め込まない', () => {
    const root = new Root();
    root.setDoctype(true);
    root.addChild(html(head(title('Empty')), body()));

    const writer = new StaticPageWriter();
    const outDir = join(tmpDir, 'empty');
    writer.write(root, outDir);

    const entries = readdirSync(outDir);
    expect(entries).toEqual(['index.html']);
    const htmlContent = readFileSync(join(outDir, 'index.html'), 'utf-8');
    expect(htmlContent).not.toContain('<style>');
  });

  it('inlineCss=false の場合は style.css を別ファイルとして出力し、HTML に <link> を挿入する', () => {
    const root = buildRoot();
    const writer = new StaticPageWriter();
    const outDir = join(tmpDir, 'split');
    writer.write(root, outDir, { inlineCss: false });

    const entries = readdirSync(outDir).sort();
    expect(entries).toEqual(['index.html', 'style.css']);
    const htmlContent = readFileSync(join(outDir, 'index.html'), 'utf-8');
    expect(htmlContent).toContain('<link rel="stylesheet" href="style.css">');
    expect(htmlContent).not.toContain('<style>');
    const cssContent = readFileSync(join(outDir, 'style.css'), 'utf-8');
    expect(cssContent).toContain('padding: 24px');

    // どのファイルにも __draftole__ が含まれない
    for (const name of entries) {
      const content = readFileSync(join(outDir, name), 'utf-8');
      expect(content).not.toContain('__draftole__');
    }
  });

  it('runtime.js / app.js / script.js は生成しない', () => {
    const root = buildRoot();
    const writer = new StaticPageWriter();
    const outDir = join(tmpDir, 'no-js');
    writer.write(root, outDir);

    const entries = readdirSync(outDir);
    for (const name of entries) {
      expect(name).not.toMatch(/\.js$/);
    }
  });

  it('htmlFileName / cssFileName オプションでファイル名を変更できる', () => {
    const root = buildRoot();
    const writer = new StaticPageWriter();
    const outDir = join(tmpDir, 'custom');
    writer.write(root, outDir, {
      htmlFileName: 'page.html',
      cssFileName: 'main.css',
      inlineCss: false,
    });

    const entries = readdirSync(outDir).sort();
    expect(entries).toEqual(['main.css', 'page.html']);
  });

  it('outputPath が空文字列の場合 ExportableError(invalidPath) を throw', () => {
    const root = buildRoot();
    const writer = new StaticPageWriter();
    expect(() => writer.write(root, '')).toThrow(ExportableError);
    try {
      writer.write(root, '');
    } catch (e) {
      expect(e).toBeInstanceOf(ExportableError);
      expect((e as ExportableError).code).toBe('invalidPath');
    }
  });

  it('書き込み不能なパス（既存ファイルをディレクトリとして使う）で ExportableError(writeFailed) を throw', () => {
    const root = buildRoot();
    const writer = new StaticPageWriter();
    // 既存のファイルパスをディレクトリとして指定 → mkdir が失敗
    const filePath = join(tmpDir, 'a-file');
    writeFileSync(filePath, 'x', 'utf-8');
    // mkdirSync(recursive: true) が既存ファイルに対しては EEXIST を投げる
    expect(() => writer.write(root, join(filePath, 'sub'))).toThrow(ExportableError);
  });

  it('正常書き出しのディレクトリは存在し、ファイル数は CSS が空でない場合 1（inline default）', () => {
    const root = buildRoot();
    const writer = new StaticPageWriter();
    const outDir = join(tmpDir, 'verify');
    writer.write(root, outDir);
    expect(statSync(outDir).isDirectory()).toBe(true);
    expect(readdirSync(outDir).length).toBe(1);
  });
});
