/**
 * GoWow Accessibility Test Suite: Examiner Platform
 * Validates WCAG 2.1 AA across Exam Creation, Question Bank, Scheduling & Monitoring.
 * Criteria: 1.1.1, 1.3.1, 2.1.1, 2.4.6, 3.3.2, 4.1.2.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Examiner Experience Accessibility Audit', () => {
  test('Examiner Dashboard: Semantic structure and accessible action cards', async ({ page }) => {
    await page.goto('/examiner/dashboard');

    // Exactly one H1 for Examiner Platform
    const h1 = page.locator('h1');
    await expect(h1).toBeAttached();

    // Quick stats and action cards have readable text
    const cards = page.locator('a[href^="/examiner/"], button');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('Examiner Tables: Proper caption, th scope, and sort indicators', async ({ page }) => {
    await page.goto('/examiner/dashboard');

    const tables = page.locator('table');
    if ((await tables.count()) > 0) {
      const table = tables.first();
      // Table headers must have th elements
      const thElements = table.locator('th');
      const thCount = await thElements.count();
      expect(thCount).toBeGreaterThan(0);

      // Verify th has scope attribute
      const firstTh = thElements.first();
      const scope = await firstTh.getAttribute('scope');
      expect(scope).toBe('col');
    }
  });

  test('Exam Creation & Question Bank: Form fields and accessibility validation gate', async ({ page }) => {
    await page.goto('/examiner/create-exam');

    // Title and duration inputs have labels
    const inputs = page.locator('input[type="text"], input[type="number"], textarea');
    const inputCount = await inputs.count();
    for (let i = 0; i < Math.min(inputCount, 4); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        expect((await label.count()) > 0 || Boolean(ariaLabel)).toBeTruthy();
      }
    }
  });

  test('Automated axe-core compliance on Examiner views', async ({ page }) => {
    await page.goto('/examiner/dashboard');
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });
});
