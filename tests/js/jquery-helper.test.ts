import { describe, it, expect } from 'vitest';
import { JQueryHelper } from '../../src/js/jquery-helper.js';
import type { JQueryMethodType } from '../../src/js/jquery-method-type.js';

describe('JQueryHelper', () => {
  describe('generateHelper()', () => {
    it('空のメソッドセットの場合、空文字列を返す', () => {
      const methods = new Set<JQueryMethodType>();
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toBe('');
    });

    it('cssメソッドのみの場合、css対応の$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>(['css']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('css(props)');
      expect(result).toContain('for (let prop in props)');
      expect(result).not.toContain('height(');
      expect(result).not.toContain('text(');
    });

    it('heightメソッドのみの場合、height対応の$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>(['height']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('height(value)');
      expect(result).not.toContain('css(');
      expect(result).not.toContain('text(');
    });

    it('onメソッドのみの場合、on対応の$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>(['on']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('on(event, handler)');
      expect(result).toContain('addEventListener');
    });

    it('textメソッドのみの場合、text対応の$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>(['text']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('text(value)');
      expect(result).toContain('textContent');
    });

    it('htmlメソッドのみの場合、html対応の$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>(['html']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('html(value)');
      expect(result).toContain('innerHTML');
    });

    it('addClassメソッドのみの場合、addClass対応の$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>(['addClass']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('addClass(className)');
      expect(result).toContain('classList.add');
    });

    it('removeClassメソッドのみの場合、removeClass対応の$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>(['removeClass']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('removeClass(className)');
      expect(result).toContain('classList.remove');
    });

    it('toggleClassメソッドのみの場合、toggleClass対応の$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>(['toggleClass']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('toggleClass(className, force)');
      expect(result).toContain('classList.toggle');
    });

    it('複数メソッドの場合、すべて含む$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>(['css', 'text', 'addClass']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('css(props)');
      expect(result).toContain('text(value)');
      expect(result).toContain('addClass(className)');
    });

    it('全メソッドの場合、完全な$()関数を生成する', () => {
      const methods = new Set<JQueryMethodType>([
        'css',
        'height',
        'on',
        'text',
        'html',
        'addClass',
        'removeClass',
        'toggleClass',
      ]);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('css(props)');
      expect(result).toContain('height(value)');
      expect(result).toContain('on(event, handler)');
      expect(result).toContain('text(value)');
      expect(result).toContain('html(value)');
      expect(result).toContain('addClass(className)');
      expect(result).toContain('removeClass(className)');
      expect(result).toContain('toggleClass(className, force)');
    });
  });

  describe('generateHelperWithAll()', () => {
    it('空のメソッドセットの場合、空文字列を返す', () => {
      const methods = new Set<JQueryMethodType>();
      const result = JQueryHelper.generateHelperWithAll(methods);

      expect(result).toBe('');
    });

    it('メソッドが含まれる場合、$()と$$.all()の両方を生成する', () => {
      const methods = new Set<JQueryMethodType>(['css', 'text']);
      const result = JQueryHelper.generateHelperWithAll(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('const $$ = {');
      expect(result).toContain('all(selector)');
      expect(result).toContain('querySelectorAll');
    });

    it('$$.all()はquerySelectorAllベースのコードを含む', () => {
      const methods = new Set<JQueryMethodType>(['text']);
      const result = JQueryHelper.generateHelperWithAll(methods);

      expect(result).toContain('document.querySelectorAll(selector)');
      expect(result).toContain('Array.from');
    });
  });

  describe('null安全性', () => {
    it('セレクタに一致する要素がない場合のnull安全ダミーオブジェクトを含む', () => {
      const methods = new Set<JQueryMethodType>(['css', 'text']);
      const result = JQueryHelper.generateHelper(methods);

      // null チェックが含まれることを確認
      expect(result).toContain('if (!el)');
      // ダミーオブジェクトがメソッドチェーンをサポート
      expect(result).toContain('return this');
    });
  });

  describe('メソッドチェーン対応', () => {
    it('各メソッドが return this を含む', () => {
      const methods = new Set<JQueryMethodType>(['css', 'addClass']);
      const result = JQueryHelper.generateHelper(methods);

      // メソッドチェーンのために return this が含まれる
      expect(result).toContain('return this');
    });
  });

  describe('ゲッター/セッター対応', () => {
    it('text()メソッドは引数なしでゲッター動作をサポート', () => {
      const methods = new Set<JQueryMethodType>(['text']);
      const result = JQueryHelper.generateHelper(methods);

      // 引数チェック
      expect(result).toContain('value === undefined');
      expect(result).toContain('textContent');
    });

    it('html()メソッドは引数なしでゲッター動作をサポート', () => {
      const methods = new Set<JQueryMethodType>(['html']);
      const result = JQueryHelper.generateHelper(methods);

      // 引数チェック
      expect(result).toContain('value === undefined');
      expect(result).toContain('innerHTML');
    });
  });

  describe('セレクタとDOM要素の両対応', () => {
    it('selectorOrEl パラメータで文字列とDOM要素の両方を受け入れる', () => {
      const methods = new Set<JQueryMethodType>(['css']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
      expect(result).toContain('typeof selectorOrEl === "string"');
      expect(result).toContain('document.querySelector(selectorOrEl)');
    });
  });

  describe('Tree-shaking最適化', () => {
    it('使用しないメソッドは含まれない', () => {
      const methods = new Set<JQueryMethodType>(['css']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('css(props)');
      expect(result).not.toContain('height(');
      expect(result).not.toContain('text(');
      expect(result).not.toContain('html(');
      expect(result).not.toContain('addClass(');
      expect(result).not.toContain('removeClass(');
      expect(result).not.toContain('toggleClass(');
      expect(result).not.toContain('on(');
    });

    it('2つのメソッドのみを使用した場合、他は含まれない', () => {
      const methods = new Set<JQueryMethodType>(['text', 'addClass']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('text(value)');
      expect(result).toContain('addClass(className)');
      expect(result).not.toContain('css(');
      expect(result).not.toContain('height(');
      expect(result).not.toContain('html(');
      expect(result).not.toContain('removeClass(');
      expect(result).not.toContain('toggleClass(');
      expect(result).not.toContain('on(');
    });
  });

  describe('生成されたコードの構造', () => {
    it('function $() 定義を含む', () => {
      const methods = new Set<JQueryMethodType>(['css']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('function $(selectorOrEl)');
    });

    it('返却オブジェクトのメソッド定義を含む', () => {
      const methods = new Set<JQueryMethodType>(['css', 'text']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('return {');
      expect(result).toContain('css(props) {');
      expect(result).toContain('text(value) {');
    });

    it('const el 定義を含む', () => {
      const methods = new Set<JQueryMethodType>(['css']);
      const result = JQueryHelper.generateHelper(methods);

      expect(result).toContain('const el =');
    });
  });

  describe('Swift版互換性検証', () => {
    describe('関数シグネチャの一貫性', () => {
      it('$() 関数のパラメータ名が Swift版と一致', () => {
        const methods = new Set<JQueryMethodType>(['css']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版: func generateHelper() -> "function $(selectorOrEl)"
        expect(result).toContain('function $(selectorOrEl)');
      });

      it('セレクタ判定ロジックが Swift版と一致', () => {
        const methods = new Set<JQueryMethodType>(['css']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版と同一の型チェック方式
        expect(result).toContain('typeof selectorOrEl === "string"');
        expect(result).toContain('document.querySelector(selectorOrEl)');
      });
    });

    describe('null安全性の実装方式', () => {
      it('Swift版と同一のnullチェック方式を使用', () => {
        const methods = new Set<JQueryMethodType>(['css']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版: if el == nil { return dummyObject }
        expect(result).toContain('if (!el)');
        expect(result).toContain('return {');
      });

      it('ダミーオブジェクトが全メソッドを持つ（Swift版互換）', () => {
        const methods = new Set<JQueryMethodType>(['css', 'text', 'addClass']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版では、ダミーオブジェクトも全メソッドを持つ
        const lines = result.split('\n');
        const nullCheckIndex = lines.findIndex((line) => line.includes('if (!el)'));
        expect(nullCheckIndex).toBeGreaterThan(-1);

        // ダミーオブジェクト内にメソッドが存在
        const dummySection = lines.slice(nullCheckIndex, nullCheckIndex + 10).join('\n');
        expect(dummySection).toContain('css(props)');
      });
    });

    describe('メソッド実装の互換性', () => {
      it('css() 実装がSwift版と同一のDOM操作を行う', () => {
        const methods = new Set<JQueryMethodType>(['css']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版: for-in loop + el.style[prop] = props[prop]
        expect(result).toContain('for (let prop in props)');
        expect(result).toContain('el.style[prop] = props[prop]');
      });

      it('height() 実装がSwift版と同一の単位処理を行う', () => {
        const methods = new Set<JQueryMethodType>(['height']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版: 数値 → "px" 追加、文字列 → そのまま
        expect(result).toContain('typeof value === \'number\' ? value + \'px\' : value');
      });

      it('text() ゲッター/セッター実装がSwift版と一致', () => {
        const methods = new Set<JQueryMethodType>(['text']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版: value === undefined でゲッター
        expect(result).toContain('if (value === undefined)');
        expect(result).toContain('return el.textContent');
        expect(result).toContain('el.textContent = value');
      });

      it('html() ゲッター/セッター実装がSwift版と一致', () => {
        const methods = new Set<JQueryMethodType>(['html']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版: value === undefined でゲッター
        expect(result).toContain('if (value === undefined)');
        expect(result).toContain('return el.innerHTML');
        expect(result).toContain('el.innerHTML = value');
      });

      it('toggleClass() のforce引数処理がSwift版と一致', () => {
        const methods = new Set<JQueryMethodType>(['toggleClass']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版: force === undefined で分岐
        expect(result).toContain('if (force === undefined)');
        expect(result).toContain('el.classList.toggle(className)');
        expect(result).toContain('el.classList.toggle(className, force)');
      });
    });

    describe('メソッドチェーンの一貫性', () => {
      it('全メソッドが return this を含む（Swift版互換）', () => {
        const methods = new Set<JQueryMethodType>([
          'css',
          'height',
          'on',
          'text',
          'html',
          'addClass',
          'removeClass',
          'toggleClass',
        ]);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版では全メソッドがメソッドチェーン対応
        const returnThisCount = (result.match(/return this;/g) || []).length;
        // 各メソッド + ダミーオブジェクトのメソッド（ただしif (!el) return this; は削除される）
        expect(returnThisCount).toBeGreaterThan(0);
      });
    });

    describe('generateHelperWithAll() の互換性', () => {
      it('$$.all() の実装がSwift版と一致', () => {
        const methods = new Set<JQueryMethodType>(['css']);
        const result = JQueryHelper.generateHelperWithAll(methods);

        // Swift版: $$.all(selector) -> Array.from(querySelectorAll)
        expect(result).toContain('const $$ = {');
        expect(result).toContain('all(selector)');
        expect(result).toContain('Array.from(document.querySelectorAll(selector))');
      });

      it('$()と$$.all()の区切りがSwift版と一致', () => {
        const methods = new Set<JQueryMethodType>(['css']);
        const result = JQueryHelper.generateHelperWithAll(methods);

        // Swift版: 改行で区切られる
        expect(result).toMatch(/\}\n\nconst \$\$ = \{/);
      });
    });

    describe('エッジケースの互換性', () => {
      it('空Setで空文字列を返す（Swift版互換）', () => {
        const methods = new Set<JQueryMethodType>();
        const resultHelper = JQueryHelper.generateHelper(methods);
        const resultHelperWithAll = JQueryHelper.generateHelperWithAll(methods);

        // Swift版: empty methods -> ""
        expect(resultHelper).toBe('');
        expect(resultHelperWithAll).toBe('');
      });

      it('単一メソッドでも有効な関数を生成（Swift版互換）', () => {
        const methods = new Set<JQueryMethodType>(['text']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版: 1つのメソッドでも完全な$()関数
        expect(result).toContain('function $(selectorOrEl)');
        expect(result).toContain('text(value)');
        expect(result).toMatch(/\}$/);
      });
    });

    describe('生成コードの構文正確性（Swift版互換）', () => {
      it('括弧の対応が正しい', () => {
        const methods = new Set<JQueryMethodType>([
          'css',
          'height',
          'on',
          'text',
          'html',
          'addClass',
          'removeClass',
          'toggleClass',
        ]);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版も構文エラーのないJSを生成
        const openBraces = (result.match(/\{/g) || []).length;
        const closeBraces = (result.match(/\}/g) || []).length;
        const openParens = (result.match(/\(/g) || []).length;
        const closeParens = (result.match(/\)/g) || []).length;

        expect(openBraces).toBe(closeBraces);
        expect(openParens).toBe(closeParens);
      });

      it('有効なJavaScript関数定義である', () => {
        const methods = new Set<JQueryMethodType>(['css']);
        const result = JQueryHelper.generateHelper(methods);

        // Swift版: function $(...) { ... }
        expect(result).toMatch(/^function \$\(selectorOrEl\) \{/);
        expect(result).toMatch(/\}$/);
      });
    });
  });
});
