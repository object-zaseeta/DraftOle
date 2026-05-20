/**
 * タスク 2.3: ルートエクスポート統合テスト
 *
 * src/index.ts から View DSL に関連するすべてのシンボルが
 * 直接 import 可能であること、および内部モジュールを介さずに
 * ページレンダリングが動作することを確認する。
 *
 * 対象要件: 1.3, 4.1, 4.2
 */

import { describe, it, expect } from 'vitest';
import {
  VStack,
  HStack,
  ViewText,
  Image,
  Section,
  Spacer,
  page,
  PageDocument,
} from '../../src/index.js';
import type { PageOptions } from '../../src/index.js';

describe('ルートエクスポート統合テスト', () => {
  // ── 値エクスポートの確認 ──────────────────────────────────────────────────
  it('VStack は関数としてエクスポートされている', () => {
    expect(VStack).toBeDefined();
    expect(typeof VStack).toBe('function');
  });

  it('HStack は関数としてエクスポートされている', () => {
    expect(HStack).toBeDefined();
    expect(typeof HStack).toBe('function');
  });

  it('ViewText は関数としてエクスポートされている', () => {
    expect(ViewText).toBeDefined();
    expect(typeof ViewText).toBe('function');
  });

  it('Image は関数としてエクスポートされている', () => {
    expect(Image).toBeDefined();
    expect(typeof Image).toBe('function');
  });

  it('Section は関数としてエクスポートされている', () => {
    expect(Section).toBeDefined();
    expect(typeof Section).toBe('function');
  });

  it('Spacer は関数としてエクスポートされている', () => {
    expect(Spacer).toBeDefined();
    expect(typeof Spacer).toBe('function');
  });

  it('page は関数としてエクスポートされている', () => {
    expect(page).toBeDefined();
    expect(typeof page).toBe('function');
  });

  it('PageDocument はクラスとしてエクスポートされている', () => {
    expect(PageDocument).toBeDefined();
    expect(typeof PageDocument).toBe('function');
  });

  // ── 型エクスポートの確認 (コンパイル時検証) ───────────────────────────────
  it('型 PageOptions はエクスポートされている (コンパイル時検証)', () => {
    const opts: PageOptions = { lang: 'ja', title: 'Test' };
    expect(opts).toBeDefined();
  });

  // ── ページレンダリングの確認 (内部モジュールを使用しない) ─────────────────
  it('src/index.ts のエクスポートのみを使用してページをレンダリングできる', () => {
    const html = page(Section(ViewText('hello'))).render();

    expect(html).toContain('<html');
    expect(html).toContain('<section');
    expect(html).toContain('<p>hello</p>');
  });

  it('PageOptions を使用して lang 属性と title が設定されたページをレンダリングできる', () => {
    const opts: PageOptions = { lang: 'ja', title: 'Test' };
    const html = page(Section(), opts).render();

    expect(html).toContain('lang="ja"');
    expect(html).toContain('<title>Test</title>');
  });

  it('page() が PageDocument インスタンスを返す', () => {
    const doc = page(Section());
    expect(doc).toBeInstanceOf(PageDocument);
  });

  it('VStack と HStack を使用したレイアウトをレンダリングできる', () => {
    const doc = page(
      VStack(
        undefined,
        VStack(undefined, ViewText('Item 1'), ViewText('Item 2')),
        HStack(undefined, ViewText('A'), ViewText('B')),
      ),
    );
    const html = doc.render();

    expect(html).toContain('<p>Item 1</p>');
    expect(html).toContain('<p>Item 2</p>');
    expect(html).toContain('<p>A</p>');
    expect(html).toContain('<p>B</p>');
  });

  it('Image を使用してレンダリングできる', () => {
    const doc = page(Section(Image('logo.png', 'Logo')));
    const html = doc.render();

    expect(html).toContain('src="logo.png"');
    expect(html).toContain('alt="Logo"');
  });

  it('Spacer を使用してレンダリングできる', () => {
    const doc = page(VStack(undefined, ViewText('Top'), Spacer(), ViewText('Bottom')));
    const html = doc.render();

    expect(html).toContain('<p>Top</p>');
    expect(html).toContain('<p>Bottom</p>');
  });
});
