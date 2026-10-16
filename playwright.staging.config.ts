import { defineConfig, devices } from '@playwright/test';
import { parseMoscowStagingTarget } from './src/travel/stagingAcceptanceTarget';

// Explicit/manual only. No local server and no shared persistent browser profile.
const target = parseMoscowStagingTarget(process.env);
export default defineConfig({
  testDir:'./tests',
  testMatch:'stagingAcceptance.e2e.spec.ts',
  workers:1,
  retries:0,
  timeout:60000,
  expect:{timeout:10000},
  reporter:[['list']],
  use:{
    ...devices['Desktop Chrome'],
    baseURL:target.url,
    locale:'ru-RU',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'off'
  },
  projects:[{name:'staging-chromium',use:{...devices['Desktop Chrome'],viewport:{width:375,height:812}}}]
});
