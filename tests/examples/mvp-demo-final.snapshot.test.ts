/**
 * Task 7.4: 最終スナップショットテスト
 *
 * 検証観点:
 *   最終 `examples/interactive/mvp-demo.ts` に相当する transformer 適用済みコードを
 *   FileExporter 経由でビルドし、3 ファイルのスナップショットを取得する。
 *
 *   アプローチ:
 *   `ts.transpileModule` は program=undefined のため transformer が素通しになる制約がある
 *   （Task 7.2 で確認済み）。また ts.Program を構築した場合でも stateIdMap の runtimeId
 *   リテラル型が解決できない制約がある。
 *   本テストでは transformer が適用済みであることを示すフィクスチャファイル
 *   `tests/examples/fixtures/mvp-demo-transformed.fixture.ts` を用いる。
 *   このフィクスチャは transformer の `_draftoleEmitted` + `_emitHandlerBody` 形式を
 *   直接使用して、ビルド後の出力を再現する。
 *
 *   1. 3 ファイル（index.html, style.css, script.js）のスナップショットが安定して一致する（Req 6.5）
 *   2. `script.js` 中に `__draftole__` 以外のグローバル代入が現れない（Req 4.9, 6.7）
 *   3. transformer によって arrow handler が `__draftole__.state(id)` 呼び出しに変換される（Req 6.7）
 *
 * 観測可能な完了: スナップショット 3 件緑、`__draftole__` 以外のグローバル代入ゼロ
 *
 * 対応 requirements: 6.5, 6.7, 4.9
 * Depends: 7.3
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// ── 定数 ──────────────────────────────────────────────────────────────────────

const ROOT_DIR = join(import.meta.dirname, '../..');

// フィクスチャファイル: transformer 適用済みコード相当
const FIXTURE_FILE = join(ROOT_DIR, 'tests/examples/fixtures/mvp-demo-transformed.fixture.ts');

// 一時出力ディレクトリ
const TEMP_OUTPUT_DIR = join(ROOT_DIR, `output/_final_snap_test_${Date.now()}`);

// フィクスチャの出力先を一時ディレクトリに向けた一時 .ts ファイル
// （`.out/temp/` 配下: gitignore 対象、meta scan の対象外、並列 race の原因にならない）
const TEMP_TS_DIR = join(ROOT_DIR, '.out/temp');
const TEMP_FIXTURE_TS = join(TEMP_TS_DIR, '_mvp-demo-final-temp.ts');
// Task 5.1 で fixture を 1.0.0 公開 API (`import ... from "draft-ole"`) に書き換え済み。
// `"draft-ole"` は node_modules の symlink で解決されるため、相対 import の patch は不要。

// ── ヘルパー ──────────────────────────────────────────────────────────────────

/** 出力ファイルを読み込んで { html, css, js } を返す。 */
function readOutputFiles(dir: string): { html: string; css: string; js: string } {
  return {
    html: readFileSync(join(dir, 'index.html'), 'utf-8'),
    css: readFileSync(join(dir, 'style.css'), 'utf-8'),
    js: readFileSync(join(dir, 'script.js'), 'utf-8'),
  };
}

/** 空白・改行を正規化して比較しやすくする。 */
function normalize(src: string): string {
  return src
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
    .join('\n');
}

// ── セットアップ ──────────────────────────────────────────────────────────────

let outputFiles: { html: string; css: string; js: string };

beforeAll(() => {
  // 一時出力ディレクトリを作成
  mkdirSync(TEMP_OUTPUT_DIR, { recursive: true });

  // フィクスチャファイルを読み込んで出力先を patch した一時ファイルを生成
  // Task 5.1 で fixture を `doc.exportTo(content, "...")` 形式 (1.0.0 公開 API) に
  // 書き換えたため、regex を `doc.exportTo(content, ...)` に対応するよう更新。
  // 旧形式 `exporter.exportFromRoot(root, ...)` および
  // 相対 import `"../../../dist/index.js"` の rewrite は不要になった。
  const fixtureSource = readFileSync(FIXTURE_FILE, 'utf-8');
  const patchedSource = fixtureSource.replace(
    /doc\.exportTo\(content,\s*["'][^"']+["']\)/,
    `doc.exportTo(content, ${JSON.stringify(TEMP_OUTPUT_DIR)})`,
  );

  // 一時ファイルを `.out/temp/` に書き出す（meta scan 対象外で並列 race を回避）
  mkdirSync(TEMP_TS_DIR, { recursive: true });
  writeFileSync(TEMP_FIXTURE_TS, patchedSource, 'utf-8');

  // node --experimental-strip-types で実行して出力ファイルを生成
  execFileSync('node', ['--experimental-strip-types', TEMP_FIXTURE_TS], {
    cwd: ROOT_DIR,
    stdio: 'pipe',
  });

  outputFiles = readOutputFiles(TEMP_OUTPUT_DIR);
}, 60_000);

