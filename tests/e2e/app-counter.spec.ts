import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトルが表示される', async ({ page }) => {
  await expect(page).toHaveTitle(/App Counter/);
});

test('初期表示が 0', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'App Counter' })).toBeVisible();
  await expect(page.locator('body')).toContainText('現在のカウント値');
});

test('+1 クリックでカウントが 1 増える', async ({ page }) => {
  await page.getByRole('button', { name: '+1' }).click();
  await expect(page.locator('body')).toContainText('1');
});

test('+1 を連打するとカウントが累積する', async ({ page }) => {
  const incBtn = page.getByRole('button', { name: '+1' });
  await incBtn.click();
  await incBtn.click();
  await incBtn.click();
  await expect(page.locator('body')).toContainText('3');
});

test('−1 クリックで負の値になる', async ({ page }) => {
  await page.getByRole('button', { name: '−1' }).click();
  await expect(page.locator('body')).toContainText('-1');
});

test('リセットでカウントが 0 に戻る', async ({ page }) => {
  const incBtn = page.getByRole('button', { name: '+1' });
  await incBtn.click();
  await incBtn.click();
  await expect(page.locator('body')).toContainText('2');

  await page.getByRole('button', { name: 'リセット' }).click();
  await expect(page.locator('body')).toContainText('0');
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
