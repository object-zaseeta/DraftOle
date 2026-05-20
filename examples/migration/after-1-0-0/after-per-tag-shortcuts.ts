/**
 * 1.0.0 移行 example: per-tag shortcuts (`tagDiv` / `tagA` 等 112 個) → `css.class` + View プリミティブ or `sel.tag*`
 *
 * Before (0.x.y):
 * ```typescript
 * import { tagDiv, tagA, tagSection } from 'draft-ole';
 * const divStyle = tagDiv({ padding: '16px' });
 * const linkStyle = tagA({ color: '#0066cc', textDecoration: 'none' });
 * ```
 *
 * After (1.0.0): 2 経路
 * 1. 主導線（推奨）: `css.class` + View プリミティブの `css` プロパティで要素単位に合成
 * 2. レガシー互換: `sel.tagDiv` / `sel.tagA` 等で同等 API（kept policy、namespace アクセス）
 */

import { css, sel } from 'draft-ole';

// 経路 1: 主導線（推奨）— `css.class` で要素にスコープしたクラスを定義
const linkStyle = css.class({
  color: '#0066cc',
  textDecoration: 'none',
});

// 経路 2: sel namespace（kept policy、構造的振る舞い不変）
const divBlock = sel.tagDiv({ padding: '16px' });
const linkBlock = sel.tagA({ color: '#0066cc', textDecoration: 'none' });
const sectionBlock = sel.tagSection({ marginBlock: '24px' });

export { linkStyle, divBlock, linkBlock, sectionBlock };
