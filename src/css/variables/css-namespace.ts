/**
 * `sel` ネームスペース — グローバル CSS DSL の集約。
 *
 * 個別関数（`sel.all` / `sel.tag<TagName>` / `sel.rule`）には `@deprecated` JSDoc を
 * 元定義側で付与しているため、利用箇所では IDE でヒントが表示される。
 * `sel.media` / `sel.keyframes` は at-rule のため `@deprecated` を付けない。
 */
import { all, keyframes, media, root, rule, tag } from './global-dsl.js';
import * as tagShortcuts from './tag-dsl.generated.js';

export const sel = {
  root,
  all,
  tag,
  rule,
  media,
  keyframes,
  ...tagShortcuts,
} as const;
