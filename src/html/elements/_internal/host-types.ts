/**
 * helper module が依存する HtmlTag の最小公開面。
 *
 * `_internal/` 配下の helper（frame-options / breakpoint-applier /
 * proto-render-pipeline 等）は、`HtmlTag` 本体を値として import すると
 * 循環参照を生むため、本ファイルで型エイリアスのみを再 export する。
 *
 * 第一弾は `HtmlTag` への type alias で固定する（design.md Open Questions Q1）。
 * 後続で structural subtype interface 化が必要になった時点で再検討する。
 *
 * Requirements: 1.1, 1.2, 4.2, 5.1
 *
 * @internal
 */
import type { HtmlTag } from '../html-tag.js';

/**
 * helper module が受け取る host 契約。
 *
 * 実体は `HtmlTag` クラスだが、`_internal/*` からは型としてのみ参照することで
 * `html-tag.ts` への値 import を発生させず、循環参照を回避する。
 *
 * @internal
 */
export type HtmlTagHost = HtmlTag;
