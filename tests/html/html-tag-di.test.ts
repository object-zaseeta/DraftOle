import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PairType } from '../../src/html/elements/pair-type.js';
import type { CssManagerInstance } from '../../src/html/protocols/css-manager-instance-type.js';
import type { JQueryManagerInstance } from '../../src/html/protocols/jquery-manager-instance-type.js';
import * as CssManagerModule from '../../src/css/manager/css-manager.js';
import * as JQueryManagerModule from '../../src/js/jquery-manager.js';

describe('HtmlTag DI（依存性注入）', () => {
  it('オプション引数なしでデフォルトの CssManager/JQueryManager が使用される', () => {
    const tag = new PairType('div');
    expect(tag.css).toBeDefined();
    expect(tag.css.render()).toBe('');
    expect(tag.jqm).toBeDefined();
    expect(tag.jqm.render()).toBe('');
  });

  it('CssManagerInstance をオプション引数で注入できる', () => {
    const mockCss = {
      layout: {},
      styleManager: { style: {} },
      tagPath: 'mock',
      config: {},
      updateTagPath: vi.fn(),
      updateLazyLayoutRegister: vi.fn(),
      render: () => 'mock-css-render',
      renderCss: () => 'mock-css',
    } as CssManagerInstance;

    const tag = new PairType('div', { css: mockCss });
    expect(tag.css).toBe(mockCss);
    expect(tag.css.render()).toBe('mock-css-render');
  });

  it('JQueryManagerInstance をオプション引数で注入できる', () => {
    const mockJqm = {
      path: 'mock',
      usedMethods: new Set(),
      css: vi.fn(() => ''),
      height: vi.fn(() => ''),
      on: vi.fn(() => ''),
      click: vi.fn(() => ''),
      keydown: vi.fn(() => ''),
      keyup: vi.fn(() => ''),
      text: vi.fn(() => ''),
      html: vi.fn(() => ''),
      addClass: vi.fn(() => ''),
      removeClass: vi.fn(() => ''),
      toggleClass: vi.fn(() => ''),
      needsHelper: () => false,
      updatePath: vi.fn(),
      render: () => 'mock-js-render',
    } as JQueryManagerInstance;

    const tag = new PairType('div', { jqm: mockJqm });
    expect(tag.jqm).toBe(mockJqm);
    expect(tag.jqm.render()).toBe('mock-js-render');
  });
});

describe('HtmlTag モック注入時の具象コンストラクタ呼び出し検証（Req 5.1）', () => {
  let cssSpy: ReturnType<typeof vi.spyOn>;
  let jqmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 具象クラスのコンストラクタ呼び出しを監視する。
    // vi.spyOn を用いてモジュール上の named export をラップし、
    // 実装はそのままにしつつ呼び出し回数のみを追跡する。
    cssSpy = vi.spyOn(CssManagerModule, 'CssManager');
    jqmSpy = vi.spyOn(JQueryManagerModule, 'JQueryManager');
  });

  afterEach(() => {
    cssSpy.mockRestore();
    jqmSpy.mockRestore();
  });

  const makeMockCss = (): CssManagerInstance => ({
    layout: {},
    styleManager: { style: {} },
    tagPath: 'mock',
    config: {},
    updateTagPath: vi.fn(),
    updateLazyLayoutRegister: vi.fn(),
    render: () => '',
    renderCss: () => '',
  } as CssManagerInstance);

  const makeMockJqm = (): JQueryManagerInstance => ({
    path: 'mock',
    usedMethods: new Set(),
    css: vi.fn(() => ''),
    height: vi.fn(() => ''),
    on: vi.fn(() => ''),
    click: vi.fn(() => ''),
    keydown: vi.fn(() => ''),
    keyup: vi.fn(() => ''),
    text: vi.fn(() => ''),
    html: vi.fn(() => ''),
    addClass: vi.fn(() => ''),
    removeClass: vi.fn(() => ''),
    toggleClass: vi.fn(() => ''),
    needsHelper: () => false,
    updatePath: vi.fn(),
    render: () => '',
  } as JQueryManagerInstance);

  it('css と jqm 両方をモック注入した場合、具象 CssManager / JQueryManager コンストラクタは呼ばれない', () => {
    const mockCss = makeMockCss();
    const mockJqm = makeMockJqm();

    const tag = new PairType('div', { css: mockCss, jqm: mockJqm });

    // 注入した参照がそのまま getter 経由で露出していること（._css === mockCss）
    expect(tag.css).toBe(mockCss);
    expect(tag.jqm).toBe(mockJqm);

    // Req 5.1: 具象クラスのコンストラクタが new されていないこと
    expect(cssSpy).not.toHaveBeenCalled();
    expect(jqmSpy).not.toHaveBeenCalled();
  });

  it('css のみモック注入した場合、CssManager コンストラクタは呼ばれず、JQueryManager のみ生成される', () => {
    const mockCss = makeMockCss();

    const tag = new PairType('div', { css: mockCss });

    expect(tag.css).toBe(mockCss);
    expect(cssSpy).not.toHaveBeenCalled();
    // jqm は未注入なのでデフォルトが生成される
    expect(jqmSpy).toHaveBeenCalledTimes(1);
  });

  it('jqm のみモック注入した場合、JQueryManager コンストラクタは呼ばれず、CssManager のみ生成される', () => {
    const mockJqm = makeMockJqm();

    const tag = new PairType('div', { jqm: mockJqm });

    expect(tag.jqm).toBe(mockJqm);
    expect(jqmSpy).not.toHaveBeenCalled();
    expect(cssSpy).toHaveBeenCalledTimes(1);
  });

  it('オプション未指定の場合、両方の具象コンストラクタが 1 回ずつ呼ばれる（ベースライン）', () => {
    new PairType('div');

    expect(cssSpy).toHaveBeenCalledTimes(1);
    expect(jqmSpy).toHaveBeenCalledTimes(1);
  });
});
