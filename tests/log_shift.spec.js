import { test, expect } from '@playwright/test';

test.describe('Log Shift Feature', () => {
  test('Sales rep can log a new shift', async ({ page }) => {
    // 1. Login as Sales Rep
    await page.goto('/login');
    await page.getByRole('button', { name: 'Log in as Sales Rep (Dev)' }).click();
    await page.waitForURL('/app');

    // 2. Navigate to Log Shift page
    await page.getByRole('link', { name: 'Log Shift' }).click();
    await page.waitForURL('/app/log-shift');

    // 3. Fill out the form
    await page.getByPlaceholder('Store Name').fill('Test Dispensary');
    await page.locator('select').first().selectOption({ label: 'Five Boroughs (NYC)' });
    await page.getByRole('button', { name: '🍯 Honey King' }).click();

    const now = new Date();
    const startTime = new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const endTime = now.toISOString().slice(0, 16);

    await page.locator('input[type="datetime-local"]').first().fill(startTime);
    await page.locator('input[type="datetime-local"]').nth(1).fill(endTime);

    await page.getByPlaceholder('420').fill('50');
    await page.getByPlaceholder('420.00').fill('10.50');

    // 4. Submit the form
    await page.getByRole('button', { name: 'Log Shift' }).click();

    // 5. Verify success
    await page.waitForURL('/history');
    await expect(page.getByText('Shift logged successfully!')).toBeVisible();
  });
});
