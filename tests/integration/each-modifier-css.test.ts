/**
 * each-modifier-css-extraction Task 3.1: each() 内 modifier-chain スタイルが
 * style.css に出力されることを検証する統合テスト。
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 4.1, 4.3
 */
import { describe, expect, it } from 'vitest';
import { div, li, span, ul } from '../../src/html/tags/factories.js';
import { Root } from '../../src/html/elements/root.js';
import type { ElementMethods } from '../../src/js/vanilla/element-methods.js';

type LiWithMethods = ReturnType<typeof li> & ElementMethods<ReturnType<typeof li>>;
type SpanWithMethods = ReturnType<typeof span> & ElementMethods<ReturnType<typeof span>>;

describe('each-modifier-css-extraction', () => {
  describe('Case 1 (Req 1.1): each() template 内 modifier-chain CSS が style.css に出力される', () => {
    it('li.padding(...).cornerRadius(...) の CSS が含まれる', () => {
      const root = new Root();
      const items = root.state(['A', 'B', 'C']);
      const binding = items.each((item) =>
        (li(
          (span() as SpanWithMethods).text(item.map((v) => v)),
        ) as LiWithMethods)
          .padding('12px')
          .cornerRadius('8px') as ReturnType<typeof li>,
      );
      root.addChild(ul().appendChild(binding));

      const css = root.collectCssStyleString();
      expect(css).toMatch(/padding:\s*12px/);
      expect(css).toMatch(/border-radius:\s*8px/);
    });
  });

  describe('Case 2 (Req 1.2): hash クラス名と CSS ルールが対応する', () => {
    it('each() 内 li 要素のクラス名と style.css 内ルール名が一致', () => {
      const root = new Root();
      const items = root.state(['A', 'B']);
      const binding = items.each((item) =>
        (li(
          (span() as SpanWithMethods).text(item.map((v) => v)),
        ) as LiWithMethods).padding('10px') as ReturnType<typeof li>,
      );
      root.addChild(ul().appendChild(binding));

      const css = root.collectCssStyleString();
      const matches = css.match(/\._(?:[a-z0-9-]+__)?[0-9a-f]{8}\s*\{[^}]*padding:\s*10px/);
      expect(matches).not.toBeNull();
    });
  });

  describe('Case 3 (Req 1.3): ネスト子要素の modifier-chain CSS も出力される', () => {
    it('each() 内 hstack > span 階層の各 modifier CSS が含まれる', () => {
      const root = new Root();
      const items = root.state(['A', 'B']);
      const binding = items.each((item) =>
        li(
          (span() as SpanWithMethods)
            .text(item.map((v) => v))
            .padding('4px') as ReturnType<typeof span>,
        ) as ReturnType<typeof li>,
      );
      root.addChild(ul().appendChild(binding));

      const css = root.collectCssStyleString();
      expect(css).toMatch(/padding:\s*4px/);
    });
  });

  describe('Case 4 (Req 1.4): 同一 template の CSS は 1 回のみ出力される', () => {
    it('複数 item に展開されても CSS ブロックは template 単位で 1 回', () => {
      const root = new Root();
      const items = root.state(['A', 'B', 'C', 'D', 'E']);
      const binding = items.each((item) =>
        (li(
          (span() as SpanWithMethods).text(item.map((v) => v)),
        ) as LiWithMethods).padding('7px') as ReturnType<typeof li>,
      );
      root.addChild(ul().appendChild(binding));

      const css = root.collectCssStyleString();
      const occurrences = (css.match(/padding:\s*7px/g) ?? []).length;
      expect(occurrences).toBe(1);
    });
  });

  describe('Case 6 (Req 2.1): 静的要素の modifier-chain CSS は each 拡張後も不変', () => {
    it('each() なし要素の modifier-chain CSS は引き続き出力される', () => {
      const root = new Root();
      const staticDiv = (div() as ElementMethods<ReturnType<typeof div>>)
        .padding('20px')
        .background('red') as ReturnType<typeof div>;
      root.addChild(staticDiv);

      const css = root.collectCssStyleString();
      expect(css).toMatch(/padding:\s*20px/);
      expect(css).toMatch(/background(-color)?:\s*red/);
    });
  });

  describe('Case 7 (Req 4.3): each() なし要素では追加コードが no-op', () => {
    it('bind-each を持たない要素では既存挙動と等価', () => {
      const root = new Root();
      const onlyStatic = (div() as ElementMethods<ReturnType<typeof div>>)
        .padding('5px') as ReturnType<typeof div>;
      root.addChild(onlyStatic);

      const css = root.collectCssStyleString();
      expect(css).toMatch(/padding:\s*5px/);
    });
  });
});
