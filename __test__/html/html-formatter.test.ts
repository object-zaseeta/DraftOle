/**
 * Task 3: HTMLFormatter テスト
 *
 * minified HTMLを4スペースインデント付きの整形済みHTMLに変換する
 * Requirements: 6.1
 */
import { describe, it, expect } from 'vitest';
import { HTMLFormatter } from '../../src/html/utils/html-formatter.js';

describe('HTMLFormatter', () => {
  describe('format()', () => {
    it('単一の自己終了タグをそのまま返す', () => {
      const result = HTMLFormatter.format('<br>');
      expect(result).toBe('<br>');
    });

    it('単一のペアタグをそのまま返す', () => {
      const result = HTMLFormatter.format('<div></div>');
      expect(result).toBe('<div></div>');
    });

    it('ペアタグとテキスト内容をそのまま返す', () => {
      const result = HTMLFormatter.format('<p>Hello</p>');
      expect(result).toBe('<p>Hello</p>');
    });

    it('ネストしたタグに4スペースインデントを追加する', () => {
      const input = '<div><p>Hello</p></div>';
      const expected = '<div>\n    <p>Hello</p>\n</div>';
      expect(HTMLFormatter.format(input)).toBe(expected);
    });

    it('複数の子要素にインデントを付与する', () => {
      const input = '<div><p>A</p><p>B</p></div>';
      const expected = '<div>\n    <p>A</p>\n    <p>B</p>\n</div>';
      expect(HTMLFormatter.format(input)).toBe(expected);
    });

    it('深いネストに正しいインデントを付与する', () => {
      const input = '<div><ul><li>Item</li></ul></div>';
      const expected = '<div>\n    <ul>\n        <li>Item</li>\n    </ul>\n</div>';
      expect(HTMLFormatter.format(input)).toBe(expected);
    });

    it('3段階ネストのインデントが正しい', () => {
      const input = '<div><section><p>Deep</p></section></div>';
      const expected = '<div>\n    <section>\n        <p>Deep</p>\n    </section>\n</div>';
      expect(HTMLFormatter.format(input)).toBe(expected);
    });

    it('属性付きタグを正しく処理する', () => {
      const input = '<div class="container"><p id="main">Text</p></div>';
      const expected = '<div class="container">\n    <p id="main">Text</p>\n</div>';
      expect(HTMLFormatter.format(input)).toBe(expected);
    });

    it('自己終了タグを子要素として正しくインデントする', () => {
      const input = '<div><br><hr></div>';
      const expected = '<div>\n    <br>\n    <hr>\n</div>';
      expect(HTMLFormatter.format(input)).toBe(expected);
    });

    it('空文字列を返す', () => {
      expect(HTMLFormatter.format('')).toBe('');
    });

    it('テキストのみの入力をそのまま返す', () => {
      expect(HTMLFormatter.format('Hello World')).toBe('Hello World');
    });

    it('連続するトップレベル要素を改行で分離する', () => {
      const input = '<p>A</p><p>B</p>';
      const expected = '<p>A</p>\n<p>B</p>';
      expect(HTMLFormatter.format(input)).toBe(expected);
    });

    it('空のネストしたタグにインデントを付与する', () => {
      const input = '<div><span></span></div>';
      const expected = '<div>\n    <span></span>\n</div>';
      expect(HTMLFormatter.format(input)).toBe(expected);
    });

    it('input要素を含むフォームを正しく整形する', () => {
      const input = '<form><label>Name</label><input></form>';
      const expected = '<form>\n    <label>Name</label>\n    <input>\n</form>';
      expect(HTMLFormatter.format(input)).toBe(expected);
    });
  });
});
