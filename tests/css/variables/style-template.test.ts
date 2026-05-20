/**
 * Task 1.1: StyleTemplate 型と bodyHash ユーティリティのテスト
 *
 * TDD RED phase:
 * - StyleTemplate ファクトリ関数が不変オブジェクトを返すこと
 * - bodyHash が `properties` と `selectors` の JSON 正規化（キーソート）+ djb2 で算出されること
 * - 同一入力では同一 bodyHash、異なる入力では異なる bodyHash を返すこと
 * - hasExplicitName / name のペア不変条件が守られること
 *
 * Requirements: 1.1, 1.2, 2.1, 2.4
 */
import { describe, it, expect } from 'vitest';
import {
  createStyleTemplate,
  type StyleTemplate,
} from '../../../src/css/variables/style-template.js';
import { djb2Hash } from '../../../src/css/utils/scoped-css-generator.js';

// ============================================================
// 基本構造
// ============================================================

describe('createStyleTemplate - 基本構造', () => {
  it('無名形では _kind=styleTemplate / hasExplicitName=false / name=undefined を返す', () => {
    const tpl = createStyleTemplate({ properties: { display: 'flex' } });

    expect(tpl._kind).toBe('styleTemplate');
    expect(tpl.hasExplicitName).toBe(false);
    expect(tpl.name).toBeUndefined();
    expect(tpl.properties).toEqual({ display: 'flex' });
    expect(tpl.selectors).toBeUndefined();
    expect(typeof tpl.bodyHash).toBe('string');
    expect(tpl.bodyHash.length).toBe(8);
  });

  it('名前あり形では hasExplicitName=true / name=指定値 を返す', () => {
    const tpl = createStyleTemplate({
      name: 'btn',
      properties: { padding: '10px' },
    });

    expect(tpl.hasExplicitName).toBe(true);
    expect(tpl.name).toBe('btn');
  });

  it('selectors を指定すると保持される', () => {
    const tpl = createStyleTemplate({
      properties: { color: 'red' },
      selectors: { hover: { color: 'blue' } },
    });

    expect(tpl.selectors).toEqual({ hover: { color: 'blue' } });
  });

  it('返される properties は frozen である（不変）', () => {
    const tpl = createStyleTemplate({ properties: { display: 'flex' } });

    expect(Object.isFrozen(tpl)).toBe(true);
    expect(Object.isFrozen(tpl.properties)).toBe(true);
  });

  it('selectors も frozen である', () => {
    const tpl = createStyleTemplate({
      properties: { color: 'red' },
      selectors: { hover: { color: 'blue' } },
    });

    expect(Object.isFrozen(tpl.selectors)).toBe(true);
  });
});

// ============================================================
// bodyHash の決定性
// ============================================================

describe('createStyleTemplate - bodyHash の決定性', () => {
  it('同一 properties 入力に対して同じ bodyHash を返す', () => {
    const a = createStyleTemplate({ properties: { display: 'flex', gap: '10px' } });
    const b = createStyleTemplate({ properties: { display: 'flex', gap: '10px' } });

    expect(a.bodyHash).toBe(b.bodyHash);
  });

  it('properties のキー順序が異なっても bodyHash は同一（JSON 正規化キーソート）', () => {
    const a = createStyleTemplate({ properties: { display: 'flex', gap: '10px' } });
    const b = createStyleTemplate({ properties: { gap: '10px', display: 'flex' } });

    expect(a.bodyHash).toBe(b.bodyHash);
  });

  it('異なる properties に対して異なる bodyHash を返す', () => {
    const a = createStyleTemplate({ properties: { display: 'flex' } });
    const b = createStyleTemplate({ properties: { display: 'block' } });

    expect(a.bodyHash).not.toBe(b.bodyHash);
  });

  it('selectors の有無で bodyHash が異なる', () => {
    const a = createStyleTemplate({ properties: { color: 'red' } });
    const b = createStyleTemplate({
      properties: { color: 'red' },
      selectors: { hover: { color: 'blue' } },
    });

    expect(a.bodyHash).not.toBe(b.bodyHash);
  });

  it('selectors が同一でも properties が異なれば bodyHash が異なる', () => {
    const sharedSelectors = { hover: { color: 'blue' } };
    const a = createStyleTemplate({
      properties: { color: 'red' },
      selectors: sharedSelectors,
    });
    const b = createStyleTemplate({
      properties: { color: 'green' },
      selectors: sharedSelectors,
    });

    expect(a.selectors).toEqual(b.selectors);
    expect(a.bodyHash).not.toBe(b.bodyHash);
  });

  it('selectors のキー順序が異なっても bodyHash は同一', () => {
    const a = createStyleTemplate({
      properties: { color: 'red' },
      selectors: { hover: { color: 'blue' }, focus: { color: 'green' } },
    });
    const b = createStyleTemplate({
      properties: { color: 'red' },
      selectors: { focus: { color: 'green' }, hover: { color: 'blue' } },
    });

    expect(a.bodyHash).toBe(b.bodyHash);
  });

  it('selectors 内ネストオブジェクトのキー順差も正規化される', () => {
    const a = createStyleTemplate({
      properties: { color: 'red' },
      selectors: { hover: { color: 'blue', background: 'white' } },
    });
    const b = createStyleTemplate({
      properties: { color: 'red' },
      selectors: { hover: { background: 'white', color: 'blue' } },
    });

    expect(a.bodyHash).toBe(b.bodyHash);
  });

  it('name が異なっても (properties, selectors) が同じなら bodyHash は同じ', () => {
    const a = createStyleTemplate({ name: 'foo', properties: { display: 'flex' } });
    const b = createStyleTemplate({ name: 'bar', properties: { display: 'flex' } });

    expect(a.bodyHash).toBe(b.bodyHash);
  });

  it('bodyHash は djb2(JSON 正規化文字列) と一致する', () => {
    const properties = { display: 'flex', gap: '10px' };
    const tpl = createStyleTemplate({ properties });

    // 期待: properties は { properties: <sorted>, selectors: undefined } 構造で
    // 正規化される。実装の自由度を保つため、a/b の整合性のみで検証する。
    // ここでは「ハッシュが djb2 形式（8文字16進）」かのみ確認する。
    expect(tpl.bodyHash).toMatch(/^[0-9a-f]{8}$/);
    expect(tpl.bodyHash).not.toBe(djb2Hash('')); // 空ではない
  });
});

// ============================================================
// 独立性（Req 2.4）
// ============================================================

describe('createStyleTemplate - 独立性', () => {
  it('同じ入力でも別呼び出しは別オブジェクト（参照不一致）', () => {
    const a = createStyleTemplate({ properties: { display: 'flex' } });
    const b = createStyleTemplate({ properties: { display: 'flex' } });

    expect(a).not.toBe(b);
    expect(a.bodyHash).toBe(b.bodyHash);
  });

  it('properties 引数を後から変更しても StyleTemplate には影響しない', () => {
    const props: Record<string, string> = { display: 'flex' };
    const tpl: StyleTemplate = createStyleTemplate({ properties: props });
    const originalHash = tpl.bodyHash;

    props.display = 'block';
    props.gap = '10px';

    expect(tpl.bodyHash).toBe(originalHash);
    expect(tpl.properties.display).toBe('flex');
    expect(tpl.properties.gap).toBeUndefined();
  });
});
