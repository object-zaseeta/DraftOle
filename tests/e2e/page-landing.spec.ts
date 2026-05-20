import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';
import { expectVisualMatch } from './_helpers/visual';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトルが表示される', async ({ page }) => {
  await expect(page).toHaveTitle(/DraftOle_TS/);
});

test('hero セクション: タイトルとサブタイトルが visible', async ({ page }) => {
  // P10 で解決: heroTitle は Heading(1, ...) で <h1> として描画される。
  await expect(page.getByText('DraftOle_TS で LP を最速で組む')).toBeVisible();
  await expect(page.getByText('SwiftUI ライクな View DSL')).toBeVisible();
});

test('hero セクション: CTA ボタンが visible', async ({ page }) => {
  await expect(page.getByText('今すぐ試す')).toBeVisible();
  await expect(page.getByText('GitHub で見る')).toBeVisible();
});

test('feature セクション: 「主な特徴」見出しと 3 カードが visible', async ({ page }) => {
  await expect(page.getByText('主な特徴')).toBeVisible();
  await expect(page.getByText('型安全', { exact: true })).toBeVisible();
  await expect(page.getByText('ゼロ依存', { exact: true })).toBeVisible();
  await expect(page.getByText('SwiftUI ライク', { exact: true })).toBeVisible();
});

test('CTA セクション: 「さあ、はじめよう」と Get Started ボタンが visible', async ({ page }) => {
  await expect(page.getByText('さあ、はじめよう')).toBeVisible();
  await expect(page.getByText('Get Started →')).toBeVisible();
});

test('footer セクション: コピーライトが visible', async ({ page }) => {
  await expect(page.getByText('© 2026 DraftOle_TS')).toBeVisible();
});

test('visual regression: hero スナップショット', async ({ page }) => {
  await expectVisualMatch(page, 'page-landing-default.png', { fullPage: true });
});

test('h1 computed style 検査: margin reset と font 指定が反映されている', async ({ page }) => {
  // semantic-heading-landmark-api Task 3.1 (Req 3.5):
  // heroTitle = Heading(1, ...).font({ size: '2.75rem', weight: '800', ... }).padding(0)
  // → <h1> の computed style が margin 0 / fontSize 44px / fontWeight 800 となること。
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
  expect(styles.fontSize).toBe('44px'); // 2.75rem * 16px
  expect(styles.fontWeight).toBe('800');
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
  await expectNoA11yViolations(page, {
    // P10 で解決: Heading(1, ...) を採用し <h1> が描画されるため
    // page-has-heading-one ルールの disable は不要。
    disableRules: [],
  });
});
