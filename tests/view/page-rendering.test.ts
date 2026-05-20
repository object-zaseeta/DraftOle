import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hstack, vstack } from '../../src/html/layout/layout-factories.js';
import { div } from '../../src/html/tags/index.js';
import { HStack, Image, Section, Text, VStack } from '../../src/view/primitives.js';
import { page } from '../../src/view/page.js';

function listFilesRecursive(dir: string): string[] {
  const result: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      result.push(...listFilesRecursive(full));
    } else {
      result.push(full);
    }
  }
  return result;
}

describe('modifier CSS 出力: 各 modifier が <style> タグに正しい CSS を生成する', () => {
  it('.padding(24) → style タグに padding: 24px が含まれる', () => {
    const output = page(VStack().padding(24)).render();
    expect(output).toContain('<style>');
    expect(output).toContain('padding: 24px');
  });

  it('.frame({ width: 700, maxWidth: Infinity }) → width:700px かつ max-width:100% が含まれる', () => {
    const output = page(VStack().frame({ width: 700, maxWidth: Infinity })).render();
    expect(output).toContain('width: 700px');
    expect(output).toContain('max-width: 100%');
  });

  it('.background("#f5f5f5") → background に #f5f5f5 が含まれる', () => {
    const output = page(VStack().background('#f5f5f5')).render();
    expect(output).toContain('#f5f5f5');
  });

  it('.font({ size: "18px", weight: "700" }) → font-size と font-weight が含まれる', () => {
    const output = page(VStack().font({ size: '18px', weight: '700' })).render();
    expect(output).toContain('font-size: 18px');
    expect(output).toContain('font-weight: 700');
  });

  it('.foregroundStyle("#333") → color に #333 が含まれる', () => {
    const output = page(VStack().foregroundStyle('#333')).render();
    expect(output).toContain('color: #333');
  });

  it('.cornerRadius("8px") → border-radius: 8px が含まれる', () => {
    const output = page(VStack().cornerRadius('8px')).render();
    expect(output).toContain('border-radius: 8px');
  });
});

describe('page レンダリング: HTML 構造・CSS 収集・semantic 要素', () => {
  it('render() 出力に <html, <head, <body が含まれる', () => {
    const output = page(Section()).render();
    expect(output).toContain('<html');
    expect(output).toContain('<head');
    expect(output).toContain('<body');
  });

  it('Section() が <section 要素を出力する', () => {
    const output = page(Section()).render();
    expect(output).toContain('<section');
  });

  it('Image(src, alt) が alt 属性付き <img を出力する', () => {
    const output = page(Image('/logo.png', 'ロゴ')).render();
    expect(output).toContain('<img');
    expect(output).toContain('alt="ロゴ"');
    expect(output).toContain('src="/logo.png"');
  });

  it('Text(content) が <p 要素を出力する', () => {
    const output = page(Text('Hello')).render();
    expect(output).toContain('<p');
    expect(output).toContain('Hello');
  });

  it('VStack().padding() で modifier チェーンが正常動作し CSS が render() 出力に含まれる', () => {
    const stack = VStack().padding('16px');
    const output = page(stack).render();
    expect(output).toContain('<style>');
    expect(output).toContain('padding');
  });

  it('HStack().padding() で modifier チェーンが正常動作し CSS が render() 出力に含まれる', () => {
    const stack = HStack().padding('8px');
    const output = page(stack).render();
    expect(output).toContain('<style>');
    expect(output).toContain('padding');
  });

  it('hstack() を直接呼び出しても正常動作する（後方互換）', () => {
    const el = hstack({ spacing: 8 }, div());
    expect(el.render()).toContain('<div');
  });

  it('vstack() を直接呼び出しても正常動作する（後方互換）', () => {
    const el = vstack({ spacing: 4 }, div());
    expect(el.render()).toContain('<div');
  });

  it('CSS がない場合 render() に <style タグが含まれない', () => {
    const output = page(div()).render();
    expect(output).not.toContain('<style>');
  });
});

describe('文書構造リグレッション: doctype / lang / description meta', () => {
  it('page(Section()).render() 出力に doctype 宣言が含まれる', () => {
    const output = page(Section()).render();
    expect(output.toLowerCase()).toContain('<!doctype');
  });

  it('PageOptions.lang を渡すと <html lang="ja"> が出力される', () => {
    const output = page(Section(), { lang: 'ja' }).render();
    expect(output).toMatch(/<html[^>]*lang="ja"/);
  });

  it('PageOptions.description を渡すと description meta が出力される', () => {
    const output = page(Section(), { description: 'D' }).render();
    expect(output).toMatch(/<meta[^>]*name="description"[^>]*content="D"|<meta[^>]*content="D"[^>]*name="description"/);
  });

  it('description 未指定時は description meta が出力されない', () => {
    const output = page(Section()).render();
    expect(output).not.toContain('name="description"');
  });
});

