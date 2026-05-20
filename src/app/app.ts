import type { GlobalCss } from '../css/variables/global-css.js';
import { Root } from '../html/elements/root.js';
import type { State } from '../js/vanilla/state/state.js';
import { AppDocument } from './app-document.js';
import type { AppOptions } from './app-options.js';
import { buildDocumentSkeleton } from './build-document-skeleton.js';

/**
 * App state 操作の入口インターフェース。
 *
 * @internal 公開 API ではない（1.0.0 で公開面から除去済み）。利用者は `AppDocument`（`app()` の戻り値型）を使うこと。
 * 本インターフェースは `AppDocument implements AppContext` の構造的契約として内部実装で継続使用される。
 * 詳細は [docs/deprecation-policy.md](../../docs/deprecation-policy.md) 参照。
 */
export interface AppContext {
  /**
   * 初期値 `initialValue` を持つ State<T> を生成する。
   */
  state<T>(initialValue: T): State<T>;
}

/**
 * インタラクティブアプリのファサードを生成するファクトリ関数。
 *
 * 内部で `Root` を生成し、`html/head/body` の DOM スケルトンを組み立てて
 * `AppDocument` を返す。ユーザーは `Root` / `FileExporter` / `el.html` 等を
 * import する必要がなくなる。
 *
 * デフォルト値:
 * - `charset`: `"UTF-8"`
 * - `lang`: `"en"`
 * - `wrapDOMReady`: `false`
 *
 * `AppDocument` は `AppContext` の構造的サブタイプのため、
 * 既存の `const ctx: AppContext = app(); ctx.state(0)` は変更不要。
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 4.3
 * Boundary: src/app/app.ts
 */
export function app(): AppDocument;
export function app(options: AppOptions): AppDocument;
export function app(options?: AppOptions): AppDocument {
  const resolvedOptions: AppOptions = {
    charset: 'UTF-8',
    lang: 'en',
    ...options,
  };

  const { css } = resolvedOptions;
  const cssArray: readonly GlobalCss[] = css === undefined ? []
    : Array.isArray(css) ? css
    : [css];

  const root = new Root({ css: cssArray, cssConfig: resolvedOptions.cssConfig });
  const { bodyEl } = buildDocumentSkeleton(root, resolvedOptions);
  return new AppDocument(root, bodyEl, resolvedOptions);
}
