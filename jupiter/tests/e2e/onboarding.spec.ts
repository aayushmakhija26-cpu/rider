import { test, expect } from '@playwright/test';

test.describe('Onboarding Checklist', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Register a dealer and get logged in
    // This assumes the registration flow from Story 2.1
    await page.goto('/dealer/sign-up');
  });

  test('should display onboarding page after dealer registration', async ({
    page,
  }) => {
    // Register a new dealer
    const email = `dealer-${Date.now()}@test.com`;
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="dealershipName"]', 'Test Dealership');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="passwordConfirm"]', 'TestPassword123!');
    await page.click('button:has-text("Register")');

    // Should redirect to onboarding page
    await expect(page).toHaveURL(/\/dealer\/onboarding/);

    // Should display all 4 steps
    await expect(page.locator('text=Brand Setup')).toBeVisible();
    await expect(page.locator('text=DMS Connection')).toBeVisible();
    await expect(page.locator('text=Staff Setup')).toBeVisible();
    await expect(page.locator('text=Billing Setup')).toBeVisible();
  });

  test('should show status badges for each step', async ({ page }) => {
    await page.goto('/dealer/onboarding');

    // Each step should have a status badge
    const statusBadges = page.locator('[class*="text-xs"][class*="font-medium"]');
    const count = await statusBadges.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should expand step when clicked and show inline content', async ({
    page,
  }) => {
    await page.goto('/dealer/onboarding');

    // Click on Brand Setup step
    await page.locator('button:has-text("Brand Setup")').first().click();

    // Content should expand (look for the form fields or placeholder)
    await expect(page.locator('text=Logo URL')).toBeVisible();
  });

  test('should collapse step when clicked again', async ({ page }) => {
    await page.goto('/dealer/onboarding');

    const stepButton = page.locator('button:has-text("Brand Setup")').first();

    // Expand
    await stepButton.click();
    await expect(page.locator('text=Logo URL')).toBeVisible();

    // Collapse
    await stepButton.click();
    await expect(page.locator('text=Logo URL')).not.toBeVisible();
  });

  test('should mark step complete when Mark as Complete is clicked', async ({
    page,
  }) => {
    await page.goto('/dealer/onboarding');

    // Expand Brand Setup
    await page.locator('button:has-text("Brand Setup")').first().click();

    // Click Mark as Complete
    await page.locator('button:has-text("Mark as Complete")').first().click();

    // Wait for the action to complete
    await page.waitForTimeout(500);

    // Step should show completed badge (emerald color)
    const stepCard = page.locator('button:has-text("Brand Setup")').first();
    const badge = stepCard.locator('[class*="text-financial-positive"]');
    await expect(badge).toBeVisible();
  });

  test('should show completion banner when all steps are complete', async ({
    page,
  }) => {
    await page.goto('/dealer/onboarding');

    // Complete all steps
    const steps = ['Brand Setup', 'DMS Connection', 'Staff Setup', 'Billing Setup'];
    for (const step of steps) {
      // Expand step
      await page.locator(`button:has-text("${step}")`).first().click();

      // Mark as complete
      const completeButton = page.locator('button:has-text("Mark as Complete")');
      if (await completeButton.isVisible()) {
        await completeButton.first().click();
        await page.waitForTimeout(300);
      }
    }

    // Banner should be visible
    await expect(
      page.locator('text=All set! Your dealership is ready')
    ).toBeVisible();
    await expect(
      page.locator('text=Continue to Campaigns')
    ).toBeVisible();
  });

  test('should show notification when step is saved', async ({ page }) => {
    await page.goto('/dealer/onboarding');

    // Expand a step
    await page.locator('button:has-text("Brand Setup")').first().click();

    // Complete it
    await page.locator('button:has-text("Mark as Complete")').first().click();

    // Should show success notification (emerald background)
    const notification = page.locator(
      '[class*="bg-financial-positive"][class*="bottom"]'
    );
    await expect(notification).toBeVisible();
  });

  test('DEALER_STAFF should not be able to access onboarding page', async ({
    page,
  }) => {
    // First, set up a dealer account and staff user
    // Then try to access /dealer/onboarding as the staff user
    // This would require creating helper functions for account setup
    // For now, this is a placeholder for the test structure
    test.skip();
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    await page.goto('/dealer/onboarding');

    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check for proper button labels
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    // Check for proper form structure (when expanded)
    await page
      .locator('button:has-text("Brand Setup")')
      .first()
      .click();
    const formFields = page.locator('label');
    const labelCount = await formFields.count();
    expect(labelCount).toBeGreaterThanOrEqual(1);
  });

  test('should allow steps to be completed in any order', async ({ page }) => {
    await page.goto('/dealer/onboarding');

    // Complete Billing step first (non-sequential)
    await page
      .locator('button:has-text("Billing Setup")')
      .first()
      .click();
    await page.locator('button:has-text("Mark as Complete")').first().click();
    await page.waitForTimeout(300);

    // Then complete Brand Setup
    await page
      .locator('button:has-text("Brand Setup")')
      .first()
      .click();
    const completeButtons = page.locator('button:has-text("Mark as Complete")');
    if (await completeButtons.first().isVisible()) {
      await completeButtons.first().click();
      await page.waitForTimeout(300);
    }

    // Both should show as complete
    const billingBadge = page
      .locator('button:has-text("Billing Setup")')
      .first()
      .locator('[class*="text-financial-positive"]');
    const brandingBadge = page
      .locator('button:has-text("Brand Setup")')
      .first()
      .locator('[class*="text-financial-positive"]');

    await expect(billingBadge).toBeVisible();
    await expect(brandingBadge).toBeVisible();
  });
});
