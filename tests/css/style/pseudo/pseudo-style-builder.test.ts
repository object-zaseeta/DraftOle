import { describe, it, expect } from 'vitest';
import { PseudoStyleBuilder } from '../../../../src/css/style/pseudo/pseudo-style-builder.js';

describe('PseudoStyleBuilder', () => {
  describe('fluent メソッド', () => {
    it('color() が color を設定する', () => {
      const b = new PseudoStyleBuilder();
      b.color('#333');
      expect(b.toMap().get('color')).toBe('#333');
    });

    it('borderColor() が border-color を設定する', () => {
      const b = new PseudoStyleBuilder();
      b.borderColor('#ef4444');
      expect(b.toMap().get('border-color')).toBe('#ef4444');
    });

    it('background() が background を設定する', () => {
      const b = new PseudoStyleBuilder();
      b.background('#fff');
      expect(b.toMap().get('background')).toBe('#fff');
    });

    it('padding(number) が px 付きで設定される', () => {
      const b = new PseudoStyleBuilder();
      b.padding(12);
      expect(b.toMap().get('padding')).toBe('12px');
    });

    it('padding(string) がそのまま設定される', () => {
      const b = new PseudoStyleBuilder();
      b.padding('8px 16px');
      expect(b.toMap().get('padding')).toBe('8px 16px');
    });

    it('set() でエスケープハッチとして任意プロパティを設定できる', () => {
      const b = new PseudoStyleBuilder();
      b.set('outline', '2px solid blue');
      expect(b.toMap().get('outline')).toBe('2px solid blue');
    });
  });

  describe('メソッドチェーン', () => {
    it('複数メソッドをチェーンして複数プロパティを設定できる', () => {
      const b = new PseudoStyleBuilder();
      b.color('#ef4444').borderColor('#ef4444').opacity('0.8');
      expect(b.toMap().size).toBe(3);
      expect(b.toMap().get('color')).toBe('#ef4444');
      expect(b.toMap().get('border-color')).toBe('#ef4444');
      expect(b.toMap().get('opacity')).toBe('0.8');
    });

    it('チェーンの各メソッドは同一インスタンスを返す', () => {
      const b = new PseudoStyleBuilder();
      expect(b.color('red')).toBe(b);
    });

    it('同じプロパティを2度設定すると後勝ちで上書きされる', () => {
      const b = new PseudoStyleBuilder();
      b.padding('8px');
      b.set('padding', '16px');
      expect(b.toMap().get('padding')).toBe('16px');
    });
  });

  describe('toMap()', () => {
    it('何も設定しない場合は空 Map を返す', () => {
      const b = new PseudoStyleBuilder();
      expect(b.toMap().size).toBe(0);
    });
  });

  describe('全プロパティのキー確認', () => {
    it('各 fluent メソッドが正しい kebab-case キーを設定する', () => {
      const b = new PseudoStyleBuilder();
      b.color('a').background('a').backgroundColor('a').opacity('a')
       .transform('a').boxShadow('a').border('a').borderColor('a')
       .borderRadius('a').fontSize('a').fontWeight('a').textDecoration('a')
       .width('a').height('a').cursor('a').transition('a');

      const map = b.toMap();
      expect(map.get('color')).toBe('a');
      expect(map.get('background')).toBe('a');
      expect(map.get('background-color')).toBe('a');
      expect(map.get('opacity')).toBe('a');
      expect(map.get('transform')).toBe('a');
      expect(map.get('box-shadow')).toBe('a');
      expect(map.get('border')).toBe('a');
      expect(map.get('border-color')).toBe('a');
      expect(map.get('border-radius')).toBe('a');
      expect(map.get('font-size')).toBe('a');
      expect(map.get('font-weight')).toBe('a');
      expect(map.get('text-decoration')).toBe('a');
      expect(map.get('width')).toBe('a');
      expect(map.get('height')).toBe('a');
      expect(map.get('cursor')).toBe('a');
      expect(map.get('transition')).toBe('a');
    });
  });
});
