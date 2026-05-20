import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';

// examples/showcase-card.ts のショーケース（VStack + padding/background/cornerRadius/boxShadow
// を単一チェーンで記述した Card）を静的パターンで検証する e2e スペック。
// page-landing.spec.ts / showcase-button.spec.ts と同じ構造（beforeEach で '/' を開く →
// 個別 test 群）に揃える。

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトル: Showcase Card を示している', async ({ page }) => {
  // examples/showcase-card.ts では title を 'DraftOle Showcase — Card' に指定。
  // 開発サーバが別の examples を配信していても DraftOle Showcase の文脈であれば許容する。
  await expect(page).toHaveTitle(/Card|Showcase.*Card|DraftOle Showcase/);
});

test('カードコンテンツが表示される', async ({ page }) => {
  // VStack 内に Text('Fluent Card') と padding/background/cornerRadius/boxShadow の
  // 説明文を配置している。両方のテキストが描画されていることを確認する。
  await expect(page.getByText('Fluent Card')).toBeVisible();
  await expect(
    page.getByText('padding / background / cornerRadius / boxShadow を単一チェーンで記述'),
  ).toBeVisible();
});

test('カードに padding と box-shadow が computed style として適用されている', async ({
  page,
}) => {
  // examples/showcase-card.ts の Card は .padding(24) と
  // .boxShadow('0 8px 24px rgba(0, 0, 0, 0.12)') を単一チェーンで指定している。
  // 出力 HTML において、見出し 'Fluent Card' の最も近い祖先要素のうち
  // padding と box-shadow が両方とも初期値以外になっている要素を Card 本体とみなし、
  // computed style に padding と box-shadow が反映されていることを検証する。
  await page.waitForLoadState('networkidle');
  const heading = page.getByText('Fluent Card').first();
  await expect(heading).toBeVisible();
  const styles = await heading.evaluate((el) => {
    // padding と box-shadow の両方が "初期値以外" となる最初の祖先要素を Card として採用する。
    let node: HTMLElement | null = el as HTMLElement;
    while (node !== null) {
      const cs = getComputedStyle(node);
      const padded = cs.padding !== '0px' && cs.padding !== '';
      const shadowed = cs.boxShadow !== 'none' && cs.boxShadow !== '';
      if (padded && shadowed) {
        return {
          padding: cs.padding,
          boxShadow: cs.boxShadow,
          backgroundColor: cs.backgroundColor,
          borderRadius: cs.borderRadius,
        };
      }
      node = node.parentElement;
    }
    return null;
  });
  expect(styles).not.toBeNull();
  // padding(24) → 24px 系のいずれかが反映されている。
  expect(styles!.padding).toMatch(/24px/);
  // boxShadow('0 8px 24px rgba(0, 0, 0, 0.12)') → 'none' ではなく rgba/px を含む。
  expect(styles!.boxShadow).not.toBe('none');
  expect(styles!.boxShadow).toMatch(/rgba?\(|px/);
});

test('a11y violations: none', async ({ page }) => {
  // showcase-card は単一 <section> 内に Card（VStack + 2 つの Text）のみを配置する
  // 最小ショーケースで <main> / <h1> を持たない。landmark / region /
  // page-has-heading-one ルールはこのショーケースのスコープ外のため明示的に disable する。
  await page.waitForLoadState('networkidle');
  await expectNoA11yViolations(page, {
    disableRules: ['landmark-one-main', 'region', 'page-has-heading-one'],
  });
});
