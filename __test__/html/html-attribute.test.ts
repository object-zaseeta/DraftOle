/**
 * Task 2.1: HtmlAttribute のテスト
 *
 * Boolean・KeyValue・カスタムdata-*・ARIA属性の生成とHTML文字列レンダリング
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8, 2.9
 */
import { describe, it, expect } from 'vitest';
import { HtmlAttribute } from '../../src/html/attributes/html-attribute.js';

// ============================================================
// Boolean属性 (Req 2.1, 2.9)
// ============================================================
describe('HtmlAttribute.boolean', () => {
  it('should create a boolean attribute with "boolean" type', () => {
    const attr = HtmlAttribute.boolean('checked');
    expect(attr.key).toBe('checked');
    expect(attr.attributeValue.type).toBe('boolean');
  });

  it('should render as key only (no value)', () => {
    const attr = HtmlAttribute.boolean('disabled');
    expect(attr.renderAttribute()).toBe('disabled');
  });

  it('should support various boolean attribute keys', () => {
    const keys = ['checked', 'disabled', 'readonly', 'required', 'hidden', 'autofocus', 'multiple', 'selected', 'novalidate', 'async', 'defer'] as const;
    for (const key of keys) {
      const attr = HtmlAttribute.boolean(key);
      expect(attr.renderAttribute()).toBe(key);
    }
  });
});

// ============================================================
// KeyValue属性 (Req 2.2, 2.8)
// ============================================================
describe('HtmlAttribute.keyValue', () => {
  it('should create a key-value attribute with "keyValue" type', () => {
    const attr = HtmlAttribute.keyValue('id', 'app');
    expect(attr.key).toBe('id');
    expect(attr.attributeValue.type).toBe('keyValue');
    if (attr.attributeValue.type === 'keyValue') {
      expect(attr.attributeValue.value).toBe('app');
    }
  });

  it('should render as key="value" format', () => {
    const attr = HtmlAttribute.keyValue('id', 'main');
    expect(attr.renderAttribute()).toBe('id="main"');
  });

  it('should render class attribute correctly', () => {
    const attr = HtmlAttribute.keyValue('class', 'container');
    expect(attr.renderAttribute()).toBe('class="container"');
  });

  it('should render src attribute correctly', () => {
    const attr = HtmlAttribute.keyValue('src', 'image.png');
    expect(attr.renderAttribute()).toBe('src="image.png"');
  });

  it('should render href attribute correctly', () => {
    const attr = HtmlAttribute.keyValue('href', 'https://example.com');
    expect(attr.renderAttribute()).toBe('href="https://example.com"');
  });
});

// ============================================================
// className ファクトリ (Req 2.2)
// ============================================================
describe('HtmlAttribute.className', () => {
  it('should create a class attribute with single class name', () => {
    const attr = HtmlAttribute.className('container');
    expect(attr.key).toBe('class');
    expect(attr.renderAttribute()).toBe('class="container"');
  });

  it('should create a class attribute with multiple class names', () => {
    const attr = HtmlAttribute.className('container', 'flex', 'items-center');
    expect(attr.renderAttribute()).toBe('class="container flex items-center"');
  });
});

// ============================================================
// Custom data-* 属性 (Req 2.3)
// ============================================================
describe('HtmlAttribute.custom', () => {
  it('should create a custom attribute with "custom" type', () => {
    const attr = HtmlAttribute.custom('theme', 'dark');
    expect(attr.key).toBe('data-theme');
    expect(attr.attributeValue.type).toBe('custom');
    if (attr.attributeValue.type === 'custom') {
      expect(attr.attributeValue.name).toBe('theme');
      expect(attr.attributeValue.value).toBe('dark');
    }
  });

  it('should render as data-name="value" format', () => {
    const attr = HtmlAttribute.custom('theme', 'dark');
    expect(attr.renderAttribute()).toBe('data-theme="dark"');
  });

  it('should render data-id correctly', () => {
    const attr = HtmlAttribute.custom('id', '123');
    expect(attr.renderAttribute()).toBe('data-id="123"');
  });
});

// ============================================================
// ARIA属性 (Req 2.4)
// ============================================================
describe('HtmlAttribute.ariaLabel', () => {
  it('should create an aria-label attribute', () => {
    const attr = HtmlAttribute.ariaLabel('Close button');
    expect(attr.key).toBe('aria-label');
    expect(attr.renderAttribute()).toBe('aria-label="Close button"');
  });
});

describe('HtmlAttribute.ariaHidden', () => {
  it('should create an aria-hidden="true" attribute when true', () => {
    const attr = HtmlAttribute.ariaHidden(true);
    expect(attr.key).toBe('aria-hidden');
    expect(attr.renderAttribute()).toBe('aria-hidden="true"');
  });

  it('should create an aria-hidden="false" attribute when false', () => {
    const attr = HtmlAttribute.ariaHidden(false);
    expect(attr.renderAttribute()).toBe('aria-hidden="false"');
  });
});

describe('HtmlAttribute.ariaExpanded', () => {
  it('should create an aria-expanded="true" attribute when true', () => {
    const attr = HtmlAttribute.ariaExpanded(true);
    expect(attr.key).toBe('aria-expanded');
    expect(attr.renderAttribute()).toBe('aria-expanded="true"');
  });

  it('should create an aria-expanded="false" attribute when false', () => {
    const attr = HtmlAttribute.ariaExpanded(false);
    expect(attr.renderAttribute()).toBe('aria-expanded="false"');
  });
});

// ============================================================
// InputType ファクトリ (Req 2.6)
// ============================================================
describe('HtmlAttribute.inputType', () => {
  it('should create a type attribute with input type value', () => {
    const attr = HtmlAttribute.inputType('email');
    expect(attr.key).toBe('type');
    expect(attr.renderAttribute()).toBe('type="email"');
  });

  it('should support various input types', () => {
    const types = ['text', 'password', 'email', 'number', 'tel', 'checkbox', 'radio', 'hidden', 'submit'] as const;
    for (const type of types) {
      const attr = HtmlAttribute.inputType(type);
      expect(attr.renderAttribute()).toBe(`type="${type}"`);
    }
  });
});

// ============================================================
// ButtonType ファクトリ (Req 2.7)
// ============================================================
describe('HtmlAttribute.buttonType', () => {
  it('should create a type attribute with button type value', () => {
    const attr = HtmlAttribute.buttonType('submit');
    expect(attr.key).toBe('type');
    expect(attr.renderAttribute()).toBe('type="submit"');
  });

  it('should support all button types', () => {
    const types = ['submit', 'reset', 'button'] as const;
    for (const type of types) {
      const attr = HtmlAttribute.buttonType(type);
      expect(attr.renderAttribute()).toBe(`type="${type}"`);
    }
  });
});

// ============================================================
// HtmlAttributeShape 互換性
// ============================================================
describe('HtmlAttribute implements HtmlAttributeShape', () => {
  it('should have readonly key property', () => {
    const attr = HtmlAttribute.keyValue('id', 'test');
    expect(attr.key).toBe('id');
  });

  it('should have readonly attributeValue property', () => {
    const attr = HtmlAttribute.boolean('checked');
    expect(attr.attributeValue).toBeDefined();
    expect(attr.attributeValue.type).toBe('boolean');
  });

  it('should have renderAttribute method', () => {
    const attr = HtmlAttribute.keyValue('class', 'test');
    expect(typeof attr.renderAttribute).toBe('function');
    expect(attr.renderAttribute()).toBe('class="test"');
  });
});
