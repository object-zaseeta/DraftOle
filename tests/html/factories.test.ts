/**
 * Task 5.1: タグファクトリ関数のテスト
 *
 * 56個以上のペアタグ・自己終了タグ・テキストのDSLファクトリ関数が
 * 正しい型のインスタンスを返すことを検証する。
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 10.2
 */
import { describe, it, expect } from 'vitest';
import { PairType } from '../../src/html/elements/pair-type.js';
import { SelfClosingType } from '../../src/html/elements/self-closing-type.js';
import { TextType } from '../../src/html/elements/text-type.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import {
  // 基本
  html, head, body, div, p, span, script,
  // セマンティック
  header, footer, nav, main, section, article, aside, figure, figcaption,
  // テーブル
  table, thead, tbody, tfoot, tr, th, td, caption, colgroup,
  // リスト
  ul, ol, li, dl, dt, dd,
  // フォーム
  form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output,
  // テキスト装飾
  strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp,
  // 見出し
  h1, h2, h3, h4, h5, h6,
  // メディア
  video, audio, picture, canvas, svg,
  // インタラクティブ
  details, summary, dialog, iframe, noscript,
  // 自己終了
  br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr,
  // その他
  a, title, varTag,
  // テキスト
  Text,
} from '../../src/html/tags/index.js';

