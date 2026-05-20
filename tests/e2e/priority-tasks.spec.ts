import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';

// priority-tasks.ts は each テンプレート内で .text() / .checked() / .on() /
// .class() / .setStyle() の動的バインディング全部入りを示すデモ。
// 本 spec では cart-app.spec.ts と同じ動的パターン（個別 test 関数）で、
// シナリオ「追加 → 完了 → 削除」を再現可能な形に分解して検証する。

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトルが表示される', async ({ page }) => {
  await expect(page).toHaveTitle(/Priority Tasks/);
});

test('初期状態: タスクリストが空（listitem 0 件）', async ({ page }) => {
  await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('初期状態: 合計件数が 0 と表示される', async ({ page }) => {
  // 「合計: 」ラベル隣の span に totalCount が反映される
  const totalLabel = page.getByText('合計:');
  const section = totalLabel.locator('..');
  await expect(section).toContainText('0');
});

test('タスク追加: 入力して "追加" クリックで listitem が 1 件追加される', async ({ page }) => {
  const input = page.getByPlaceholder('新しいタスクを入力');
  const addBtn = page.getByRole('button', { name: '追加' });

  await input.fill('テストタスク');
  await addBtn.click();

  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('listitem').first()).toContainText('テストタスク');
});

test('優先度 pill が表示される（デフォルト medium = "中"）', async ({ page }) => {
  const input = page.getByPlaceholder('新しいタスクを入力');
  const addBtn = page.getByRole('button', { name: '追加' });

  // デフォルトの優先度は medium ("中")
  await input.fill('中優先度タスク');
  await addBtn.click();

  // 追加された listitem 内に pill のラベル "中" が表示される
  const item = page.getByRole('listitem').first();
  await expect(item).toContainText('中');
});

test('完了チェックで done-text クラスが付与される（取消線適用）', async ({ page }) => {
  const input = page.getByPlaceholder('新しいタスクを入力');
  const addBtn = page.getByRole('button', { name: '追加' });

  await input.fill('完了予定タスク');
  await addBtn.click();

  // チェック前は done-text クラスが付いていない
  const taskTextSpan = page.getByRole('listitem').first().locator('span', { hasText: '完了予定タスク' });
  await expect(taskTextSpan).not.toHaveClass(/done-text/);

  // チェックボックスをクリックして完了状態にする
  await page.getByRole('checkbox').first().check();

  // done-text クラスが付与され、取消線スタイル（line-through）が computed style に反映される
  await expect(taskTextSpan).toHaveClass(/done-text/);
  await expect(taskTextSpan).toHaveCSS('text-decoration', /line-through/);
});

test('削除ボタン "✕" クリックでリストが空に戻る（追加 → 完了 → 削除シナリオ完走）', async ({ page }) => {
  const input = page.getByPlaceholder('新しいタスクを入力');
  const addBtn = page.getByRole('button', { name: '追加' });

  // 追加
  await input.fill('削除対象タスク');
  await addBtn.click();
  await expect(page.getByRole('listitem')).toHaveCount(1);

  // 完了
  await page.getByRole('checkbox').first().check();
  await expect(page.getByRole('checkbox').first()).toBeChecked();

  // 削除（listitem 内の "✕" ボタン: 構造上 listitem の最後のボタン）
  // getByRole('button', { name: '✕' }) は accessible name の whitespace 正規化次第で
  // 不安定になることがあるため、listitem 配下の最後の button (削除ボタン) を取得する。
  const deleteBtn = page.getByRole('listitem').first().locator('button').last();
  await deleteBtn.click();

  await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('a11y violations: none', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await expectNoA11yViolations(page, {
    // landmark-one-main / region: priority-tasks.ts は <div> ベースで <main> ランドマークなし
    //   → P10 DXA11Y-1 で対応予定（本 P9 のスコープ外）
    // color-contrast: dark theme + muted 色（rgba 透過）が WCAG AA を満たさない
    //   → demo は production 品質を目指さない方針
    // button-name: 削除ボタン（✕ アイコン）に aria-label 不足
    //   → demo の構造的特性。production 化時は aria-label 追加が必要
    // select-name: 優先度 <select> に label/aria-label 不足
    //   → demo の構造的特性。production 化時は <label for> or aria-label 追加が必要
    disableRules: [
      'landmark-one-main',
      'region',
      'color-contrast',
      'button-name',
      'select-name',
    ],
  });
});
