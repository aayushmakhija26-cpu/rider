import { test, expect } from '@playwright/test';

test.describe('Staff Role Assignment', () => {
  test('should allow dealer admin to change staff role', async ({ page }) => {
    // Step 1: Register dealer admin
    const adminEmail = `admin-${Date.now()}@test.com`;
    const staffEmail = `staff-${Date.now()}@test.com`;

    await page.goto('/sign-up');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="dealershipName"]', 'Test Dealership');
    await page.fill('input[name="password"]', 'AdminPass123!');
    await page.fill('input[name="passwordConfirm"]', 'AdminPass123!');
    await page.click('button:has-text("Register")');

    await expect(page).toHaveURL(/\/dealer\/onboarding/);

    // Step 2: Send staff invite
    await page.locator('button:has-text("Staff Setup")').first().click();
    await page.waitForTimeout(300);
    await page.fill('input[id="staff-email"]', staffEmail);
    await page.click('button:has-text("Send Invite")');

    await expect(page.locator(`text=Invite sent to ${staffEmail}`)).toBeVisible({
      timeout: 5000,
    });

    // Step 3: Verify role selector appears
    await page.waitForTimeout(500);
    const roleSelector = page.locator(`select`).first();
    await expect(roleSelector).toBeVisible();

    // Step 4: Change role to DEALER_ADMIN
    const currentRole = await roleSelector.inputValue();
    if (currentRole === 'DEALER_STAFF') {
      await roleSelector.selectOption('DEALER_ADMIN');
      // Wait for the change to be reflected
      await page.waitForTimeout(1000);
    }

    // Step 5: Verify role was updated
    const updatedRole = await roleSelector.inputValue();
    expect(updatedRole).toBe('DEALER_ADMIN');
  });

  test('should prevent deactivated staff from seeing role selector', async ({ page }) => {
    const adminEmail = `admin-${Date.now()}@test.com`;
    const staffEmail = `staff-${Date.now()}@test.com`;

    // Register and setup
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

    // Deactivate the staff member
    await page.waitForTimeout(500);
    const deactivateButton = page.locator('button:has-text("Deactivate")').first();
    await expect(deactivateButton).toBeVisible();
    await deactivateButton.click();

    // Confirm deactivation
    await page.click('button:has-text("Yes, deactivate")');

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify role selector is gone (replaced with static badge)
    const selectElements = await page.locator('select').count();
    expect(selectElements).toBe(0);

    // Verify deactivated status is shown
    await expect(page.locator('text=Deactivated')).toBeVisible();
  });
});
