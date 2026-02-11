/**
 * Task 1.3: HTMLタグ操作・属性管理・タグ生成・CSS/JSスタブのインターフェース
 * TDD RED phase - テストを先に記述
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
import type {
  AttributeBuilderProtocol,
  CssManagerType,
  HtmlAttributeManagerProtocol,
  HtmlAttributeShape,
  HTMLTagProtocol,
  JQueryManagerProtocol,
  TagGenerateProtocol,
} from '../../src/html/protocols';
import type { TagType } from '../../src/html/tags/tag-type';
import type { Renderable } from '../../src/utils/renderable';
import type { JQueryMethodType } from '../../src/js/jquery-method-type';
import type { JQueryManagerInstance } from '../../src/js/jquery-manager';

function createMockAttribute(key: string, value: string): HtmlAttributeShape {
  return {
    key,
    attributeValue: { type: 'keyValue', value },
    renderAttribute: () => `${key}="${value}"`,
  };
}

// ============================================================
// Req 1.1, 1.7: HTMLTagProtocol extends Renderable
// ============================================================
describe('HTMLTagProtocol', () => {
  it('should be assignable to Renderable (extends Renderable)', () => {
    // Create a mock that satisfies HTMLTagProtocol
    const mockTag: HTMLTagProtocol = {
      tagType: 'div' as TagType,
      children: [],
      attributes: [],
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: () => {},
      render: () => '<div></div>',
      protoRender: () => '<div></div>',
    };

    // HTMLTagProtocol should be assignable to Renderable (Req 1.7)
    const renderable: Renderable = mockTag;
    expect(renderable.render()).toBe('<div></div>');
  });

  it('should expose tagType property', () => {
    const mockTag: HTMLTagProtocol = {
      tagType: 'p' as TagType,
      children: [],
      attributes: [],
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: () => {},
      render: () => '<p></p>',
      protoRender: () => '<p></p>',
    };

    expect(mockTag.tagType).toBe('p');
  });

  it('should expose readonly children array', () => {
    const child: HTMLTagProtocol = {
      tagType: 'span' as TagType,
      children: [],
      attributes: [],
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: () => {},
      render: () => '<span></span>',
      protoRender: () => '<span></span>',
    };

    const parent: HTMLTagProtocol = {
      tagType: 'div' as TagType,
      children: [child],
      attributes: [],
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: () => {},
      render: () => '<div><span></span></div>',
      protoRender: () => '<div><span></span></div>',
    };

    expect(parent.children).toHaveLength(1);
    expect(parent.children[0]?.tagType).toBe('span');
  });

  it('should expose readonly attributes array', () => {
    const attr = createMockAttribute('class', 'container');
    const mockTag: HTMLTagProtocol = {
      tagType: 'div' as TagType,
      children: [],
      attributes: [attr],
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: () => {},
      render: () => '<div class="container"></div>',
      protoRender: () => '<div class="container"></div>',
    };

    expect(mockTag.attributes).toHaveLength(1);
    expect(mockTag.attributes[0]?.key).toBe('class');
  });

  it('should define addChild method', () => {
    const children: HTMLTagProtocol[] = [];
    const mockTag: HTMLTagProtocol = {
      tagType: 'div' as TagType,
      get children() { return children; },
      attributes: [],
      addChild: (child: HTMLTagProtocol) => { children.push(child); },
      addChildren: () => {},
      addHtmlAttribute: () => {},
      render: () => '',
      protoRender: () => '',
    };

    const child: HTMLTagProtocol = {
      tagType: 'p' as TagType,
      children: [],
      attributes: [],
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: () => {},
      render: () => '<p></p>',
      protoRender: () => '<p></p>',
    };

    mockTag.addChild(child);
    expect(mockTag.children).toHaveLength(1);
  });

  it('should define addChildren method', () => {
    const children: HTMLTagProtocol[] = [];
    const mockTag: HTMLTagProtocol = {
      tagType: 'div' as TagType,
      get children() { return children; },
      attributes: [],
      addChild: () => {},
      addChildren: (newChildren: ReadonlyArray<HTMLTagProtocol>) => {
        children.push(...newChildren);
      },
      addHtmlAttribute: () => {},
      render: () => '',
      protoRender: () => '',
    };

    const child1: HTMLTagProtocol = {
      tagType: 'p' as TagType, children: [], attributes: [],
      addChild: () => {}, addChildren: () => {}, addHtmlAttribute: () => {},
      render: () => '', protoRender: () => '',
    };
    const child2: HTMLTagProtocol = {
      tagType: 'span' as TagType, children: [], attributes: [],
      addChild: () => {}, addChildren: () => {}, addHtmlAttribute: () => {},
      render: () => '', protoRender: () => '',
    };

    mockTag.addChildren([child1, child2]);
    expect(mockTag.children).toHaveLength(2);
  });

  it('should define addHtmlAttribute method', () => {
    const attrs: HtmlAttributeShape[] = [];
    const mockTag: HTMLTagProtocol = {
      tagType: 'div' as TagType,
      children: [],
      get attributes() { return attrs; },
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: (attr: HtmlAttributeShape) => { attrs.push(attr); },
      render: () => '',
      protoRender: () => '',
    };

    mockTag.addHtmlAttribute(createMockAttribute('id', 'app'));
    expect(mockTag.attributes).toHaveLength(1);
  });

  it('should define render() and protoRender() methods', () => {
    const mockTag: HTMLTagProtocol = {
      tagType: 'div' as TagType,
      children: [],
      attributes: [],
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: () => {},
      render: () => '<div>\n</div>',
      protoRender: () => '<div></div>',
    };

    expect(mockTag.render()).toContain('<div>');
    expect(mockTag.protoRender()).toBe('<div></div>');
  });
});

// ============================================================
// Req 1.2: HtmlAttributeManagerProtocol
// ============================================================
describe('HtmlAttributeManagerProtocol', () => {
  it('should expose readonly attributes array', () => {
    const attrs: HtmlAttributeShape[] = [];
    const manager: HtmlAttributeManagerProtocol = {
      get attributes() { return attrs; },
      addHtmlAttribute: (attr: HtmlAttributeShape) => { attrs.push(attr); },
      renderAttributes: () => '',
    };

    expect(manager.attributes).toEqual([]);
  });

  it('should define addHtmlAttribute method', () => {
    const attrs: HtmlAttributeShape[] = [];
    const manager: HtmlAttributeManagerProtocol = {
      get attributes() { return attrs; },
      addHtmlAttribute: (attr: HtmlAttributeShape) => { attrs.push(attr); },
      renderAttributes: () => attrs.map(a => a.renderAttribute()).join(' '),
    };

    manager.addHtmlAttribute(createMockAttribute('class', 'test'));
    expect(manager.attributes).toHaveLength(1);
  });

  it('should define renderAttributes method returning string', () => {
    const attrs: HtmlAttributeShape[] = [
      createMockAttribute('class', 'test'),
      createMockAttribute('id', 'app'),
    ];
    const manager: HtmlAttributeManagerProtocol = {
      get attributes() { return attrs; },
      addHtmlAttribute: () => {},
      renderAttributes: () => attrs.map(a => a.renderAttribute()).join(' '),
    };

    expect(manager.renderAttributes()).toBe('class="test" id="app"');
  });
});

// ============================================================
// Req 1.3: TagGenerateProtocol
// ============================================================
describe('TagGenerateProtocol', () => {
  it('should define generateTag method returning HTMLTagProtocol', () => {
    const generator: TagGenerateProtocol = {
      generateTag: (tagType: TagType): HTMLTagProtocol => ({
        tagType,
        children: [],
        attributes: [],
        addChild: () => {},
        addChildren: () => {},
        addHtmlAttribute: () => {},
        render: () => `<${tagType}></${tagType}>`,
        protoRender: () => `<${tagType}></${tagType}>`,
      }),
    };

    const tag = generator.generateTag('div' as TagType);
    expect(tag.tagType).toBe('div');
    expect(tag.render()).toBe('<div></div>');
  });
});

// ============================================================
// Req 1.4: CssManagerType (stub)
// ============================================================
describe('CssManagerType', () => {
  it('should define collectCssStyleString method', () => {
    const cssManager: CssManagerType = {
      collectCssStyleString: () => '',
    };

    expect(cssManager.collectCssStyleString()).toBe('');
  });

  it('stub implementation should return empty string', () => {
    const cssManager: CssManagerType = {
      collectCssStyleString: () => '',
    };

    // Phase 2 stub: always returns empty string
    const result = cssManager.collectCssStyleString();
    expect(result).toBe('');
    expect(typeof result).toBe('string');
  });
});

// ============================================================
// Req 1.5, 1.9, 6.1, 6.2: JQueryManagerProtocol
// ============================================================
describe('JQueryManagerProtocol', () => {
  // Helper: create a minimal mock JQueryManagerInstance
  function createMockJqm(overrides?: Partial<JQueryManagerInstance>): JQueryManagerInstance {
    return {
      path: '',
      usedMethods: new Set<JQueryMethodType>(),
      css: () => '',
      height: () => '',
      on: () => '',
      click: () => '',
      keydown: () => '',
      keyup: () => '',
      text: () => '',
      html: () => '',
      addClass: () => '',
      removeClass: () => '',
      toggleClass: () => '',
      needsHelper: () => false,
      updatePath: () => {},
      render: () => '',
      ...overrides,
    };
  }

  it('should define collectJsContent method', () => {
    const jqManager: JQueryManagerProtocol = {
      collectJsContent: () => '',
      collectUsedMethods: () => new Set<JQueryMethodType>(),
      jqm: createMockJqm(),
    };

    expect(jqManager.collectJsContent()).toBe('');
  });

  it('should define collectUsedMethods method returning Set<JQueryMethodType>', () => {
    const jqManager: JQueryManagerProtocol = {
      collectJsContent: () => '',
      collectUsedMethods: () => new Set<JQueryMethodType>(),
      jqm: createMockJqm(),
    };

    const methods = jqManager.collectUsedMethods();
    expect(methods).toBeInstanceOf(Set);
    expect(methods.size).toBe(0);
  });

  it('should define jqm accessor returning JQueryManagerInstance', () => {
    const mockJqm = createMockJqm({
      path: 'test-path',
      usedMethods: new Set<JQueryMethodType>(['css', 'text']),
      render: () => 'test-js',
    });
    const jqManager: JQueryManagerProtocol = {
      collectJsContent: () => '',
      collectUsedMethods: () => new Set<JQueryMethodType>(),
      jqm: mockJqm,
    };

    expect(jqManager.jqm).toBeDefined();
    expect(jqManager.jqm.path).toBe('test-path');
    expect(jqManager.jqm.usedMethods.size).toBe(2);
    expect(jqManager.jqm.usedMethods.has('css')).toBe(true);
  });

  it('stub implementation should return empty string and empty Set', () => {
    const jqManager: JQueryManagerProtocol = {
      collectJsContent: () => '',
      collectUsedMethods: () => new Set<JQueryMethodType>(),
      jqm: createMockJqm(),
    };

    expect(jqManager.collectJsContent()).toBe('');
    expect(jqManager.collectUsedMethods().size).toBe(0);
  });
});

// ============================================================
// Req 1.6: AttributeBuilderProtocol
// ============================================================
describe('AttributeBuilderProtocol', () => {
  // Helper: create a mock builder implementing the protocol
  function createMockBuilder(): AttributeBuilderProtocol {
    const attrs: HtmlAttributeShape[] = [];
    const classNames: string[] = [];

    const builder: AttributeBuilderProtocol = {
      setId: (id: string) => {
        attrs.push(createMockAttribute('id', id));
        return builder;
      },
      setTitle: (title: string) => {
        attrs.push(createMockAttribute('title', title));
        return builder;
      },
      setLang: (lang: string) => {
        attrs.push(createMockAttribute('lang', lang));
        return builder;
      },
      setRole: (role: string) => {
        attrs.push(createMockAttribute('role', role));
        return builder;
      },
      setTabindex: (index: number) => {
        attrs.push(createMockAttribute('tabindex', String(index)));
        return builder;
      },
      setHidden: (_hidden: boolean) => {
        attrs.push({ key: 'hidden', attributeValue: { type: 'boolean' }, renderAttribute: () => 'hidden' });
        return builder;
      },
      setCustomAttribute: (name: string, value: string) => {
        attrs.push(createMockAttribute(`data-${name}`, value));
        return builder;
      },
      setAriaLabel: (label: string) => {
        attrs.push(createMockAttribute('aria-label', label));
        return builder;
      },
      setAriaHidden: (hidden: boolean) => {
        attrs.push(createMockAttribute('aria-hidden', String(hidden)));
        return builder;
      },
      setAriaExpanded: (expanded: boolean) => {
        attrs.push(createMockAttribute('aria-expanded', String(expanded)));
        return builder;
      },
      addClass: (...names: string[]) => {
        classNames.push(...names);
        return builder;
      },
      addClasses: (names: string[]) => {
        classNames.push(...names);
        return builder;
      },
      addClassWhen: (className: string, condition: boolean) => {
        if (condition) classNames.push(className);
        return builder;
      },
      addClassesToggle: (classMap: Record<string, boolean>) => {
        for (const [name, enabled] of Object.entries(classMap)) {
          if (enabled) classNames.push(name);
        }
        return builder;
      },
      build: () => {
        const result = [...attrs];
        if (classNames.length > 0) {
          result.push(createMockAttribute('class', classNames.join(' ')));
        }
        return result;
      },
    };
    return builder;
  }

  it('should support fluent API chaining', () => {
    const builder = createMockBuilder();

    // All setters should return `this` for chaining
    const result = builder
      .setId('my-id')
      .setTitle('My Title')
      .setLang('ja')
      .setRole('button')
      .setTabindex(0)
      .setHidden(true)
      .setCustomAttribute('theme', 'dark')
      .setAriaLabel('Click me')
      .setAriaHidden(false)
      .setAriaExpanded(true);

    // Should return the builder itself
    expect(result).toBe(builder);
  });

  it('should build an array of attributes', () => {
    const builder = createMockBuilder();
    builder.setId('test-id');

    const attrs = builder.build();
    expect(Array.isArray(attrs)).toBe(true);
    expect(attrs.length).toBeGreaterThan(0);
  });

  it('should support addClass with spread args', () => {
    const builder = createMockBuilder();
    builder.addClass('foo', 'bar');

    const attrs = builder.build();
    const classAttr = attrs.find(a => a.key === 'class');
    expect(classAttr).toBeDefined();
    expect(classAttr?.renderAttribute()).toContain('foo');
    expect(classAttr?.renderAttribute()).toContain('bar');
  });

  it('should support addClasses with array', () => {
    const builder = createMockBuilder();
    builder.addClasses(['alpha', 'beta']);

    const attrs = builder.build();
    const classAttr = attrs.find(a => a.key === 'class');
    expect(classAttr).toBeDefined();
  });

  it('should support addClassWhen with condition', () => {
    const builder = createMockBuilder();
    builder.addClassWhen('active', true);
    builder.addClassWhen('hidden', false);

    const attrs = builder.build();
    const classAttr = attrs.find(a => a.key === 'class');
    expect(classAttr?.renderAttribute()).toContain('active');
    expect(classAttr?.renderAttribute()).not.toContain('hidden');
  });

  it('should support addClassesToggle with record', () => {
    const builder = createMockBuilder();
    builder.addClassesToggle({
      'active': true,
      'disabled': false,
      'highlight': true,
    });

    const attrs = builder.build();
    const classAttr = attrs.find(a => a.key === 'class');
    expect(classAttr?.renderAttribute()).toContain('active');
    expect(classAttr?.renderAttribute()).toContain('highlight');
    expect(classAttr?.renderAttribute()).not.toContain('disabled');
  });

  it('should return empty array when nothing is set', () => {
    const builder = createMockBuilder();
    const attrs = builder.build();
    expect(attrs).toEqual([]);
  });
});

// ============================================================
// Cross-cutting: Protocol composition
// ============================================================
describe('Protocol composition', () => {
  it('HTMLTagProtocol satisfies Renderable contract', () => {
    // An object satisfying HTMLTagProtocol must also satisfy Renderable
    const tag: HTMLTagProtocol = {
      tagType: 'div' as TagType,
      children: [],
      attributes: [],
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: () => {},
      render: () => '<div></div>',
      protoRender: () => '<div></div>',
    };

    // This assignment must compile (Req 1.7)
    const r: Renderable = tag;
    expect(typeof r.render).toBe('function');
  });

  it('should be possible to build a full mock satisfying multiple protocols', () => {
    // A mock class implementing HTMLTagProtocol + HtmlAttributeManagerProtocol + CssManagerType + JQueryManagerProtocol
    const attrs: HtmlAttributeShape[] = [];
    const fullMock: HTMLTagProtocol & HtmlAttributeManagerProtocol & CssManagerType & JQueryManagerProtocol = {
      tagType: 'div' as TagType,
      children: [],
      get attributes() { return attrs; },
      addChild: () => {},
      addChildren: () => {},
      addHtmlAttribute: (attr: HtmlAttributeShape) => { attrs.push(attr); },
      render: () => '<div></div>',
      protoRender: () => '<div></div>',
      renderAttributes: () => attrs.map(a => a.renderAttribute()).join(' '),
      collectCssStyleString: () => '',
      collectJsContent: () => '',
      collectUsedMethods: () => new Set<string>(),
    };

    expect(fullMock.tagType).toBe('div');
    expect(fullMock.collectCssStyleString()).toBe('');
    expect(fullMock.collectJsContent()).toBe('');
    expect(fullMock.collectUsedMethods().size).toBe(0);
    expect(fullMock.renderAttributes()).toBe('');

    fullMock.addHtmlAttribute(createMockAttribute('class', 'test'));
    expect(fullMock.renderAttributes()).toBe('class="test"');
  });
});
