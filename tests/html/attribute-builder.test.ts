/**
 * Task 6.1: BaseAttributeBuilder のテスト
 *
 * 共通属性ビルダーとclass追加の4パターンを検証する。
 * Requirements: 7.1, 7.2, 7.7
 */
import { describe, it, expect } from 'vitest';
import {
  BaseAttributeBuilder,
  FormAttributeBuilder,
  InputAttributeBuilder,
  ImageAttributeBuilder,
  LinkAttributeBuilder,
  ButtonAttributeBuilder,
} from '../../src/html/attributes/attribute-builder.js';

// ============================================================
// ヘルパー: non-null assertion を避けるユーティリティ
// ============================================================

/** 配列のインデックスアクセスを安全に行い、undefined ならテスト失敗させる */
function atIndex<T>(arr: T[], index: number): T {
  const item = arr[index];
  expect(item).toBeDefined();
  return item as T;
}

/** result から key に一致する属性を見つけ、存在しなければテスト失敗させる */
function findByKey<T extends { key: string }>(arr: T[], key: string): T {
  const item = arr.find((a) => a.key === key);
  expect(item).toBeDefined();
  return item as T;
}

// ============================================================
// 生成テスト
// ============================================================
describe('BaseAttributeBuilder', () => {
  it('should create an instance', () => {
    const builder = new BaseAttributeBuilder();
    expect(builder).toBeInstanceOf(BaseAttributeBuilder);
  });

  it('should return empty array when build() called with no attributes set', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.build();
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// 共通属性: setId, setTitle, setLang, setRole (Req 7.1)
// ============================================================
describe('BaseAttributeBuilder - 共通属性 (id, title, lang, role)', () => {
  it('setId() should add an id attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setId('main-content').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('id');
    expect(attr.renderAttribute()).toBe('id="main-content"');
  });

  it('setTitle() should add a title attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setTitle('Page Title').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('title');
    expect(attr.renderAttribute()).toBe('title="Page Title"');
  });

  it('setLang() should add a lang attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setLang('ja').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('lang');
    expect(attr.renderAttribute()).toBe('lang="ja"');
  });

  it('setRole() should add a role attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setRole('navigation').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('role');
    expect(attr.renderAttribute()).toBe('role="navigation"');
  });
});

// ============================================================
// setTabindex (Req 7.1)
// ============================================================
describe('BaseAttributeBuilder - setTabindex', () => {
  it('setTabindex() should add a tabindex attribute with numeric value', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setTabindex(0).build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('tabindex');
    expect(attr.renderAttribute()).toBe('tabindex="0"');
  });

  it('setTabindex(-1) should render negative value correctly', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setTabindex(-1).build();

    const attr = atIndex(result, 0);
    expect(attr.renderAttribute()).toBe('tabindex="-1"');
  });
});

// ============================================================
// setHidden (Req 7.1)
// ============================================================
describe('BaseAttributeBuilder - setHidden', () => {
  it('setHidden(true) should add boolean hidden attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setHidden(true).build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('hidden');
    expect(attr.renderAttribute()).toBe('hidden');
  });

  it('setHidden(false) should not add hidden attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setHidden(false).build();

    expect(result).toHaveLength(0);
  });
});

// ============================================================
// setCustomAttribute (Req 7.1)
// ============================================================
describe('BaseAttributeBuilder - setCustomAttribute', () => {
  it('setCustomAttribute() should add a data-* attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setCustomAttribute('theme', 'dark').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('data-theme');
    expect(attr.renderAttribute()).toBe('data-theme="dark"');
  });

  it('should support multiple custom attributes', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder
      .setCustomAttribute('theme', 'dark')
      .setCustomAttribute('lang', 'ja')
      .build();

    expect(result).toHaveLength(2);
    expect(atIndex(result, 0).renderAttribute()).toBe('data-theme="dark"');
    expect(atIndex(result, 1).renderAttribute()).toBe('data-lang="ja"');
  });
});