describe('runtime 不在検証: render() 出力に prelude / JS が含まれない', () => {
  const FORBIDDEN = ['__draftole__', '<script', 'prelude', 'runtime'] as const;

  it('page(VStack()).render() に prelude / JS 痕跡が含まれない', () => {
    const output = page(VStack().padding(24).background('#f5f5f5')).render();
    for (const needle of FORBIDDEN) {
      expect(output).not.toContain(needle);
    }
  });

  it('page(Section()).render() に prelude / JS 痕跡が含まれない', () => {
    const output = page(Section()).render();
    for (const needle of FORBIDDEN) {
      expect(output).not.toContain(needle);
    }
  });

  it('複合 modifier ページ render() に prelude / JS 痕跡が含まれない', () => {
    const view = VStack()
      .padding(24)
      .frame({ width: 700, maxWidth: Infinity })
      .background('#f5f5f5')
      .font({ size: '18px', weight: '700' })
      .foregroundStyle('#333')
      .cornerRadius('8px');
    const output = page(view).render();
    for (const needle of FORBIDDEN) {
      expect(output).not.toContain(needle);
    }
  });

  it('Section / Image / Text を含む render() にも prelude / JS 痕跡が含まれない', () => {
    const output = page(
      Section(
        Image('/logo.png', 'ロゴ'),
        Text('Hello'),
      ),
    ).render();
    for (const needle of FORBIDDEN) {
      expect(output).not.toContain(needle);
    }
  });
});

describe('runtime 不在検証: page().export(tmpDir) 後に JS ファイルが存在しない', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'page-rendering-export-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('export() 後の出力ディレクトリに .js ファイルが 1 つも存在しない', () => {
    const view = VStack().padding(24).background('#f5f5f5');
    const outDir = join(tmpDir, 'out');
    page(view).export(outDir);

    const files = listFilesRecursive(outDir);
    expect(files.length).toBeGreaterThan(0);
    const jsFiles = files.filter((p) => p.endsWith('.js'));
    expect(jsFiles).toEqual([]);
  });

  it('export() 後の出力ディレクトリに runtime.js / app.js / script.js が存在しない', () => {
    const view = VStack(Text('content')).padding(16);
    const outDir = join(tmpDir, 'named');
    page(view).export(outDir);

    const files = listFilesRecursive(outDir).map((p) => p.split('/').pop() ?? '');
    expect(files).not.toContain('runtime.js');
    expect(files).not.toContain('app.js');
    expect(files).not.toContain('script.js');
  });

  it('複合 modifier ページ export() 後にも JS ファイルが存在しない', () => {
    const view = VStack()
      .padding(24)
      .frame({ width: 700, maxWidth: Infinity })
      .background('#f5f5f5')
      .font({ size: '18px', weight: '700' })
      .foregroundStyle('#333')
      .cornerRadius('8px');
    const outDir = join(tmpDir, 'composite');
    page(view).export(outDir);

    const jsFiles = listFilesRecursive(outDir).filter((p) => p.endsWith('.js'));
    expect(jsFiles).toEqual([]);
  });
});

describe('LP レベル複合テスト: modifier 連鎖でページ全体のスタイルが正しく出力される', () => {
  it('6 modifier 全連鎖の CSS プロパティが <style> タグ内に共存する', () => {
    const view = VStack()
      .padding(24)
      .frame({ width: 700, maxWidth: Infinity })
      .background('#f5f5f5')
      .font({ size: '18px', weight: '700' })
      .foregroundStyle('#333')
      .cornerRadius('8px');

    const output = page(view).render();

    expect(output).toContain('<style>');
    expect(output).toContain('padding: 24px');
    expect(output).toContain('width: 700px');
    expect(output).toContain('max-width: 100%');
    expect(output).toContain('#f5f5f5');
    expect(output).toContain('font-size: 18px');
    expect(output).toContain('font-weight: 700');
    expect(output).toContain('color: #333');
    expect(output).toContain('border-radius: 8px');

    // .css.styleManager を使わずに全修飾が記述されていることを確認
    // (テストコード内でstyleManagerを呼び出していない)
  });
});
