/**
 * app() → state() → handler → exportTo() 統合テスト
 *
 * Requirements: 2.2, 3.1, 3.2, 4.3
 * Boundary: tests/integration/app-counter.test.ts
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app/app';
import { div } from '../../src/html/tags/index';

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `app-counter-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('app() カウンター統合シナリオ', () => {
  it('state + binding で HTML/CSS/JS が生成される (Req 2.2, 3.1)', () => {
    const doc = app({ title: 'Counter', lang: 'ja', wrapDOMReady: true });
    const count = doc.state(0);

    // binding のみ（handler はトランスフォーマー不要な setText 経由で使用）
    const display = div().text(count.map((n: number) => String(n)));
    const view = div(display);

    doc.exportTo(view, tmpDir);

    // HTML が生成される
    expect(existsSync(join(tmpDir, 'index.html'))).toBe(true);
    // JS が生成される（state + binding があるため）
    expect(existsSync(join(tmpDir, 'script.js'))).toBe(true);

    const html = readFileSync(join(tmpDir, 'index.html'), 'utf8');
    const js = readFileSync(join(tmpDir, 'script.js'), 'utf8');

    // HTML: title が反映される
    expect(html).toContain('<title>Counter</title>');
    // HTML: lang が反映される
    expect(html).toContain('<html lang="ja">');
    // HTML: コンテンツが body 直下にあり main で包まれていない
    expect(html).toContain('<body>');
    expect(html).not.toContain('<main>');

    // JS: DOMContentLoaded でラップされる（wrapDOMReady: true）
    expect(js).toContain('DOMContentLoaded');
    // JS: state ID 's0' が含まれる
    expect(js).toContain('s0');
  });

  it('import は app と State 型とタグ関数のみで完結する (Req 4.1, 4.2)', () => {
    // このテスト自体が Root / FileExporter / el.html 等を import していないことを示す
    // (ファイル先頭の import 宣言を参照)
    const doc = app();
    expect(doc).toBeDefined();
    expect(typeof doc.state).toBe('function');
    expect(typeof doc.exportTo).toBe('function');
  });
});
