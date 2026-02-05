import { describe, it, expect } from 'vitest';
import { hlUnit, hlUnitToCssString } from '../../src/utils/unit-style.js';

describe('hlUnit', () => {
  it('should create a unit with value and unit type', () => {
    const u = hlUnit(10, 'px');
    expect(u.value).toBe(10);
    expect(u.unit).toBe('px');
  });
});

describe('hlUnitToCssString', () => {
  it('should convert px unit', () => {
    expect(hlUnitToCssString(hlUnit(10, 'px'))).toBe('10px');
  });

  it('should convert em unit', () => {
    expect(hlUnitToCssString(hlUnit(1.5, 'em'))).toBe('1.5em');
  });

  it('should convert percent unit', () => {
    expect(hlUnitToCssString(hlUnit(100, '%'))).toBe('100%');
  });

  it('should return empty string for none unit', () => {
    expect(hlUnitToCssString(hlUnit(0, 'none'))).toBe('');
  });
});