// ============================================================
// ARIA属性 (Req 7.1)
// ============================================================
describe('BaseAttributeBuilder - ARIA属性', () => {
  it('setAriaLabel() should add aria-label attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setAriaLabel('Close button').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('aria-label');
    expect(attr.renderAttribute()).toBe('aria-label="Close button"');
  });

  it('setAriaHidden(true) should add aria-hidden="true"', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setAriaHidden(true).build();

    expect(result).toHaveLength(1);
    expect(atIndex(result, 0).renderAttribute()).toBe('aria-hidden="true"');
  });

  it('setAriaHidden(false) should add aria-hidden="false"', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setAriaHidden(false).build();

    expect(result).toHaveLength(1);
    expect(atIndex(result, 0).renderAttribute()).toBe('aria-hidden="false"');
  });

  it('setAriaExpanded(true) should add aria-expanded="true"', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setAriaExpanded(true).build();

    expect(result).toHaveLength(1);
    expect(atIndex(result, 0).renderAttribute()).toBe(
      'aria-expanded="true"',
    );
  });

  it('setAriaExpanded(false) should add aria-expanded="false"', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.setAriaExpanded(false).build();

    expect(result).toHaveLength(1);
    expect(atIndex(result, 0).renderAttribute()).toBe(
      'aria-expanded="false"',
    );
  });
});

// ============================================================
// class追加: 4パターン (Req 7.2)
// ============================================================
describe('BaseAttributeBuilder - addClass (可変長引数パターン)', () => {
  it('addClass("a", "b") should add class attribute with both names', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.addClass('a', 'b').build();

    const classAttr = findByKey(result, 'class');
    expect(classAttr.renderAttribute()).toBe('class="a b"');
  });

  it('addClass with single name should work', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.addClass('container').build();

    const classAttr = findByKey(result, 'class');
    expect(classAttr.renderAttribute()).toBe('class="container"');
  });
});

describe('BaseAttributeBuilder - addClasses (配列パターン)', () => {
  it('addClasses(["a", "b"]) should add class attribute with both names', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.addClasses(['a', 'b']).build();

    const classAttr = findByKey(result, 'class');
    expect(classAttr.renderAttribute()).toBe('class="a b"');
  });

  it('addClasses with empty array should not add class attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.addClasses([]).build();

    const classAttr = result.find((a) => a.key === 'class');
    expect(classAttr).toBeUndefined();
  });
});

describe('BaseAttributeBuilder - addClassWhen (条件付きパターン)', () => {
  it('addClassWhen("active", true) should add the class', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.addClassWhen('active', true).build();

    const classAttr = findByKey(result, 'class');
    expect(classAttr.renderAttribute()).toBe('class="active"');
  });

  it('addClassWhen("active", false) should not add the class', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder.addClassWhen('active', false).build();

    const classAttr = result.find((a) => a.key === 'class');
    expect(classAttr).toBeUndefined();
  });
});

describe('BaseAttributeBuilder - addClassesToggle (辞書Toggle形式)', () => {
  it('addClassesToggle({ active: true, disabled: false }) should add only truthy classes', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder
      .addClassesToggle({ active: true, disabled: false })
      .build();

    const classAttr = findByKey(result, 'class');
    expect(classAttr.renderAttribute()).toBe('class="active"');
  });

  it('addClassesToggle with all false should not add class attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder
      .addClassesToggle({ active: false, disabled: false })
      .build();

    const classAttr = result.find((a) => a.key === 'class');
    expect(classAttr).toBeUndefined();
  });

  it('addClassesToggle with all true should add all classes', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder
      .addClassesToggle({ active: true, disabled: true, highlight: true })
      .build();

    const classAttr = findByKey(result, 'class');
    expect(classAttr.renderAttribute()).toBe(
      'class="active disabled highlight"',
    );
  });
});

