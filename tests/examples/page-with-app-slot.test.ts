import { describe, expect, it } from 'vitest';
import { AppSlot } from '../../src/view/app-slot.js';
import { page } from '../../src/view/page.js';
import { Text } from '../../src/view/primitives.js';

/**
 * Task 3.1: AppSlot を使った page() の静的シェル出力検証テスト。
 *
 * AppSlot は `data-draftole-mount` 属性を持つ <div> を生成し、
 * ランタイム系コンテンツ（<script>, __draftole__, runtime）を含まないことを確認する。
 */
describe('page(AppSlot(...)) 静的シェル出力検証 (task 3.1)', () => {
  it('render() 出力に data-draftole-mount="counter" が含まれる', () => {
    const doc = page(AppSlot('counter'));
    const html = doc.render();
    expect(html).toContain('data-draftole-mount="counter"');
  });

  it('render() 出力に <script>, __draftole__, runtime が含まれない', () => {
    const doc = page(AppSlot('counter'));
    const html = doc.render();
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('__draftole__');
    expect(html).not.toContain('runtime');
  });

  it('マウントスロットなし page(Text("hello")) の render() 出力に data-draftole-mount が含まれない', () => {
    const doc = page(Text('hello'));
    const html = doc.render();
    expect(html).not.toContain('data-draftole-mount');
  });

  it('AppSlot に空文字列 id を渡すとエラーがスローされる', () => {
    expect(() => AppSlot('')).toThrow('AppSlot id must be a non-empty string');
  });
});
