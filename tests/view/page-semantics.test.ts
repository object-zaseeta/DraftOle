import { describe, expect, it } from 'vitest';
import { h2 } from '../../src/html/tags/index.js';
import { page } from '../../src/view/page.js';
import {
  Button,
  Heading,
  Image,
  Link,
  Section,
  Text,
} from '../../src/view/primitives.js';

describe('semantic マッピング: View → semantic HTML', () => {
  it('Section() を page() に渡した出力に <section が含まれる', () => {
    const output = page(Section()).render();
    expect(output).toContain('<section');
  });

  it('Heading(1, "x") の出力に <h1>x</h1> が含まれる', () => {
    expect(Heading(1, 'x').render()).toContain('<h1>x</h1>');
  });

  it('Heading(3, "y") の出力に <h3>y</h3> が含まれる', () => {
    expect(Heading(3, 'y').render()).toContain('<h3>y</h3>');
  });

  it('Heading(6, "z") の出力に <h6>z</h6> が含まれる', () => {
    expect(Heading(6, 'z').render()).toContain('<h6>z</h6>');
  });

  it('Link({ href: "/a" }, Text("x")) の出力に <a href="/a"> が含まれる', () => {
    expect(Link({ href: '/a' }, Text('x')).render()).toContain('<a href="/a">');
  });

  it('Link target="_blank" 既定で rel="noopener noreferrer" が付与される', () => {
    const output = Link({ href: '/a', target: '_blank' }, Text('x')).render();
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('Link rel 明示時は既定 rel で上書きされない', () => {
    const output = Link(
      { href: '/a', target: '_blank', rel: 'author' },
      Text('x'),
    ).render();
    expect(output).toContain('rel="author"');
    expect(output).not.toContain('noopener');
  });

  it('Button({ type: "submit" }) の出力に <button type="submit"> が含まれる', () => {
    expect(Button({ type: 'submit' }, Text('x')).render()).toContain('<button type="submit">');
  });

  it('Button(undefined) の出力に <button type="button"> が含まれる', () => {
    expect(Button(undefined, Text('x')).render()).toContain('<button type="button">');
  });

  it('Image("/a.png", "図") の出力に alt="図" が含まれる', () => {
    expect(Image('/a.png', '図').render()).toContain('alt="図"');
  });
});

// 型レベル契約: 以下の関数は実行せず、tsc が `@ts-expect-error` を消費することを検証する。
// 実行すると runtime エラーになるため、テストでは呼び出しを行わない。
function _typeOnlyContractChecks(): void {
  // @ts-expect-error -- 7 は HeadingLevel に含まれない
  Heading(7, 'x');
  // @ts-expect-error -- 0 は HeadingLevel に含まれない
  Heading(0, 'x');
  // @ts-expect-error -- alt 引数省略は不可
  Image('/a.png');
  // @ts-expect-error -- href 省略は不可
  Link({}, Text('x'));
}

describe('型レベル契約: 不正引数はコンパイルエラーになる', () => {
  it('@ts-expect-error チェックが tsc で消費される（型関数の存在のみ確認）', () => {
    expect(typeof _typeOnlyContractChecks).toBe('function');
  });
});

describe('View プリミティブと HTML DSL の共存 E2E', () => {
  it('完全な page を render し、必要要素が全て含まれる', () => {
    const output = page(
      Section(
        Heading(1, 'Title'),
        Text('Lead'),
        Link({ href: '/' }, Text('home')),
        Button(undefined, Text('CTA')),
        Image('/a.png', '図'),
      ),
      { lang: 'ja', title: 'T', description: 'D' },
    ).render();

    expect(output).toMatch(/<html[^>]*lang="ja"/);
    expect(output).toContain('<title>T</title>');
    expect(output).toContain('content="D"');
    expect(output).toContain('name="description"');
    expect(output).toContain('<section');
    expect(output).toContain('<h1>Title</h1>');
    expect(output).toContain('<a href="/"');
    expect(output).toContain('<button type="button"');
    expect(output).toContain('<img');
    expect(output).toContain('alt="図"');
  });

  it('View プリミティブと HTML DSL が同一ページで混在描画される', () => {
    const output = page(
      Section(h2('raw'), Heading(2, 'wrapped')),
    ).render();
    expect(output).toContain('<h2>raw</h2>');
    expect(output).toContain('<h2>wrapped</h2>');
  });
});