// ============================================================
// build() フルエントチェーン (Req 7.7)
// ============================================================
describe('BaseAttributeBuilder - fluent chain と build()', () => {
  it('should support fluent method chaining', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder
      .setId('app')
      .setTitle('My App')
      .setLang('en')
      .setRole('main')
      .setTabindex(0)
      .setHidden(false)
      .setAriaLabel('Main content')
      .addClass('container', 'flex')
      .build();

    // hidden(false) は含まれないので 7 属性
    // id, title, lang, role, tabindex, aria-label, class
    expect(result).toHaveLength(7);

    const keys = result.map((a) => a.key);
    expect(keys).toContain('id');
    expect(keys).toContain('title');
    expect(keys).toContain('lang');
    expect(keys).toContain('role');
    expect(keys).toContain('tabindex');
    expect(keys).toContain('aria-label');
    expect(keys).toContain('class');
  });

  it('should return all configured attributes from build()', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder
      .setId('header')
      .setHidden(true)
      .setCustomAttribute('section', 'top')
      .setAriaExpanded(true)
      .addClass('header')
      .build();

    expect(result).toHaveLength(5);

    // 各属性のレンダリング結果を検証
    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('id="header"');
    expect(rendered).toContain('hidden');
    expect(rendered).toContain('data-section="top"');
    expect(rendered).toContain('aria-expanded="true"');
    expect(rendered).toContain('class="header"');
  });
});

// ============================================================
// 複数回のclass追加がマージされるテスト (Req 7.2)
// ============================================================
describe('BaseAttributeBuilder - class マージ', () => {
  it('multiple addClass calls should merge into single class attribute', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder
      .addClass('container')
      .addClass('flex')
      .addClass('items-center')
      .build();

    const classAttrs = result.filter((a) => a.key === 'class');
    expect(classAttrs).toHaveLength(1);
    expect(atIndex(classAttrs, 0).renderAttribute()).toBe(
      'class="container flex items-center"',
    );
  });

  it('mixing addClass, addClasses, addClassWhen, addClassesToggle should merge', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder
      .addClass('base')
      .addClasses(['layout', 'grid'])
      .addClassWhen('active', true)
      .addClassWhen('disabled', false)
      .addClassesToggle({ highlight: true, muted: false })
      .build();

    const classAttrs = result.filter((a) => a.key === 'class');
    expect(classAttrs).toHaveLength(1);
    expect(atIndex(classAttrs, 0).renderAttribute()).toBe(
      'class="base layout grid active highlight"',
    );
  });

  it('duplicate class names should be deduplicated', () => {
    const builder = new BaseAttributeBuilder();
    const result = builder
      .addClass('a', 'b')
      .addClass('b', 'c')
      .addClasses(['c', 'd'])
      .build();

    const classAttr = findByKey(result, 'class');
    expect(classAttr.renderAttribute()).toBe('class="a b c d"');
  });
});

// ============================================================
// FormAttributeBuilder (Task 6.2, Req 7.3)
// ============================================================
describe('FormAttributeBuilder', () => {
  it('should be an instance of BaseAttributeBuilder', () => {
    const builder = new FormAttributeBuilder();
    expect(builder).toBeInstanceOf(BaseAttributeBuilder);
  });

  it('setAction() should add action attribute', () => {
    const result = new FormAttributeBuilder().setAction('/submit').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('action');
    expect(attr.renderAttribute()).toBe('action="/submit"');
  });

  it('setMethod("post") should add method="post"', () => {
    const result = new FormAttributeBuilder().setMethod('post').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('method');
    expect(attr.renderAttribute()).toBe('method="post"');
  });

  it('setMethod("get") should add method="get"', () => {
    const result = new FormAttributeBuilder().setMethod('get').build();

    expect(result).toHaveLength(1);
    expect(atIndex(result, 0).renderAttribute()).toBe('method="get"');
  });

  it('setEnctype() should add enctype attribute', () => {
    const result = new FormAttributeBuilder()
      .setEnctype('multipart/form-data')
      .build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('enctype');
    expect(attr.renderAttribute()).toBe('enctype="multipart/form-data"');
  });

  it('should support chaining setAction + setMethod + setEnctype + addClass', () => {
    const result = new FormAttributeBuilder()
      .setAction('/upload')
      .setMethod('post')
      .setEnctype('multipart/form-data')
      .addClass('form-upload')
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('action="/upload"');
    expect(rendered).toContain('method="post"');
    expect(rendered).toContain('enctype="multipart/form-data"');
    expect(rendered).toContain('class="form-upload"');
    expect(result).toHaveLength(4);
  });

  it('should support inherited methods like setId', () => {
    const result = new FormAttributeBuilder()
      .setId('login-form')
      .setAction('/login')
      .setMethod('post')
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('id="login-form"');
    expect(rendered).toContain('action="/login"');
    expect(rendered).toContain('method="post"');
  });
});

