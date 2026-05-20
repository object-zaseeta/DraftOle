/**
 * Task 6.6: CSSBackground -- setBackground / gradient ヘルパー追加カバレッジ
 *
 * 既存テスト (css-background.test.ts) でカバーされていない以下の分岐を網羅する。
 * - setBackground(string)         (line 57 string 分岐)
 * - setBackground({...})          (line 57 object 分岐、line 60-64 `!== undefined` ガード)
 * - 部分オブジェクト (color のみ / position のみ など)
 * - 全フィールド付きオブジェクト
 * - メソッドチェーン (this 返却)
 * - setRadialGradient (ストップ数 2, 3, カラーストップ付き)
 *
 * Requirements: 4.6
 * Boundary: BackgroundTests (tests/css/style/background/)
 */
import { describe, it, expect } from 'vitest';
import { CSSBackground } from '../../../../src/css/style/background/css-background.js';

function makeSUT(): CSSBackground {
  return new CSSBackground();
}

describe('CSSBackground.setBackground (shorthand)', () => {
  // ── string 引数 ──

  describe('文字列引数 (line 57 string 分岐)', () => {
    it('CSS background ショートハンド文字列を一括設定できる', () => {
      const sut = makeSUT();
      sut.setBackground('#fff url("bg.png") no-repeat center/cover');
      expect(sut.render()).toBe(
        'background: #fff url("bg.png") no-repeat center/cover;'
      );
    });

    it('radial-gradient と background-color を含む複合ショートハンドを設定できる', () => {
      const sut = makeSUT();
      sut.setBackground('radial-gradient(circle, #f00, #00f), #000');
      expect(sut.render()).toBe(
        'background: radial-gradient(circle, #f00, #00f), #000;'
      );
    });

    it('単純な色名だけのショートハンドを設定できる', () => {
      const sut = makeSUT();
      sut.setBackground('red');
      expect(sut.render()).toBe('background: red;');
    });
  });

  // ── object 引数 (各 !== undefined ガードを個別に踏む) ──

  describe('オブジェクト引数 (line 60-64 各 `!== undefined` ガード)', () => {
    it('空オブジェクトを渡しても何も出力されない (全ガード false)', () => {
      const sut = makeSUT();
      sut.setBackground({});
      expect(sut.render()).toBe('');
    });

    it('color のみ定義したオブジェクトで background-color のみ設定される', () => {
      const sut = makeSUT();
      sut.setBackground({ color: '#fff' });
      expect(sut.render()).toBe('background-color: #fff;');
    });

    it('image のみ定義したオブジェクトで background-image のみ設定される', () => {
      const sut = makeSUT();
      sut.setBackground({ image: 'url("bg.png")' });
      expect(sut.render()).toBe('background-image: url("bg.png");');
    });

    it('size のみ定義したオブジェクトで background-size のみ設定される', () => {
      const sut = makeSUT();
      sut.setBackground({ size: 'cover' });
      expect(sut.render()).toBe('background-size: cover;');
    });

    it('position のみ定義したオブジェクトで background-position のみ設定される', () => {
      const sut = makeSUT();
      sut.setBackground({ position: 'center' });
      expect(sut.render()).toBe('background-position: center;');
    });

    it('repeat のみ定義したオブジェクトで background-repeat のみ設定される', () => {
      const sut = makeSUT();
      sut.setBackground({ repeat: 'no-repeat' });
      expect(sut.render()).toBe('background-repeat: no-repeat;');
    });

    it('color + position の部分オブジェクトで 2 プロパティのみ設定される', () => {
      const sut = makeSUT();
      sut.setBackground({ color: '#fff', position: 'center' });
      const rendered = sut.render();
      expect(rendered).toContain('background-color: #fff');
      expect(rendered).toContain('background-position: center');
      expect(rendered).not.toContain('background-image');
      expect(rendered).not.toContain('background-size');
      expect(rendered).not.toContain('background-repeat');
    });

    it('全フィールド付きオブジェクトで 5 プロパティすべて設定される', () => {
      const sut = makeSUT();
      sut.setBackground({
        color: '#fff',
        image: 'url("bg.png")',
        size: 'cover',
        position: 'center',
        repeat: 'no-repeat',
      });
      const rendered = sut.render();
      expect(rendered).toContain('background-color: #fff');
      expect(rendered).toContain('background-image: url("bg.png")');
      expect(rendered).toContain('background-size: cover');
      expect(rendered).toContain('background-position: center');
      expect(rendered).toContain('background-repeat: no-repeat');
    });

    it('明示的に undefined を指定したフィールドはガードで除外される', () => {
      const sut = makeSUT();
      sut.setBackground({
        color: '#fff',
        image: undefined,
        size: undefined,
        position: undefined,
        repeat: undefined,
      });
      // color のみ設定される
      expect(sut.render()).toBe('background-color: #fff;');
    });
  });

  // ── this 返却 / メソッドチェーン ──

  describe('メソッドチェーン (this 返却)', () => {
    it('setBackground(string) が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackground('red');
      expect(result).toBe(sut);
    });

    it('setBackground(object) が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackground({ color: '#fff' });
      expect(result).toBe(sut);
    });

    it('setBackground(empty object) でも this を返す', () => {
      const sut = makeSUT();
      const result = sut.setBackground({});
      expect(result).toBe(sut);
    });

    it('setBackground(string).setBackgroundColor(...) のチェーンが動作する', () => {
      const sut = makeSUT();
      const result = sut
        .setBackground('red')
        .setBackgroundColor('#fff');
      expect(result).toBe(sut);
      // 'background' shorthand と 'background-color' は別キーなので両方残る
      const rendered = sut.render();
      expect(rendered).toContain('background: red');
      expect(rendered).toContain('background-color: #fff');
    });

    it('setBackground(object) を 2 回呼んでもチェーン可能で値が累積される', () => {
      const sut = makeSUT();
      sut
        .setBackground({ color: '#fff' })
        .setBackground({ size: 'cover' });
      const rendered = sut.render();
      expect(rendered).toContain('background-color: #fff');
      expect(rendered).toContain('background-size: cover');
    });
  });
});

