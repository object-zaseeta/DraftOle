/**
 * 1.0.0 移行 example: `createTheme` → `css.theme`
 *
 * Before (0.x.y、`'draft-ole'` から直接 import 可能だった):
 * ```typescript
 * import { createTheme } from 'draft-ole';
 * const theme = createTheme({ bg: '#0b1220', accent: '#7c5cff' });
 * theme.bg     // → 'var(--bg)'
 * theme.css    // → ':root { --bg: ...; --accent: ...; }'
 * ```
 *
 * After (1.0.0): `css.theme` 経由（薄いエイリアス、入出力は等価）
 */

import { css } from 'draft-ole';

const theme = css.theme({ bg: '#0b1220', accent: '#7c5cff' });

// theme.bg / theme.accent は `var(--bg)` / `var(--accent)` を返す（同じ振る舞い）
// theme.css は `:root { ... }` ブロックを返す（同じ振る舞い）

export { theme };
