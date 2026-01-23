import { test, expect } from '@playwright/test';

test.describe('Client Portal', () => {
  test('should login with access code', async ({ page }) => {
    await page.goto('/portal');

    // Enter access code
    await page.fill('input[name="accessCode"]', 'CLIENT123');
    await page.click('button[type="submit"]');

    // Verify redirected to client portal dashboard
    await expect(page).toHaveURL('/portal/dashboard');
  });

  test('should show error with invalid access code', async ({ page }) => {
    await page.goto('/portal');

    // Enter invalid access code
    await page.fill('input[name="accessCode"]', 'INVALID');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=Ma truy cap khong hop le')).toBeVisible();
  });

  test('should view projects in client portal', async ({ page }) => {
    // Login with access code
    await page.goto('/portal');
    await page.fill('input[name="accessCode"]', 'CLIENT123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/portal/dashboard');

    // Navigate to projects
    await page.click('text=Du an');
    await expect(page.locator('h1')).toContainText('Du an cua ban');
  });

  test('should view project details in client portal', async ({ page }) => {
    // Login with access code
    await page.goto('/portal');
    await page.fill('input[name="accessCode"]', 'CLIENT123');
    await page.click('button[type="submit"]');

    // Navigate to projects and click on one
    await page.goto('/portal/projects');
    await page.click('[data-testid="project-card"]').first();

    // Verify project details page
    await expect(page.locator('[data-testid="project-details"]')).toBeVisible();
  });

  test('should not see internal data in client portal', async ({ page }) => {
    // Login with access code
    await page.goto('/portal');
    await page.fill('input[name="accessCode"]', 'CLIENT123');
    await page.click('button[type="submit"]');

    // Navigate to project details
    await page.goto('/portal/projects');
    await page.click('[data-testid="project-card"]').first();

    // Verify internal data is hidden
    await expect(page.locator('text=Chi phi noi bo')).not.toBeVisible();
    await expect(page.locator('text=Ghi chu noi bo')).not.toBeVisible();
    await expect(page.locator('[data-testid="internal-notes"]')).not.toBeVisible();
  });

  test('should not access admin routes from client portal', async ({ page }) => {
    // Login with access code
    await page.goto('/portal');
    await page.fill('input[name="accessCode"]', 'CLIENT123');
    await page.click('button[type="submit"]');

    // Try to access admin dashboard
    await page.goto('/dashboard');

    // Should be redirected to login or portal
    await expect(page).not.toHaveURL('/dashboard');
  });

  test('should view project progress in client portal', async ({ page }) => {
    // Login with access code
    await page.goto('/portal');
    await page.fill('input[name="accessCode"]', 'CLIENT123');
    await page.click('button[type="submit"]');

    // Navigate to project details
    await page.goto('/portal/projects');
    await page.click('[data-testid="project-card"]').first();

    // Verify progress indicator is visible
    await expect(page.locator('[data-testid="project-progress"]')).toBeVisible();
  });

  test('should logout from client portal', async ({ page }) => {
    // Login with access code
    await page.goto('/portal');
    await page.fill('input[name="accessCode"]', 'CLIENT123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/portal/dashboard');

    // Logout
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/portal');
  });
});
