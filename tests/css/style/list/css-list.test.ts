/**
 * Task 5.4: CSSList -- リストスタイルプロパティのテスト
 *
 * TDD RED phase: CSSList の全setter・render()・メソッドチェーンを検証する。
 * - collectProperties() → render() 統一パターンに準拠
 * - 設定済みプロパティのみ出力、未設定は空文字列
 * - プロパティはキー名のアルファベット順ソート
 *
 * Requirements: 7.5, 7.7
 */
import { describe, it, expect } from 'vitest';
import { CSSList } from '../../../../src/css/style/list/css-list.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSList {
  return new CSSList();
}

// ============================================================
// CSSList
// ============================================================

describe('CSSList', () => {
  // ── 空出力テスト ──

  describe('空出力', () => {
    it('プロパティ未設定の場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });
  });

  // ── Renderable 準拠 ──

  describe('Renderable準拠', () => {
    it('render() メソッドが存在する', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });
  });

  // ── list-style-type (Req 7.5) ──

  describe('list-style-type', () => {
    it('disc を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleType('disc');
      expect(sut.render()).toBe('list-style-type: disc;');
    });

    it('circle を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleType('circle');
      expect(sut.render()).toBe('list-style-type: circle;');
    });

    it('square を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleType('square');
      expect(sut.render()).toBe('list-style-type: square;');
    });

    it('decimal を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleType('decimal');
      expect(sut.render()).toBe('list-style-type: decimal;');
    });

    it('lower-alpha を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleType('lower-alpha');
      expect(sut.render()).toBe('list-style-type: lower-alpha;');
    });

    it('upper-alpha を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleType('upper-alpha');
      expect(sut.render()).toBe('list-style-type: upper-alpha;');
    });

    it('lower-roman を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleType('lower-roman');
      expect(sut.render()).toBe('list-style-type: lower-roman;');
    });

    it('upper-roman を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleType('upper-roman');
      expect(sut.render()).toBe('list-style-type: upper-roman;');
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleType('none');
      expect(sut.render()).toBe('list-style-type: none;');
    });
  });

  // ── list-style-position (Req 7.5) ──

  describe('list-style-position', () => {
    it('inside を設定できる', () => {
      const sut = makeSUT();
      sut.setListStylePosition('inside');
      expect(sut.render()).toBe('list-style-position: inside;');
    });

    it('outside を設定できる', () => {
      const sut = makeSUT();
      sut.setListStylePosition('outside');
      expect(sut.render()).toBe('list-style-position: outside;');
    });
  });

  // ── list-style-image (Req 7.5) ──

  describe('list-style-image', () => {
    it('url() を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleImage('url("marker.png")');
      expect(sut.render()).toBe('list-style-image: url("marker.png");');
    });

    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyleImage('none');
      expect(sut.render()).toBe('list-style-image: none;');
    });
  });

  // ── list-style (shorthand) (Req 7.5) ──

  describe('list-style', () => {
    it('ショートハンドで複数の値を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyle('square inside url("marker.png")');
      expect(sut.render()).toBe(
        'list-style: square inside url("marker.png");',
      );
    });

    it('単一の値を設定できる', () => {
      const sut = makeSUT();
      sut.setListStyle('none');
      expect(sut.render()).toBe('list-style: none;');
    });
  });

  // ── メソッドチェーン（Fluent API） ──

  describe('メソッドチェーン', () => {
    it('setListStyleType が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setListStyleType('disc');
      expect(result).toBe(sut);
    });

    it('setListStylePosition が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setListStylePosition('inside');
      expect(result).toBe(sut);
    });

    it('setListStyleImage が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setListStyleImage('none');
      expect(result).toBe(sut);
    });

    it('setListStyle が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setListStyle('none');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして一度に設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setListStyleType('square')
        .setListStylePosition('inside')
        .setListStyleImage('url("bullet.png")');
      expect(result).toBe(sut);
    });
  });

  // ── 複数プロパティのアルファベット順ソート ──

  describe('複数プロパティのアルファベット順ソート', () => {
    it('全4プロパティを設定した場合のアルファベット順出力', () => {
      const sut = makeSUT();
      sut
        .setListStyleImage('url("bullet.png")')
        .setListStyle('square inside')
        .setListStyleType('disc')
        .setListStylePosition('outside');

      // アルファベット順:
      // list-style < list-style-image < list-style-position < list-style-type
      const expected = [
        'list-style: square inside;',
        'list-style-image: url("bullet.png");',
        'list-style-position: outside;',
        'list-style-type: disc;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('list-style-image と list-style-type をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setListStyleType('square');
      sut.setListStyleImage('url("marker.png")');
      // list-style-image < list-style-type (アルファベット順)
      expect(sut.render()).toBe(
        'list-style-image: url("marker.png");\nlist-style-type: square;',
      );
    });
  });

  // ── プロパティの組み合わせ ──

  describe('プロパティの組み合わせ', () => {
    it('list-style-type と list-style-position の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setListStyleType('decimal')
        .setListStylePosition('inside');

      // list-style-position < list-style-type
      const expected = [
        'list-style-position: inside;',
        'list-style-type: decimal;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('list-style-type, list-style-position, list-style-image の組み合わせ', () => {
      const sut = makeSUT();
      sut
        .setListStyleType('circle')
        .setListStylePosition('outside')
        .setListStyleImage('url("icon.svg")');

      // list-style-image < list-style-position < list-style-type
      const expected = [
        'list-style-image: url("icon.svg");',
        'list-style-position: outside;',
        'list-style-type: circle;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── プロパティの上書き ──

  describe('プロパティの上書き', () => {
    it('同じプロパティを再設定すると上書きされる', () => {
      const sut = makeSUT();
      sut.setListStyleType('disc');
      sut.setListStyleType('square');
      expect(sut.render()).toBe('list-style-type: square;');
    });

    it('list-style-position を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setListStylePosition('inside');
      sut.setListStylePosition('outside');
      sut.setListStylePosition('inside');
      expect(sut.render()).toBe('list-style-position: inside;');
    });
  });

  // ── render() の安定性 ──

  describe('render()の安定性', () => {
    it('render() を複数回呼んでも同じ結果を返す', () => {
      const sut = makeSUT();
      sut.setListStyleType('disc').setListStylePosition('inside');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('単一プロパティの末尾にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setListStyleType('disc');
      expect(sut.render()).toMatch(/;$/);
    });

    it('複数プロパティは改行+セミコロンで区切られ、最後にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setListStyleType('disc').setListStylePosition('inside');
      const output = sut.render();
      expect(output).toContain(';\n');
      expect(output).toMatch(/;$/);
    });

    it('プロパティ名と値の間にコロンとスペースがある', () => {
      const sut = makeSUT();
      sut.setListStyleType('disc');
      expect(sut.render()).toMatch(/^[a-z-]+: .+;$/);
    });
  });
});
