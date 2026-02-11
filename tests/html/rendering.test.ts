/**
 * Task 7.2: ファクトリ関数 → ツリー構築 → レンダリングの統合テスト
 *
 * ファクトリ関数で生成したタグをツリーとして組み立て、
 * render() / protoRender() で正しいHTMLが出力されることを検証する。
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.8
 */
import { describe, it, expect } from 'vitest';
import {
  div, p, span, h1, h2, h3, ul, li, a, strong, em,
  form, label, button, select, option,
  table, thead, tbody, tr, th, td,
  header, footer, nav, main, section, article, aside,
  img, br, hr, input,
  Text,
} from '../../src/html/tags/index.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import { Root } from '../../src/html/elements/root.js';
import { TextType } from '../../src/html/elements/text-type.js';

// ===========================================================================
// Req 8.1: 基本HTMLタグの生成・レンダリングテスト（ペア、自己終了、テキスト）
// ===========================================================================
describe('Req 8.1: 基本HTMLタグの生成・レンダリング統合テスト', () => {

  describe('ペアタグの生成とレンダリング', () => {
    it('div() が空の <div></div> をレンダリングする', () => {
      const tag = div();
      expect(tag.protoRender()).toBe('<div></div>');
    });

    it('p("テキスト") がテキスト付き <p> をレンダリングする', () => {
      const tag = p('テキスト');
      expect(tag.protoRender()).toBe('<p>テキスト</p>');
    });

    it('h1("見出し") が <h1> をレンダリングする', () => {
      const tag = h1('見出し');
      expect(tag.protoRender()).toBe('<h1>見出し</h1>');
    });

    it('span("インライン") が <span> をレンダリングする', () => {
      const tag = span('インライン');
      expect(tag.protoRender()).toBe('<span>インライン</span>');
    });

    it('strong("太字") と em("斜体") がそれぞれ正しくレンダリングされる', () => {
      expect(strong('太字').protoRender()).toBe('<strong>太字</strong>');
      expect(em('斜体').protoRender()).toBe('<em>斜体</em>');
    });
  });

  describe('自己終了タグの生成とレンダリング', () => {
    it('br() が <br> をレンダリングする', () => {
      expect(br().protoRender()).toBe('<br>');
    });

    it('hr() が <hr> をレンダリングする', () => {
      expect(hr().protoRender()).toBe('<hr>');
    });

    it('img({ src: "photo.jpg", alt: "写真" }) が属性付き <img> をレンダリングする', () => {
      const tag = img({ src: 'photo.jpg', alt: '写真' });
      expect(tag.protoRender()).toContain('src="photo.jpg"');
      expect(tag.protoRender()).toContain('alt="写真"');
      expect(tag.protoRender()).toMatch(/^<img\s/);
      expect(tag.protoRender()).toMatch(/>$/);
    });

    it('input({ type: "text" }) が <input> をレンダリングする', () => {
      const tag = input({ type: 'text' });
      expect(tag.protoRender()).toContain('type="text"');
    });
  });

  describe('テキストノードの生成とレンダリング', () => {
    it('Text("Hello") がテキストをそのまま返す', () => {
      expect(Text('Hello').protoRender()).toBe('Hello');
    });

    it('Text("") が空文字列を返す', () => {
      expect(Text('').protoRender()).toBe('');
    });

    it('Text() は HTMLタグを出力しない', () => {
      const text = Text('テキストのみ');
      expect(text.protoRender()).not.toContain('<');
      expect(text.protoRender()).not.toContain('>');
    });
  });
});

