/**
 * Task 2.1 (html-tag-responsibility-split): `_internal/frame-options.ts` の
 * `toCssValue` / `applyFrame` 純関数ユニットテスト。
 *
 * 検証内容:
 * - `toCssValue` の境界値: 数値 / 文字列 / `Infinity`（allow flag の有無）
 * - `applyFrame` が `host.width` / `host.height` / `host.minWidth` /
 *   `host.maxWidth` / `host.minHeight` / `host.maxHeight` の 6 種 setter を
 *   既存 `.frame()` と同順序・同引数で呼び出すこと
 * - 実 `div()` を用いた end-to-end 検証で、既存 `.frame()` 出力と一致すること
 *
 * Requirements: 6.1
 * Design: design.md "Components and Interfaces" → `_internal/frame-options.ts`
 *         (Service Interface) / "Allowed Dependencies"
 */
import { describe, expect, it, vi } from 'vitest';
import {
  applyFrame,
  toCssValue,
} from '../../../../src/html/elements/_internal/frame-options.js';
import { HtmlTag, type FrameOptions } from '../../../../src/html/elements/html-tag.js';
import type { TagType } from '../../../../src/html/tags/tag-type.js';

/** テスト用具象サブクラス（`HtmlTag` は abstract）。 */
class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

/** `applyFrame` から `host` に呼ばれる 6 種 setter の名前列。 */
type FrameSetterName =
  | 'width'
  | 'height'
  | 'minWidth'
  | 'maxWidth'
  | 'minHeight'
  | 'maxHeight';

const FRAME_SETTER_NAMES: readonly FrameSetterName[] = [
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
];

/**
 * 6 つの setter（width / height / minWidth / maxWidth / minHeight / maxHeight）
 * の呼び出し列を観測するための spy host を組み立てるヘルパー。
 *
 * `vi.spyOn` で各 setter をラップし、呼び出し順序と引数を `calls` に記録する。
 */
function makeSpyHost(): {
  host: HtmlTag;
  calls: Array<{ method: FrameSetterName; arg: string }>;
} {
  const tag = new TestTag();
  const calls: Array<{ method: FrameSetterName; arg: string }> = [];
  for (const name of FRAME_SETTER_NAMES) {
    vi.spyOn(tag, name).mockImplementation(function spied(this: HtmlTag, v: string): HtmlTag {
      calls.push({ method: name, arg: v });
      return this;
    });
  }
  return { host: tag, calls };
}

describe('_internal/frame-options', () => {
  describe('toCssValue', () => {
    it('number → `{n}px` に変換する', () => {
      expect(toCssValue(700)).toBe('700px');
      expect(toCssValue(0)).toBe('0px');
      expect(toCssValue(-12)).toBe('-12px');
    });

    it('文字列は素通しする', () => {
      expect(toCssValue('50%')).toBe('50%');
      expect(toCssValue('none')).toBe('none');
      expect(toCssValue('auto')).toBe('auto');
    });

    it('`Infinity` は allowInfinity=true のとき `100%` に変換する', () => {
      expect(toCssValue(Infinity, true)).toBe('100%');
    });

    it('`Infinity` は allowInfinity 省略時は `Infinitypx` のような数値変換とみなさず既存挙動を維持する（=既存 `.frame()` のフォールバック）', () => {
      // 既存 .frame() は allowInfinity 省略時に number 枝へ落ちて `${Infinity}px` を返す。
      // 純関数として同等の挙動（呼び出し元 = maxWidth/maxHeight 以外）を再現することを確認する。
      expect(toCssValue(Infinity)).toBe(`${Infinity}px`);
      expect(toCssValue(Infinity, false)).toBe(`${Infinity}px`);
    });

    it('文字列値は allowInfinity の影響を受けず素通しする', () => {
      expect(toCssValue('100vh', true)).toBe('100vh');
      expect(toCssValue('100vh', false)).toBe('100vh');
    });
  });

  describe('applyFrame', () => {
    it('全 6 プロパティ指定時、width → height → minWidth → maxWidth → minHeight → maxHeight の順で setter が呼ばれる', () => {
      const { host, calls } = makeSpyHost();
      const options: FrameOptions = {
        width: 100,
        height: 200,
        minWidth: 50,
        maxWidth: 800,
        minHeight: 25,
        maxHeight: 400,
      };

      applyFrame(host, options);

      expect(calls).toEqual([
        { method: 'width', arg: '100px' },
        { method: 'height', arg: '200px' },
        { method: 'minWidth', arg: '50px' },
        { method: 'maxWidth', arg: '800px' },
        { method: 'minHeight', arg: '25px' },
        { method: 'maxHeight', arg: '400px' },
      ]);
    });

    it('未指定プロパティの setter は呼ばれない', () => {
      const { host, calls } = makeSpyHost();
      applyFrame(host, { width: 700 });
      expect(calls).toEqual([{ method: 'width', arg: '700px' }]);
    });

    it('`maxWidth: Infinity` は `100%` として渡される', () => {
      const { host, calls } = makeSpyHost();
      applyFrame(host, { maxWidth: Infinity });
      expect(calls).toEqual([{ method: 'maxWidth', arg: '100%' }]);
    });

    it('`maxHeight: Infinity` は `100%` として渡される', () => {
      const { host, calls } = makeSpyHost();
      applyFrame(host, { maxHeight: Infinity });
      expect(calls).toEqual([{ method: 'maxHeight', arg: '100%' }]);
    });

    it('文字列は素通しされる', () => {
      const { host, calls } = makeSpyHost();
      applyFrame(host, { width: '50%', maxWidth: 'none' });
      expect(calls).toEqual([
        { method: 'width', arg: '50%' },
        { method: 'maxWidth', arg: 'none' },
      ]);
    });

    it('既存 `.frame()` と同じ最終 style 文字列を生成する（end-to-end 整合性）', () => {
      const reference = new TestTag();
      reference.frame({ width: 700, maxWidth: Infinity, minHeight: 50 });

      const target = new TestTag();
      applyFrame(target, { width: 700, maxWidth: Infinity, minHeight: 50 });

      expect(target.style.position.render()).toBe(reference.style.position.render());
    });

    it('戻り値は `void`（method chain の `this` は呼び出し元責務）', () => {
      const { host } = makeSpyHost();
      const result = applyFrame(host, { width: 100 });
      expect(result).toBeUndefined();
    });
  });
});
