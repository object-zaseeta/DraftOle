/**
 * build-examples.ts
 *
 * Task 1.2: エラー処理・`--run` フラグ・`dist/transformer` 未ビルド検出を実装する
 *
 * Usage: tsx scripts/build-examples.ts <file.ts> [<file2.ts> ...] [--run]
 * Exit:  0 = success | 1 = compile/transformer error
 *
 * - process.argv からコンパイル対象 .ts ファイルパスを受け取る
 * - ts.createProgram を outDir: dist/examples, module: CommonJS,
 *   strict: true, moduleResolution: Node10, target: ES2022 で生成
 * - program.emit() の customTransformers.before に draftoleTransformer(program) を注入
 * - dist/examples/ ディレクトリが存在しない場合は fs.mkdirSync で自動生成
 * - emitResult.diagnostics にエラーがあれば stderr に出力して process.exit(1)
 * - dist/transformer/index.js が未ビルドの場合は案内メッセージを出力して process.exit(1)
 * - --run フラグがある場合、emit 後に node dist/examples/<basename>.js を execFileSync で実行
 *
 * 診断の 2 チャネルルーティング (TXDX-1 完全実装):
 * - draftoleTransformer 由来の診断は `onDiagnostics` コールバック経由でのみ流れ、
 *   TS の DiagnosticCollection には積まれない。本スクリプトが集約配列
 *   `transformerDiagnostics` で蓄積し、emit 完了後に
 *   `formatAndWriteTransformerDiagnostics` で stderr に出力する。
 * - TS pre-emit / emit 由来の診断は `ts.getPreEmitDiagnostics + emitResult.diagnostics`
 *   から取得し、`ts.formatDiagnosticsWithColorAndContext` で整形して stderr に出力する。
 * - exit code は両チャネルの Error 件数を OR で合成して決定する（いずれかに
 *   Error が 1 件でもあれば exit 1）。出力責務と終了判定責務は両方とも
 *   このスクリプトに集約する。
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * Design: ExampleBuildScript component
 * Spec: .kiro/specs/build-examples-ondiagnostics/ (TXDX-1 完全実装)
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import * as ts from 'typescript';

// ---- ルートディレクトリ解決 -------------------------------------------------
const ROOT_DIR = path.resolve(import.meta.dirname, '..');
// .out/examples/ is a sibling of dist/ so `require('../dist/index.js')` resolves correctly
const OUT_DIR = path.join(ROOT_DIR, '.out/examples');

// ---- draftoleTransformer の CJS ロード --------------------------------------
// tsx は ESM/CJS 混在対応のため createRequire を使用する
const require = createRequire(import.meta.url);

let draftoleTransformer: (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>;

try {
  const mod = require('../dist/transformer/index.js') as {
    default: (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>;
  };
  draftoleTransformer = mod.default;
} catch (err: unknown) {
  const isModuleNotFound =
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: unknown }).code === 'MODULE_NOT_FOUND';

  if (isModuleNotFound) {
    process.stderr.write("Run 'pnpm build:transformer' first\n");
  } else {
    process.stderr.write(`[build-examples] Failed to load transformer: ${String(err)}\n`);
  }
  process.exit(1);
}

// ---- コンパイル対象ファイルを process.argv から取得 --------------------------
// argv[0] = node, argv[1] = tsx/script path, argv[2]... = target files
const hasRunFlag = process.argv.includes('--run');
const inputFiles = process.argv.slice(2).filter((a) => !a.startsWith('--'));

if (inputFiles.length === 0) {
  process.stderr.write('Usage: tsx scripts/build-examples.ts <file.ts> [...]\n');
  process.exit(1);
}

// 絶対パスに正規化
const resolvedFiles = inputFiles.map((f) =>
  path.isAbsolute(f) ? f : path.resolve(process.cwd(), f),
);

// ---- dist/examples/ ディレクトリを確保 --------------------------------------
// CommonJS 出力をパッケージの "type": "module" から保護するため
// dist/examples/package.json に { "type": "commonjs" } を設置する
fs.mkdirSync(OUT_DIR, { recursive: true });
const outDirPkgJson = path.join(OUT_DIR, 'package.json');
if (!fs.existsSync(outDirPkgJson)) {
  fs.writeFileSync(outDirPkgJson, '{"type":"commonjs"}\n', 'utf-8');
}

// ---- ts.createProgram でコンパイラオプションを設定 ---------------------------
const compilerOptions: ts.CompilerOptions = {
  outDir: OUT_DIR,
  module: ts.ModuleKind.CommonJS,
  strict: true,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  target: ts.ScriptTarget.ES2022,
  esModuleInterop: true,
  skipLibCheck: true,
};

const program = ts.createProgram(resolvedFiles, compilerOptions);

// ---- transformer 由来の diagnostics を集約する配列 ---------------------------
const transformerDiagnostics: ts.Diagnostic[] = [];

// ---- program.emit() に draftoleTransformer を注入 ---------------------------
const emitResult = program.emit(
  undefined, // targetSourceFile: すべてのファイルを emit
  undefined, // writeFile: デフォルト（ファイルシステムに書き出し）
  undefined, // cancellationToken
  false,     // emitOnlyDtsFiles
  {
    before: [draftoleTransformer(program, {
      debug: process.env.DRAFTOLE_DEBUG === '1',
      onDiagnostics: (diags) => {
        if (diags.length > 0) transformerDiagnostics.push(...diags);
      },
    })],
  },
);

// ---- transformer diagnostics フォーマッタ -----------------------------------
// onDiagnostics で集約された draftoleTransformer 由来の diagnostics を
// 1 件 1 行のフラット形式で stderr に書き出す。
// 形式:
//   file + start 有り: `[draftole-transformer <Category>] <fileName>:<line>:<col> <message>\n`
//   それ以外         : `[draftole-transformer <Category>] <message>\n`
// 行・列は 1-origin、message は DiagnosticMessageChain の場合 top-level のみ採用。
//
// NOTE: 同等のロジックを `src/transformer/format-diagnostics.ts` に shared module として
// 抽出済み。本 script は `node --experimental-strip-types` 経由で実行されるため
// `src/` からの直接 import が解決できず、ここではインライン実装を保持する
// （ロジック齟齬を防ぐため shared module 側を single source of truth とする運用）。
function formatAndWriteTransformerDiagnostics(
  diags: readonly ts.Diagnostic[],
  stderr: NodeJS.WritableStream,
): void {
  if (diags.length === 0) return;
  for (const d of diags) {
    const category = ts.DiagnosticCategory[d.category];
    const message =
      typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
    if (d.file !== undefined && d.start !== undefined) {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      stderr.write(
        `[draftole-transformer ${category}] ${d.file.fileName}:${line + 1}:${character + 1} ${message}\n`,
      );
    } else {
      stderr.write(`[draftole-transformer ${category}] ${message}\n`);
    }
  }
}

// ---- diagnostics エラー処理 ---------------------------------------------------
// 2チャネル diagnostics ルーティング:
//   (a) TS の pre-emit + emit diagnostics は ts.formatDiagnosticsWithColorAndContext で整形
//   (b) draftoleTransformer 由来の diagnostics は onDiagnostics で集約し
//       formatAndWriteTransformerDiagnostics で 1 行/件のフラット形式で整形
// 両チャネルとも stderr に書き出す唯一のシンクはこのファイル。emit 後に
// 両者をフォーマットしてから exit 判定を行うことで、終了前に完全な
// stderr 出力が確定する。
const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

if (allDiagnostics.length > 0) {
  const host = ts.createCompilerHost(compilerOptions);
  const message = ts.formatDiagnosticsWithColorAndContext(allDiagnostics, host);
  process.stderr.write(`${message}\n`);
}

// transformer 由来の diagnostics を 1 件 1 行で stderr に出力
formatAndWriteTransformerDiagnostics(transformerDiagnostics, process.stderr);

// 終了判定: TS チャネル/transformer チャネルのいずれかに Error があれば exit(1)
const hasErrors = allDiagnostics.some(
  (d) => d.category === ts.DiagnosticCategory.Error,
);
const hasTransformerError = transformerDiagnostics.some(
  (d) => d.category === ts.DiagnosticCategory.Error,
);
if (hasErrors || hasTransformerError) {
  process.exit(1);
}

if (emitResult.emitSkipped) {
  process.stderr.write('[build-examples] emit was skipped due to errors\n');
  process.exit(1);
}

// ---- --run フラグ: emit 後に node で実行 -------------------------------------
if (hasRunFlag) {
  for (const resolvedFile of resolvedFiles) {
    const basename = path.basename(resolvedFile, '.ts');
    const outputJs = path.join(OUT_DIR, `${basename}.js`);
    execFileSync('node', [outputJs], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
  }
}
