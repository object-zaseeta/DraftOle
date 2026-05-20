import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export interface A11yCheckOptions {
  disableRules?: string[];
  include?: string | string[];
  exclude?: string | string[];
}

export async function expectNoA11yViolations(
  page: Page,
  options: A11yCheckOptions = {},
): Promise<void> {
  let builder = new AxeBuilder({ page });

  if (options.include !== undefined) {
    const targets = Array.isArray(options.include) ? options.include : [options.include];
    for (const selector of targets) builder = builder.include(selector);
  }
  if (options.exclude !== undefined) {
    const targets = Array.isArray(options.exclude) ? options.exclude : [options.exclude];
    for (const selector of targets) builder = builder.exclude(selector);
  }
  if (options.disableRules && options.disableRules.length > 0) {
    builder = builder.disableRules(options.disableRules);
  }

  const results = await builder.analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.help}`);
  expect(summary, `axe violations:\n${summary.join('\n')}`).toEqual([]);
}