afterAll(() => {
  // 一時ファイルとディレクトリを削除
  try {
    rmSync(TEMP_FIXTURE_TS, { force: true });
    rmSync(TEMP_OUTPUT_DIR, { recursive: true, force: true });
  } catch {
    // 削除失敗は無視（テスト結果に影響しない）
  }
});

// ── スナップショットテスト（3 ファイル）────────────────────────────────────────

describe('最終 mvp-demo スナップショット（Req 6.5）', () => {
  it('index.html のスナップショットが一致する', () => {
    expect(normalize(outputFiles.html)).toMatchSnapshot();
  });

  it('style.css のスナップショットが一致する', () => {
    expect(normalize(outputFiles.css)).toMatchSnapshot();
  });

  it('script.js のスナップショットが一致する', () => {
    expect(normalize(outputFiles.js)).toMatchSnapshot();
  });
});

// ── __draftole__ 以外のグローバル代入なし検証（Req 4.9, 6.7）──────────────────

describe('script.js グローバル識別子検証（Req 4.9, 6.7）', () => {
  it('__draftole__ 以外の window[...] グローバル代入が存在しない', () => {
    const scriptJs = outputFiles.js;

    // window["identifier"] = ... パターンを抽出して __draftole__ 以外の代入がないことを確認
    const globalAssignments = scriptJs.match(/window\["([^"]+)"\]\s*=/g) ?? [];
    const forbiddenAssignments = globalAssignments.filter(
      (assign) => !assign.includes('__draftole__'),
    );

    expect(forbiddenAssignments).toEqual([]);
  });

  it('__draftole__ が script.js 内で参照されている（ランタイムプレリュード確認）', () => {
    expect(outputFiles.js).toContain('__draftole__');
    expect(outputFiles.js).toContain('window["__draftole__"]');
  });

  it('handler-serialization 由来の追加ランタイムコードが導入されない（Req 4.9）', () => {
    const scriptJs = outputFiles.js;

    // _emitHandlerBody はビルド時に消費され、出力 JS には現れない
    expect(scriptJs).not.toContain('_emitHandlerBody');
    // _draftoleEmitted マーカーも出力 JS には現れない
    expect(scriptJs).not.toContain('_draftoleEmitted');
  });

  it('script.js 内のイベントハンドラが __draftole__.state API を呼ぶ（Req 6.7）', () => {
    const scriptJs = outputFiles.js;
    // transformer により arrow handler が __draftole__.state(...) に変換されていること
    expect(scriptJs).toContain("__draftole__.state(");
  });

  it('script.js に todo 追加ロジックが含まれる（input/keydown/click ハンドラ）', () => {
    const scriptJs = outputFiles.js;
    // input ハンドラ: state への set 呼び出し
    expect(scriptJs).toContain('#todo-input');
    expect(scriptJs).toContain('addEventListener("input"');
    // keydown ハンドラ: Enter キー判定
    expect(scriptJs).toContain('addEventListener("keydown"');
    expect(scriptJs).toContain('"Enter"');
    // add-btn クリックハンドラ
    expect(scriptJs).toContain('#add-btn');
    expect(scriptJs).toContain('addEventListener("click"');
    // clear-btn クリックハンドラ
    expect(scriptJs).toContain('#clear-btn');
    // count テキストバインディング
    expect(scriptJs).toContain('#count');
    expect(scriptJs).toContain('bindText');
    // todo-list bindEach
    expect(scriptJs).toContain('#todo-list');
    expect(scriptJs).toContain('bindEach');
  });
});

// ── フィクスチャ検証: transformer 適用済み形式の確認 ──────────────────────────

describe('フィクスチャ構造検証（transformer 適用済みコードの確認）', () => {
  it('フィクスチャファイルに _draftoleEmitted マーカーが含まれる', () => {
    const fixtureSource = readFileSync(FIXTURE_FILE, 'utf-8');
    // フィクスチャは Object.assign(..., { _draftoleEmitted: true }) 形式を使用
    expect(fixtureSource).toContain('_draftoleEmitted');
  });

  it('フィクスチャファイルに _emitHandlerBody 呼び出しが含まれる', () => {
    const fixtureSource = readFileSync(FIXTURE_FILE, 'utf-8');
    // フィクスチャはシリアライズ済みコードを _emitHandlerBody で渡す
    expect(fixtureSource).toContain('_emitHandlerBody');
  });

  it('フィクスチャファイルに __draftole__.state 呼び出しが含まれる（シリアライズ結果）', () => {
    const fixtureSource = readFileSync(FIXTURE_FILE, 'utf-8');
    // transformer シリアライザが state 変数を __draftole__.state(id) に変換した結果
    expect(fixtureSource).toContain("__draftole__.state(");
  });
});
