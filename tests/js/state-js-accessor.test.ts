/**
 * StateJsAccessorImpl — ユニットテスト
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * RED→GREEN サイクルの証拠として追加 (Task 4.1)
 */

import { StateJsAccessorImpl } from '../../src/js/vanilla/state/state-js-accessor';

describe('StateJsAccessorImpl', () => {
  describe('get() — Requirement 1.1', () => {
    it('returns correct JS expression string for reading state value', () => {
      const acc = new StateJsAccessorImpl('s0');
      expect(acc.get()).toBe("__draftole__.state('s0').get()");
    });

    it('different runtimeIds produce different get() strings', () => {
      const acc1 = new StateJsAccessorImpl('s0');
      const acc2 = new StateJsAccessorImpl('s1');
      expect(acc1.get()).not.toBe(acc2.get());
    });
  });

  describe('set() — Requirement 1.2', () => {
    it('interpolates expr correctly into JS statement string', () => {
      const acc = new StateJsAccessorImpl('s0');
      expect(acc.set('[...arr, x]')).toBe("__draftole__.state('s0').set([...arr, x])");
    });

    it('handles empty expr in set()', () => {
      const acc = new StateJsAccessorImpl('s0');
      expect(acc.set('')).toBe("__draftole__.state('s0').set()");
    });
  });

  describe('update() — Requirement 1.2', () => {
    it('wraps body in arrow-function form', () => {
      const acc = new StateJsAccessorImpl('s0');
      expect(acc.update('return __v + 1')).toBe(
        "__draftole__.state('s0').set((__v) => { return __v + 1 })"
      );
    });

    it('handles empty body in update()', () => {
      const acc = new StateJsAccessorImpl('s0');
      expect(acc.update('')).toBe("__draftole__.state('s0').set((__v) => {  })");
    });
  });

  describe('legacy pattern compatibility — Requirement 1.3', () => {
    it('get() matches legacy __draftole__.state(id).get() pattern', () => {
      const id = 'myState';
      const acc = new StateJsAccessorImpl(id);
      expect(acc.get()).toBe(`__draftole__.state('${id}').get()`);
    });

    it('set() matches legacy __draftole__.state(id).set(...) pattern', () => {
      const id = 'myState';
      const acc = new StateJsAccessorImpl(id);
      expect(acc.set('newValue')).toBe(`__draftole__.state('${id}').set(newValue)`);
    });
  });

  describe('encapsulation — Requirement 1.4', () => {
    it('runtimeId is encapsulated and reflected in all accessor strings', () => {
      const acc = new StateJsAccessorImpl('unique-id-42');
      expect(acc.get()).toContain('unique-id-42');
      expect(acc.set('x')).toContain('unique-id-42');
      expect(acc.update('return x')).toContain('unique-id-42');
    });
  });
});