// ---------------------------------------------------------------------------
// Req 5.1: 56個以上のタグファクトリ関数をエクスポートする
// ---------------------------------------------------------------------------
describe('Task 5.1: タグファクトリ関数', () => {
  describe('Req 5.1: 56個以上のファクトリ関数が存在する', () => {
    it('すべてのペアタグファクトリが関数として存在する', () => {
      const pairFactories = [
        html, head, body, div, p, span, script,
        header, footer, nav, main, section, article, aside, figure, figcaption,
        table, thead, tbody, tfoot, tr, th, td, caption, colgroup,
        ul, ol, li, dl, dt, dd,
        form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output,
        strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp,
        h1, h2, h3, h4, h5, h6,
        video, audio, picture, canvas, svg,
        details, summary, dialog, iframe, noscript,
        a, title, varTag,
      ];
      for (const factory of pairFactories) {
        expect(typeof factory).toBe('function');
      }
    });

    it('すべての自己終了タグファクトリが関数として存在する', () => {
      const selfClosingFactories = [
        br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr,
      ];
      for (const factory of selfClosingFactories) {
        expect(typeof factory).toBe('function');
      }
    });

    it('Textファクトリが関数として存在する', () => {
      expect(typeof Text).toBe('function');
    });

    it('合計56個以上のファクトリ関数がエクスポートされている', () => {
      const allFactories = [
        html, head, body, div, p, span, script,
        header, footer, nav, main, section, article, aside, figure, figcaption,
        table, thead, tbody, tfoot, tr, th, td, caption, colgroup,
        ul, ol, li, dl, dt, dd,
        form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output,
        strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp,
        h1, h2, h3, h4, h5, h6,
        video, audio, picture, canvas, svg,
        details, summary, dialog, iframe, noscript,
        a, title, varTag,
        br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr,
        Text,
      ];
      expect(allFactories.length).toBeGreaterThanOrEqual(56);
    });
  });

  // ---------------------------------------------------------------------------
  // Req 5.2: ペアタグ用ファクトリがPairTypeインスタンスを返す
  // ---------------------------------------------------------------------------
  describe('Req 5.2: ペアタグファクトリがPairTypeを返す', () => {
    const pairTests: Array<[string, () => PairType, string]> = [
      // 基本
      ['html', html, 'html'],
      ['head', head, 'head'],
      ['body', body, 'body'],
      ['div', div, 'div'],
      ['p', p, 'p'],
      ['span', span, 'span'],
      ['script', script, 'script'],
      // セマンティック
      ['header', header, 'header'],
      ['footer', footer, 'footer'],
      ['nav', nav, 'nav'],
      ['main', main, 'main'],
      ['section', section, 'section'],
      ['article', article, 'article'],
      ['aside', aside, 'aside'],
      ['figure', figure, 'figure'],
      ['figcaption', figcaption, 'figcaption'],
      // テーブル
      ['table', table, 'table'],
      ['thead', thead, 'thead'],
      ['tbody', tbody, 'tbody'],
      ['tfoot', tfoot, 'tfoot'],
      ['tr', tr, 'tr'],
      ['th', th, 'th'],
      ['td', td, 'td'],
      ['caption', caption, 'caption'],
      ['colgroup', colgroup, 'colgroup'],
      // リスト
      ['ul', ul, 'ul'],
      ['ol', ol, 'ol'],
      ['li', li, 'li'],
      ['dl', dl, 'dl'],
      ['dt', dt, 'dt'],
      ['dd', dd, 'dd'],
      // フォーム
      ['form', form, 'form'],
      ['label', label, 'label'],
      ['button', button, 'button'],
      ['select', select, 'select'],
      ['option', option, 'option'],
      ['optgroup', optgroup, 'optgroup'],
      ['textarea', textarea, 'textarea'],
      ['fieldset', fieldset, 'fieldset'],
      ['legend', legend, 'legend'],
      ['datalist', datalist, 'datalist'],
      ['output', output, 'output'],
      // テキスト装飾
      ['strong', strong, 'strong'],
      ['em', em, 'em'],
      ['b', b, 'b'],
      ['i', i, 'i'],
      ['u', u, 'u'],
      ['s', s, 's'],
      ['mark', mark, 'mark'],
      ['small', small, 'small'],
      ['sub', sub, 'sub'],
      ['sup', sup, 'sup'],
      ['code', code, 'code'],
      ['pre', pre, 'pre'],
      ['blockquote', blockquote, 'blockquote'],
      ['q', q, 'q'],
      ['cite', cite, 'cite'],
      ['abbr', abbr, 'abbr'],
      ['address', address, 'address'],
      ['time', time, 'time'],
      ['kbd', kbd, 'kbd'],
      ['samp', samp, 'samp'],
      // 見出し
      ['h1', h1, 'h1'],
      ['h2', h2, 'h2'],
      ['h3', h3, 'h3'],
      ['h4', h4, 'h4'],
      ['h5', h5, 'h5'],
      ['h6', h6, 'h6'],
      // メディア
      ['video', video, 'video'],
      ['audio', audio, 'audio'],
      ['picture', picture, 'picture'],
      ['canvas', canvas, 'canvas'],
      ['svg', svg, 'svg'],
      // インタラクティブ
      ['details', details, 'details'],
      ['summary', summary, 'summary'],
      ['dialog', dialog, 'dialog'],
      ['iframe', iframe, 'iframe'],
      ['noscript', noscript, 'noscript'],
      // その他
      ['a', a, 'a'],
      ['title', title, 'title'],
      ['varTag', varTag, 'var'],
    ];

    it.each(pairTests)(
      '%s() は PairType インスタンスを返す (tagType=%s)',
      (_name, factory, expectedTagType) => {
        const result = factory();
        expect(result).toBeInstanceOf(PairType);
        expect(result.tagType).toBe(expectedTagType);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Req 5.3: 自己終了タグ用ファクトリがSelfClosingTypeインスタンスを返す
  // ---------------------------------------------------------------------------
  describe('Req 5.3: 自己終了タグファクトリがSelfClosingTypeを返す', () => {
    const selfClosingTests: Array<[string, () => SelfClosingType, string]> = [
      ['br', br, 'br'],
      ['hr', hr, 'hr'],
      ['img', img, 'img'],
      ['input', input, 'input'],
      ['meta', meta, 'meta'],
      ['link', link, 'link'],
      ['source', source, 'source'],
      ['track', track, 'track'],
      ['area', area, 'area'],
      ['col', col, 'col'],
      ['base', base, 'base'],
      ['embed', embed, 'embed'],
      ['wbr', wbr, 'wbr'],
    ];

    it.each(selfClosingTests)(
      '%s() は SelfClosingType インスタンスを返す (tagType=%s)',
      (_name, factory, expectedTagType) => {
        const result = factory();
        expect(result).toBeInstanceOf(SelfClosingType);
        expect(result.tagType).toBe(expectedTagType);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Req 5.4: Text()ファクトリがTextTypeインスタンスを返す
  // ---------------------------------------------------------------------------
  describe('Req 5.4: Text()ファクトリがTextTypeを返す', () => {
    it('Text()は文字列引数でTextTypeインスタンスを返す', () => {
      const result = Text('Hello World');
      expect(result).toBeInstanceOf(TextType);
      expect(result.content).toBe('Hello World');
      expect(result.tagType).toBe('text');
    });

    it('Text()は空文字列でもTextTypeを返す', () => {
      const result = Text('');
      expect(result).toBeInstanceOf(TextType);
      expect(result.content).toBe('');
    });

    it('Text()は特殊文字をエスケープしたTextTypeを返す (DF-3)', () => {
      const result = Text('Hello <b>World</b> & "Friends"');
      expect(result).toBeInstanceOf(TextType);
      expect(result.content).toBe('Hello &lt;b&gt;World&lt;/b&gt; &amp; &quot;Friends&quot;');
    });
  });

  // ---------------------------------------------------------------------------
  // Req 5.5: TypeScriptの型推論
  // ---------------------------------------------------------------------------
  describe('Req 5.5: TypeScriptの型推論による正しい戻り値型', () => {
    it('ペアタグファクトリの戻り値がPairType型である', () => {
      // TypeScriptコンパイル時の型チェックで保証
      // ランタイムではinstanceofで確認
      const d: PairType = div();
      const para: PairType = p();
      const heading: PairType = h1();
      expect(d).toBeInstanceOf(PairType);
      expect(para).toBeInstanceOf(PairType);
      expect(heading).toBeInstanceOf(PairType);
    });

    it('自己終了タグファクトリの戻り値がSelfClosingType型である', () => {
      const image: SelfClosingType = img();
      const linebreak: SelfClosingType = br();
      expect(image).toBeInstanceOf(SelfClosingType);
      expect(linebreak).toBeInstanceOf(SelfClosingType);
    });

    it('Textファクトリの戻り値がTextType型である', () => {
      const text: TextType = Text('content');
      expect(text).toBeInstanceOf(TextType);
    });
  });

  // ---------------------------------------------------------------------------
  // Req 5.6: src/html/tags/index.ts から一括エクスポート
  // ---------------------------------------------------------------------------
  describe('Req 5.6: tags/index.tsからの一括エクスポート', () => {
    it('ファクトリ関数がsrc/html/tags/index.tsからインポート可能', () => {
      // このテストファイル自体が tags/index.js からインポートしている
      // インポートが成功すること自体がテスト
      expect(div).toBeDefined();
      expect(img).toBeDefined();
      expect(Text).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Req 10.2: JavaScript予約語衝突の回避
  // ---------------------------------------------------------------------------
  describe('Req 10.2: JavaScript予約語と衝突するタグ名のサフィックス付与', () => {
    it('varTag()は<var>タグのPairTypeを返す', () => {
      const result = varTag();
      expect(result).toBeInstanceOf(PairType);
      expect(result.tagType).toBe('var');
    });
  });

  // ---------------------------------------------------------------------------
  // レンダリング基本検証（ファクトリの正当性確認）
  // ---------------------------------------------------------------------------
  describe('ファクトリで生成したタグの基本レンダリング', () => {
    it('ペアタグファクトリで生成したタグがprotoRender()で正しいHTMLを出力する', () => {
      const d = div();
      expect(d.protoRender()).toBe('<div></div>');
    });

    it('自己終了タグファクトリで生成したタグがprotoRender()で正しいHTMLを出力する', () => {
      const image = img();
      expect(image.protoRender()).toBe('<img>');
    });

    it('Textファクトリで生成したタグがprotoRender()でテキストを出力する', () => {
      const text = Text('Hello');
      expect(text.protoRender()).toBe('Hello');
    });

    it('ペアタグに子要素を追加してレンダリングできる', () => {
      const d = div();
      d.addChild(Text('Hello'));
      expect(d.protoRender()).toBe('<div>Hello</div>');
    });

    it('各ファクトリは毎回新しいインスタンスを返す', () => {
      const d1 = div();
      const d2 = div();
      expect(d1).not.toBe(d2);
    });
  });
});

// ===========================================================================
// Task 5.2: 宣言的API（属性マップ+子要素引数）と文字列自動ラップ
// Requirements: 5.7, 5.8
// ===========================================================================
describe('Task 5.2: 宣言的API', () => {

  // ---------------------------------------------------------------------------
  // Req 5.8: 文字列引数を自動的にTextTypeでラップ
  // ---------------------------------------------------------------------------
  describe('Req 5.8: 文字列自動ラップ', () => {
    it('ペアタグファクトリに文字列引数を渡すとTextTypeでラップされる', () => {
      const result = p('Hello World');
      expect(result).toBeInstanceOf(PairType);
      expect(result.children).toHaveLength(1);
      expect(result.children[0]).toBeInstanceOf(TextType);
      expect((result.children[0] as TextType).content).toBe('Hello World');
    });

    it('ペアタグファクトリに複数の文字列引数を渡すとそれぞれTextTypeでラップされる', () => {
      const result = p('Hello', ' ', 'World');
      expect(result.children).toHaveLength(3);
      for (const child of result.children) {
        expect(child).toBeInstanceOf(TextType);
      }
      expect(result.protoRender()).toBe('<p>Hello World</p>');
    });

    it('文字列とHTMLタグを混在して渡せる', () => {
      const result = p('前文 ', strong('重要'), ' 後文');
      expect(result.children).toHaveLength(3);
      expect(result.children[0]).toBeInstanceOf(TextType);
      expect(result.children[1]).toBeInstanceOf(PairType);
      expect(result.children[2]).toBeInstanceOf(TextType);
      expect(result.protoRender()).toBe('<p>前文 <strong>重要</strong> 後文</p>');
    });

    it('空文字列もTextTypeでラップされる', () => {
      const result = span('');
      expect(result.children).toHaveLength(1);
      expect(result.children[0]).toBeInstanceOf(TextType);
      expect((result.children[0] as TextType).content).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Req 5.7: 属性マップ + 子要素引数のオーバーロード
  // ---------------------------------------------------------------------------
  describe('Req 5.7: 属性マップ+子要素引数', () => {
    it('属性マップを第1引数に渡すと属性が設定される', () => {
      const result = div({ class: 'container', id: 'app' });
      expect(result).toBeInstanceOf(PairType);
      expect(result.attributes).toHaveLength(2);
      expect(result.protoRender()).toContain('class="container"');
      expect(result.protoRender()).toContain('id="app"');
    });

    it('属性マップ + 子要素を渡すと両方設定される', () => {
      const result = div({ class: 'container' }, h1('Title'), p('Body'));
      expect(result).toBeInstanceOf(PairType);
      expect(result.attributes).toHaveLength(1);
      expect(result.children).toHaveLength(2);
      expect(result.protoRender()).toBe(
        '<div class="container"><h1>Title</h1><p>Body</p></div>'
      );
    });

    it('属性マップなしで子要素のみを渡せる', () => {
      const result = div(h1('Title'), p('Body'));
      expect(result.attributes).toHaveLength(0);
      expect(result.children).toHaveLength(2);
      expect(result.protoRender()).toBe('<div><h1>Title</h1><p>Body</p></div>');
    });

    it('引数なしは空のタグを返す（後方互換）', () => {
      const result = div();
      expect(result.attributes).toHaveLength(0);
      expect(result.children).toHaveLength(0);
      expect(result.protoRender()).toBe('<div></div>');
    });

    it('Boolean属性true はboolean属性として出力される', () => {
      const result = input({ type: 'email', required: true });
      expect(result).toBeInstanceOf(SelfClosingType);
      expect(result.protoRender()).toContain('type="email"');
      expect(result.protoRender()).toContain('required');
    });

    it('Boolean属性false は属性を省略する', () => {
      const result = input({ type: 'text', disabled: false });
      expect(result.protoRender()).toContain('type="text"');
      expect(result.protoRender()).not.toContain('disabled');
    });

    it('data-* 属性はcustom属性として出力される', () => {
      const result = div({ 'data-theme': 'dark', 'data-id': '123' });
      expect(result.protoRender()).toContain('data-theme="dark"');
      expect(result.protoRender()).toContain('data-id="123"');
    });

    it('自己終了タグに属性マップを渡せる', () => {
      const result = img({ src: 'photo.jpg', alt: 'A photo', loading: 'lazy' });
      expect(result).toBeInstanceOf(SelfClosingType);
      expect(result.protoRender()).toContain('src="photo.jpg"');
      expect(result.protoRender()).toContain('alt="A photo"');
      expect(result.protoRender()).toContain('loading="lazy"');
    });

    it('宣言的APIのネスト構築が正しく動作する', () => {
      const result = div({ class: 'wrapper' },
        h1('タイトル'),
        ul(
          li('項目1'),
          li('項目2')
        )
      );
      expect(result.protoRender()).toBe(
        '<div class="wrapper"><h1>タイトル</h1><ul><li>項目1</li><li>項目2</li></ul></div>'
      );
    });

    it('フォーム構築の宣言的APIが正しく動作する', () => {
      const result = form({ action: '/submit', method: 'post' },
        label('Email:'),
        input({ type: 'email', placeholder: 'you@example.com', required: true }),
        button({ type: 'submit' }, '送信')
      );
      expect(result.protoRender()).toContain('action="/submit"');
      expect(result.protoRender()).toContain('method="post"');
      expect(result.protoRender()).toContain('type="email"');
      expect(result.protoRender()).toContain('required');
      expect(result.protoRender()).toContain('送信');
    });

    it('class属性の値はnormalizeClassNamesで正規化される', () => {
      const result = div({ class: 'foo  bar  foo' });
      // classは重複除去される
      expect(result.protoRender()).toBe('<div class="foo bar"></div>');
    });

    it('宣言的APIと命令的APIを併用できる', () => {
      const d = div({ class: 'initial' }, p('最初'));
      d.addChild(p('追加'));
      d.addHtmlAttribute(HtmlAttribute.keyValue('id', 'mixed'));
      expect(d.children).toHaveLength(2);
      expect(d.attributes).toHaveLength(2);
    });
  });
});
