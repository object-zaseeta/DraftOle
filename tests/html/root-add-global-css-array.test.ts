/**
 * Requirement 6: グローバルCSSの一括登録 - コンストラクタ css 配列
 *
 * 6.1: Root API accepts array of GlobalCss values via constructor option
 * 6.2: When array is passed, all entries registered in order
 * 6.3: Single-entry array form works correctly
 * 6.4: Empty array is accepted as a no-op without raising an error
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import { div } from '../../src/html/tags/factories.js';
import { rule, all, tag } from '../../src/css/variables/global-dsl.js';

describe('Requirement 6: css コンストラクタオプション 配列登録', () => {

  // 6.2: 配列の全エントリが登録される
  describe('6.2: 配列渡しで全エントリが順番通り登録される', () => {
    it('配列の全CSSエントリがCSS出力に含まれる', () => {
      const root = new Root({
        css: [tag('a', { color: 'red' }), tag('b', { color: 'blue' })],
      });
      const css = root.collectCssStyleString();
      expect(css).toContain('color: red');
      expect(css).toContain('color: blue');
    });

    it('配列のエントリが順番通りに出力される（先頭エントリが後続エントリより前に現れる）', () => {
      const root = new Root({
        css: [rule('a', { color: 'red' }), rule('b', { color: 'blue' })],
      });
      const css = root.collectCssStyleString();
      const idxFirst = css.indexOf('a {');
      const idxSecond = css.indexOf('b {');
      expect(idxFirst).toBeGreaterThanOrEqual(0);
      expect(idxSecond).toBeGreaterThanOrEqual(0);
      expect(idxFirst).toBeLessThan(idxSecond);
    });

    it('3つ以上のエントリを含む配列でも順番が保たれる', () => {
      const root = new Root({
        css: [
          rule(':root', { '--color': 'red' }),
          all({ boxSizing: 'border-box' }),
          rule('html, body', { height: '100%' }),
        ],
      });
      const css = root.collectCssStyleString();
      const idx1 = css.indexOf(':root {');
      const idx2 = css.indexOf('* {');
      const idx3 = css.indexOf('html, body {');
      expect(idx1).toBeLessThan(idx2);
      expect(idx2).toBeLessThan(idx3);
    });
  });

  // 6.3: 単一エントリ配列
  describe('6.3: 単一エントリ配列形式', () => {
    it('単一エントリ配列を渡しても正常動作する', () => {
      const root = new Root({ css: [rule('.a', { margin: '0' })] });
      const css = root.collectCssStyleString();
      expect(css).toContain('margin: 0');
    });

    it('複数エントリ配列で全エントリが出力される', () => {
      const root = new Root({
        css: [
          rule('a', { color: 'red' }),
          rule('b', { color: 'blue' }),
          rule('c', { color: 'green' }),
        ],
      });
      const css = root.collectCssStyleString();
      expect(css).toContain('a {');
      expect(css).toContain('b {');
      expect(css).toContain('c {');
    });

    it('配列順が出力順を決定する', () => {
      const root2 = new Root({
        css: [rule('a', { color: 'red' }), rule('b', { color: 'blue' })],
      });
      const css = root2.collectCssStyleString();
      const idxFirst = css.indexOf('a {');
      const idxSecond = css.indexOf('b {');
      expect(idxFirst).toBeLessThan(idxSecond);
    });
  });

  // 6.4: 空配列はno-op
  describe('6.4: 空配列はno-op', () => {
    it('空配列を渡してもエラーが発生しない', () => {
      expect(() => new Root({ css: [] })).not.toThrow();
    });

    it('空配列を渡した後のCSS出力は空文字列', () => {
      const root = new Root({ css: [] });
      const css = root.collectCssStyleString();
      expect(css).toBe('');
    });

    it('css オプション省略時も空文字列', () => {
      const root = new Root();
      const css = root.collectCssStyleString();
      expect(css).toBe('');
    });

    it('空配列と要素CSSを組み合わせても要素CSSは正常に出力される', () => {
      const root = new Root({ css: [] });
      const el = div().padding('10px');
      root.addChild(el);
      const css = root.collectCssStyleString();
      expect(css).toContain('padding: 10px');
    });
  });

  // 6.1: 配列オプションのAPI存在確認
  describe('6.1: 配列オプションのAPIが利用可能', () => {
    it('配列形式でcssオプションが渡せる', () => {
      const root = new Root({ css: [rule('a', { color: 'red' })] });
      const css = root.collectCssStyleString();
      expect(css).toContain('color: red');
    });

    it('複数エントリの配列が正しく処理される', () => {
      const root = new Root({
        css: [rule('a', { color: 'red' }), rule('b', { color: 'blue' })],
      });
      const css = root.collectCssStyleString();
      expect(css).toContain('color: red');
      expect(css).toContain('color: blue');
    });
  });

  // グローバルCSSとスコープCSSの順序保証
  describe('グローバルCSSとスコープCSSの順序', () => {
    it('配列で追加したグローバルCSSはスコープCSSより前に出力される', () => {
      const root = new Root({
        css: [all({ margin: '0' }), tag('html', { fontSize: '16px' })],
      });
      const el = div().padding('24px');
      root.addChild(el);
      const css = root.collectCssStyleString();
      const globalIdx = css.indexOf('margin: 0');
      const scopedIdx = css.indexOf('padding: 24px');
      expect(globalIdx).toBeGreaterThanOrEqual(0);
      expect(scopedIdx).toBeGreaterThanOrEqual(0);
      expect(globalIdx).toBeLessThan(scopedIdx);
    });
  });
});
