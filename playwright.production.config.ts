import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PRODUCTION_BASE_URL?.trim()
  || 'https://moscow-mobile-preview.onrender.com';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  reporter: process.env.CI ? [['line']] : [['list']],
  use: {
    baseURL,
    locale: 'ru-RU',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'production-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 430, height: 900 }
      }
    }
  ]
});
