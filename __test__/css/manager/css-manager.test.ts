/**
 * Task 8.2: CssManager -- CSS中央管理のテスト
 *
 * TDD RED phase: CssManager の全機能を検証する。
 * - CssStyleManager と CssPositionMaker を統合的に保持する
 * - render() でスタイルCSS + レイアウトCSS の結合文字列を出力する
 * - renderCss() でスコープドCSS形式を出力する
 * - tagPath の管理・更新機能
 * - LazyLayoutRegister 参照の伝播
 * - CssConfig によるスコープドCSS有効/無効の切り替え
 * - デフォルト値で全プロパティクラスを初期化する
 * - CssManagerInstance インターフェースに準拠する
 *
 * Requirements: 1.1, 1.4, 1.5, 8.2, 8.3, 8.5
 */
import { describe, it, expect } from 'vitest';
import { CssManager } from '../../../src/css/manager/css-manager.js';
import { CssStyleManager } from '../../../src/css/manager/css-style-manager.js';
import { CssPositionMaker } from '../../../src/css/layout/position-maker/css-position-maker.js';
import { CssConfig } from '../../../src/css/config/css-config.js';
import { LazyLayoutManager } from '../../../src/css/layout/lazy-layout/lazy-layout-manager.js';
import { generateScopedClassName } from '../../../src/css/utils/scoped-css-generator.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(tagPath = ''): CssManager {
  return new CssManager(tagPath);
}

// ============================================================
// CssManager
// ============================================================

