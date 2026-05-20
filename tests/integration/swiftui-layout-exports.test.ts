/**
 * Task 6.1: Public API exports for SwiftUI-style layout
 *
 * Verifies that all new layout-related symbols are accessible
 * via the package root (`draftole` / `src/index.ts`).
 */

import {
  // Values
  hstack,
  vstack,
  zstack,
  spacer,
  divider,
  Alignment,
  ZStackAlignment,
  Breakpoints,
} from '../../src/index.js';

import type {
  // Types
  StackOptions,
  ZStackOptions,
  SpacerOptions,
  FrameOptions,
  BreakpointStyles,
  EdgeSet,
  AlignmentValue,
  ZStackAlignmentKey,
} from '../../src/index.js';

describe('SwiftUI Layout – public API exports (Task 6.1)', () => {
  // ── Value exports ─────────────────────────────────────────────────────────
  it('hstack is exported as a function', () => {
    expect(typeof hstack).toBe('function');
  });

  it('vstack is exported as a function', () => {
    expect(typeof vstack).toBe('function');
  });

  it('zstack is exported as a function', () => {
    expect(typeof zstack).toBe('function');
  });

  it('spacer is exported as a function', () => {
    expect(typeof spacer).toBe('function');
  });

  it('divider is exported as a function', () => {
    expect(typeof divider).toBe('function');
  });

  it('Alignment is exported as an object/namespace', () => {
    expect(Alignment).toBeDefined();
    expect(typeof Alignment).toBe('object');
  });

  it('ZStackAlignment is exported as an object/namespace', () => {
    expect(ZStackAlignment).toBeDefined();
    expect(typeof ZStackAlignment).toBe('object');
  });

  it('Breakpoints is exported as an object/namespace', () => {
    expect(Breakpoints).toBeDefined();
    expect(typeof Breakpoints).toBe('object');
  });

  // ── Type exports (compile-time only; runtime smoke test) ──────────────────
  it('type StackOptions is exported (compile-time verification)', () => {
    // If the type is not exported, TypeScript compilation will fail.
    const _check: StackOptions | undefined = undefined;
    expect(_check).toBeUndefined();
  });

  it('type ZStackOptions is exported (compile-time verification)', () => {
    const _check: ZStackOptions | undefined = undefined;
    expect(_check).toBeUndefined();
  });

  it('type SpacerOptions is exported (compile-time verification)', () => {
    const _check: SpacerOptions | undefined = undefined;
    expect(_check).toBeUndefined();
  });

  it('type FrameOptions is exported (compile-time verification)', () => {
    const _check: FrameOptions | undefined = undefined;
    expect(_check).toBeUndefined();
  });

  it('type BreakpointStyles is exported (compile-time verification)', () => {
    const _check: BreakpointStyles | undefined = undefined;
    expect(_check).toBeUndefined();
  });

  it('type EdgeSet is exported (compile-time verification)', () => {
    const _check: EdgeSet | undefined = undefined;
    expect(_check).toBeUndefined();
  });

  it('type AlignmentValue is exported (compile-time verification)', () => {
    const _check: AlignmentValue | undefined = undefined;
    expect(_check).toBeUndefined();
  });

  it('type ZStackAlignmentKey is exported (compile-time verification)', () => {
    const _check: ZStackAlignmentKey | undefined = undefined;
    expect(_check).toBeUndefined();
  });
});
