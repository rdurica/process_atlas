import { expect, test } from '@playwright/test';

test('owner can sign in and see the dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('owner@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible();
    await expect(page.getByText('Your Workspaces')).toBeVisible();
});
