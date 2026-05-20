/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { outputFolder: '.out/playwright' }]],
  outputDir: '.out/test-results',
  snapshotPathTemplate: 'tests/e2e/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  projects: [
    {
      name: 'todo-app',
      testMatch: '**/todo-app.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'shopping-cart',
      testMatch: '**/shopping-cart.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'card-gallery',
      testMatch: '**/card-gallery.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3003',
      },
    },
    {
      name: 'app-counter',
      testMatch: '**/app-counter.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3004',
      },
    },
    {
      name: 'app-form',
      testMatch: '**/app-form.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3005',
      },
    },
    {
      name: 'page-landing',
      testMatch: '**/page-landing.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3006',
      },
    },
    {
      name: 'page-minimal',
      testMatch: '**/page-minimal.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3007',
      },
    },
    {
      name: 'priority-tasks',
      testMatch: '**/priority-tasks.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3008',
      },
    },
    {
      name: 'page-with-app-slot',
      testMatch: '**/page-with-app-slot.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3009',
      },
    },
    {
      name: 'showcase-button',
      testMatch: '**/showcase-button.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3010',
      },
    },
    {
      name: 'showcase-card',
      testMatch: '**/showcase-card.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3011',
      },
    },
    {
      name: 'showcase-list',
      testMatch: '**/showcase-list.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3012',
      },
    },
    // NOTE: future cross-browser variants here
    // (Requirement 6 — currently deferred; structure preserved for follow-up).
  ],
  webServer: [
    {
      command: `pnpm demo:mvp && npx serve .out/runs/mvp_demo -p 3001`,
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:shopping-cart && npx serve .out/runs/shopping_cart -p 3002`,
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:card-gallery && npx serve .out/runs/card_gallery -p 3003`,
      url: 'http://localhost:3003',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:app-counter && npx serve .out/runs/app_counter -p 3004`,
      url: 'http://localhost:3004',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:app-form && npx serve .out/runs/app_form -p 3005`,
      url: 'http://localhost:3005',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:page-landing && npx serve .out/runs/page_landing -p 3006`,
      url: 'http://localhost:3006',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:page-minimal && npx serve .out/runs/page_minimal -p 3007`,
      url: 'http://localhost:3007',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:priority-tasks && npx serve .out/runs/priority_tasks -p 3008`,
      url: 'http://localhost:3008',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:page-with-app-slot && npx serve .out/runs/page_with_app_slot -p 3009`,
      url: 'http://localhost:3009',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:showcase-button && npx serve .out/runs/showcase_button -p 3010`,
      url: 'http://localhost:3010',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:showcase-card && npx serve .out/runs/showcase_card -p 3011`,
      url: 'http://localhost:3011',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm demo:showcase-list && npx serve .out/runs/showcase_list -p 3012`,
      url: 'http://localhost:3012',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
