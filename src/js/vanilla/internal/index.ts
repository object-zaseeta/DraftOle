/**
 * `src/js/vanilla/internal` の内部専用バレル。
 *
 * 本バレルはテストおよび `src/js/vanilla` 内部コードが 5 つの低レベル API モジュール
 * （`event-api` / `query-api` / `dom-api` / `tree-api` / `integration`）のシンボルを
 * 単一の import パスで取得できるようにするためのものである。`internal` 配下は
 * パッケージ外部（`draft-ole` 公開 API）には露出しない点に注意。
 *
 * 対応: 設計書 `design.md` の「File Structure Plan」および
 * `src/js/vanilla/internal/index.ts` の新規作成方針。
 *
 * 追加規約: このバレルは `export *` による純粋な再 export のみを含み、ロジックを
 * 持たない。新規シンボルを 5 モジュールに追加した場合、追加の記述なしに自動的に
 * 本バレル経由で参照可能となる。
 */

export * from './event-api.js';
export * from './query-api.js';
export * from './dom-api.js';
export * from './tree-api.js';
export * from './integration.js';
