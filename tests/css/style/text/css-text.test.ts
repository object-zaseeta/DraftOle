/**
 * Task 4.3: CSSText -- テキスト装飾プロパティのテスト
 *
 * TDD RED phase: CSSText の全setter・render()・メソッドチェーンを検証する。
 * - collectProperties() → render() 統一パターンに準拠
 * - 設定済みプロパティのみ出力、未設定は空文字列
 * - プロパティはキー名のアルファベット順ソート
 *
 * Requirements: 6.4, 6.5
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSText } from '../../../../src/css/style/text/css-text.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): CSSText {
  return new CSSText();
}

// ============================================================
// CSSText
// ============================================================

describe('CSSText', () => {
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

  // ── text-align (Req 6.4) ──

  describe('text-align', () => {
    it('left を設定できる', () => {
      const sut = makeSUT();
      sut.setTextAlign('left');
      expect(sut.render()).toBe('text-align: left;');
    });

    it('center を設定できる', () => {
      const sut = makeSUT();
      sut.setTextAlign('center');
      expect(sut.render()).toBe('text-align: center;');
    });

    it('right を設定できる', () => {
      const sut = makeSUT();
      sut.setTextAlign('right');
      expect(sut.render()).toBe('text-align: right;');
    });

    it('justify を設定できる', () => {
      const sut = makeSUT();
      sut.setTextAlign('justify');
      expect(sut.render()).toBe('text-align: justify;');
    });
  });

  // ── text-decoration (Req 6.4) ──

  describe('text-decoration', () => {
    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecoration('none');
      expect(sut.render()).toBe('text-decoration: none;');
    });

    it('underline を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecoration('underline');
      expect(sut.render()).toBe('text-decoration: underline;');
    });

    it('line-through を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecoration('line-through');
      expect(sut.render()).toBe('text-decoration: line-through;');
    });

    it('overline を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecoration('overline');
      expect(sut.render()).toBe('text-decoration: overline;');
    });
  });

  // ── text-transform (Req 6.4) ──

  describe('text-transform', () => {
    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setTextTransform('none');
      expect(sut.render()).toBe('text-transform: none;');
    });

    it('uppercase を設定できる', () => {
      const sut = makeSUT();
      sut.setTextTransform('uppercase');
      expect(sut.render()).toBe('text-transform: uppercase;');
    });

    it('lowercase を設定できる', () => {
      const sut = makeSUT();
      sut.setTextTransform('lowercase');
      expect(sut.render()).toBe('text-transform: lowercase;');
    });

    it('capitalize を設定できる', () => {
      const sut = makeSUT();
      sut.setTextTransform('capitalize');
      expect(sut.render()).toBe('text-transform: capitalize;');
    });
  });

  // ── text-indent (Req 6.4) ──

  describe('text-indent', () => {
    it('ピクセル値を設定できる', () => {
      const sut = makeSUT();
      sut.setTextIndent('20px');
      expect(sut.render()).toBe('text-indent: 20px;');
    });

    it('em値を設定できる', () => {
      const sut = makeSUT();
      sut.setTextIndent('2em');
      expect(sut.render()).toBe('text-indent: 2em;');
    });

    it('パーセント値を設定できる', () => {
      const sut = makeSUT();
      sut.setTextIndent('10%');
      expect(sut.render()).toBe('text-indent: 10%;');
    });
  });

  // ── word-spacing (Req 6.4) ──

  describe('word-spacing', () => {
    it('normal を設定できる', () => {
      const sut = makeSUT();
      sut.setWordSpacing('normal');
      expect(sut.render()).toBe('word-spacing: normal;');
    });

    it('ピクセル値を設定できる', () => {
      const sut = makeSUT();
      sut.setWordSpacing('5px');
      expect(sut.render()).toBe('word-spacing: 5px;');
    });

    it('負の値を設定できる', () => {
      const sut = makeSUT();
      sut.setWordSpacing('-2px');
      expect(sut.render()).toBe('word-spacing: -2px;');
    });
  });

  // ── white-space (Req 6.4) ──

  describe('white-space', () => {
    it('normal を設定できる', () => {
      const sut = makeSUT();
      sut.setWhiteSpace('normal');
      expect(sut.render()).toBe('white-space: normal;');
    });

    it('nowrap を設定できる', () => {
      const sut = makeSUT();
      sut.setWhiteSpace('nowrap');
      expect(sut.render()).toBe('white-space: nowrap;');
    });

    it('pre を設定できる', () => {
      const sut = makeSUT();
      sut.setWhiteSpace('pre');
      expect(sut.render()).toBe('white-space: pre;');
    });

    it('pre-wrap を設定できる', () => {
      const sut = makeSUT();
      sut.setWhiteSpace('pre-wrap');
      expect(sut.render()).toBe('white-space: pre-wrap;');
    });

    it('pre-line を設定できる', () => {
      const sut = makeSUT();
      sut.setWhiteSpace('pre-line');
      expect(sut.render()).toBe('white-space: pre-line;');
    });
  });

  // ── text-overflow (Req 6.4) ──

  describe('text-overflow', () => {
    it('clip を設定できる', () => {
      const sut = makeSUT();
      sut.setTextOverflow('clip');
      expect(sut.render()).toBe('text-overflow: clip;');
    });

    it('ellipsis を設定できる', () => {
      const sut = makeSUT();
      sut.setTextOverflow('ellipsis');
      expect(sut.render()).toBe('text-overflow: ellipsis;');
    });
  });

  // ── text-decoration-color (Req 6.5) ──

  describe('text-decoration-color', () => {
    it('色名を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationColor('red');
      expect(sut.render()).toBe('text-decoration-color: red;');
    });

    it('HEX値を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationColor('#ff0000');
      expect(sut.render()).toBe('text-decoration-color: #ff0000;');
    });
  });

  // ── text-decoration-style (Req 6.5) ──

  describe('text-decoration-style', () => {
    it('solid を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationStyle('solid');
      expect(sut.render()).toBe('text-decoration-style: solid;');
    });

    it('double を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationStyle('double');
      expect(sut.render()).toBe('text-decoration-style: double;');
    });

    it('dotted を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationStyle('dotted');
      expect(sut.render()).toBe('text-decoration-style: dotted;');
    });

    it('dashed を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationStyle('dashed');
      expect(sut.render()).toBe('text-decoration-style: dashed;');
    });

    it('wavy を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationStyle('wavy');
      expect(sut.render()).toBe('text-decoration-style: wavy;');
    });
  });

  // ── text-decoration-line (Req 6.5) ──

  describe('text-decoration-line', () => {
    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationLine('none');
      expect(sut.render()).toBe('text-decoration-line: none;');
    });

    it('underline を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationLine('underline');
      expect(sut.render()).toBe('text-decoration-line: underline;');
    });

    it('overline を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationLine('overline');
      expect(sut.render()).toBe('text-decoration-line: overline;');
    });

    it('line-through を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationLine('line-through');
      expect(sut.render()).toBe('text-decoration-line: line-through;');
    });

    it('複合値を設定できる', () => {
      const sut = makeSUT();
      sut.setTextDecorationLine('underline overline');
      expect(sut.render()).toBe('text-decoration-line: underline overline;');
    });
  });

  // ── word-break (Req 6.5) ──

  describe('word-break', () => {
    it('normal を設定できる', () => {
      const sut = makeSUT();
      sut.setWordBreak('normal');
      expect(sut.render()).toBe('word-break: normal;');
    });

    it('break-all を設定できる', () => {
      const sut = makeSUT();
      sut.setWordBreak('break-all');
      expect(sut.render()).toBe('word-break: break-all;');
    });

    it('keep-all を設定できる', () => {
      const sut = makeSUT();
      sut.setWordBreak('keep-all');
      expect(sut.render()).toBe('word-break: keep-all;');
    });

    it('break-word を設定できる', () => {
      const sut = makeSUT();
      sut.setWordBreak('break-word');
      expect(sut.render()).toBe('word-break: break-word;');
    });
  });

  // ── overflow-wrap (Req 6.5) ──

  describe('overflow-wrap', () => {
    it('normal を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowWrap('normal');
      expect(sut.render()).toBe('overflow-wrap: normal;');
    });

    it('break-word を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowWrap('break-word');
      expect(sut.render()).toBe('overflow-wrap: break-word;');
    });

    it('anywhere を設定できる', () => {
      const sut = makeSUT();
      sut.setOverflowWrap('anywhere');
      expect(sut.render()).toBe('overflow-wrap: anywhere;');
    });
  });

  // ── text-shadow (Req 6.5) ──

  describe('text-shadow', () => {
    it('none を設定できる', () => {
      const sut = makeSUT();
      sut.setTextShadow('none');
      expect(sut.render()).toBe('text-shadow: none;');
    });

    it('影の値を設定できる', () => {
      const sut = makeSUT();
      sut.setTextShadow('2px 2px 4px rgba(0,0,0,0.5)');
      expect(sut.render()).toBe('text-shadow: 2px 2px 4px rgba(0,0,0,0.5);');
    });

    it('複数の影を設定できる', () => {
      const sut = makeSUT();
      sut.setTextShadow('1px 1px red, -1px -1px blue');
      expect(sut.render()).toBe('text-shadow: 1px 1px red, -1px -1px blue;');
    });
  });

  // ── メソッドチェーン（Fluent API） ──

  describe('メソッドチェーン', () => {
    it('setTextAlign が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTextAlign('center');
      expect(result).toBe(sut);
    });

    it('setTextDecoration が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTextDecoration('none');
      expect(result).toBe(sut);
    });

    it('setTextTransform が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTextTransform('uppercase');
      expect(result).toBe(sut);
    });

    it('setTextIndent が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTextIndent('20px');
      expect(result).toBe(sut);
    });

    it('setWordSpacing が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setWordSpacing('5px');
      expect(result).toBe(sut);
    });

    it('setWhiteSpace が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setWhiteSpace('nowrap');
      expect(result).toBe(sut);
    });

    it('setTextOverflow が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTextOverflow('ellipsis');
      expect(result).toBe(sut);
    });

    it('setTextDecorationColor が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTextDecorationColor('red');
      expect(result).toBe(sut);
    });

    it('setTextDecorationStyle が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTextDecorationStyle('solid');
      expect(result).toBe(sut);
    });

    it('setTextDecorationLine が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTextDecorationLine('underline');
      expect(result).toBe(sut);
    });

    it('setWordBreak が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setWordBreak('break-all');
      expect(result).toBe(sut);
    });

    it('setOverflowWrap が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setOverflowWrap('break-word');
      expect(result).toBe(sut);
    });

    it('setTextShadow が this を返す', () => {
      const sut = makeSUT();
      const result = sut.setTextShadow('none');
      expect(result).toBe(sut);
    });

    it('複数のsetterをチェーンして一度に設定できる', () => {
      const sut = makeSUT();
      const result = sut
        .setTextAlign('center')
        .setTextDecoration('underline')
        .setTextTransform('uppercase');
      expect(result).toBe(sut);
    });
  });

  // ── 複数プロパティのアルファベット順ソート ──

  describe('複数プロパティのアルファベット順ソート', () => {
    it('text-align と text-decoration をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setTextDecoration('underline');
      sut.setTextAlign('center');
      // text-align < text-decoration (アルファベット順)
      expect(sut.render()).toBe(
        'text-align: center;\ntext-decoration: underline;',
      );
    });

    it('text-align, text-decoration, text-transform をアルファベット順で出力する', () => {
      const sut = makeSUT();
      sut.setTextTransform('uppercase');
      sut.setTextAlign('left');
      sut.setTextDecoration('none');
      // text-align < text-decoration < text-transform
      expect(sut.render()).toBe(
        'text-align: left;\ntext-decoration: none;\ntext-transform: uppercase;',
      );
    });

    it('全13プロパティを設定した場合のアルファベット順出力', () => {
      const sut = makeSUT();
      sut
        .setTextShadow('1px 1px black')
        .setWordBreak('break-all')
        .setOverflowWrap('break-word')
        .setTextDecorationLine('underline')
        .setTextDecorationStyle('solid')
        .setTextDecorationColor('red')
        .setTextOverflow('ellipsis')
        .setWhiteSpace('nowrap')
        .setWordSpacing('5px')
        .setTextIndent('20px')
        .setTextTransform('uppercase')
        .setTextDecoration('none')
        .setTextAlign('center');

      // アルファベット順:
      // overflow-wrap, text-align, text-decoration, text-decoration-color,
      // text-decoration-line, text-decoration-style, text-indent,
      // text-overflow, text-shadow, text-transform, white-space,
      // word-break, word-spacing
      const expected = [
        'overflow-wrap: break-word;',
        'text-align: center;',
        'text-decoration: none;',
        'text-decoration-color: red;',
        'text-decoration-line: underline;',
        'text-decoration-style: solid;',
        'text-indent: 20px;',
        'text-overflow: ellipsis;',
        'text-shadow: 1px 1px black;',
        'text-transform: uppercase;',
        'white-space: nowrap;',
        'word-break: break-all;',
        'word-spacing: 5px;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── プロパティの組み合わせ ──

  describe('プロパティの組み合わせ', () => {
    it('基本テキストプロパティの組み合わせ（align, decoration, transform）', () => {
      const sut = makeSUT();
      sut
        .setTextAlign('center')
        .setTextDecoration('underline')
        .setTextTransform('capitalize')
        .setTextIndent('1em')
        .setWordSpacing('2px');

      // text-align < text-decoration < text-indent < text-transform < word-spacing
      const expected = [
        'text-align: center;',
        'text-decoration: underline;',
        'text-indent: 1em;',
        'text-transform: capitalize;',
        'word-spacing: 2px;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('テキスト装飾詳細プロパティの組み合わせ（decoration-*）', () => {
      const sut = makeSUT();
      sut
        .setTextDecorationLine('underline')
        .setTextDecorationStyle('wavy')
        .setTextDecorationColor('#3366ff');

      // text-decoration-color < text-decoration-line < text-decoration-style
      const expected = [
        'text-decoration-color: #3366ff;',
        'text-decoration-line: underline;',
        'text-decoration-style: wavy;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });

    it('テキスト制御プロパティの組み合わせ（white-space, overflow, word-break）', () => {
      const sut = makeSUT();
      sut
        .setWhiteSpace('nowrap')
        .setTextOverflow('ellipsis')
        .setWordBreak('break-all')
        .setOverflowWrap('break-word');

      // overflow-wrap < text-overflow < white-space < word-break
      const expected = [
        'overflow-wrap: break-word;',
        'text-overflow: ellipsis;',
        'white-space: nowrap;',
        'word-break: break-all;',
      ].join('\n');

      expect(sut.render()).toBe(expected);
    });
  });

  // ── プロパティの上書き ──

  describe('プロパティの上書き', () => {
    const savedDev = process.env.DRAFT_OLE_DEV;
    beforeEach(() => { delete process.env.DRAFT_OLE_DEV; });
    afterEach(() => {
      if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
      else process.env.DRAFT_OLE_DEV = savedDev;
    });

    it('同じプロパティを再設定すると上書きされる', () => {
      const sut = makeSUT();
      sut.setTextAlign('left');
      sut.setTextAlign('center');
      expect(sut.render()).toBe('text-align: center;');
    });

    it('text-decoration を上書きした場合、最後の値が使用される', () => {
      const sut = makeSUT();
      sut.setTextDecoration('underline');
      sut.setTextDecoration('none');
      sut.setTextDecoration('line-through');
      expect(sut.render()).toBe('text-decoration: line-through;');
    });
  });

  // ── render() の安定性 ──

  describe('render()の安定性', () => {
    it('render() を複数回呼んでも同じ結果を返す', () => {
      const sut = makeSUT();
      sut.setTextAlign('center').setTextDecoration('underline');

      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('単一プロパティの末尾にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setTextAlign('center');
      expect(sut.render()).toMatch(/;$/);
    });

    it('複数プロパティは改行+セミコロンで区切られ、最後にセミコロンがある', () => {
      const sut = makeSUT();
      sut.setTextAlign('center').setTextDecoration('underline');
      const output = sut.render();
      expect(output).toContain(';\n');
      expect(output).toMatch(/;$/);
    });

    it('プロパティ名と値の間にコロンとスペースがある', () => {
      const sut = makeSUT();
      sut.setTextAlign('center');
      expect(sut.render()).toMatch(/^[a-z-]+: .+;$/);
    });
  });
});
