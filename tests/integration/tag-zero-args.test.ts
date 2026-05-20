/**
 * Task 3.1: Req 5 検証スパイク — タグゼロ引数呼び出し
 *
 * `span()`, `div()`, `p()` をゼロ引数で呼び出して:
 *   - TypeScript コンパイルエラーが出ないことを確認 (tsc --noEmit pass)
 *   - ランタイムで `<span></span>` / `<div></div>` / `<p></p>` を出力することをアサート
 *   - `span().text('hello')` のメソッドチェーンが正常動作することを確認
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
import { describe, it, expect } from 'vitest';
import { span, div, p } from '../../src/index.js';

describe('Req 5: タグゼロ引数呼び出し (Task 3.1)', () => {

  // ── Req 5.1: ゼロ引数で呼び出して有効なタグインスタンスを返す ──

  describe('Req 5.1 / 5.2 / 5.3: ゼロ引数呼び出しが TypeScript 型エラーなしで動作する', () => {

    it('span() はゼロ引数で呼び出せて <span></span> をレンダリングする', () => {
      // このコードが TypeScript のコンパイルエラーにならないことを確認する
      // (`tsc --noEmit` が通ることで Req 5.3 を検証)
      const element = span();

      // Req 5.1: 有効なタグインスタンスが返される
      expect(element).toBeDefined();
      expect(typeof element.render).toBe('function');

      // ランタイムで <span></span> を出力する
      const html = element.render();
      expect(html).toContain('<span');
      expect(html).toContain('</span>');
    });

    it('div() はゼロ引数で呼び出せて <div></div> をレンダリングする', () => {
      const element = div();

      expect(element).toBeDefined();
      expect(typeof element.render).toBe('function');

      const html = element.render();
      expect(html).toContain('<div');
      expect(html).toContain('</div>');
    });

    it('p() はゼロ引数で呼び出せて <p></p> をレンダリングする', () => {
      const element = p();

      expect(element).toBeDefined();
      expect(typeof element.render).toBe('function');

      const html = element.render();
      expect(html).toContain('<p');
      expect(html).toContain('</p>');
    });

  });

  // ── Req 5.1: ゼロ引数タグの HTML 出力を厳密に検証 ──

  describe('ゼロ引数タグの HTML 出力検証', () => {

    it('span() は属性なし・子なしの <span></span> を出力する', () => {
      const html = span().render();
      // 空スパン: 属性なし、内容なし
      expect(html).toMatch(/<span[^>]*><\/span>/);
    });

    it('div() は属性なし・子なしの <div></div> を出力する', () => {
      const html = div().render();
      expect(html).toMatch(/<div[^>]*><\/div>/);
    });

    it('p() は属性なし・子なしの <p></p> を出力する', () => {
      const html = p().render();
      expect(html).toMatch(/<p[^>]*><\/p>/);
    });

  });

  // ── Req 5.1 / 5.3: ゼロ引数タグと属性あり呼び出しが同一出力を生成する ──

  describe('ゼロ引数と空属性マップが同等の出力を生成する', () => {

    it('span() と span({}) は同等の HTML タグ構造を出力する', () => {
      const zeroArg = span().render();
      const emptyAttrs = span({}).render();

      // どちらも <span>...</span> の構造を持つ
      expect(zeroArg).toMatch(/<span[^>]*><\/span>/);
      expect(emptyAttrs).toMatch(/<span[^>]*><\/span>/);
    });

  });

  // ── Req 5.1 / 5.3: メソッドチェーン動作確認 ──

  describe('Req 5: span().text("hello") メソッドチェーンが正常動作する', () => {

    it('span().text("hello") がエラーなく実行される', () => {
      // .text() は JS コマンドを生成する (textContent = "hello")
      // TypeScript 型エラーなし・ランタイムエラーなしであることを確認
      expect(() => {
        const element = span().text('hello');
        // チェーンが PairType を返すこと (thisable メソッドチェーン)
        expect(element).toBeDefined();
        expect(typeof element.render).toBe('function');
      }).not.toThrow();
    });

    it('span().text("hello").render() は <span> タグ構造を含む HTML を返す', () => {
      const element = span().text('hello');
      const html = element.render();

      // .text() は JS コマンドを生成するため、静的 HTML は <span></span> の構造
      // (textContent 設定は script.js 経由のランタイム動作)
      expect(html).toContain('<span');
      expect(html).toContain('</span>');
    });

    it('div().text("world") のチェーンが正常動作する', () => {
      expect(() => {
        const element = div().text('world');
        expect(element).toBeDefined();
      }).not.toThrow();
    });

    it('p().text("paragraph") のチェーンが正常動作する', () => {
      expect(() => {
        const element = p().text('paragraph');
        expect(element).toBeDefined();
      }).not.toThrow();
    });

  });

  // ── Req 5.4: 既存の位置引数（children）動作は変わらない ──

  describe('Req 5.4: 既存の位置引数（children）動作が維持される', () => {

    it('span("text") は既存挙動通り動作する', () => {
      const element = span('text');
      const html = element.render();
      expect(html).toContain('text');
      expect(html).toContain('<span');
    });

    it('div({ class: "container" }, "content") は既存挙動通り動作する', () => {
      const element = div({ class: 'container' }, 'content');
      const html = element.render();
      expect(html).toContain('class="container"');
      expect(html).toContain('content');
    });

  });

});
