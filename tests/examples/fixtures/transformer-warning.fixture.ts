/**
 * transformer-warning.fixture.ts
 *
 * Task 4.3: Suggestion/Warning カテゴリの transformer 診断を発火させる fixture。
 *
 * 違反内容: 空ボディのアロー関数ハンドラ `() => {}`
 *   → handler-ir-extractor が DT002 (Warning カテゴリ) を発行する。
 *
 * 想定挙動:
 *   - exit code 0（Warning のみ、Error はなし — Req 2.2）
 *   - stderr に `[draftole-transformer Warning]` プレフィックスを含む（Req 1.1, 4.3）
 *
 * Requirements: 1.1, 2.2, 4.3
 *
 * Note: examples-fixtures-reorganization-and-e2e-completion spec で 1.0.0 公開 API
 * (app/el) のみを使用する形に書き換え。旧 dist/index.js 経由の Root/button/FileExporter
 * named import は 1.0.0 で公開面から除去済み。
 */

import { app, el } from 'draft-ole';

const doc = app({ title: 'transformer-warning fixture', lang: 'ja' });

const btn = el
  .button({ type: 'button' }, 'click me')
  // 空ボディハンドラ: DT002 (Warning カテゴリ) を発火させる
  .on('click', () => {});

doc.exportTo(btn, './.out/runs/transformer_warning_fixture');
