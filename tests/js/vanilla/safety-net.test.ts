/**
 * safety-net 実行時テスト（handler-serialization Task 2.4）。
 *
 * 対応 requirement: 5.2
 * 対応 design.md: D-5
 *
 * 検証観点:
 *   - transformer 未経由のアロー関数を `.on` に渡すと呼び出し時に Error が throw される
 *   - エラーメッセージに "draftole TypeScript transformer" が含まれる
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { HtmlAttribute } from '../../../src/html/attributes/html-attribute.ts';
import { PairType } from '../../../src/html/elements/pair-type.ts';
import type { HtmlTag } from '../../../src/html/elements/html-tag.ts';
import { applyElementMixin } from '../../../src/js/vanilla/element-methods.ts';

// ─── テスト準備 ───────────────────────────────────────────────────────────────

function makeEl(id: string): HtmlTag {
  const el = new PairType('div');
  el.addHtmlAttribute(HtmlAttribute.keyValue('id', id));
  return el as HtmlTag;
}

beforeAll(() => {
  applyElementMixin(PairType.prototype as HtmlTag);
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 5.2: transformer 未経由のアロー関数を .on に渡すと Error が throw される
// ─────────────────────────────────────────────────────────────────────────────

describe('safety-net: transformer 未経由のアロー関数は .on 呼び出し時にエラーになる（Req 5.2）', () => {
  it('ゼロ引数アロー関数を .on に渡すと Error が throw される', () => {
    const el = makeEl('sn1');
    expect(() => {
      el.on('click', () => {
        /* transformer 未経由のアロー関数 */
      });
    }).toThrowError(/draftole TypeScript transformer/);
  });

  it('1引数アロー関数を .on に渡すと Error が throw される', () => {
    const el = makeEl('sn2');
    expect(() => {
      el.on('click', (_e: MouseEvent) => {
        /* transformer 未経由のアロー関数 */
      });
    }).toThrowError(/draftole TypeScript transformer/);
  });

  it('エラーメッセージに "draftole TypeScript transformer" が含まれる', () => {
    const el = makeEl('sn3');
    let caught: unknown;
    try {
      el.on('click', () => {});
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toContain('draftole TypeScript transformer');
  });

  it('_draftoleEmitted マーカーなしのアロー関数はすべて safety-net で弾かれる', () => {
    const el = makeEl('sn4');
    const arrowFn = () => {};
    expect(() => {
      el.on('input', arrowFn);
    }).toThrowError(/draftole TypeScript transformer/);
  });
});
