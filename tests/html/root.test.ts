/**
 * Task 4.5: Root ドキュメントルート要素のテスト
 *
 * Root要素は自身のタグを出力せず、子要素のレンダリング結果を連結して返す。
 * CSS出力モード（default/inline/external）の管理機能を持つ。
 * ツリー全体のCSS/JSコンテンツ収集スタブ（Phase 3/4接続点）を実装する。
 *
 * Requirements: 3.1, 3.7, 3.8, 3.9, 6.6
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import { HtmlTag } from '../../src/html/elements/html-tag.js';
import { PairType } from '../../src/html/elements/pair-type.js';
import { TextType } from '../../src/html/elements/text-type.js';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';
import type { HTMLTagProtocol } from '../../src/html/protocols/html-tag-protocol.js';

describe('Root ドキュメントルート要素', () => {
  // ── コンストラクタ (Req 3.1) ──

  describe('コンストラクタ', () => {
    it('tagType が "root" である (Req 3.1)', () => {
      const sut = new Root();
      expect(sut.tagType).toBe('root');
    });

    it('HtmlTag を継承している', () => {
      const sut = new Root();
      expect(sut).toBeInstanceOf(HtmlTag);
    });

    it('HTMLTagProtocol として使用できる', () => {
      const sut: HTMLTagProtocol = new Root();
      expect(sut.tagType).toBe('root');
      expect(typeof sut.render).toBe('function');
      expect(typeof sut.protoRender).toBe('function');
      expect(typeof sut.addChild).toBe('function');
      expect(typeof sut.addChildren).toBe('function');
    });

    it('初期状態で子要素が空である', () => {
      const sut = new Root();
      expect(sut.children).toEqual([]);
      expect(sut.children.length).toBe(0);
    });

    it('初期状態で属性が空である', () => {
      const sut = new Root();
      expect(sut.attributes).toEqual([]);
    });
  });

  // ── CSS出力モード管理 (Req 3.7) ──

  describe('CSS出力モード管理', () => {
    it('デフォルトのCSS出力モードは "default" である (Req 3.7)', () => {
      const sut = new Root();
      expect(sut.cssOutputMode).toBe('default');
    });

    it('CSS出力モードを "inline" に変更できる (Req 3.7)', () => {
      const sut = new Root();
      sut.cssOutputMode = 'inline';
      expect(sut.cssOutputMode).toBe('inline');
    });

    it('CSS出力モードを "external" に変更できる (Req 3.7)', () => {
      const sut = new Root();
      sut.cssOutputMode = 'external';
      expect(sut.cssOutputMode).toBe('external');
    });

    it('CSS出力モードを変更しても "default" に戻せる (Req 3.7)', () => {
      const sut = new Root();
      sut.cssOutputMode = 'inline';
      sut.cssOutputMode = 'default';
      expect(sut.cssOutputMode).toBe('default');
    });
  });

  // ── protoRender: Root自身のタグなし、子要素連結 (Req 6.6) ──

  describe('protoRender (minified出力)', () => {
    it('子要素が空の場合、空文字列を返す (Req 6.6)', () => {
      const sut = new Root();
      expect(sut.protoRender()).toBe('');
    });

    it('1つの子要素のレンダリング結果をそのまま返す (Req 6.6)', () => {
      const sut = new Root();
      const child = new PairType('div');
      sut.addChild(child);
      expect(sut.protoRender()).toBe('<div></div>');
    });

    it('複数の子要素のレンダリング結果を連結して返す (Req 6.6)', () => {
      const sut = new Root();
      const div = new PairType('div');
      const p = new PairType('p');
      sut.addChild(div);
      sut.addChild(p);
      expect(sut.protoRender()).toBe('<div></div><p></p>');
    });

    it('テキスト子要素のレンダリング結果を連結する (Req 6.6)', () => {
      const sut = new Root();
      const text = new TextType('Hello World');
      sut.addChild(text);
      expect(sut.protoRender()).toBe('Hello World');
    });

    it('ネストした子要素を正しくレンダリングする (Req 6.6)', () => {
      const sut = new Root();
      const div = new PairType('div');
      const p = new PairType('p');
      const text = new TextType('Content');
      p.addChild(text);
      div.addChild(p);
      sut.addChild(div);
      expect(sut.protoRender()).toBe('<div><p>Content</p></div>');
    });

    it('Root自身のタグは出力されない（子要素のみ） (Req 6.6)', () => {
      const sut = new Root();
      const h1 = new PairType('h1');
      const text = new TextType('Title');
      h1.addChild(text);
      sut.addChild(h1);
      const result = sut.protoRender();
      expect(result).not.toContain('<root');
      expect(result).not.toContain('</root>');
      expect(result).toBe('<h1>Title</h1>');
    });

    it('属性付き子要素を正しくレンダリングする', () => {
      const sut = new Root();
      const div = new PairType('div');
      div.addHtmlAttribute(HtmlAttribute.keyValue('id', 'app'));
      div.addHtmlAttribute(HtmlAttribute.className('container'));
      const p = new PairType('p');
      const text = new TextType('Hello');
      p.addChild(text);
      div.addChild(p);
      sut.addChild(div);
      expect(sut.protoRender()).toBe('<div id="app" class="container"><p>Hello</p></div>');
    });

    it('複数の異なるタグ種別の子要素を連結する', () => {
      const sut = new Root();
      const header = new PairType('header');
      const main = new PairType('main');
      const footer = new PairType('footer');
      const headerText = new TextType('Header');
      const mainText = new TextType('Main');
      const footerText = new TextType('Footer');
      header.addChild(headerText);
      main.addChild(mainText);
      footer.addChild(footerText);
      sut.addChildren([header, main, footer]);
      expect(sut.protoRender()).toBe(
        '<header>Header</header><main>Main</main><footer>Footer</footer>'
      );
    });
  });

  // ── render (整形済み出力) ──

  describe('render (整形済み出力)', () => {
    it('子要素が空の場合、空文字列を返す', () => {
      const sut = new Root();
      expect(sut.render()).toBe('');
    });

    it('テキスト子要素のみの場合、テキストをそのまま返す', () => {
      const sut = new Root();
      const text = new TextType('Hello');
      sut.addChild(text);
      expect(sut.render()).toBe('Hello');
    });

    it('ネストした子要素を整形して返す', () => {
      const sut = new Root();
      const div = new PairType('div');
      const p = new PairType('p');
      const text = new TextType('Content');
      p.addChild(text);
      div.addChild(p);
      sut.addChild(div);
      expect(sut.render()).toBe('<div>\n    <p>Content</p>\n</div>');
    });

    it('複数の子要素をそれぞれ整形して返す', () => {
      const sut = new Root();
      const div1 = new PairType('div');
      const text1 = new TextType('First');
      div1.addChild(text1);
      const div2 = new PairType('div');
      const text2 = new TextType('Second');
      div2.addChild(text2);
      sut.addChild(div1);
      sut.addChild(div2);
      expect(sut.render()).toBe('<div>First</div>\n<div>Second</div>');
    });
  });

  // ── CSS収集スタブ (Req 3.8) ──

  describe('CSSスタイル文字列収集スタブ', () => {
    it('子要素なしで空文字列を返す (Req 3.8)', () => {
      const sut = new Root();
      expect(sut.collectCssStyleString()).toBe('');
    });

    it('子要素があっても空文字列を返す（Phase 2スタブ） (Req 3.8)', () => {
      const sut = new Root();
      const div = new PairType('div');
      sut.addChild(div);
      expect(sut.collectCssStyleString()).toBe('');
    });

    it('ツリー全体の子要素からCSS収集を試みる（Phase 2は空） (Req 3.8)', () => {
      const sut = new Root();
      const div = new PairType('div');
      const p = new PairType('p');
      div.addChild(p);
      sut.addChild(div);
      expect(sut.collectCssStyleString()).toBe('');
    });
  });

  // ── JS収集スタブ (Req 3.9) ──

  describe('JavaScriptコンテンツ収集スタブ', () => {
    it('子要素なしで空文字列を返す (Req 3.9)', () => {
      const sut = new Root();
      expect(sut.collectJsContent()).toBe('');
    });

    it('子要素があっても空文字列を返す（Phase 2スタブ） (Req 3.9)', () => {
      const sut = new Root();
      const div = new PairType('div');
      sut.addChild(div);
      expect(sut.collectJsContent()).toBe('');
    });

    it('使用メソッドが空Setを返す (Req 3.9)', () => {
      const sut = new Root();
      const methods = sut.collectUsedMethods();
      expect(methods).toBeInstanceOf(Set);
      expect(methods.size).toBe(0);
    });

    it('子要素があっても使用メソッドが空Setを返す（Phase 2スタブ） (Req 3.9)', () => {
      const sut = new Root();
      const div = new PairType('div');
      sut.addChild(div);
      const methods = sut.collectUsedMethods();
      expect(methods).toBeInstanceOf(Set);
      expect(methods.size).toBe(0);
    });
  });

  // ── 子要素管理 ──

  describe('子要素管理', () => {
    it('addChild で子要素を追加できる', () => {
      const sut = new Root();
      const child = new PairType('div');
      sut.addChild(child);
      expect(sut.children.length).toBe(1);
      expect(sut.children[0]).toBe(child);
    });

    it('addChildren で複数子要素を一括追加できる', () => {
      const sut = new Root();
      const children = [
        new PairType('header'),
        new PairType('main'),
        new PairType('footer'),
      ];
      sut.addChildren(children);
      expect(sut.children.length).toBe(3);
      expect(sut.children[0]).toBe(children[0]);
      expect(sut.children[1]).toBe(children[1]);
      expect(sut.children[2]).toBe(children[2]);
    });

    it('追加順が保持される', () => {
      const sut = new Root();
      const first = new PairType('header');
      const second = new PairType('main');
      sut.addChild(first);
      sut.addChild(second);
      expect(sut.children[0]).toBe(first);
      expect(sut.children[1]).toBe(second);
    });
  });

  // ── renderJs() - JS統合出力 (Req 6.1, 6.2, 6.3, 6.4) ──

  describe('renderJs() - JS統合出力', () => {
    it('子要素が何もjQueryメソッドを使用していない場合、空文字列を返す (Req 6.4)', () => {
      const sut = new Root();
      const div = new PairType('div');
      sut.addChild(div);
      expect(sut.renderJs()).toBe('');
    });

    it('子要素がjQueryメソッドを使用している場合、ヘルパー + jsContentを返す (Req 6.3)', () => {
      const sut = new Root();
      const div = new PairType('div');
      div.jqm.text('Hello');
      sut.addChild(div);

      const result = sut.renderJs();

      // ヘルパー関数が含まれる
      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('text(value)');
      // JS文が含まれる（pathが空の場合は '.' のみ）
      expect(result).toContain("$('.').text('Hello')");
      // ヘルパーとjsContentが "\n\n" で区切られる
      expect(result).toContain('\n\n');
    });

    it('ヘルパーとjsContentの間に "\\n\\n" を挿入する (Req 6.3)', () => {
      const sut = new Root();
      const div = new PairType('div');
      div.jqm.addClass('active');
      sut.addChild(div);

      const result = sut.renderJs();
      const helperEnd = result.indexOf('}');
      const jsContentStart = result.indexOf("$('.').addClass('active')");

      expect(helperEnd).toBeGreaterThan(0);
      expect(jsContentStart).toBeGreaterThan(helperEnd);
      // ヘルパーとjsContentの間に "\n\n" が存在する
      const betweenContent = result.slice(helperEnd + 1, jsContentStart);
      expect(betweenContent).toContain('\n\n');
    });

    it('複数の子要素からメソッドとJSコンテンツを収集する (Req 6.1, 6.2)', () => {
      const sut = new Root();

      const div1 = new PairType('div');
      div1.jqm.text('Hello');

      const div2 = new PairType('div');
      div2.jqm.addClass('active');

      const div3 = new PairType('div');
      div3.jqm.html('<b>Bold</b>');

      sut.addChildren([div1, div2, div3]);

      const result = sut.renderJs();

      // 使用された全メソッド（text, addClass, html）のヘルパーが含まれる
      expect(result).toContain('text(value)');
      expect(result).toContain('addClass(className)');
      expect(result).toContain('html(value)');

      // 各JS文が含まれる
      expect(result).toContain("text('Hello')");
      expect(result).toContain("addClass('active')");
      expect(result).toContain("html('<b>Bold</b>')");
    });

    it('ネストした子要素のJSを再帰的に収集する (Req 6.1, 6.2)', () => {
      const sut = new Root();

      const parent = new PairType('div');
      parent.jqm.css({ color: 'red' });

      const child = new PairType('p');
      child.jqm.text('Content');

      parent.addChild(child);
      sut.addChild(parent);

      const result = sut.renderJs();

      // 親と子の両方のメソッドがヘルパーに含まれる
      expect(result).toContain('css(props)');
      expect(result).toContain('text(value)');

      // 親と子の両方のJS文が含まれる（スペース入り）
      expect(result).toContain("css({'color': 'red'})");
      expect(result).toContain("text('Content')");
    });

    it('usedMethodsが空でjsContentも空の場合、空文字列を返す (Req 6.4)', () => {
      const sut = new Root();
      expect(sut.renderJs()).toBe('');
    });
  });
});
