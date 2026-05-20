import { describe, it, expect } from 'vitest';
import { Breakpoints } from '../../../src/css/constants/breakpoints.js';
import type { BreakpointKey, BreakpointStyles } from '../../../src/css/constants/breakpoints.js';
import type { EdgeSet } from '../../../src/css/constants/edge-set.js';

describe('Breakpoints', () => {
  it('Breakpoints.sm は 640 を返す', () => {
    expect(Breakpoints.sm).toBe(640);
  });

  it('Breakpoints.md は 768 を返す', () => {
    expect(Breakpoints.md).toBe(768);
  });

  it('Breakpoints.lg は 1024 を返す', () => {
    expect(Breakpoints.lg).toBe(1024);
  });

  it('Breakpoints.xl は 1280 を返す', () => {
    expect(Breakpoints.xl).toBe(1280);
  });

  it('すべてのブレークポイントキーが存在する', () => {
    const keys: BreakpointKey[] = ['sm', 'md', 'lg', 'xl'];
    for (const key of keys) {
      expect(Breakpoints).toHaveProperty(key);
    }
  });

  it('Breakpoints オブジェクトが正しい値セットを持つ', () => {
    expect(Breakpoints).toEqual({ sm: 640, md: 768, lg: 1024, xl: 1280 });
  });
});

describe('BreakpointStyles', () => {
  it('BreakpointStyles は named breakpoint プロパティを持てる', () => {
    const styles: BreakpointStyles = {
      sm: { color: 'red' },
      md: { color: 'blue' },
    };
    expect(styles.sm?.color).toBe('red');
    expect(styles.md?.color).toBe('blue');
  });

  it('BreakpointStyles はカスタム数値キーをサポートする', () => {
    const styles: BreakpointStyles = {
      900: { color: 'green' },
    };
    expect(styles[900]?.color).toBe('green');
  });
});

describe('EdgeSet', () => {
  it('EdgeSet の各値が文字列リテラルとして正しく機能する', () => {
    const edges: EdgeSet[] = ['horizontal', 'vertical', 'top', 'right', 'bottom', 'left'];
    expect(edges).toHaveLength(6);
    expect(edges).toContain('horizontal');
    expect(edges).toContain('vertical');
    expect(edges).toContain('top');
    expect(edges).toContain('right');
    expect(edges).toContain('bottom');
    expect(edges).toContain('left');
  });
});