// ===========================================================================
// Req 8.2: ペアタグの子要素管理テスト（追加、一括追加）
// ===========================================================================
describe('Req 8.2: ペアタグの子要素管理', () => {

  describe('addChild による単一追加', () => {
    it('addChild で追加した子要素が追加順に保持される', () => {
      const container = div();
      container.addChild(p('1番目'));
      container.addChild(p('2番目'));
      container.addChild(p('3番目'));
      expect(container.children).toHaveLength(3);
      expect(container.protoRender()).toBe(
        '<div><p>1番目</p><p>2番目</p><p>3番目</p></div>'
      );
    });

    it('異なる型の子要素を混在して追加できる', () => {
      const container = div();
      container.addChild(h1('見出し'));
      container.addChild(Text('テキスト'));
      container.addChild(hr());
      container.addChild(p('段落'));
      expect(container.children).toHaveLength(4);
      expect(container.protoRender()).toBe(
        '<div><h1>見出し</h1>テキスト<hr><p>段落</p></div>'
      );
    });
  });

  describe('addChildren による一括追加', () => {
    it('addChildren で複数の子要素を一括追加できる', () => {
      const list = ul();
      list.addChildren([li('A'), li('B'), li('C')]);
      expect(list.children).toHaveLength(3);
      expect(list.protoRender()).toBe(
        '<ul><li>A</li><li>B</li><li>C</li></ul>'
      );
    });

    it('addChild と addChildren を混在して使用できる', () => {
      const container = div();
      container.addChild(p('最初'));
      container.addChildren([p('中間1'), p('中間2')]);
      container.addChild(p('最後'));
      expect(container.children).toHaveLength(4);
      expect(container.protoRender()).toBe(
        '<div><p>最初</p><p>中間1</p><p>中間2</p><p>最後</p></div>'
      );
    });
  });

  describe('宣言的APIでの子要素設定', () => {
    it('ファクトリ関数の引数で子要素を設定できる', () => {
      const tag = ul(li('項目1'), li('項目2'), li('項目3'));
      expect(tag.children).toHaveLength(3);
      expect(tag.protoRender()).toBe(
        '<ul><li>項目1</li><li>項目2</li><li>項目3</li></ul>'
      );
    });

    it('文字列引数は自動的にTextTypeでラップされる', () => {
      const tag = p('Hello', ' ', 'World');
      expect(tag.children).toHaveLength(3);
      for (const child of tag.children) {
        expect(child).toBeInstanceOf(TextType);
      }
    });
  });

  describe('自己終了タグの子要素管理', () => {
    it('SelfClosingType に子要素を追加しても無視される', () => {
      const image = img({ src: 'test.jpg' });
      image.addChild(Text('子要素'));
      expect(image.children).toHaveLength(0);
      expect(image.protoRender()).not.toContain('子要素');
    });
  });
});

