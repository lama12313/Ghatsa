import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  use: {
    ...devices['Pixel 7'],
    baseURL: 'http://localhost:4173',
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: { command: 'npm run preview -- --port 4173', port: 4173, reuseExistingServer: true },
});
