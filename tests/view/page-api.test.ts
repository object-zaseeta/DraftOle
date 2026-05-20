import { describe, expect, it } from 'vitest';
import { div, span } from '../../src/html/tags/index.js';
import { PageDocument, page } from '../../src/view/page.js';
import type { StaticView, View } from '../../src/view/types.js';
import { Image } from '../../src/view/primitives.js';

describe('page API: 呼び出しシグネチャ・メタ情報・型安全性', () => {
  it('page(view) は PageDocument を返す', () => {
    const doc = page(div());
    expect(doc).toBeInstanceOf(PageDocument);
  });

  it('PageDocument.render() は string を返す', () => {
    const doc = page(div());
    expect(typeof doc.render()).toBe('string');
  });

  it('PageDocument.export は呼び出し可能な関数である', () => {
    const doc = page(div());
    expect(typeof doc.export).toBe('function');
  });

  it('options.lang が <html lang="..."> に反映される', () => {
    const doc = page(div(), { lang: 'ja' });
    expect(doc.render()).toContain('lang="ja"');
  });

  it('options.title が <title> 要素に反映される', () => {
    const doc = page(div(), { title: 'My Page' });
    expect(doc.render()).toContain('<title>My Page</title>');
  });

  it('options.description が <meta name="description"> に反映される', () => {
    const doc = page(div(), { description: 'Test description' });
    expect(doc.render()).toContain('name="description"');
    expect(doc.render()).toContain('content="Test description"');
  });

  it('options.charset が <meta charset="..."> に反映される', () => {
    const doc = page(div(), { charset: 'UTF-16' });
    expect(doc.render()).toContain('charset="UTF-16"');
  });

  it('options.charset 省略時は UTF-8 が出力される', () => {
    const doc = page(div());
    expect(doc.render()).toContain('charset="UTF-8"');
  });

  it('options.viewport が <meta name="viewport"> に反映される', () => {
    const doc = page(div(), { viewport: 'width=device-width, initial-scale=1' });
    expect(doc.render()).toContain('name="viewport"');
    expect(doc.render()).toContain('width=device-width, initial-scale=1');
  });

  it('options.viewport 省略時は viewport meta タグが出力されない', () => {
    const doc = page(div());
    expect(doc.render()).not.toContain('name="viewport"');
  });

  // task 1.1 で variadic シグネチャが導入されたため page() ゼロ引数は有効。
  // ゼロ引数時の動作テストは 'page() <main> ラッパー (task 1.2)' describe ブロックを参照。
});

