/**
 * Task 1.1: build-examples.ts の基本フロー検証テスト
 *
 * 検証観点:
 *   1. `scripts/build-examples.ts examples/interactive/shopping-cart.ts` がエラーなく完了する
 *   2. `.out/examples/shopping-cart.js` が生成される
 *
 * 実行コマンド: `node --experimental-strip-types` を使用してスクリプトを起動。
 * tsx は devDependency として導入済みで本番ユースケース（pnpm demo:*）に使用するが、
 * テスト環境では node の built-in type stripping で代替する（tsx の IPC named pipe が
 * CI/sandbox 環境で使用不可の場合があるため）。
 *
 * Requirements: 1.1, 1.4
 * Design: ExampleBuildScript component
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const ROOT_DIR = join(import.meta.dirname, '../..');
const SCRIPT = join(ROOT_DIR, 'scripts/build-examples.ts');
const INPUT_FILE = join(ROOT_DIR, 'examples/interactive/shopping-cart.ts');
const OUTPUT_JS = join(ROOT_DIR, '.out/examples/shopping-cart.js');

describe('Task 1.1 build-examples.ts 基本フロー', () => {
  beforeAll(() => {
    // 出力ファイルが残っている場合は削除してクリーンな状態にする
    if (existsSync(OUTPUT_JS)) {
      rmSync(OUTPUT_JS);
    }
  });

  it('shopping-cart.ts をコンパイルして .out/examples/shopping-cart.js を生成する', () => {
    // build-examples.ts を node --experimental-strip-types で実行（--run フラグなし）
    execFileSync('node', ['--experimental-strip-types', SCRIPT, INPUT_FILE], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      timeout: 60_000,
    });

    // .out/examples/shopping-cart.js が生成されていることを確認
    expect(existsSync(OUTPUT_JS)).toBe(true);
  });

  it('生成された shopping-cart.js は CommonJS モジュールである', () => {
    // ファイルが存在する場合のみチェック
    if (!existsSync(OUTPUT_JS)) {
      // ファイルが存在しない場合はスキップ（前のテストが失敗している）
      return;
    }
    const content = readFileSync(OUTPUT_JS, 'utf-8');
    // CJS ビルドなので require や Object.defineProperty が含まれる
    expect(content).toMatch(/require|Object\.defineProperty/);
  });
});
