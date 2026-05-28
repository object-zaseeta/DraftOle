import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';
import { expectVisualMatch } from './_helpers/visual';

// 2026-05-25: examples/page-landing.ts を English brand-aligned LP に書き直したのに合わせて
// 全 assertion を新コピーに更新。旧 JP コピーは git 履歴参照。

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトルが表示される', async ({ page }) => {
  await expect(page).toHaveTitle(/DraftOle — TypeScript everywhere/);
});

test('hero セクション: タイトルとサブタイトルが visible', async ({ page }) => {
  // 2026-05-28 positioning re-baseline: "TypeScript everywhere, including your HTML."
  // heroTitle は Heading(1, ...) で <h1> として描画される。
  // タグラインは footer にも同文が出るので role-based locator で h1 のみ狙う。
  await expect(
    page.getByRole('heading', { level: 1, name: 'TypeScript everywhere, including your HTML.' }),
  ).toBeVisible();
  await expect(
    page.getByText('The same modifier-chain DSL writes your landing pages, your docs, and your apps.'),
  ).toBeVisible();
});

test('hero セクション: CTA が visible', async ({ page }) => {
  // 2026-05-28: 旧 "page first, App later." slogan は positioning re-baseline で引退。
  await expect(page.getByText('pnpm add draft-ole', { exact: true })).toBeVisible();
  await expect(page.getByText('View on GitHub →')).toBeVisible();
});

test('zeros セクション: 3 つの "0" 統計が visible', async ({ page }) => {
  await expect(page.getByText('Three zeros, by design.')).toBeVisible();
  await expect(page.getByText('JavaScript in output')).toBeVisible();
  await expect(page.getByText('production deps')).toBeVisible();
  await expect(page.getByText('bundler config')).toBeVisible();
});

test('what-it-is セクション: 見出しと差別化 bullets が visible', async ({ page }) => {
  await expect(page.getByText('What it is, in one paragraph.')).toBeVisible();
  await expect(page.getByText('Type-safe end-to-end.')).toBeVisible();
  await expect(page.getByText('SwiftUI-style modifier chains.')).toBeVisible();
});

test('phase セクション: page first, App later 解説が visible', async ({ page }) => {
  await expect(page.getByText('Page first. App later.', { exact: true })).toBeVisible();
});

test('CTA セクション: install コマンドと Quick Start link が visible', async ({ page }) => {
  await expect(page.getByText('Try it. One file, sixty seconds.')).toBeVisible();
  await expect(page.getByText('$ pnpm add draft-ole', { exact: true })).toBeVisible();
  await expect(page.getByText('Read the Quick Start →')).toBeVisible();
});

test('footer セクション: ブランド + リンク + コピーライトが visible', async ({ page }) => {
  await expect(page.getByText('© 2026 DraftOle · MIT License')).toBeVisible();
});

test('visual regression: hero スナップショット', async ({ page }) => {
  await expectVisualMatch(page, 'page-landing-default.png', { fullPage: true });
});

test('h1 computed style 検査: margin reset と font 指定が反映されている', async ({ page }) => {
  // semantic-heading-landmark-api Task 3.1 (Req 3.5):
  // heroTitle = Heading(1, ...).font({ size: '3.25rem', weight: '800', ... }).margin('0')
  // → <h1> の computed style が margin 0 / fontSize 52px / fontWeight 800 となること。
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
  expect(styles.fontSize).toBe('52px'); // 3.25rem * 16px
  expect(styles.fontWeight).toBe('800');
});

test('構造: <h1> 1 つ以上 / <main> 正確に 1 つ', async ({ page }) => {
  // semantic-heading-landmark-api Task 3.2 (Req 1.2, 2.4):
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).not.toHaveCount(0); // ≥ 1
  await expect(page.locator('main')).toHaveCount(1); // = 1
});

test('a11y violations: none', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await expectNoA11yViolations(page, {
    disableRules: [],
  });
});