describe('CssManager', () => {
  // ── CssManagerInstance 準拠 ──

  describe('CssManagerInstance準拠', () => {
    it('render() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });

    it('renderCss() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.renderCss).toBe('function');
    });

    it('tagPath プロパティを持つ', () => {
      const sut = makeSUT('html>body>div');
      expect(sut.tagPath).toBe('html>body>div');
    });

    it('updateTagPath() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.updateTagPath).toBe('function');
    });

    it('layout プロパティが CssPositionMaker インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.layout).toBeInstanceOf(CssPositionMaker);
    });

    it('styleManager プロパティが CssStyleManager インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.styleManager).toBeInstanceOf(CssStyleManager);
    });

    it('updateLazyLayoutRegister() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.updateLazyLayoutRegister).toBe('function');
    });
  });

  // ── デフォルト初期化 ──

  describe('デフォルト初期化', () => {
    it('デフォルト tagPath は空文字列', () => {
      const sut = makeSUT();
      expect(sut.tagPath).toBe('');
    });

    it('コンストラクタで tagPath を指定できる', () => {
      const sut = makeSUT('html>body>div');
      expect(sut.tagPath).toBe('html>body>div');
    });

    it('layout が初期化されている', () => {
      const sut = makeSUT();
      expect(sut.layout).toBeDefined();
    });

    it('styleManager が初期化されている', () => {
      const sut = makeSUT();
      expect(sut.styleManager).toBeDefined();
    });

    it('デフォルト config でスコープドCSS有効', () => {
      const sut = makeSUT();
      expect(sut.config.scopedCssEnabled).toBe(true);
    });

    it('デフォルト config で出力モード inline', () => {
      const sut = makeSUT();
      expect(sut.config.outputMode).toBe('inline');
    });

    it('プロパティ未設定の場合、render() は空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });

    it('プロパティ未設定の場合、renderCss() は空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.renderCss()).toBe('');
    });
  });

  // ── tagPath 管理 ──

  describe('tagPath管理', () => {
    it('updateTagPath() で tagPath を更新できる', () => {
      const sut = makeSUT('html>body');
      sut.updateTagPath('html>body>div');
      expect(sut.tagPath).toBe('html>body>div');
    });

    it('updateTagPath() で layout の tagPath も更新される', () => {
      const sut = makeSUT('html>body');
      sut.updateTagPath('html>body>div');
      expect(sut.layout.tagPath).toBe('html>body>div');
    });
  });

  // ── render() 統合出力 ──

  describe('render()統合出力', () => {
    it('スタイルCSS のみの場合、スタイルCSS を返す', () => {
      const sut = makeSUT();
      sut.styleManager.style.font.setFontSize('16px');
      expect(sut.render()).toBe('font-size: 16px;');
    });

    it('レイアウトCSS のみの場合、レイアウトCSS を返す', () => {
      const sut = makeSUT('html>body>div');
      sut.layout.placeAbsoluteWith((b) => {
        b.top(100, 'px');
        b.left(200, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('left: 200px;');
      expect(rendered).toContain('position: absolute;');
      expect(rendered).toContain('top: 100px;');
    });

    it('スタイル + レイアウト両方がある場合、結合して返す', () => {
      const sut = makeSUT('html>body>div');
      sut.styleManager.style.font.setFontSize('16px');
      sut.layout.placeAbsoluteWith((b) => {
        b.top(100, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('font-size: 16px;');
      expect(rendered).toContain('position: absolute;');
      expect(rendered).toContain('top: 100px;');
    });

    it('スタイルもレイアウトも未設定の場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });
  });

  // ── renderCss() スコープドCSS出力 ──

  describe('renderCss()スコープドCSS出力', () => {
    it('スコープドCSS形式で出力する（._hashXXXX { ... }）', () => {
      const tagPath = 'html>body>div';
      const sut = makeSUT(tagPath);
      sut.styleManager.style.font.setFontSize('16px');

      const expected = generateScopedClassName(tagPath);
      const result = sut.renderCss();

      expect(result).toContain(`.${expected}`);
      expect(result).toContain('{');
      expect(result).toContain('font-size: 16px;');
      expect(result).toContain('}');
    });

    it('スタイル + レイアウト結合のスコープドCSSを出力する', () => {
      const tagPath = 'html>body>div';
      const sut = makeSUT(tagPath);
      sut.styleManager.style.font.setFontSize('16px');
      sut.layout.placeAbsoluteWith((b) => {
        b.top(100, 'px');
      });

      const result = sut.renderCss();
      expect(result).toContain('font-size: 16px;');
      expect(result).toContain('position: absolute;');
      expect(result).toContain('top: 100px;');
    });

    it('プロパティ未設定の場合、空文字列を返す', () => {
      const sut = makeSUT('html>body>div');
      expect(sut.renderCss()).toBe('');
    });

    it('同一タグパスで常に同一のクラス名を生成する（決定的ハッシュ）', () => {
      const tagPath = 'html>body>div';
      const sut1 = makeSUT(tagPath);
      const sut2 = makeSUT(tagPath);
      sut1.styleManager.style.font.setFontSize('16px');
      sut2.styleManager.style.font.setFontSize('16px');

      const result1 = sut1.renderCss();
      const result2 = sut2.renderCss();
      expect(result1).toBe(result2);
    });
  });

  // ── CssConfig 連携 ──

  describe('CssConfig連携', () => {
    it('カスタム CssConfig を渡せる', () => {
      const config = new CssConfig({ scopedCssEnabled: false });
      const sut = new CssManager('html>body>div', config);
      expect(sut.config.scopedCssEnabled).toBe(false);
    });

    it('スコープドCSS無効時、renderCss() はインラインスタイル形式を返す', () => {
      const config = new CssConfig({ scopedCssEnabled: false });
      const sut = new CssManager('html>body>div', config);
      sut.styleManager.style.font.setFontSize('16px');

      const result = sut.renderCss();
      // スコープドCSS無効時は、クラス名ラッパーなしの CSS 文字列
      expect(result).not.toContain('._');
      expect(result).not.toContain('{');
      expect(result).toBe('font-size: 16px;');
    });

    it('スコープドCSS有効時、renderCss() はスコープド形式を返す', () => {
      const config = new CssConfig({ scopedCssEnabled: true });
      const sut = new CssManager('html>body>div', config);
      sut.styleManager.style.font.setFontSize('16px');

      const result = sut.renderCss();
      expect(result).toContain('._');
      expect(result).toContain('{');
      expect(result).toContain('}');
    });
  });

  // ── LazyLayoutRegister 伝播 ──

  describe('LazyLayoutRegister伝播', () => {
    it('updateLazyLayoutRegister() で layout に伝播する', () => {
      const sut = makeSUT('html>body>div');
      const register = new LazyLayoutManager();

      sut.updateLazyLayoutRegister(register);
      expect(sut.layout.getLLRegister()).toBe(register);
    });

    it('updateLazyLayoutRegister(undefined) で参照をクリアする', () => {
      const sut = makeSUT('html>body>div');
      const register = new LazyLayoutManager();

      sut.updateLazyLayoutRegister(register);
      sut.updateLazyLayoutRegister(undefined);
      expect(sut.layout.getLLRegister()).toBeUndefined();
    });
  });

  // ── インスタンス独立性 ──

  describe('インスタンス独立性', () => {
    it('異なるインスタンスの styleManager は独立している', () => {
      const sut1 = makeSUT();
      const sut2 = makeSUT();

      sut1.styleManager.style.font.setFontSize('16px');

      expect(sut1.render()).toContain('font-size: 16px;');
      expect(sut2.render()).toBe('');
    });

    it('異なるインスタンスの layout は独立している', () => {
      const sut1 = makeSUT('path1');
      const sut2 = makeSUT('path2');

      sut1.layout.placeAbsoluteWith((b) => {
        b.top(100, 'px');
      });

      expect(sut1.render()).toContain('top: 100px;');
      expect(sut2.render()).toBe('');
    });

    it('同一インスタンスの layout は常に同じオブジェクトを返す', () => {
      const sut = makeSUT();
      expect(sut.layout).toBe(sut.layout);
    });

    it('同一インスタンスの styleManager は常に同じオブジェクトを返す', () => {
      const sut = makeSUT();
      expect(sut.styleManager).toBe(sut.styleManager);
    });
  });

  // ── 複合シナリオ ──

  describe('複合シナリオ', () => {
    it('13プロパティクラス経由でスタイルを設定し、スコープドCSS出力', () => {
      const sut = makeSUT('html>body>div.card');
      sut.styleManager.style.font.setFontSize('16px');
      sut.styleManager.style.spacing.setMargin('10px');
      sut.styleManager.style.position.setDisplay('flex');

      const scopedCss = sut.renderCss();
      expect(scopedCss).toContain('font-size: 16px;');
      expect(scopedCss).toContain('margin: 10px;');
      expect(scopedCss).toContain('display: flex;');
    });

    it('スタイル + レイアウト + スコープドCSS の統合出力', () => {
      const sut = makeSUT('html>body>div');
      sut.styleManager.style.font.setFontSize('16px');
      sut.layout.placeAbsoluteWith((b) => {
        b.top(50, 'px');
        b.left(100, 'px');
      });

      // render() はインラインスタイル形式
      const inlineCss = sut.render();
      expect(inlineCss).toContain('font-size: 16px;');
      expect(inlineCss).toContain('top: 50px;');

      // renderCss() はスコープドCSS形式
      const scopedCss = sut.renderCss();
      expect(scopedCss).toContain('._');
      expect(scopedCss).toContain('font-size: 16px;');
      expect(scopedCss).toContain('top: 50px;');
    });
  });
});
