import { describe, it, expect, beforeEach } from 'vitest';
import { JQueryManager } from '../../src/js/jquery-manager.js';
import type { JQueryManagerInstance } from '../../src/js/jquery-manager.js';

describe('JQueryManager', () => {
  let jqm: JQueryManagerInstance;
  const testPath = 'root-0-html-0-body';

  beforeEach(() => {
    jqm = new JQueryManager(testPath);
  });

  describe('初期化', () => {
    it('path プロパティを保持する', () => {
      expect(jqm.path).toBe(testPath);
    });

    it('usedMethods は空のSetから始まる', () => {
      expect(jqm.usedMethods.size).toBe(0);
    });

    it('render() は初期状態で空文字列を返す', () => {
      expect(jqm.render()).toBe('');
    });
  });

  describe('css() メソッド', () => {
    it('CSSプロパティオブジェクトからJS文を生成する', () => {
      const result = jqm.css({ 'font-size': '10px' });
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain('.css(');
      expect(result).toContain("'font-size': '10px'");
    });

    it('複数のCSSプロパティを扱える', () => {
      const result = jqm.css({
        'font-size': '10px',
        'color': 'red',
        'margin': '5px'
      });
      expect(result).toContain("'font-size': '10px'");
      expect(result).toContain("'color': 'red'");
      expect(result).toContain("'margin': '5px'");
    });

    it('usedMethods に css を追加する', () => {
      jqm.css({ 'font-size': '10px' });
      expect(jqm.usedMethods.has('css')).toBe(true);
    });
  });

  describe('height() メソッド', () => {
    it('数値のみの場合、デフォルト単位なしで生成する', () => {
      const result = jqm.height(100);
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain('.height(100)');
    });

    it('単位を指定した場合、文字列として生成する', () => {
      const result = jqm.height(50, 'vh');
      expect(result).toContain(".height('50vh')");
    });

    it('usedMethods に height を追加する', () => {
      jqm.height(100);
      expect(jqm.usedMethods.has('height')).toBe(true);
    });
  });

  describe('on() メソッド', () => {
    it('汎用イベントバインディングのJS文を生成する', () => {
      const result = jqm.on('click', 'handleClick');
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain(".on('click', handleClick)");
    });

    it('空ハンドラの場合、空文字列を返す', () => {
      const result = jqm.on('click', '');
      expect(result).toBe('');
    });

    it('空ハンドラの場合、usedMethods に追加しない', () => {
      jqm.on('click', '');
      expect(jqm.usedMethods.has('on')).toBe(false);
    });

    it('有効なハンドラの場合、usedMethods に on を追加する', () => {
      jqm.on('click', 'handleClick');
      expect(jqm.usedMethods.has('on')).toBe(true);
    });
  });

  describe('click() メソッド', () => {
    it('clickイベントハンドラのJS文を生成する', () => {
      const result = jqm.click('handleClick');
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain(".on('click', handleClick)");
    });

    it('usedMethods に on を追加する', () => {
      jqm.click('handleClick');
      expect(jqm.usedMethods.has('on')).toBe(true);
    });
  });

  describe('keydown() メソッド', () => {
    it('keydownイベントハンドラのJS文を生成する', () => {
      const result = jqm.keydown('handleKeyDown');
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain(".on('keydown', handleKeyDown)");
    });

    it('usedMethods に on を追加する', () => {
      jqm.keydown('handleKeyDown');
      expect(jqm.usedMethods.has('on')).toBe(true);
    });
  });

  describe('keyup() メソッド', () => {
    it('keyupイベントハンドラのJS文を生成する', () => {
      const result = jqm.keyup('handleKeyUp');
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain(".on('keyup', handleKeyUp)");
    });

    it('usedMethods に on を追加する', () => {
      jqm.keyup('handleKeyUp');
      expect(jqm.usedMethods.has('on')).toBe(true);
    });
  });

  describe('text() メソッド', () => {
    it('文字列リテラルのJS文を生成する（デフォルト）', () => {
      const result = jqm.text('Hello');
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain(".text('Hello')");
    });

    it('変数名のJS文を生成する（isVariable: true）', () => {
      const result = jqm.text('myVar', true);
      expect(result).toContain('.text(myVar)');
      expect(result).not.toContain("'myVar'");
    });

    it('usedMethods に text を追加する', () => {
      jqm.text('Hello');
      expect(jqm.usedMethods.has('text')).toBe(true);
    });
  });

  describe('html() メソッド', () => {
    it('innerHTML操作のJS文を生成する', () => {
      const result = jqm.html('<b>Bold</b>');
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain(".html('<b>Bold</b>')");
    });

    it('usedMethods に html を追加する', () => {
      jqm.html('<b>Bold</b>');
      expect(jqm.usedMethods.has('html')).toBe(true);
    });
  });

  describe('addClass() メソッド', () => {
    it('クラス追加のJS文を生成する', () => {
      const result = jqm.addClass('active');
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain(".addClass('active')");
    });

    it('usedMethods に addClass を追加する', () => {
      jqm.addClass('active');
      expect(jqm.usedMethods.has('addClass')).toBe(true);
    });
  });

  describe('removeClass() メソッド', () => {
    it('クラス削除のJS文を生成する', () => {
      const result = jqm.removeClass('active');
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain(".removeClass('active')");
    });

    it('usedMethods に removeClass を追加する', () => {
      jqm.removeClass('active');
      expect(jqm.usedMethods.has('removeClass')).toBe(true);
    });
  });

  describe('toggleClass() メソッド', () => {
    it('force なしでクラストグルのJS文を生成する', () => {
      const result = jqm.toggleClass('selected');
      expect(result).toContain(`$('.${testPath}')`);
      expect(result).toContain(".toggleClass('selected')");
    });

    it('force ありでクラストグルのJS文を生成する', () => {
      const result = jqm.toggleClass('selected', true);
      expect(result).toContain(".toggleClass('selected', true)");
    });

    it('usedMethods に toggleClass を追加する', () => {
      jqm.toggleClass('selected');
      expect(jqm.usedMethods.has('toggleClass')).toBe(true);
    });
  });

  describe('render() メソッド', () => {
    it('複数のJS文を ";\n" で結合する', () => {
      jqm.css({ 'font-size': '10px' });
      jqm.text('Hello');
      jqm.addClass('active');

      const result = jqm.render();
      const lines = result.split(';\n');

      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('.css(');
      expect(lines[1]).toContain('.text(');
      expect(lines[2]).toContain('.addClass(');
    });

    it('JS文がない場合は空文字列を返す', () => {
      expect(jqm.render()).toBe('');
    });
  });

  describe('updatePath() メソッド', () => {
    it('pathを更新する', () => {
      jqm.updatePath('new-path');
      expect(jqm.path).toBe('new-path');
    });

    it('更新後のJS文生成で新しいpathが使われる', () => {
      jqm.updatePath('new-path');
      const result = jqm.text('Hello');
      expect(result).toContain("$('.new-path')");
    });
  });

  describe('needsHelper() メソッド', () => {
    it('usedMethodsが空の場合falseを返す', () => {
      expect(jqm.needsHelper()).toBe(false);
    });

    it('usedMethodsが非空の場合trueを返す', () => {
      jqm.text('Hello');
      expect(jqm.needsHelper()).toBe(true);
    });
  });

  describe('usedMethods追跡', () => {
    it('複数のメソッドを使用した場合、すべて追跡される', () => {
      jqm.css({ 'font-size': '10px' });
      jqm.text('Hello');
      jqm.addClass('active');
      jqm.on('click', 'handleClick');

      expect(jqm.usedMethods.size).toBe(4);
      expect(jqm.usedMethods.has('css')).toBe(true);
      expect(jqm.usedMethods.has('text')).toBe(true);
      expect(jqm.usedMethods.has('addClass')).toBe(true);
      expect(jqm.usedMethods.has('on')).toBe(true);
    });

    it('同じメソッドを複数回呼んでも重複しない', () => {
      jqm.text('Hello');
      jqm.text('World');
      jqm.text('!');

      expect(jqm.usedMethods.size).toBe(1);
      expect(jqm.usedMethods.has('text')).toBe(true);
    });
  });
});
