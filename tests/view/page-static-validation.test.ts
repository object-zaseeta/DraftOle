import { describe, expect, it } from 'vitest';
import { div } from '../../src/html/tags/index.js';
import { page } from '../../src/view/page.js';

/**
 * Task 2.2: page() ファクトリ構築時 pure validation。
 *
 * 関連: requirements.md 3.2 / design.md §6.2, §6.3
 *
 * `.jqm.on(...)` 等で runtime コンテンツを担持した要素を `page()` に渡した場合、
 * `page()` 自体が即座に `Error` を throw し `PageDocument` インスタンスは生成されない。
 */
describe('page() 構築時 pure validation (task 2.2)', () => {
  it('.jqm.on(...) 済み要素を渡すと page() 自体が throw する', () => {
    const interactive = div();
    // jqm.on() の handler はハンドラ関数名（string）。usedMethods に 'on' を登録する。
    interactive.jqm.on('click', 'handleClick');

    expect(() => page(interactive)).toThrow(
      /page surface does not allow runtime content/,
    );
  });

  it('runtime を持たない要素では page() は throw せず PageDocument を返す', () => {
    expect(() => page(div())).not.toThrow();
  });
});
