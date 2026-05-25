/**
 * build-transformer.ts
 *
 * DraftOle transformer (Babel plugin) のビルドパイプライン（Req 5.1）
 *
 * パイプライン:
 *   src/transformer/
 *     → tsc -p src/transformer/tsconfig.json  (ES2019, module: CommonJS)
 *     → dist/transformer/index.js (CJS)
 *
 * 実行方法:
 *   node --experimental-strip-types scripts/build-transformer.ts
 *   pnpm build:transformer
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// パス設定
// ---------------------------------------------------------------------------

const PROJECT_ROOT = new URL("..", import.meta.url).pathname;

const TRANSFORMER_TSCONFIG = path.join(
  PROJECT_ROOT,
  "src/transformer/tsconfig.json"
);
const DIST_TRANSFORMER_DIR = path.join(PROJECT_ROOT, "dist/transformer");
const DIST_TRANSFORMER_INDEX = path.join(DIST_TRANSFORMER_DIR, "index.js");

// ---------------------------------------------------------------------------
// Step 1: dist/transformer ディレクトリを準備
// ---------------------------------------------------------------------------

console.log("[build-transformer] Step 1: preparing dist/transformer");
fs.mkdirSync(DIST_TRANSFORMER_DIR, { recursive: true });

// root package.json は "type": "module" のため、dist/transformer/ 内に
// "type": "commonjs" を持つ package.json を置いて CJS として扱わせる
const PKG_JSON_PATH = path.join(DIST_TRANSFORMER_DIR, "package.json");
fs.writeFileSync(
  PKG_JSON_PATH,
  `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
  "utf-8"
);
console.log("[build-transformer] wrote dist/transformer/package.json (type: commonjs)");

// ---------------------------------------------------------------------------
// Step 2: tsc でコンパイル（CommonJS）
// ---------------------------------------------------------------------------

console.log(
  "[build-transformer] Step 2: tsc -p src/transformer/tsconfig.json"
);

execFileSync(
  "node",
  [
    path.join(PROJECT_ROOT, "node_modules/typescript/bin/tsc"),
    "-p",
    TRANSFORMER_TSCONFIG,
  ],
  {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  }
);

if (!fs.existsSync(DIST_TRANSFORMER_INDEX)) {
  throw new Error(
    `[build-transformer] tsc output not found: ${DIST_TRANSFORMER_INDEX}`
  );
}

console.log("[build-transformer] tsc complete:", DIST_TRANSFORMER_INDEX);
console.log("[build-transformer] Done: dist/transformer/index.js");
