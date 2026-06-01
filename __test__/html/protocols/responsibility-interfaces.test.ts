/**
 * 責務インターフェースのテスト
 *
 * Task 5.1: ChildManageable と AttributeManageable インターフェースの型定義と
 * HTMLTagProtocol の責務分離を検証する。
 *
 * Requirements: 4.4 (HTMLTagProtocol責務分離)
 */
import { describe, it, expect } from 'vitest';
import type { ChildManageable } from '../../../src/html/protocols/child-manageable.js';
import type { AttributeManageable } from '../../../src/html/protocols/attribute-manageable.js';
import type { HTMLTagProtocol } from '../../../src/html/protocols/html-tag-protocol.js';
import { PairType } from '../../../src/html/elements/pair-type.js';
import { TextType } from '../../../src/html/elements/text-type.js';
import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.js';

describe('ChildManageable Interface', () => {
  it('should have children property', () => {
    const div = new PairType('div');
    const childManageable: ChildManageable = div;

    expect(childManageable.children).toBeDefined();
    expect(Array.isArray(childManageable.children)).toBe(true);
  });

  it('should have addChild method that returns this', () => {
    const div = new PairType('div');
    const child = new TextType('Hello');
    const childManageable: ChildManageable = div;

    const result = childManageable.addChild(child);

    expect(result).toBe(childManageable);
    expect(childManageable.children).toHaveLength(1);
    expect(childManageable.children[0]).toBe(child);
  });

  it('should have addChildren method that returns this', () => {
    const div = new PairType('div');
    const child1 = new TextType('Hello');
    const child2 = new TextType('World');
    const childManageable: ChildManageable = div;

    const result = childManageable.addChildren([child1, child2]);

    expect(result).toBe(childManageable);
    expect(childManageable.children).toHaveLength(2);
    expect(childManageable.children[0]).toBe(child1);
    expect(childManageable.children[1]).toBe(child2);
  });

  it('should maintain child order', () => {
    const div = new PairType('div');
    const child1 = new TextType('First');
    const child2 = new TextType('Second');
    const child3 = new TextType('Third');

    div.addChild(child1).addChild(child2).addChild(child3);

    expect(div.children[0]).toBe(child1);
    expect(div.children[1]).toBe(child2);
    expect(div.children[2]).toBe(child3);
  });
});

describe('AttributeManageable Interface', () => {
  it('should have attributes property', () => {
    const div = new PairType('div');
    const attributeManageable: AttributeManageable = div;

    expect(attributeManageable.attributes).toBeDefined();
    expect(Array.isArray(attributeManageable.attributes)).toBe(true);
  });

  it('should have addHtmlAttribute method that returns this', () => {
    const div = new PairType('div');
    const attr = new HtmlAttribute('id', 'test-id');
    const attributeManageable: AttributeManageable = div;

    const result = attributeManageable.addHtmlAttribute(attr);

    expect(result).toBe(attributeManageable);
    expect(attributeManageable.attributes).toHaveLength(1);
    expect(attributeManageable.attributes[0]).toBe(attr);
  });

  it('should allow multiple attributes', () => {
    const div = new PairType('div');
    const attr1 = new HtmlAttribute('id', 'test-id');
    const attr2 = new HtmlAttribute('class', 'test-class');

    div.addHtmlAttribute(attr1).addHtmlAttribute(attr2);

    expect(div.attributes).toHaveLength(2);
    expect(div.attributes[0]).toBe(attr1);
    expect(div.attributes[1]).toBe(attr2);
  });
});

describe('HTMLTagProtocol Interface Composition', () => {
  it('should extend ChildManageable', () => {
    const div = new PairType('div');
    const protocol: HTMLTagProtocol = div;
    const childManageable: ChildManageable = protocol;

    // 型が互換であることを確認
    expect(childManageable.children).toBeDefined();
    expect(childManageable.addChild).toBeDefined();
    expect(childManageable.addChildren).toBeDefined();
  });

  it('should extend AttributeManageable', () => {
    const div = new PairType('div');
    const protocol: HTMLTagProtocol = div;
    const attributeManageable: AttributeManageable = protocol;

    // 型が互換であることを確認
    expect(attributeManageable.attributes).toBeDefined();
    expect(attributeManageable.addHtmlAttribute).toBeDefined();
  });

  it('should have all properties from composed interfaces', () => {
    const div = new PairType('div');
    const protocol: HTMLTagProtocol = div;

    // Renderable のプロパティ
    expect(protocol.render).toBeDefined();

    // ChildManageable のプロパティ
    expect(protocol.children).toBeDefined();
    expect(protocol.addChild).toBeDefined();
    expect(protocol.addChildren).toBeDefined();

    // AttributeManageable のプロパティ
    expect(protocol.attributes).toBeDefined();
    expect(protocol.addHtmlAttribute).toBeDefined();

    // HTMLTagProtocol 固有のプロパティ
    expect(protocol.tagType).toBeDefined();
    expect(protocol.protoRender).toBeDefined();
  });

  it('should support method chaining across composed interfaces', () => {
    const div = new PairType('div');
    const child = new TextType('Hello');
    const attr = new HtmlAttribute('id', 'test');

    const result = div.addChild(child).addHtmlAttribute(attr);

    expect(result).toBe(div);
    expect(div.children).toHaveLength(1);
    expect(div.attributes).toHaveLength(1);
  });
});

describe('Type Safety', () => {
  it('should allow ChildManageable to be used independently', () => {
    function processChildren(manageable: ChildManageable): number {
      return manageable.children.length;
    }

    const div = new PairType('div');
    div.addChild(new TextType('Test'));

    expect(processChildren(div)).toBe(1);
  });

  it('should allow AttributeManageable to be used independently', () => {
    function processAttributes(manageable: AttributeManageable): number {
      return manageable.attributes.length;
    }

    const div = new PairType('div');
    div.addHtmlAttribute(new HtmlAttribute('id', 'test'));

    expect(processAttributes(div)).toBe(1);
  });

  it('should allow HTMLTagProtocol to be used as ChildManageable or AttributeManageable', () => {
    function addMultipleChildren(manageable: ChildManageable, count: number): void {
      for (let i = 0; i < count; i++) {
        manageable.addChild(new TextType(`Child ${i}`));
      }
    }

    function addCommonAttributes(manageable: AttributeManageable): void {
      manageable.addHtmlAttribute(new HtmlAttribute('class', 'common'));
    }

    const div: HTMLTagProtocol = new PairType('div');
    addMultipleChildren(div, 3);
    addCommonAttributes(div);

    expect(div.children).toHaveLength(3);
    expect(div.attributes).toHaveLength(1);
  });
});
