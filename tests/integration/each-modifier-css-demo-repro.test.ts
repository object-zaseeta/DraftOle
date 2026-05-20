/**
 * Repro test: mvp-demo の todo list 構造を最小化して再現し、
 * each() 内 modifier-chain CSS が style.css に出力されるか検証する。
 *
 * 構造: section > ul > each(li.padding(...).cornerRadius(...))
 *
 * Requirements: 1.1, 1.3
 */
import { describe, expect, it } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import { div, li, section, span, ul } from '../../src/html/tags/factories.js';
import type { ElementMethods } from '../../src/js/vanilla/element-methods.js';

type LiMethods = ReturnType<typeof li> & ElementMethods<ReturnType<typeof li>>;
type SpanMethods = ReturnType<typeof span> & ElementMethods<ReturnType<typeof span>>;

describe('mvp-demo each() repro', () => {
  it('section > ul > each(li.padding) で li 用 CSS が出力される', () => {
    const root = new Root();
    const items = root.state(['A', 'B']);
    const sectionEl = section(
      ul().appendChild(
        items.each((item) =>
          (li(
            (span() as SpanMethods).text(item.map((v) => v)) as ReturnType<typeof span>,
          ) as LiMethods)
            .padding('12px')
            .cornerRadius('12px')
            .background('rgba(0,0,0,0.22)') as ReturnType<typeof li>,
        ),
      ),
    );
    root.addChild(sectionEl);

    const html = root.render();
    const css = root.collectCssStyleString();

    // Debug logging — remove if test passes
    console.log('--- HTML ---\n', html, '\n--- CSS ---\n', css);

    expect(css).toMatch(/padding:\s*12px/);
    expect(css).toMatch(/border-radius:\s*12px/);
  });

  it('深いネスト: vstack > section > ul > each で深い tagPath でも CSS 出力される', () => {
    const root = new Root();
    const items = root.state(['X']);
    const tree = div(
      section(
        ul().appendChild(
          items.each((item) =>
            (li(
              (span() as SpanMethods).text(item.map((v) => v)) as ReturnType<typeof span>,
            ) as LiMethods).padding('77px') as ReturnType<typeof li>,
          ),
        ),
      ),
    );
    root.addChild(tree);

    root.render();
    const css = root.collectCssStyleString();
    expect(css).toMatch(/padding:\s*77px/);
  });
});
