import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
    // Perform authentication steps.
    await page.goto('/login');

    // Use the dev login shortcut
    await page.getByRole('button', { name: 'Log in as Admin (Dev)' }).click();

    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL('/app/admin');

    // End of authentication steps.
    await page.context().storageState({ path: authFile });
});
