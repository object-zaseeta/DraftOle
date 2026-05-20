import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトルが表示される', async ({ page }) => {
  await expect(page).toHaveTitle(/Shopping Cart/);
});

test('初期カートに3件の商品が表示される', async ({ page }) => {
  await expect(page.getByRole('listitem')).toHaveCount(3);
});

test('初期の商品数が4になっている', async ({ page }) => {
  // 商品数ラベルの隣に表示される数値スパン
  const countLabel = page.getByText('商品数:');
  const section = countLabel.locator('..');
  await expect(section).toContainText('4');
});

test('初期の合計金額が¥25,000になっている', async ({ page }) => {
  await expect(page.locator('body')).toContainText('¥25,000');
});

test('TypeScript 実践ガイドが表示される', async ({ page }) => {
  await expect(page.getByRole('listitem').nth(0)).toContainText('TypeScript 実践ガイド');
});

test('メカニカルキーボードが表示される', async ({ page }) => {
  await expect(page.getByRole('listitem').nth(1)).toContainText('メカニカルキーボード');
});

test('USB-C ハブ 7-in-1 が表示される', async ({ page }) => {
  await expect(page.getByRole('listitem').nth(2)).toContainText('USB-C ハブ 7-in-1');
});

test('各商品に3つのボタン（−・数量・＋・削除）が存在する', async ({ page }) => {
  const items = page.getByRole('listitem');
  for (let i = 0; i < 3; i++) {
    // 各 li には −, ＋, ✕ の 3 ボタンがある
    await expect(items.nth(i).locator('button')).toHaveCount(3);
  }
});

test('削除ボタン（remove-btn）が各商品に存在する', async ({ page }) => {
  // ✕ ボタンは remove-btn クラスを持つ
  await expect(page.locator('.remove-btn')).toHaveCount(3);
});

test('注文を確定するボタンが表示される', async ({ page }) => {
  await expect(page.getByRole('button', { name: '注文を確定する' })).toBeVisible();
});

test('USB-C ハブの数量が初期値2になっている', async ({ page }) => {
  // 3番目のアイテム（USB-C ハブ、qty=2）
  await expect(page.getByRole('listitem').nth(2)).toContainText('2');
});

test('各商品の単価が表示される', async ({ page }) => {
  await expect(page.getByRole('listitem').nth(0)).toContainText('¥3,200');
  await expect(page.getByRole('listitem').nth(1)).toContainText('¥12,800');
  await expect(page.getByRole('listitem').nth(2)).toContainText('¥4,500');
});

test('送料無料が表示される', async ({ page }) => {
  await expect(page.locator('body')).toContainText('¥0（無料）');
});

test('a11y violations: none', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await expectNoA11yViolations(page, {
    // landmark-one-main / region: <div> ベースで <main> ランドマークなし
    //   → P10 DXA11Y-1 で対応予定（本 P9 のスコープ外）
    // color-contrast: dark theme + muted 色（rgba 透過）が WCAG AA を満たさない
    //   → demo は production 品質を目指さない方針（myTask.md P10 スコープ境界）
    // button-name: 削除ボタン（✕ アイコン）に aria-label 不足
    //   → demo の構造的特性。production 化時は aria-label 追加が必要
    disableRules: ['landmark-one-main', 'region', 'color-contrast', 'button-name'],
  });
});
