/**
 * 1.0.0 移行 example: `createStyle` → `css.class`
 *
 * Before (0.x.y):
 * ```typescript
 * import { createStyle } from 'draft-ole';
 * const card = createStyle('card', { padding: '20px', background: '#fff' });
 * ```
 *
 * After (1.0.0): `css.class` 経由（薄いエイリアス、入出力は等価）
 */

import { css } from 'draft-ole';

// 名前あり形（明示クラス名）
const card = css.class('card', { padding: '20px', background: '#fff' });

// 名前無し形（colocated-style パイプラインがクラス名を自動導出）
const buttonStyle = css.class({ padding: '12px 24px', borderRadius: '6px' });

export { card, buttonStyle };