describe('CSSBackground.setRadialGradient', () => {
  it('2色のラジアルグラデーションを設定できる', () => {
    const sut = makeSUT();
    sut.setRadialGradient('circle', '#f00', '#00f');
    expect(sut.render()).toBe(
      'background-image: radial-gradient(circle, #f00, #00f);'
    );
  });

  it('3色のラジアルグラデーションを設定できる', () => {
    const sut = makeSUT();
    sut.setRadialGradient('ellipse at center', '#f00', '#0f0', '#00f');
    expect(sut.render()).toBe(
      'background-image: radial-gradient(ellipse at center, #f00, #0f0, #00f);'
    );
  });

  it('カラーストップ付きのラジアルグラデーションを設定できる', () => {
    const sut = makeSUT();
    sut.setRadialGradient('circle', '#f00 0%', '#0f0 50%', '#00f 100%');
    expect(sut.render()).toBe(
      'background-image: radial-gradient(circle, #f00 0%, #0f0 50%, #00f 100%);'
    );
  });

  it('setRadialGradient が this を返す（メソッドチェーン）', () => {
    const sut = makeSUT();
    const result = sut.setRadialGradient('circle', '#f00', '#00f');
    expect(result).toBe(sut);
  });

  it('setRadialGradient と setBackgroundColor のチェーンが動作する', () => {
    const sut = makeSUT();
    const result = sut
      .setRadialGradient('circle', '#f00', '#00f')
      .setBackgroundColor('#000');
    expect(result).toBe(sut);
    const rendered = sut.render();
    expect(rendered).toContain('background-color: #000');
    expect(rendered).toContain(
      'background-image: radial-gradient(circle, #f00, #00f)'
    );
  });

  it('setRadialGradient が既存の background-image を上書きする', () => {
    const sut = makeSUT();
    sut.setBackgroundImage('url("old.png")');
    sut.setRadialGradient('circle', '#f00', '#00f');
    expect(sut.render()).toBe(
      'background-image: radial-gradient(circle, #f00, #00f);'
    );
  });
});
