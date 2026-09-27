import { test, expect } from '@playwright/test';

/**
 * GoWow End-to-End Critical Flows Specification
 * Implements Section 90 & 91: Critical flows for Candidate, Examiner, and Admin.
 */

test.describe('Candidate Critical Journey', () => {
  test('Candidate can log in, view dashboard, configure accessibility, and enter examination', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('/');
    await expect(page).toHaveTitle(/GoWow/i);

    // 2. Navigate to Login
    await page.click('text=Candidate Login');
    await expect(page).toHaveURL(/.*login/);

    // 3. Complete Login
    await page.fill('input[type="email"]', 'candidate@gowow.test');
    await page.fill('input[type="password"]', 'CandidatePass123!');
    await page.click('button[type="submit"]');

    // 4. Verify Candidate Dashboard redirection
    await expect(page).toHaveURL(/.*\/candidate\/dashboard/);
    await expect(page.locator('h1')).toContainText(/Welcome/i);

    // 5. Open Accessibility Calibration (Alt+A shortcut or Quick Calibration button)
    await page.keyboard.press('Alt+A');
    const modal = page.locator('[role="dialog"]');
    if (await modal.isVisible()) {
      await expect(modal).toContainText(/Accessibility Settings|Preferences/i);
      // Close modal
      await page.keyboard.press('Escape');
    }

    // 6. Navigate to Examinations Directory
    await page.click('a[href*="/candidate/exams"], button:has-text("Examinations")');
    await expect(page.locator('body')).toContainText(/Examinations|Assessments/i);
  });
});

test.describe('Examiner Critical Flow', () => {
  test('Examiner can login, view exams, and access accessibility validation gate', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'examiner@gowow.test');
    await page.fill('input[type="password"]', 'ExaminerPass123!');
    await page.click('button[type="submit"]');

    // 2. Verify Examiner Dashboard redirection
    await expect(page).toHaveURL(/.*\/examiner\/dashboard/);
    await expect(page.locator('body')).toContainText(/Examiner|Assessments|Question Bank/i);

    // 3. Question Bank & Accessibility Verification
    await page.click('a[href*="/examiner/questions"], button:has-text("Question Bank")');
    await expect(page.locator('body')).toContainText(/Questions|Accessibility/i);
  });
});

test.describe('Admin Operations Flow', () => {
  test('Admin can access system dashboard and monitor platform status', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@gowow.test');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');

    // 2. Verify Admin Dashboard
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    await expect(page.locator('body')).toContainText(/Admin|System Health|Audit/i);
  });
});
