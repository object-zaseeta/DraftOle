/**
 * Task 1.2: HTML属性値のdiscriminated union型、属性キー、InputType、ButtonType
 * TDD RED phase - テストを先に記述
 */
import {
  type HtmlAttributeValue,
  type BooleanAttributeKey,
  type KeyValueAttributeKey,
  type AriaAttributeKey,
  type InputType,
  type ButtonType,
  BOOLEAN_ATTRIBUTE_KEYS,
  KEY_VALUE_ATTRIBUTE_KEYS,
  ARIA_ATTRIBUTE_KEYS,
  INPUT_TYPES,
  BUTTON_TYPES,
  createBooleanValue,
  createKeyValueValue,
  createCustomValue,
} from '../../src/html/attributes/attribute-keys';

// ============================================================
// HtmlAttributeValue discriminated union
// ============================================================
describe('HtmlAttributeValue', () => {
  describe('boolean variant', () => {
    it('should create a boolean attribute value with type discriminator', () => {
      const value: HtmlAttributeValue = createBooleanValue();
      expect(value.type).toBe('boolean');
    });

    it('should narrow type correctly in conditional', () => {
      const value: HtmlAttributeValue = createBooleanValue();
      if (value.type === 'boolean') {
        // Type narrowing should work - boolean has no extra fields
        expect(value.type).toBe('boolean');
      } else {
        // Should not reach here
        expect.unreachable('Should have been boolean type');
      }
    });
  });

  describe('keyValue variant', () => {
    it('should create a keyValue attribute value with type discriminator and value', () => {
      const value: HtmlAttributeValue = createKeyValueValue('test-value');
      expect(value.type).toBe('keyValue');
      if (value.type === 'keyValue') {
        expect(value.value).toBe('test-value');
      }
    });

    it('should narrow type and access value property', () => {
      const value: HtmlAttributeValue = createKeyValueValue('hello');
      if (value.type === 'keyValue') {
        expect(value.value).toBe('hello');
      } else {
        expect.unreachable('Should have been keyValue type');
      }
    });
  });

  describe('custom variant', () => {
    it('should create a custom attribute value with type discriminator, name, and value', () => {
      const value: HtmlAttributeValue = createCustomValue('theme', 'dark');
      expect(value.type).toBe('custom');
      if (value.type === 'custom') {
        expect(value.name).toBe('theme');
        expect(value.value).toBe('dark');
      }
    });

    it('should narrow type and access name and value properties', () => {
      const value: HtmlAttributeValue = createCustomValue('lang', 'ja');
      if (value.type === 'custom') {
        expect(value.name).toBe('lang');
        expect(value.value).toBe('ja');
      } else {
        expect.unreachable('Should have been custom type');
      }
    });
  });

  describe('discriminated union exhaustiveness', () => {
    it('should handle all variants in a switch statement', () => {
      const values: HtmlAttributeValue[] = [
        createBooleanValue(),
        createKeyValueValue('val'),
        createCustomValue('n', 'v'),
      ];

      const results: string[] = [];

      for (const value of values) {
        switch (value.type) {
          case 'boolean':
            results.push('boolean');
            break;
          case 'keyValue':
            results.push(`keyValue:${value.value}`);
            break;
          case 'custom':
            results.push(`custom:${value.name}=${value.value}`);
            break;
        }
      }

      expect(results).toEqual(['boolean', 'keyValue:val', 'custom:n=v']);
    });
  });
});

