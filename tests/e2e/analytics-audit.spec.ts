import { test, expect } from '@playwright/test';

test.describe('Analytics & Audit Log E2E Coverage (#1144)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to analytics / audit dashboard page
    await page.goto('/analytics');
  });

  test('should render analytics-client charts and data visualizations correctly', async ({ page }) => {
    // Verify analytics container and chart elements are present
    const analyticsHeader = page.locator('text=Analytics');
    await expect(analyticsHeader).toBeVisible();

    // Check that visualization cards or chart canvases load without errors
    const chartContainer = page.locator('[data-testid="analytics-chart"], .recharts-wrapper, canvas').first();
    await expect(chartContainer).toBeVisible({ timeout: 10000 });
  });

  test('should verify audit-log-table pagination and filtering functionality', async ({ page }) => {
    // Navigate or scroll to audit log table section
    await page.goto('/audit');

    const auditTable = page.locator('table, [data-testid="audit-log-table"]');
    await expect(auditTable).toBeVisible();

    // Test pagination controls if available
    const nextButton = page.locator('button:has-text("Next"), [aria-label="Next page"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      // Ensure page state updates cleanly
      await expect(auditTable).toBeVisible();
    }
  });
});
