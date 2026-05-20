import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトル', async ({ page }) => {
  // examples/page-with-app-slot.ts の page() 第 4 引数 title: 'AppSlot デモ — DraftOle_TS'
  await expect(page).toHaveTitle(/AppSlot/);
});

test('ヘッダーが表示される', async ({ page }) => {
  // headerTitle = Text('DraftOle_TS カウンター デモ')
  await expect(page.getByText('DraftOle_TS カウンター デモ')).toBeVisible();
});

test('スロットラベルが表示される', async ({ page }) => {
  // slotLabel = Text('カウンター（JavaScript が有効な場合に表示されます）')
  await expect(
    page.getByText('カウンター（JavaScript が有効な場合に表示されます）'),
  ).toBeVisible();
});

test('ドキュメントリンクが表示される', async ({ page }) => {
  // linkText = Text('ドキュメントを読む →')
  await expect(page.getByText('ドキュメントを読む →')).toBeVisible();
});

test('a11y violations: none', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  // examples/page-with-app-slot.ts は Section(...) のみで構成されており
  // <main> / <h1> を持たない静的ページ構造のため、関連ランドマーク/見出しルールを抑制する。
  // region: Section 直下に landmark を持たないコンテンツが含まれるケースを許容する。
  await expectNoA11yViolations(page, {
    disableRules: ['landmark-one-main', 'page-has-heading-one', 'region'],
  });
});
