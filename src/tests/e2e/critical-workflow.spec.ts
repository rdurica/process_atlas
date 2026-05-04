import { expect, test, type Page } from '@playwright/test';

async function signInAsOwner(page: Page): Promise<void> {
    await page.goto('/login');
    await page.getByLabel('Email').fill('owner@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
}

test('owner creates a project, creates a workflow, and persists a screen node', async ({
    page,
}, testInfo) => {
    const suffix = `${Date.now()}-${testInfo.workerIndex}`;
    const projectName = `E2E Project ${suffix}`;
    const workflowName = `E2E Workflow ${suffix}`;

    await signInAsOwner(page);

    await page.getByTestId('create-project-open').click();
    await page.getByTestId('project-name-input').fill(projectName);
    await page
        .getByTestId('project-description-input')
        .fill('Created by Playwright critical workflow coverage.');
    await page.getByTestId('create-project-submit').click();

    const projectRow = page.getByRole('row').filter({ hasText: projectName });
    await expect(projectRow).toBeVisible();
    await projectRow.getByRole('link', { name: 'View' }).click();

    await expect(page.getByRole('heading', { level: 1, name: projectName })).toBeVisible();
    await page.getByTestId('create-workflow-open').click();
    await page.getByTestId('workflow-name-input').fill(workflowName);
    await page.getByTestId('create-workflow-submit').click();

    await expect(page).toHaveURL(/\/workflows\/\d+$/);
    await expect(page.getByRole('heading', { name: workflowName })).toBeVisible();

    const pane = page.locator('.react-flow__pane');
    await pane.click({ button: 'right', position: { x: 500, y: 320 } });
    await expect(page.getByTestId('workflow-context-menu')).toBeVisible();
    await page.getByTestId('add-screen-node').click();

    await expect(page.getByText('Screen 2').first()).toBeVisible();
    await expect(page.getByTestId('graph-save-status')).toContainText('Unsaved');

    await page.keyboard.press('Control+S');
    await expect(page.getByTestId('graph-save-status')).toContainText('Saved');
    await page.getByTestId('save-workflow-graph').click();
    await expect(page.getByTestId('graph-save-status')).toContainText('Saved');

    await page.reload();
    await expect(page.getByRole('heading', { name: workflowName })).toBeVisible();
    await expect(page.getByText('Screen 2').first()).toBeVisible();
});