// ============================================================
// BooleanAttributeKey
// ============================================================
describe('BooleanAttributeKey', () => {
  it('should have exactly 26 valid boolean attribute keys', () => {
    expect(BOOLEAN_ATTRIBUTE_KEYS).toHaveLength(26);
  });

  it('should include standard boolean attributes', () => {
    const expected: BooleanAttributeKey[] = [
      'checked',
      'disabled',
      'readonly',
      'required',
      'hidden',
      'autofocus',
      'multiple',
      'selected',
    ];
    for (const key of expected) {
      expect(BOOLEAN_ATTRIBUTE_KEYS).toContain(key);
    }
  });

  it('should include all 26 boolean attribute keys from the Swift reference', () => {
    const allBooleanKeys: BooleanAttributeKey[] = [
      'allowfullscreen',
      'async',
      'autofocus',
      'autoplay',
      'checked',
      'controls',
      'default',
      'defer',
      'disabled',
      'formnovalidate',
      'hidden',
      'inert',
      'ismap',
      'itemscope',
      'loop',
      'multiple',
      'muted',
      'nomodule',
      'novalidate',
      'open',
      'playsinline',
      'readonly',
      'required',
      'reversed',
      'selected',
      'truespeed',
    ];
    for (const key of allBooleanKeys) {
      expect(BOOLEAN_ATTRIBUTE_KEYS).toContain(key);
    }
  });

  it('should not contain duplicates', () => {
    const unique = new Set(BOOLEAN_ATTRIBUTE_KEYS);
    expect(unique.size).toBe(BOOLEAN_ATTRIBUTE_KEYS.length);
  });
});

// ============================================================
// KeyValueAttributeKey
// ============================================================
describe('KeyValueAttributeKey', () => {
  it('should include common key-value attributes', () => {
    const expected: KeyValueAttributeKey[] = [
      'id',
      'class',
      'src',
      'href',
      'type',
      'name',
      'value',
      'placeholder',
      'action',
      'method',
      'alt',
      'title',
      'rel',
      'target',
      'lang',
      'role',
      'tabindex',
      'style',
      'width',
      'height',
      'loading',
    ];
    for (const key of expected) {
      expect(KEY_VALUE_ATTRIBUTE_KEYS).toContain(key);
    }
  });

  it('should include all key-value attribute keys from the Swift reference', () => {
    const allKeyValueKeys: KeyValueAttributeKey[] = [
      'accept',
      'accept-charset',
      'accesskey',
      'action',
      'alt',
      'as',
      'autocomplete',
      'charset',
      'cite',
      'class',
      'cols',
      'colspan',
      'content',
      'contenteditable',
      'coords',
      'crossorigin',
      'data',
      'datetime',
      'decoding',
      'dir',
      'download',
      'draggable',
      'enctype',
      'for',
      'formaction',
      'headers',
      'height',
      'href',
      'hreflang',
      'id',
      'inputmode',
      'integrity',
      'label',
      'lang',
      'list',
      'loading',
      'max',
      'maxlength',
      'media',
      'method',
      'min',
      'minlength',
      'name',
      'pattern',
      'placeholder',
      'poster',
      'preload',
      'rel',
      'referrerpolicy',
      'role',
      'rows',
      'rowspan',
      'sandbox',
      'scope',
      'shape',
      'size',
      'sizes',
      'slot',
      'src',
      'srcdoc',
      'srclang',
      'srcset',
      'step',
      'style',
      'tabindex',
      'target',
      'title',
      'translate',
      'type',
      'usemap',
      'value',
      'width',
      'wrap',
    ];
    for (const key of allKeyValueKeys) {
      expect(KEY_VALUE_ATTRIBUTE_KEYS).toContain(key);
    }
    // Verify the count matches
    expect(KEY_VALUE_ATTRIBUTE_KEYS).toHaveLength(allKeyValueKeys.length);
  });

  it('should not contain duplicates', () => {
    const unique = new Set(KEY_VALUE_ATTRIBUTE_KEYS);
    expect(unique.size).toBe(KEY_VALUE_ATTRIBUTE_KEYS.length);
  });
});

