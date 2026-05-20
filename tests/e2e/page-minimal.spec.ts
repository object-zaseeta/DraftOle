import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトルが表示される', async ({ page }) => {
  await expect(page).toHaveTitle(/DraftOle_TS/);
});

test('html lang 属性が ja', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
});

test('最小構造: hero タイトル / サブタイトル / CTA ボタンが visible', async ({ page }) => {
  await expect(page.getByText('DraftOle_TS へようこそ')).toBeVisible();
  await expect(page.getByText('型安全な HTML/CSS 生成ライブラリ')).toBeVisible();
  await expect(page.getByText('はじめる →')).toBeVisible();
  await expect(page.getByText('ドキュメントを読む')).toBeVisible();
});

test('feature 行: badge と 3 ラベルが visible', async ({ page }) => {
  await expect(page.getByText('✦ オープンソース')).toBeVisible();
  await expect(page.getByText('型安全', { exact: true })).toBeVisible();
  await expect(page.getByText('ゼロ依存', { exact: true })).toBeVisible();
  await expect(page.getByText('SwiftUI ライク API')).toBeVisible();
});

test('h1 computed style 検査: margin reset と font 指定が反映されている', async ({ page }) => {
  // semantic-heading-landmark-api Task 3.1 (Req 3.5):
  // heroTitle = Heading(1, ...).font({ size: '2.5rem', weight: '700', ... }).padding(0)
  // → <h1> の computed style が margin 0 / fontSize 40px / fontWeight 700 となること。
  await page.waitForLoadState('networkidle');
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible();
  const styles = await h1.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      marginTop: cs.marginTop,
      marginBottom: cs.marginBottom,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
    };
  });
  expect(styles.marginTop).toBe('0px');
  expect(styles.marginBottom).toBe('0px');
  expect(styles.fontSize).toBe('40px'); // 2.5rem * 16px
  expect(styles.fontWeight).toBe('700');
});

test('構造: <h1> 1 つ以上 / <main> 正確に 1 つ', async ({ page }) => {
  // semantic-heading-landmark-api Task 3.2 (Req 1.2, 2.4):
  // ビルド出力 HTML 構造として <h1> が 1 つ以上、<main> が正確に 1 つ存在することを検証する。
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).not.toHaveCount(0); // ≥ 1
  await expect(page.locator('main')).toHaveCount(1); // = 1
});

test('a11y violations: none', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  // semantic-heading-landmark-api 適用後は Heading(1, ...) により <h1> を生成するため
  // page-has-heading-one を disable せず通常検証する。
  await expectNoA11yViolations(page);
});
