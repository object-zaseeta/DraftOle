import { describe, expect, it } from 'vitest';
import {
  Alignment,
  ZStackAlignment,
} from '../../../src/css/constants/alignment.js';
import type { AlignmentValue, ZStackAlignmentKey } from '../../../src/css/constants/alignment.js';

describe('Alignment', () => {
  it('center は "center" を返す', () => {
    expect(Alignment.center).toBe('center');
  });

  it('leading は "flex-start" を返す', () => {
    expect(Alignment.leading).toBe('flex-start');
  });

  it('trailing は "flex-end" を返す', () => {
    expect(Alignment.trailing).toBe('flex-end');
  });

  it('top は "flex-start" を返す', () => {
    expect(Alignment.top).toBe('flex-start');
  });

  it('bottom は "flex-end" を返す', () => {
    expect(Alignment.bottom).toBe('flex-end');
  });

  it('AlignmentValue 型は "center" | "flex-start" | "flex-end" のみを受け入れる', () => {
    const val: AlignmentValue = Alignment.center;
    expect(val).toBe('center');
  });
});

describe('ZStackAlignment', () => {
  it('center は alignItems: "center", justifyContent: "center"', () => {
    expect(ZStackAlignment.center).toEqual({ alignItems: 'center', justifyContent: 'center' });
  });

  it('topLeading は alignItems: "flex-start", justifyContent: "flex-start"', () => {
    expect(ZStackAlignment.topLeading).toEqual({ alignItems: 'flex-start', justifyContent: 'flex-start' });
  });

  it('topTrailing は alignItems: "flex-start", justifyContent: "flex-end"', () => {
    expect(ZStackAlignment.topTrailing).toEqual({ alignItems: 'flex-start', justifyContent: 'flex-end' });
  });

  it('bottomLeading は alignItems: "flex-end", justifyContent: "flex-start"', () => {
    expect(ZStackAlignment.bottomLeading).toEqual({ alignItems: 'flex-end', justifyContent: 'flex-start' });
  });

  it('bottomTrailing は alignItems: "flex-end", justifyContent: "flex-end"', () => {
    expect(ZStackAlignment.bottomTrailing).toEqual({ alignItems: 'flex-end', justifyContent: 'flex-end' });
  });

  it('top は alignItems: "flex-start", justifyContent: "center"', () => {
    expect(ZStackAlignment.top).toEqual({ alignItems: 'flex-start', justifyContent: 'center' });
  });

  it('bottom は alignItems: "flex-end", justifyContent: "center"', () => {
    expect(ZStackAlignment.bottom).toEqual({ alignItems: 'flex-end', justifyContent: 'center' });
  });

  it('leading は alignItems: "center", justifyContent: "flex-start"', () => {
    expect(ZStackAlignment.leading).toEqual({ alignItems: 'center', justifyContent: 'flex-start' });
  });

  it('trailing は alignItems: "center", justifyContent: "flex-end"', () => {
    expect(ZStackAlignment.trailing).toEqual({ alignItems: 'center', justifyContent: 'flex-end' });
  });

  it('ZStackAlignmentKey 型はすべてのキーを含む', () => {
    const keys: ZStackAlignmentKey[] = [
      'center', 'topLeading', 'topTrailing', 'bottomLeading', 'bottomTrailing',
      'top', 'bottom', 'leading', 'trailing',
    ];
    keys.forEach(key => {
      expect(ZStackAlignment[key]).toBeDefined();
    });
  });
});
