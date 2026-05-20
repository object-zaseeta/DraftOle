/**
 * layout-types.ts の型レベルテスト
 *
 * - 各オプション型が TypeScript で型補完されることを確認する。
 * - 余分なプロパティを渡すとコンパイルエラーになることを @ts-expect-error で検証する。
 *
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1
 */

import { describe, expect, it } from 'vitest';
import type {
  StackOptions,
  ZStackOptions,
  SpacerOptions,
  LayoutChild,
} from '../../../src/html/layout/layout-types.js';
import type { HtmlTag } from '../../../src/html/elements/html-tag.js';

// ── StackOptions ──────────────────────────────────────────────────────────────

describe('StackOptions 型', () => {
  it('すべてのプロパティが省略可能であること', () => {
    const opts: StackOptions = {};
    expect(opts).toBeDefined();
  });

  it('spacing に number を指定できること', () => {
    const opts: StackOptions = { spacing: 8 };
    expect(opts.spacing).toBe(8);
  });

  it('alignment に有効な AlignmentValue を指定できること', () => {
    const opts: StackOptions = { alignment: 'center' };
    expect(opts.alignment).toBe('center');
  });

  it('alignment に flex-start を指定できること', () => {
    const opts: StackOptions = { alignment: 'flex-start' };
    expect(opts.alignment).toBe('flex-start');
  });

  it('alignment に flex-end を指定できること', () => {
    const opts: StackOptions = { alignment: 'flex-end' };
    expect(opts.alignment).toBe('flex-end');
  });

  it('wrap に boolean を指定できること', () => {
    const opts: StackOptions = { wrap: true };
    expect(opts.wrap).toBe(true);
  });

  it('すべてのプロパティを同時に指定できること', () => {
    const opts: StackOptions = { spacing: 16, alignment: 'center', wrap: false };
    expect(opts).toEqual({ spacing: 16, alignment: 'center', wrap: false });
  });

  it('余分なプロパティを渡すとコンパイルエラーになること', () => {
    // @ts-expect-error 余分なプロパティ `unknown` は StackOptions に存在しない
    const opts: StackOptions = { unknown: true };
    // ランタイムでは通過するが型チェックでエラーになる
    expect(opts).toBeDefined();
  });
});

// ── ZStackOptions ─────────────────────────────────────────────────────────────

describe('ZStackOptions 型', () => {
  it('空オブジェクトを受け入れること', () => {
    const opts: ZStackOptions = {};
    expect(opts).toBeDefined();
  });

  it('alignment に ZStackAlignmentKey を指定できること', () => {
    const opts: ZStackOptions = { alignment: 'center' };
    expect(opts.alignment).toBe('center');
  });

  it('alignment に topLeading を指定できること', () => {
    const opts: ZStackOptions = { alignment: 'topLeading' };
    expect(opts.alignment).toBe('topLeading');
  });

  it('alignment に bottomTrailing を指定できること', () => {
    const opts: ZStackOptions = { alignment: 'bottomTrailing' };
    expect(opts.alignment).toBe('bottomTrailing');
  });

  it('余分なプロパティを渡すとコンパイルエラーになること', () => {
    // @ts-expect-error 余分なプロパティ `extra` は ZStackOptions に存在しない
    const opts: ZStackOptions = { extra: 'value' };
    expect(opts).toBeDefined();
  });
});

// ── SpacerOptions ─────────────────────────────────────────────────────────────

describe('SpacerOptions 型', () => {
  it('空オブジェクトを受け入れること', () => {
    const opts: SpacerOptions = {};
    expect(opts).toBeDefined();
  });

  it('minLength に number を指定できること', () => {
    const opts: SpacerOptions = { minLength: 20 };
    expect(opts.minLength).toBe(20);
  });

  it('余分なプロパティを渡すとコンパイルエラーになること', () => {
    // @ts-expect-error 余分なプロパティ `maxLength` は SpacerOptions に存在しない
    const opts: SpacerOptions = { maxLength: 100 };
    expect(opts).toBeDefined();
  });
});

// ── LayoutChild 型 ────────────────────────────────────────────────────────────

describe('LayoutChild 型', () => {
  it('string を LayoutChild として割り当てられること', () => {
    const child: LayoutChild = 'Hello World';
    expect(typeof child).toBe('string');
  });

  it('HtmlTag インスタンスが LayoutChild として割り当て可能な型であること（型レベル確認）', () => {
    // HtmlTag は抽象クラスのため直接インスタンス化はできないが、
    // 型の互換性は型キャストで確認する。
    const fakeTag = {} as HtmlTag;
    const child: LayoutChild = fakeTag;
    expect(child).toBeDefined();
  });
});

// ── index.ts からの再エクスポート確認 ─────────────────────────────────────────

describe('layout/index.ts からの re-export', () => {
  it('index.ts から全型が再エクスポートされること', async () => {
    // 動的インポートで index.ts 経由のエクスポートを確認する
    // 型のみのエクスポートはランタイムには影響しないが、モジュール解決を確認する
    const mod = await import('../../../src/html/layout/index.js');
    // 型のみのエクスポートはランタイム値を持たないが、モジュールが正常にインポートできることを確認
    expect(mod).toBeDefined();
  });
});
