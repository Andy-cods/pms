import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@bcagency.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display tasks list', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await expect(page.locator('h1')).toContainText('Cong viec');
  });

  test('should create new task', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await page.click('text=Them cong viec');

    // Fill task form
    await page.fill('input[name="title"]', 'Test Task E2E');
    await page.fill('textarea[name="description"]', 'This is a test task created by E2E test');

    // Select priority
    await page.click('[data-testid="priority-select"]');
    await page.click('text=Cao');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Task E2E')).toBeVisible();
  });

  test('should view task details', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await page.click('text=Test Task E2E');
    await expect(page.locator('h2')).toContainText('Test Task E2E');
  });

  test('should update task status by clicking', async ({ page }) => {
    await page.goto('/dashboard/tasks');

    // Find the task and click on status dropdown
    const taskRow = page.locator('text=Test Task E2E').locator('..');
    await taskRow.locator('[data-testid="status-select"]').click();
    await page.click('text=Dang thuc hien');

    // Verify status changed
    await expect(taskRow.locator('text=Dang thuc hien')).toBeVisible();
  });

  test('should update task status via drag and drop', async ({ page }) => {
    await page.goto('/dashboard/tasks?view=kanban');

    // Find the task card
    const taskCard = page.locator('[data-testid="task-card"]').filter({ hasText: 'Test Task E2E' });

    // Find the target column (Done)
    const doneColumn = page.locator('[data-testid="kanban-column-done"]');

    // Drag and drop
    await taskCard.dragTo(doneColumn);

    // Verify task is in the new column
    await expect(doneColumn.locator('text=Test Task E2E')).toBeVisible();
  });

  test('should edit task', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await page.click('text=Test Task E2E');
    await page.click('[data-testid="edit-task"]');

    await page.fill('input[name="title"]', 'Test Task E2E Updated');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Test Task E2E Updated')).toBeVisible();
  });

  test('should delete task', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await page.click('text=Test Task E2E Updated');
    await page.click('[data-testid="delete-task"]');

    // Confirm deletion
    await page.click('text=Xac nhan');

    await expect(page.locator('text=Test Task E2E Updated')).not.toBeVisible();
  });
});
