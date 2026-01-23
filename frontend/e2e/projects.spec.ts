import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@bcagency.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display projects list', async ({ page }) => {
    await page.goto('/dashboard/projects');
    await expect(page.locator('h1')).toContainText('Du an');
  });

  test('should create new project', async ({ page }) => {
    await page.goto('/dashboard/projects');
    await page.click('text=Them du an');
    await page.fill('input[name="name"]', 'Test Project E2E');
    await page.fill('input[name="code"]', 'E2E01');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Project E2E')).toBeVisible();
  });

  test('should view project details', async ({ page }) => {
    await page.goto('/dashboard/projects');
    await page.click('text=Test Project E2E');
    await expect(page.locator('h1')).toContainText('Test Project E2E');
  });

  test('should edit project', async ({ page }) => {
    await page.goto('/dashboard/projects');
    await page.click('text=Test Project E2E');
    await page.click('[data-testid="edit-project"]');
    await page.fill('input[name="name"]', 'Test Project E2E Updated');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Project E2E Updated')).toBeVisible();
  });
});
