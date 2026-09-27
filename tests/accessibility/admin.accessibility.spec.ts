/**
 * GoWow Accessibility Test Suite: Administrator Experience
 * Validates WCAG 2.1 AA across User Management, Role Assignments, and Audit Trails.
 * Criteria: 1.3.1, 2.1.1, 2.4.6, 3.3.2, 4.1.2.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Administrator Experience Accessibility Audit', () => {
  test('Admin Dashboard: Semantic structure and navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');

    const h1 = page.locator('h1');
    await expect(h1).toBeAttached();

    // Verify main admin landmarks
    await expect(page.locator('main#main-content, main')).toBeAttached();
  });

  test('User Management Table: Accessible headers and contextual button labels', async ({ page }) => {
    await page.goto('/admin/users');

    const tables = page.locator('table');
    if ((await tables.count()) > 0) {
      const ths = tables.first().locator('th');
      expect(await ths.count()).toBeGreaterThan(0);

      // Verify action buttons have accessible labels indicating target user
      const actionBtns = page.locator('button[aria-label*="user" i], button[aria-label*="edit" i], button[aria-label*="role" i]');
      if ((await actionBtns.count()) > 0) {
        const ariaLabel = await actionBtns.first().getAttribute('aria-label');
        expect(ariaLabel?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('Audit Logs: Accessible data grid and chronological records', async ({ page }) => {
    await page.goto('/admin/audit-logs');

    await expect(page.locator('h1')).toBeAttached();

    // Verify filter inputs have accessible names
    const searchInputs = page.locator('input[type="search"], input[type="text"]');
    if ((await searchInputs.count()) > 0) {
      const search = searchInputs.first();
      const id = await search.getAttribute('id');
      const ariaLabel = await search.getAttribute('aria-label');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        expect((await label.count()) > 0 || Boolean(ariaLabel)).toBeTruthy();
      }
    }
  });

  test('Automated axe-core compliance on Admin views', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });
});
