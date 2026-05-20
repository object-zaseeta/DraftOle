/**
 * CSSPseudo 単体テスト（PseudoStyleBuilder ベース API）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CSSPseudo } from '../../../../src/css/style/pseudo/css-pseudo.js';
import { PseudoStyleBuilder } from '../../../../src/css/style/pseudo/pseudo-style-builder.js';

describe('CSSPseudo', () => {
  describe('デフォルト挙動', () => {
    it('何も設定していない場合、renderForScope は空配列、hasAny は false を返す', () => {
      const sut = new CSSPseudo();
      expect(sut.renderForScope('abc')).toEqual([]);
      expect(sut.hasAny()).toBe(false);
    });
  });

  describe('setHover 単体', () => {
    it('background のみを設定すると `.abc:hover { background: #eee; }` ブロックを返す', () => {
      const sut = new CSSPseudo();
      const b = new PseudoStyleBuilder();
      b.background('#eee');
      sut.setHover(b);
      expect(sut.renderForScope('abc')).toEqual([
        '.abc:hover {\n  background: #eee;\n}',
      ]);
      expect(sut.hasAny()).toBe(true);
    });
  });

  describe('setFocus / setActive 単体', () => {
    it('setFocus 単体は `.abc:focus { ... }` ブロックを返す', () => {
      const sut = new CSSPseudo();
      sut.setFocus(new PseudoStyleBuilder().border('2px solid blue'));
      const blocks = sut.renderForScope('abc');
      expect(blocks.length).toBe(1);
      expect(blocks[0]).toContain('.abc:focus {');
      expect(blocks[0]).toContain('  border: 2px solid blue;');
    });

    it('setActive 単体は `.abc:active { ... }` ブロックを返す', () => {
      const sut = new CSSPseudo();
      sut.setActive(new PseudoStyleBuilder().transform('scale(0.95)'));
      const blocks = sut.renderForScope('abc');
      expect(blocks.length).toBe(1);
      expect(blocks[0]).toContain('.abc:active {');
      expect(blocks[0]).toContain('  transform: scale(0.95);');
    });
  });

  describe('全プロパティ指定', () => {
    it('hover に全プロパティを指定すると対応する kebab-case CSS プロパティが全て出力される', () => {
      const sut = new CSSPseudo();
      sut.setHover(
        new PseudoStyleBuilder()
          .background('#eee')
          .color('#333')
          .opacity('0.8')
          .transform('scale(1.1)')
          .boxShadow('0 2px 4px rgba(0,0,0,0.2)')
          .borderRadius('4px')
          .padding('8px')
          .width('100px')
          .height('50px')
          .border('1px solid #ccc')
          .borderColor('#ccc')
          .fontSize('14px')
          .fontWeight('bold')
          .textDecoration('underline')
          .cursor('pointer')
          .transition('all 0.2s'),
      );
      const blocks = sut.renderForScope('abc');
      expect(blocks.length).toBe(1);
      const body = blocks[0];
      expect(body).toContain('  background: #eee;');
      expect(body).toContain('  color: #333;');
      expect(body).toContain('  opacity: 0.8;');
      expect(body).toContain('  transform: scale(1.1);');
      expect(body).toContain('  box-shadow: 0 2px 4px rgba(0,0,0,0.2);');
      expect(body).toContain('  border-radius: 4px;');
      expect(body).toContain('  padding: 8px;');
      expect(body).toContain('  width: 100px;');
      expect(body).toContain('  height: 50px;');
      expect(body).toContain('  border: 1px solid #ccc;');
      expect(body).toContain('  border-color: #ccc;');
      expect(body).toContain('  font-size: 14px;');
      expect(body).toContain('  font-weight: bold;');
      expect(body).toContain('  text-decoration: underline;');
      expect(body).toContain('  cursor: pointer;');
      expect(body).toContain('  transition: all 0.2s;');
    });
  });

  describe('3 擬似併用', () => {
    it('hover + focus + active を全て設定すると 3 ブロック返り、順序は hover → focus → active', () => {
      const sut = new CSSPseudo();
      sut
        .setHover(new PseudoStyleBuilder().background('#eee'))
        .setFocus(new PseudoStyleBuilder().border('2px solid blue'))
        .setActive(new PseudoStyleBuilder().transform('scale(0.95)'));
      const blocks = sut.renderForScope('abc');
      expect(blocks.length).toBe(3);
      expect(blocks[0]).toContain('.abc:hover {');
      expect(blocks[0]).toContain('  background: #eee;');
      expect(blocks[1]).toContain('.abc:focus {');
      expect(blocks[1]).toContain('  border: 2px solid blue;');
      expect(blocks[2]).toContain('.abc:active {');
      expect(blocks[2]).toContain('  transform: scale(0.95);');
    });
  });

  describe('重複プロパティガード', () => {
    const savedDev = process.env.DRAFT_OLE_DEV;
    beforeEach(() => {
      process.env.DRAFT_OLE_DEV = 'true';
    });
    afterEach(() => {
      if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
      else process.env.DRAFT_OLE_DEV = savedDev;
    });

    it('同一 pseudo で同じキーを 2 度設定すると guardDuplicateCssProperty がエラーを throw する', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const sut = new CSSPseudo();
      sut.setHover(new PseudoStyleBuilder().background('#eee'));
      expect(() => {
        sut.setHover(new PseudoStyleBuilder().background('#fff'));
      }).toThrow(/background/);
      warnSpy.mockRestore();
    });
  });

  describe('Renderable 非実装確認', () => {
    it('CSSPseudo インスタンスは render メソッドを持たない', () => {
      const sut = new CSSPseudo();
      expect(typeof (sut as { render?: unknown }).render).toBe('undefined');
    });
  });
});
