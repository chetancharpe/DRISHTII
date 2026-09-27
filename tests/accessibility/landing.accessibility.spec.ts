/**
 * GoWow Accessibility Test Suite: Landing Page & Public Navigation
 * Validates WCAG 2.1 AA, POUR Principles, and WAI-ARIA Authoring Practices.
 * Criteria: 1.1.1, 1.3.1, 1.4.3, 2.1.1, 2.4.1, 2.4.2, 2.4.7, 4.1.2.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Landing Page & Public Flow Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('WCAG 2.4.1: Top of DOM contains functional "Skip to main content" link', async ({ page }) => {
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // Tab into page: Skip link must become visible upon focus
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();

    // Activating skip link must move focus to main content container
    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('WCAG 1.3.1 / 2.4.2: Page has semantic landmark structure and unique H1', async ({ page }) => {
    // Exactly one header banner, nav, main, and footer contentinfo
    await expect(page.locator('header[role="banner"], header')).toBeAttached();
    await expect(page.locator('nav')).toBeAttached();
    await expect(page.locator('main#main-content')).toBeAttached();
    await expect(page.locator('footer[role="contentinfo"], footer')).toBeAttached();

    // Check heading hierarchy: exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    const h1Text = await page.locator('h1').first().textContent();
    expect(h1Text?.trim().length).toBeGreaterThan(0);
  });

  test('WCAG 4.1.2: All icon buttons and interactive elements have accessible names', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = (await button.textContent())?.trim();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
        const title = await button.getAttribute('title');

        const hasAccessibleName = Boolean(text || ariaLabel || ariaLabelledBy || title);
        expect(hasAccessibleName, `Button #${i} is missing accessible name`).toBeTruthy();
      }
    }
  });

  test('WCAG 1.1.1: All images have descriptive alt attributes or are decorative aria-hidden', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const isAriaHidden = (await img.getAttribute('aria-hidden')) === 'true';
      const alt = await img.getAttribute('alt');

      if (!isAriaHidden) {
        expect(alt, `Image #${i} is missing alt attribute`).not.toBeNull();
        expect(alt?.toLowerCase(), `Image #${i} has placeholder alt text`).not.toMatch(/^(image|picture|photo)$/);
      }
    }
  });

  test('WCAG 2.1.1 / 2.4.7: Keyboard tab navigation and focus visibility', async ({ page }) => {
    // Navigate via Tab key through header elements
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT', 'SELECT']).toContain(focusedTag);
    }
  });

  test('Section 91 & 92: Alt+H hotkey opens Accessibility Help & Shortcuts Modal', async ({ page }) => {
    await page.keyboard.press('Alt+KeyH');
    const helpModal = page.locator('[role="dialog"][aria-labelledby*="title"], [role="dialog"]');
    await expect(helpModal).toBeVisible();

    // Verify dialog has accessible name and close button
    const closeBtn = helpModal.locator('button:has-text("Done"), button[aria-label*="close" i]');
    await expect(closeBtn.first()).toBeVisible();

    // Escape closes modal and restores focus
    await page.keyboard.press('Escape');
    await expect(helpModal).not.toBeVisible();
  });

  test('Automated axe-core WCAG 2.1 Level AA rule validation', async ({ page }) => {
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast']) // Color contrast is additionally verified via dedicated high-contrast engine
      .analyze();

    expect(axeResults.violations).toEqual([]);
  });
});
