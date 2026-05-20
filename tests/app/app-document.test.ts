/**
 * AppDocument クラスの単体テスト
 *
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.3
 * Boundary: tests/app/app-document.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { app } from '../../src/app/app';
import { div } from '../../src/html/tags/index';

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `app-doc-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('AppDocument.state() — リアクティブ state 生成 (Req 2.1, 2.3)', () => {
  it('.state(0) が State<number> を返す', () => {
    const doc = app();
    const s = doc.state(0);
    expect(s).toBeDefined();
    expect(typeof s.get).toBe('function');
    expect(s._runtimeId).toBe('s0');
  });

  it('複数 state() 呼び出しで異なる runtimeId が採番される', () => {
    const doc = app();
    const s0 = doc.state(0);
    const s1 = doc.state('hello');
    expect(s0._runtimeId).toBe('s0');
    expect(s1._runtimeId).toBe('s1');
    expect(s0._runtimeId).not.toBe(s1._runtimeId);
  });
});

describe('AppDocument.exportTo() — 出力 (Req 3.1, 3.2)', () => {
  it('outputPath に HTML ファイルが生成される', () => {
    const doc = app({ title: 'Test' });
    const view = div('hello');
    doc.exportTo(view, tmpDir);
    expect(existsSync(join(tmpDir, 'index.html'))).toBe(true);
  });

  it('ユーザー content が <body> 直下にあり <main> で包まれていない', () => {
    const doc = app();
    const view = div('content');
    doc.exportTo(view, tmpDir);
    const html = readFileSync(join(tmpDir, 'index.html'), 'utf8');
    expect(html).toContain('<body>');
    expect(html).toContain('<div>content</div>');
    expect(html).not.toContain('<main>');
  });

  it('wrapDOMReady: false で DOMContentLoaded ラップなし', () => {
    const doc = app({ wrapDOMReady: false });
    const count = doc.state(0);
    const view = div().text(count.map((n: number) => String(n)));
    doc.exportTo(view, tmpDir);
    const js = readFileSync(join(tmpDir, 'script.js'), 'utf8');
    expect(js).not.toContain('DOMContentLoaded');
  });

  it('wrapDOMReady: true で DOMContentLoaded ラップあり', () => {
    const doc = app({ wrapDOMReady: true });
    const count = doc.state(0);
    const view = div().text(count.map((n: number) => String(n)));
    doc.exportTo(view, tmpDir);
    const js = readFileSync(join(tmpDir, 'script.js'), 'utf8');
    expect(js).toContain('DOMContentLoaded');
  });
});

describe('AppDocument.exportTo() — 再 export 防止 (Req 3.1)', () => {
  it('2 回目の exportTo() で Error を throw する', () => {
    const doc = app();
    doc.exportTo(div('first'), tmpDir);
    expect(() => {
      doc.exportTo(div('second'), tmpDir);
    }).toThrow('AppDocument.exportTo can only be called once');
  });
});

describe('AppDocument.exportTo() — エラー伝播 (Req 3.3)', () => {
  it('outputPath が空文字列で ExportableError が throw される', () => {
    const doc = app();
    expect(() => {
      doc.exportTo(div('content'), '');
    }).toThrow();
  });
});

describe('AppDocument.exportTo() — content 入力形態 (Req 3.1)', () => {
  it('単一 AppView (非配列) を渡すと <body> 直下に append される', () => {
    const doc = app();
    const single = div('single-view');
    doc.exportTo(single, tmpDir);
    const html = readFileSync(join(tmpDir, 'index.html'), 'utf8');
    expect(html).toContain('<div>single-view</div>');
  });

  it('AppView 配列 [view1, view2] を渡すと両方が <body> 直下に append される', () => {
    const doc = app();
    const view1 = div('first-view');
    const view2 = div('second-view');
    doc.exportTo([view1, view2], tmpDir);
    const html = readFileSync(join(tmpDir, 'index.html'), 'utf8');
    expect(html).toContain('<div>first-view</div>');
    expect(html).toContain('<div>second-view</div>');
    // 両方が <body> 直下に存在し、入力順を保つ
    const firstIdx = html.indexOf('<div>first-view</div>');
    const secondIdx = html.indexOf('<div>second-view</div>');
    expect(firstIdx).toBeGreaterThan(-1);
    expect(secondIdx).toBeGreaterThan(firstIdx);
  });

  it('単一 AppView と 1 要素配列 [view] が同等の HTML を生成する', () => {
    const tmpDirA = join(tmpdir(), `app-doc-test-single-${Date.now()}`);
    const tmpDirB = join(tmpdir(), `app-doc-test-array-${Date.now()}`);
    mkdirSync(tmpDirA, { recursive: true });
    mkdirSync(tmpDirB, { recursive: true });
    try {
      const docA = app();
      docA.exportTo(div('same-content'), tmpDirA);
      const docB = app();
      docB.exportTo([div('same-content')], tmpDirB);
      const htmlA = readFileSync(join(tmpDirA, 'index.html'), 'utf8');
      const htmlB = readFileSync(join(tmpDirB, 'index.html'), 'utf8');
      expect(htmlA).toBe(htmlB);
    } finally {
      rmSync(tmpDirA, { recursive: true, force: true });
      rmSync(tmpDirB, { recursive: true, force: true });
    }
  });
});

describe('AppDocument — state と binding の連携 (Req 2.2)', () => {
  it('state が renderJs() 出力に含まれる（JS ファイルが生成される）', () => {
    const doc = app();
    const count = doc.state(0);
    const view = div().text(count.map((n: number) => String(n)));
    doc.exportTo(view, tmpDir);
    const jsPath = join(tmpDir, 'script.js');
    expect(existsSync(jsPath)).toBe(true);
    const js = readFileSync(jsPath, 'utf8');
    // state 初期化コードが含まれる
    expect(js).toContain('s0');
  });
});
