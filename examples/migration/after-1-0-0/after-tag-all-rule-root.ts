/**
 * 1.0.0 移行 example: `tag` / `all` / `rule` / `root` → `css.raw` / `sel.*`
 *
 * Before (0.x.y):
 * ```typescript
 * import { tag, all, rule, root } from 'draft-ole';
 * const reset = all({ boxSizing: 'border-box' });
 * const headings = tag('h1', { fontSize: '2rem' });
 * const focus = rule('.btn:focus', { outline: '2px solid blue' });
 * const tokens = root({ '--bg': '#000' });
 * ```
 *
 * After (1.0.0): 2 経路
 * 1. `css.raw` — 任意の生 CSS 文字列を `GlobalCss` ブランド型へラップ（escape hatch）
 * 2. `sel` namespace — `sel.tag` / `sel.all` / `sel.rule` / `sel.root` で同等 API（kept policy）
 *    （ただし IDE 上は `@deprecated` strikethrough 解除済み、`@internal` に変更）
 */

import { css, sel } from 'draft-ole';

// 経路 1: css.raw による生 CSS escape hatch
const resetRaw = css.raw('* { box-sizing: border-box; }');

// 経路 2: sel namespace（kept policy、構造的振る舞い不変）
const reset = sel.all({ boxSizing: 'border-box' });
const headings = sel.tag('h1', { fontSize: '2rem', fontWeight: '700' });
const focus = sel.rule('.btn:focus', { outline: '2px solid blue' });
const tokens = sel.root({ '--bg': '#000', '--fg': '#fff' });

export { resetRaw, reset, headings, focus, tokens };
