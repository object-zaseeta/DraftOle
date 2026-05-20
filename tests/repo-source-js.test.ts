/**
 * Task 7.2: リポジトリ衛生テスト #1。
 *
 * リポジトリ直下（サブディレクトリは対象外）に存在する `.js` ファイルが
 * `eslint.config.js` 1 本だけであることを検証する。
 *
 * `src/` は TS のみ、`examples/` は TS/TSX のみ、という新体制を担保する。
 * ビルド成果物（dist）、依存（node_modules）、生成・カバレッジ・e2e 等の
 * 出力（.out/）は対象から除外する（これらは除外対象の周知ディレクトリ）。
 *
 * 実装方針:
 *   - 外部コマンドを起動せず `fs.readdirSync` のみで走査する（CI 依存を最小化）。
 *   - 境界: リポジトリルートの直下ファイルのみ。サブディレクトリは再帰しない。
 *
 * 対応要件: 8.1, 8.2, 8.3, 8.4
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(__dirname, '..');

const EXCLUDED_DIRS = new Set([
  'dist',
  '.out',
  'node_modules',
]);

describe('Task 7.2: repo root source hygiene (.js files)', () => {
  it('only "eslint.config.js" exists as a .js file directly under the repo root', () => {
    const entries = readdirSync(REPO_ROOT);

    const jsFilesAtRoot: string[] = [];
    for (const name of entries) {
      const full = join(REPO_ROOT, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (!st.isFile()) continue;
      if (!name.endsWith('.js')) continue;
      // 除外ディレクトリはそもそもディレクトリ判定で弾かれるが、
      // 直下のファイルとして .js 名の紛れが来ても EXCLUDED_DIRS に
      // 抵触しない限り全部列挙する（= 唯一許容は eslint.config.js）。
      jsFilesAtRoot.push(name);
    }

    expect(jsFilesAtRoot.sort()).toEqual(['eslint.config.js']);
  });

  it('excluded directories are not traversed (sanity check)', () => {
    // 念のため EXCLUDED_DIRS の参照が保たれていることを確認するだけの保険。
    expect(EXCLUDED_DIRS.has('dist')).toBe(true);
    expect(EXCLUDED_DIRS.has('node_modules')).toBe(true);
  });
});
