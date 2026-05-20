/**
 * Card Gallery e2e (Playwright)
 *
 * 検証観点:
 * - each-modifier-css-extraction の修正で、each() 内 modifier-chain CSS が
 *   ブラウザ上で実際に getComputedStyle に反映されること
 * - state mutation（add / remove）後も全 item に同一スタイルが一貫適用されること
 * - 静的要素（hero / stats）のスタイルも回帰なし
 *
 * 注: `<li>` の listitem ロールは implicit ARIA で accessibility tree 上のみに
 * 存在するため、CSS 属性セレクタ `[role="listitem"]` ではマッチしない。
 * Playwright の `page.getByRole('listitem')` を使う。
 * `<ul>` には a11y 適合のため明示 `role="list"` を付与している（card-gallery.ts）。
 */
import { expect, type Page, test } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';
import { expectVisualMatch } from './_helpers/visual';

const ADD_BTN = 'button:has-text("カードを追加")';
const REMOVE_BTN = 'button:has-text("末尾を削除")';

async function getItemStyle(page: Page, prop: string): Promise<string> {
	return page.getByRole('listitem').first().evaluate((el, p) => {
		return window.getComputedStyle(el).getPropertyValue(p);
	}, prop);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
});

test.describe('Card Gallery: 起動時の初期状態', () => {
	test('ページタイトルが表示される', async ({ page }) => {
		await expect(page).toHaveTitle(/Card Gallery/);
	});

	test('5 件のカードが初期表示される', async ({ page }) => {
		await expect(page.getByRole('listitem')).toHaveCount(5);
	});

	test('カウントとフィーチャー数が表示される', async ({ page }) => {
		await expect(page.locator('body')).toContainText('5 cards');
		await expect(page.locator('body')).toContainText('★ 2 featured');
	});
});

test.describe('Card Gallery: each() 内 modifier-chain CSS が DOM に反映される', () => {
	test('li の padding が 16px', async ({ page }) => {
		const padding = await getItemStyle(page, 'padding-top');
		expect(padding).toBe('16px');
	});

	test('li の border-radius が 12px', async ({ page }) => {
		const radius = await getItemStyle(page, 'border-top-left-radius');
		expect(radius).toBe('12px');
	});

	test('li に 1px solid border が適用されている', async ({ page }) => {
		const borderWidth = await getItemStyle(page, 'border-top-width');
		const borderStyle = await getItemStyle(page, 'border-top-style');
		expect(borderWidth).toBe('1px');
		expect(borderStyle).toBe('solid');
	});

	test('li の background が透明黒', async ({ page }) => {
		const bg = await getItemStyle(page, 'background-color');
		expect(bg).toBe('rgba(0, 0, 0, 0.22)');
	});
});

test.describe('Card Gallery: state mutation 後も全 item に一貫してスタイル適用', () => {
	test('カードを追加すると 6 件になり、新カードも同じスタイル', async ({ page }) => {
		await page.click(ADD_BTN);
		await expect(page.getByRole('listitem')).toHaveCount(6);

		const lastItem = page.getByRole('listitem').last();
		const padding = await lastItem.evaluate((el) => window.getComputedStyle(el).paddingTop);
		const radius = await lastItem.evaluate((el) => window.getComputedStyle(el).borderTopLeftRadius);
		expect(padding).toBe('16px');
		expect(radius).toBe('12px');
	});

	test('カードを連続 3 件追加 → 8 件', async ({ page }) => {
		await page.click(ADD_BTN);
		await page.click(ADD_BTN);
		await page.click(ADD_BTN);
		await expect(page.getByRole('listitem')).toHaveCount(8);
		await expect(page.locator('body')).toContainText('8 cards');
	});

	test('「末尾を削除」で件数が減る', async ({ page }) => {
		await page.click(REMOVE_BTN);
		await expect(page.getByRole('listitem')).toHaveCount(4);
		await expect(page.locator('body')).toContainText('4 cards');
	});

	test('削除→追加の往復で件数が一致する', async ({ page }) => {
		await page.click(REMOVE_BTN);
		await page.click(REMOVE_BTN);
		await page.click(ADD_BTN);
		await page.click(ADD_BTN);
		await expect(page.getByRole('listitem')).toHaveCount(5);
	});
});

test.describe('Card Gallery: 静的要素のスタイル（回帰確認）', () => {
	test('hero h1 の font-size が 32px', async ({ page }) => {
		const size = await page.locator('h1').evaluate((el) => window.getComputedStyle(el).fontSize);
		expect(size).toBe('32px');
	});

	test('追加ボタンが accent 色背景', async ({ page }) => {
		const bg = await page.locator(ADD_BTN).evaluate((el) => window.getComputedStyle(el).backgroundColor);
		// theme.accent = #7c5cff
		expect(bg).toBe('rgb(124, 92, 255)');
	});
});

test.describe('Card Gallery: ハッシュクラスと CSS ルールの対応', () => {
	test('全 item に scoped class が付与されている', async ({ page }) => {
		await expect(page.getByRole('listitem')).toHaveCount(5);
		const classes = await page.getByRole('listitem').evaluateAll((els) =>
			els.map((el) => el.getAttribute('class') ?? ''),
		);
		expect(classes.length).toBe(5);
		for (const cls of classes) {
			expect(cls).toMatch(/_[a-f0-9]+/);
		}
	});

	test('追加した新 item にも class が付与される', async ({ page }) => {
		await page.click(ADD_BTN);
		await expect(page.getByRole('listitem')).toHaveCount(6);
		const lastClass = await page.getByRole('listitem').last().getAttribute('class');
		expect(lastClass).toMatch(/_[a-f0-9]+/);
	});
});

test('visual regression: グリッドレイアウト', async ({ page }) => {
	await page.goto('/');
	await expectVisualMatch(page, 'card-gallery-grid.png', { fullPage: true });
});

test('a11y violations: none', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await expectNoA11yViolations(page, {
		// landmark-one-main / region: <div> ベースで <main> ランドマークなし
		//   → P10 DXA11Y-1 で対応予定（本 P9 のスコープ外）
		// color-contrast: dark theme + muted 色（rgba 透過）が WCAG AA を満たさない
		//   → demo は production 品質を目指さない方針（myTask.md P10 スコープ境界）
		disableRules: ['landmark-one-main', 'region', 'color-contrast'],
	});
});
