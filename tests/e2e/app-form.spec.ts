import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトルが表示される', async ({ page }) => {
  await expect(page).toHaveTitle(/App Form/);
});

test('初期 preview が「（未入力）」', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'App Form' })).toBeVisible();
  await expect(page.locator('body')).toContainText('（未入力）');
});

test('input に入力すると preview が同期する', async ({ page }) => {
  const input = page.getByPlaceholder('お名前を入力…');
  await input.fill('Alice');
  await expect(page.locator('body')).toContainText('Alice');
});

test('送信クリックで result に「送信済み: X」が表示され input が空になる', async ({ page }) => {
  const input = page.getByPlaceholder('お名前を入力…');
  await input.fill('Bob');

  await page.getByRole('button', { name: '送信' }).click();

  await expect(page.locator('body')).toContainText('送信済み: Bob');
  await expect(input).toHaveValue('');
  await expect(page.locator('body')).toContainText('（未入力）');
});

test('クリアで preview / result / input が初期化される', async ({ page }) => {
  const input = page.getByPlaceholder('お名前を入力…');

  await input.fill('Carol');
  await page.getByRole('button', { name: '送信' }).click();
  await expect(page.locator('body')).toContainText('送信済み: Carol');

  await input.fill('Dave');
  await page.getByRole('button', { name: 'クリア' }).click();

  await expect(input).toHaveValue('');
  await expect(page.locator('body')).toContainText('（未入力）');
  await expect(page.locator('body')).not.toContainText('送信済み:');
});

test('a11y violations: none', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await expectNoA11yViolations(page, {
    // landmark-one-main / region: <div> ベースで <main> ランドマークなし
    //   → P10 DXA11Y-1 で対応予定（本 P9 のスコープ外）
    // color-contrast: demo theme の muted 色が WCAG AA を満たさない
    //   → demo は production 品質を目指さない方針（myTask.md P10 スコープ境界）
    disableRules: ['landmark-one-main', 'region', 'color-contrast'],
  });
});
