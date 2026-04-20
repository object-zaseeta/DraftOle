/**
 * Composition Root
 *
 * 具象 `CssManager` / `JQueryManager` の生成を一元管理するモジュール。
 * `html/` 配下からは抽象型（プロトコル）のみを介してアクセスされ、
 * 本モジュールのみが `src/css/manager/css-manager.ts` および
 * `src/js/jquery-manager.ts` の具象クラスを知る。
 *
 * 設計原則:
 * - 純関数のみを公開する（内部状態・副作用なし、毎呼び出しで必要最小限のインスタンスを生成）。
 * - `HtmlTagOptions` 未指定 / 部分指定 / 完全指定のいずれも許容し、
 *   戻り値の `css` / `jqm` は必ず非 null な `CssManagerInstance` /
 *   `JQueryManagerInstance` を返す。
 *
 * Requirements: 3.1, 3.2, 3.4, 4.3
 * Design: design.md §Infrastructure → `composition-root.ts`
 *
 * Note: `HtmlTagOptions` は循環参照を避けるため `import type` で参照する。
 */
import { CssManager } from './css/manager/css-manager.js';
import { JQueryManager } from './js/jquery-manager.js';
import type { CssManagerInstance } from './html/protocols/css-manager-instance-type.js';
import type { JQueryManagerInstance } from './html/protocols/jquery-manager-instance-type.js';
import type { HtmlTagOptions } from './html/elements/html-tag.js';

/**
 * `JQueryHelper` の再エクスポート。
 *
 * `html/` 配下からは `composition-root.ts` 経由でのみ `JQueryHelper` を参照する
 * (Req 1.4, 3.1-3.3)。具象モジュール `js/jquery-helper.ts` を直接 import することは
 * `no-restricted-imports` で禁止されている。
 */
export { JQueryHelper } from './js/jquery-helper.js';

/**
 * 解決済みの HtmlTag 依存。`css` / `jqm` は必ず非 null。
 *
 * Requirements: 3.1, 4.3
 */
export interface ResolvedHtmlTagDependencies {
  readonly css: CssManagerInstance;
  readonly jqm: JQueryManagerInstance;
}

/**
 * デフォルトの `CssManagerInstance` を生成する。
 *
 * 呼び出すたびに新しいインスタンスを返す（現行の「都度生成」セマンティクスを保存）。
 *
 * Requirements: 3.1, 3.4
 */
export function createDefaultCssManager(): CssManagerInstance {
  return new CssManager();
}

/**
 * デフォルトの `JQueryManagerInstance` を生成する。
 *
 * 呼び出すたびに新しいインスタンスを返す。
 *
 * Requirements: 3.1, 3.4
 */
export function createDefaultJQueryManager(): JQueryManagerInstance {
  return new JQueryManager();
}

/**
 * `HtmlTagOptions` から `CssManagerInstance` / `JQueryManagerInstance` を解決する。
 *
 * - options 未指定 / 部分指定 / 完全指定のいずれも許容。
 * - 指定された参照はそのまま返却し、未指定分のみデフォルトを生成する。
 *
 * Requirements: 3.1, 3.2, 3.4, 4.3
 */
export function resolveHtmlTagDependencies(
  options?: HtmlTagOptions,
): ResolvedHtmlTagDependencies {
  return {
    css: options?.css ?? createDefaultCssManager(),
    jqm: options?.jqm ?? createDefaultJQueryManager(),
  };
}

/**
 * 構造的チェックによる `HtmlTagOptions` 型ガード。
 *
 * `{}`（空オブジェクト）は attribute map と区別できないため HtmlTagOptions とは扱わない。
 * `'css' in value || 'jqm' in value` のいずれかのキーを持つオブジェクトのみ真となる。
 *
 * 非オブジェクト、null、undefined は常に false。
 */
export function isHtmlTagOptions(value: unknown): value is HtmlTagOptions {
  if (value === null || typeof value !== 'object') return false;
  return 'css' in value || 'jqm' in value;
}
