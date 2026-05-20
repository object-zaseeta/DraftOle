"use strict";
/**
 * run-flag.fixture.ts
 *
 * Task 1.2: `--run` フラグ検証用の最小フィクスチャ。
 *
 * build-examples.ts に --run フラグ付きで渡すと、コンパイル後に
 * `node dist/examples/run-flag.fixture.js` が実行され、exit(0) になることを確認する。
 *
 * 外部 import を使用しないことで、dist/examples/ からの実行時に
 * モジュール解決エラーが発生しない。
 *
 * SENTINEL_PATH 環境変数が設定されている場合、そのパスにファイルを書き込む。
 * テストはこのファイルの存在により node が実際に実行されたことを検証する。
 *
 * Requirements: 1.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const greeting = 'run-ok';
console.log(greeting);
const sentinel = process.env.SENTINEL_PATH;
if (sentinel) {
    (0, node_fs_1.writeFileSync)(sentinel, 'run-ok');
}