// ===========================================================================
// Req 8.3: 属性システムテスト（Boolean, KeyValue, Custom, ARIA）
// ===========================================================================
describe('Req 8.3: 属性システムの統合テスト', () => {

  describe('Boolean属性', () => {
    it('checked属性がkeyのみ出力される', () => {
      const tag = input({ type: 'checkbox', checked: true });
      expect(tag.protoRender()).toContain('checked');
      expect(tag.protoRender()).not.toContain('checked=');
    });

    it('disabled属性がkeyのみ出力される', () => {
      const tag = input({ type: 'text', disabled: true });
      expect(tag.protoRender()).toContain('disabled');
      expect(tag.protoRender()).not.toContain('disabled=');
    });

    it('Boolean値falseの属性は出力されない', () => {
      const tag = input({ type: 'text', required: false });
      expect(tag.protoRender()).not.toContain('required');
    });

    it('命令的APIでBoolean属性を追加できる', () => {
      const tag = input({ type: 'text' });
      tag.addHtmlAttribute(HtmlAttribute.boolean('readonly'));
      expect(tag.protoRender()).toContain('readonly');
    });
  });

  describe('KeyValue属性', () => {
    it('id属性が key="value" 形式で出力される', () => {
      const tag = div({ id: 'main-content' });
      expect(tag.protoRender()).toContain('id="main-content"');
    });

    it('class属性が正しく出力される', () => {
      const tag = div({ class: 'container fluid' });
      expect(tag.protoRender()).toContain('class="container fluid"');
    });

    it('href属性がリンクに出力される', () => {
      const tag = a({ href: 'https://example.com' }, 'リンク');
      expect(tag.protoRender()).toContain('href="https://example.com"');
    });

    it('命令的APIでKeyValue属性を追加できる', () => {
      const tag = div();
      tag.addHtmlAttribute(HtmlAttribute.keyValue('id', 'test'));
      tag.addHtmlAttribute(HtmlAttribute.keyValue('class', 'box'));
      expect(tag.protoRender()).toContain('id="test"');
      expect(tag.protoRender()).toContain('class="box"');
    });

    it('複数の属性が同時に出力される', () => {
      const tag = a({ href: '/page', target: '_blank', rel: 'noopener' }, 'Link');
      const rendered = tag.protoRender();
      expect(rendered).toContain('href="/page"');
      expect(rendered).toContain('target="_blank"');
      expect(rendered).toContain('rel="noopener"');
    });
  });

  describe('Custom data-*属性', () => {
    it('data-*属性が data-name="value" 形式で出力される', () => {
      const tag = div({ 'data-theme': 'dark' });
      expect(tag.protoRender()).toContain('data-theme="dark"');
    });

    it('命令的APIでcustom属性を追加できる', () => {
      const tag = div();
      tag.addHtmlAttribute(HtmlAttribute.custom('id', '42'));
      expect(tag.protoRender()).toContain('data-id="42"');
    });

    it('複数のdata-*属性を同時に設定できる', () => {
      const tag = div({ 'data-x': '10', 'data-y': '20' });
      const rendered = tag.protoRender();
      expect(rendered).toContain('data-x="10"');
      expect(rendered).toContain('data-y="20"');
    });
  });

  describe('ARIA属性', () => {
    it('aria-label属性が出力される', () => {
      const tag = button();
      tag.addHtmlAttribute(HtmlAttribute.ariaLabel('閉じる'));
      expect(tag.protoRender()).toContain('aria-label="閉じる"');
    });

    it('aria-hidden属性が出力される', () => {
      const tag = span();
      tag.addHtmlAttribute(HtmlAttribute.ariaHidden(true));
      expect(tag.protoRender()).toContain('aria-hidden="true"');
    });

    it('aria-expanded属性が出力される', () => {
      const tag = div();
      tag.addHtmlAttribute(HtmlAttribute.ariaExpanded(false));
      expect(tag.protoRender()).toContain('aria-expanded="false"');
    });

    it('ARIA属性を宣言的APIで設定できる', () => {
      const tag = nav({ 'aria-label': 'メインナビ' });
      expect(tag.protoRender()).toContain('aria-label="メインナビ"');
    });
  });

  describe('属性値のHTMLエスケープ', () => {
    it('属性値中の特殊文字がエスケープされる', () => {
      const tag = div({ title: '<script>alert("XSS")</script>' });
      const rendered = tag.protoRender();
      expect(rendered).not.toContain('<script>');
      expect(rendered).toContain('&lt;script&gt;');
      expect(rendered).toContain('&quot;');
    });

    it('&記号がエスケープされる', () => {
      const tag = a({ href: '/search?q=a&b=c' }, 'Search');
      expect(tag.protoRender()).toContain('href="/search?q=a&amp;b=c"');
    });
  });
});

