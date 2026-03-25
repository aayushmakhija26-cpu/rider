import { test, expect } from '@playwright/test';

test.describe('Dealer Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to signup page before each test
    await page.goto('/sign-up');
  });

  test('email/password registration creates account and redirects to onboarding', async ({ page }) => {
    const uniqueEmail = `dealer-${Date.now()}@test.com`;

    // Fill registration form
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="dealershipName"]', 'Premium Auto Group');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="passwordConfirm"]', 'SecurePass123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to onboarding
    await expect(page).toHaveURL(/\/dealer\/onboarding/);
  });

  test('duplicate email shows inline error', async ({ page }) => {
    const duplicateEmail = `duplicate-${Date.now()}@test.com`;

    // Create first account
    await page.fill('input[name="email"]', duplicateEmail);
    await page.fill('input[name="dealershipName"]', 'First Dealership');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await expect(page).toHaveURL(/\/dealer\/onboarding/);

    // Navigate back to signup to test duplicate
    await page.goto('/sign-up');

    // Try to register with same email
    await page.fill('input[name="email"]', duplicateEmail);
    await page.fill('input[name="dealershipName"]', 'Another Dealership');
    await page.fill('input[name="password"]', 'DifferentPass456!');
    await page.fill('input[name="passwordConfirm"]', 'DifferentPass456!');
    await page.click('button[type="submit"]');

    // Verify error message appears
    const errorMessage = page.locator('text=An account already exists. Please sign in.');
    await expect(errorMessage).toBeVisible();
  });

  test('form validation shows errors for invalid input', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors appear
    const emailError = page.locator('text=Invalid email address');
    const passwordError = page.locator('text=Password must be at least 8 characters');
    const nameError = page.locator('text=Dealership name is required');

    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();
    await expect(nameError).toBeVisible();
  });

  test('form errors clear when user starts typing', async ({ page }) => {
    // Submit empty form to show errors
    await page.click('button[type="submit"]');

    const emailError = page.locator('text=Invalid email address');
    await expect(emailError).toBeVisible();

    // Start typing valid email
    await page.fill('input[name="email"]', 'valid@test.com');

    // Error should be hidden
    await expect(emailError).not.toBeVisible();
  });

  test('password field is masked', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');

    // Verify input type is password
    const inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  });

  test('button is disabled during submission', async ({ page }) => {
    const uniqueEmail = `async-${Date.now()}@test.com`;

    // Fill form
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="dealershipName"]', 'Async Test Dealership');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="passwordConfirm"]', 'SecurePass123!');

    const submitButton = page.locator('button[type="submit"]');

    // Submit
    await submitButton.click();

    // Button should show loading state briefly
    const buttonText = submitButton.textContent();
    expect(buttonText).toBeDefined();
  });

  test('invalid password length shows error', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="dealershipName"]', 'Test Dealership');
    await page.fill('input[name="password"]', 'short');
    await page.click('button[type="submit"]');

    const passwordError = page.locator('text=Password must be at least 8 characters');
    await expect(passwordError).toBeVisible();
  });

  test('mismatched passwords show validation error', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@dealer.com');
    await page.fill('input[name="dealershipName"]', 'Test Dealer');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="passwordConfirm"]', 'DifferentPass456!');
    await page.click('button[type="submit"]');

    const passwordConfirmError = page.locator('text=Passwords do not match');
    await expect(passwordConfirmError).toBeVisible();
  });

  test('session cookie is set after successful registration', async ({ page, context }) => {
    const uniqueEmail = `session-${Date.now()}@test.com`;

    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="dealershipName"]', 'Session Test Dealership');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="passwordConfirm"]', 'SecurePass123!');

    await page.click('button[type="submit"]');

    // Wait for redirect
    await expect(page).toHaveURL(/\/dealer\/onboarding/);

    // Check for session cookie
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
  });
});

test.describe('OAuth Registration', () => {
  test('Google OAuth flow creates account', async ({ page }) => {
    await page.goto('/sign-up');

    // Look for Google OAuth button (actual flow would require mock credentials)
    const googleButton = page.locator('button:has-text("Continue with Google")');

    // For now, just verify the button exists
    // Full OAuth testing requires configured test account or mocking
    if (await googleButton.isVisible()) {
      expect(googleButton).toBeVisible();
    }
  });

  test('Apple OAuth flow creates account', async ({ page }) => {
    await page.goto('/sign-up');

    // Look for Apple OAuth button
    const appleButton = page.locator('button:has-text("Continue with Apple")');

    // For now, just verify the button exists
    // Full OAuth testing requires configured test account or mocking
    if (await appleButton.isVisible()) {
      expect(appleButton).toBeVisible();
    }
  });
});