// ============================================================
// InputAttributeBuilder (Task 6.2, Req 7.4)
// ============================================================
describe('InputAttributeBuilder', () => {
  it('should be an instance of BaseAttributeBuilder', () => {
    const builder = new InputAttributeBuilder();
    expect(builder).toBeInstanceOf(BaseAttributeBuilder);
  });

  it('setInputType("email") should add type="email"', () => {
    const result = new InputAttributeBuilder().setInputType('email').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('type');
    expect(attr.renderAttribute()).toBe('type="email"');
  });

  it('setInputType("text") should add type="text"', () => {
    const result = new InputAttributeBuilder().setInputType('text').build();
    expect(atIndex(result, 0).renderAttribute()).toBe('type="text"');
  });

  it('setInputType("password") should add type="password"', () => {
    const result = new InputAttributeBuilder()
      .setInputType('password')
      .build();
    expect(atIndex(result, 0).renderAttribute()).toBe('type="password"');
  });

  it('setPlaceholder() should add placeholder attribute', () => {
    const result = new InputAttributeBuilder()
      .setPlaceholder('Enter email')
      .build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('placeholder');
    expect(attr.renderAttribute()).toBe('placeholder="Enter email"');
  });

  it('setRequired(true) should add boolean required attribute', () => {
    const result = new InputAttributeBuilder().setRequired(true).build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('required');
    expect(attr.renderAttribute()).toBe('required');
  });

  it('setRequired(false) should not add required attribute', () => {
    const result = new InputAttributeBuilder().setRequired(false).build();
    expect(result).toHaveLength(0);
  });

  it('setPattern() should add pattern attribute', () => {
    const result = new InputAttributeBuilder().setPattern('[a-z]+').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('pattern');
    expect(attr.renderAttribute()).toBe('pattern="[a-z]+"');
  });

  it('setMinLength() should add minlength attribute', () => {
    const result = new InputAttributeBuilder().setMinLength(3).build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('minlength');
    expect(attr.renderAttribute()).toBe('minlength="3"');
  });

  it('setMaxLength() should add maxlength attribute', () => {
    const result = new InputAttributeBuilder().setMaxLength(100).build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('maxlength');
    expect(attr.renderAttribute()).toBe('maxlength="100"');
  });

  it('should support chaining setInputType + setPlaceholder + setRequired + addClass', () => {
    const result = new InputAttributeBuilder()
      .setInputType('email')
      .setPlaceholder('your@email.com')
      .setRequired(true)
      .addClass('form-input')
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('type="email"');
    expect(rendered).toContain('placeholder="your@email.com"');
    expect(rendered).toContain('required');
    expect(rendered).toContain('class="form-input"');
    expect(result).toHaveLength(4);
  });

  it('should support full chaining with all input-specific attributes', () => {
    const result = new InputAttributeBuilder()
      .setInputType('text')
      .setPlaceholder('Username')
      .setRequired(true)
      .setPattern('[a-zA-Z0-9]+')
      .setMinLength(3)
      .setMaxLength(20)
      .setId('username')
      .addClass('input-field')
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('type="text"');
    expect(rendered).toContain('placeholder="Username"');
    expect(rendered).toContain('required');
    expect(rendered).toContain('pattern="[a-zA-Z0-9]+"');
    expect(rendered).toContain('minlength="3"');
    expect(rendered).toContain('maxlength="20"');
    expect(rendered).toContain('id="username"');
    expect(rendered).toContain('class="input-field"');
  });
});

