import { test, expect } from '@playwright/test';

test.describe('The Gauntlet', () => {

    test('Rep Flow: Schedule Activation and Log Sale', async ({ page }) => {
        test.setTimeout(180000); // Allow time for iterating 46 products (3 minutes)
        // 1. Login as Sales Rep
        await page.goto('/login');
        await page.getByRole('button', { name: 'Log in as Sales Rep (Dev)' }).click();
        await page.waitForURL('/app');

        // 1.5 Create New Lead (Ensure data exists)
        await page.getByRole('link', { name: 'New Lead' }).click();
        await page.waitForURL('/app/new-lead');

        const timestamp = Date.now();
        const leadName = `Gauntlet Disp ${timestamp}`;
        // Dispensary Name is first input
        await page.locator('input[type="text"]').first().fill(leadName);
        await page.getByPlaceholder('123 Main St, New York, NY').fill('123 Test St');
        await page.getByPlaceholder('Name').fill('Test Manager');
        // License Number (Mandatory)
        await page.getByPlaceholder('Optional until first sale').fill('GL-TEST-12345');

        // Meeting Date (Mandatory)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await page.locator('input[type="date"]').fill(tomorrow.toISOString().split('T')[0]);

        // Handle Alert
        page.once('dialog', async dialog => {
            console.log(`Dialog message: ${dialog.message()} `);
            await dialog.accept();
        });

        // Submit
        await page.getByRole('button', { name: /Add Lead/i }).click();

        // Wait for redirect to Dashboard
        await page.waitForURL('/app');

        // 2. Log a Sale (The Gauntlet Primary Goal)
        // Use UI navigation to preserve Dev Login state (which is not persistent across reloads)
        await page.getByRole('link', { name: 'Log Sale' }).click();
        await page.waitForURL('/app/log-sale');

        // Select Lead
        // Wait for leads to load
        await expect(page.getByText('Who are you selling to?')).toBeVisible();
        const dispensarySelect = page.locator('select').first();
        await expect(dispensarySelect).toBeVisible();

        // Wait for the lead to appear in the select (retrying selectOption is better than checking option visibility)
        await page.waitForFunction((name) => {
            const select = document.querySelector('select');
            return select && Array.from(select.options).some(o => o.value === name);
        }, leadName, { timeout: 15000 });

        await dispensarySelect.selectOption({ value: leadName });

        // Verify selection stuck
        await expect(dispensarySelect).toHaveValue(leadName);

        await page.getByRole('button', { name: 'Next' }).click();

        // Select Brand (Step 1)
        await expect(page.getByRole('heading', { level: 2, name: 'Select Brands' })).toBeVisible();
        // Click the first brand card (div with border-2)
        // Select 'Honey King' explicitly
        await page.getByText('Honey King').click();

        // Verify selection (CheckCircle icon appears)
        await expect(page.locator('.border-brand-500')).toBeVisible();

        await page.getByRole('button', { name: 'Next' }).click();

        // Wait for products (Step 2)
        await expect(page.locator('.product-card').first()).toBeVisible({ timeout: 15000 });

        // "Run the Gauntlet" - Test EVERY SKU
        const products = page.locator('.product-card');
        const count = await products.count();
        console.log(`Found ${count} products to test.`);

        for (let i = 0; i < count; i++) {
            const product = products.nth(i);
            // Click + button (fourth button in the controls: Unit, Case, -, +)
            await product.locator('button').nth(3).click({ force: true });
        }

        // Submit
        // First "Next" to get to Review
        await page.getByRole('button', { name: 'Next' }).click();

        // Handle Second Alert (Sale Logged)
        page.once('dialog', async dialog => {
            console.log(`Sale Dialog: ${dialog.message()} `);
            await dialog.accept();
        });

        // Final Confirm
        await page.getByRole('button', { name: /Confirm Sale/i }).click();

        // Wait for redirect to Dashboard
        await page.waitForURL('/app');
    });

    test('Admin Flow: Verify Dashboard Access', async ({ page }) => {
        await page.goto('/login');
        await page.getByRole('button', { name: 'Log in as Admin (Dev)' }).click();
        await page.waitForURL('/app/admin');

        // Verify Title
        await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

        // Verify Content
        await expect(page.getByText('Quarterly Sales & Commissions')).toBeVisible();
    });

    test('Brand Flow: Verify Brand Dashboard', async ({ page }) => {
        await page.goto('/brand/login');

        // Use Dev Shortcut
        await page.getByRole('button', { name: 'Wanders New York' }).click();

        // Handle Step 2: Gate (Bypass)
        await page.getByRole('button', { name: /Bypass Gate/i }).click();

        await page.waitForURL('/brand');

        // Verify Welcome Message
        await expect(page.locator('text=Welcome back, Wanders New York!')).toBeVisible();

        // Verify Stats present
        await expect(page.getByText('Total Revenue')).toBeVisible();
    });

});
