import { describe, expect, it } from 'vitest';
import {
  Alignment,
  ZStackAlignment,
  Breakpoints,
} from '../../../src/index.js';

// ──────────────────────────────────────────────
// Alignment (requirement 8.2)
// ──────────────────────────────────────────────
describe('Alignment', () => {
  it('Alignment.center は "center" である', () => {
    expect(Alignment.center).toBe('center');
  });

  it('Alignment.leading は "flex-start" である', () => {
    expect(Alignment.leading).toBe('flex-start');
  });

  it('Alignment.trailing は "flex-end" である', () => {
    expect(Alignment.trailing).toBe('flex-end');
  });

  it('Alignment.top は "flex-start" である', () => {
    expect(Alignment.top).toBe('flex-start');
  });

  it('Alignment.bottom は "flex-end" である', () => {
    expect(Alignment.bottom).toBe('flex-end');
  });
});

// ──────────────────────────────────────────────
// ZStackAlignment (requirement 8.3)
// ──────────────────────────────────────────────
describe('ZStackAlignment', () => {
  it('ZStackAlignment.center は alignItems: "center" / justifyContent: "center"', () => {
    expect(ZStackAlignment.center).toEqual({ alignItems: 'center', justifyContent: 'center' });
  });

  it('ZStackAlignment.topLeading は alignItems: "flex-start" / justifyContent: "flex-start"', () => {
    expect(ZStackAlignment.topLeading).toEqual({ alignItems: 'flex-start', justifyContent: 'flex-start' });
  });

  it('ZStackAlignment.topTrailing は alignItems: "flex-start" / justifyContent: "flex-end"', () => {
    expect(ZStackAlignment.topTrailing).toEqual({ alignItems: 'flex-start', justifyContent: 'flex-end' });
  });

  it('ZStackAlignment.bottomLeading は alignItems: "flex-end" / justifyContent: "flex-start"', () => {
    expect(ZStackAlignment.bottomLeading).toEqual({ alignItems: 'flex-end', justifyContent: 'flex-start' });
  });

  it('ZStackAlignment.bottomTrailing は alignItems: "flex-end" / justifyContent: "flex-end"', () => {
    expect(ZStackAlignment.bottomTrailing).toEqual({ alignItems: 'flex-end', justifyContent: 'flex-end' });
  });

  it('ZStackAlignment.top は alignItems: "flex-start" / justifyContent: "center"', () => {
    expect(ZStackAlignment.top).toEqual({ alignItems: 'flex-start', justifyContent: 'center' });
  });

  it('ZStackAlignment.bottom は alignItems: "flex-end" / justifyContent: "center"', () => {
    expect(ZStackAlignment.bottom).toEqual({ alignItems: 'flex-end', justifyContent: 'center' });
  });

  it('ZStackAlignment.leading は alignItems: "center" / justifyContent: "flex-start"', () => {
    expect(ZStackAlignment.leading).toEqual({ alignItems: 'center', justifyContent: 'flex-start' });
  });

  it('ZStackAlignment.trailing は alignItems: "center" / justifyContent: "flex-end"', () => {
    expect(ZStackAlignment.trailing).toEqual({ alignItems: 'center', justifyContent: 'flex-end' });
  });
});

// ──────────────────────────────────────────────
// Breakpoints (requirement 9.2)
// ──────────────────────────────────────────────
describe('Breakpoints', () => {
  it('Breakpoints.sm は 640 である', () => {
    expect(Breakpoints.sm).toBe(640);
  });

  it('Breakpoints.md は 768 である', () => {
    expect(Breakpoints.md).toBe(768);
  });

  it('Breakpoints.lg は 1024 である', () => {
    expect(Breakpoints.lg).toBe(1024);
  });

  it('Breakpoints.xl は 1280 である', () => {
    expect(Breakpoints.xl).toBe(1280);
  });
});
