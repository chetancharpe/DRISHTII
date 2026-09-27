import { defineConfig, devices } from '@playwright/test';

/**
 * GoWow Playwright Accessibility Testing Configuration
 * Standardizes test execution against WCAG 2.1 AA across multiple browser engines and viewport scales.
 */
export default defineConfig({
  testDir: './tests/accessibility',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'high-contrast-mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        forcedColors: 'active',
      },
    },
    {
      name: 'zoomed-viewport',
      use: {
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 2, // Simulates 200% zoom
      },
    },
  ],

  webServer: {
    command: 'npm --prefix client run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
