import { expect, type Locator, type Page } from '@playwright/test';

export interface VisualOptions {
  fullPage?: boolean;
  mask?: string[];
  maxDiffPixelRatio?: number;
  threshold?: number;
}

export async function expectVisualMatch(
  page: Page,
  name: string,
  options: VisualOptions = {},
): Promise<void> {
  await page.waitForLoadState('networkidle');

  const masks: Locator[] = (options.mask ?? []).map((selector) => page.locator(selector));

  await expect(page).toHaveScreenshot(name, {
    fullPage: options.fullPage ?? false,
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: options.maxDiffPixelRatio ?? 0.01,
    ...(options.threshold !== undefined ? { threshold: options.threshold } : {}),
    ...(masks.length > 0 ? { mask: masks } : {}),
  });
}
