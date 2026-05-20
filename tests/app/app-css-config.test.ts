/**
 * Task 5.1: app() 経由の css-config-pipeline-wiring end-to-end 統合テスト
 *
 * `app({ cssConfig })` で渡した `CssConfig.minifyClassNames` が
 * 生成 HTML/CSS のクラス名に到達することを検証する。
 *
 * Requirements: 6.1, 6.2, 6.3, 7.2, 7.4
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { app } from '../../src/app/app';
import { CssConfig } from '../../src/css/config/css-config.js';
import { div } from '../../src/html/tags/index';
import { createStyleTemplate } from '../../src/css/variables/style-template.js';

let tmpDir: string;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

beforeEach(() => {
  tmpDir = join(tmpdir(), `app-css-config-${Date.now()}-${Math.random()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

function readCss(): string {
  const cssPath = join(tmpDir, 'style.css');
  return existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
}

function readHtml(): string {
  return readFileSync(join(tmpDir, 'index.html'), 'utf8');
}

describe('app({ cssConfig }) — minify モード end-to-end', () => {
  it('(a) 明示 minifyClassNames: true → CSS class 名がすべて `_<8hex>` 形式', () => {
    delete process.env.NODE_ENV;
    const doc = app({
      cssConfig: new CssConfig({ minifyClassNames: true }),
    });
    const tpl = createStyleTemplate({ properties: { color: 'red' } });
    doc.exportTo(div({ css: tpl }, 'hello'), tmpDir);
    const css = readCss();
    const html = readHtml();
    // CSS rule 内の wrapper class は `_<8hex>` 形式のみ
    const cssClasses = css.match(/\._[a-z0-9_-]+/g) ?? [];
    expect(cssClasses.length).toBeGreaterThan(0);
    for (const c of cssClasses) {
      expect(c).toMatch(/^\._[0-9a-f]{8}$/);
    }
    // HTML 上の class 属性もすべて minify 形式
    const htmlClasses = html.match(/class="([^"]+)"/g) ?? [];
    for (const c of htmlClasses) {
      // class="_a1b2c3d4" のような形のみ
      expect(c).toMatch(/^class="(_[0-9a-f]{8})(\s+_[0-9a-f]{8})*"$/);
    }
  });

  it('(b) cssConfig 省略 → 既存 debuggable 形式（prefix 含む）', () => {
    delete process.env.NODE_ENV;
    const doc = app();
    const tpl = createStyleTemplate({ properties: { color: 'red' } });
    doc.exportTo(div({ css: tpl }, 'hello'), tmpDir);
    const css = readCss();
    // debuggable 形式の prefix が含まれることを確認
    // bodyHash 経路の legacy 形式 `_<8hex>_<8hex>` または debuggable prefix 形式
    // のいずれか（どちらも minify 形式 `_<8hex>` より長い）
    expect(css).toMatch(/\._[0-9a-f]{8}_[0-9a-f]{8}|\._[a-z0-9-]+__[0-9a-f]{8}/);
  });

  it('(c) NODE_ENV=production + デフォルト app() → minify 形式', () => {
    process.env.NODE_ENV = 'production';
    const doc = app();
    const tpl = createStyleTemplate({ properties: { color: 'red' } });
    doc.exportTo(div({ css: tpl }, 'hello'), tmpDir);
    const css = readCss();
    const cssClasses = css.match(/\._[a-z0-9_-]+/g) ?? [];
    expect(cssClasses.length).toBeGreaterThan(0);
    for (const c of cssClasses) {
      expect(c).toMatch(/^\._[0-9a-f]{8}$/);
    }
  });

  it('(d) NODE_ENV=production + 明示 minifyClassNames: false → debuggable 形式（明示優先）', () => {
    process.env.NODE_ENV = 'production';
    const doc = app({ cssConfig: new CssConfig({ minifyClassNames: false }) });
    const tpl = createStyleTemplate({ properties: { color: 'red' } });
    doc.exportTo(div({ css: tpl }, 'hello'), tmpDir);
    const css = readCss();
    // bodyHash 経路の legacy 形式 `_<8hex>_<8hex>` または debuggable prefix 形式
    // のいずれか（どちらも minify 形式 `_<8hex>` より長い）
    expect(css).toMatch(/\._[0-9a-f]{8}_[0-9a-f]{8}|\._[a-z0-9-]+__[0-9a-f]{8}/);
  });
});
