import { describe, expect, it } from 'vitest';
import { Heading } from '../../src/view/primitives.js';
import type { HeadingLevel } from '../../src/view/types.js';

describe('Heading: 不正レベルの実行時 throw', () => {
  it('Heading(7) は Error("invalid heading level: 7") を throw する', () => {
    expect(() => Heading(7 as HeadingLevel, 'x')).toThrow(
      'invalid heading level: 7',
    );
  });

  it('Heading(0) は Error("invalid heading level: 0") を throw する', () => {
    expect(() => Heading(0 as HeadingLevel, 'x')).toThrow(
      'invalid heading level: 0',
    );
  });

  it('Heading(1) は throw しない (sanity)', () => {
    expect(() => Heading(1, 'x')).not.toThrow();
  });
});
