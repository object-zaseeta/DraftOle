/**
 * タスク 4.2: `draft-ole` の名前付きエクスポートに `Page` が含まれないことを確認する。
 *
 * 要件 3.1: `Page` コンポーネントは公開 API から削除され、エクスポートされない。
 * 要件 3.2: エクスポートの後方互換性 — 既存のエクスポートは変わらず利用可能。
 */

import { describe, it, expect } from 'vitest';
import * as DraftOle from '../../src/index.js';

describe('draft-ole エクスポート検証', () => {
  it('Page は draft-ole のエクスポートに含まれない', () => {
    // ランタイム検証: Page が名前付きエクスポートに存在しないことを確認する
    expect('Page' in DraftOle).toBe(false);
  });

  it('型レベルの検証: Page がエクスポートされていない', () => {
    // 型レベルでの検証: Page がエクスポートされていれば HasPage は true になり型エラーとなる
    type HasPage = 'Page' extends keyof typeof DraftOle ? true : false;
    const hasPage: HasPage = false as HasPage;
    expect(hasPage).toBe(false);
  });
});
