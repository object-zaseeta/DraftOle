import { describe, expect, it } from 'vitest';
import { div } from '../../src/html/tags/index.js';
import { hstack, vstack, spacer } from '../../src/html/layout/layout-factories.js';
import { HStack, VStack, Spacer } from '../../src/view/primitives.js';

describe('primitives 互換性: PascalCase は小文字ファクトリの薄いラッパー', () => {
  describe('VStack / vstack', () => {
    it('VStack({ spacing: 8 }, div()) と vstack({ spacing: 8 }, div()) の render() 出力が完全一致する', () => {
      const pascal = VStack({ spacing: 8 }, div());
      const lower = vstack({ spacing: 8 }, div());
      expect(pascal.render()).toBe(lower.render());
    });

    it('VStack({ alignment: "center" }, div()) と vstack({ alignment: "center" }, div()) の render() 出力が完全一致する', () => {
      const pascal = VStack({ alignment: 'center' }, div());
      const lower = vstack({ alignment: 'center' }, div());
      expect(pascal.render()).toBe(lower.render());
    });

    it('VStack({ spacing: 8, alignment: "center" }, div()) と vstack({ spacing: 8, alignment: "center" }, div()) の render() 出力が完全一致する', () => {
      const pascal = VStack({ spacing: 8, alignment: 'center' }, div());
      const lower = vstack({ spacing: 8, alignment: 'center' }, div());
      expect(pascal.render()).toBe(lower.render());
    });
  });

  describe('HStack / hstack', () => {
    it('HStack({ spacing: 8 }, div()) と hstack({ spacing: 8 }, div()) の render() 出力が完全一致する', () => {
      const pascal = HStack({ spacing: 8 }, div());
      const lower = hstack({ spacing: 8 }, div());
      expect(pascal.render()).toBe(lower.render());
    });

    it('HStack({ alignment: "center" }, div()) と hstack({ alignment: "center" }, div()) の render() 出力が完全一致する', () => {
      const pascal = HStack({ alignment: 'center' }, div());
      const lower = hstack({ alignment: 'center' }, div());
      expect(pascal.render()).toBe(lower.render());
    });

    it('HStack({ spacing: 8, alignment: "center" }, div()) と hstack({ spacing: 8, alignment: "center" }, div()) の render() 出力が完全一致する', () => {
      const pascal = HStack({ spacing: 8, alignment: 'center' }, div());
      const lower = hstack({ spacing: 8, alignment: 'center' }, div());
      expect(pascal.render()).toBe(lower.render());
    });
  });

  describe('Spacer / spacer', () => {
    it('Spacer({ minLength: 16 }) と spacer({ minLength: 16 }) の render() 出力が完全一致する', () => {
      const pascal = Spacer({ minLength: 16 });
      const lower = spacer({ minLength: 16 });
      expect(pascal.render()).toBe(lower.render());
    });

    it('Spacer() と spacer() の render() 出力が完全一致する', () => {
      const pascal = Spacer();
      const lower = spacer();
      expect(pascal.render()).toBe(lower.render());
    });
  });
});
