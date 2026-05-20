/**
 * Task 6.4: SharedStyleTemplateTests
 *
 * `src/css/variables/style-template.ts` の branch カバレッジを 90% 以上に引き上げるための
 * 追加テスト。既存 `style-template.test.ts` は変更せず、未到達分岐に絞った検証のみを行う。
 *
 * 未到達分岐:
 * - line 67 周辺: `stableStringify` の `Array.isArray(value)` 分岐
 *   （properties / selectors のネスト値に配列が含まれる経路）
 * - `freezeProperties` の `value !== undefined` ガード（undefined 値スキップ）
 * - `freezeSelectors` の `inner !== undefined` ガード（undefined 値スキップ）
 * - `createStyleTemplate` の `name === undefined` 経路と `selectors === undefined` 経路の補完
 *
 * Requirements: 4.4
 */
import { describe, it, expect } from 'vitest';
import {
  createStyleTemplate,
  type CreateStyleTemplateInput,
} from '../../../src/css/variables/style-template.js';
import type { StyleSelectors } from '../../../src/css/variables/css-shared-style.js';

// ============================================================
// stableStringify - Array.isArray 分岐（line 67）
// ============================================================

describe('createStyleTemplate - stableStringify Array 分岐', () => {
  it('properties 値が配列でも安定 hash を返す（Array.isArray 経路を踏む）', () => {
    // properties 型は Record<string, string> のため、配列値はランタイムでのみ
    // 発生し得る（external な caller が型を満たさない値を渡したケース）。
    // bodyHash の決定性を担保するため stableStringify は Array.isArray を分岐に
    // 持っており、その経路を網羅する。
    const propsWithArray = {
      transitions: ['opacity', 'transform'],
      display: 'flex',
    } as unknown as Record<string, string>;

    const a = createStyleTemplate({ properties: propsWithArray });
    const b = createStyleTemplate({ properties: propsWithArray });

    expect(a.bodyHash).toBe(b.bodyHash);
    expect(a.bodyHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('selectors のネスト値が配列でも安定 hash を返す（再帰的 Array.isArray 経路）', () => {
    const selectorsWithArray = {
      hover: {
        transition: ['color', 'background'],
        color: 'blue',
      },
    } as unknown as StyleSelectors;

    const tpl = createStyleTemplate({
      properties: { color: 'red' },
      selectors: selectorsWithArray,
    });

    expect(tpl.bodyHash).toMatch(/^[0-9a-f]{8}$/);
    // 異なる配列内容では別の bodyHash となる（配列要素差を識別している）
    const other = createStyleTemplate({
      properties: { color: 'red' },
      selectors: {
        hover: {
          transition: ['opacity', 'transform'],
          color: 'blue',
        },
      } as unknown as StyleSelectors,
    });
    expect(tpl.bodyHash).not.toBe(other.bodyHash);
  });

  it('配列要素の順序差は識別される（配列はキーソートしない）', () => {
    const propsA = {
      list: ['a', 'b'],
    } as unknown as Record<string, string>;
    const propsB = {
      list: ['b', 'a'],
    } as unknown as Record<string, string>;

    const a = createStyleTemplate({ properties: propsA });
    const b = createStyleTemplate({ properties: propsB });

    expect(a.bodyHash).not.toBe(b.bodyHash);
  });

  it('ネスト配列（配列内オブジェクト）も再帰的に正規化される', () => {
    const propsNested = {
      complex: [{ b: '1', a: '2' }, { d: '4' }],
    } as unknown as Record<string, string>;
    const propsNestedSwapped = {
      complex: [{ a: '2', b: '1' }, { d: '4' }],
    } as unknown as Record<string, string>;

    const a = createStyleTemplate({ properties: propsNested });
    const b = createStyleTemplate({ properties: propsNestedSwapped });

    // 配列要素内オブジェクトはキーソートされるので同一 hash になる
    expect(a.bodyHash).toBe(b.bodyHash);
  });
});

// ============================================================
// freezeProperties - undefined 値スキップ分岐
// ============================================================

describe('createStyleTemplate - freezeProperties undefined ガード', () => {
  it('properties に undefined 値が含まれる場合、snapshot に取り込まれない', () => {
    const propsWithUndefined = {
      display: 'flex',
      color: undefined,
      gap: '10px',
    } as unknown as Record<string, string>;

    const tpl = createStyleTemplate({ properties: propsWithUndefined });

    expect(tpl.properties).toEqual({ display: 'flex', gap: '10px' });
    expect('color' in tpl.properties).toBe(false);
  });

  it('全プロパティ undefined でも空オブジェクトを返す', () => {
    const allUndefined = {
      a: undefined,
      b: undefined,
    } as unknown as Record<string, string>;

    const tpl = createStyleTemplate({ properties: allUndefined });

    expect(tpl.properties).toEqual({});
    expect(Object.isFrozen(tpl.properties)).toBe(true);
  });
});

// ============================================================
// freezeSelectors - undefined 値スキップ分岐
// ============================================================

describe('createStyleTemplate - freezeSelectors undefined ガード', () => {
  it('selectors に undefined エントリが含まれる場合、snapshot に取り込まれない', () => {
    const selectorsWithUndefined = {
      hover: { color: 'blue' },
      focus: undefined,
      active: { color: 'red' },
    } as unknown as StyleSelectors;

    const tpl = createStyleTemplate({
      properties: { color: 'black' },
      selectors: selectorsWithUndefined,
    });

    expect(tpl.selectors).toEqual({
      hover: { color: 'blue' },
      active: { color: 'red' },
    });
    expect('focus' in (tpl.selectors ?? {})).toBe(false);
  });

  it('全 selectors エントリが undefined でも空オブジェクトの selectors を持つ', () => {
    const allUndefined = {
      hover: undefined,
      focus: undefined,
    } as unknown as StyleSelectors;

    const tpl = createStyleTemplate({
      properties: { color: 'black' },
      selectors: allUndefined,
    });

    expect(tpl.selectors).toEqual({});
    expect(Object.isFrozen(tpl.selectors)).toBe(true);
  });
});

// ============================================================
// createStyleTemplate - name / selectors の三項分岐補完
// ============================================================

describe('createStyleTemplate - name / selectors 三項分岐', () => {
  it('name 未指定 / selectors 未指定: 戻り値に name / selectors キーが存在しない', () => {
    const tpl = createStyleTemplate({ properties: { display: 'flex' } });

    expect('name' in tpl).toBe(false);
    expect('selectors' in tpl).toBe(false);
    expect(tpl.hasExplicitName).toBe(false);
  });

  it('name 指定 / selectors 未指定: name キーは存在し、selectors キーは存在しない', () => {
    const tpl = createStyleTemplate({
      name: 'btn',
      properties: { padding: '10px' },
    });

    expect('name' in tpl).toBe(true);
    expect(tpl.name).toBe('btn');
    expect('selectors' in tpl).toBe(false);
  });

  it('name 未指定 / selectors 指定: selectors キーは存在し、name キーは存在しない', () => {
    const tpl = createStyleTemplate({
      properties: { color: 'red' },
      selectors: { hover: { color: 'blue' } },
    });

    expect('name' in tpl).toBe(false);
    expect('selectors' in tpl).toBe(true);
    expect(tpl.selectors).toEqual({ hover: { color: 'blue' } });
  });

  it('name 指定 / selectors 指定: 両キーが存在する', () => {
    const input: CreateStyleTemplateInput = {
      name: 'btn',
      properties: { padding: '10px' },
      selectors: { hover: { background: 'gray' } },
    };
    const tpl = createStyleTemplate(input);

    expect('name' in tpl).toBe(true);
    expect('selectors' in tpl).toBe(true);
    expect(tpl.name).toBe('btn');
    expect(tpl.selectors).toEqual({ hover: { background: 'gray' } });
  });
});

// ============================================================
// stableStringify - null / primitive 分岐
// ============================================================

describe('createStyleTemplate - stableStringify 非オブジェクト分岐', () => {
  it('properties の値が null でも安定 hash を返す（typeof null === object 経路の早期 return）', () => {
    const propsWithNull = {
      color: null,
      display: 'flex',
    } as unknown as Record<string, string>;

    const a = createStyleTemplate({ properties: propsWithNull });
    const b = createStyleTemplate({ properties: propsWithNull });

    expect(a.bodyHash).toBe(b.bodyHash);
    expect(a.bodyHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('selectors が省略された場合と空オブジェクト指定の場合で bodyHash は別になる', () => {
    // selectors 省略 → null として正規化
    const a = createStyleTemplate({ properties: { color: 'red' } });
    // selectors {} → {} として正規化
    const b = createStyleTemplate({
      properties: { color: 'red' },
      selectors: {},
    });

    expect(a.bodyHash).not.toBe(b.bodyHash);
  });
});
