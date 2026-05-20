import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';

// examples/showcase-button.ts のショーケース（Button + Fluent :hover）を
// 静的パターンで検証する e2e スペック。
// page-landing.spec.ts と同じ構造（beforeEach で '/' を開く → 個別 test 群）に揃える。

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトル: Showcase Button を示している', async ({ page }) => {
  // examples/showcase-button.ts では title を 'DraftOle Showcase: Button' に指定。
  // 開発サーバが別の examples を配信していても DraftOle Showcase の文脈であれば許容する。
  await expect(page).toHaveTitle(/Showcase.*Button|DraftOle Showcase/);
});

test('「クリック」ボタンが表示される', async ({ page }) => {
  // Button({ type: 'button' }, Text('クリック')) で描画されるラベル文言を確認する。
  await expect(page.getByText('クリック')).toBeVisible();
});

test(':hover セレクタが CSS 出力に含まれる', async ({ page }) => {
  // .hover((s) => s.background(...).color('#ffffff')) の Fluent API が
  // 出力 HTML/CSS 中に `:hover` セレクタを生成していることを page.content() で検査する。
  await page.waitForLoadState('networkidle');
  const html = await page.content();
  expect(html).toContain(':hover');
});

test('a11y violations: none', async ({ page }) => {
  // showcase-button は単一 <section> 内に <button> のみを配置する最小ショーケースで
  // <main> / <h1> を持たない。landmark / region / page-has-heading-one ルールは
  // このショーケースのスコープ外のため明示的に disable する。
  await page.waitForLoadState('networkidle');
  await expectNoA11yViolations(page, {
    disableRules: ['landmark-one-main', 'region', 'page-has-heading-one'],
  });
});
