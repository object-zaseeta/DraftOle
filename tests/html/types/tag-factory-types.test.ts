/**
 * Tests for tag-factory-types.ts and html-tag-protocol-guard.ts
 *
 * Task 1.5: TagAttributes, TagChild 型定義 & isHTMLTagProtocol 型ガード
 *
 * TDD RED phase: these tests are written before the implementation.
 */
import { describe, it, expect } from 'vitest';
import { div } from '../../../src/html/index.js';
import { PairType } from '../../../src/html/elements/pair-type.js';
import { TextType } from '../../../src/html/elements/text-type.js';
import type { TagAttributes, TagChild } from '../../../src/html/types/tag-factory-types.js';
import { isHTMLTagProtocol } from '../../../src/html/types/html-tag-protocol-guard.js';

// ============================================================================
// TagAttributes
// ============================================================================
describe('TagAttributes', () => {
  it('should accept Record<string, string> with class and id', () => {
    const attrs: TagAttributes = { class: 'card', id: 'main' };
    expect(attrs['class']).toBe('card');
    expect(attrs['id']).toBe('main');
  });

  it('should accept an empty object', () => {
    const attrs: TagAttributes = {};
    expect(Object.keys(attrs).length).toBe(0);
  });

  it('should accept arbitrary string key-value pairs', () => {
    const attrs: TagAttributes = {
      'data-testid': 'my-component',
      'aria-label': 'Close button',
    };
    expect(attrs['data-testid']).toBe('my-component');
    expect(attrs['aria-label']).toBe('Close button');
  });
});

// ============================================================================
// TagChild
// ============================================================================
describe('TagChild', () => {
  it('should accept an HTMLTagProtocol implementation (PairType)', () => {
    const element = new PairType('div');
    const child: TagChild = element;
    // TagChild should accept HTMLTagProtocol objects
    expect(child).toBe(element);
  });

  it('should accept an HTMLTagProtocol implementation via factory (div)', () => {
    const element = div();
    const child: TagChild = element;
    expect(child).toBe(element);
  });

  it('should accept a string', () => {
    const child: TagChild = 'Hello, world!';
    expect(child).toBe('Hello, world!');
  });

  it('should accept an empty string', () => {
    const child: TagChild = '';
    expect(child).toBe('');
  });

  it('should accept a TextType as HTMLTagProtocol', () => {
    const textNode = new TextType('some text');
    const child: TagChild = textNode;
    expect(child).toBe(textNode);
  });
});

// ============================================================================
// isHTMLTagProtocol
// ============================================================================
describe('isHTMLTagProtocol', () => {
  describe('positive cases (returns true)', () => {
    it('should return true for a PairType instance', () => {
      const element = new PairType('div');
      expect(isHTMLTagProtocol(element)).toBe(true);
    });

    it('should return true for a div() factory result', () => {
      const element = div();
      expect(isHTMLTagProtocol(element)).toBe(true);
    });

    it('should return true for a TextType instance', () => {
      const textNode = new TextType('hello');
      expect(isHTMLTagProtocol(textNode)).toBe(true);
    });

    it('should return true for a duck-typing object with render function and tagType string', () => {
      const duckTyped = {
        render: () => '<div></div>',
        tagType: 'div',
      };
      expect(isHTMLTagProtocol(duckTyped)).toBe(true);
    });
  });

  describe('negative cases (returns false)', () => {
    it('should return false for a string', () => {
      expect(isHTMLTagProtocol('hello')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isHTMLTagProtocol(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isHTMLTagProtocol(undefined)).toBe(false);
    });

    it('should return false for an empty object', () => {
      expect(isHTMLTagProtocol({})).toBe(false);
    });

    it('should return false when render is not a function', () => {
      const invalid = { render: 'not-a-function', tagType: 'div' };
      expect(isHTMLTagProtocol(invalid)).toBe(false);
    });

    it('should return false when tagType is missing', () => {
      const noTagType = { render: () => '' };
      expect(isHTMLTagProtocol(noTagType)).toBe(false);
    });

    it('should return false when render is missing', () => {
      const noRender = { tagType: 'div' };
      expect(isHTMLTagProtocol(noRender)).toBe(false);
    });

    it('should return false for a number', () => {
      expect(isHTMLTagProtocol(42)).toBe(false);
    });

    it('should return false for a boolean', () => {
      expect(isHTMLTagProtocol(true)).toBe(false);
    });

    it('should return false for an array', () => {
      expect(isHTMLTagProtocol([1, 2, 3])).toBe(false);
    });

    it('should return false when tagType is not a string', () => {
      const invalidTagType = { render: () => '', tagType: 123 };
      expect(isHTMLTagProtocol(invalidTagType)).toBe(false);
    });
  });
});