// ============================================================
// AriaAttributeKey
// ============================================================
describe('AriaAttributeKey', () => {
  it('should include all ARIA attribute keys', () => {
    const expected: AriaAttributeKey[] = [
      'aria-label',
      'aria-hidden',
      'aria-expanded',
      'aria-controls',
      'aria-live',
      'aria-describedby',
      'aria-role',
    ];
    for (const key of expected) {
      expect(ARIA_ATTRIBUTE_KEYS).toContain(key);
    }
  });

  it('should have exactly 7 ARIA attribute keys', () => {
    expect(ARIA_ATTRIBUTE_KEYS).toHaveLength(7);
  });

  it('should not contain duplicates', () => {
    const unique = new Set(ARIA_ATTRIBUTE_KEYS);
    expect(unique.size).toBe(ARIA_ATTRIBUTE_KEYS.length);
  });
});

// ============================================================
// InputType
// ============================================================
describe('InputType', () => {
  it('should have exactly 22 input types', () => {
    expect(INPUT_TYPES).toHaveLength(22);
  });

  it('should include all 22 input types from the Swift reference', () => {
    const expectedTypes: InputType[] = [
      'text',
      'password',
      'email',
      'number',
      'tel',
      'url',
      'search',
      'date',
      'time',
      'datetime-local',
      'month',
      'week',
      'color',
      'range',
      'file',
      'checkbox',
      'radio',
      'hidden',
      'submit',
      'reset',
      'button',
      'image',
    ];
    for (const type of expectedTypes) {
      expect(INPUT_TYPES).toContain(type);
    }
  });

  it('should not contain duplicates', () => {
    const unique = new Set(INPUT_TYPES);
    expect(unique.size).toBe(INPUT_TYPES.length);
  });
});

// ============================================================
// ButtonType
// ============================================================
describe('ButtonType', () => {
  it('should have exactly 3 button types', () => {
    expect(BUTTON_TYPES).toHaveLength(3);
  });

  it('should include submit, reset, and button', () => {
    const expectedTypes: ButtonType[] = ['submit', 'reset', 'button'];
    for (const type of expectedTypes) {
      expect(BUTTON_TYPES).toContain(type);
    }
  });

  it('should not contain duplicates', () => {
    const unique = new Set(BUTTON_TYPES);
    expect(unique.size).toBe(BUTTON_TYPES.length);
  });
});

// ============================================================
// Type safety verification (compile-time + runtime)
// ============================================================
describe('Type safety', () => {
  it('BooleanAttributeKey array elements should satisfy the type', () => {
    // Each element in the array should be assignable to BooleanAttributeKey
    for (const key of BOOLEAN_ATTRIBUTE_KEYS) {
      const typed: BooleanAttributeKey = key;
      expect(typeof typed).toBe('string');
    }
  });

  it('KeyValueAttributeKey array elements should satisfy the type', () => {
    for (const key of KEY_VALUE_ATTRIBUTE_KEYS) {
      const typed: KeyValueAttributeKey = key;
      expect(typeof typed).toBe('string');
    }
  });

  it('AriaAttributeKey array elements should satisfy the type', () => {
    for (const key of ARIA_ATTRIBUTE_KEYS) {
      const typed: AriaAttributeKey = key;
      expect(typeof typed).toBe('string');
    }
  });

  it('InputType array elements should satisfy the type', () => {
    for (const type of INPUT_TYPES) {
      const typed: InputType = type;
      expect(typeof typed).toBe('string');
    }
  });

  it('ButtonType array elements should satisfy the type', () => {
    for (const type of BUTTON_TYPES) {
      const typed: ButtonType = type;
      expect(typeof typed).toBe('string');
    }
  });

  it('HtmlAttributeValue variants should be distinguishable', () => {
    const boolVal = createBooleanValue();
    const kvVal = createKeyValueValue('x');
    const customVal = createCustomValue('a', 'b');

    // All should be objects
    expect(typeof boolVal).toBe('object');
    expect(typeof kvVal).toBe('object');
    expect(typeof customVal).toBe('object');

    // Each should have a distinct type discriminator
    expect(boolVal.type).not.toBe(kvVal.type);
    expect(kvVal.type).not.toBe(customVal.type);
    expect(boolVal.type).not.toBe(customVal.type);
  });
});
