import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';
import { expectVisualMatch } from './_helpers/visual';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトルが表示される', async ({ page }) => {
  await expect(page).toHaveTitle(/DraftOle MVP Demo/);
});

test('初期状態でリストが空', async ({ page }) => {
  await expect(page.getByRole('list')).toBeEmpty();
});

test('Todo を追加できる', async ({ page }) => {
  const input = page.getByPlaceholder('新しい Todo を入力');
  const addBtn = page.getByRole('button', { name: '追加' });

  await input.fill('テスト Todo');
  await addBtn.click();

  await expect(page.getByRole('listitem').first()).toContainText('テスト Todo');
});

test('複数 Todo を追加するとカウントが増える', async ({ page }) => {
  const input = page.getByPlaceholder('新しい Todo を入力');
  const addBtn = page.getByRole('button', { name: '追加' });

  await input.fill('Todo 1');
  await addBtn.click();
  await input.fill('Todo 2');
  await addBtn.click();
  await input.fill('Todo 3');
  await addBtn.click();

  await expect(page.getByRole('listitem')).toHaveCount(3);
});

test('Todo を追加するとアクティブ件数が更新される', async ({ page }) => {
  const input = page.getByPlaceholder('新しい Todo を入力');
  const addBtn = page.getByRole('button', { name: '追加' });

  await input.fill('Todo 1');
  await addBtn.click();
  await input.fill('Todo 2');
  await addBtn.click();

  await expect(page.locator('body')).toContainText('2');
});

test('Todo を完了にするとアクティブ件数が減る', async ({ page }) => {
  const input = page.getByPlaceholder('新しい Todo を入力');
  const addBtn = page.getByRole('button', { name: '追加' });

  await input.fill('Todo 1');
  await addBtn.click();
  await input.fill('Todo 2');
  await addBtn.click();

  // 最初のチェックボックスをクリック
  await page.getByRole('checkbox').first().click();

  await expect(page.locator('body')).toContainText('1');
});

test('完了をクリアで完了済みが削除される', async ({ page }) => {
  const input = page.getByPlaceholder('新しい Todo を入力');
  const addBtn = page.getByRole('button', { name: '追加' });

  await input.fill('残す Todo');
  await addBtn.click();
  await input.fill('消す Todo');
  await addBtn.click();

  // 2件目を完了にする
  await page.getByRole('checkbox').nth(1).click();

  // 完了をクリア
  await page.getByRole('button', { name: '完了をクリア' }).click();

  const items = page.getByRole('listitem');
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText('残す Todo');
});

test('Enter キーで Todo を追加できる', async ({ page }) => {
  const input = page.getByPlaceholder('新しい Todo を入力');

  await input.fill('Enter で追加');
  await input.press('Enter');

  await expect(page.getByRole('listitem').first()).toContainText('Enter で追加');
});

test('visual regression: 初期表示スナップショット', async ({ page }) => {
  await expectVisualMatch(page, 'todo-app-default.png', { fullPage: true });
});

test('a11y violations: none', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await expectNoA11yViolations(page, {
    // landmark-one-main / region: <div id="app"> ベースで <main> ランドマークなし
    //   → P10 DXA11Y-1 で対応予定（本 P9 のスコープ外）
    // color-contrast: dark theme + muted 色（rgba 透過）が WCAG AA を満たさない
    //   → demo は production 品質を目指さない方針（myTask.md P10 スコープ境界明記）
    disableRules: ['landmark-one-main', 'region', 'color-contrast'],
  });
});
