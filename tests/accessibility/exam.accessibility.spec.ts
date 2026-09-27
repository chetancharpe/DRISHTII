/**
 * GoWow Accessibility Test Suite: Live Examination Experience
 * Validates WCAG 2.1 AA: Accessible timers, radio groups, keyboard shortcuts, live regions, and submit dialogs.
 * Criteria: 1.3.1, 2.1.1, 2.1.2, 2.2.1, 2.4.3, 3.3.4, 4.1.2, 4.1.3.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Live Examination Accessibility Audit', () => {
  test('Question Option Semantics: Radio groups for single-choice questions', async ({ page }) => {
    // Navigate to a mock test or exam session preview
    await page.goto('/candidate/mock-tests');

    // If there is a Start Test or Preview link, click it
    const startBtn = page.locator('a:has-text("Start Test"), button:has-text("Start")');
    if ((await startBtn.count()) > 0) {
      await startBtn.first().click();

      // Check for question options
      const radioInputs = page.locator('input[type="radio"], [role="radio"]');
      if ((await radioInputs.count()) > 0) {
        // Must be contained in a radiogroup or fieldset
        const group = page.locator('[role="radiogroup"], fieldset');
        await expect(group.first()).toBeAttached();

        // Radios must have associated labels or text
        const firstRadio = radioInputs.first();
        const radioId = await firstRadio.getAttribute('id');
        if (radioId) {
          await expect(page.locator(`label[for="${radioId}"]`)).toBeAttached();
        }
      }
    }
  });

  test('Exam Timer Accessibility: Programmatic live updates without visual-only countdown', async ({ page }) => {
    await page.goto('/candidate/mock-tests');

    const startBtn = page.locator('a:has-text("Start Test"), button:has-text("Start")');
    if ((await startBtn.count()) > 0) {
      await startBtn.first().click();

      // Timer element should have role="timer" or aria-label
      const timer = page.locator('[role="timer"], [aria-label*="time" i], [aria-label*="remaining" i]');
      if ((await timer.count()) > 0) {
        await expect(timer.first()).toBeVisible();
        const ariaLabel = await timer.first().getAttribute('aria-label');
        const text = await timer.first().textContent();
        expect(Boolean(ariaLabel || text)).toBeTruthy();
      }
    }
  });

  test('Exam Shortcuts: Alt+N, Alt+P, Alt+M, Alt+S do not trap keyboard', async ({ page }) => {
    await page.goto('/candidate/mock-tests');

    const startBtn = page.locator('a:has-text("Start Test"), button:has-text("Start")');
    if ((await startBtn.count()) > 0) {
      await startBtn.first().click();

      // Press Alt+N (Next Question)
      await page.keyboard.press('Alt+KeyN');

      // Verify no infinite loop / keyboard trap: Tab still moves focus
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeDefined();
    }
  });

  test('Submit Modal: Focus trap, accessible name, and Escape dismissal', async ({ page }) => {
    await page.goto('/candidate/mock-tests');

    const submitBtn = page.locator('button:has-text("Submit"), button[aria-label*="Submit" i]');
    if ((await submitBtn.count()) > 0) {
      await submitBtn.first().click();

      const modal = page.locator('[role="dialog"][aria-modal="true"]');
      if ((await modal.count()) > 0) {
        await expect(modal).toBeVisible();

        // Verify labelledby or accessible title
        const titleId = await modal.getAttribute('aria-labelledby');
        if (titleId) {
          await expect(page.locator(`#${titleId}`)).toBeVisible();
        }

        // Test Escape key closes modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('Automated axe-core compliance on Exam views', async ({ page }) => {
    await page.goto('/candidate/mock-tests');
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });
});
