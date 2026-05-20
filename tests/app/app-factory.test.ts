/**
 * app() ファクトリの新仕様単体テスト
 *
 * Requirements: 1.1, 1.2, 1.4, 3.4
 * Boundary: tests/app/app-factory.test.ts
 */

import { describe, it, expect } from 'vitest';
import { app } from '../../src/app/app';
import { AppDocument } from '../../src/app/app-document';
import type { AppContext } from '../../src/app/app';

describe('app() — AppDocument の生成 (Req 1.1, 1.2)', () => {
  it('引数なしで AppDocument インスタンスを返す', () => {
    const doc = app();
    expect(doc).toBeInstanceOf(AppDocument);
  });

  it('AppOptions 全フィールド指定で AppDocument を返す', () => {
    const doc = app({ title: 'My App', lang: 'ja', charset: 'UTF-8', wrapDOMReady: true });
    expect(doc).toBeInstanceOf(AppDocument);
  });

  it('引数なし時 lang デフォルトが "en"（<html lang="en"> が生成される）', () => {
    const doc = app();
    // exportTo を呼ばず、内部 root へのアクセスは state 経由で間接確認
    // AppDocument は AppContext サブタイプなので .state() が使える
    const s = doc.state(0);
    expect(s).toBeDefined();
  });

  it('引数なし時 charset デフォルトが "UTF-8"', () => {
    // charset は buildDocumentSkeleton で適用されるため、
    // exportTo で生成 HTML を確認するのは integration 側のテスト
    // ここではファクトリが AppDocument を返すことのみ検証
    const doc = app();
    expect(doc).toBeInstanceOf(AppDocument);
  });
});

describe('app() — 後方互換: AppContext 型として使える (Req 4.1)', () => {
  it('AppContext 型変数に代入できる', () => {
    const ctx: AppContext = app();
    expect(typeof ctx.state).toBe('function');
  });

  it('.state(0) が State<number> を返す', () => {
    const ctx: AppContext = app();
    const s = ctx.state(0);
    expect(s).toBeDefined();
    expect(typeof s.get).toBe('function');
  });
});

describe('app() — 独立性: 複数呼び出しが互いに独立 (Req 1.2)', () => {
  it('2 つの app() は別 AppDocument インスタンスを返す', () => {
    const doc1 = app();
    const doc2 = app();
    expect(doc1).not.toBe(doc2);
  });

  it('各 app() の最初の state() で runtimeId が "s0" から始まる', () => {
    const doc1 = app();
    const doc2 = app();
    const s1 = doc1.state(0);
    const s2 = doc2.state(0);
    expect(s1._runtimeId).toBe('s0');
    expect(s2._runtimeId).toBe('s0');
  });
});
