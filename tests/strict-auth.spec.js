import { test, expect } from '@playwright/test';

test.describe('Strict Authentication Enforcement', () => {

    test('Blocked: Signup with non-org email', async ({ page }) => {
        await page.goto('/login');

        // Navigate to Signup mode
        const signupToggle = page.getByRole('button', { name: /Register/i });
        if (await signupToggle.isVisible()) {
            await signupToggle.click();
        }

        // Find email input and fill with gmail
        await page.getByPlaceholder('name@company.com').fill('unauthorized@gmail.com');
        await page.getByPlaceholder('••••••••').fill('Password123!');

        await page.getByRole('button', { name: /Sign Up/i }).click();

        // Check for error message
        await expect(page.getByText('Only @thegreentruthnyc.com emails are allowed')).toBeVisible();
    });

    test('Allowed: Admin Login with org email', async ({ page }) => {
        await page.goto('/login');

        // This test might fail if we don't have real credentials, 
        // but we can at least check if the domain validation passes or fails before reaching Firebase
        await page.getByPlaceholder('name@company.com').fill('omar@thegreentruthnyc.com');
        await page.getByPlaceholder('••••••••').fill('WrongPassword123');
        await page.getByRole('button', { name: /Sign In/i }).click();

        // It should NOT show the "Only @thegreentruthnyc.com" error.
        await expect(page.getByText('Only @thegreentruthnyc.com emails are allowed')).not.toBeVisible();
    });

});
