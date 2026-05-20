/**
 * Task 2.2 (html-tag-responsibility-split): `_internal/breakpoint-applier.ts` の
 * `applyResponsive` 純関数ユニットテスト。
 *
 * 検証内容:
 * - 名前付きキー（'sm' / 'md' / 'lg' / 'xl'）が `Breakpoints` 定数経由で数値解決される
 * - 数値キーは `Number(key)` でそのまま使用される
 * - 無効値（`!Number.isFinite(bp) || bp <= 0`）はスキップされる
 * - props は `typeof value === 'string'` のもののみ採用される
 *   （undefined / number 等は除外）
 * - props が空（採用 0 件）の breakpoint は `addMediaRule` を呼ばない
 * - end-to-end: 実 `TestTag.responsive()` の `host.css.addMediaRule` 呼び出し列と
 *   `applyResponsive(host, options)` の呼び出し列が完全一致する
 *
 * Requirements: 6.2
 * Design: design.md "Components and Interfaces" → `_internal/breakpoint-applier.ts`
 *         (Service Interface) / "Allowed Dependencies"
 */
import { describe, expect, it, vi } from 'vitest';
import { applyResponsive } from '../../../../src/html/elements/_internal/breakpoint-applier.js';
import { HtmlTag } from '../../../../src/html/elements/html-tag.js';
import type { BreakpointStyles } from '../../../../src/css/constants/breakpoints.js';
import type { TagType } from '../../../../src/html/tags/tag-type.js';

/** テスト用具象サブクラス（`HtmlTag` は abstract）。 */
class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

/**
 * `host.css.addMediaRule` の呼び出し列を観測するための spy host を組み立てるヘルパー。
 *
 * `vi.spyOn(tag.css, 'addMediaRule')` で本来の `addMediaRule` をラップし、
 * 呼び出し順序と引数を `calls` に記録する。
 */
function makeSpyHost(): {
  host: HtmlTag;
  calls: Array<{ bp: number; props: Record<string, string> }>;
} {
  const tag = new TestTag();
  const calls: Array<{ bp: number; props: Record<string, string> }> = [];
  vi.spyOn(tag.css, 'addMediaRule').mockImplementation(
    (bp: number, props: Record<string, string>): void => {
      calls.push({ bp, props });
    },
  );
  return { host: tag, calls };
}

describe('_internal/breakpoint-applier', () => {
  describe('applyResponsive', () => {
    it('名前付きキー（sm/md/lg/xl）は Breakpoints 定数で数値解決される', () => {
      const { host, calls } = makeSpyHost();
      const options: BreakpointStyles = {
        sm: { padding: '8px' },
        md: { padding: '16px' },
        lg: { padding: '24px' },
        xl: { fontSize: '18px' },
      };

      applyResponsive(host, options);

      expect(calls).toEqual([
        { bp: 640, props: { padding: '8px' } },
        { bp: 768, props: { padding: '16px' } },
        { bp: 1024, props: { padding: '24px' } },
        { bp: 1280, props: { fontSize: '18px' } },
      ]);
    });

    it('数値キーはそのまま breakpoint として使用される', () => {
      const { host, calls } = makeSpyHost();
      const options: BreakpointStyles = {
        480: { color: 'red' },
        1440: { color: 'blue' },
      };

      applyResponsive(host, options);

      expect(calls).toEqual([
        { bp: 480, props: { color: 'red' } },
        { bp: 1440, props: { color: 'blue' } },
      ]);
    });

    it('無効値（NaN / 0 / 負数）の breakpoint はスキップされる', () => {
      const { host, calls } = makeSpyHost();
      // `'invalid'` は `Number('invalid')` → NaN（!Number.isFinite）でスキップ。
      // `'0'` は `Number('0')` → 0（bp <= 0）でスキップ。
      // `'-100'` は `Number('-100')` → -100（bp <= 0）でスキップ。
      // 名前付きキー以外の文字列キーは `BreakpointStyles` 型に無いため、
      // `Record<string, Partial<CSSStyleDeclaration> | undefined>` を経由して
      // 単段 cast で型整合させる（`as unknown as X` 二段キャストは禁止）。
      const options: Record<string, Partial<CSSStyleDeclaration> | undefined> = {
        invalid: { color: 'red' },
        0: { color: 'green' },
        '-100': { color: 'blue' },
        md: { color: 'black' },
      };

      applyResponsive(host, options as BreakpointStyles);

      expect(calls).toEqual([{ bp: 768, props: { color: 'black' } }]);
    });

    it('typeof value === "string" 以外の props（undefined / number）は採用しない', () => {
      const { host, calls } = makeSpyHost();
      // `Partial<CSSStyleDeclaration>` は `string` ベースだが、ランタイムでは
      // 任意値が紛れ込む可能性がある。`applyResponsive` は string のみ採用する。
      const options = {
        md: {
          padding: '16px',
          margin: undefined,
          // @ts-expect-error number は CSSStyleDeclaration 上 string 必須だがランタイム検証対象
          zIndex: 10,
        },
      } as BreakpointStyles;

      applyResponsive(host, options);

      expect(calls).toEqual([{ bp: 768, props: { padding: '16px' } }]);
    });

    it('採用 props 0 件の breakpoint は addMediaRule を呼ばない', () => {
      const { host, calls } = makeSpyHost();
      const options = {
        md: { margin: undefined },
        lg: { padding: '24px' },
      } as BreakpointStyles;

      applyResponsive(host, options);

      expect(calls).toEqual([{ bp: 1024, props: { padding: '24px' } }]);
    });

    it('styles === undefined のキーは完全にスキップされる', () => {
      const { host, calls } = makeSpyHost();
      const options = {
        sm: undefined,
        md: { padding: '16px' },
      } as BreakpointStyles;

      applyResponsive(host, options);

      expect(calls).toEqual([{ bp: 768, props: { padding: '16px' } }]);
    });

    it('既存 `.responsive()` と同じ `addMediaRule` 呼び出し列を生成する（end-to-end 整合性）', () => {
      // reference: 実 .responsive() を spy 経由で観測
      const reference = new TestTag();
      const referenceCalls: Array<{ bp: number; props: Record<string, string> }> = [];
      vi.spyOn(reference.css, 'addMediaRule').mockImplementation(
        (bp: number, props: Record<string, string>): void => {
          referenceCalls.push({ bp, props });
        },
      );

      // target: applyResponsive 直接呼び出し
      const { host: target, calls: targetCalls } = makeSpyHost();

      const options: BreakpointStyles = {
        sm: { padding: '8px' },
        md: { padding: '16px', margin: undefined },
        xl: { fontSize: '18px' },
        1440: { color: 'blue' },
      };

      reference.responsive(options);
      applyResponsive(target, options);

      expect(targetCalls).toEqual(referenceCalls);
    });

    it('戻り値は `void`（method chain の `this` は呼び出し元責務）', () => {
      const { host } = makeSpyHost();
      const result = applyResponsive(host, { md: { padding: '16px' } });
      expect(result).toBeUndefined();
    });
  });
});
