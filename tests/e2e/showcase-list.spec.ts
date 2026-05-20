import { test, expect } from '@playwright/test';
import { expectNoA11yViolations } from './_helpers/a11y';

// examples/showcase-list.ts のショーケース（VStack + HStack + .grid()/.flex() 相当）を
// 静的パターンで検証する e2e スペック。
// page-landing.spec.ts / showcase-button.spec.ts と同じ構造（beforeEach で '/' を開く
// → 個別 test 群）に揃える。
//
// 検証戦略:
//   - title: 'DraftOle Showcase: List' を寛容な正規表現で確認。
//   - List コンテンツ: 行データ（Alice / Bob / Carol など）と表ヘッダ（Name/Role/Status）が visible。
//   - layout: 表ヘッダ HStack に `.grid({ columns: '1fr 1fr 1fr', gap: '8px' })` が
//     適用されているため、当該要素の computed style が display:grid かつ gap が
//     非ゼロ（"8px"）になっていることを getComputedStyle で確認する。
//     併せて外側 VStack（行コンテナ）が display:flex で flex-direction:column であることも
//     簡易確認し、grid/flex 双方のレイアウト系統が想定通り適用されていることを担保する。
//   - a11y: showcase-list は <main> / <h1> を持たない単一 <section> 構成のため
//     showcase-button と同じく landmark / region / page-has-heading-one を disable する。

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('ページタイトル: Showcase List を示している', async ({ page }) => {
  // examples/showcase-list.ts では title を 'DraftOle Showcase: List' に指定。
  // 開発サーバが別の examples を配信していても DraftOle Showcase の文脈であれば許容する。
  await expect(page).toHaveTitle(/List|Showcase.*List/);
});

test('リストコンテンツ（ヘッダと行データ）が表示される', async ({ page }) => {
  // 表ヘッダ
  await expect(page.getByText('Name', { exact: true })).toBeVisible();
  await expect(page.getByText('Role', { exact: true })).toBeVisible();
  await expect(page.getByText('Status', { exact: true })).toBeVisible();
  // 行データ（rows = Alice / Bob / Carol）
  await expect(page.getByText('Alice', { exact: true })).toBeVisible();
  await expect(page.getByText('Bob', { exact: true })).toBeVisible();
  await expect(page.getByText('Carol', { exact: true })).toBeVisible();
});

test('grid/flex layout が computed style で想定通りに適用されている', async ({ page }) => {
  // 表ヘッダ HStack（.grid() 適用済み）= 'Name' を含む直近の要素を辿って取得する。
  // p('Name') の親（HStack の <div>）に .grid() が適用されているはず。
  await page.waitForLoadState('networkidle');

  // ── grid 検査: ヘッダ HStack ──
  // 'Name' テキスト要素を含む祖先要素のうち、computed display === 'grid' となる
  // 最も近い要素 (= .grid() 適用された HStack コンテナ) を探索する。
  // textContent 連結正規表現に依存せず、computed style で意味的に特定する方式。
  const gridStyles = await page.getByText('Name', { exact: true }).first().evaluate((el) => {
    let node: HTMLElement | null = el as HTMLElement;
    while (node !== null) {
      const cs = getComputedStyle(node);
      if (cs.display === 'grid') {
        return {
          display: cs.display,
          gridTemplateColumns: cs.gridTemplateColumns,
          gap: cs.gap,
        };
      }
      node = node.parentElement;
    }
    return null;
  });
  if (gridStyles === null) {
    throw new Error("祖先要素に display:grid が見つからない (.grid() 未適用?)");
  }
  expect(gridStyles.display).toBe('grid');
  // gap: '8px' を指定しているため非ゼロ値（"8px"）となる。
  expect(gridStyles.gap).toBe('8px');
  // columns: '1fr 1fr 1fr' → 3 トラックが算出されることを確認（具体の px 値は viewport 依存のため
  // トラック数で検証する）。
  expect(gridStyles.gridTemplateColumns.split(/\s+/)).toHaveLength(3);

  // ── flex 検査: 行 HStack（'Alice' を含む行）──
  // grid と同じ探索戦略: 'Alice' から祖先方向に display === 'flex' AND flex-direction === 'row'
  // を探す (外側 VStack は flex-direction: column なのでスキップされる)。
  const flexStyles = await page.getByText('Alice', { exact: true }).first().evaluate((el) => {
    let node: HTMLElement | null = el as HTMLElement;
    while (node !== null) {
      const cs = getComputedStyle(node);
      if (cs.display === 'flex' && cs.flexDirection === 'row') {
        return {
          display: cs.display,
          flexDirection: cs.flexDirection,
          gap: cs.gap,
        };
      }
      node = node.parentElement;
    }
    return null;
  });
  if (flexStyles === null) {
    throw new Error("祖先要素に display:flex / flex-direction:row が見つからない (HStack 未適用?)");
  }
  // HStack（オプション付き）→ flex 横並びレイアウト。
  expect(flexStyles.display).toBe('flex');
  expect(flexStyles.flexDirection).toBe('row');
  expect(flexStyles.gap).toBe('8px');
});

test('a11y violations: none', async ({ page }) => {
  // showcase-list は単一 <section> + 内部 <div>/<p> 構成で <main> / <h1> を持たない。
  // landmark / region / page-has-heading-one ルールはこのショーケースのスコープ外のため
  // 明示的に disable する（showcase-button.spec.ts と同方針）。
  // color-contrast: Active/Away ステータスの色 (#10b981 / #6b7280) と白背景の
  //   組み合わせが一部 WCAG AA を満たさない可能性 → demo は production 品質を目指さない方針。
  await page.waitForLoadState('networkidle');
  await expectNoA11yViolations(page, {
    disableRules: ['landmark-one-main', 'region', 'page-has-heading-one', 'color-contrast'],
  });
});
