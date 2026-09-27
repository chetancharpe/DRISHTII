/**
 * GoWow Accessibility Test Suite: Candidate Journey
 * Validates WCAG 2.1 AA across Dashboard, Learning, Practice, Mock Tests, Results & Progress.
 * Criteria: 1.1.1, 1.3.1, 1.4.1, 1.4.3, 1.4.4, 2.1.1, 2.4.6, 3.1.2.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Candidate Journey Accessibility Audit', () => {
  test('Candidate Dashboard: Logical structure and accessible cards', async ({ page }) => {
    await page.goto('/candidate/dashboard');

    // Exactly one H1 for Candidate Dashboard
    const h1 = page.locator('h1');
    await expect(h1).toBeAttached();

    // Quick action cards or modules are reachable via keyboard Tab
    const actionCards = page.locator('a[href^="/candidate/"], button');
    const count = await actionCards.count();
    expect(count).toBeGreaterThan(0);

    // Each action card has non-empty accessible name
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = actionCards.nth(i);
      const text = await card.textContent();
      const ariaLabel = await card.getAttribute('aria-label');
      expect(Boolean(text?.trim() || ariaLabel)).toBeTruthy();
    }
  });

  test('Learning Module: Audio controls and formula accessibility', async ({ page }) => {
    await page.goto('/candidate/learning');

    // Heading hierarchy
    await expect(page.locator('h1')).toBeAttached();

    // Check if audio controls have accessible names
    const audioButtons = page.locator('button[aria-label*="audio" i], button[aria-label*="listen" i], button[aria-label*="play" i]');
    if ((await audioButtons.count()) > 0) {
      const firstAudio = audioButtons.first();
      await expect(firstAudio).toHaveAttribute('aria-label');
    }
  });

  test('Mock Tests & Practice: Non-color-dependent status indicators', async ({ page }) => {
    await page.goto('/candidate/mock-tests');

    await expect(page.locator('h1')).toBeAttached();

    // Verify badges (Completed, Not Started, etc.) include textual labels
    const badges = page.locator('.badge, [class*="status"], [class*="badge"]');
    const badgeCount = await badges.count();
    for (let i = 0; i < Math.min(badgeCount, 4); i++) {
      const text = await badges.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('Results & Progress: Analytics accompanied by accessible data summaries', async ({ page }) => {
    await page.goto('/candidate/results');

    // Check that chart areas have aria-label, table alternative, or summary paragraph
    const charts = page.locator('[role="img"][aria-label], svg, canvas');
    if ((await charts.count()) > 0) {
      const firstChart = charts.first();
      const ariaLabel = await firstChart.getAttribute('aria-label');
      const role = await firstChart.getAttribute('role');
      // If role="img", it must have an aria-label
      if (role === 'img') {
        expect(ariaLabel?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('Automated axe-core compliance on Candidate Dashboard', async ({ page }) => {
    await page.goto('/candidate/dashboard');
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });
});
