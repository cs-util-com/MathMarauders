import { test, expect } from '@playwright/test';

test.describe('run lifecycle', () => {
  test('starts a run without console warnings and provides gate choices', async ({ page }) => {
    const consoleIssues = [];
    const pageErrors = [];
    const allowedWarningPatterns = [
      /cdn\.tailwindcss\.com should not be used in production/i,
    ];

    page.on('console', (message) => {
      const type = message.type();
      const text = message.text();

      if (type === 'error') {
        consoleIssues.push({ type, text });
      } else if (type === 'warning') {
        const isAllowed = allowedWarningPatterns.some((pattern) =>
          pattern.test(text)
        );

        if (!isAllowed) {
          consoleIssues.push({ type, text });
        }
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('load');

    const startButton = page.getByRole('button', { name: 'Start Run' });
    await expect(startButton).toBeEnabled();

    await startButton.click();
    await expect(startButton).toBeDisabled();

    const unitDisplay = page.locator('[data-units]');
    await expect(unitDisplay).toHaveText('24');

    const gateOptions = page.locator('[data-gate-options] button');
    await expect(gateOptions).toHaveCount(2);
    await expect(gateOptions.first()).toBeVisible();

    const stageLabel = page.locator('[data-stage-label]');
    await expect(stageLabel).toHaveText(/forward run/i);

    await page.waitForTimeout(1000);

    expect(consoleIssues, 'Console warning/error detected during run start').toEqual([]);
    expect(pageErrors, 'Unhandled page errors detected during run start').toEqual([]);
  });
});