// ============================================================
// ImageAttributeBuilder (Task 6.2, Req 7.5)
// ============================================================
describe('ImageAttributeBuilder', () => {
  it('should be an instance of BaseAttributeBuilder', () => {
    const builder = new ImageAttributeBuilder();
    expect(builder).toBeInstanceOf(BaseAttributeBuilder);
  });

  it('setSrc() should add src attribute', () => {
    const result = new ImageAttributeBuilder().setSrc('/img.png').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('src');
    expect(attr.renderAttribute()).toBe('src="/img.png"');
  });

  it('setAlt() should add alt attribute', () => {
    const result = new ImageAttributeBuilder().setAlt('description').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('alt');
    expect(attr.renderAttribute()).toBe('alt="description"');
  });

  it('setWidth(number) should add width attribute as string', () => {
    const result = new ImageAttributeBuilder().setWidth(100).build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('width');
    expect(attr.renderAttribute()).toBe('width="100"');
  });

  it('setWidth(string) should add width attribute with string value', () => {
    const result = new ImageAttributeBuilder().setWidth('50%').build();

    expect(result).toHaveLength(1);
    expect(atIndex(result, 0).renderAttribute()).toBe('width="50%"');
  });

  it('setHeight(number) should add height attribute', () => {
    const result = new ImageAttributeBuilder().setHeight(200).build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('height');
    expect(attr.renderAttribute()).toBe('height="200"');
  });

  it('setHeight(string) should add height attribute with string value', () => {
    const result = new ImageAttributeBuilder().setHeight('auto').build();

    expect(result).toHaveLength(1);
    expect(atIndex(result, 0).renderAttribute()).toBe('height="auto"');
  });

  it('setLoading("lazy") should add loading="lazy"', () => {
    const result = new ImageAttributeBuilder().setLoading('lazy').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('loading');
    expect(attr.renderAttribute()).toBe('loading="lazy"');
  });

  it('setLoading("eager") should add loading="eager"', () => {
    const result = new ImageAttributeBuilder().setLoading('eager').build();
    expect(atIndex(result, 0).renderAttribute()).toBe('loading="eager"');
  });

  it('should support chaining setSrc + setAlt + setWidth + setHeight', () => {
    const result = new ImageAttributeBuilder()
      .setSrc('/photo.jpg')
      .setAlt('A photo')
      .setWidth(800)
      .setHeight(600)
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('src="/photo.jpg"');
    expect(rendered).toContain('alt="A photo"');
    expect(rendered).toContain('width="800"');
    expect(rendered).toContain('height="600"');
    expect(result).toHaveLength(4);
  });

  it('should support full chaining with loading and class', () => {
    const result = new ImageAttributeBuilder()
      .setSrc('/banner.webp')
      .setAlt('Banner image')
      .setWidth('100%')
      .setHeight('auto')
      .setLoading('lazy')
      .addClass('responsive-img')
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('src="/banner.webp"');
    expect(rendered).toContain('alt="Banner image"');
    expect(rendered).toContain('width="100%"');
    expect(rendered).toContain('height="auto"');
    expect(rendered).toContain('loading="lazy"');
    expect(rendered).toContain('class="responsive-img"');
  });
});