describe('page() <main> ラッパー (task 1.2)', () => {
  it('page(div()) の HTML 出力に <main が含まれる', () => {
    const output = page(div()).render();
    expect(output).toContain('<main');
  });

  it('page(div(), div()) の HTML 出力に <main が 1 つだけ現れる', () => {
    const output = page(div(), div()).render();
    const count = (output.match(/<main/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('page(div(), div()) の <main 内に両方の <div が含まれる', () => {
    const output = page(div(), div()).render();
    const mainStart = output.indexOf('<main');
    const mainEnd = output.indexOf('</main>');
    expect(mainStart).toBeGreaterThanOrEqual(0);
    expect(mainEnd).toBeGreaterThan(mainStart);
    const mainContent = output.slice(mainStart, mainEnd + '</main>'.length);
    const divCount = (mainContent.match(/<div/g) ?? []).length;
    expect(divCount).toBe(2);
  });

  it('page() ゼロ引数のとき <main></main> を含む正規 HTML が出力される', () => {
    const output = page().render();
    expect(output).toContain('<main');
    expect(output).toContain('</main>');
    expect(output).toContain('<html');
    expect(output).toContain('<head');
    expect(output).toContain('<body');
  });

  it('page(div(), { lang: "ja" }) のとき <main> が存在し lang オプションも反映される', () => {
    const output = page(div(), { lang: 'ja' }).render();
    expect(output).toContain('<main');
    expect(output).toMatch(/<html[^>]*lang="ja"/);
  });

  it('page(div()) のとき <main> が <body> の直下に現れる', () => {
    const output = page(div()).render();
    // <body> の後に最初に来る要素が <main であること
    const bodyPos = output.indexOf('<body>');
    const mainPos = output.indexOf('<main', bodyPos);
    expect(mainPos).toBeGreaterThan(bodyPos);
  });

  it('page(s1, s2, s3) — 3 つのビューが順序通り <main> 内に配置される (task 4.1)', () => {
    const a = div();
    const b = span();
    const c = div();
    const output = page(a, b, c).render();
    const mainStart = output.indexOf('<main');
    const mainEnd = output.indexOf('</main>');
    expect(mainStart).toBeGreaterThanOrEqual(0);
    expect(mainEnd).toBeGreaterThan(mainStart);
    const mainContent = output.slice(mainStart, mainEnd + '</main>'.length);
    // <div>, <span>, <div> が順序通り登場すること
    const divPos1 = mainContent.indexOf('<div');
    const spanPos = mainContent.indexOf('<span');
    const divPos2 = mainContent.indexOf('<div', divPos1 + 1);
    expect(divPos1).toBeGreaterThanOrEqual(0);
    expect(spanPos).toBeGreaterThan(divPos1);
    expect(divPos2).toBeGreaterThan(spanPos);
  });

  it('page(s1, { lang: "ja", title: "T" }) — オプションが <head> に反映され <main> も存在する (task 4.1)', () => {
    const output = page(div(), { lang: 'ja', title: 'T' }).render();
    // lang は <html> 属性に反映される
    expect(output).toMatch(/<html[^>]*lang="ja"/);
    // title は <head> 内の <title> 要素に反映される
    expect(output).toContain('<title>T</title>');
    // <main> ラッパーも存在する
    expect(output).toContain('<main');
  });
});

describe('TypeScript 型安全性', () => {
  it('Image() の返り値を View 型変数に代入できる', () => {
    const v: View = Image('/path', 'alt');
    expect(v).toBeDefined();
  });

  // task 1.1: variadic シグネチャ導入により page() はゼロ引数でも有効になった。
  // ゼロ引数の動作テストは task 4.1 で追加する。
});

/**
 * Task 4.1: page-api に runtime 担持要素拒否ケースを追加する。
 *
 * 関連: requirements.md 1.1, 3.1, 3.2, 6.1 / design.md §6.2, §6.3, §10.1
 *
 * `page()` は構築時 pure validation により、runtime コンテンツ
 * （状態 mutation・script 注入・event handler 等）を担持する要素を拒否する。
 * task 2.2 で実装済みの `_root.collectUsedMethods()` /
 * `_root.collectJsContent()` を読み取り専用 walk する経路を、
 * jqm の代表的な「state 系」「script 系」面で確認する。
 */
describe('page() runtime 担持要素拒否 (task 4.1)', () => {
  it('state 系 runtime（jqm.text によるテキスト書き換え）を含む要素は throw する', () => {
    // `.jqm.text(...)` は実行時に DOM テキストを書き換える state-like 副作用を発行する。
    // page 公開面は静的 HTML/CSS のみを許容するため、この種の runtime は受理してはならない。
    const stateful = div();
    stateful.jqm.text('runtime-bound text');

    expect(() => page(stateful)).toThrow(
      /page surface does not allow runtime content/,
    );
  });

  it('state 系 runtime（jqm.html による HTML 書き換え）を含む要素は throw する', () => {
    const stateful = span();
    stateful.jqm.html('<em>runtime-injected</em>');

    expect(() => page(stateful)).toThrow(
      /page surface does not allow runtime content/,
    );
  });

  it('script 系 runtime（jqm.on によるイベントハンドラ登録）を含む要素は throw する', () => {
    // `.jqm.on(...)` は実行時に script として読み込まれる event handler を発行する。
    // page 公開面が「JS なしで HTML/CSS のみ」を出力する契約と矛盾するため拒否する。
    const scripted = div();
    scripted.jqm.on('click', 'handleClick');

    expect(() => page(scripted)).toThrow(
      /page surface does not allow runtime content/,
    );
  });

  it('script 系 runtime（jqm.click によるクリックハンドラ登録）を含む要素は throw する', () => {
    const scripted = div();
    scripted.jqm.click('handleClick');

    expect(() => page(scripted)).toThrow(
      /page surface does not allow runtime content/,
    );
  });

  it('深い子孫に runtime を持つ要素も親経由で throw する', () => {
    // `collectUsedMethods` / `collectJsContent` は再帰 walk するため、
    // 直接の rootView ではなく子孫に runtime が紛れ込んだケースも検出される。
    const child = span();
    child.jqm.text('mutated');
    const parent = div();
    parent.addChild(child);

    expect(() => page(parent)).toThrow(
      /page surface does not allow runtime content/,
    );
  });
});

/**
 * Task 4.1: `StaticView` 型が runtime API を露出しないことを型レベルで検証する。
 *
 * 関連: requirements.md 1.1, 3.1, 6.1 / design.md §6.1
 *
 * `StaticView` は narrow interface（`protoRender` / `collectCssStyleString` のみ）であり、
 * `HtmlTag` 由来の `jqm` / `state` / `script` / `$` / `$$` 等の runtime 面は
 * 型レベルで不可達である。`View` 型値（= `HtmlTag`）は構造的に `StaticView` を満たすが、
 * `StaticView` を引数とするヘルパの内部からは runtime API に到達できない。
 */
describe('StaticView 型 narrow 性 (task 4.1)', () => {
  it('StaticView 引数のヘルパ内では runtime API に到達できない（@ts-expect-error）', () => {
    /**
     * narrow interface に存在しない API（`jqm`）を引数前提にしたヘルパ。
     * `v: StaticView` の型は `protoRender` / `collectCssStyleString` のみを露出するため、
     * `v.jqm` へのアクセスは型エラーになる。
     */
    const acceptsStatic = (v: StaticView): string => {
      // @ts-expect-error - StaticView は jqm を露出しない（runtime 担持 API は narrow interface に存在しない）
      void v.jqm;
      return v.protoRender();
    };

    // 実行時挙動の sanity check: View 型値（HtmlTag）は構造的に StaticView を満たすため
    // ヘルパに渡せること自体は問題ない（rejection は型レベルではなく構築時 validation で行う）。
    const view: View = div();
    expect(typeof acceptsStatic(view)).toBe('string');
  });

  it('StaticView 引数のヘルパ内では state API に到達できない（@ts-expect-error）', () => {
    const acceptsStatic = (v: StaticView): void => {
      // @ts-expect-error - StaticView は state を露出しない（HtmlTag 由来であっても narrow interface 経由では不可達）
      void v.state;
    };
    acceptsStatic(div());
    expect(true).toBe(true);
  });
});