// ===========================================================================
// Req 8.4 + 8.8: 機能等価性テスト
// ===========================================================================
describe('Req 8.4 + 8.8: 機能等価性テスト', () => {

  describe('基本的なHTML構造のレンダリング', () => {
    it('div({ class: "test" }, p("Hello")).protoRender() が正しいHTMLを出力する', () => {
      const result = div({ class: 'test' }, p('Hello')).protoRender();
      expect(result).toBe('<div class="test"><p>Hello</p></div>');
    });

    it('div({ class: "test" }, p("Hello")).render() が整形済みHTMLを出力する', () => {
      const result = div({ class: 'test' }, p('Hello')).render();
      expect(result).toContain('<div class="test">');
      expect(result).toContain('<p>Hello</p>');
      expect(result).toContain('</div>');
    });

    it('ネストした構造が正しくレンダリングされる', () => {
      const result = div({ class: 'wrapper' },
        h1('タイトル'),
        p('本文テキスト'),
        ul(
          li('項目1'),
          li('項目2'),
          li('項目3')
        )
      );
      const html = result.protoRender();
      expect(html).toBe(
        '<div class="wrapper">' +
        '<h1>タイトル</h1>' +
        '<p>本文テキスト</p>' +
        '<ul><li>項目1</li><li>項目2</li><li>項目3</li></ul>' +
        '</div>'
      );
    });
  });

  describe('フォーム構造のレンダリング', () => {
    it('フォームが属性と子要素を含めて正しくレンダリングされる', () => {
      const result = form({ action: '/submit', method: 'post' },
        label('名前:'),
        input({ type: 'text', name: 'username', placeholder: '入力してください', required: true }),
        button({ type: 'submit' }, '送信')
      );
      const html = result.protoRender();
      expect(html).toContain('action="/submit"');
      expect(html).toContain('method="post"');
      expect(html).toContain('type="text"');
      expect(html).toContain('name="username"');
      expect(html).toContain('required');
      expect(html).toContain('type="submit"');
      expect(html).toContain('送信');
    });

    it('select + optionが正しくレンダリングされる', () => {
      const result = select({ name: 'color' },
        option({ value: 'red' }, '赤'),
        option({ value: 'blue' }, '青'),
        option({ value: 'green' }, '緑')
      );
      const html = result.protoRender();
      expect(html).toBe(
        '<select name="color">' +
        '<option value="red">赤</option>' +
        '<option value="blue">青</option>' +
        '<option value="green">緑</option>' +
        '</select>'
      );
    });
  });

  describe('テーブル構造のレンダリング', () => {
    it('テーブルがヘッダー・ボディ・行・セルを含めて正しくレンダリングされる', () => {
      const result = table(
        thead(
          tr(th('Name'), th('Age'))
        ),
        tbody(
          tr(td('Alice'), td('30')),
          tr(td('Bob'), td('25'))
        )
      );
      const html = result.protoRender();
      expect(html).toBe(
        '<table>' +
        '<thead><tr><th>Name</th><th>Age</th></tr></thead>' +
        '<tbody>' +
        '<tr><td>Alice</td><td>30</td></tr>' +
        '<tr><td>Bob</td><td>25</td></tr>' +
        '</tbody>' +
        '</table>'
      );
    });
  });

  describe('セマンティック構造のレンダリング', () => {
    it('ページレイアウトの基本構造が正しくレンダリングされる', () => {
      const result = div({ class: 'page' },
        header(nav(a({ href: '/' }, 'Home'))),
        main(
          section({ id: 'content' },
            article(h2('記事タイトル'), p('記事本文'))
          ),
          aside(p('サイドバー'))
        ),
        footer(p('Copyright 2026'))
      );
      const html = result.protoRender();
      expect(html).toContain('<header><nav><a href="/">Home</a></nav></header>');
      expect(html).toContain('<section id="content">');
      expect(html).toContain('<article><h2>記事タイトル</h2><p>記事本文</p></article>');
      expect(html).toContain('<aside><p>サイドバー</p></aside>');
      expect(html).toContain('<footer><p>Copyright 2026</p></footer>');
    });
  });

  describe('render()による整形済みHTML出力', () => {
    it('render()は改行とインデントを含む整形済みHTMLを返す', () => {
      const result = div(
        p('段落1'),
        p('段落2')
      );
      const rendered = result.render();
      const lines = rendered.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0]).toBe('<div>');
      expect(lines[1]).toMatch(/^\s{4}<p>段落1<\/p>$/);
      expect(lines[2]).toMatch(/^\s{4}<p>段落2<\/p>$/);
      expect(lines[3]).toBe('</div>');
    });

    it('深いネストのrender()が正しいインデントで出力される', () => {
      const result = div(
        ul(
          li('項目')
        )
      );
      const rendered = result.render();
      const lines = rendered.split('\n');
      expect(lines[0]).toBe('<div>');
      expect(lines[1]).toMatch(/^\s{4}<ul>/);
      expect(lines[lines.length - 1]).toBe('</div>');
    });
  });

  describe('Root要素の統合テスト', () => {
    it('Root要素が子要素のレンダリング結果を連結して返す', () => {
      const root = new Root();
      root.addChild(div({ class: 'app' }, h1('Hello'), p('World')));
      const html = root.protoRender();
      expect(html).toBe(
        '<div class="app"><h1>Hello</h1><p>World</p></div>'
      );
    });

    it('Root要素は自身のタグを出力しない', () => {
      const root = new Root();
      root.addChild(p('段落1'));
      root.addChild(p('段落2'));
      const html = root.protoRender();
      expect(html).not.toContain('<root');
      expect(html).not.toContain('</root');
      expect(html).toBe('<p>段落1</p><p>段落2</p>');
    });

    it('Root要素のCSS収集スタブが空文字列を返す', () => {
      const root = new Root();
      root.addChild(div(p('テスト')));
      expect(root.collectCssStyleString()).toBe('');
    });

    it('Root要素のJS収集スタブが空文字列を返す', () => {
      const root = new Root();
      root.addChild(div(p('テスト')));
      expect(root.collectJsContent()).toBe('');
    });
  });

  describe('宣言的APIと命令的APIの統合', () => {
    it('宣言的に構築したタグに命令的に子要素を追加できる', () => {
      const container = div({ class: 'container' }, h1('タイトル'));
      container.addChild(p('追加された段落'));
      expect(container.children).toHaveLength(2);
      const html = container.protoRender();
      expect(html).toBe(
        '<div class="container"><h1>タイトル</h1><p>追加された段落</p></div>'
      );
    });

    it('宣言的に構築したタグに命令的に属性を追加できる', () => {
      const container = div({ class: 'box' }, p('内容'));
      container.addHtmlAttribute(HtmlAttribute.keyValue('id', 'special'));
      const html = container.protoRender();
      expect(html).toContain('class="box"');
      expect(html).toContain('id="special"');
    });

    it('命令的に構築したツリーが宣言的と同等のHTMLを出力する', () => {
      // 宣言的
      const declarative = div({ class: 'test' }, p('Hello'));

      // 命令的
      const imperative = div();
      imperative.addHtmlAttribute(HtmlAttribute.className('test'));
      imperative.addChild(p('Hello'));

      expect(declarative.protoRender()).toBe(imperative.protoRender());
    });
  });

  describe('複雑な実用シナリオ', () => {
    it('ブログ記事のHTML構造をレンダリングできる', () => {
      const blogPost = article({ class: 'post' },
        header(
          h1('ブログタイトル'),
          p({ class: 'meta' }, 'Author: Taro')
        ),
        div({ class: 'content' },
          p('最初の段落です。'),
          h3('小見出し'),
          p('二番目の段落です。'),
          ul(
            li(strong('重要'), 'なポイント'),
            li(em('注意'), '事項')
          )
        ),
        footer(
          p(a({ href: '/comments' }, 'コメントを見る'))
        )
      );
      const html = blogPost.protoRender();
      expect(html).toContain('<article class="post">');
      expect(html).toContain('<h1>ブログタイトル</h1>');
      expect(html).toContain('class="meta"');
      expect(html).toContain('<strong>重要</strong>なポイント');
      expect(html).toContain('<em>注意</em>事項');
      expect(html).toContain('<a href="/comments">コメントを見る</a>');
      expect(html).toContain('</article>');
    });

    it('ナビゲーションバーをレンダリングできる', () => {
      const navbar = nav({ class: 'navbar' },
        a({ href: '/', class: 'brand' }, 'MySite'),
        ul({ class: 'nav-links' },
          li(a({ href: '/about' }, 'About')),
          li(a({ href: '/blog' }, 'Blog')),
          li(a({ href: '/contact' }, 'Contact'))
        )
      );
      const html = navbar.protoRender();
      expect(html).toBe(
        '<nav class="navbar">' +
        '<a href="/" class="brand">MySite</a>' +
        '<ul class="nav-links">' +
        '<li><a href="/about">About</a></li>' +
        '<li><a href="/blog">Blog</a></li>' +
        '<li><a href="/contact">Contact</a></li>' +
        '</ul>' +
        '</nav>'
      );
    });

    it('自己終了タグを含む混在構造をレンダリングできる', () => {
      const content = div(
        p('テキスト前'),
        br(),
        p('テキスト後'),
        hr(),
        img({ src: 'image.png', alt: '画像' })
      );
      const html = content.protoRender();
      expect(html).toContain('<p>テキスト前</p>');
      expect(html).toContain('<br>');
      expect(html).toContain('<p>テキスト後</p>');
      expect(html).toContain('<hr>');
      expect(html).toContain('<img');
    });
  });
});
