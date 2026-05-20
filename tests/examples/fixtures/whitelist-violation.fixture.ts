/**
 * whitelist-violation.fixture.ts
 *
 * Task 1.2: コンパイルエラーを含む fixture ファイル。
 *
 * build-examples.ts に渡すと ts.getPreEmitDiagnostics が TypeScript エラーを返し、
 * スクリプトが exit(1) することを確認するためのテスト用フィクスチャ。
 *
 * 違反内容: 存在しない識別子 `nonExistentVar` をハンドラ内から参照 → TS2304 エラー
 * これにより ファイルパス・行番号・エラー識別子が diagnostics に含まれる。
 *
 * Requirements: 1.3
 *
 * Note: examples-fixtures-reorganization-and-e2e-completion spec で 1.0.0 公開 API
 * (app/el) のみを使用する形に書き換え。旧 dist/index.js 経由の Root/button/FileExporter
 * named import は 1.0.0 で公開面から除去済み。TS2304 違反は維持。
 */

import { app, el } from 'draft-ole';

const doc = app({ title: 'whitelist-violation fixture', lang: 'ja' });

const btn = el
  .button({ type: 'button' }, 'click me')
  .on('click', () => {
    // TypeScript コンパイルエラー: nonExistentVar は未定義 (TS2304)
    // これにより getPreEmitDiagnostics がエラーを返す
    // (tests/ は tsconfig.json で typecheck から除外されているため、
    //  pnpm typecheck では検出されず、build-examples.ts 経由でのみ検出される)
    console.log(nonExistentVar);
  });

doc.exportTo(btn, './.out/runs/whitelist_violation_fixture');
