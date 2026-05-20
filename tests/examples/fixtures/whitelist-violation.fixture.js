"use strict";
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
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../../../dist/index.js");
const root = new index_js_1.Root();
const btn = (0, index_js_1.button)({ type: 'button' }, 'click me')
    .on('click', () => {
    // TypeScript コンパイルエラー: nonExistentVar は未定義 (TS2304)
    // これにより getPreEmitDiagnostics がエラーを返す
    // eslint-disable-next-line no-undef
    console.log(nonExistentVar);
});
root.addChild(btn);
const exporter = new index_js_1.FileExporter();
exporter.exportFromRoot(root, './output/violation_fixture');