// ============================================================
// LinkAttributeBuilder (Task 6.2, Req 7.5)
// ============================================================
describe('LinkAttributeBuilder', () => {
  it('should be an instance of BaseAttributeBuilder', () => {
    const builder = new LinkAttributeBuilder();
    expect(builder).toBeInstanceOf(BaseAttributeBuilder);
  });

  it('setHref() should add href attribute', () => {
    const result = new LinkAttributeBuilder().setHref('/style.css').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('href');
    expect(attr.renderAttribute()).toBe('href="/style.css"');
  });

  it('setRel() should add rel attribute', () => {
    const result = new LinkAttributeBuilder().setRel('stylesheet').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('rel');
    expect(attr.renderAttribute()).toBe('rel="stylesheet"');
  });

  it('setType() should add type attribute', () => {
    const result = new LinkAttributeBuilder().setType('text/css').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('type');
    expect(attr.renderAttribute()).toBe('type="text/css"');
  });

  it('setMedia() should add media attribute', () => {
    const result = new LinkAttributeBuilder().setMedia('screen').build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('media');
    expect(attr.renderAttribute()).toBe('media="screen"');
  });

  it('should support chaining setHref + setRel + setType', () => {
    const result = new LinkAttributeBuilder()
      .setHref('/styles/main.css')
      .setRel('stylesheet')
      .setType('text/css')
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('href="/styles/main.css"');
    expect(rendered).toContain('rel="stylesheet"');
    expect(rendered).toContain('type="text/css"');
    expect(result).toHaveLength(3);
  });

  it('should support full chaining with media and class', () => {
    const result = new LinkAttributeBuilder()
      .setHref('/print.css')
      .setRel('stylesheet')
      .setType('text/css')
      .setMedia('print')
      .addClass('print-style')
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('href="/print.css"');
    expect(rendered).toContain('rel="stylesheet"');
    expect(rendered).toContain('type="text/css"');
    expect(rendered).toContain('media="print"');
    expect(rendered).toContain('class="print-style"');
  });
});

// ============================================================
// ButtonAttributeBuilder (Task 6.2, Req 7.6)
// ============================================================
describe('ButtonAttributeBuilder', () => {
  it('should be an instance of BaseAttributeBuilder', () => {
    const builder = new ButtonAttributeBuilder();
    expect(builder).toBeInstanceOf(BaseAttributeBuilder);
  });

  it('setButtonType("submit") should add type="submit"', () => {
    const result = new ButtonAttributeBuilder()
      .setButtonType('submit')
      .build();

    expect(result).toHaveLength(1);
    const attr = atIndex(result, 0);
    expect(attr.key).toBe('type');
    expect(attr.renderAttribute()).toBe('type="submit"');
  });

  it('setButtonType("button") should add type="button"', () => {
    const result = new ButtonAttributeBuilder()
      .setButtonType('button')
      .build();

    expect(result).toHaveLength(1);
    expect(atIndex(result, 0).renderAttribute()).toBe('type="button"');
  });

  it('setButtonType("reset") should add type="reset"', () => {
    const result = new ButtonAttributeBuilder()
      .setButtonType('reset')
      .build();

    expect(result).toHaveLength(1);
    expect(atIndex(result, 0).renderAttribute()).toBe('type="reset"');
  });

  it('should support chaining setButtonType + addClass', () => {
    const result = new ButtonAttributeBuilder()
      .setButtonType('submit')
      .addClass('btn', 'btn-primary')
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('type="submit"');
    expect(rendered).toContain('class="btn btn-primary"');
    expect(result).toHaveLength(2);
  });

  it('should support inherited methods like setId and setAriaLabel', () => {
    const result = new ButtonAttributeBuilder()
      .setButtonType('button')
      .setId('close-btn')
      .setAriaLabel('Close dialog')
      .addClass('btn-close')
      .build();

    const rendered = result.map((a) => a.renderAttribute());
    expect(rendered).toContain('type="button"');
    expect(rendered).toContain('id="close-btn"');
    expect(rendered).toContain('aria-label="Close dialog"');
    expect(rendered).toContain('class="btn-close"');
  });
});
