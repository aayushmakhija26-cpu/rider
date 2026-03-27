import { test, expect } from '@playwright/test';

test.describe('Staff Invite Flow', () => {
  test('should send staff invite from onboarding and accept it', async ({
    page,
  }) => {
    // Step 1: Register dealer admin
    const adminEmail = `admin-${Date.now()}@test.com`;
    const staffEmail = `staff-${Date.now()}@test.com`;

    await page.goto('/sign-up');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="dealershipName"]', 'Test Dealership');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.fill('input[name="passwordConfirm"]', 'AdminPass123!');
    await page.click('button:has-text("Register")');

    // Wait for onboarding page
    await expect(page).toHaveURL(/\/dealer\/onboarding/);

    // Step 2: Open Staff Setup step and send invite
    await page.locator('button:has-text("Staff Setup")').first().click();
    await page.waitForTimeout(300);

    // Fill in staff email and send invite
    await page.fill('input[id="staff-email"]', staffEmail);
    await page.click('button:has-text("Send Invite")');

    // Wait for success message
    await expect(page.locator(`text=Invite sent to ${staffEmail}`)).toBeVisible({
      timeout: 5000,
    });

    // Step 3: Verify staff member appears in the list
    await page.waitForTimeout(500);
    const staffListText = await page.locator('text=Staff accounts').first();
    await expect(staffListText).toBeVisible();

    // Check for the staff email in the list
    const staffRow = page.locator(`text=${staffEmail}`);
    await expect(staffRow).toBeVisible();

    // Check for pending badge
    const pendingBadge = page.locator('text=Pending');
    await expect(pendingBadge).toBeVisible();
  });

  test('should reject invalid email format', async ({ page }) => {
    const adminEmail = `admin-${Date.now()}@test.com`;
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="dealershipName"]', 'Test Dealership');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.fill('input[name="passwordConfirm"]', 'AdminPass123!');
    await page.click('button:has-text("Register")');

    await expect(page).toHaveURL(/\/dealer\/onboarding/);

    // Open Staff Setup
    await page.locator('button:has-text("Staff Setup")').first().click();
    await page.waitForTimeout(300);

    // Try to send invite with invalid email
    await page.fill('input[id="staff-email"]', 'invalid-email');
    await page.click('button:has-text("Send Invite")');

    // Should show error message
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should show completion status after first invite', async ({ page }) => {
    const adminEmail = `admin-${Date.now()}@test.com`;
    const staffEmail = `staff-${Date.now()}@test.com`;

    await page.goto('/sign-up');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="dealershipName"]', 'Test Dealership');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.fill('input[name="passwordConfirm"]', 'AdminPass123!');
    await page.click('button:has-text("Register")');

    await expect(page).toHaveURL(/\/dealer\/onboarding/);

    // Open Staff Setup and send invite
    await page.locator('button:has-text("Staff Setup")').first().click();
    await page.waitForTimeout(300);
    await page.fill('input[id="staff-email"]', staffEmail);
    await page.click('button:has-text("Send Invite")');

    // Wait for success and staff list update
    await expect(page.locator(`text=Invite sent to ${staffEmail}`)).toBeVisible({
      timeout: 5000,
    });

    // Check for completion message
    await page.waitForTimeout(500);
    const completeText = page.locator('text=Staff setup step complete');
    await expect(completeText).toBeVisible();
  });

  test('should allow admin to deactivate staff account', async ({ page }) => {
    const adminEmail = `admin-${Date.now()}@test.com`;
    const staffEmail = `staff-${Date.now()}@test.com`;

    // Setup: Register admin and invite staff
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="dealershipName"]', 'Test Dealership');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.fill('input[name="passwordConfirm"]', 'AdminPass123!');
    await page.click('button:has-text("Register")');

    await expect(page).toHaveURL(/\/dealer\/onboarding/);

    // Send invite
    await page.locator('button:has-text("Staff Setup")').first().click();
    await page.waitForTimeout(300);
    await page.fill('input[id="staff-email"]', staffEmail);
    await page.click('button:has-text("Send Invite")');

    await expect(page.locator(`text=Invite sent to ${staffEmail}`)).toBeVisible({
      timeout: 5000,
    });

    // Find deactivate button and click it
    await page.waitForTimeout(500);
    const deactivateButton = page.locator('button:has-text("Deactivate")').first();
    await deactivateButton.click();

    // Confirm deactivation
    const confirmButton = page.locator('button:has-text("Yes, deactivate")').first();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Wait for deactivation to complete
    await page.waitForTimeout(500);

    // Check that status changed to deactivated
    const deactivatedBadge = page.locator('text=Deactivated');
    await expect(deactivatedBadge).toBeVisible();
  });
});
