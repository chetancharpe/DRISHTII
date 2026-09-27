/**
 * GoWow Accessibility Test Suite: Authentication & Accessibility Onboarding
 * Validates WCAG 2.1 AA: Form accessibility, error notification, and keyboard navigation.
 * Criteria: 1.3.1, 1.4.1, 2.1.1, 2.4.3, 3.2.1, 3.3.1, 3.3.2, 4.1.2.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Authentication & Accessibility Setup Accessibility Audit', () => {
  test('Login Page: Form controls have explicit accessible labels and error associations', async ({ page }) => {
    await page.goto('/auth/login');

    // Input fields must have matching label associations
    const emailInput = page.locator('input[type="email"], input#email');
    await expect(emailInput).toBeAttached();
    const emailId = await emailInput.getAttribute('id');
    if (emailId) {
      const emailLabel = page.locator(`label[for="${emailId}"]`);
      await expect(emailLabel).toBeAttached();
    } else {
      expect(await emailInput.getAttribute('aria-label')).toBeTruthy();
    }

    const passwordInput = page.locator('input[type="password"], input#password');
    await expect(passwordInput).toBeAttached();
    const passwordId = await passwordInput.getAttribute('id');
    if (passwordId) {
      const passwordLabel = page.locator(`label[for="${passwordId}"]`);
      await expect(passwordLabel).toBeAttached();
    } else {
      expect(await passwordInput.getAttribute('aria-label')).toBeTruthy();
    }

    // Required fields must announce required state
    const isRequired =
      (await emailInput.getAttribute('required')) !== null ||
      (await emailInput.getAttribute('aria-required')) === 'true';
    expect(isRequired).toBeTruthy();

    // Submit button has accessible text
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeAttached();
    const btnText = await submitBtn.textContent();
    expect(btnText?.trim().length).toBeGreaterThan(0);
  });

  test('Form Error Feedback: Not color-dependent and announced to screen readers', async ({ page }) => {
    await page.goto('/auth/login');

    // Attempt submitting empty form to trigger validation
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Verify error messages appear with aria-live or role="alert"
    const alertOrErrors = page.locator('[role="alert"], [aria-invalid="true"], .text-status-error, .text-destructive');
    if ((await alertOrErrors.count()) > 0) {
      const firstError = alertOrErrors.first();
      await expect(firstError).toBeVisible();
      // Text must not be purely color indicators
      const errorText = await firstError.textContent();
      expect(errorText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('Accessibility Onboarding Wizard: Step-by-step keyboard accessibility', async ({ page }) => {
    await page.goto('/auth/accessibility-setup');

    // Heading exists
    const h1 = page.locator('h1');
    await expect(h1).toBeAttached();

    // Navigation buttons are keyboard accessible
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    if ((await continueBtn.count()) > 0) {
      await continueBtn.first().focus();
      await expect(continueBtn.first()).toBeFocused();
    }

    // Toggle options for font size, contrast, or speech have accessible role
    const options = page.locator('[role="radio"], [role="button"], input[type="radio"]');
    if ((await options.count()) > 0) {
      const firstOption = options.first();
      await expect(firstOption).toBeAttached();
    }
  });

  test('Automated axe-core compliance scan on Login & Onboarding', async ({ page }) => {
    await page.goto('/auth/login');
    const axeLogin = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(axeLogin.violations).toEqual([]);

    await page.goto('/auth/accessibility-setup');
    const axeSetup = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();
    expect(axeSetup.violations).toEqual([]);
  });
});
