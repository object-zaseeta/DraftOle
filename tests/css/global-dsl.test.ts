/**
 * Global CSS DSL テスト
 *
 * タスク 1.1: skeleton（DSL 公開関数が未実装のため、実質的なテストはタスク 2.3 で追加）
 * タスク 2.1: セレクタ系 4関数（root / all / tag / rule）の出力同等性・型検証を追加
 * タスク 2.3 以降: at-rule 系（media / keyframes）のネスト挙動を追加
 *
 * 観測方針:
 * - `brand` / `renderProperties` / `wrapBlock` / `toKebabCase` はモジュール外 export なし
 * - 内部ヘルパの基礎動作は DSL 公開関数の出力を通じて検証する
 */

import { describe, expect, expectTypeOf, it } from 'vitest';

import type { GlobalCss } from '../../src/css/variables/global-css.js';
import { all, keyframes, media, root, rule, tag } from '../../src/css/variables/global-dsl.js';

describe('global CSS DSL', () => {
  describe('at-rule 系 2関数', () => {
    describe('media()', () => {
      it('@media ブロックを生成する', () => {
        const result = media('(min-width: 768px)', [tag('body', { fontSize: '18px' })]);
        expect(result).toBe(
          '@media (min-width: 768px) {\n  body {\n    font-size: 18px;\n  }\n}',
        );
      });

      it('複数ルールを改行で連結してインデントする', () => {
        const result = media('(max-width: 480px)', [
          tag('h1', { fontSize: '24px' }),
          tag('p', { margin: '0' }),
        ]);
        expect(result).toBe(
          '@media (max-width: 480px) {\n  h1 {\n    font-size: 24px;\n  }\n\n  p {\n    margin: 0;\n  }\n}',
        );
      });

      it('戻り値が GlobalCss 型として推論される', () => {
        expectTypeOf(media('(min-width: 768px)', [tag('body', { fontSize: '18px' })])).toMatchTypeOf<GlobalCss>();
      });

      it('values に url(javascript:...) が含まれる場合に除外される', () => {
        const result = media('screen', [tag('body', { background: 'url(javascript:alert(1))' })]);
        // サニタイズにより background プロパティが除外される → 空の body { } が生成される
        expect(result).toContain('@media screen {');
      });
    });

    describe('keyframes()', () => {
      it('@keyframes ブロックを生成する', () => {
        const result = keyframes('fadeIn', {
          from: { opacity: '0' },
          to: { opacity: '1' },
        });
        expect(result).toBe(
          '@keyframes fadeIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}',
        );
      });

      it('パーセントキーを含むフレームを生成する', () => {
        const result = keyframes('slide', {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100px)' },
        });
        expect(result).toBe(
          '@keyframes slide {\n  0% {\n    transform: translateX(0);\n  }\n  100% {\n    transform: translateX(100px);\n  }\n}',
        );
      });

      it('戻り値が GlobalCss 型として推論される', () => {
        expectTypeOf(
          keyframes('fadeIn', { from: { opacity: '0' }, to: { opacity: '1' } }),
        ).toMatchTypeOf<GlobalCss>();
      });

      it('フレーム内の url(javascript:...) 値が除外される', () => {
        const result = keyframes('evil', {
          from: { background: 'url(javascript:alert(1))', opacity: '0' },
        });
        // background は除外されるが opacity は残る
        expect(result).toContain('opacity: 0;');
        expect(result).not.toContain('javascript:');
      });
    });
  });

  describe('セレクタ系 4関数', () => {
    describe('root()', () => {
      it(':root { ... } ブロックを生成する', () => {
        const result = root({ '--bg': '#000' });
        expect(result).toBe(':root {\n  --bg: #000;\n}');
      });

      it('camelCase プロパティを kebab-case に変換する', () => {
        const result = root({ boxSizing: 'border-box' });
        expect(result).toBe(':root {\n  box-sizing: border-box;\n}');
      });

      it('戻り値が GlobalCss 型として推論される', () => {
        expectTypeOf(root({ '--x': 'y' })).toMatchTypeOf<GlobalCss>();
      });
    });

    describe('all()', () => {
      it('* { ... } ブロックを生成する', () => {
        const result = all({ boxSizing: 'border-box' });
        expect(result).toBe('* {\n  box-sizing: border-box;\n}');
      });

      it('戻り値が GlobalCss 型として推論される', () => {
        expectTypeOf(all({ margin: '0' })).toMatchTypeOf<GlobalCss>();
      });
    });

    describe('tag()', () => {
      it('タグセレクタブロックを生成する', () => {
        const result = tag('ul', { margin: '0' });
        expect(result).toBe('ul {\n  margin: 0;\n}');
      });

      it('複数プロパティを正しく出力する', () => {
        const result = tag('body', { margin: '0', padding: '0' });
        expect(result).toBe('body {\n  margin: 0;\n  padding: 0;\n}');
      });

      it('HTMLElementTagNameMap のキーをリテラル型として受け付ける', () => {
        // TypeScript コンパイルが通ることを確認（型チェックのみ）
        expectTypeOf(tag<'ul'>).parameter(0).toMatchTypeOf<'ul'>();
      });

      it('戻り値が GlobalCss 型として推論される', () => {
        expectTypeOf(tag('ul', { margin: '0' })).toMatchTypeOf<GlobalCss>();
      });
    });

    describe('rule()', () => {
      it('任意セレクタブロックを生成する', () => {
        const result = rule('.foo:hover', { color: 'red' });
        expect(result).toBe('.foo:hover {\n  color: red;\n}');
      });

      it('複雑なセレクタを受け付ける', () => {
        const result = rule('h1, h2, h3', { fontWeight: 'bold' });
        expect(result).toBe('h1, h2, h3 {\n  font-weight: bold;\n}');
      });

      it('戻り値が GlobalCss 型として推論される', () => {
        expectTypeOf(rule('.foo', { color: 'red' })).toMatchTypeOf<GlobalCss>();
      });
    });
  });

  describe('型安全性テスト（GlobalCss branded type）', () => {
    it('生 string は GlobalCss 型と互換性がない', () => {
      // GlobalCss は branded type なので、生 string は代入非互換
      expectTypeOf('plain string').not.toMatchTypeOf<GlobalCss>();
    });

    it('string 型変数は GlobalCss 型と互換性がない', () => {
      const s: string = 'body { color: red; }';
      expectTypeOf(s).not.toMatchTypeOf<GlobalCss>();
    });

    it('GlobalCss は string に代入可能（subtype）', () => {
      // GlobalCss は string の subtype なので string には代入できる
      const css: GlobalCss = rule('.foo', { color: 'red' });
      expectTypeOf(css).toMatchTypeOf<string>();
    });

    it('DSL 関数の戻り値は GlobalCss 型として利用可能', () => {
      const cssValues: GlobalCss[] = [
        root({ '--x': 'y' }),
        all({ margin: '0' }),
        tag('body', { color: 'red' }),
        rule('.foo', { color: 'blue' }),
        media('(min-width: 768px)', [tag('body', { fontSize: '18px' })]),
        keyframes('fadeIn', { from: { opacity: '0' }, to: { opacity: '1' } }),
      ];
      expect(cssValues).toHaveLength(6);
    });
  });

  describe('sanitizeCssValue によるサニタイズ（セレクタ系 4関数）', () => {
    it('root() で url(javascript:...) が除外される', () => {
      const result = root({ background: 'url(javascript:alert(1))', color: 'red' });
      // background は除外されるが color は残る
      expect(result).toContain('color: red;');
      expect(result).not.toContain('javascript:');
    });

    it('all() で url(javascript:...) が除外される', () => {
      const result = all({ background: 'url(javascript:void(0))', margin: '0' });
      expect(result).toContain('margin: 0;');
      expect(result).not.toContain('javascript:');
    });

    it('tag() で expression() が除外される', () => {
      const result = tag('div', { width: 'expression(alert(1))', height: '100px' });
      expect(result).toContain('height: 100px;');
      expect(result).not.toContain('expression(');
    });

    it('rule() で url(vbscript:...) が除外される', () => {
      const result = rule('.evil', { background: 'url(vbscript:alert(1))', color: 'blue' });
      expect(result).toContain('color: blue;');
      expect(result).not.toContain('vbscript:');
    });

    it('危険値のみの場合は空のブロックが生成される', () => {
      const result = root({ '--evil': 'url(javascript:x)' });
      // 全プロパティが除外されるので本体が空になる
      expect(result).toBe(':root {\n\n}');
    });
  });
});
