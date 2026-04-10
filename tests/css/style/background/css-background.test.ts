/**
 * Task 3.2: CSSBackground -- 背景プロパティのテスト
 *
 * TDD RED phase: CSSBackground の全setter・render()出力・エッジケースを検証する。
 * - background-color, background-image, background-size,
 *   background-position, background-repeat
 * - 線形グラデーション（linear-gradient）の設定機能
 * - CSSColor 連携による色指定
 * - collectProperties -> render 統一パターン準拠
 * - Fluent setter（メソッドチェーン）対応
 * - 設定プロパティのみ出力、未設定は出力しない
 * - プロパティソート順（アルファベット順）
 *
 * Requirements: 5.4, 5.5, 5.7
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSBackground } from '../../../../src/css/style/background/css-background.js';
import { CSSColor } from '../../../../src/css/style/color/css-color.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSBackground {
  return new CSSBackground();
}

// ============================================================
// CSSBackground
// ============================================================

describe('CSSBackground', () => {
  // ── 空出力テスト ──

  describe('空出力', () => {
    it('プロパティ未設定の場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });
  });

  // ── Renderable準拠 ──

  describe('Renderable準拠', () => {
    it('render() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });
  });

  // ── background-color プロパティ ──

  describe('background-color', () => {
    it('background-color を HEX 値で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('#ff0000');
      expect(sut.render()).toBe('background-color: #ff0000;');
    });

    it('background-color を色名で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('red');
      expect(sut.render()).toBe('background-color: red;');
    });

    it('background-color を rgb 値で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('rgb(255, 0, 0)');
      expect(sut.render()).toBe('background-color: rgb(255, 0, 0);');
    });

    it('background-color を rgba 値で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('rgba(255, 0, 0, 0.5)');
      expect(sut.render()).toBe('background-color: rgba(255, 0, 0, 0.5);');
    });

    it('background-color を transparent で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('transparent');
      expect(sut.render()).toBe('background-color: transparent;');
    });

    // CSSColor連携
    it('CSSColor.hex() で background-color を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.hex('#00ff00');
      sut.setBackgroundColorValue(color);
      expect(sut.render()).toBe('background-color: #00ff00;');
    });

    it('CSSColor.rgb() で background-color を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.rgb(0, 128, 255);
      sut.setBackgroundColorValue(color);
      expect(sut.render()).toBe('background-color: rgb(0, 128, 255);');
    });

    it('CSSColor.rgba() で background-color を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.rgba(255, 255, 255, 0.8);
      sut.setBackgroundColorValue(color);
      expect(sut.render()).toBe('background-color: rgba(255, 255, 255, 0.8);');
    });

    it('CSSColor.named() で background-color を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.named('blue');
      sut.setBackgroundColorValue(color);
      expect(sut.render()).toBe('background-color: blue;');
    });

    it('CSSColor.raw() で background-color を設定できる', () => {
      const sut = makeSUT();
      const color = CSSColor.raw('hsl(120, 100%, 50%)');
      sut.setBackgroundColorValue(color);
      expect(sut.render()).toBe('background-color: hsl(120, 100%, 50%);');
    });
  });

  // ── background-image プロパティ ──

  describe('background-image', () => {
    it('background-image を URL で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundImage('url("image.png")');
      expect(sut.render()).toBe('background-image: url("image.png");');
    });

    it('background-image に none を設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundImage('none');
      expect(sut.render()).toBe('background-image: none;');
    });

    it('background-image を複数の URL で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundImage('url("bg1.png"), url("bg2.png")');
      expect(sut.render()).toBe('background-image: url("bg1.png"), url("bg2.png");');
    });
  });

  // ── background-size プロパティ ──

  describe('background-size', () => {
    it('background-size を cover で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundSize('cover');
      expect(sut.render()).toBe('background-size: cover;');
    });

    it('background-size を contain で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundSize('contain');
      expect(sut.render()).toBe('background-size: contain;');
    });

    it('background-size をピクセル値で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundSize('100px 200px');
      expect(sut.render()).toBe('background-size: 100px 200px;');
    });

    it('background-size をパーセント値で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundSize('50% 100%');
      expect(sut.render()).toBe('background-size: 50% 100%;');
    });

    it('background-size を auto で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundSize('auto');
      expect(sut.render()).toBe('background-size: auto;');
    });
  });

  // ── background-position プロパティ ──

  describe('background-position', () => {
    it('background-position を center で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundPosition('center');
      expect(sut.render()).toBe('background-position: center;');
    });

    it('background-position を top left で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundPosition('top left');
      expect(sut.render()).toBe('background-position: top left;');
    });

    it('background-position をピクセル値で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundPosition('10px 20px');
      expect(sut.render()).toBe('background-position: 10px 20px;');
    });

    it('background-position をパーセント値で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundPosition('50% 50%');
      expect(sut.render()).toBe('background-position: 50% 50%;');
    });

    it('background-position を bottom right で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundPosition('bottom right');
      expect(sut.render()).toBe('background-position: bottom right;');
    });
  });

  // ── background-repeat プロパティ ──

  describe('background-repeat', () => {
    it('background-repeat を repeat で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundRepeat('repeat');
      expect(sut.render()).toBe('background-repeat: repeat;');
    });

    it('background-repeat を no-repeat で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundRepeat('no-repeat');
      expect(sut.render()).toBe('background-repeat: no-repeat;');
    });

    it('background-repeat を repeat-x で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundRepeat('repeat-x');
      expect(sut.render()).toBe('background-repeat: repeat-x;');
    });

    it('background-repeat を repeat-y で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundRepeat('repeat-y');
      expect(sut.render()).toBe('background-repeat: repeat-y;');
    });

    it('background-repeat を space で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundRepeat('space');
      expect(sut.render()).toBe('background-repeat: space;');
    });

    it('background-repeat を round で設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundRepeat('round');
      expect(sut.render()).toBe('background-repeat: round;');
    });
  });

  // ── linear-gradient ヘルパー ──

  describe('linear-gradient', () => {
    const savedDev = process.env.DRAFT_OLE_DEV;
    beforeEach(() => { delete process.env.DRAFT_OLE_DEV; });
    afterEach(() => {
      if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
      else process.env.DRAFT_OLE_DEV = savedDev;
    });

    it('2色のグラデーションを設定できる', () => {
      const sut = makeSUT();
      sut.setLinearGradient('to right', '#f00', '#00f');
      expect(sut.render()).toBe('background-image: linear-gradient(to right, #f00, #00f);');
    });

    it('3色のグラデーションを設定できる', () => {
      const sut = makeSUT();
      sut.setLinearGradient('to bottom', '#f00', '#0f0', '#00f');
      expect(sut.render()).toBe(
        'background-image: linear-gradient(to bottom, #f00, #0f0, #00f);'
      );
    });

    it('角度指定のグラデーションを設定できる', () => {
      const sut = makeSUT();
      sut.setLinearGradient('45deg', '#f00', '#00f');
      expect(sut.render()).toBe('background-image: linear-gradient(45deg, #f00, #00f);');
    });

    it('to top 方向のグラデーションを設定できる', () => {
      const sut = makeSUT();
      sut.setLinearGradient('to top', 'red', 'blue');
      expect(sut.render()).toBe('background-image: linear-gradient(to top, red, blue);');
    });

    it('to bottom left 方向のグラデーションを設定できる', () => {
      const sut = makeSUT();
      sut.setLinearGradient('to bottom left', '#fff', '#000');
      expect(sut.render()).toBe(
        'background-image: linear-gradient(to bottom left, #fff, #000);'
      );
    });

    it('カラーストップ付きのグラデーションを設定できる', () => {
      const sut = makeSUT();
      sut.setLinearGradient('to right', '#f00 0%', '#0f0 50%', '#00f 100%');
      expect(sut.render()).toBe(
        'background-image: linear-gradient(to right, #f00 0%, #0f0 50%, #00f 100%);'
      );
    });

    it('rgba カラーでのグラデーションを設定できる', () => {
      const sut = makeSUT();
      sut.setLinearGradient('to right', 'rgba(255,0,0,0.5)', 'rgba(0,0,255,0.5)');
      expect(sut.render()).toBe(
        'background-image: linear-gradient(to right, rgba(255,0,0,0.5), rgba(0,0,255,0.5));'
      );
    });

    it('グラデーションが background-image を上書きする', () => {
      const sut = makeSUT();
      sut.setBackgroundImage('url("old.png")');
      sut.setLinearGradient('to right', '#f00', '#00f');
      expect(sut.render()).toBe('background-image: linear-gradient(to right, #f00, #00f);');
    });

    it('background-image がグラデーションを上書きする', () => {
      const sut = makeSUT();
      sut.setLinearGradient('to right', '#f00', '#00f');
      sut.setBackgroundImage('url("new.png")');
      expect(sut.render()).toBe('background-image: url("new.png");');
    });
  });

  // ── Fluent setter（メソッドチェーン） ──

  describe('メソッドチェーン', () => {
    it('setBackgroundColor が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackgroundColor('#fff');
      expect(result).toBe(sut);
    });

    it('setBackgroundImage が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackgroundImage('url("image.png")');
      expect(result).toBe(sut);
    });

    it('setBackgroundSize が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackgroundSize('cover');
      expect(result).toBe(sut);
    });

    it('setBackgroundPosition が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackgroundPosition('center');
      expect(result).toBe(sut);
    });

    it('setBackgroundRepeat が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackgroundRepeat('no-repeat');
      expect(result).toBe(sut);
    });

    it('setBackgroundColorValue が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackgroundColorValue(CSSColor.hex('#000'));
      expect(result).toBe(sut);
    });

    it('setLinearGradient が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setLinearGradient('to right', '#f00', '#00f');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setBackgroundColor('#fff')
        .setBackgroundImage('url("bg.png")')
        .setBackgroundSize('cover')
        .setBackgroundPosition('center')
        .setBackgroundRepeat('no-repeat');
      expect(result).toBe(sut);
      const rendered = sut.render();
      expect(rendered).toContain('background-color: #fff');
      expect(rendered).toContain('background-image: url("bg.png")');
      expect(rendered).toContain('background-size: cover');
      expect(rendered).toContain('background-position: center');
      expect(rendered).toContain('background-repeat: no-repeat');
    });
  });

  // ── プロパティソート順の検証 ──

  describe('プロパティソート順（アルファベット順）', () => {
    it('全背景プロパティがアルファベット順にソートされる', () => {
      const sut = makeSUT();
      // 意図的にアルファベット逆順で設定
      sut.setBackgroundSize('cover');
      sut.setBackgroundRepeat('no-repeat');
      sut.setBackgroundPosition('center');
      sut.setBackgroundImage('url("bg.png")');
      sut.setBackgroundColor('#fff');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // アルファベット順:
      // background-color < background-image < background-position < background-repeat < background-size
      expect(lines[0]).toBe('background-color: #fff');
      expect(lines[1]).toBe('background-image: url("bg.png")');
      expect(lines[2]).toBe('background-position: center');
      expect(lines[3]).toBe('background-repeat: no-repeat');
      expect(lines[4]).toBe('background-size: cover;'); // 最後のエントリにはセミコロンが付く
    });

    it('background-color と background-image の2つだけ設定した場合のソート順', () => {
      const sut = makeSUT();
      sut.setBackgroundImage('url("bg.png")');
      sut.setBackgroundColor('red');

      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // background-color < background-image
      expect(lines[0]).toBe('background-color: red');
      expect(lines[1]).toBe('background-image: url("bg.png");');
    });
  });

  // ── render() 出力フォーマット ──

  describe('render() 出力フォーマット', () => {
    it('単一プロパティの場合、セミコロンで終わる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('#fff');
      expect(sut.render()).toBe('background-color: #fff;');
    });

    it('複数プロパティの場合、セミコロン+改行で区切られ、最後にセミコロンが付く', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('#fff');
      sut.setBackgroundSize('cover');
      expect(sut.render()).toBe('background-color: #fff;\nbackground-size: cover;');
    });

    it('3つ以上のプロパティの場合も正しいフォーマットになる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('#fff');
      sut.setBackgroundPosition('center');
      sut.setBackgroundSize('cover');
      expect(sut.render()).toBe(
        'background-color: #fff;\nbackground-position: center;\nbackground-size: cover;'
      );
    });
  });

  // ── 設定プロパティのみ出力 ──

  describe('設定プロパティのみ出力', () => {
    it('background-color のみ設定した場合、background-color のみ出力される', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('#fff');
      const rendered = sut.render();
      expect(rendered).toBe('background-color: #fff;');
      expect(rendered).not.toContain('background-image');
      expect(rendered).not.toContain('background-size');
      expect(rendered).not.toContain('background-position');
      expect(rendered).not.toContain('background-repeat');
    });

    it('background-size のみ設定した場合、background-size のみ出力される', () => {
      const sut = makeSUT();
      sut.setBackgroundSize('cover');
      const rendered = sut.render();
      expect(rendered).toBe('background-size: cover;');
      expect(rendered).not.toContain('background-color');
      expect(rendered).not.toContain('background-image');
    });

    it('linear-gradient のみ設定した場合、background-image のみ出力される', () => {
      const sut = makeSUT();
      sut.setLinearGradient('to right', '#f00', '#00f');
      const rendered = sut.render();
      expect(rendered).toBe('background-image: linear-gradient(to right, #f00, #00f);');
      expect(rendered).not.toContain('background-color');
      expect(rendered).not.toContain('background-size');
    });
  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    const savedDev = process.env.DRAFT_OLE_DEV;
    beforeEach(() => { delete process.env.DRAFT_OLE_DEV; });
    afterEach(() => {
      if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
      else process.env.DRAFT_OLE_DEV = savedDev;
    });

    it('同じプロパティを複数回設定した場合、最後の値が使われる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('#fff');
      sut.setBackgroundColor('#000');
      expect(sut.render()).toBe('background-color: #000;');
    });

    it('render() を複数回呼んでも同じ値を返す', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('#fff');
      sut.setBackgroundSize('cover');
      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });

    it('全プロパティを設定した場合のrender()が正常に動作する', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('#fff');
      sut.setBackgroundImage('url("bg.png")');
      sut.setBackgroundSize('cover');
      sut.setBackgroundPosition('center');
      sut.setBackgroundRepeat('no-repeat');

      const rendered = sut.render();
      // 5プロパティすべてが出力に含まれる
      expect(rendered).toContain('background-color: #fff');
      expect(rendered).toContain('background-image: url("bg.png")');
      expect(rendered).toContain('background-size: cover');
      expect(rendered).toContain('background-position: center');
      expect(rendered).toContain('background-repeat: no-repeat');

      // 行数の確認（5プロパティ = 5行、;\n区切り）
      const lines = rendered.split(';\n');
      expect(lines).toHaveLength(5);
    });

    it('setBackgroundColorValue で設定後に setBackgroundColor で上書きできる', () => {
      const sut = makeSUT();
      sut.setBackgroundColorValue(CSSColor.hex('#ff0000'));
      sut.setBackgroundColor('blue');
      expect(sut.render()).toBe('background-color: blue;');
    });

    it('setBackgroundColor で設定後に setBackgroundColorValue で上書きできる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('blue');
      sut.setBackgroundColorValue(CSSColor.hex('#ff0000'));
      expect(sut.render()).toBe('background-color: #ff0000;');
    });

    it('background-color と linear-gradient を同時に設定できる', () => {
      const sut = makeSUT();
      sut.setBackgroundColor('#fff');
      sut.setLinearGradient('to right', '#f00', '#00f');
      const rendered = sut.render();
      expect(rendered).toContain('background-color: #fff');
      expect(rendered).toContain('background-image: linear-gradient(to right, #f00, #00f)');
    });
  });
});
